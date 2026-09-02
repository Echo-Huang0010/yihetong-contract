import {
  chmodSync,
  closeSync,
  copyFileSync,
  cpSync,
  existsSync,
  lstatSync,
  mkdtempSync,
  mkdirSync,
  openSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  realpathSync,
  renameSync,
  rmSync,
  statSync,
  symlinkSync,
  unlinkSync,
} from 'node:fs'
import path from 'node:path'
import {
  atomicWrite,
  canonicalJson,
  ensureDir,
  readJson,
  sha256,
  sha256Object,
  YhtError,
} from './common.mjs'
import {
  applySql,
  backupDatabase,
  cleanupFreshDatabase,
  databaseTableCount,
  initializeFreshDatabase,
  mysqlDefaultsText,
  mysqlQuery,
  preflightDatabaseAccounts,
  queryDeployRows,
  resolveDatabaseCredentials,
  restoreDatabase,
} from './database.mjs'
import { verifyConfigurationWorkspace, verifyPackage } from './package.mjs'
import { commandExists, run, targetPath } from './system.mjs'

const API_SERVICE = 'yihetong-api.service'
const WEBSITE_SERVICE = 'yihetong-website.service'
const LICENSE_REFRESH_SERVICE = 'yihetong-license-refresh.service'
const LICENSE_REFRESH_TIMER = 'yihetong-license-refresh.timer'

function isCommunityProfile(profile) {
  return profile.installProfile === 'community'
}
const NGINX_CONFIG = 'yihetong-vnext.conf'
const runtimeDeploymentRootRules = {
  installRoot: /^\/opt\/yihetong(?:[._-][A-Za-z0-9][A-Za-z0-9._-]*)?$/,
  dataRoot: /^\/var\/lib\/yihetong(?:[._-][A-Za-z0-9][A-Za-z0-9._-]*)?$/,
  configRoot: /^\/etc\/yihetong(?:[._-][A-Za-z0-9][A-Za-z0-9._-]*)?$/,
  backupRoot: /^\/var\/backups\/yihetong(?:[._-][A-Za-z0-9][A-Za-z0-9._-]*)?$/,
}

function openDatabaseCredentialSession(profile, secrets, paths) {
  const credentials = resolveDatabaseCredentials(profile, secrets)
  const root = mkdtempSync(path.join(paths.configRoot, '.yhtctl-db-'))
  chmodSync(root, 0o700)
  const defaultsFiles = {}
  for (const role of ['runtime', 'backup', 'migration']) {
    const target = path.join(root, `${role}.cnf`)
    atomicWrite(target, mysqlDefaultsText(profile, credentials[role].password, credentials[role].username), 0o600)
    defaultsFiles[role] = target
  }
  atomicWrite(
    path.join(paths.configRoot, 'mysql-client.cnf'),
    mysqlDefaultsText(profile, credentials.runtime.password, credentials.runtime.username),
    0o600,
  )
  return {
    defaultsFiles,
    roles: Object.fromEntries(Object.entries(credentials).map(([role, value]) => [role, { username: value.username }])),
    close: () => rmSync(root, { recursive: true, force: true }),
  }
}

function normalizedDatabaseValue(value) {
  const text = String(value ?? '')
  if (text === 'true') return '1'
  if (text === 'false') return '0'
  return text
}

function readBackAppliedConfiguration({ defaultsFile, databaseName, authority }) {
  const deployRows = queryDeployRows(defaultsFile, databaseName)
  const deployValues = new Map(deployRows.map((row) => [row.configKey, row.configValue]))
  const expectedDeploy = Object.entries(authority.deployDatabase)
    .filter(([, item]) => item.authority === 'deploy_db' && !item.sensitive)
  const deployMismatches = expectedDeploy
    .filter(([key, item]) => normalizedDatabaseValue(deployValues.get(key)) !== normalizedDatabaseValue(item.value))
    .map(([key]) => key)

  const brandColumns = Object.keys(authority.brandDatabase).sort()
  if (brandColumns.some((column) => !/^[a-z0-9_]+$/.test(column))) {
    throw new YhtError('Brand configuration read-back contains an unsafe column name', {
      code: 'CONFIGURATION_READBACK_UNSAFE',
    })
  }
  let brandMismatches = []
  if (brandColumns.length) {
    const selected = brandColumns.map((column) => `\`${column}\``).join(',')
    const row = mysqlQuery(defaultsFile, `SELECT ${selected} FROM system_brand_config WHERE id=1 AND is_deleted=0`, databaseName)
    const actual = row.split('\t')
    brandMismatches = brandColumns.filter((column, index) => (
      normalizedDatabaseValue(actual[index]) !== normalizedDatabaseValue(authority.brandDatabase[column])
    ))
  }
  if (deployMismatches.length || brandMismatches.length) {
    throw new YhtError('Applied configuration did not match the resolved profile', {
      code: 'CONFIGURATION_READBACK_MISMATCH',
      details: [{ deployKeys: deployMismatches, brandColumns: brandMismatches }],
    })
  }
  return {
    status: 'pass',
    deployKeysChecked: expectedDeploy.length,
    brandColumnsChecked: brandColumns.length,
  }
}

function fileSha(filePath) {
  return sha256(readFileSync(filePath))
}

function pathExistsIncludingSymlink(filePath) {
  try {
    lstatSync(filePath)
    return true
  } catch {
    return false
  }
}

function assertRuntimeDeploymentRoots(paths, declaredPaths, rootPrefix) {
  for (const [id, root] of Object.entries({
    installRoot: paths.installRoot,
    dataRoot: paths.dataRoot,
    configRoot: paths.configRoot,
    backupRoot: paths.backupRoot,
  })) {
    const declared = declaredPaths[id]
    if (!runtimeDeploymentRootRules[id].test(declared) || targetPath(rootPrefix, declared) !== root) {
      throw new YhtError(`Deployment root declaration is unsafe: ${declared}`, {
        code: 'UNSAFE_DEPLOYMENT_ROOT_DECLARATION',
        details: [{ id, declared }],
      })
    }
    const parent = path.dirname(root)
    if (!existsSync(parent)) ensureDir(parent, 0o755)
    const parentStat = lstatSync(parent)
    if (parentStat.isSymbolicLink() || !parentStat.isDirectory() || realpathSync.native(parent) !== path.resolve(parent)) {
      throw new YhtError(`Deployment root parent is not a real directory: ${root}`, {
        code: 'UNSAFE_DEPLOYMENT_ROOT_PARENT',
        details: [{ id, root }],
      })
    }
    if (!pathExistsIncludingSymlink(root)) continue
    const stat = lstatSync(root)
    if (stat.isSymbolicLink() || !stat.isDirectory()) {
      throw new YhtError(`Deployment root is not an owned directory: ${root}`, {
        code: 'UNSAFE_DEPLOYMENT_ROOT_TYPE',
        details: [{ id, root, symbolicLink: stat.isSymbolicLink() }],
      })
    }
  }
}

function copyTree(source, target) {
  ensureDir(path.dirname(target))
  cpSync(source, target, {
    recursive: true,
    force: false,
    errorOnExist: true,
    preserveTimestamps: true,
  })
}

function composeRelease({ packageRoot, payloadDir, customerRoot, releaseDir, version, profileFingerprint, packageCheck, customerCheck }) {
  const markerPath = path.join(releaseDir, '.yht-release.json')
  const expected = {
    version,
    profileFingerprint,
    packageManifestFingerprint: packageCheck.manifestFingerprint,
    customerManifestFingerprint: customerCheck.manifestFingerprint,
  }
  if (existsSync(releaseDir)) {
    if (!existsSync(markerPath)) {
      throw new YhtError(`Existing release is incomplete: ${releaseDir}`, { code: 'RELEASE_INCOMPLETE' })
    }
    const marker = readJson(markerPath)
    if (sha256Object(marker) !== sha256Object(expected)) {
      throw new YhtError(`Existing release fingerprint does not match: ${releaseDir}`, {
        code: 'RELEASE_FINGERPRINT_MISMATCH',
      })
    }
    return { created: false, marker: expected }
  }
  copyTree(payloadDir, releaseDir)
  copyTree(path.join(packageRoot, 'tools'), path.join(releaseDir, 'tooling', 'tools'))
  copyTree(path.join(packageRoot, 'deploy'), path.join(releaseDir, 'tooling', 'deploy'))
  copyTree(path.join(packageRoot, 'docs'), path.join(releaseDir, 'tooling', 'docs'))
  copyTree(path.join(packageRoot, 'agent-cli'), path.join(releaseDir, 'tooling', 'agent-cli'))
  copyFileSync(path.join(packageRoot, 'yhtctl'), path.join(releaseDir, 'tooling', 'yhtctl'))
  chmodSync(path.join(releaseDir, 'tooling', 'yhtctl'), 0o755)
  copyFileSync(path.join(packageRoot, 'yihetong-cli'), path.join(releaseDir, 'tooling', 'yihetong-cli'))
  chmodSync(path.join(releaseDir, 'tooling', 'yihetong-cli'), 0o755)
  const integratedCommunityFrontends = customerCheck.packageKind === 'configuration-workspace'
  const frontends = integratedCommunityFrontends
    ? [['manage-admin', 'manage-html'], ['pc-admin', 'admin-html'], ['h5', 'h5-html']]
    : [['manage-admin', 'manage-admin'], ['pc-admin', 'pc-admin'], ['h5', 'h5']]
  for (const [frontend, sourceName] of frontends) {
    const source = integratedCommunityFrontends
      ? path.join(packageRoot, 'deploy', 'output', sourceName)
      : path.join(customerRoot, 'frontends', sourceName)
    if (!existsSync(source)) {
      throw new YhtError(`Customer frontend build is missing: ${frontend}`, {
        code: 'CUSTOMER_FRONTEND_MISSING',
      })
    }
    copyTree(source, path.join(releaseDir, frontend))
  }
  atomicWrite(markerPath, canonicalJson(expected), 0o640)
  return { created: true, marker: expected }
}

