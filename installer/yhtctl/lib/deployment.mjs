import { readFileSync } from 'node:fs'
import path from 'node:path'
import { driftPlan, materializeAuthority } from './authority.mjs'
import { readJson, repoRoot, resolveInside, sha256, sha256Object } from './common.mjs'

const productionPlaceholderPattern = /(production[-_]?required|example\.invalid|00000000-0000-4000-8000-000000000001)/i
const digestPattern = /^[a-f0-9]{64}$/
const officialAssetSourceRoots = ['website/public/', 'esign-mini/static/']

function finding(category, pathName, code) {
  return { category, path: pathName, code }
}

function collectProductionPlaceholders(value, pointer = '', findings = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectProductionPlaceholders(item, `${pointer}/${index}`, findings))
    return findings
  }
  if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      collectProductionPlaceholders(item, `${pointer}/${key}`, findings)
    }
    return findings
  }
  if (typeof value === 'string' && productionPlaceholderPattern.test(value)) {
    findings.push(finding('production_missing', pointer, 'PRODUCTION_PLACEHOLDER'))
  }
  return findings
}

export function productionReadiness(profile) {
  const findings = collectProductionPlaceholders(profile)
  if (profile.metadata.environment !== 'production') {
    findings.push(finding('production_missing', '/metadata/environment', 'PRODUCTION_PROFILE_REQUIRED'))
  }
  if (!profile.deployment.identity) {
    findings.push(finding('production_missing', '/deployment/identity', 'DEPLOYMENT_IDENTITY_REQUIRED'))
  }
  const workbenchProfile = profile.deployment.identity?.workbenchProfile
  if (!workbenchProfile || ['default', 'unconfirmed'].includes(workbenchProfile)) {
    findings.push(finding('production_missing', '/deployment/identity/workbenchProfile', 'NAMED_WORKBENCH_PROFILE_REQUIRED'))
  }
  if (!profile.brand.websiteEnabled) {
    findings.push(finding('decision_required', '/brand/websiteEnabled', 'WEBSITE_ENABLEMENT_DECISION_REQUIRED'))
  }
  if (!profile.miniProgram.enabled) {
    findings.push(finding('decision_required', '/miniProgram/enabled', 'MINI_PROGRAM_ENABLEMENT_DECISION_REQUIRED'))
  }
  for (const [name, capability] of Object.entries(profile.capabilities)) {
    if (!capability.enabled) {
      findings.push(finding('decision_required', `/capabilities/${name}/enabled`, 'CAPABILITY_ENABLEMENT_DECISION_REQUIRED'))
    }
  }
  profile.externalActions.forEach((action, index) => {
    if (action.state === 'user-final-required') {
      findings.push(finding('user_final_required', `/externalActions/${index}`, 'EXTERNAL_ACTION_USER_FINAL_REQUIRED'))
    }
  })
  return {
    status: findings.some((item) => item.category === 'production_missing') ? 'blocked' : 'ready',
    findings,
  }
}

function endpointHosts(endpoints) {
  return {
    api: new URL(endpoints.apiBaseUrl).host,
    manage: new URL(endpoints.manageBaseUrl).host,
    user: new URL(endpoints.userBaseUrl).host,
    h5: new URL(endpoints.h5BaseUrl).host,
    website: new URL(endpoints.websiteBaseUrl).host,
  }
}

export function expectedProfileTarget(profile) {
  const identity = profile.deployment.identity || {}
  return {
    customerCode: profile.metadata.customerCode,
    targetId: identity.targetId,
    workbenchProfile: identity.workbenchProfile,
    provider: identity.provider,
    region: identity.region,
    instanceId: identity.instanceId,
    endpoints: endpointHosts(profile.deployment.endpoints),
    database: {
      engine: profile.database.engine,
      host: profile.database.host,
      port: profile.database.port,
      name: profile.database.name,
    },
    miniProgram: {
      enabled: profile.miniProgram.enabled,
      appId: profile.miniProgram.enabled ? profile.miniProgram.appId : null,
    },
    brand: {
      projectName: profile.brand.projectName,
      companyName: profile.brand.companyName,
    },
  }
}

