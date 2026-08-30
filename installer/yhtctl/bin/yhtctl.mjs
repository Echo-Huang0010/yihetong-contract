#!/usr/bin/env node

import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { createInterface } from 'node:readline/promises'
import {
  atomicWrite,
  canonicalJson,
  cliRoot,
  defaultAuthorityMapPath,
  defaultSchemaPath,
  jsonResult,
  parseArgs,
  readJson,
  sha256Object,
  YhtError,
} from '../lib/common.mjs'
import { driftPlan, materializeAuthority } from '../lib/authority.mjs'
import { createConfigurationWorkspace } from '../lib/config-init.mjs'
import { buildDeploymentPreflight } from '../lib/deployment.mjs'
import { queryInstalledDeployRows, install, installationStatus, verifyInstallation, createBackup, rollback } from '../lib/installation.mjs'
import { packageSummary, verifyPackage } from '../lib/package.mjs'
import { prepareDocumentDependencies } from '../lib/prepare.mjs'
import { assertProfileDocuments, validateProfileDocuments } from '../lib/profile.mjs'
import { renderConfiguration } from '../lib/render.mjs'
import {
  collectSecretsForBundle,
  encryptSecretBundle,
  resolveSecrets,
} from '../lib/secrets.mjs'
import { doctorChecks } from '../lib/system.mjs'
import {
  activateCommercialLicense,
  activationTrustBundleFingerprint,
  activationFileDescriptors,
  applyTrustTransition,
  assertCommercialAuthorization,
  createInstanceRequest,
  evaluateCommercialAuthorization,
  generateInstanceIdentity,
  loadOfficialTrustBundle,
  refreshCommercialLease,
} from '../lib/license.mjs'

const packageJson = readJson(path.join(cliRoot, 'package.json'))

function help() {
  return `yhtctl ${packageJson.version}

Usage:
  yhtctl doctor [--profile FILE] [--json]
  yhtctl prepare --package-root DIR [--yes] [--json]
  yhtctl config init --output DIR [--answers FILE | --interactive | command options]
  yhtctl config validate --profile FILE --secrets FILE [--json]
  yhtctl config plan --profile FILE --secrets FILE [--deploy-db-snapshot FILE] [--json]
  yhtctl config render --profile FILE --secrets FILE [--secrets-bundle FILE] [--output DIR]
  yhtctl config update --profile FILE --secrets FILE --package-root DIR --yes
  yhtctl config secrets pack --secrets FILE --out FILE
  yhtctl deployment preflight --profile FILE --secrets FILE --asset-manifest FILE [--target-snapshot FILE] [--deploy-db-snapshot FILE] [--database-schema-snapshot FILE] [--database-manifest FILE] [--runtime-assets-snapshot FILE] [--out FILE]
  yhtctl instance create --activation-dir DIR [--instance-id UUID]
  yhtctl instance request --profile FILE --secrets FILE --package-root DIR --activation-dir DIR --out FILE
  yhtctl license activate --profile FILE --secrets FILE --package-root DIR --activation-dir DIR --license FILE [--trust-bundle FILE] [--lease FILE]
  yhtctl license status --profile FILE --secrets FILE --package-root DIR --activation-dir DIR
  yhtctl license refresh --profile FILE --secrets FILE --package-root DIR --activation-dir DIR
  yhtctl license trust-update --current-trust-bundle FILE --transition FILE [--out FILE]
  yhtctl install --profile FILE --secrets FILE --package-root DIR [--activation-dir DIR] [--yes]
  yhtctl status --profile FILE --secrets FILE [--json]
  yhtctl verify --profile FILE --secrets FILE [--json]
  yhtctl evidence --profile FILE --secrets FILE [--json]
  yhtctl backup --profile FILE --secrets FILE [--reason TEXT] [--json]
  yhtctl rollback --profile FILE --secrets FILE (--receipt FILE | --database-manifest FILE) --yes
  yhtctl version [--package-root DIR] [--json]
  yhtctl manifest --package-root DIR [--verify] [--json]

Customer secrets are referenced by secrets.refs.yaml. Commands never print secret values.
`
}

