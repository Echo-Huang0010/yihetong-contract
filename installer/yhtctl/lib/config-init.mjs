import { randomUUID } from 'node:crypto'
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync } from 'node:fs'
import path from 'node:path'
import { stringify } from 'yaml'
import { atomicWrite, canonicalJson, readYaml, repoRoot, sha256, YhtError } from './common.mjs'

const productionRequired = [
  'baseDomain', 'region', 'instanceId', 'workbenchProfile', 'targetId',
  'storageRegion', 'privateBucket', 'assetsBucket', 'ramRoleName',
]

function requiredText(value, name, pattern = null) {
  const text = String(value || '').trim()
  if (!text || (pattern && !pattern.test(text))) {
    throw new YhtError(`Invalid or missing non-secret answer: ${name}`, {
      code: 'CONFIG_INIT_ANSWER_REQUIRED',
      details: [{ field: name }],
    })
  }
  return text
}

function isInside(parent, child) {
  const relative = path.relative(parent, child)
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))
}

function resolveThroughExistingParent(target) {
  const missing = []
  let current = path.resolve(target)
  while (!existsSync(current)) {
    const parent = path.dirname(current)
    if (parent === current) break
    missing.unshift(path.basename(current))
    current = parent
  }
  const base = existsSync(current) ? realpathSync(current) : current
  return path.resolve(base, ...missing)
}

function assertFreshOutput(outputDir, protectedRoots) {
  const lexical = path.resolve(outputDir)
  const physical = resolveThroughExistingParent(lexical)
  for (const root of protectedRoots.filter(Boolean)) {
    const protectedLexical = path.resolve(root)
    const protectedPhysical = resolveThroughExistingParent(protectedLexical)
    if (isInside(protectedLexical, lexical) || isInside(protectedPhysical, physical)) {
      throw new YhtError('Configuration workspace output must be outside source and installer roots', {
        code: 'CONFIG_INIT_OUTPUT_PROTECTED',
        details: [{ output: lexical, protectedRoot: protectedLexical }],
      })
    }
  }
  if (existsSync(lexical)) {
    throw new YhtError('Configuration workspace output already exists; choose a new directory', {
      code: 'CONFIG_INIT_OUTPUT_EXISTS',
      details: [{ output: lexical }],
    })
  }
  return lexical
}

function normalizedAnswers(input = {}) {
  const answers = { ...input }
  answers.environment = String(answers.environment || 'staging')
  if (!['staging', 'production'].includes(answers.environment)) {
    throw new YhtError('environment must be staging or production', { code: 'CONFIG_INIT_ENVIRONMENT_INVALID' })
  }
  answers.installProfile = String(answers.installProfile || 'commercial')
  if (!['community', 'commercial'].includes(answers.installProfile)) {
    throw new YhtError('installProfile must be community or commercial', { code: 'CONFIG_INIT_INSTALL_PROFILE_INVALID' })
  }
  answers.customerCode = requiredText(answers.customerCode, 'customerCode', /^[a-z0-9][a-z0-9-]{2,31}$/)
  answers.projectName = requiredText(answers.projectName || '一合通', 'projectName')
  answers.companyName = requiredText(answers.companyName, 'companyName')
  answers.owner = requiredText(answers.owner || 'delivery-owner', 'owner')
  if (answers.environment === 'production') {
    for (const field of productionRequired) requiredText(answers[field], field)
    if (answers.installProfile === 'commercial') requiredText(answers.controlPlaneUrl, 'controlPlaneUrl')
  }
  answers.baseDomain = String(answers.baseDomain || `${answers.customerCode}.example.invalid`).toLowerCase()
  answers.region = String(answers.region || 'cn-hangzhou')
  answers.instanceId = String(answers.instanceId || 'i-synthetic00000001')
  answers.workbenchProfile = String(answers.workbenchProfile || `${answers.customerCode}-${answers.environment}`)
  answers.targetId = String(answers.targetId || `${answers.customerCode}-${answers.environment}`)
  answers.storageRegion = String(answers.storageRegion || 'oss-cn-example')
  answers.privateBucket = String(answers.privateBucket || `${answers.customerCode}-private`)
  answers.assetsBucket = String(answers.assetsBucket || `${answers.customerCode}-assets`)
  answers.ramRoleName = String(answers.ramRoleName || `${answers.customerCode}-runtime-role`)
  answers.controlPlaneUrl = String(answers.controlPlaneUrl || 'https://license.example.invalid')
  answers.miniProgramEnabled = answers.miniProgramEnabled === true || answers.miniProgramEnabled === 'true'
  if (answers.miniProgramEnabled) requiredText(answers.miniAppId, 'miniAppId', /^wx[A-Za-z0-9]{16}$/)
  return answers
}