function compareExpected(expected, actual, pointer, findings) {
  if (Array.isArray(expected)) {
    if (!Array.isArray(actual) || actual.length !== expected.length) {
      findings.push(finding('production_missing', pointer, 'TARGET_FIELD_MISMATCH'))
      return
    }
    expected.forEach((value, index) => compareExpected(value, actual[index], `${pointer}/${index}`, findings))
    return
  }
  if (expected && typeof expected === 'object' && !Array.isArray(expected)) {
    if (!actual || typeof actual !== 'object' || Array.isArray(actual)) {
      findings.push(finding('production_missing', pointer, 'TARGET_FIELD_MISSING_OR_INVALID'))
      return
    }
    for (const [key, value] of Object.entries(expected)) {
      compareExpected(value, actual[key], `${pointer}/${key}`, findings)
    }
    return
  }
  if (actual !== expected) findings.push(finding('production_missing', pointer, 'TARGET_FIELD_MISMATCH'))
}

function rejectUnexpectedKeys(value, allowed, pointer, findings, code = 'UNEXPECTED_SNAPSHOT_FIELD') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) findings.push(finding('production_missing', `${pointer}/${key}`, code))
  }
}

function targetSnapshotCheck(profile, snapshot) {
  const expected = expectedProfileTarget(profile)
  const findings = []
  if (!snapshot) {
    findings.push(finding('production_missing', '/targetSnapshot', 'TARGET_SNAPSHOT_REQUIRED'))
    return { status: 'blocked', expectedFingerprint: sha256Object(expected), targetFingerprint: null, findings }
  }
  if (snapshot.apiVersion !== 'yht.io/v1' || snapshot.kind !== 'DeploymentTargetSnapshot') {
    findings.push(finding('production_missing', '/targetSnapshot', 'TARGET_SNAPSHOT_CONTRACT_INVALID'))
  }
  rejectUnexpectedKeys(snapshot, ['apiVersion', 'kind', 'operator', 'anchor', 'cloud', 'runtime'], '/targetSnapshot', findings)
  const anchor = snapshot.anchor
  if (!anchor || typeof anchor !== 'object') {
    findings.push(finding('production_missing', '/targetSnapshot/anchor', 'TARGET_ANCHOR_REQUIRED'))
    return { status: 'blocked', expectedFingerprint: sha256Object(expected), targetFingerprint: null, findings }
  }
  rejectUnexpectedKeys(anchor, ['customerCode', 'targetId', 'workbenchProfile', 'provider', 'region', 'instanceId', 'endpoints', 'database', 'miniProgram', 'brand', 'targetFingerprint'], '/targetSnapshot/anchor', findings)
  rejectUnexpectedKeys(anchor.endpoints, ['api', 'manage', 'user', 'h5', 'website'], '/targetSnapshot/anchor/endpoints', findings)
  rejectUnexpectedKeys(anchor.database, ['engine', 'host', 'port', 'name', 'serverUuid'], '/targetSnapshot/anchor/database', findings)
  rejectUnexpectedKeys(anchor.miniProgram, ['enabled', 'appId'], '/targetSnapshot/anchor/miniProgram', findings)
  rejectUnexpectedKeys(anchor.brand, ['projectName', 'companyName'], '/targetSnapshot/anchor/brand', findings)
  rejectUnexpectedKeys(snapshot.operator, ['workbenchProfile'], '/targetSnapshot/operator', findings)
  rejectUnexpectedKeys(snapshot.cloud, ['provider', 'region', 'instanceId'], '/targetSnapshot/cloud', findings)
  rejectUnexpectedKeys(snapshot.runtime, ['installationState', 'endpoints', 'database', 'miniProgram', 'brand'], '/targetSnapshot/runtime', findings)
  rejectUnexpectedKeys(snapshot.runtime?.endpoints, ['api', 'manage', 'user', 'h5', 'website'], '/targetSnapshot/runtime/endpoints', findings)
  rejectUnexpectedKeys(snapshot.runtime?.database, ['engine', 'host', 'port', 'name', 'serverUuid'], '/targetSnapshot/runtime/database', findings)
  rejectUnexpectedKeys(snapshot.runtime?.miniProgram, ['enabled', 'appId'], '/targetSnapshot/runtime/miniProgram', findings)
  rejectUnexpectedKeys(snapshot.runtime?.brand, ['projectName', 'companyName'], '/targetSnapshot/runtime/brand', findings)
  compareExpected(expected, anchor, '/targetSnapshot/anchor', findings)
  if (!anchor.database?.serverUuid || !/^[a-f0-9-]{36}$/i.test(anchor.database.serverUuid)) {
    findings.push(finding('production_missing', '/targetSnapshot/anchor/database/serverUuid', 'DATABASE_SERVER_UUID_REQUIRED'))
  }
  if (['default', 'unconfirmed'].includes(anchor.workbenchProfile)) {
    findings.push(finding('production_missing', '/targetSnapshot/anchor/workbenchProfile', 'NAMED_WORKBENCH_PROFILE_REQUIRED'))
  }
  const { targetFingerprint, ...unsignedAnchor } = anchor
  const recomputedFingerprint = sha256Object(unsignedAnchor)
  if (!digestPattern.test(String(targetFingerprint || '')) || targetFingerprint !== recomputedFingerprint) {
    findings.push(finding('production_missing', '/targetSnapshot/anchor/targetFingerprint', 'TARGET_FINGERPRINT_MISMATCH'))
  }
  compareExpected({ workbenchProfile: anchor.workbenchProfile }, snapshot.operator, '/targetSnapshot/operator', findings)
  compareExpected(
    { provider: anchor.provider, region: anchor.region, instanceId: anchor.instanceId },
    snapshot.cloud,
    '/targetSnapshot/cloud',
    findings,
  )
  compareExpected(
    {
      endpoints: anchor.endpoints,
      database: anchor.database,
      miniProgram: anchor.miniProgram,
      brand: anchor.brand,
    },
    snapshot.runtime,
    '/targetSnapshot/runtime',
    findings,
  )
  if (!['absent', 'present'].includes(snapshot.runtime?.installationState)) {
    findings.push(finding('production_missing', '/targetSnapshot/runtime/installationState', 'INSTALLATION_STATE_REQUIRED'))
  }
  return {
    status: findings.length ? 'blocked' : 'ready',
    expectedFingerprint: sha256Object(expected),
    targetFingerprint: findings.some((item) => item.code === 'TARGET_FINGERPRINT_MISMATCH') ? null : recomputedFingerprint,
    installationState: snapshot.runtime?.installationState || 'unknown',
    findings,
  }
}

