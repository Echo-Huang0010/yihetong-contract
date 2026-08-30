import {
  createCipheriv,
  createDecipheriv,
  pbkdf2Sync,
  randomBytes,
} from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'
import {
  assertSafeRelativePath,
  canonicalJson,
  readJson,
  readYaml,
  resolveInside,
  YhtError,
} from './common.mjs'

const SECRET_REF_PATTERN = /^secret:\/\/([a-z0-9][a-z0-9._-]{2,127})$/

export function secretId(uri) {
  const match = SECRET_REF_PATTERN.exec(String(uri || ''))
  if (!match) throw new YhtError(`Invalid secret reference: ${uri}`, { code: 'INVALID_SECRET_REF' })
  return match[1]
}

export function collectSecretUris(value, found = new Set()) {
  if (typeof value === 'string' && value.startsWith('secret://')) {
    found.add(value)
    return found
  }
  if (Array.isArray(value)) {
    for (const item of value) collectSecretUris(item, found)
    return found
  }
  if (value && typeof value === 'object') {
    for (const item of Object.values(value)) collectSecretUris(item, found)
  }
  return found
}

export function validateSecretReferences(document, profile) {
  const errors = []
  if (!document || document.apiVersion !== 'yht.io/v1' || document.kind !== 'SecretReferences') {
    errors.push({ path: '/', message: 'SecretReferences apiVersion/kind is invalid' })
    return errors
  }
  if (!['recommended', 'compatibility'].includes(document.mode)) {
    errors.push({ path: '/mode', message: 'mode must be recommended or compatibility' })
  }
  if (profile?.security) {
    const expectedMode = profile.security.sensitiveDbCompatibilityMode ? 'compatibility' : 'recommended'
    if (document.mode !== expectedMode) {
      errors.push({ path: '/mode', message: `mode must match profile security mode: ${expectedMode}` })
    }
  }
  if (!document.refs || typeof document.refs !== 'object' || Array.isArray(document.refs)) {
    errors.push({ path: '/refs', message: 'refs must be an object' })
    return errors
  }
  for (const [id, ref] of Object.entries(document.refs)) {
    if (!/^[a-z0-9][a-z0-9._-]{2,127}$/.test(id)) {
      errors.push({ path: `/refs/${id}`, message: 'invalid secret id' })
      continue
    }
    if (!ref || typeof ref !== 'object') {
      errors.push({ path: `/refs/${id}`, message: 'reference must be an object' })
      continue
    }
    if (!['env', 'file', 'prompt', 'encrypted-bundle'].includes(ref.provider)) {
      errors.push({ path: `/refs/${id}/provider`, message: 'unsupported provider' })
    }
    if (ref.encoding !== undefined && !['text', 'base64'].includes(ref.encoding)) {
      errors.push({ path: `/refs/${id}/encoding`, message: 'encoding must be text or base64' })
    }
    if (ref.provider === 'env' && !/^[A-Z][A-Z0-9_]{2,127}$/.test(ref.key || '')) {
      errors.push({ path: `/refs/${id}/key`, message: 'env provider requires an uppercase key' })
    }
    if (ref.provider === 'file') {
      try {
        assertSafeRelativePath(ref.path, `refs.${id}.path`)
      } catch (error) {
        errors.push({ path: `/refs/${id}/path`, message: error.message })
      }
    }
    if (ref.provider === 'prompt' && String(ref.label || '').trim().length < 3) {
      errors.push({ path: `/refs/${id}/label`, message: 'prompt provider requires a label' })
    }
    if (ref.provider === 'encrypted-bundle' && !/^[a-z0-9][a-z0-9._-]{2,127}$/.test(ref.bundleKey || '')) {
      errors.push({ path: `/refs/${id}/bundleKey`, message: 'encrypted-bundle provider requires bundleKey' })
    }
  }
  for (const uri of collectSecretUris(profile)) {
    const id = secretId(uri)
    if (!document.refs[id]) errors.push({ path: `/refs/${id}`, message: `missing reference for ${uri}` })
  }
  return errors
}

async function promptHidden(label) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new YhtError(`Interactive secret is unavailable for ${label}`, { code: 'SECRET_PROMPT_UNAVAILABLE' })
  }
  const input = process.stdin
  const output = process.stdout
  output.write(`${label}: `)
  input.setRawMode(true)
  input.resume()
  input.setEncoding('utf8')
  let value = ''
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      input.setRawMode(false)
      input.pause()
      input.removeListener('data', onData)
      output.write('\n')
    }
    const onData = (character) => {
      if (character === '\u0003') {
        cleanup()
        reject(new YhtError('Secret entry cancelled', { code: 'SECRET_PROMPT_CANCELLED' }))
      } else if (character === '\r' || character === '\n') {
        cleanup()
        resolve(value)
      } else if (character === '\u007f' || character === '\b') {
        value = value.slice(0, -1)
      } else {
        value += character
      }
    }
    input.on('data', onData)
  })
}