function requireOption(options, key) {
  const value = options[key]
  if (!value || value === true) throw new YhtError(`Missing required option: --${key}`, { code: 'OPTION_REQUIRED' })
  return path.resolve(String(value))
}

function installerRootOption(options) {
  const value = options['package-root'] || process.env.YHT_INSTALLER_ROOT
  if (!value || value === true) {
    throw new YhtError('Missing installer root; use --package-root or YHT_INSTALLER_ROOT', { code: 'PACKAGE_ROOT_REQUIRED' })
  }
  return path.resolve(String(value))
}

function activationDirOption(options) {
  const value = options['activation-dir'] || process.env.YHT_ACTIVATION_DIR
  if (!value || value === true) {
    throw new YhtError('Missing activation directory; use --activation-dir or YHT_ACTIVATION_DIR', { code: 'ACTIVATION_DIR_REQUIRED' })
  }
  return path.resolve(String(value))
}

function profileOptions(options) {
  return {
    profilePath: requireOption(options, 'profile'),
    secretsPath: requireOption(options, 'secrets'),
    schemaPath: options.schema ? path.resolve(String(options.schema)) : defaultSchemaPath,
  }
}

function placeholderSecrets(refs) {
  return Object.fromEntries(Object.keys(refs.refs || {}).map((id) => [id, `<secret:${id}>`]))
}

function readDeploySnapshot(filePath) {
  if (!filePath) return []
  const document = readJson(path.resolve(String(filePath)))
  if (Array.isArray(document)) return document
  if (Array.isArray(document.rows)) return document.rows
  throw new YhtError('Deploy DB snapshot must be an array or contain rows[]', { code: 'DEPLOY_DB_SNAPSHOT_INVALID' })
}

function readOptionalJson(filePath) {
  return filePath ? readJson(path.resolve(String(filePath))) : null
}

function deploymentPreflightImplementationFingerprint() {
  const files = ['bin/yhtctl.mjs', 'lib/deployment.mjs', 'lib/authority.mjs', 'lib/profile.mjs']
  return sha256Object(Object.fromEntries(files.map((relative) => [relative, readFileSync(path.join(cliRoot, relative), 'utf8')])))
}

function deploymentPreflightProfile(options) {
  const result = validateProfileDocuments(options)
  const classifiedByPreflight = new Set([
    'PRODUCTION_PLACEHOLDER_FORBIDDEN',
    'DEFAULT_WORKBENCH_PROFILE_FORBIDDEN',
    'UNCONFIRMED_WORKBENCH_PROFILE_FORBIDDEN',
  ])
  const blockingErrors = result.errors.filter((error) => !classifiedByPreflight.has(error.code))
  if (blockingErrors.length) {
    throw new YhtError('Customer deployment profile validation failed', {
      code: 'PROFILE_INVALID',
      details: blockingErrors,
    })
  }
  return result
}

function makePlan({ profileResult, secrets, mapPath, deployRows }) {
  const authority = materializeAuthority({
    profile: profileResult.profile,
    secrets,
    mapPath,
    profileRoot: path.dirname(profileResult.profilePath),
  })
  const drift = driftPlan({
    deployRows,
    authority,
    compatibilityMode: profileResult.profile.security.sensitiveDbCompatibilityMode,
  })
  const plan = {
    apiVersion: 'yht.io/v1',
    kind: 'ConfigurationPlan',
    status: drift.status,
    profileFingerprint: profileResult.profileFingerprint,
    authorityFingerprint: authority.authorityFingerprint,
    providerScope: ['aliyun-oss'],
    sensitiveDbCompatibilityMode: profileResult.profile.security.sensitiveDbCompatibilityMode,
    priorities: Object.fromEntries(['P0', 'P1', 'P2', 'P3'].map((priority) => [priority, authority.records.filter((record) => record.priority === priority).length])),
    authorities: Object.fromEntries(authority.map.authorityValues.map((name) => [name, authority.records.filter((record) => record.authority === name).length])),
    drift,
  }
  plan.planDigest = sha256Object(plan)
  return { plan, authority, drift }
}

