import { createCipheriv, createDecipheriv, randomBytes, randomUUID } from 'node:crypto'
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { atomicWrite, canonicalJson, readJson, sha256Object, YhtError } from './common.mjs'

const FORMAT_VERSION = 1
const SECRET_KEY_PATTERN = /(?:password|token|private.?key|app.?secret|access.?key.?secret|secret.?value|credential.?value)/i

function defaultStateRoot() {
  if (process.platform === 'win32') {
    return path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), 'Yihetong', 'Installer')
  }
  return path.join(process.env.XDG_STATE_HOME || path.join(os.homedir(), '.local', 'state'), 'yihetong-installer')
}

function assertSessionId(value) {
  const id = String(value || '')
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new YhtError('Invalid installer session id', { code: 'INSTALLER_SESSION_ID_INVALID' })
  return id
}

function pathsFor(root, id) {
  const sessionRoot = path.resolve(root || defaultStateRoot())
  const sessionDir = path.join(sessionRoot, 'sessions', assertSessionId(id))
  return {
    root: sessionRoot,
    sessionDir,
    sessionFile: path.join(sessionDir, 'session.json'),
    eventsFile: path.join(sessionDir, 'events.jsonl'),
    secretsFile: path.join(sessionDir, 'secrets.enc.json'),
    keyFile: path.join(sessionRoot, 'installer.key'),
  }
}

function sanitize(value, key = '') {
  if (/^secrets?$/i.test(key) || SECRET_KEY_PATTERN.test(key)) return value == null ? value : '<redacted>'
  if (Array.isArray(value)) return value.map((item) => sanitize(item))
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([name, item]) => [name, sanitize(item, name)]))
  }
  return value
}

function writePrivateJson(filePath, value) {
  mkdirSync(path.dirname(filePath), { recursive: true, mode: 0o700 })
  atomicWrite(filePath, canonicalJson(value), 0o600)
}

function loadOrCreateKey(filePath) {
  if (existsSync(filePath)) return Buffer.from(readFileSync(filePath, 'utf8').trim(), 'base64')
  mkdirSync(path.dirname(filePath), { recursive: true, mode: 0o700 })
  const key = randomBytes(32)
  writeFileSync(filePath, `${key.toString('base64')}\n`, { encoding: 'utf8', mode: 0o600, flag: 'wx' })
  chmodSync(filePath, 0o600)
  return key
}

function appendEventFile(filePath, event) {
  mkdirSync(path.dirname(filePath), { recursive: true, mode: 0o700 })
  writeFileSync(filePath, `${JSON.stringify(event)}\n`, { encoding: 'utf8', mode: 0o600, flag: 'a' })
  chmodSync(filePath, 0o600)
}

export function createInstallerSession({ root, packageRoot, mode = 'quick', platform = process.platform, config = {}, createdBy = 'cli' }) {
  if (!['quick', 'custom'].includes(mode)) throw new YhtError('Installer mode must be quick or custom', { code: 'INSTALLER_MODE_INVALID' })
  const id = randomUUID()
  const paths = pathsFor(root, id)
  const safeConfig = sanitize(config)
  const createdAt = new Date().toISOString()
  const session = {
    apiVersion: 'yht.io/v1',
    kind: 'InstallerSession',
    formatVersion: FORMAT_VERSION,
    id,
    status: 'created',
    phase: 'environment',
    mode,
    platform,
    packageRoot: path.resolve(packageRoot || process.cwd()),
    config: safeConfig,
    createdBy,
    createdAt,
    updatedAt: createdAt,
    secretState: { configured: false, names: [] },
    lastAction: null,
    lastError: null,
    entries: [],
  }
  session.sessionFingerprint = sha256Object({
    formatVersion: FORMAT_VERSION,
    packageRoot: session.packageRoot,
    mode,
    platform,
    config: safeConfig,
  })
  writePrivateJson(paths.sessionFile, session)
  appendInstallerEvent({ root, id, stage: 'session', status: 'pass', message: '安装会话已创建。', source: createdBy })
  return readInstallerSession({ root, id })
}

export function readInstallerSession({ root, id }) {
  const paths = pathsFor(root, id)
  if (!existsSync(paths.sessionFile)) throw new YhtError('Installer session was not found', { code: 'INSTALLER_SESSION_NOT_FOUND' })
  return readJson(paths.sessionFile)
}

export function updateInstallerSession({ root, id, patch }) {
  const paths = pathsFor(root, id)
  const current = readInstallerSession({ root, id })
  const next = {
    ...current,
    ...sanitize(patch),
    id: current.id,
    sessionFingerprint: current.sessionFingerprint,
    updatedAt: new Date().toISOString(),
  }
  writePrivateJson(paths.sessionFile, next)
  return next
}

export function appendInstallerEvent({ root, id, stage, status, message, code = null, details = null, source = 'engine' }) {
  const paths = pathsFor(root, id)
  const event = sanitize({
    sequence: existsSync(paths.eventsFile) ? readFileSync(paths.eventsFile, 'utf8').split(/\r?\n/).filter(Boolean).length + 1 : 1,
    at: new Date().toISOString(),
    stage,
    status,
    message,
    code,
    details,
    source,
  })
  appendEventFile(paths.eventsFile, event)
  return event
}

export function readInstallerEvents({ root, id }) {
  const paths = pathsFor(root, id)
  if (!existsSync(paths.eventsFile)) return []
  return readFileSync(paths.eventsFile, 'utf8').split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line))
}

export function storeInstallerSecrets({ root, id, secrets }) {
  const names = Object.keys(secrets || {}).sort()
  if (!names.length) throw new YhtError('No secrets were supplied', { code: 'INSTALLER_SECRETS_EMPTY' })
  const paths = pathsFor(root, id)
  readInstallerSession({ root, id })
  const key = loadOrCreateKey(paths.keyFile)
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(secrets), 'utf8'), cipher.final()])
  writePrivateJson(paths.secretsFile, {
    format: 'aes-256-gcm',
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    ciphertext: encrypted.toString('base64'),
  })
  updateInstallerSession({ root, id, patch: { secretState: { configured: true, names } } })
  appendInstallerEvent({ root, id, stage: 'secrets', status: 'pass', message: `已在本机受保护存储中保存 ${names.length} 项秘密；值不会写入会话、日志或响应。` })
  return { status: 'pass', configured: true, names }
}

export function loadInstallerSecrets({ root, id }) {
  const paths = pathsFor(root, id)
  if (!existsSync(paths.secretsFile)) return {}
  const payload = readJson(paths.secretsFile)
  const key = loadOrCreateKey(paths.keyFile)
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(payload.iv, 'base64'))
  decipher.setAuthTag(Buffer.from(payload.tag, 'base64'))
  return JSON.parse(Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, 'base64')),
    decipher.final(),
  ]).toString('utf8'))
}

export function publicInstallerSession({ root, id }) {
  const session = readInstallerSession({ root, id })
  return { ...sanitize(session), events: readInstallerEvents({ root, id }) }
}

export const installerSessionDefaults = { stateRoot: defaultStateRoot }