function snapshotOne(source, backupRoot, id) {
  if (!existsSync(source)) return { id, source, existed: false }
  const stat = lstatSync(source)
  const destination = path.join(backupRoot, id)
  if (stat.isSymbolicLink()) {
    return { id, source, existed: true, type: 'symlink', target: readlinkSync(source) }
  }
  if (stat.isDirectory()) {
    cpSync(source, destination, { recursive: true, force: false, errorOnExist: true, preserveTimestamps: true })
    return { id, source, existed: true, type: 'directory', backup: destination }
  }
  copyFileSync(source, destination, 0)
  return { id, source, existed: true, type: 'file', backup: destination, mode: stat.mode & 0o777 }
}

function restoreSnapshot(snapshot) {
  for (const item of [...snapshot.items].reverse()) {
    if (existsSync(item.source) || (() => { try { lstatSync(item.source); return true } catch { return false } })()) {
      rmSync(item.source, { recursive: true, force: true })
    }
    if (!item.existed) continue
    ensureDir(path.dirname(item.source))
    if (item.type === 'symlink') {
      symlinkSync(item.target, item.source)
    } else if (item.type === 'directory') {
      cpSync(item.backup, item.source, { recursive: true, force: false, errorOnExist: true, preserveTimestamps: true })
    } else {
      copyFileSync(item.backup, item.source)
      chmodSync(item.source, item.mode)
    }
  }
}

function cleanupSnapshotRelease(snapshot, fallbackRelease = null) {
  const release = snapshot.release || fallbackRelease
  if (!release) {
    return { attempted: false, status: 'not_required', releaseDir: null, runtimeCache: null }
  }
  let releaseRemoved = false
  if (!release.existedBefore && pathExistsIncludingSymlink(release.path)) {
    rmSync(release.path, { recursive: true, force: true })
    releaseRemoved = true
  }
  let runtimeCacheRemoved = false
  if (release.runtimeCache && !release.runtimeCache.existedBefore && pathExistsIncludingSymlink(release.runtimeCache.path)) {
    rmSync(release.runtimeCache.path, { recursive: true, force: true })
    runtimeCacheRemoved = true
  }
  return {
    attempted: releaseRemoved || runtimeCacheRemoved,
    status: releaseRemoved || runtimeCacheRemoved ? 'pass' : 'not_required',
    releaseDir: release.path,
    runtimeCache: release.runtimeCache?.path || null,
  }
}

function createInstallUser() {
  if (run('id', ['-u', 'yihetong'], { allowFailure: true }).status === 0) return
  run('useradd', ['--system', '--home', '/var/lib/yihetong', '--shell', '/usr/sbin/nologin', 'yihetong'], {
    code: 'INSTALL_USER_CREATE_FAILED',
  })
}

function installFileOwned(source, target, { mode = 0o640, allowUpdate = false } = {}) {
  ensureDir(path.dirname(target))
  const existed = existsSync(target)
  if (existed) {
    if (fileSha(source) === fileSha(target)) return 'unchanged'
    if (!allowUpdate) {
      throw new YhtError(`Refusing to overwrite an unconfirmed file: ${target}`, {
        code: 'UNCONFIRMED_CONFIG_OVERWRITE',
      })
    }
  }
  const temp = `${target}.tmp-${process.pid}`
  copyFileSync(source, temp)
  chmodSync(temp, mode)
  renameSync(temp, target)
  return existed ? 'updated' : 'created'
}

function statePaths(profile, rootPrefix) {
  const installRoot = targetPath(rootPrefix, profile.deployment.paths.installRoot)
  const dataRoot = targetPath(rootPrefix, profile.deployment.paths.dataRoot)
  const configRoot = targetPath(rootPrefix, profile.deployment.paths.configRoot)
  const backupRoot = targetPath(rootPrefix, profile.deployment.paths.backupRoot)
  return {
    installRoot,
    dataRoot,
    configRoot,
    backupRoot,
    stateDir: path.join(dataRoot, 'state'),
    stateFile: path.join(dataRoot, 'state', 'install-state.json'),
    receiptDir: path.join(dataRoot, 'receipts'),
    lockFile: path.join(dataRoot, 'state', 'install.lock'),
  }
}

function acquireLock(lockFile) {
  ensureDir(path.dirname(lockFile), 0o750)
  try {
    const descriptor = openSync(lockFile, 'wx', 0o600)
    atomicWrite(`${lockFile}.owner`, canonicalJson({ pid: process.pid, startedAt: new Date().toISOString() }), 0o600)
    return () => {
      closeSync(descriptor)
      rmSync(lockFile, { force: true })
      rmSync(`${lockFile}.owner`, { force: true })
    }
  } catch (error) {
    throw new YhtError(`Another yhtctl operation holds ${lockFile}`, { code: 'INSTALL_LOCKED' })
  }
}

function copyDirectoryControlled(source, target, { mode, allowUpdate }) {
  ensureDir(target)
  const stack = [{ source, target }]
  while (stack.length) {
    const current = stack.pop()
    for (const name of readdirSync(current.source)) {
      const sourcePath = path.join(current.source, name)
      const targetPath = path.join(current.target, name)
      const stat = lstatSync(sourcePath)
      if (stat.isDirectory()) {
        ensureDir(targetPath)
        stack.push({ source: sourcePath, target: targetPath })
      } else if (stat.isFile()) {
        installFileOwned(sourcePath, targetPath, { mode, allowUpdate })
      }
    }
  }
}

function copyCustomerMaterial(profileDir, configRoot, allowUpdate) {
  const copied = []
  for (const [name, mode] of [['assets', 0o644], ['certificates', 0o640]]) {
    const source = path.join(profileDir, name)
    if (!existsSync(source)) continue
    const target = path.join(configRoot, name)
    copyDirectoryControlled(source, target, { mode, allowUpdate })
    copied.push(name)
    if (process.platform === 'linux') {
      if (name === 'assets') {
        run('find', [target, '-type', 'd', '-exec', 'chmod', '0755', '{}', '+'], { code: 'ASSET_DIRECTORY_PERMISSION_FAILED' })
        run('chown', ['-R', 'root:root', target], { code: 'ASSET_OWNERSHIP_FAILED' })
      } else {
        run('find', [target, '-type', 'd', '-exec', 'chmod', '0750', '{}', '+'], { code: 'CERTIFICATE_DIRECTORY_PERMISSION_FAILED' })
        run('chown', ['-R', 'root:yihetong', target], { code: 'CERTIFICATE_OWNERSHIP_FAILED' })
      }
    }
  }
  return copied
}

function applyRuntimeConfigOwnership(paths) {
  if (process.platform !== 'linux') return
  const serviceReadable = [
    path.join(paths.configRoot, 'runtime.env'),
    path.join(paths.configRoot, 'application.yml'),
    path.join(paths.configRoot, 'customer-profile.yaml'),
    path.join(paths.configRoot, 'secrets.refs.yaml'),
  ].filter((filePath) => existsSync(filePath))
  if (serviceReadable.length > 0) {
    run('chown', ['root:yihetong', ...serviceReadable], { code: 'CONFIG_OWNERSHIP_FAILED' })
  }
}

function applyRestoredConfigOwnership(paths) {
  if (process.platform !== 'linux') return
  applyRuntimeConfigOwnership(paths)
  const assets = path.join(paths.configRoot, 'assets')
  if (existsSync(assets)) {
    run('find', [assets, '-type', 'd', '-exec', 'chmod', '0755', '{}', '+'], { code: 'ASSET_DIRECTORY_PERMISSION_FAILED' })
    run('chown', ['-R', 'root:root', assets], { code: 'ASSET_OWNERSHIP_FAILED' })
  }
  const certificates = path.join(paths.configRoot, 'certificates')
  if (existsSync(certificates)) {
    run('find', [certificates, '-type', 'd', '-exec', 'chmod', '0750', '{}', '+'], { code: 'CERTIFICATE_DIRECTORY_PERMISSION_FAILED' })
    run('chown', ['-R', 'root:yihetong', certificates], { code: 'CERTIFICATE_OWNERSHIP_FAILED' })
  }
  const commercial = path.join(paths.configRoot, 'commercial')
  if (existsSync(commercial)) {
    run('find', [commercial, '-type', 'd', '-exec', 'chmod', '0750', '{}', '+'], { code: 'COMMERCIAL_DIRECTORY_PERMISSION_FAILED' })
    run('chown', ['-R', 'root:yihetong', commercial], { code: 'COMMERCIAL_FILE_OWNERSHIP_FAILED' })
    const privateKey = path.join(commercial, 'instance-private.pem')
    if (existsSync(privateKey)) {
      chmodSync(privateKey, 0o600)
      run('chown', ['root:root', privateKey], { code: 'COMMERCIAL_PRIVATE_KEY_OWNERSHIP_FAILED' })
    }
  }
}