async function loadResolved(options, { allowPrompt = false } = {}) {
  const input = profileOptions(options)
  const profileResult = assertProfileDocuments(input)
  const secretResult = await resolveSecrets({
    refsPath: input.secretsPath,
    profile: profileResult.profile,
    bundlePath: options['secrets-bundle'] ? path.resolve(String(options['secrets-bundle'])) : null,
    passphrase: process.env.YHT_SECRETS_PASSPHRASE,
    allowPrompt,
  })
  return { input, profileResult, secretResult }
}

function rootPrefix(options) {
  return options.root ? path.resolve(String(options.root)) : path.parse(process.cwd()).root
}

function evaluateAuthorizationSafe(options) {
  try {
    return evaluateCommercialAuthorization(options)
  } catch (error) {
    return {
      state: 'restricted',
      reason: error.code || 'authorization_verification_failed',
      details: Array.isArray(error.details) ? error.details : [],
    }
  }
}

async function commandDoctor(options) {
  let profile
  if (options.profile) {
    profile = validateProfileDocuments({
      profilePath: path.resolve(String(options.profile)),
      secretsPath: options.secrets ? path.resolve(String(options.secrets)) : undefined,
      schemaPath: options.schema ? path.resolve(String(options.schema)) : defaultSchemaPath,
    }).profile
  }
  const result = doctorChecks(profile)
  process.stdout.write(jsonResult(result))
  if (result.status !== 'pass') process.exitCode = 2
}

async function commandPrepare(options) {
  const result = prepareDocumentDependencies({
    packageRoot: installerRootOption(options),
    install: Boolean(options.yes),
  })
  process.stdout.write(jsonResult(result))
}

function optionAnswer(options, key, answerKey = key.replace(/-([a-z])/g, (_match, char) => char.toUpperCase())) {
  return options[key] === true ? undefined : options[key] ?? options[answerKey]
}

async function configurationInitAnswers(options) {
  const fromFile = options.answers ? readJson(path.resolve(String(options.answers))) : {}
  const answers = {
    ...fromFile,
    customerCode: optionAnswer(options, 'customer-code') ?? fromFile.customerCode,
    projectName: optionAnswer(options, 'project-name') ?? fromFile.projectName,
    companyName: optionAnswer(options, 'company-name') ?? fromFile.companyName,
    baseDomain: optionAnswer(options, 'base-domain') ?? fromFile.baseDomain,
    environment: optionAnswer(options, 'environment') ?? fromFile.environment,
    installProfile: optionAnswer(options, 'install-profile') ?? fromFile.installProfile,
    owner: optionAnswer(options, 'owner') ?? fromFile.owner,
    region: optionAnswer(options, 'region') ?? fromFile.region,
    instanceId: optionAnswer(options, 'instance-id') ?? fromFile.instanceId,
    workbenchProfile: optionAnswer(options, 'workbench-profile') ?? fromFile.workbenchProfile,
    targetId: optionAnswer(options, 'target-id') ?? fromFile.targetId,
    storageRegion: optionAnswer(options, 'storage-region') ?? fromFile.storageRegion,
    privateBucket: optionAnswer(options, 'private-bucket') ?? fromFile.privateBucket,
    assetsBucket: optionAnswer(options, 'assets-bucket') ?? fromFile.assetsBucket,
    ramRoleName: optionAnswer(options, 'ram-role-name') ?? fromFile.ramRoleName,
    controlPlaneUrl: optionAnswer(options, 'control-plane-url') ?? fromFile.controlPlaneUrl,
    miniAppId: optionAnswer(options, 'mini-app-id') ?? fromFile.miniAppId,
    miniProgramEnabled: options['mini-program-enabled'] ?? fromFile.miniProgramEnabled,
  }
  if (!options.interactive) return answers
  const prompt = createInterface({ input: process.stdin, output: process.stderr })
  try {
    const ask = async (key, label, fallback = '') => {
      if (answers[key] !== undefined && answers[key] !== '') return
      answers[key] = await prompt.question(`${label}${fallback ? ` [${fallback}]` : ''}: `) || fallback
    }
    await ask('customerCode', 'Customer code')
    await ask('projectName', 'Public product name', '一合通')
    await ask('companyName', 'Public operating entity')
    await ask('baseDomain', 'Base domain (non-secret)')
    await ask('environment', 'Environment staging|production', 'staging')
    await ask('installProfile', 'Install profile community|commercial', 'commercial')
    await ask('owner', 'External action owner', 'delivery-owner')
    if (answers.environment === 'production') {
      for (const [key, label] of [
        ['region', 'Cloud region'], ['instanceId', 'ECS instance ID'], ['workbenchProfile', 'Workbench profile'],
        ['targetId', 'Deployment target ID'], ['storageRegion', 'OSS region'], ['privateBucket', 'Private bucket'],
        ['assetsBucket', 'Assets bucket'], ['ramRoleName', 'RAM role name'], ['controlPlaneUrl', 'License control-plane URL'],
      ]) await ask(key, label)
    }
    return answers
  } finally {
    prompt.close()
  }
}