export function verifyAssetManifest({ manifestPath, profileRoot, sourceRoot = repoRoot }) {
  const manifest = readJson(manifestPath)
  const findings = []
  if (manifest.schema !== 'yihetong-official-assets-manifest-v1' || !Array.isArray(manifest.assets)) {
    findings.push(finding('production_missing', '/assetManifest', 'ASSET_MANIFEST_CONTRACT_INVALID'))
  }
  for (const [index, asset] of (manifest.assets || []).entries()) {
    const pointer = `/assetManifest/assets/${index}`
    const source = String(asset.source || '')
    const packaged = String(asset.path || '')
    const sourcePrefix = officialAssetSourceRoots.find((prefix) => source.startsWith(prefix))
    if (!sourcePrefix || !packaged.startsWith('assets/')) {
      findings.push(finding('production_missing', pointer, 'ASSET_SOURCE_NOT_CANONICAL'))
      continue
    }
    try {
      const packagedPath = resolveInside(path.join(profileRoot, 'assets'), packaged.slice('assets/'.length), `${pointer}/path`)
      const sourcePath = resolveInside(path.join(sourceRoot, sourcePrefix.slice(0, -1)), source.slice(sourcePrefix.length), `${pointer}/source`)
      const packagedBytes = readFileSync(packagedPath)
      const sourceBytes = readFileSync(sourcePath)
      if (packagedBytes.length !== asset.bytes) findings.push(finding('production_missing', `${pointer}/bytes`, 'ASSET_BYTES_MISMATCH'))
      if (sha256(packagedBytes) !== asset.sha256) findings.push(finding('production_missing', `${pointer}/sha256`, 'PACKAGED_ASSET_HASH_MISMATCH'))
      if (sha256(sourceBytes) !== asset.sha256) findings.push(finding('production_missing', `${pointer}/source`, 'SOURCE_ASSET_HASH_MISMATCH'))
    } catch {
      findings.push(finding('production_missing', pointer, 'ASSET_FILE_MISSING_OR_UNSAFE'))
    }
  }
  const fileSet = (manifest.assets || []).map(({ path: assetPath, bytes, sha256: digest }) => ({ path: assetPath, bytes, sha256: digest }))
  return {
    status: findings.length ? 'blocked' : 'ready',
    manifestFingerprint: sha256Object(manifest),
    fileSetFingerprint: sha256Object(fileSet),
    assetCount: fileSet.length,
    findings,
  }
}

