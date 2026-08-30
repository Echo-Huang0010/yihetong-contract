import path from 'node:path'
import { existsSync } from 'node:fs'
import { readYaml, resolveInside, sha256Object, YhtError } from './common.mjs'
import { assertSchema, validateSchema } from './schema.mjs'
import { collectSecretUris, secretId, validateSecretReferences } from './secrets.mjs'

const forbiddenValuePattern = /(change[_-]?me|your[_-]?[a-z0-9]|<[^>]+>)/i
const productionPlaceholderPattern = /(production[-_]?required|example\.invalid|00000000-0000-4000-8000-000000000001)/i
const sensitiveKeyPattern = /(password|secret|private.?key|api.?key|access.?key)/i
const deploymentRootRules = {
  installRoot: /^\/opt\/yihetong(?:[._-][A-Za-z0-9][A-Za-z0-9._-]*)?$/,
  dataRoot: /^\/var\/lib\/yihetong(?:[._-][A-Za-z0-9][A-Za-z0-9._-]*)?$/,
  configRoot: /^\/etc\/yihetong(?:[._-][A-Za-z0-9][A-Za-z0-9._-]*)?$/,
  backupRoot: /^\/var\/backups\/yihetong(?:[._-][A-Za-z0-9][A-Za-z0-9._-]*)?$/,
}

function walk(value, pointer = '', findings = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, `${pointer}/${index}`, findings))
    return findings
  }
  if (!value || typeof value !== 'object') return findings
  for (const [key, item] of Object.entries(value)) {
    const next = `${pointer}/${key}`
    if (sensitiveKeyPattern.test(key) && typeof item === 'string') {
      const permittedReference = item.startsWith('secret://')
        || item.startsWith('file://certificates/')
        || (next === '/commercialAuthorization/privateKeyFile' && item === 'commercial/instance-private.pem')
      if (!permittedReference) findings.push({ path: next, code: 'PLAINTEXT_SECRET_FIELD' })
    }
    if (typeof item === 'string' && forbiddenValuePattern.test(item)) {
      findings.push({ path: next, code: 'PLACEHOLDER_VALUE' })
    }
    walk(item, next, findings)
  }
  return findings
}

function findProductionPlaceholders(value, pointer = '', findings = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => findProductionPlaceholders(item, `${pointer}/${index}`, findings))
    return findings
  }
  if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      findProductionPlaceholders(item, `${pointer}/${key}`, findings)
    }
    return findings
  }
  if (typeof value === 'string' && productionPlaceholderPattern.test(value)) {
    findings.push({ path: pointer, code: 'PRODUCTION_PLACEHOLDER_FORBIDDEN' })
  }
  return findings
}