async function commandConfigInit(options) {
  const outputDir = requireOption(options, 'output')
  const answers = await configurationInitAnswers(options)
  const result = createConfigurationWorkspace({
    outputDir,
    answers,
    packageRoot: options['package-root'] ? path.resolve(String(options['package-root'])) : process.env.YHT_INSTALLER_ROOT,
  })
  process.stdout.write(jsonResult(result))
}

async function commandValidate(options) {
  const result = validateProfileDocuments(profileOptions(options))
  const output = {
    status: result.valid ? 'pass' : 'fail',
    profileFingerprint: result.profileFingerprint,
    schema: defaultSchemaPath,
    providerScope: result.profile?.storage?.provider ? [result.profile.storage.provider] : [],
    errors: result.errors,
  }
  process.stdout.write(jsonResult(output))
  if (!result.valid) process.exitCode = 2
}

async function commandPlan(options) {
  const input = profileOptions(options)
  const profileResult = assertProfileDocuments(input)
  const secrets = placeholderSecrets(profileResult.refs)
  const deployRows = readDeploySnapshot(options['deploy-db-snapshot'])
  const { plan } = makePlan({
    profileResult,
    secrets,
    mapPath: options['authority-map'] ? path.resolve(String(options['authority-map'])) : defaultAuthorityMapPath,
    deployRows,
  })
  process.stdout.write(jsonResult(plan))
  if (plan.status === 'blocked') process.exitCode = 3
}

async function commandDeploymentPreflight(options) {
  const input = profileOptions(options)
  const profileResult = deploymentPreflightProfile(input)
  const secrets = placeholderSecrets(profileResult.refs)
  const deployRows = readDeploySnapshot(options['deploy-db-snapshot'])
  const { plan } = buildDeploymentPreflight({
    profileResult,
    secrets,
    deployRows,
    deploySnapshotProvided: Boolean(options['deploy-db-snapshot']),
    targetSnapshot: readOptionalJson(options['target-snapshot']),
    databaseSchemaSnapshot: readOptionalJson(options['database-schema-snapshot']),
    runtimeAssetsSnapshot: readOptionalJson(options['runtime-assets-snapshot']),
    databaseManifestPath: options['database-manifest'] ? path.resolve(String(options['database-manifest'])) : undefined,
    assetManifestPath: requireOption(options, 'asset-manifest'),
    authorityMapPath: options['authority-map'] ? path.resolve(String(options['authority-map'])) : defaultAuthorityMapPath,
    toolVersion: packageJson.version,
    toolImplementationFingerprint: deploymentPreflightImplementationFingerprint(),
  })
  if (options.out) atomicWrite(path.resolve(String(options.out)), canonicalJson(plan), 0o640)
  process.stdout.write(jsonResult(plan))
  if (plan.status === 'blocked') process.exitCode = 3
}