function profileFromTemplate(template, answers) {
  const profile = structuredClone(template)
  const base = answers.baseDomain
  profile.metadata.customerCode = answers.customerCode
  profile.installProfile = answers.installProfile
  profile.metadata.environment = answers.environment
  profile.metadata.profileRevision = Number(answers.profileRevision || 1)
  profile.deployment.identity = {
    targetId: answers.targetId,
    provider: 'aliyun-ecs',
    region: answers.region,
    instanceId: answers.instanceId,
    workbenchProfile: answers.workbenchProfile,
  }
  profile.deployment.endpoints = {
    apiBaseUrl: `https://api.${base}`,
    manageBaseUrl: `https://manage.${base}`,
    userBaseUrl: `https://user.${base}`,
    h5BaseUrl: `https://h5.${base}`,
    websiteBaseUrl: `https://www.${base}`,
  }
  profile.storage.region = answers.storageRegion
  profile.storage.privateBucket = answers.privateBucket
  profile.storage.assetsBucket = answers.assetsBucket
  profile.storage.internalEndpoint = `${answers.storageRegion}-internal.aliyuncs.com`
  profile.storage.externalEndpoint = `${answers.storageRegion}.aliyuncs.com`
  profile.storage.privateDomain = `https://private.${base}`
  profile.storage.assetsDomain = `https://assets.${base}`
  profile.storage.credentialMode = 'ram-role'
  profile.storage.ramRoleName = answers.ramRoleName
  delete profile.storage.accessKeyIdRef
  delete profile.storage.accessKeySecretRef
  profile.commercialAuthorization.instanceId = randomUUID()
  profile.commercialAuthorization.controlPlaneUrl = answers.controlPlaneUrl
  if (answers.installProfile === 'community') {
    profile.commercialAuthorization.enforcement = 'community'
    profile.commercialAuthorization.leaseRequired = false
  }
  profile.brand.projectName = answers.projectName
  profile.brand.companyName = answers.companyName
  profile.brand.privacySubject = answers.companyName
  profile.brand.serviceAgreementSubject = answers.companyName
  profile.brand.copyrightText = `Copyright (c) ${answers.companyName}`
  profile.brand.websiteDomain = `www.${base}`
  profile.brand.websiteUserUrl = `https://user.${base}`
  profile.brand.websiteManageUrl = `https://manage.${base}`
  profile.brand.websiteH5Url = `https://h5.${base}`
  profile.brand.websiteContactEmail = `ops@${base}`
  profile.externalActions = profile.externalActions.map((action) => ({ ...action, owner: answers.owner }))
  if (answers.miniProgramEnabled) {
    profile.miniProgram = {
      enabled: true,
      appId: answers.miniAppId,
      appSecretRef: 'secret://mini-program.app-secret',
      platformActionIds: ['wechat-domain-registration', 'wechat-code-review'],
    }
  } else {
    profile.miniProgram = {
      enabled: false,
      notApplicable: {
        reason: 'WeChat setup remains a separate customer-controlled action.',
        approvedBy: answers.owner,
      },
    }
    profile.externalActions = profile.externalActions.filter((action) => !action.id.startsWith('wechat-'))
  }
  return profile
}

function secretReferences(profile) {
  const refs = {
    'database.password': { provider: 'env', key: 'YHT_SECRET_DATABASE_PASSWORD', required: true },
    'database.migration-password': { provider: 'env', key: 'YHT_SECRET_DATABASE_MIGRATION_PASSWORD', required: true },
    'database.backup-password': { provider: 'env', key: 'YHT_SECRET_DATABASE_BACKUP_PASSWORD', required: true },
    'redis.user.password': { provider: 'env', key: 'YHT_SECRET_USER_REDIS_PASSWORD', required: true },
    'redis.default.password': { provider: 'env', key: 'YHT_SECRET_DEFAULT_REDIS_PASSWORD', required: true },
  }
  if (profile.miniProgram.enabled) {
    refs['mini-program.app-secret'] = { provider: 'env', key: 'YHT_SECRET_MINI_PROGRAM_APP_SECRET', required: true }
  }
  return { apiVersion: 'yht.io/v1', kind: 'SecretReferences', mode: 'recommended', refs }
}