function semanticErrors(profile) {
  const errors = walk(profile)
  if (profile.installProfile === 'community') {
    if (profile.commercialAuthorization.enforcement !== 'community') {
      errors.push({ path: '/commercialAuthorization/enforcement', code: 'COMMUNITY_ENFORCEMENT_REQUIRED' })
    }
    if (profile.commercialAuthorization.leaseRequired !== false) {
      errors.push({ path: '/commercialAuthorization/leaseRequired', code: 'COMMUNITY_LEASE_MUST_BE_DISABLED' })
    }
  } else if (profile.commercialAuthorization.enforcement !== 'required'
      || profile.commercialAuthorization.leaseRequired !== true) {
    errors.push({ path: '/commercialAuthorization', code: 'COMMERCIAL_LICENSE_ENFORCEMENT_REQUIRED' })
  }
  if (profile.metadata.environment === 'production') {
    errors.push(...findProductionPlaceholders(profile))
    if (!profile.deployment.identity) {
      errors.push({ path: '/deployment/identity', code: 'PRODUCTION_DEPLOYMENT_IDENTITY_REQUIRED' })
    }
  }
  if (profile.deployment.identity?.workbenchProfile === 'default') {
    errors.push({ path: '/deployment/identity/workbenchProfile', code: 'DEFAULT_WORKBENCH_PROFILE_FORBIDDEN' })
  }
  if (profile.deployment.identity?.workbenchProfile === 'unconfirmed') {
    errors.push({ path: '/deployment/identity/workbenchProfile', code: 'UNCONFIRMED_WORKBENCH_PROFILE_FORBIDDEN' })
  }
  const ports = [profile.deployment.ports.api, profile.deployment.ports.website]
  if (new Set(ports).size !== ports.length) {
    errors.push({ path: '/deployment/ports', code: 'PORT_COLLISION' })
  }
  const roots = Object.values(profile.deployment.paths)
  if (new Set(roots).size !== roots.length) {
    errors.push({ path: '/deployment/paths', code: 'PATH_COLLISION' })
  }
  for (const [key, rule] of Object.entries(deploymentRootRules)) {
    const value = profile.deployment.paths[key]
    if (!rule.test(value) || path.posix.normalize(value) !== value) {
      errors.push({ path: `/deployment/paths/${key}`, code: 'UNSAFE_DEPLOYMENT_ROOT' })
    }
  }
  for (const [index, left] of roots.entries()) {
    for (const right of roots.slice(index + 1)) {
      if (left.startsWith(`${right}/`) || right.startsWith(`${left}/`)) {
        errors.push({ path: '/deployment/paths', code: 'NESTED_DEPLOYMENT_ROOTS' })
      }
    }
  }
  if (profile.database.tlsMode === 'disabled-loopback-only'
      && !['127.0.0.1', 'localhost'].includes(profile.database.host)) {
    errors.push({ path: '/database/tlsMode', code: 'REMOTE_DATABASE_TLS_REQUIRED' })
  }
  if (profile.database.migration?.username === profile.database.username) {
    errors.push({ path: '/database/migration/username', code: 'DATABASE_MIGRATION_ACCOUNT_MUST_DIFFER_FROM_RUNTIME' })
  }
  if (profile.database.backup
      && profile.database.backup.username === profile.database.migration?.username) {
    errors.push({ path: '/database/backup/username', code: 'DATABASE_BACKUP_ACCOUNT_MUST_DIFFER_FROM_MIGRATION' })
  }
  if (profile.storage.privateBucket === profile.storage.assetsBucket) {
    errors.push({ path: '/storage', code: 'PRIVATE_AND_ASSETS_BUCKET_MUST_DIFFER' })
  }
  if (profile.capabilities.payment.enabled && !profile.miniProgram.enabled) {
    errors.push({ path: '/capabilities/payment', code: 'PAYMENT_DEPENDS_ON_MINI_PROGRAM' })
  }
  const actionIds = new Set(profile.externalActions.map((action) => action.id))
  if (profile.tls.externalActionId && !actionIds.has(profile.tls.externalActionId)) {
    errors.push({ path: '/tls/externalActionId', code: 'EXTERNAL_ACTION_NOT_FOUND' })
  }
  for (const id of profile.miniProgram.platformActionIds || []) {
    if (!actionIds.has(id)) errors.push({ path: '/miniProgram/platformActionIds', code: 'EXTERNAL_ACTION_NOT_FOUND', id })
  }
  if (profile.metadata.environment === 'production' && profile.miniProgram.appId === 'wxEXAMPLE000000000') {
    errors.push({ path: '/miniProgram/appId', code: 'SYNTHETIC_APP_ID_FORBIDDEN_IN_PRODUCTION' })
  }
  return errors
}

function fileReferenceErrors(profile, profileRoot) {
  const errors = []
  const visit = (value, pointer = '') => {
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, `${pointer}/${index}`))
      return
    }
    if (value && typeof value === 'object') {
      for (const [key, item] of Object.entries(value)) visit(item, `${pointer}/${key}`)
      return
    }
    if (typeof value !== 'string') return
    let relative
    if (value.startsWith('asset://')) relative = value.replace(/^asset:\/\//, '')
    if (value.startsWith('file://certificates/')) relative = value.replace(/^file:\/\//, '')
    if (!relative) return
    try {
      const filePath = resolveInside(profileRoot, relative, pointer)
      if (!existsSync(filePath)) errors.push({ path: pointer, code: 'REFERENCED_FILE_MISSING', relative })
    } catch (error) {
      errors.push({ path: pointer, code: 'REFERENCED_FILE_UNSAFE' })
    }
  }
  visit(profile)
  return errors
}

export function validateProfileDocuments({ profilePath, secretsPath, schemaPath }) {
  const profile = readYaml(profilePath)
  const schemaErrors = validateSchema(profile, schemaPath)
  const semantic = schemaErrors.length
    ? []
    : [...semanticErrors(profile), ...fileReferenceErrors(profile, path.dirname(path.resolve(profilePath)))]
  let secretErrors = []
  let refs
  if (secretsPath) {
    refs = readYaml(secretsPath)
    secretErrors = validateSecretReferences(refs, profile)
  } else {
    secretErrors = [...collectSecretUris(profile)].map((uri) => ({
      path: `/refs/${secretId(uri)}`,
      message: 'secrets.refs.yaml is required',
    }))
  }
  const errors = [...schemaErrors, ...semantic, ...secretErrors]
  return {
    valid: errors.length === 0,
    profile,
    refs,
    profilePath: path.resolve(profilePath),
    secretsPath: secretsPath ? path.resolve(secretsPath) : null,
    profileFingerprint: sha256Object(profile),
    errors,
  }
}

export function assertProfileDocuments(options) {
  const result = validateProfileDocuments(options)
  if (!result.valid) {
    throw new YhtError('Customer deployment profile validation failed', {
      code: 'PROFILE_INVALID',
      details: result.errors,
    })
  }
  assertSchema(result.profile, options.schemaPath)
  return result
}