async function renderResolved(options, { outputDir, authorizationFiles = {}, additionalEnvironment = {} } = {}) {
  const { profileResult, secretResult } = await loadResolved(options, { allowPrompt: Boolean(options.interactive) })
  const deployRows = readDeploySnapshot(options['deploy-db-snapshot'])
  const { authority, drift } = makePlan({
    profileResult,
    secrets: secretResult.values,
    mapPath: options['authority-map'] ? path.resolve(String(options['authority-map'])) : defaultAuthorityMapPath,
    deployRows,
  })
  if (drift.status === 'blocked') {
    throw new YhtError('Configuration render is blocked by deployment database drift', {
      code: 'CONFIG_DRIFT_BLOCKED',
      details: drift.findings,
    })
  }
  const target = outputDir || (options.output
    ? path.resolve(String(options.output))
    : path.join(path.dirname(profileResult.profilePath), 'generated'))
  const rendered = renderConfiguration({
    profile: profileResult.profile,
    authority,
    outputDir: target,
    sourceRoot: options['package-root']
      ? path.resolve(String(options['package-root']))
      : (process.env.YHT_INSTALLER_ROOT ? path.resolve(process.env.YHT_INSTALLER_ROOT) : undefined),
    drift,
    authorizationFiles,
    additionalEnvironment,
  })
  return { profileResult, secretResult, authority, drift, rendered }
}

async function commandRender(options) {
  const { rendered } = await renderResolved(options)
  process.stdout.write(jsonResult({
    status: 'pass',
    outputDir: rendered.outputDir,
    planDigest: rendered.plan.planDigest,
    files: rendered.manifestEntries.map((item) => ({ path: item.path, sha256: item.sha256, sensitive: item.sensitive })),
  }))
}

async function commandInstall(options, allowUpdate = false) {
  if (!options.yes) throw new YhtError(`${allowUpdate ? 'Config update' : 'Install'} requires --yes after reviewing config plan`, { code: 'CONFIRMATION_REQUIRED' })
  const packageRoot = installerRootOption(options)
  const packageCheck = verifyPackage(packageRoot)
  const profileInput = profileOptions(options)
  const authorizationProfile = assertProfileDocuments(profileInput)
  const community = authorizationProfile.profile.installProfile === 'community'
  const activationDir = community ? null : activationDirOption(options)
  const authorization = community
    ? { status: 'not_required', installProfile: 'community', signingCreationEnabled: false }
    : assertCommercialAuthorization({
      profile: authorizationProfile.profile,
      profileFingerprint: authorizationProfile.profileFingerprint,
      version: packageCheck.version,
      installerManifestFingerprint: packageCheck.manifestFingerprint,
      activationDir,
      purpose: 'install',
    })
  const tempDir = mkdtempSync(path.join(os.tmpdir(), 'yhtctl-render-'))
  try {
    const context = await renderResolved(options, {
      outputDir: tempDir,
      authorizationFiles: {
        ...(community ? {} : activationFileDescriptors(activationDir)),
        'customer-profile.yaml': { content: readFileSync(profileInput.profilePath, 'utf8'), mode: 0o640, sensitive: false },
        'secrets.refs.yaml': { content: readFileSync(profileInput.secretsPath, 'utf8'), mode: 0o640, sensitive: false },
      },
      additionalEnvironment: {
        WX_PAY_ENABLED: String(authorizationProfile.profile.capabilities.payment.enabled),
        ...(community ? { YHT_LICENSE_ENFORCEMENT: 'community' } : {
          YHT_LICENSE_PROFILE_FINGERPRINT: authorizationProfile.profileFingerprint,
          YHT_LICENSE_EXPECTED_VERSION: packageCheck.version,
          YHT_LICENSE_INSTALLER_MANIFEST_FINGERPRINT: packageCheck.manifestFingerprint,
          YHT_LICENSE_TRUST_BUNDLE_FINGERPRINT: activationTrustBundleFingerprint(activationDir),
        }),
      },
    })
    const deployRows = allowUpdate
      ? queryInstalledDeployRows({ profile: context.profileResult.profile, rootPrefix: rootPrefix(options) })
      : []
    if (allowUpdate && deployRows.length) {
      const checked = driftPlan({
        deployRows,
        authority: context.authority,
        compatibilityMode: context.profileResult.profile.security.sensitiveDbCompatibilityMode,
      })
      if (checked.status === 'blocked') {
        throw new YhtError('Config update is blocked by sensitive deployment database drift', {
          code: 'CONFIG_DRIFT_BLOCKED',
          details: checked.findings,
        })
      }
    }
    const result = await install({
      profile: context.profileResult.profile,
      profilePath: context.profileResult.profilePath,
      profileFingerprint: context.profileResult.profileFingerprint,
      secrets: context.secretResult.values,
      authority: context.authority,
      renderDir: tempDir,
      packageRoot,
      rootPrefix: rootPrefix(options),
      allowUpdate,
      skipRuntime: Boolean(options['skip-runtime']),
    })
    process.stdout.write(jsonResult({
      status: result.status,
      receiptPath: result.receiptPath,
      profileFingerprint: result.state.profileFingerprint,
      version: result.state.version,
      idempotentConvergence: result.receipt.idempotentConvergence,
      controlledUpdate: result.receipt.controlledUpdate,
      rollbackReceipt: result.state.rollbackReceipt,
      rollbackSnapshotDigest: result.receipt.rollbackSnapshotDigest,
      databaseRollbackPoint: result.state.databaseRollbackPoint,
      authorization,
    }))
  } finally {
    rmSync(tempDir, { recursive: true, force: true })
  }
}

