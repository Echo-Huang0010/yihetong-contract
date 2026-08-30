import { createReadStream, createWriteStream, existsSync, readFileSync, statSync } from 'node:fs'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'
import { createGunzip, createGzip } from 'node:zlib'
import { spawn } from 'node:child_process'
import {
  atomicWrite,
  canonicalJson,
  ensureDir,
  YhtError,
} from './common.mjs'
import { secretId } from './secrets.mjs'
import { run } from './system.mjs'

export function mysqlDefaultsText(profile, password, username = profile.database.username) {
  const escape = (value) => String(value).replaceAll('\\', '\\\\').replaceAll('"', '\\"')
  return `[client]\nhost="${escape(profile.database.host)}"\nport=${profile.database.port}\nuser="${escape(username)}"\npassword="${escape(password)}"\ndefault-character-set=utf8mb4\nprotocol=tcp\n`
}

function requiredSecret(secrets, reference, role) {
  const id = secretId(reference)
  const value = secrets[id]
  if (typeof value !== 'string' || !value) {
    throw new YhtError(`Database ${role} credential is unavailable`, {
      code: 'DATABASE_CREDENTIAL_UNAVAILABLE',
      details: [{ role, secretId: id }],
    })
  }
  return value
}

export function resolveDatabaseCredentials(profile, secrets) {
  const runtime = {
    role: 'runtime',
    username: profile.database.username,
    password: requiredSecret(secrets, profile.database.passwordRef, 'runtime'),
  }
  const migration = {
    role: 'migration',
    username: profile.database.migration.username,
    password: requiredSecret(secrets, profile.database.migration.passwordRef, 'migration'),
  }
  const backupProfile = profile.database.backup
  const backup = backupProfile
    ? {
        role: 'backup',
        username: backupProfile.username,
        password: requiredSecret(secrets, backupProfile.passwordRef, 'backup'),
      }
    : { ...runtime, role: 'backup' }
  if (runtime.username === migration.username) {
    throw new YhtError('Runtime and migration database accounts must differ', {
      code: 'DATABASE_ACCOUNT_RESPONSIBILITY_COLLISION',
      details: [{ roles: ['runtime', 'migration'] }],
    })
  }
  if (backup.username === migration.username) {
    throw new YhtError('Backup and migration database accounts must differ', {
      code: 'DATABASE_ACCOUNT_RESPONSIBILITY_COLLISION',
      details: [{ roles: ['backup', 'migration'] }],
    })
  }
  return { runtime, migration, backup }
}

export function mysqlArgs(defaultsFile, databaseName, extra = []) {
  const args = [`--defaults-extra-file=${defaultsFile}`, '--batch', '--skip-column-names', '--default-character-set=utf8mb4']
  if (databaseName) args.push(databaseName)
  return [...args, ...extra]
}

export function mysqlQuery(defaultsFile, query, databaseName = null) {
  const result = run('mysql', mysqlArgs(defaultsFile, databaseName, ['-e', query]), { code: 'MYSQL_QUERY_FAILED' })
  return String(result.stdout || '').trim()
}

export function preflightDatabaseAccounts({ defaultsFiles, databaseName }) {
  const results = []
  for (const role of ['runtime', 'backup', 'migration']) {
    const value = mysqlQuery(defaultsFiles[role], 'SELECT 1', databaseName)
    if (value !== '1') {
      throw new YhtError(`Database ${role} account preflight returned an unexpected result`, {
        code: 'DATABASE_ACCOUNT_PREFLIGHT_FAILED',
        details: [{ role }],
      })
    }
    results.push({ role, connection: 'pass' })
  }
  return results
}

export function databaseTableCount(defaultsFile, databaseName) {
  const safeName = assertDatabaseName(databaseName)
  const value = mysqlQuery(
    defaultsFile,
    `SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='${safeName}'`,
  )
  return Number.parseInt(value, 10)
}