function databaseSnapshotCheck(manifest, manifestFingerprint, snapshot) {
  const findings = []
  if (!manifest.schemaContract) {
    findings.push(finding('production_missing', '/databaseManifest/schemaContract', 'CANONICAL_SCHEMA_CONTRACT_REQUIRED'))
  }
  if (!snapshot) {
    findings.push(finding('production_missing', '/databaseSchemaSnapshot', 'DATABASE_SCHEMA_SNAPSHOT_REQUIRED'))
  } else {
    rejectUnexpectedKeys(snapshot, ['apiVersion', 'kind', 'databaseManifestFingerprint', 'schemaContract'], '/databaseSchemaSnapshot', findings)
    if (snapshot.apiVersion !== 'yht.io/v1' || snapshot.kind !== 'DatabaseSchemaSnapshot') {
      findings.push(finding('production_missing', '/databaseSchemaSnapshot', 'DATABASE_SCHEMA_SNAPSHOT_CONTRACT_INVALID'))
    }
    if (snapshot.databaseManifestFingerprint !== manifestFingerprint) {
      findings.push(finding('production_missing', '/databaseSchemaSnapshot/databaseManifestFingerprint', 'DATABASE_MANIFEST_FINGERPRINT_MISMATCH'))
    }
    if (manifest.schemaContract) {
      compareExpected(manifest.schemaContract, snapshot.schemaContract, '/databaseSchemaSnapshot/schemaContract', findings)
    }
  }
  return { status: findings.length ? 'blocked' : 'ready', manifestFingerprint, findings }
}

function runtimeAssetCheck(localAssets, installationState, snapshot) {
  const findings = []
  if (localAssets.status === 'blocked') findings.push(...localAssets.findings)
  if (installationState === 'present') {
    if (!snapshot) {
      findings.push(finding('production_missing', '/runtimeAssetsSnapshot', 'RUNTIME_ASSETS_SNAPSHOT_REQUIRED'))
    } else {
      rejectUnexpectedKeys(snapshot, ['apiVersion', 'kind', 'manifestFingerprint', 'fileSetFingerprint'], '/runtimeAssetsSnapshot', findings)
      if (snapshot.apiVersion !== 'yht.io/v1' || snapshot.kind !== 'RuntimeAssetsSnapshot') {
        findings.push(finding('production_missing', '/runtimeAssetsSnapshot', 'RUNTIME_ASSETS_SNAPSHOT_CONTRACT_INVALID'))
      }
      if (snapshot.manifestFingerprint !== localAssets.manifestFingerprint) {
        findings.push(finding('production_missing', '/runtimeAssetsSnapshot/manifestFingerprint', 'RUNTIME_ASSET_MANIFEST_MISMATCH'))
      }
      if (snapshot.fileSetFingerprint !== localAssets.fileSetFingerprint) {
        findings.push(finding('production_missing', '/runtimeAssetsSnapshot/fileSetFingerprint', 'RUNTIME_ASSET_FILE_SET_MISMATCH'))
      }
    }
  }
  return {
    status: findings.length ? 'blocked' : 'ready',
    installationState,
    manifestFingerprint: localAssets.manifestFingerprint,
    fileSetFingerprint: localAssets.fileSetFingerprint,
    localAssetCount: localAssets.assetCount,
    findings,
  }
}

function sanitizedDeploySnapshotFindings(deployRows, authority) {
  const findings = []
  const allowedKeys = ['configKey', 'config_key', 'configValue', 'config_value', 'sensitive', 'configured', 'valueState']
  for (const [index, row] of deployRows.entries()) {
    rejectUnexpectedKeys(row, allowedKeys, `/deployDbSnapshot/rows/${index}`, findings, 'UNEXPECTED_DEPLOY_SNAPSHOT_FIELD')
    const key = row.configKey ?? row.config_key
    const value = row.configValue ?? row.config_value
    const sensitive = Boolean(row.sensitive) || Boolean(authority.deployDatabase[key]?.sensitive) || /(password|secret|private.?key|api.?key|access.?key|token)/i.test(String(key || ''))
    if (sensitive && value !== undefined && value !== null && !['', '<redacted>'].includes(String(value))) {
      findings.push(finding('production_missing', `/deployDbSnapshot/rows/${index}`, 'SENSITIVE_SNAPSHOT_VALUE_FORBIDDEN'))
    }
  }
  return findings
}

function sanitizeDriftFindings(findings, authority) {
  return findings.map(({ key, ...item }) => (
    authority.deployDatabase[key]
      ? { key, ...item }
      : { keyFingerprint: sha256(String(key || '')), ...item }
  ))
}