async function commandStatus(options, verify = false) {
  const input = profileOptions(options)
  const profileResult = assertProfileDocuments(input)
  const result = verify
    ? verifyInstallation({ profile: profileResult.profile, profileFingerprint: profileResult.profileFingerprint, rootPrefix: rootPrefix(options), skipRuntime: Boolean(options['skip-runtime']) })
    : installationStatus({ profile: profileResult.profile, profileFingerprint: profileResult.profileFingerprint, rootPrefix: rootPrefix(options), skipRuntime: Boolean(options['skip-runtime']) })
  if (result.state) {
    const authorization = evaluateAuthorizationSafe({
      profile: profileResult.profile,
      profileFingerprint: profileResult.profileFingerprint,
      version: result.state.version,
      installerManifestFingerprint: result.state.packageManifestFingerprint,
      activationDir: path.join(result.paths.configRoot, 'commercial'),
      purpose: 'runtime',
    })
    result.authorization = authorization
    result.checks.push({ id: 'commercial-authorization', ok: ['active', 'bootstrap', 'grace'].includes(authorization.state), actual: authorization })
    if (!result.checks[result.checks.length - 1].ok) result.status = 'fail'
  }
  process.stdout.write(jsonResult(result))
  if (result.status !== 'pass') process.exitCode = 3
}

async function commandBackup(options) {
  const { profileResult, secretResult } = await loadResolved(options, { allowPrompt: Boolean(options.interactive) })
  const result = await createBackup({
    profile: profileResult.profile,
    secrets: secretResult.values,
    rootPrefix: rootPrefix(options),
    reason: String(options.reason || 'manual'),
  })
  process.stdout.write(jsonResult({
    status: result.status,
    manifestPath: result.manifestPath,
    receiptPath: result.receiptPath,
    sha256: result.manifest.sha256,
    bytes: result.manifest.bytes,
  }))
}