export function assertDatabaseName(value) {
  if (!/^[A-Za-z0-9_]{1,64}$/.test(value)) {
    throw new YhtError(`Invalid database name: ${value}`, { code: 'INVALID_DATABASE_NAME' })
  }
  return value
}

export function queryDeployRows(defaultsFile, databaseName) {
  const query = "SELECT config_key, config_value, `sensitive` FROM system_deploy_config WHERE is_deleted=0 ORDER BY id"
  const result = run('mysql', mysqlArgs(defaultsFile, databaseName, ['--raw', '-e', query]), {
    allowFailure: true,
    code: 'DEPLOY_DB_QUERY_FAILED',
  })
  if (result.status !== 0) return []
  return String(result.stdout || '')
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const [configKey, configValue = '', sensitive = '0'] = line.split('\t')
      return { configKey, configValue, sensitive: sensitive === '1' }
    })
}

export function applySql(defaultsFile, databaseName, sqlPath) {
  const input = readFileSync(sqlPath)
  run('mysql', mysqlArgs(defaultsFile, databaseName), {
    input,
    encoding: null,
    code: 'MYSQL_APPLY_FAILED',
  })
}

export function initializeFreshDatabase({ defaultsFile, databaseName, sqlFile, scriptPath }) {
  assertDatabaseName(databaseName)
  const result = run('bash', [scriptPath], {
    env: {
      ...process.env,
      MYSQL_DEFAULTS_FILE: defaultsFile,
      DB_NAME: databaseName,
      SQL_FILE: sqlFile,
    },
    code: 'DATABASE_INITIALIZE_FAILED',
  })
  return String(result.stdout || '').trim()
}

export function cleanupFreshDatabase(defaultsFile, databaseName) {
  const safeName = assertDatabaseName(databaseName)
  const tableText = mysqlQuery(
    defaultsFile,
    `SELECT table_name FROM information_schema.tables WHERE table_schema='${safeName}'`,
  )
  const tables = tableText.split(/\r?\n/).filter(Boolean)
  if (tables.some((table) => !/^[A-Za-z0-9_]+$/.test(table))) {
    throw new YhtError('Fresh database cleanup found an unsafe table name', { code: 'DATABASE_CLEANUP_BLOCKED' })
  }
  if (!tables.length) return { droppedTables: 0 }
  const statements = ['SET FOREIGN_KEY_CHECKS=0;', ...tables.map((table) => `DROP TABLE IF EXISTS \`${table}\`;`), 'SET FOREIGN_KEY_CHECKS=1;']
  run('mysql', mysqlArgs(defaultsFile, safeName), {
    input: Buffer.from(`${statements.join('\n')}\n`, 'utf8'),
    encoding: null,
    code: 'DATABASE_CLEANUP_FAILED',
  })
  return { droppedTables: tables.length }
}

function spawnForPipeline(command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: options.cwd,
    env: options.env || process.env,
    windowsHide: true,
    stdio: options.stdio || ['pipe', 'pipe', 'pipe'],
  })
  const stderr = []
  child.stderr?.on('data', (chunk) => stderr.push(chunk))
  const completion = new Promise((resolve, reject) => {
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new YhtError(`${command} exited with ${code}`, {
        code: options.code || 'DATABASE_STREAM_FAILED',
        details: [Buffer.concat(stderr).toString('utf8').slice(0, 4000)],
      }))
    })
  })
  return { child, completion }
}

async function sha256File(filePath) {
  const hash = createHash('sha256')
  await new Promise((resolve, reject) => {
    const stream = createReadStream(filePath)
    stream.on('data', (chunk) => hash.update(chunk))
    stream.on('error', reject)
    stream.on('end', resolve)
  })
  return hash.digest('hex')
}

async function decompressedBytes(filePath) {
  let bytes = 0
  const stream = createReadStream(filePath).pipe(createGunzip())
  for await (const chunk of stream) bytes += chunk.length
  return bytes
}

