import { createHash } from 'node:crypto'
import { chmodSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseDocument } from 'yaml'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const cliRoot = path.resolve(__dirname, '..')
export const repoRoot = path.resolve(cliRoot, '..', '..')
export const defaultSchemaPath = path.join(repoRoot, 'deploy', 'customer-profile', 'customer-profile.schema.json')
export const defaultAuthorityMapPath = path.join(repoRoot, 'deploy', 'customer-profile', 'profile-authority-map.json')

export class YhtError extends Error {
  constructor(message, { code = 'YHT_ERROR', details = [], exitCode = 2 } = {}) {
    super(message)
    this.name = 'YhtError'
    this.code = code
    this.details = details
    this.exitCode = exitCode
  }
}

export function parseArgs(argv) {
  const positionals = []
  const options = {}
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i]
    if (!token.startsWith('--')) {
      positionals.push(token)
      continue
    }
    const equals = token.indexOf('=')
    if (equals > 2) {
      options[token.slice(2, equals)] = token.slice(equals + 1)
      continue
    }
    const key = token.slice(2)
    if (key.startsWith('no-')) {
      options[key.slice(3)] = false
      continue
    }
    const next = argv[i + 1]
    if (next !== undefined && !next.startsWith('--')) {
      options[key] = next
      i += 1
    } else {
      options[key] = true
    }
  }
  return { positionals, options }
}

export function readJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'))
  } catch (error) {
    throw new YhtError(`Unable to read JSON: ${filePath}`, {
      code: 'INVALID_JSON',
      details: [error.message],
    })
  }
}

export function readYaml(filePath) {
  let text
  try {
    text = readFileSync(filePath, 'utf8')
  } catch (error) {
    throw new YhtError(`Unable to read YAML: ${filePath}`, {
      code: 'YAML_READ_FAILED',
      details: [error.message],
    })
  }
  const document = parseDocument(text, { prettyErrors: true, uniqueKeys: true })
  if (document.errors.length) {
    throw new YhtError(`Invalid YAML: ${filePath}`, {
      code: 'INVALID_YAML',
      details: document.errors.map((error) => error.message),
    })
  }
  return document.toJS({ mapAsMap: false })
}

export function ensureDir(dirPath, mode = 0o750) {
  mkdirSync(dirPath, { recursive: true, mode })
}

export function atomicWrite(filePath, content, mode = 0o640) {
  ensureDir(path.dirname(filePath))
  const tempPath = `${filePath}.tmp-${process.pid}`
  writeFileSync(tempPath, content, { encoding: 'utf8', mode })
  chmodSync(tempPath, mode)
  renameSync(tempPath, filePath)
}

export function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])]),
    )
  }
  return value
}

export function canonicalJson(value) {
  return `${JSON.stringify(canonicalize(value), null, 2)}\n`
}

export function sha256(value) {
  const input = Buffer.isBuffer(value) ? value : Buffer.from(String(value), 'utf8')
  return createHash('sha256').update(input).digest('hex')
}

export function sha256Object(value) {
  return sha256(JSON.stringify(canonicalize(value)))
}

export function getPath(object, dottedPath) {
  return dottedPath.split('.').reduce((value, key) => (value == null ? undefined : value[key]), object)
}

export function hasPath(object, dottedPath) {
  return getPath(object, dottedPath) !== undefined
}

export function toPosixPath(value) {
  return value.replaceAll('\\', '/')
}

export function redactRecord(record) {
  if (!record.sensitive) return { ...record }
  const { value, ...safe } = record
  return {
    ...safe,
    configured: value !== undefined && value !== null && String(value).length > 0,
    valueHash: value ? sha256(value) : null,
    value: '<redacted>',
  }
}

export function assertSafeRelativePath(value, label = 'path') {
  if (typeof value !== 'string' || value.length === 0 || path.isAbsolute(value)) {
    throw new YhtError(`${label} must be a non-empty relative path`, { code: 'UNSAFE_PATH' })
  }
  const normalized = path.normalize(value)
  if (normalized === '..' || normalized.startsWith(`..${path.sep}`)) {
    throw new YhtError(`${label} escapes its allowed root`, { code: 'UNSAFE_PATH' })
  }
  return normalized
}

export function resolveInside(root, relativePath, label = 'path') {
  const normalized = assertSafeRelativePath(relativePath, label)
  const resolvedRoot = path.resolve(root)
  const resolved = path.resolve(resolvedRoot, normalized)
  if (resolved !== resolvedRoot && !resolved.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new YhtError(`${label} escapes its allowed root`, { code: 'UNSAFE_PATH' })
  }
  return resolved
}

export function jsonResult(result, pretty = true) {
  return pretty ? canonicalJson(result) : `${JSON.stringify(result)}\n`
}