async function commandRollback(options) {
  const { profileResult, secretResult } = await loadResolved(options, { allowPrompt: Boolean(options.interactive) })
  const result = await rollback({
    profile: profileResult.profile,
    profileFingerprint: profileResult.profileFingerprint,
    secrets: secretResult.values,
    rootPrefix: rootPrefix(options),
    rollbackReceipt: options.receipt ? path.resolve(String(options.receipt)) : null,
    databaseManifest: options['database-manifest'] ? path.resolve(String(options['database-manifest'])) : null,
    yes: Boolean(options.yes),
  })
  process.stdout.write(jsonResult({ status: result.status, receiptPath: result.receiptPath, actions: result.actions }))
}

async function commandSecretsPack(options) {
  const refsPath = requireOption(options, 'secrets')
  const outputPath = requireOption(options, 'out')
  const passphrase = process.env.YHT_SECRETS_PASSPHRASE
  if (!passphrase) throw new YhtError('Set YHT_SECRETS_PASSPHRASE for encrypted bundle creation', { code: 'SECRET_BUNDLE_PASSPHRASE_REQUIRED' })
  const values = await collectSecretsForBundle(refsPath)
  atomicWrite(outputPath, canonicalJson(encryptSecretBundle(values, passphrase)), 0o600)
  process.stdout.write(jsonResult({ status: 'pass', output: outputPath, secretCount: Object.keys(values).length }))
}

async function commandInstanceCreate(options) {
  let instanceId = options['instance-id'] ? String(options['instance-id']) : undefined
  if (options.profile) {
    const profileResult = assertProfileDocuments(profileOptions(options))
    instanceId = profileResult.profile.commercialAuthorization.instanceId
  }
  const result = generateInstanceIdentity({
    activationDir: activationDirOption(options),
    instanceId,
  })
  process.stdout.write(jsonResult({
    status: 'pass',
    activationDir: result.activationDir,
    instanceId: result.identity.instanceId,
    instanceKeyFingerprint: result.identity.publicKeyFingerprint,
  }))
}

async function commandInstanceRequest(options) {
  const profileResult = assertProfileDocuments(profileOptions(options))
  const packageCheck = verifyPackage(installerRootOption(options))
  const request = createInstanceRequest({
    activationDir: activationDirOption(options),
    profile: profileResult.profile,
    profileFingerprint: profileResult.profileFingerprint,
    version: packageCheck.version,
    installerManifestFingerprint: packageCheck.manifestFingerprint,
  })
  const output = requireOption(options, 'out')
  atomicWrite(output, canonicalJson(request), 0o640)
  process.stdout.write(jsonResult({ status: 'pass', output, requestFingerprint: sha256Object(request) }))
}

async function commandLicenseActivate(options) {
  const profileResult = assertProfileDocuments(profileOptions(options))
  const packageRoot = installerRootOption(options)
  const packageCheck = verifyPackage(packageRoot)
  const officialTrust = loadOfficialTrustBundle(packageRoot)
  const activationDir = activationDirOption(options)
  const activated = activateCommercialLicense({
    activationDir,
    licensePath: requireOption(options, 'license'),
    officialTrustBundlePath: officialTrust.path,
    suppliedTrustBundlePath: options['trust-bundle'] ? path.resolve(String(options['trust-bundle'])) : null,
    leasePath: options.lease ? path.resolve(String(options.lease)) : null,
  })
  const authorization = assertCommercialAuthorization({
    profile: profileResult.profile,
    profileFingerprint: profileResult.profileFingerprint,
    version: packageCheck.version,
    installerManifestFingerprint: packageCheck.manifestFingerprint,
    activationDir,
    purpose: 'install',
  })
  process.stdout.write(jsonResult({ status: 'pass', ...activated, authorization }))
}

async function commandLicenseStatus(options) {
  const profileResult = assertProfileDocuments(profileOptions(options))
  const packageCheck = verifyPackage(installerRootOption(options))
  const authorization = evaluateAuthorizationSafe({
    profile: profileResult.profile,
    profileFingerprint: profileResult.profileFingerprint,
    version: packageCheck.version,
    installerManifestFingerprint: packageCheck.manifestFingerprint,
    activationDir: activationDirOption(options),
    purpose: String(options.purpose || 'runtime'),
  })
  process.stdout.write(jsonResult({ status: authorization.state === 'restricted' ? 'fail' : 'pass', authorization }))
  if (authorization.state === 'restricted') process.exitCode = 4
}