function installRuntimeFiles(profile, paths, renderDir, allowUpdate) {
  const operations = []
  operations.push(installFileOwned(path.join(renderDir, 'runtime.env'), path.join(paths.configRoot, 'runtime.env'), { mode: 0o640, allowUpdate }))
  operations.push(installFileOwned(path.join(renderDir, 'application.yml'), path.join(paths.configRoot, 'application.yml'), { mode: 0o640, allowUpdate }))
  operations.push(installFileOwned(path.join(renderDir, 'customer-profile.yaml'), path.join(paths.configRoot, 'customer-profile.yaml'), { mode: 0o640, allowUpdate }))
  operations.push(installFileOwned(path.join(renderDir, 'secrets.refs.yaml'), path.join(paths.configRoot, 'secrets.refs.yaml'), { mode: 0o640, allowUpdate }))
  operations.push(installFileOwned(path.join(renderDir, 'nginx', 'yihetong.conf'), `/etc/nginx/conf.d/${NGINX_CONFIG}`, { mode: 0o640, allowUpdate }))
  operations.push(installFileOwned(path.join(renderDir, 'systemd', API_SERVICE), `/etc/systemd/system/${API_SERVICE}`, { mode: 0o644, allowUpdate }))
  operations.push(installFileOwned(path.join(renderDir, 'systemd', WEBSITE_SERVICE), `/etc/systemd/system/${WEBSITE_SERVICE}`, { mode: 0o644, allowUpdate }))
  operations.push(installFileOwned(path.join(renderDir, 'systemd', LICENSE_REFRESH_SERVICE), `/etc/systemd/system/${LICENSE_REFRESH_SERVICE}`, { mode: 0o644, allowUpdate }))
  operations.push(installFileOwned(path.join(renderDir, 'systemd', LICENSE_REFRESH_TIMER), `/etc/systemd/system/${LICENSE_REFRESH_TIMER}`, { mode: 0o644, allowUpdate }))
  operations.push(...installRestrictedFiles(paths, renderDir, allowUpdate))
  applyRuntimeConfigOwnership(paths)
  return operations
}

function installRestrictedFiles(paths, renderDir, allowUpdate, applyOwnership = true) {
  const operations = []
  const certificateSource = path.join(renderDir, 'certificates')
  if (existsSync(certificateSource)) {
    const certificateTarget = path.join(paths.configRoot, 'certificates')
    copyDirectoryControlled(certificateSource, certificateTarget, { mode: 0o640, allowUpdate })
    operations.push('certificate-files-converged')
    if (process.platform === 'linux' && applyOwnership) {
      run('find', [certificateTarget, '-type', 'd', '-exec', 'chmod', '0750', '{}', '+'], { code: 'RESTRICTED_DIRECTORY_PERMISSION_FAILED' })
      run('chown', ['-R', 'root:yihetong', certificateTarget], { code: 'RESTRICTED_FILE_OWNERSHIP_FAILED' })
    }
  }
  const commercialSource = path.join(renderDir, 'commercial')
  if (existsSync(commercialSource)) {
    const commercialTarget = path.join(paths.configRoot, 'commercial')
    ensureDir(commercialTarget, 0o750)
    for (const name of readdirSync(commercialSource)) {
      const source = path.join(commercialSource, name)
      if (!lstatSync(source).isFile()) continue
      const target = path.join(commercialTarget, name)
      if (name === 'lease.json' && existsSync(target) && !allowUpdate) {
        operations.push('dynamic-commercial-lease-preserved')
        continue
      }
      const mode = name === 'instance-private.pem' ? 0o600 : 0o640
      operations.push(installFileOwned(source, target, { mode, allowUpdate }))
    }
    operations.push('commercial-authorization-files-converged')
    if (process.platform === 'linux' && applyOwnership) {
      run('find', [commercialTarget, '-type', 'd', '-exec', 'chmod', '0750', '{}', '+'], { code: 'COMMERCIAL_DIRECTORY_PERMISSION_FAILED' })
      run('chown', ['-R', 'root:yihetong', commercialTarget], { code: 'COMMERCIAL_FILE_OWNERSHIP_FAILED' })
      const privateKey = path.join(commercialTarget, 'instance-private.pem')
      chmodSync(privateKey, 0o600)
      run('chown', ['root:root', privateKey], { code: 'COMMERCIAL_PRIVATE_KEY_OWNERSHIP_FAILED' })
    }
  }
  return operations
}

function activateRelease(paths, releaseDir) {
  const current = path.join(paths.installRoot, 'current')
  if (existsSync(current) && !lstatSync(current).isSymbolicLink()) {
    throw new YhtError(`Refusing to replace non-symlink current path: ${current}`, { code: 'CURRENT_PATH_UNOWNED' })
  }
  const next = `${current}.next-${process.pid}`
  rmSync(next, { recursive: true, force: true })
  symlinkSync(releaseDir, next, 'dir')
  renameSync(next, current)
}

function configureWebsiteCache(paths, releaseDir, runtimeCacheDir) {
  const releaseCache = path.join(releaseDir, 'website', '.next', 'cache')
  ensureDir(runtimeCacheDir, 0o750)
  if (pathExistsIncludingSymlink(releaseCache)) {
    const stat = lstatSync(releaseCache)
    if (stat.isSymbolicLink()) {
      const target = path.resolve(path.dirname(releaseCache), readlinkSync(releaseCache))
      if (target !== runtimeCacheDir) {
        throw new YhtError(`Website cache symlink is not installer-owned: ${releaseCache}`, {
          code: 'WEBSITE_CACHE_PATH_UNOWNED',
        })
      }
      return { releaseCache, runtimeCacheDir, operation: 'unchanged' }
    }
    if (!stat.isDirectory()) {
      throw new YhtError(`Website cache path is not a directory: ${releaseCache}`, {
        code: 'WEBSITE_CACHE_PATH_UNOWNED',
      })
    }
    rmSync(releaseCache, { recursive: true, force: true })
  }
  symlinkSync(runtimeCacheDir, releaseCache, 'dir')
  return { releaseCache, runtimeCacheDir, operation: 'linked' }
}

function serviceStatus(name) {
  const enabled = run('systemctl', ['is-enabled', name], { allowFailure: true })
  const active = run('systemctl', ['is-active', name], { allowFailure: true })
  return {
    name,
    enabled: enabled.status === 0,
    active: active.status === 0,
    enabledState: String(enabled.stdout || enabled.stderr || '').trim(),
    activeState: String(active.stdout || active.stderr || '').trim(),
  }
}

function waitMilliseconds(milliseconds) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds)
}

function parseJson(text) {
  try {
    return JSON.parse(String(text || ''))
  } catch {
    return null
  }
}

function brandResponseMatchesProfile(profile, text) {
  const payload = parseJson(text)
  const data = payload?.data && typeof payload.data === 'object' ? payload.data : null
  return payload?.flag === true
    && data?.projectName === profile.brand.projectName
    && data?.companyName === profile.brand.companyName
}

function htmlLooksRendered(text) {
  return /<!doctype html|<html[\s>]/i.test(String(text || ''))
}

function websiteResponseMatchesProfile(profile, text) {
  const body = String(text || '')
  return htmlLooksRendered(body) && body.includes(profile.brand.projectName)
}

function nginxEndpointProbes(profile) {
  const secure = profile.tls.mode === 'existing-files'
  const origin = secure ? 'https://127.0.0.1' : 'http://127.0.0.1'
  const definitions = [
    ['api', 'apiBaseUrl', '/api/v1/brand-config/active'],
    ['manage', 'manageBaseUrl', '/'],
    ['user', 'userBaseUrl', '/'],
    ['h5', 'h5BaseUrl', '/'],
    ['website', 'websiteBaseUrl', '/'],
  ]
  return Object.fromEntries(definitions.map(([id, endpointKey, requestPath]) => {
    const host = new URL(profile.deployment.endpoints[endpointKey]).hostname
    const args = [
      '--silent',
      '--show-error',
      '--fail',
      '--max-time',
      '5',
      '-H',
      `Host: ${host}`,
    ]
    if (secure) args.push('--insecure')
    args.push(`${origin}${requestPath}`)
    return [id, run('curl', args, { allowFailure: true })]
  }))
}