function deriveKey(passphrase, salt) {
  if (!passphrase || passphrase.length < 12) {
    throw new YhtError('Secret bundle passphrase must contain at least 12 characters', {
      code: 'WEAK_SECRET_BUNDLE_PASSPHRASE',
    })
  }
  return pbkdf2Sync(passphrase, salt, 310000, 32, 'sha256')
}

export function encryptSecretBundle(values, passphrase) {
  const salt = randomBytes(16)
  const iv = randomBytes(12)
  const key = deriveKey(passphrase, salt)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const plaintext = Buffer.from(canonicalJson(values), 'utf8')
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()])
  return {
    version: 1,
    algorithm: 'aes-256-gcm+pbkdf2-sha256',
    iterations: 310000,
    salt: salt.toString('base64'),
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    ciphertext: ciphertext.toString('base64'),
  }
}

export function decryptSecretBundle(bundle, passphrase) {
  if (!bundle || bundle.version !== 1 || bundle.algorithm !== 'aes-256-gcm+pbkdf2-sha256') {
    throw new YhtError('Unsupported encrypted secret bundle', { code: 'INVALID_SECRET_BUNDLE' })
  }
  try {
    const salt = Buffer.from(bundle.salt, 'base64')
    const iv = Buffer.from(bundle.iv, 'base64')
    const key = deriveKey(passphrase, salt)
    const decipher = createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(Buffer.from(bundle.tag, 'base64'))
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(bundle.ciphertext, 'base64')),
      decipher.final(),
    ])
    return JSON.parse(plaintext.toString('utf8'))
  } catch (error) {
    if (error instanceof YhtError) throw error
    throw new YhtError('Encrypted secret bundle could not be decrypted', {
      code: 'SECRET_BUNDLE_DECRYPT_FAILED',
    })
  }
}

export async function resolveSecrets({ refsPath, profile, bundlePath, passphrase, allowPrompt = false }) {
  const refs = readYaml(refsPath)
  const validationErrors = validateSecretReferences(refs, profile)
  if (validationErrors.length) {
    throw new YhtError('Secret reference validation failed', {
      code: 'SECRET_REFS_INVALID',
      details: validationErrors,
    })
  }
  const baseDir = path.dirname(refsPath)
  let bundleValues = {}
  if (bundlePath) {
    const effectivePassphrase = passphrase || process.env.YHT_SECRETS_PASSPHRASE
    bundleValues = decryptSecretBundle(readJson(bundlePath), effectivePassphrase)
  }
  const values = {}
  for (const [id, ref] of Object.entries(refs.refs)) {
    let value
    if (ref.provider === 'env') {
      value = process.env[ref.key]
    } else if (ref.provider === 'file') {
      const filePath = resolveInside(baseDir, ref.path, `refs.${id}.path`)
      value = readFileSync(filePath, 'utf8').trimEnd()
    } else if (ref.provider === 'prompt') {
      if (allowPrompt) value = await promptHidden(ref.label)
    } else if (ref.provider === 'encrypted-bundle') {
      value = bundleValues[ref.bundleKey]
    }
    if (value !== undefined && value !== '' && ref.encoding === 'base64') {
      const encoded = String(value).trim()
      if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded)) {
        throw new YhtError(`Secret base64 encoding is invalid: ${id}`, { code: 'SECRET_BASE64_INVALID' })
      }
      value = Buffer.from(encoded, 'base64').toString('utf8')
    }
    if ((value === undefined || value === '') && ref.required !== false) {
      throw new YhtError(`Required secret is unavailable: ${id}`, {
        code: 'SECRET_UNAVAILABLE',
        details: [{ id, provider: ref.provider }],
      })
    }
    if (typeof value === 'string' && value.includes('\0')) {
      throw new YhtError(`Secret contains a NUL byte: ${id}`, {
        code: 'SECRET_VALUE_INVALID',
      })
    }
    if (typeof value === 'string' && /^(?:change[_-]?me|null|undefined)$/i.test(value.trim())) {
      throw new YhtError(`Secret still contains a placeholder: ${id}`, {
        code: 'SECRET_VALUE_PLACEHOLDER',
      })
    }
    values[id] = value ?? ''
  }
  return { refs, values }
}

export async function collectSecretsForBundle(refsPath) {
  const refs = readYaml(refsPath)
  const values = {}
  for (const [id, ref] of Object.entries(refs.refs || {})) {
    if (ref.provider === 'env') {
      values[id] = process.env[ref.key]
    } else if (ref.provider === 'file') {
      values[id] = readFileSync(resolveInside(path.dirname(refsPath), ref.path, `refs.${id}.path`), 'utf8').trimEnd()
    } else {
      values[id] = await promptHidden(ref.label || id)
    }
    if (!values[id]) throw new YhtError(`Required secret is unavailable: ${id}`, { code: 'SECRET_UNAVAILABLE' })
  }
  return values
}

export function closeReadline() {
  readline.emitKeypressEvents(process.stdin)
}