export function buildDeploymentPreflight({
  profileResult,
  secrets,
  deployRows = [],
  deploySnapshotProvided = false,
  targetSnapshot = null,
  databaseSchemaSnapshot = null,
  runtimeAssetsSnapshot = null,
  databaseManifestPath = path.join(repoRoot, 'deploy', 'sql', 'fresh-install-manifest.json'),
  assetManifestPath,
  authorityMapPath,
  toolVersion = 'development',
  toolImplementationFingerprint = 'development',
}) {
  const authority = materializeAuthority({
    profile: profileResult.profile,
    secrets,
    mapPath: authorityMapPath,
    profileRoot: path.dirname(profileResult.profilePath),
  })
  const readiness = productionReadiness(profileResult.profile)
  const target = targetSnapshotCheck(profileResult.profile, targetSnapshot)
  const snapshotFindings = sanitizedDeploySnapshotFindings(deployRows, authority)
  const drift = driftPlan({
    deployRows,
    authority,
    compatibilityMode: profileResult.profile.security.sensitiveDbCompatibilityMode,
  })
  const configuration = !deploySnapshotProvided
    ? {
        status: 'blocked',
        action: 'snapshot_required',
        compatibilityMode: profileResult.profile.security.sensitiveDbCompatibilityMode,
        rowsChecked: 0,
        findings: [finding('production_missing', '/deployDbSnapshot', 'DEPLOY_DB_SNAPSHOT_REQUIRED')],
      }
    : snapshotFindings.length
      ? {
          status: 'blocked',
          action: 'sanitized_snapshot_required',
          compatibilityMode: profileResult.profile.security.sensitiveDbCompatibilityMode,
          rowsChecked: deployRows.length,
          findings: snapshotFindings,
        }
      : {
          status: drift.status,
          action: drift.findings.some((item) => item.severity === 'warning') ? 'controlled_update_required' : 'no_blocking_delta',
          ...drift,
          findings: sanitizeDriftFindings(drift.findings, authority),
        }
  const databaseManifest = readJson(databaseManifestPath)
  const databaseManifestFingerprint = sha256Object(databaseManifest)
  const database = databaseSnapshotCheck(databaseManifest, databaseManifestFingerprint, databaseSchemaSnapshot)
  const localAssets = verifyAssetManifest({
    manifestPath: assetManifestPath,
    profileRoot: path.dirname(profileResult.profilePath),
  })
  const assets = runtimeAssetCheck(localAssets, target.installationState || 'unknown', runtimeAssetsSnapshot)
  const gates = { profile: readiness.status, target: target.status, configuration: configuration.status, database: database.status, assets: assets.status }
  const blocked = Object.values(gates).includes('blocked')
  const plan = {
    apiVersion: 'yht.io/v1',
    kind: 'DeploymentPreflightPlan',
    contractVersion: '1.0.0',
    tool: { name: 'yhtctl', version: toolVersion, implementationFingerprint: toolImplementationFingerprint },
    status: blocked ? 'blocked' : 'ready_for_authorization',
    completionCeiling: 'deployment_plan_ready',
    profile: {
      customerCode: profileResult.profile.metadata.customerCode,
      profileRevision: profileResult.profile.metadata.profileRevision,
      environment: profileResult.profile.metadata.environment,
      profileFingerprint: profileResult.profileFingerprint,
      authorityFingerprint: authority.authorityFingerprint,
      readiness,
    },
    target,
    configuration,
    database,
    assets,
    gates,
    orderedActions: [
      { order: 1, id: 'bind-independent-target', status: target.status },
      { order: 2, id: 'classify-profile-and-config-delta', status: readiness.status === 'blocked' || configuration.status === 'blocked' ? 'blocked' : configuration.action },
      { order: 3, id: 'verify-database-schema-contract', status: database.status },
      { order: 4, id: 'verify-official-assets', status: assets.status },
      { order: 5, id: 'create-backup-and-rollback-point', status: 'not_authorized' },
      { order: 6, id: 'apply-minimal-release', status: 'not_authorized' },
      { order: 7, id: 'six-end-and-business-acceptance', status: 'user_final_required' },
    ],
    forbiddenConclusions: [
      'a build, ZIP, HTTP 200 or receipt is not a server release',
      'a server release is not six-end availability',
      'six-end availability is not third-party callback, customer UAT or commercial acceptance',
    ],
  }
  plan.planDigest = sha256Object(plan)
  return { plan, authority }
}