function summarizeNginxProbes(profile, probes) {
  const statuses = Object.fromEntries(Object.entries(probes).map(([id, result]) => [id, result.status]))
  const semantics = {
    apiBrand: brandResponseMatchesProfile(profile, probes.api?.stdout),
    manageHtml: htmlLooksRendered(probes.manage?.stdout),
    userHtml: htmlLooksRendered(probes.user?.stdout),
    h5Html: htmlLooksRendered(probes.h5?.stdout),
    websiteBrand: websiteResponseMatchesProfile(profile, probes.website?.stdout),
  }
  return { statuses, semantics }
}

function curlJsonBoundary(url, { data = null } = {}) {
  const marker = '__YHT_HTTP_STATUS__'
  const args = ['--silent', '--show-error', '--max-time', '5', '--write-out', `\n${marker}%{http_code}`]
  if (data !== null) args.push('-H', 'Content-Type: application/json', '-d', data)
  args.push(url)
  const result = run('curl', args, { allowFailure: true })
  const output = String(result.stdout || '')
  const markerIndex = output.lastIndexOf(`\n${marker}`)
  const body = markerIndex >= 0 ? output.slice(0, markerIndex) : output
  const httpCode = markerIndex >= 0 ? output.slice(markerIndex + marker.length + 1).trim() : ''
  return { commandStatus: result.status, httpCode, payload: parseJson(body) }
}

function contractBoundaryIsSafe(probe) {
  if (['401', '403'].includes(probe.httpCode)) return true
  return probe.httpCode === '200'
    && probe.payload?.flag === false
    && probe.payload?.data == null
    && /登录|unauth|login/i.test(String(probe.payload?.message || ''))
}

function loginBoundaryIsSafe(probe) {
  if (['400', '401', '422'].includes(probe.httpCode)) return true
  const serialized = JSON.stringify(probe.payload || {})
  return probe.httpCode === '200'
    && probe.payload?.flag === false
    && probe.payload?.data == null
    && !/token/i.test(serialized)
    && String(probe.payload?.message || '').length > 0
}

function activateServices(profile) {
  run('systemctl', ['daemon-reload'], { code: 'SYSTEMD_DAEMON_RELOAD_FAILED' })
  run('systemctl', ['enable', '--now', API_SERVICE], { code: 'API_SERVICE_START_FAILED' })
  run('systemctl', ['enable', '--now', WEBSITE_SERVICE], { code: 'WEBSITE_SERVICE_START_FAILED' })
  if (isCommunityProfile(profile)) {
    run('systemctl', ['disable', '--now', LICENSE_REFRESH_TIMER], { allowFailure: true })
  } else {
    run('systemctl', ['enable', '--now', LICENSE_REFRESH_TIMER], { code: 'LICENSE_REFRESH_TIMER_START_FAILED' })
  }
  run('nginx', ['-t'], { code: 'NGINX_CONFIG_INVALID' })
  run('systemctl', ['reload', 'nginx'], { code: 'NGINX_RELOAD_FAILED' })
  const attempts = Number.parseInt(process.env.YHTCTL_HEALTH_ATTEMPTS || '60', 10)
  if (!Number.isInteger(attempts) || attempts < 1 || attempts > 300) {
    throw new YhtError('YHTCTL_HEALTH_ATTEMPTS must be between 1 and 300', { code: 'HEALTH_ATTEMPTS_INVALID' })
  }
  let last = null
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const api = serviceStatus(API_SERVICE)
    const website = serviceStatus(WEBSITE_SERVICE)
    const licenseTimer = serviceStatus(LICENSE_REFRESH_TIMER)
    const brand = run('curl', [
      '--silent',
      '--show-error',
      '--fail',
      '--max-time',
      '3',
      `http://127.0.0.1:${profile.deployment.ports.api}/api/v1/brand-config/active`,
    ], { allowFailure: true })
    const websiteHealth = run('curl', [
      '--silent',
      '--show-error',
      '--fail',
      '--max-time',
      '3',
      `http://127.0.0.1:${profile.deployment.ports.website}/`,
    ], { allowFailure: true })
    const nginx = summarizeNginxProbes(profile, nginxEndpointProbes(profile))
    const semanticChecks = {
      brandDirect: brandResponseMatchesProfile(profile, brand.stdout),
      websiteDirect: websiteResponseMatchesProfile(profile, websiteHealth.stdout),
      ...nginx.semantics,
    }
    last = {
      attempt,
      api,
      website,
      licenseTimer,
      brandHttp: brand.status,
      websiteHttp: websiteHealth.status,
      nginxEndpoints: nginx.statuses,
      semanticChecks,
    }
    const licenseTimerReady = isCommunityProfile(profile)
      ? !licenseTimer.active && !licenseTimer.enabled
      : licenseTimer.active && licenseTimer.enabled
    if (api.active && api.enabled && website.active && website.enabled
        && licenseTimerReady
        && brand.status === 0 && websiteHealth.status === 0
        && Object.values(nginx.statuses).every((status) => status === 0)
        && Object.values(semanticChecks).every(Boolean)) {
      return last
    }
    waitMilliseconds(1000)
  }
  throw new YhtError('Installed services did not become healthy', {
    code: 'INSTALL_HEALTH_TIMEOUT',
    details: [last],
  })
}

function stopServicesBestEffort() {
  run('systemctl', ['stop', API_SERVICE], { allowFailure: true })
  run('systemctl', ['stop', WEBSITE_SERVICE], { allowFailure: true })
  run('systemctl', ['stop', LICENSE_REFRESH_TIMER], { allowFailure: true })
  run('systemctl', ['daemon-reload'], { allowFailure: true })
  run('nginx', ['-t'], { allowFailure: true })
  run('systemctl', ['reload', 'nginx'], { allowFailure: true })
}

function snapshotServiceState(skipRuntime) {
  if (skipRuntime) return null
  return {
    api: serviceStatus(API_SERVICE),
    website: serviceStatus(WEBSITE_SERVICE),
    licenseTimer: serviceStatus(LICENSE_REFRESH_TIMER),
  }
}

function expectedServiceState(snapshot, key, serviceName) {
  if (snapshot.runtimeState?.[key]) return snapshot.runtimeState[key]
  const existed = snapshot.items.some((item) => item.id === serviceName && item.existed)
  return { enabled: existed, active: existed }
}

function reconcileRuntimeAfterRestore(profile, paths, snapshot) {
  applyRestoredConfigOwnership(paths)
  const expected = {
    api: expectedServiceState(snapshot, 'api', API_SERVICE),
    website: expectedServiceState(snapshot, 'website', WEBSITE_SERVICE),
    licenseTimer: expectedServiceState(snapshot, 'licenseTimer', LICENSE_REFRESH_TIMER),
  }
  if (expected.api.enabled && expected.api.active && expected.website.enabled && expected.website.active
      && expected.licenseTimer.enabled && expected.licenseTimer.active) {
    const health = activateServices(profile)
    return {
      expected,
      actual: { api: serviceStatus(API_SERVICE), website: serviceStatus(WEBSITE_SERVICE), licenseTimer: serviceStatus(LICENSE_REFRESH_TIMER) },
      health,
    }
  }

  run('systemctl', ['daemon-reload'], { code: 'ROLLBACK_SYSTEMD_RELOAD_FAILED' })
  for (const [key, serviceName] of [['api', API_SERVICE], ['website', WEBSITE_SERVICE], ['licenseTimer', LICENSE_REFRESH_TIMER]]) {
    run('systemctl', [expected[key].active ? 'start' : 'stop', serviceName], { allowFailure: !expected[key].active })
    run('systemctl', [expected[key].enabled ? 'enable' : 'disable', serviceName], { allowFailure: !expected[key].enabled })
    run('systemctl', ['reset-failed', serviceName], { allowFailure: true })
  }
  run('nginx', ['-t'], { code: 'ROLLBACK_NGINX_CONFIG_INVALID' })
  run('systemctl', ['reload', 'nginx'], { code: 'ROLLBACK_NGINX_RELOAD_FAILED' })
  const actual = { api: serviceStatus(API_SERVICE), website: serviceStatus(WEBSITE_SERVICE), licenseTimer: serviceStatus(LICENSE_REFRESH_TIMER) }
  for (const key of ['api', 'website', 'licenseTimer']) {
    if (actual[key].active !== expected[key].active || actual[key].enabled !== expected[key].enabled) {
      throw new YhtError(`Rollback did not restore ${key} service state`, {
        code: 'ROLLBACK_SERVICE_STATE_MISMATCH',
        details: [{ key, expected: expected[key], actual: actual[key] }],
      })
    }
  }
  return { expected, actual }
}

function writeReceipt(paths, kind, payload) {
  ensureDir(paths.receiptDir, 0o750)
  const stamp = new Date().toISOString().replace(/[:.]/g, '')
  const receiptPath = path.join(paths.receiptDir, `${stamp}-${kind}.json`)
  const receipt = { apiVersion: 'yht.io/v1', kind, recordedAt: new Date().toISOString(), ...payload }
  receipt.receiptDigest = sha256Object(receipt)
  atomicWrite(receiptPath, canonicalJson(receipt), 0o640)
  return { receiptPath, receipt }
}