function configurationOrder() {
  return `# Configuration Activation Order

1. **Protected secrets** - secret references resolve only at execution time from the customer's protected environment or secret manager. No secret value belongs in this workspace.
2. **Customer baseline** - \`customer-profile.yaml\` defines non-secret deployment, customer and capability intent.
3. **Deployment database configuration** - \`system_deploy_config\` may override only registry-approved non-secret runtime fields after the bootstrap connection succeeds.
4. **Maintainable brand configuration** - \`system_brand_config\` is the runtime authority for public brand/content fields maintained in the admin console.
5. **Rebuild inputs** - frontend endpoints, enabled surfaces, Mini AppID and packaged brand assets require a controlled rebuild when their consumers are compile-time/build-time.
6. **Third-party manual actions** - DNS/TLS, WeChat, payment, provider approvals and formal License issuance remain customer/platform actions and never become a local installation pass.

Run \`yhtctl config validate\`, \`config plan\`, \`config render\` and then the authorized install/update path. A later layer does not authorize or reveal an earlier protected layer.
`
}

function actionChecklist(actions) {
  const lines = ['# Third-party Action Checklist', '', '| ID | Platform | Owner | State | Action | Verification |', '| --- | --- | --- | --- | --- | --- |']
  const clean = (value) => String(value).replaceAll('|', '\\|').replaceAll('\n', ' ')
  for (const action of actions) lines.push(`| ${clean(action.id)} | ${clean(action.platform)} | ${clean(action.owner)} | ${clean(action.state)} | ${clean(action.action)} | ${clean(action.verification)} |`)
  lines.push('', 'These actions require the named customer/platform owner. The installer and Agent must stop instead of collecting credentials or claiming completion.', '')
  return lines.join('\n')
}

function walkFiles(root, current = root, output = []) {
  for (const name of readdirSync(current)) {
    const full = path.join(current, name)
    const stat = lstatSync(full)
    if (stat.isDirectory()) walkFiles(root, full, output)
    else if (stat.isFile()) output.push(path.relative(root, full).split(path.sep).join('/'))
  }
  return output
}

export function createConfigurationWorkspace({ outputDir, answers: rawAnswers, templateRoot = path.join(repoRoot, 'deploy', 'customer-profile', 'template'), packageRoot = process.env.YHT_INSTALLER_ROOT }) {
  const answers = normalizedAnswers(rawAnswers)
  const output = assertFreshOutput(outputDir, [repoRoot, packageRoot, templateRoot])
  const template = readYaml(path.join(templateRoot, 'customer-profile.yaml'))
  const profile = profileFromTemplate(template, answers)
  const refs = secretReferences(profile)
  mkdirSync(output, { recursive: false, mode: 0o750 })
  cpSync(path.join(templateRoot, 'assets'), path.join(output, 'assets'), { recursive: true, errorOnExist: true })
  for (const directory of ['certificates', 'generated', 'receipts', 'external-actions']) mkdirSync(path.join(output, directory), { mode: 0o750 })
  atomicWrite(path.join(output, 'customer-profile.yaml'), stringify(profile, { lineWidth: 0 }), 0o640)
  atomicWrite(path.join(output, 'secrets.refs.yaml'), stringify(refs, { lineWidth: 0 }), 0o640)
  atomicWrite(path.join(output, 'CONFIGURATION_ORDER.md'), configurationOrder(), 0o640)
  atomicWrite(path.join(output, 'external-actions', 'THIRD_PARTY_ACTIONS.md'), actionChecklist(profile.externalActions), 0o640)
  atomicWrite(path.join(output, 'assets', 'README.md'), '# Brand assets\n\nReplace the neutral sample assets with customer-approved real assets. Record source, purpose, dimensions and SHA-256. Never place secrets, certificates or private keys here.\n', 0o640)
  atomicWrite(path.join(output, 'certificates', 'README.md'), '# Certificates\n\nOnly public certificate material explicitly referenced by the Profile may be staged here. Private keys remain protected secret references and are never collected by this generator.\n', 0o640)
  const files = walkFiles(output).sort().map((relative) => {
    const content = readFileSync(path.join(output, ...relative.split('/')))
    return { path: relative, bytes: content.length, sha256: sha256(content) }
  })
  const receipt = {
    apiVersion: 'yht.io/v1',
    kind: 'CustomerConfigurationWorkspace',
    customerCode: answers.customerCode,
    environment: answers.environment,
    installProfile: answers.installProfile,
    secretValuesCollected: false,
    externalActionsCompleted: false,
    formalLicensePresent: false,
    files,
  }
  atomicWrite(path.join(output, 'CONFIG_WORKSPACE.json'), canonicalJson(receipt), 0o640)
  return { status: 'pass', outputDir: output, ...receipt }
}