export function mysqlDumpArgs(defaultsFile, databaseName) {
  return [
    `--defaults-extra-file=${defaultsFile}`,
    '--no-tablespaces',
    '--skip-lock-tables',
    '--single-transaction',
    '--quick',
    '--triggers',
    '--set-gtid-purged=OFF',
    '--default-character-set=utf8mb4',
    databaseName,
  ]
}

export async function backupDatabase({ defaultsFile, databaseName, outputDir, reason = 'manual' }) {
  assertDatabaseName(databaseName)
  ensureDir(outputDir, 0o700)
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
  const dumpPath = path.join(outputDir, `${databaseName}-${stamp}.sql.gz`)
  const dumpArguments = mysqlDumpArgs(defaultsFile, databaseName)
  const dump = spawnForPipeline('mysqldump', dumpArguments, { code: 'DATABASE_BACKUP_FAILED' })
  await Promise.all([
    pipeline(dump.child.stdout, createGzip({ level: 9 }), createWriteStream(dumpPath, { mode: 0o600 })),
    dump.completion,
  ])
  const bytes = statSync(dumpPath).size
  if (!bytes) throw new YhtError('Database backup is empty', { code: 'DATABASE_BACKUP_EMPTY' })
  const contentBytes = await decompressedBytes(dumpPath)
  if (!contentBytes) throw new YhtError('Database backup has no SQL content', { code: 'DATABASE_BACKUP_CONTENT_EMPTY' })
  const digest = await sha256File(dumpPath)
  const manifest = {
    version: 2,
    database: databaseName,
    createdAt: new Date().toISOString(),
    reason,
    dumpFile: path.basename(dumpPath),
    bytes,
    contentBytes,
    sha256: digest,
    objectScope: 'tables,data,triggers',
    dumpOptions: dumpArguments.filter((item) => item.startsWith('--') && !item.startsWith('--defaults-extra-file=')),
  }
  const manifestPath = `${dumpPath}.manifest.json`
  atomicWrite(manifestPath, canonicalJson(manifest), 0o600)
  return { dumpPath, manifestPath, manifest }
}

export async function restoreDatabase({ defaultsFile, databaseName, manifestPath }) {
  assertDatabaseName(databaseName)
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  if (![1, 2].includes(manifest.version)
      || !Number.isInteger(manifest.bytes) || manifest.bytes < 1
      || !/^[a-f0-9]{64}$/.test(String(manifest.sha256 || ''))) {
    throw new YhtError('Backup manifest is invalid', { code: 'DATABASE_BACKUP_MANIFEST_INVALID' })
  }
  if (manifest.database !== databaseName) {
    throw new YhtError('Backup manifest database does not match profile database', { code: 'DATABASE_RESTORE_MISMATCH' })
  }
  const dumpPath = path.join(path.dirname(manifestPath), manifest.dumpFile)
  if (!existsSync(dumpPath)
      || statSync(dumpPath).size !== manifest.bytes
      || await sha256File(dumpPath) !== manifest.sha256) {
    throw new YhtError('Backup dump hash does not match its manifest', { code: 'DATABASE_BACKUP_HASH_MISMATCH' })
  }
  const contentBytes = await decompressedBytes(dumpPath)
  if (!contentBytes || (manifest.contentBytes !== undefined && contentBytes !== manifest.contentBytes)) {
    throw new YhtError('Backup SQL content does not match its manifest', { code: 'DATABASE_BACKUP_CONTENT_MISMATCH' })
  }
  const mysql = spawnForPipeline('mysql', mysqlArgs(defaultsFile, databaseName), {
    code: 'DATABASE_RESTORE_FAILED',
    stdio: ['pipe', 'pipe', 'pipe'],
  })
  await Promise.all([
    pipeline(createReadStream(dumpPath), createGunzip(), mysql.child.stdin),
    mysql.completion,
  ])
  return { restoredFrom: dumpPath, sha256: manifest.sha256 }
}