function persistRollbackSnapshot(snapshot) {
  const { snapshotDigest: _priorDigest, ...unsigned } = snapshot
  snapshot.snapshotDigest = sha256Object(unsigned)
  atomicWrite(path.join(snapshot.rollbackRoot, 'ROLLBACK.json'), canonicalJson(snapshot), 0o600)
}

function pathIsWithin(parent, candidate) {
  const resolvedParent = path.resolve(parent)
  const resolvedCandidate = path.resolve(candidate)
  return resolvedCandidate !== resolvedParent && resolvedCandidate.startsWith(`${resolvedParent}${path.sep}`)
}

function expectedSnapshotSources(paths) {
  return new Map([
    ['current', path.join(paths.installRoot, 'current')],
    ['installation-state', paths.stateFile],
    ['runtime.env', path.join(paths.configRoot, 'runtime.env')],
    ['application.yml', path.join(paths.configRoot, 'application.yml')],
    ['customer-profile.yaml', path.join(paths.configRoot, 'customer-profile.yaml')],
    ['secrets.refs.yaml', path.join(paths.configRoot, 'secrets.refs.yaml')],
    ['mysql-client.cnf', path.join(paths.configRoot, 'mysql-client.cnf')],
    ['customer-assets', path.join(paths.configRoot, 'assets')],
    ['customer-certificates', path.join(paths.configRoot, 'certificates')],
    ['commercial-authorization', path.join(paths.configRoot, 'commercial')],
    ['nginx.conf', `/etc/nginx/conf.d/${NGINX_CONFIG}`],
    [API_SERVICE, `/etc/systemd/system/${API_SERVICE}`],
    [WEBSITE_SERVICE, `/etc/systemd/system/${WEBSITE_SERVICE}`],
    [LICENSE_REFRESH_SERVICE, `/etc/systemd/system/${LICENSE_REFRESH_SERVICE}`],
    [LICENSE_REFRESH_TIMER, `/etc/systemd/system/${LICENSE_REFRESH_TIMER}`],
  ])
}

function loadValidatedRollbackSnapshot({ receiptPath, profileFingerprint, paths }) {
  if (!receiptPath || !existsSync(receiptPath)) {
    throw new YhtError('Rollback receipt is missing', { code: 'ROLLBACK_RECEIPT_MISSING' })
  }
  const allowedReceiptRoot = path.join(paths.backupRoot, 'rollback')
  if (!existsSync(allowedReceiptRoot)) {
    throw new YhtError('Rollback receipt root is missing', { code: 'ROLLBACK_RECEIPT_ROOT_MISSING' })
  }
  const realReceipt = realpathSync.native(receiptPath)
  const realAllowedRoot = realpathSync.native(allowedReceiptRoot)
  if (!pathIsWithin(realAllowedRoot, realReceipt) || path.basename(realReceipt) !== 'ROLLBACK.json') {
    throw new YhtError('Rollback receipt is outside the installer-owned backup root', {
      code: 'ROLLBACK_RECEIPT_OUTSIDE_BACKUP_ROOT',
    })
  }
  const receiptStat = statSync(realReceipt)
  if (!receiptStat.isFile() || (receiptStat.mode & 0o777) !== 0o600 || (process.platform === 'linux' && receiptStat.uid !== 0)) {
    throw new YhtError('Rollback receipt ownership or mode is unsafe', { code: 'ROLLBACK_RECEIPT_PERMISSION_INVALID' })
  }

  const snapshot = readJson(realReceipt)
  const { snapshotDigest, ...unsigned } = snapshot
  const errors = []
  if (snapshot.version !== 4 || snapshot.kind !== 'RollbackSnapshot' || snapshot.generatedBy !== 'yhtctl') {
    errors.push('rollback snapshot format is not supported')
  }
  if (!snapshotDigest || snapshotDigest !== sha256Object(unsigned)) errors.push('rollback snapshot digest mismatch')
  if (!snapshot.runtimeManaged) errors.push('rollback snapshot is not a managed runtime snapshot')
  if (path.resolve(snapshot.rollbackRoot || '') !== path.dirname(realReceipt)) errors.push('rollbackRoot does not match receipt directory')
  if (!pathIsWithin(realAllowedRoot, snapshot.rollbackRoot || '')) errors.push('rollbackRoot escapes backup root')

  const currentState = existsSync(paths.stateFile) ? readJson(paths.stateFile) : null
  if (!currentState) errors.push('current installer state is missing')
  if (currentState) {
    if (path.resolve(currentState.rollbackReceipt || '') !== realReceipt) errors.push('receipt is not current state rollback point')
    if (snapshot.resultStateFingerprint !== sha256Object(currentState)) errors.push('current installer state fingerprint mismatch')
    if (snapshot.targetProfileFingerprint !== currentState.profileFingerprint) errors.push('target profile lineage mismatch')
    if (snapshot.versionName !== currentState.version || snapshot.sourceVersion !== currentState.sourceVersion) errors.push('source/version lineage mismatch')
    if (snapshot.packageManifestFingerprint !== currentState.packageManifestFingerprint) errors.push('installer manifest lineage mismatch')
    if (snapshot.customerManifestFingerprint !== currentState.customerManifestFingerprint) errors.push('customer manifest lineage mismatch')
    if (path.resolve(snapshot.release?.path || '') !== path.resolve(currentState.releaseDir || '')) errors.push('release lineage mismatch')
    const currentLink = path.join(paths.installRoot, 'current')
    if (!pathExistsIncludingSymlink(currentLink) || !lstatSync(currentLink).isSymbolicLink()
        || path.resolve(path.dirname(currentLink), readlinkSync(currentLink)) !== path.resolve(currentState.releaseDir || '')) {
      errors.push('current release symlink lineage mismatch')
    }
  }
  if (snapshot.rollbackProfileFingerprint && snapshot.rollbackProfileFingerprint !== profileFingerprint) {
    errors.push('rollback target profile fingerprint mismatch')
  }

  const expected = expectedSnapshotSources(paths)
  const items = Array.isArray(snapshot.items) ? snapshot.items : []
  const seen = new Set()
  for (const item of items) {
    if (!item || !expected.has(item.id) || seen.has(item.id)) {
      errors.push(`unexpected or duplicate snapshot item: ${item?.id || 'missing'}`)
      continue
    }
    seen.add(item.id)
    if (path.resolve(item.source || '') !== path.resolve(expected.get(item.id))) {
      errors.push(`snapshot source mismatch: ${item.id}`)
    }
    if (item.existed && item.type !== 'symlink') {
      const expectedBackup = path.join(snapshot.rollbackRoot, item.id)
      if (path.resolve(item.backup || '') !== path.resolve(expectedBackup) || !pathIsWithin(snapshot.rollbackRoot, item.backup || '')) {
        errors.push(`snapshot backup mismatch: ${item.id}`)
      }
    }
  }
  for (const id of expected.keys()) if (!seen.has(id)) errors.push(`snapshot item missing: ${id}`)

  const releaseRoot = path.join(paths.installRoot, 'releases')
  if (!pathIsWithin(releaseRoot, snapshot.release?.path || '')) errors.push('snapshot release path is unsafe')
  if (!pathIsWithin(path.join(paths.dataRoot, 'website-cache'), snapshot.release?.runtimeCache?.path || '')) {
    errors.push('snapshot runtime cache path is unsafe')
  }
  if (snapshot.databaseRollbackPoint?.kind === 'restore-manifest') {
    const manifestPath = snapshot.databaseRollbackPoint.manifestPath || ''
    if (!pathIsWithin(path.join(paths.backupRoot, 'database'), manifestPath) || !existsSync(manifestPath)) {
      errors.push('database rollback manifest is outside the backup root or missing')
    }
  }
  if (snapshot.priorStateFingerprint) {
    const priorItem = items.find((item) => item.id === 'installation-state')
    if (!priorItem?.existed || !priorItem.backup || sha256Object(readJson(priorItem.backup)) !== snapshot.priorStateFingerprint) {
      errors.push('prior installer state fingerprint mismatch')
    }
  }
  if (errors.length) {
    throw new YhtError('Rollback receipt validation failed', {
      code: 'ROLLBACK_RECEIPT_INVALID',
      details: errors,
    })
  }
  return { snapshot, receiptPath: realReceipt, currentState }
}

