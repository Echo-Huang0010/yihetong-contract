import path from 'node:path'
import { defaultAuthorityMapPath, getPath, readJson, sha256Object, YhtError } from './common.mjs'
import { secretId } from './secrets.mjs'

export function loadAuthorityMap(mapPath = defaultAuthorityMapPath) {
  const map = readJson(mapPath)
  if (map.version !== '1.0.0' || !Array.isArray(map.fields)) {
    throw new YhtError('Profile authority map is invalid', { code: 'AUTHORITY_MAP_INVALID' })
  }
  return map
}

function jdbcUrl(database) {
  const params = new URLSearchParams({
    characterEncoding: 'UTF-8',
    serverTimezone: 'Asia/Shanghai',
    allowMultiQueries: 'true',
    useSSL: database.tlsMode === 'disabled-loopback-only' ? 'false' : 'true',
    requireSSL: database.tlsMode === 'required' ? 'true' : 'false',
  })
  if (database.tlsMode === 'disabled-loopback-only') params.set('allowPublicKeyRetrieval', 'true')
  return `jdbc:mysql://${database.host}:${database.port}/${database.name}?${params.toString()}`
}

function transformValue(field, value, profile, secrets, profileRoot) {
  if (value === undefined && field.default !== undefined) value = field.default
  if (value === undefined) return undefined
  if (field.transform === 'urlHost') return new URL(value).host
  if (field.transform === 'jdbcUrl') return jdbcUrl(value)
  if (field.transform === 'secret') {
    const secret = secrets[secretId(value)]
    if (typeof secret === 'string' && /[\0\r\n]/.test(secret)) {
      throw new YhtError(`Secret for ${field.profilePath} cannot be rendered into an environment file`, {
        code: 'SECRET_ENV_VALUE_INVALID',
      })
    }
    return secret
  }
  if (field.transform === 'secretFile') {
    const secret = secrets[secretId(value)]
    if (typeof secret === 'string' && secret.includes('\0')) {
      throw new YhtError(`Secret file for ${field.profilePath} contains a NUL byte`, {
        code: 'SECRET_FILE_VALUE_INVALID',
      })
    }
    return path.posix.join(profile.deployment.paths.configRoot, field.restrictedFilePath)
  }
  if (field.transform === 'restrictedFile') {
    const relative = value.replace(/^file:\/\//, '')
    return path.posix.join(profile.deployment.paths.configRoot, relative)
  }
  if (field.transform === 'configRelativePath') {
    return path.posix.join(profile.deployment.paths.configRoot, String(value))
  }
  if (field.transform === 'dataRelativePath') {
    return path.posix.join(profile.deployment.paths.dataRoot, String(value))
  }
  if (field.transform === 'assetUri') {
    if (!value.startsWith('asset://')) return value
    const relative = value.replace(/^asset:\/\//, '')
    return `${profile.deployment.endpoints.websiteBaseUrl}/customer-assets/${relative.replace(/^assets\//, '')}`
  }
  if (field.transform === 'assetUriArrayJson') {
    return JSON.stringify(value.map((item) => {
      if (!item.startsWith('asset://')) return item
      const relative = item.replace(/^asset:\/\//, '')
      return `${profile.deployment.endpoints.websiteBaseUrl}/customer-assets/${relative.replace(/^assets\//, '')}`
    }))
  }
  if (field.transform === 'jsonString') return JSON.stringify(value)
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  return String(value)
}

export function materializeAuthority({ profile, secrets = {}, mapPath, profileRoot = process.cwd() }) {
  if (profile.redis.user.host === profile.redis.default.host
      && profile.redis.user.port === profile.redis.default.port) {
    const userPassword = secrets[secretId(profile.redis.user.passwordRef)]
    const defaultPassword = secrets[secretId(profile.redis.default.passwordRef)]
    const unresolved = [userPassword, defaultPassword].some((value) => String(value || '').startsWith('<secret:'))
    if (!unresolved && userPassword !== undefined && defaultPassword !== undefined && userPassword !== defaultPassword) {
      throw new YhtError('Redis connections sharing one host and port must resolve to the same password', {
        code: 'REDIS_SHARED_INSTANCE_PASSWORD_MISMATCH',
      })
    }
  }
  const map = loadAuthorityMap(mapPath)
  const records = []
  for (const field of map.fields) {
    const sourceValue = getPath(profile, field.profilePath)
    if (sourceValue === undefined && field.default === undefined) {
      if (field.optional) continue
      throw new YhtError(`Required authority mapping value is missing: ${field.profilePath}`, {
        code: 'AUTHORITY_VALUE_MISSING',
      })
    }
    const value = transformValue(field, sourceValue, profile, secrets, profileRoot)
    if (value === undefined && field.optional) continue
    records.push({ ...field, value })
  }
  const environment = {}
  const deployDatabase = {}
  const brandDatabase = {}
  const buildInputs = {}
  const restrictedFiles = {}
  for (const record of records) {
    if (record.env) environment[record.env] = record.value
    if (record.registryKey) deployDatabase[record.registryKey] = {
      value: record.value,
      sensitive: Boolean(record.sensitive),
      authority: record.authority,
      priority: record.priority,
    }
    if (record.brandColumn) brandDatabase[record.brandColumn] = record.value
    if (record.authority === 'build_input' && record.env) buildInputs[record.env] = record.value
    if (record.buildEnv) buildInputs[record.buildEnv] = record.value
    if (record.transform === 'secretFile') {
      if (!record.restrictedFilePath || !record.restrictedFilePath.startsWith('certificates/')) {
        throw new YhtError(`Restricted secret file path is invalid: ${record.profilePath}`, {
          code: 'RESTRICTED_FILE_PATH_INVALID',
        })
      }
      restrictedFiles[record.restrictedFilePath] = secrets[secretId(getPath(profile, record.profilePath))]
    }
  }
  environment.SERVER_ADDRESS = '127.0.0.1'
  if (profile.deployment.identity) {
    const targetIdentity = {
      customerCode: profile.metadata.customerCode,
      targetId: profile.deployment.identity.targetId,
      provider: profile.deployment.identity.provider,
      region: profile.deployment.identity.region,
      instanceId: profile.deployment.identity.instanceId,
      endpoints: profile.deployment.endpoints,
      miniProgramAppId: profile.miniProgram.enabled ? profile.miniProgram.appId : '',
      brandProjectName: profile.brand.projectName,
      brandCompanyName: profile.brand.companyName,
    }
    environment.YHT_DEPLOYMENT_TARGET_ID = targetIdentity.targetId
    environment.YHT_DEPLOYMENT_PROVIDER = targetIdentity.provider
    environment.YHT_DEPLOYMENT_REGION = targetIdentity.region
    environment.YHT_DEPLOYMENT_INSTANCE_ID = targetIdentity.instanceId
    environment.YHT_DEPLOYMENT_WORKBENCH_PROFILE = profile.deployment.identity.workbenchProfile
    environment.YHT_DEPLOYMENT_CUSTOMER_CODE = targetIdentity.customerCode
    environment.YHT_DEPLOYMENT_TARGET_FINGERPRINT = sha256Object(targetIdentity)
  }
  return {
    map,
    records,
    environment,
    deployDatabase,
    brandDatabase,
    buildInputs,
    restrictedFiles,
    authorityFingerprint: sha256Object({ version: map.version, fields: map.fields }),
  }
}

export function driftPlan({ deployRows = [], authority, compatibilityMode }) {
  const intended = authority.deployDatabase
  const findings = []
  const seen = new Set()
  for (const row of deployRows) {
    const key = row.configKey ?? row.config_key
    const value = row.configValue ?? row.config_value ?? ''
    const sensitive = Boolean(row.sensitive) || Boolean(intended[key]?.sensitive)
    seen.add(key)
    if (!intended[key]) {
      findings.push({ key, severity: 'warning', code: 'UNKNOWN_DB_OVERRIDE', sensitive })
      continue
    }
    if (sensitive && !compatibilityMode) {
      findings.push({ key, severity: 'error', code: 'SENSITIVE_DB_OVERRIDE_BLOCKED', sensitive: true })
      continue
    }
    if (sensitive) {
      findings.push({ key, severity: 'warning', code: 'SENSITIVE_DB_OVERRIDE_COMPATIBILITY', sensitive: true })
      continue
    }
    if (String(value).trim() !== String(intended[key].value).trim()) {
      findings.push({
        key,
        severity: 'warning',
        code: 'DEPLOY_DB_OVERRIDES_PROFILE',
        sensitive: false,
      })
    }
  }
  for (const [key, target] of Object.entries(intended)) {
    if (!seen.has(key) && target.authority === 'deploy_db') {
      findings.push({ key, severity: 'info', code: 'PROFILE_FALLBACK_TO_ENV', sensitive: Boolean(target.sensitive) })
    }
  }
  return {
    status: findings.some((item) => item.severity === 'error') ? 'blocked' : 'ready',
    compatibilityMode,
    rowsChecked: deployRows.length,
    findings,
  }
}