async function commandLicenseRefresh(options) {
  const profileResult = assertProfileDocuments(profileOptions(options))
  const activationDir = activationDirOption(options)
  const refreshed = await refreshCommercialLease({
    activationDir,
    controlPlaneUrl: String(options['control-plane'] || profileResult.profile.commercialAuthorization.controlPlaneUrl),
  })
  process.stdout.write(jsonResult(refreshed))
}

async function commandLicenseTrustUpdate(options) {
  const currentTrustBundlePath = requireOption(options, 'current-trust-bundle')
  const result = applyTrustTransition({
    currentTrustBundlePath,
    transitionPath: requireOption(options, 'transition'),
    outputPath: options.out ? path.resolve(String(options.out)) : currentTrustBundlePath,
  })
  process.stdout.write(jsonResult({ status: 'pass', ...result }))
}

async function commandVersion(options) {
  const result = { yhtctl: packageJson.version, node: process.version }
  if (options['package-root'] || process.env.YHT_INSTALLER_ROOT) result.installer = packageSummary(installerRootOption(options)).version
  process.stdout.write(jsonResult(result))
}

async function commandManifest(options) {
  const packageRoot = installerRootOption(options)
  const result = options.verify ? verifyPackage(packageRoot) : packageSummary(packageRoot)
  process.stdout.write(jsonResult(result))
}

async function main() {
  const { positionals, options } = parseArgs(process.argv.slice(2))
  if (!positionals.length || options.help || positionals[0] === 'help') {
    process.stdout.write(help())
    return
  }
  const [command, subcommand, third] = positionals
  if (command === 'doctor') return commandDoctor(options)
  if (command === 'prepare') return commandPrepare(options)
  if (command === 'config' && subcommand === 'init') return commandConfigInit(options)
  if (command === 'config' && subcommand === 'validate') return commandValidate(options)
  if (command === 'config' && subcommand === 'plan') return commandPlan(options)
  if (command === 'config' && subcommand === 'render') return commandRender(options)
  if (command === 'config' && subcommand === 'update') return commandInstall(options, true)
  if (command === 'config' && subcommand === 'secrets' && third === 'pack') return commandSecretsPack(options)
  if (command === 'deployment' && subcommand === 'preflight') return commandDeploymentPreflight(options)
  if (command === 'instance' && subcommand === 'create') return commandInstanceCreate(options)
  if (command === 'instance' && subcommand === 'request') return commandInstanceRequest(options)
  if (command === 'license' && subcommand === 'activate') return commandLicenseActivate(options)
  if (command === 'license' && subcommand === 'status') return commandLicenseStatus(options)
  if (command === 'license' && subcommand === 'refresh') return commandLicenseRefresh(options)
  if (command === 'license' && subcommand === 'trust-update') return commandLicenseTrustUpdate(options)
  if (command === 'install') return commandInstall(options, false)
  if (command === 'status') return commandStatus(options, false)
  if (command === 'verify' || command === 'evidence') return commandStatus(options, true)
  if (command === 'backup') return commandBackup(options)
  if (command === 'rollback') return commandRollback(options)
  if (command === 'version') return commandVersion(options)
  if (command === 'manifest') return commandManifest(options)
  throw new YhtError(`Unknown command: ${positionals.join(' ')}`, { code: 'UNKNOWN_COMMAND' })
}

main().catch((error) => {
  const safe = error instanceof YhtError
    ? { status: 'fail', code: error.code, message: error.message, details: error.details || [] }
    : { status: 'fail', code: 'UNEXPECTED_ERROR', message: error.message }
  process.stderr.write(jsonResult(safe))
  process.exitCode = error.exitCode || 2
})