export async function install({
  profile,
  profilePath,
  profileFingerprint,
  secrets,
  authority,
  renderDir,
  packageRoot,
  rootPrefix = '/',
  allowUpdate = false,
  skipRuntime = false,
}) {
  if (process.platform !== 'linux') throw new YhtError('Install requires Linux', { code: 'LINUX_REQUIRED' })
  if (typeof process.getuid === 'function' && process.getuid() !== 0) throw new YhtError('Install requires root', { code: 'ROOT_REQUIRED' })
  const packageCheck = verifyPackage(packageRoot)
  const customerRoot = path.dirname(profilePath)
  const metadata = readJson(path.join(packageRoot, 'VERSION.json'))
  const integratedCommunity = profile.installProfile === 'community'
    && metadata.edition === 'community'
    && metadata.packageKind === 'community-installer'
  const customerCheck = integratedCommunity
    ? verifyConfigurationWorkspace(customerRoot)
    : verifyPackage(customerRoot)
  const paths = statePaths(profile, rootPrefix)
  assertRuntimeDeploymentRoots(paths, profile.deployment.paths, rootPrefix)
  const releaseIdentity = `${metadata.version}-${profileFingerprint.slice(0, 12)}-${customerCheck.manifestFingerprint.slice(0, 12)}`
  const releaseDir = path.join(paths.installRoot, 'releases', releaseIdentity)
  const releaseExistedBefore = existsSync(releaseDir)
  const runtimeCacheDir = path.join(paths.dataRoot, 'website-cache', releaseIdentity)
  const runtimeCacheExistedBefore = existsSync(runtimeCacheDir)
  const payloadDir = path.join(packageRoot, 'payload')
  if (!existsSync(payloadDir)) throw new YhtError('Installer payload is missing', { code: 'PACKAGE_PAYLOAD_MISSING' })
  ensureDir(paths.installRoot)
  ensureDir(paths.dataRoot)
  ensureDir(paths.configRoot)
  ensureDir(paths.backupRoot, 0o700)
  const release = acquireLock(paths.lockFile)
  let databaseImportAttemptedThisRun = false
  let databaseInitializedThisRun = false
  let updateDatabaseBackup = null
  let databaseSession = null
  let snapshot
  let receipt
  try {
    const priorState = existsSync(paths.stateFile) ? readJson(paths.stateFile) : null
    if (priorState && !allowUpdate) {
      if (priorState.profileFingerprint !== profileFingerprint || priorState.version !== metadata.version) {
        throw new YhtError('Installed profile or version differs; use config update or an explicit upgrade path', {
          code: 'INSTALL_CHANGE_REQUIRES_CONTROLLED_UPDATE',
        })
      }
    }
    if (!skipRuntime) createInstallUser()
    if (!skipRuntime) {
      chmodSync(paths.configRoot, 0o755)
      run('chown', ['root:yihetong', paths.installRoot], { code: 'INSTALL_ROOT_OWNERSHIP_FAILED' })
      chmodSync(paths.installRoot, 0o755)
      const releasesRoot = path.join(paths.installRoot, 'releases')
      ensureDir(releasesRoot, 0o755)
      run('chown', ['root:yihetong', releasesRoot], { code: 'RELEASES_ROOT_OWNERSHIP_FAILED' })
      chmodSync(releasesRoot, 0o755)
    }
    const rollbackRoot = path.join(paths.backupRoot, 'rollback', new Date().toISOString().replace(/[:.]/g, ''))
    ensureDir(rollbackRoot, 0o700)
    const snapshotItems = [
      snapshotOne(path.join(paths.installRoot, 'current'), rollbackRoot, 'current'),
      snapshotOne(paths.stateFile, rollbackRoot, 'installation-state'),
      snapshotOne(path.join(paths.configRoot, 'runtime.env'), rollbackRoot, 'runtime.env'),
      snapshotOne(path.join(paths.configRoot, 'application.yml'), rollbackRoot, 'application.yml'),
      snapshotOne(path.join(paths.configRoot, 'customer-profile.yaml'), rollbackRoot, 'customer-profile.yaml'),
      snapshotOne(path.join(paths.configRoot, 'secrets.refs.yaml'), rollbackRoot, 'secrets.refs.yaml'),
      snapshotOne(path.join(paths.configRoot, 'mysql-client.cnf'), rollbackRoot, 'mysql-client.cnf'),
      snapshotOne(path.join(paths.configRoot, 'assets'), rollbackRoot, 'customer-assets'),
      snapshotOne(path.join(paths.configRoot, 'certificates'), rollbackRoot, 'customer-certificates'),
      snapshotOne(path.join(paths.configRoot, 'commercial'), rollbackRoot, 'commercial-authorization'),
    ]
    if (!skipRuntime) {
      snapshotItems.push(snapshotOne(`/etc/nginx/conf.d/${NGINX_CONFIG}`, rollbackRoot, 'nginx.conf'))
      snapshotItems.push(snapshotOne(`/etc/systemd/system/${API_SERVICE}`, rollbackRoot, API_SERVICE))
      snapshotItems.push(snapshotOne(`/etc/systemd/system/${WEBSITE_SERVICE}`, rollbackRoot, WEBSITE_SERVICE))
      snapshotItems.push(snapshotOne(`/etc/systemd/system/${LICENSE_REFRESH_SERVICE}`, rollbackRoot, LICENSE_REFRESH_SERVICE))
      snapshotItems.push(snapshotOne(`/etc/systemd/system/${LICENSE_REFRESH_TIMER}`, rollbackRoot, LICENSE_REFRESH_TIMER))
    }
    snapshot = {
      version: 4,
      kind: 'RollbackSnapshot',
      generatedBy: 'yhtctl',
      createdAt: new Date().toISOString(),
      rollbackRoot,
      runtimeManaged: !skipRuntime,
      targetProfileFingerprint: profileFingerprint,
      rollbackProfileFingerprint: priorState?.profileFingerprint || null,
      versionName: metadata.version,
      sourceVersion: metadata.sourceVersion,
      packageManifestFingerprint: packageCheck.manifestFingerprint,
      customerManifestFingerprint: customerCheck.manifestFingerprint,
      priorStateFingerprint: priorState ? sha256Object(priorState) : null,
      resultStateFingerprint: null,
      release: {
        path: releaseDir,
        existedBefore: releaseExistedBefore,
        runtimeCache: { path: runtimeCacheDir, existedBefore: runtimeCacheExistedBefore },
      },
      runtimeState: snapshotServiceState(skipRuntime),
      databaseRollbackPoint: null,
      items: snapshotItems,
    }
    persistRollbackSnapshot(snapshot)

    databaseSession = openDatabaseCredentialSession(profile, secrets, paths)
    const accountPreflight = preflightDatabaseAccounts({
      defaultsFiles: databaseSession.defaultsFiles,
      databaseName: profile.database.name,
    })
    const runtimeDefaultsFile = databaseSession.defaultsFiles.runtime
    const migrationDefaultsFile = databaseSession.defaultsFiles.migration
    const backupDefaultsFile = databaseSession.defaultsFiles.backup
    const beforeTableCount = databaseTableCount(runtimeDefaultsFile, profile.database.name)
    let databaseMigration = { status: 'not_required', source: null }
    if (!priorState) {
      if (beforeTableCount !== 0) {
        throw new YhtError(`Refusing new install into a non-empty database (${beforeTableCount} tables)`, {
          code: 'DATABASE_NOT_EMPTY',
        })
      }
      const sqlFile = path.join(packageRoot, 'database', 'fresh-install.sql')
      const initializer = path.join(packageRoot, 'deploy', 'initialize-fresh-mysql8.sh')
      databaseImportAttemptedThisRun = true
      initializeFreshDatabase({ defaultsFile: migrationDefaultsFile, databaseName: profile.database.name, sqlFile, scriptPath: initializer })
      databaseInitializedThisRun = true
      databaseMigration = { status: 'pass', source: 'database/fresh-install.sql' }
      snapshot.databaseRollbackPoint = {
        kind: 'preserve-new-database',
        databaseName: profile.database.name,
        reason: 'Manual rollback preserves post-install customer data; failure rollback cleans only the same failed run.',
      }
      persistRollbackSnapshot(snapshot)
      applySql(migrationDefaultsFile, profile.database.name, path.join(renderDir, 'system-deploy-config.sql'))
      applySql(migrationDefaultsFile, profile.database.name, path.join(renderDir, 'brand-config.sql'))
    } else if (beforeTableCount < 50) {
      throw new YhtError('Installed database no longer satisfies the expected schema floor', { code: 'DATABASE_SCHEMA_INCOMPLETE' })
    } else if (allowUpdate) {
      updateDatabaseBackup = await backupDatabase({
        defaultsFile: backupDefaultsFile,
        databaseName: profile.database.name,
        outputDir: path.join(paths.backupRoot, 'database'),
        reason: 'pre-config-update',
      })
      snapshot.databaseRollbackPoint = {
        kind: 'restore-manifest',
        databaseName: profile.database.name,
        manifestPath: updateDatabaseBackup.manifestPath,
        sha256: updateDatabaseBackup.manifest.sha256,
        bytes: updateDatabaseBackup.manifest.bytes,
      }
      persistRollbackSnapshot(snapshot)
      const upgradeSql = path.join(packageRoot, 'database', 'upgrade.sql')
      if (existsSync(upgradeSql) && statSync(upgradeSql).size > 0) {
        applySql(migrationDefaultsFile, profile.database.name, upgradeSql)
        databaseMigration = { status: 'pass', source: 'database/upgrade.sql' }
      }
      applySql(migrationDefaultsFile, profile.database.name, path.join(renderDir, 'system-deploy-config.sql'))
      applySql(migrationDefaultsFile, profile.database.name, path.join(renderDir, 'brand-config.sql'))
    }

    const releaseComposition = composeRelease({
      packageRoot,
      payloadDir,
      customerRoot,
      releaseDir,
      version: metadata.version,
      profileFingerprint,
      packageCheck,
      customerCheck,
    })
    activateRelease(paths, releaseDir)
    const websiteCache = skipRuntime ? null : configureWebsiteCache(paths, releaseDir, runtimeCacheDir)
    if (!skipRuntime) {
      ensureDir(path.join(paths.dataRoot, 'logs'))
      run('chown', ['-R', 'root:yihetong', releaseDir], { code: 'RELEASE_OWNERSHIP_FAILED' })
      run('find', [releaseDir, '-type', 'd', '-exec', 'chmod', '0755', '{}', '+'], { code: 'RELEASE_DIRECTORY_PERMISSION_FAILED' })
      run('find', [releaseDir, '-type', 'f', '-exec', 'chmod', '0644', '{}', '+'], { code: 'RELEASE_FILE_PERMISSION_FAILED' })
      run('find', [releaseDir, '-type', 'f', '-name', '*.sh', '-exec', 'chmod', '0755', '{}', '+'], { code: 'RELEASE_SCRIPT_PERMISSION_FAILED' })
      run('chmod', ['0755', path.join(releaseDir, 'website', 'start-website.sh')], { code: 'WEBSITE_LAUNCHER_PERMISSION_FAILED' })
      run('chmod', ['0755', path.join(releaseDir, 'tooling', 'yhtctl')], { code: 'YHTCTL_LAUNCHER_PERMISSION_FAILED' })
      run('chmod', ['0755', path.join(releaseDir, 'tooling', 'yihetong-cli')], { code: 'AGENT_CLI_LAUNCHER_PERMISSION_FAILED' })
      run('chown', ['-R', 'yihetong:yihetong', paths.dataRoot], { code: 'DATA_OWNERSHIP_FAILED' })
      run('chown', ['-h', 'root:yihetong', websiteCache.releaseCache], { code: 'WEBSITE_CACHE_LINK_OWNERSHIP_FAILED' })
    }
    copyCustomerMaterial(path.dirname(profilePath), paths.configRoot, allowUpdate)
    const operationStates = skipRuntime
      ? [
          installFileOwned(path.join(renderDir, 'runtime.env'), path.join(paths.configRoot, 'runtime.env'), { mode: 0o600, allowUpdate }),
          installFileOwned(path.join(renderDir, 'application.yml'), path.join(paths.configRoot, 'application.yml'), { mode: 0o640, allowUpdate }),
          installFileOwned(path.join(renderDir, 'customer-profile.yaml'), path.join(paths.configRoot, 'customer-profile.yaml'), { mode: 0o640, allowUpdate }),
          installFileOwned(path.join(renderDir, 'secrets.refs.yaml'), path.join(paths.configRoot, 'secrets.refs.yaml'), { mode: 0o640, allowUpdate }),
          ...installRestrictedFiles(paths, renderDir, allowUpdate, false),
        ]
      : installRuntimeFiles(profile, paths, renderDir, allowUpdate)
    const runtimeHealth = skipRuntime ? null : activateServices(profile)
    const configurationReadback = readBackAppliedConfiguration({
      defaultsFile: runtimeDefaultsFile,
      databaseName: profile.database.name,
      authority,
    })
    const releaseSequence = [
      { id: 'database-account-preflight', status: 'pass', roles: accountPreflight.map((item) => item.role) },
      { id: 'database-backup', status: updateDatabaseBackup ? 'pass' : 'not_required', manifestPath: updateDatabaseBackup?.manifestPath || null },
      { id: 'database-ddl', ...databaseMigration },
      { id: 'backend', status: 'pass', releaseDir },
      { id: 'static-manage', status: 'pass', releaseDir },
      { id: 'static-user', status: 'pass', releaseDir },
      { id: 'static-h5', status: 'pass', releaseDir },
      { id: 'static-website', status: 'pass', releaseDir },
      { id: 'configuration-readback', ...configurationReadback },
      { id: 'mini-program-build-upload', status: 'not_in_scope' },
      { id: 'online-business-acceptance', status: 'user_final_required' },
    ]
    const state = {
      version: metadata.version,
      sourceVersion: metadata.sourceVersion,
      profileFingerprint,
      authorityFingerprint: authority.authorityFingerprint,
      packageManifestFingerprint: packageCheck.manifestFingerprint,
      customerManifestFingerprint: customerCheck.manifestFingerprint,
      installedAt: priorState?.installedAt || new Date().toISOString(),
      lastConvergedAt: new Date().toISOString(),
      databaseInitialized: true,
      releaseDir,
      rollbackReceipt: path.join(rollbackRoot, 'ROLLBACK.json'),
      databaseRollbackPoint: snapshot.databaseRollbackPoint,
      operationStates,
      runtimeHealth,
      releaseComposition: { ...releaseComposition, websiteCache },
      configurationReadback,
      releaseSequence,
    }
    snapshot.resultStateFingerprint = sha256Object(state)
    persistRollbackSnapshot(snapshot)
    atomicWrite(paths.stateFile, canonicalJson(state), 0o640)
    receipt = writeReceipt(paths, allowUpdate ? 'ConfigUpdateReceipt' : 'InstallReceipt', {
      status: 'pass',
      version: metadata.version,
      profileFingerprint,
      packageManifestFingerprint: packageCheck.manifestFingerprint,
      customerManifestFingerprint: customerCheck.manifestFingerprint,
      database: { beforeTableCount, initializedThisRun: databaseInitializedThisRun },
      databaseAccounts: databaseSession.roles,
      releaseSequence,
      rollbackReceipt: state.rollbackReceipt,
      rollbackSnapshotDigest: snapshot.snapshotDigest,
      databaseRollbackPoint: state.databaseRollbackPoint,
      idempotentConvergence: Boolean(priorState) && !allowUpdate,
      controlledUpdate: Boolean(priorState) && allowUpdate,
    })
    return { status: 'pass', state, ...receipt }
  } catch (error) {
    if (!skipRuntime) stopServicesBestEffort()
    let databaseRollback = { attempted: false }
    if (databaseImportAttemptedThisRun) {
      try {
        databaseRollback = { attempted: true, ...cleanupFreshDatabase(databaseSession.defaultsFiles.migration, profile.database.name), status: 'pass' }
      } catch (rollbackError) {
        databaseRollback = { attempted: true, status: 'fail', error: rollbackError.code || rollbackError.message }
      }
    } else if (updateDatabaseBackup) {
      try {
        databaseRollback = {
          attempted: true,
          status: 'pass',
          ...(await restoreDatabase({
            defaultsFile: databaseSession.defaultsFiles.migration,
            databaseName: profile.database.name,
            manifestPath: updateDatabaseBackup.manifestPath,
          })),
        }
      } catch (rollbackError) {
        databaseRollback = { attempted: true, status: 'fail', error: rollbackError.code || rollbackError.message }
      }
    }
    let filesystemRollback = { attempted: false, status: 'not_required' }
    if (snapshot) {
      try {
        restoreSnapshot(snapshot)
        const releaseCleanup = cleanupSnapshotRelease(snapshot, { path: releaseDir, existedBefore: releaseExistedBefore })
        const runtimeReconciliation = skipRuntime
          ? { status: 'not_required' }
          : { status: 'pass', ...reconcileRuntimeAfterRestore(profile, paths, snapshot) }
        filesystemRollback = { attempted: true, status: 'pass', releaseCleanup, runtimeReconciliation }
      } catch (rollbackError) {
        filesystemRollback = { attempted: true, status: 'fail', error: rollbackError.code || rollbackError.message }
      }
    }
    const rollbackFailed = filesystemRollback.status === 'fail' || databaseRollback.status === 'fail'
    const failure = writeReceipt(paths, 'InstallFailureReceipt', {
      status: rollbackFailed ? 'rollback_failed' : 'rolled_back',
      error: { code: error.code || 'INSTALL_FAILED', message: error.message },
      databaseRollback,
      filesystemRollback,
      rollbackReceipt: snapshot ? path.join(snapshot.rollbackRoot, 'ROLLBACK.json') : null,
    })
    error.details = [...(error.details || []), { failureReceipt: failure.receiptPath, databaseRollback, filesystemRollback }]
    throw error
  } finally {
    databaseSession?.close()
    release()
  }
}

export function installationStatus({ profile, profileFingerprint, rootPrefix = '/', skipRuntime = false }) {
  const paths = statePaths(profile, rootPrefix)
  const state = existsSync(paths.stateFile) ? readJson(paths.stateFile) : null
  const checks = [
    { id: 'state', ok: Boolean(state), actual: state ? 'present' : 'missing' },
    { id: 'profile-fingerprint', ok: state?.profileFingerprint === profileFingerprint, actual: state?.profileFingerprint || null },
    { id: 'current-release', ok: existsSync(path.join(paths.installRoot, 'current')), actual: path.join(paths.installRoot, 'current') },
    { id: 'runtime-env', ok: existsSync(path.join(paths.configRoot, 'runtime.env')), actual: path.join(paths.configRoot, 'runtime.env') },
  ]
  if (!skipRuntime && process.platform === 'linux') {
    checks.push({ id: 'nginx-config', ok: run('nginx', ['-t'], { allowFailure: true }).status === 0 })
    for (const service of [serviceStatus(API_SERVICE), serviceStatus(WEBSITE_SERVICE)]) {
      checks.push({ id: `systemd:${service.name}`, ok: service.active && service.enabled, actual: service })
    }
    const licenseTimer = serviceStatus(LICENSE_REFRESH_TIMER)
    checks.push({
      id: `systemd:${licenseTimer.name}`,
      ok: isCommunityProfile(profile) ? !licenseTimer.active && !licenseTimer.enabled : licenseTimer.active && licenseTimer.enabled,
      actual: { ...licenseTimer, required: !isCommunityProfile(profile) },
    })
  }
  return {
    status: checks.every((check) => check.ok) ? 'pass' : 'fail',
    state,
    paths,
    checks,
  }
}

export function verifyInstallation({ profile, profileFingerprint, rootPrefix = '/', skipRuntime = false }) {
  const status = installationStatus({ profile, profileFingerprint, rootPrefix, skipRuntime })
  const paths = status.paths
  const checks = [...status.checks]
  if (existsSync(path.join(paths.configRoot, 'mysql-client.cnf')) && commandExists('mysql')) {
    try {
      const defaultsFile = path.join(paths.configRoot, 'mysql-client.cnf')
      const tables = databaseTableCount(defaultsFile, profile.database.name)
      checks.push({ id: 'database-table-floor', ok: tables >= 50, actual: tables, expected: '>=50' })
      const brandRows = Number.parseInt(mysqlQuery(defaultsFile, 'SELECT COUNT(*) FROM system_brand_config WHERE is_deleted=0', profile.database.name), 10)
      checks.push({ id: 'brand-row', ok: brandRows >= 1, actual: brandRows, expected: '>=1' })
    } catch (error) {
      checks.push({ id: 'database-runtime', ok: false, actual: error.code || error.message })
    }
  }
  if (!skipRuntime && process.platform === 'linux') {
    const brand = run('curl', ['--silent', '--show-error', '--fail', '--max-time', '5', `http://127.0.0.1:${profile.deployment.ports.api}/api/v1/brand-config/active`], { allowFailure: true })
    const brandSemantic = brandResponseMatchesProfile(profile, brand.stdout)
    checks.push({ id: 'api-brand-smoke', ok: brand.status === 0 && brandSemantic, actual: { commandStatus: brand.status, semantic: brandSemantic } })
    const contract = curlJsonBoundary(`http://127.0.0.1:${profile.deployment.ports.api}/mgt/v1/contract`)
    checks.push({ id: 'contract-api-auth-boundary', ok: contractBoundaryIsSafe(contract), actual: { httpCode: contract.httpCode, semantic: contractBoundaryIsSafe(contract) } })
    const login = curlJsonBoundary(`http://127.0.0.1:${profile.deployment.ports.api}/mgt/v1/u/login`, { data: '{}' })
    checks.push({ id: 'login-api-boundary', ok: loginBoundaryIsSafe(login), actual: { httpCode: login.httpCode, semantic: loginBoundaryIsSafe(login) } })
    const nginx = summarizeNginxProbes(profile, nginxEndpointProbes(profile))
    for (const [id, actual] of Object.entries(nginx.statuses)) {
      checks.push({ id: `nginx-endpoint:${id}`, ok: actual === 0, actual })
    }
    for (const [id, actual] of Object.entries(nginx.semantics)) {
      checks.push({ id: `nginx-semantic:${id}`, ok: actual, actual })
    }
  }
  const result = {
    status: checks.every((check) => check.ok) ? 'pass' : 'fail',
    checkedAt: new Date().toISOString(),
    profileFingerprint,
    checks,
  }
  const receipt = writeReceipt(paths, 'VerificationReceipt', result)
  return { ...result, ...receipt, state: status.state, paths }
}

export async function createBackup({ profile, secrets, rootPrefix = '/', reason = 'manual' }) {
  const paths = statePaths(profile, rootPrefix)
  ensureDir(paths.configRoot)
  const session = openDatabaseCredentialSession(profile, secrets, paths)
  try {
    mysqlQuery(session.defaultsFiles.backup, 'SELECT 1', profile.database.name)
    const result = await backupDatabase({
      defaultsFile: session.defaultsFiles.backup,
      databaseName: profile.database.name,
      outputDir: path.join(paths.backupRoot, 'database'),
      reason,
    })
    const receipt = writeReceipt(paths, 'BackupReceipt', {
      status: 'pass',
      manifestPath: result.manifestPath,
      dumpSha256: result.manifest.sha256,
      bytes: result.manifest.bytes,
      contentBytes: result.manifest.contentBytes,
      accountRole: 'backup',
    })
    return { status: 'pass', ...result, ...receipt }
  } finally {
    session.close()
  }
}

async function restoreDatabaseWithSafety({ profile, secrets, rootPrefix, manifestPath, reason }) {
  const paths = statePaths(profile, rootPrefix)
  const safety = await createBackup({ profile, secrets, rootPrefix, reason })
  const session = openDatabaseCredentialSession(profile, secrets, paths)
  try {
    mysqlQuery(session.defaultsFiles.migration, 'SELECT 1', profile.database.name)
    const restored = await restoreDatabase({
      defaultsFile: session.defaultsFiles.migration,
      databaseName: profile.database.name,
      manifestPath,
    })
    return { restored, safetyManifest: safety.manifestPath }
  } catch (error) {
    await restoreDatabase({
      defaultsFile: session.defaultsFiles.migration,
      databaseName: profile.database.name,
      manifestPath: safety.manifestPath,
    })
    error.details = [...(error.details || []), { safetyManifest: safety.manifestPath, safetyRestore: 'pass' }]
    throw error
  } finally {
    session.close()
  }
}

export async function rollback({ profile, profileFingerprint, secrets, rootPrefix = '/', rollbackReceipt, databaseManifest, yes = false }) {
  if (!yes) throw new YhtError('Rollback requires --yes', { code: 'ROLLBACK_CONFIRMATION_REQUIRED' })
  const paths = statePaths(profile, rootPrefix)
  const actions = []
  if (rollbackReceipt) {
    const validated = loadValidatedRollbackSnapshot({
      receiptPath: rollbackReceipt,
      profileFingerprint,
      paths,
    })
    const snapshot = validated.snapshot
    stopServicesBestEffort()
    restoreSnapshot(snapshot)
    const releaseCleanup = cleanupSnapshotRelease(snapshot)
    let embeddedDatabase = null
    try {
      if (!databaseManifest && snapshot.databaseRollbackPoint?.kind === 'restore-manifest') {
        embeddedDatabase = await restoreDatabaseWithSafety({
          profile,
          secrets,
          rootPrefix,
          manifestPath: snapshot.databaseRollbackPoint.manifestPath,
          reason: 'pre-receipt-rollback-safety',
        })
      }
      const runtime = reconcileRuntimeAfterRestore(profile, paths, snapshot)
      actions.push({
        type: 'files-and-services',
        snapshot: validated.receiptPath,
        releaseCleanup,
        database: embeddedDatabase,
        databaseRollbackPoint: snapshot.databaseRollbackPoint || null,
        runtime,
      })
    } catch (error) {
      try {
        reconcileRuntimeAfterRestore(profile, paths, snapshot)
      } catch (runtimeError) {
        error.details = [...(error.details || []), { runtimeRecovery: 'fail', error: runtimeError.code || runtimeError.message }]
      }
      throw error
    }
  }
  if (databaseManifest) {
    const apiWasEnabled = serviceStatus(API_SERVICE).enabled
    const websiteWasEnabled = serviceStatus(WEBSITE_SERVICE).enabled
    stopServicesBestEffort()
    try {
      const database = await restoreDatabaseWithSafety({
        profile,
        secrets,
        rootPrefix,
        manifestPath: databaseManifest,
        reason: 'pre-restore-safety',
      })
      if (apiWasEnabled || websiteWasEnabled) activateServices(profile)
      actions.push({ type: 'database', ...database })
    } catch (error) {
      if (apiWasEnabled || websiteWasEnabled) activateServices(profile)
      throw error
    }
  }
  if (!actions.length) throw new YhtError('Rollback requires --receipt or --database-manifest', { code: 'ROLLBACK_INPUT_MISSING' })
  const receipt = writeReceipt(paths, 'RollbackReceipt', { status: 'pass', actions })
  return { status: 'pass', actions, ...receipt }
}

export function queryInstalledDeployRows({ profile, rootPrefix = '/' }) {
  const paths = statePaths(profile, rootPrefix)
  const defaultsFile = path.join(paths.configRoot, 'mysql-client.cnf')
  if (!existsSync(defaultsFile)) return []
  return queryDeployRows(defaultsFile, profile.database.name)
}

export function getStatePaths(profile, rootPrefix = '/') {
  return statePaths(profile, rootPrefix)
}
