#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import {
  chmodSync,
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import {
  canonicalJson,
  ensureDir,
  parseArgs,
  readJson,
  readYaml,
  sha256,
  sha256Object,
  YhtError,
} from '../lib/common.mjs'
import { validateProfileDocuments } from '../lib/profile.mjs'
import { computeManifestFingerprint } from '../lib/package.mjs'
import { loadTrustBundle, OFFICIAL_TRUST_BUNDLE_RELATIVE } from '../lib/license.mjs'

const hygieneScanner = fileURLToPath(new URL('./scan-package-hygiene.mjs', import.meta.url))

function required(options, key) {
  const value = options[key]
  if (!value || value === true) throw new YhtError(`Missing --${key}`, { code: 'OPTION_REQUIRED' })
  return path.resolve(String(value))
}

function safeRemove(root, target) {
  const resolvedRoot = path.resolve(root)
  const resolvedTarget = path.resolve(target)
  if (resolvedTarget === resolvedRoot || !resolvedTarget.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new YhtError(`Refusing unsafe removal: ${resolvedTarget}`, { code: 'UNSAFE_OUTPUT_PATH' })
  }
  rmSync(resolvedTarget, { recursive: true, force: true })
}

function copyRequired(source, target) {
  if (!existsSync(source)) throw new YhtError(`Required package input is missing: ${source}`, { code: 'PACKAGE_INPUT_MISSING' })
  ensureDir(path.dirname(target))
  const stat = statSync(source)
  if (stat.isDirectory()) cpSync(source, target, { recursive: true, force: false, errorOnExist: true, preserveTimestamps: true })
  else copyFileSync(source, target)
}

function walk(root, current = root, files = []) {
  for (const name of readdirSync(current)) {
    const full = path.join(current, name)
    const stat = statSync(full)
    if (stat.isDirectory()) walk(root, full, files)
    else if (stat.isFile()) files.push(path.relative(root, full).split(path.sep).join('/'))
  }
  return files
}

function intendedMode(relativePath) {
  if (relativePath === 'yhtctl' || relativePath.endsWith('.sh') || relativePath.endsWith('/yhtctl.mjs')) return '0755'
  if (relativePath.includes('certificates/') || relativePath.endsWith('.refs.yaml')) return '0600'
  return '0644'
}

function packageFiles(root, excluded = new Set()) {
  return walk(root)
    .filter((relative) => !excluded.has(relative))
    .sort()
    .map((relative) => {
      const content = readFileSync(path.join(root, ...relative.split('/')))
      return { path: relative, bytes: content.length, sha256: sha256(content), intendedMode: intendedMode(relative) }
    })
}

function lockPackages(repoRoot, lockPaths, scope) {
  const packages = new Map()
  for (const relative of lockPaths) {
    const lock = readJson(path.join(repoRoot, ...relative.split('/')))
    for (const [location, descriptor] of Object.entries(lock.packages || {})) {
      if (!location.startsWith('node_modules/') || !descriptor.version) continue
      const name = descriptor.name || location.replace(/^node_modules\//, '')
      packages.set(`${name}@${descriptor.version}`, {
        SPDXID: `SPDXRef-Package-${sha256(`${name}@${descriptor.version}`).slice(0, 16)}`,
        name,
        versionInfo: descriptor.version,
        downloadLocation: descriptor.resolved || 'NOASSERTION',
        filesAnalyzed: false,
        licenseConcluded: 'NOASSERTION',
        licenseDeclared: descriptor.license || 'NOASSERTION',
        copyrightText: 'NOASSERTION',
        primaryPackagePurpose: 'LIBRARY',
        comment: `${scope}: ${relative}`,
      })
    }
  }
  return [...packages.values()].sort((a, b) => a.name.localeCompare(b.name) || a.versionInfo.localeCompare(b.versionInfo))
}

function javaPackagesFromSpringBootJar(jarPath) {
  const content = readFileSync(jarPath)
  const searchStart = Math.max(0, content.length - 65557)
  let end = -1
  for (let offset = content.length - 22; offset >= searchStart; offset -= 1) {
    if (content.readUInt32LE(offset) === 0x06054b50) {
      end = offset
      break
    }
  }
  if (end < 0) return []
  const totalEntries = content.readUInt16LE(end + 10)
  let offset = content.readUInt32LE(end + 16)
  const packages = new Map()
  for (let index = 0; index < totalEntries; index += 1) {
    if (content.readUInt32LE(offset) !== 0x02014b50) throw new YhtError('Invalid JAR central directory', { code: 'JAR_SBOM_INVALID' })
    const nameLength = content.readUInt16LE(offset + 28)
    const extraLength = content.readUInt16LE(offset + 30)
    const commentLength = content.readUInt16LE(offset + 32)
    const entry = content.subarray(offset + 46, offset + 46 + nameLength).toString('utf8')
    const match = /^BOOT-INF\/lib\/(.+)-(\d[^/]*)\.jar$/.exec(entry)
    if (match) {
      const name = match[1]
      const versionInfo = match[2]
      const key = `java:${name}@${versionInfo}`
      packages.set(key, {
        SPDXID: `SPDXRef-Package-${sha256(key).slice(0, 16)}`,
        name,
        versionInfo,
        downloadLocation: 'NOASSERTION',
        filesAnalyzed: false,
        licenseConcluded: 'NOASSERTION',
        licenseDeclared: 'NOASSERTION',
        copyrightText: 'NOASSERTION',
        primaryPackagePurpose: 'LIBRARY',
        comment: `generic-installer embedded JAR: ${entry}`,
      })
    }
    offset += 46 + nameLength + extraLength + commentLength
  }
  return [...packages.values()].sort((a, b) => a.name.localeCompare(b.name) || a.versionInfo.localeCompare(b.versionInfo))
}

function pythonPackagesFromLock(lockPath, scope) {
  const packages = []
  for (const line of readFileSync(lockPath, 'utf8').split(/\r?\n/)) {
    const match = /^([A-Za-z0-9_.-]+)==([A-Za-z0-9_.+-]+)$/.exec(line.trim())
    if (!match) continue
    const [, name, versionInfo] = match
    const key = `python:${name.toLowerCase()}@${versionInfo}`
    packages.push({
      SPDXID: `SPDXRef-Package-${sha256(key).slice(0, 16)}`,
      name,
      versionInfo,
      downloadLocation: 'NOASSERTION',
      filesAnalyzed: false,
      licenseConcluded: 'NOASSERTION',
      licenseDeclared: 'NOASSERTION',
      copyrightText: 'NOASSERTION',
      primaryPackagePurpose: 'LIBRARY',
      comment: `${scope}: agent-harness/requirements.lock`,
    })
  }
  return packages.sort((a, b) => a.name.localeCompare(b.name) || a.versionInfo.localeCompare(b.versionInfo))
}

function mergePackages(...groups) {
  const merged = new Map()
  for (const item of groups.flat()) merged.set(item.SPDXID, item)
  return [...merged.values()].sort((a, b) => a.name.localeCompare(b.name) || a.versionInfo.localeCompare(b.versionInfo))
}

function writeSbom(root, { name, version, sourceVersion, files, packages }) {
  const rootId = `SPDXRef-Package-${sha256(`${name}@${version}`).slice(0, 16)}`
  const namespace = `https://sbom.yihetong.invalid/${encodeURIComponent(name)}/${encodeURIComponent(version)}/${sourceVersion}`
  const spdxFiles = files.map((file) => ({
    SPDXID: `SPDXRef-File-${sha256(file.path).slice(0, 20)}`,
    fileName: `./${file.path}`,
    checksums: [{ algorithm: 'SHA256', checksumValue: file.sha256 }],
    licenseConcluded: 'NOASSERTION',
    copyrightText: 'NOASSERTION',
  }))
  const sbom = {
    spdxVersion: 'SPDX-2.3',
    dataLicense: 'CC0-1.0',
    SPDXID: 'SPDXRef-DOCUMENT',
    name: `${name}-${version}`,
    documentNamespace: namespace,
    creationInfo: {
      created: new Date().toISOString(),
      creators: ['Tool: yhtctl-package-assembler-1.0'],
    },
    packages: [
      {
        SPDXID: rootId,
        name,
        versionInfo: version,
        downloadLocation: 'NOASSERTION',
        filesAnalyzed: true,
        packageVerificationCode: { packageVerificationCodeValue: sha256Object(files) },
        licenseConcluded: 'NOASSERTION',
        licenseDeclared: 'NOASSERTION',
        copyrightText: 'NOASSERTION',
      },
      ...packages,
    ],
    files: spdxFiles,
    relationships: [
      { spdxElementId: 'SPDXRef-DOCUMENT', relationshipType: 'DESCRIBES', relatedSpdxElement: rootId },
      ...spdxFiles.map((file) => ({ spdxElementId: rootId, relationshipType: 'CONTAINS', relatedSpdxElement: file.SPDXID })),
      ...packages.map((item) => ({ spdxElementId: rootId, relationshipType: 'DEPENDS_ON', relatedSpdxElement: item.SPDXID })),
    ],
  }
  writeFileSync(path.join(root, 'SBOM.spdx.json'), canonicalJson(sbom), 'utf8')
}

function finalizePackage(root, metadata, packages = []) {
  const excluded = new Set(['MANIFEST.json', 'SHA256SUMS.txt'])
  const beforeSbom = packageFiles(root, new Set([...excluded, 'SBOM.spdx.json']))
  writeSbom(root, { ...metadata, files: beforeSbom, packages })
  const files = packageFiles(root, excluded)
  const manifest = {
    formatVersion: 1,
    packageKind: metadata.packageKind,
    name: metadata.name,
    version: metadata.version,
    sourceVersion: metadata.sourceVersion,
    createdAt: new Date().toISOString(),
    sbom: 'SBOM.spdx.json',
    files,
  }
  manifest.manifestFingerprint = computeManifestFingerprint(manifest)
  writeFileSync(path.join(root, 'MANIFEST.json'), canonicalJson(manifest), 'utf8')
  const checksumFiles = packageFiles(root, new Set(['SHA256SUMS.txt']))
  writeFileSync(path.join(root, 'SHA256SUMS.txt'), `${checksumFiles.map((file) => `${file.sha256}  ${file.path}`).join('\n')}\n`, 'ascii')
  return { manifest, fileCount: checksumFiles.length }
}

function launcherText() {
  return `#!/usr/bin/env bash\nset -euo pipefail\nROOT="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"\nexport YHT_INSTALLER_ROOT="$ROOT"\nexec node "$ROOT/tools/yhtctl/bin/yhtctl.mjs" "$@"\n`
}

function agentLauncherText() {
  return `#!/usr/bin/env bash\nset -euo pipefail\nROOT="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"\nexport YHT_SOURCE_ROOT="$ROOT"\nexport YHTCTL_BIN="$ROOT/tools/yhtctl/bin/yhtctl.mjs"\nexec python3 "$ROOT/agent-cli/yihetong-cli.pyz" "$@"\n`
}

function websiteLauncher(websiteRoot) {
  const buildInfo = readFileSync(path.join(websiteRoot, '.yihetong-build.env'), 'utf8')
  const standalone = /^RUNTIME_MODE=standalone$/m.test(buildInfo)
  const command = standalone
    ? 'exec node server.js'
    : 'exec node node_modules/next/dist/bin/next start'
  writeFileSync(path.join(websiteRoot, 'start-website.sh'), `#!/usr/bin/env bash\nset -euo pipefail\n${command}\n`, 'utf8')
  chmodSync(path.join(websiteRoot, 'start-website.sh'), 0o755)
}

function writeDatabaseBundles(repoRoot, databaseRoot) {
  const freshManifest = readJson(path.join(repoRoot, 'deploy', 'sql', 'fresh-install-manifest.json'))
  const upgradeManifest = readJson(path.join(repoRoot, 'deploy', 'sql', 'upgrade-manifest.json'))
  const concatenate = (title, files, sourceRoot) => {
    const parts = [`-- ${title}`, '-- Generated from the reviewed deploy/sql manifest. Do not edit this aggregate directly.', '']
    for (const relative of files) {
      const normalized = relative.replaceAll('\\', '/')
      if (
        normalized.startsWith('/')
        || normalized.split('/').includes('..')
        || !normalized.endsWith('.sql')
      ) {
        throw new Error(`Unsafe SQL manifest path: ${relative}`)
      }
      const content = readFileSync(path.join(sourceRoot, ...normalized.split('/')), 'utf8').trim()
      parts.push(`-- BEGIN ${normalized}`, content, `-- END ${normalized}`, '')
    }
    return `${parts.join('\n')}\n`
  }
  ensureDir(databaseRoot)
  const ddlRoot = path.join(repoRoot, 'esign-api', 'esign-api', 'ddl')
  writeFileSync(
    path.join(databaseRoot, 'fresh-install.sql'),
    concatenate(
      `Yihetong MySQL 8 fresh-install bundle v${freshManifest.version}`,
      [freshManifest.baselines.mysql8, ...(freshManifest.commonMigrations || [])],
      ddlRoot,
    ),
    'utf8',
  )
  writeFileSync(
    path.join(databaseRoot, 'upgrade.sql'),
    concatenate(
      `Yihetong MySQL 8 upgrade bundle v${upgradeManifest.version}`,
      upgradeManifest.migrations || [],
      ddlRoot,
    ),
    'utf8',
  )
}

function assembleInstaller({ repoRoot, buildOutputRoot, outputRoot, version, sourceVersion, officialTrustBundlePath }) {
  const name = `yihetong-installer-${version}`
  const root = path.join(outputRoot, name)
  safeRemove(outputRoot, root)
  ensureDir(root)
  copyRequired(path.join(repoRoot, 'tools', 'yhtctl'), path.join(root, 'tools', 'yhtctl'))
  rmSync(path.join(root, 'tools', 'yhtctl', 'test'), { recursive: true, force: true })
  rmSync(path.join(root, 'tools', 'yhtctl', 'scripts'), { recursive: true, force: true })
  copyRequired(path.join(repoRoot, 'deploy', 'customer-profile'), path.join(root, 'deploy', 'customer-profile'))
  copyRequired(path.join(repoRoot, 'deploy', 'backend', 'application-template-prod.example.yml'), path.join(root, 'deploy', 'backend', 'application-template-prod.example.yml'))
  copyRequired(path.join(repoRoot, 'deploy', 'ops', 'initialize-fresh-mysql8.sh'), path.join(root, 'deploy', 'initialize-fresh-mysql8.sh'))
  copyRequired(path.join(repoRoot, 'deploy', 'ops', 'install-document-conversion-deps.sh'), path.join(root, 'deploy', 'ops', 'install-document-conversion-deps.sh'))
  copyRequired(path.join(repoRoot, 'deploy', 'vnext', 'INSTALL.md'), path.join(root, 'docs', 'INSTALL.md'))
  copyRequired(path.join(repoRoot, 'deploy', 'vnext', 'PACKAGE_LAYOUT.md'), path.join(root, 'docs', 'PACKAGE_LAYOUT.md'))
  copyRequired(path.join(repoRoot, 'deploy', 'vnext', 'CONFIGURATION_ORDER.md'), path.join(root, 'docs', 'CONFIGURATION_ORDER.md'))
  copyRequired(path.join(repoRoot, 'deploy', 'vnext', 'SMOKE_PATHS.json'), path.join(root, 'docs', 'SMOKE_PATHS.json'))
  copyRequired(path.join(buildOutputRoot, 'java', 'esign.jar'), path.join(root, 'payload', 'server', 'esign.jar'))
  copyRequired(path.join(buildOutputRoot, 'website-node'), path.join(root, 'payload', 'website'))
  copyRequired(path.join(buildOutputRoot, 'agent-cli', 'yihetong-cli.pyz'), path.join(root, 'agent-cli', 'yihetong-cli.pyz'))
  copyRequired(path.join(repoRoot, 'agent-harness', 'CLI_ANYTHING_PROVENANCE.json'), path.join(root, 'agent-cli', 'CLI_ANYTHING_PROVENANCE.json'))
  copyRequired(path.join(repoRoot, 'agent-harness', 'requirements.lock'), path.join(root, 'agent-cli', 'requirements.lock'))
  copyRequired(path.join(repoRoot, 'agent-harness', 'cli_anything', 'yihetong', 'README.md'), path.join(root, 'agent-cli', 'README.md'))
  copyRequired(path.join(repoRoot, 'skills', 'cli-anything-yihetong', 'SKILL.md'), path.join(root, 'agent-cli', 'SKILL.md'))
  copyRequired(path.join(repoRoot, 'skills', 'yihetong-installer'), path.join(root, 'skills', 'yihetong-installer'))
  const officialTrustBundle = loadTrustBundle(officialTrustBundlePath)
  copyRequired(officialTrustBundlePath, path.join(root, ...OFFICIAL_TRUST_BUNDLE_RELATIVE.split('/')))
  websiteLauncher(path.join(root, 'payload', 'website'))
  writeDatabaseBundles(repoRoot, path.join(root, 'database'))
  writeFileSync(path.join(root, 'yhtctl'), launcherText(), 'utf8')
  chmodSync(path.join(root, 'yhtctl'), 0o755)
  writeFileSync(path.join(root, 'yihetong-cli'), agentLauncherText(), 'utf8')
  chmodSync(path.join(root, 'yihetong-cli'), 0o755)
  writeFileSync(path.join(root, 'VERSION.json'), canonicalJson({
    product: 'yihetong',
    version,
    sourceVersion,
    packageKind: 'generic-installer',
    status: 'candidate',
    officialTrustBundleFingerprint: sha256Object(officialTrustBundle),
  }), 'utf8')
  const genericDependencies = mergePackages(
    lockPackages(repoRoot, ['tools/yhtctl/package-lock.json', 'website/package-lock.json'], 'generic-installer build/runtime dependency'),
    javaPackagesFromSpringBootJar(path.join(root, 'payload', 'server', 'esign.jar')),
    pythonPackagesFromLock(path.join(repoRoot, 'agent-harness', 'requirements.lock'), 'generic-installer agent CLI runtime dependency'),
  )
  const finalized = finalizePackage(root, {
    packageKind: 'generic-installer',
    name: 'yihetong-installer',
    version,
    sourceVersion,
  }, genericDependencies)
  return { root, name, ...finalized }
}

function customerSensitiveValues(profile) {
  return [
    profile.metadata.customerCode,
    profile.brand.companyName,
    profile.miniProgram.appId,
    profile.storage.privateBucket,
    profile.storage.assetsBucket,
    ...Object.values(profile.deployment.endpoints),
  ].filter(Boolean)
}

function runPackageHygieneGate(installerRoot, customerRoot, profilePath) {
  const result = spawnSync(process.execPath, [
    hygieneScanner,
    '--installer', installerRoot,
    '--customer', customerRoot,
    '--profile', profilePath,
  ], { encoding: 'utf8' })
  if (result.status === 0) return
  let details = []
  try {
    const report = JSON.parse(result.stdout || result.stderr || '{}')
    details = [
      ...(report.installer?.findings || []),
      ...(report.customer?.findings || []),
    ]
  } catch {
    details = [{ code: 'HYGIENE_SCANNER_OUTPUT_INVALID' }]
  }
  throw new YhtError('Package hygiene gate failed before archive creation', {
    code: 'PACKAGE_HYGIENE_FAILED',
    details,
  })
}

function assembleCustomer({ repoRoot, buildOutputRoot, outputRoot, profileRoot, checklist, sourceVersion }) {
  const profilePath = path.join(profileRoot, 'customer-profile.yaml')
  const secretsPath = path.join(profileRoot, 'secrets.refs.yaml')
  const validation = validateProfileDocuments({ profilePath, secretsPath })
  if (!validation.valid) {
    throw new YhtError('Customer package profile validation failed', { code: 'PROFILE_INVALID', details: validation.errors })
  }
  const code = validation.profile.metadata.customerCode
  const name = `customer-profile-${code}`
  const root = path.join(outputRoot, name)
  safeRemove(outputRoot, root)
  ensureDir(root)
  copyRequired(profilePath, path.join(root, 'customer-profile.yaml'))
  copyRequired(secretsPath, path.join(root, 'secrets.refs.yaml'))
  const assetManifest = path.join(profileRoot, 'official-assets.manifest.json')
  if (existsSync(assetManifest)) copyRequired(assetManifest, path.join(root, 'official-assets.manifest.json'))
  for (const directory of ['assets', 'certificates', 'external-actions', 'receipts']) {
    const source = path.join(profileRoot, directory)
    if (existsSync(source)) copyRequired(source, path.join(root, directory))
    else ensureDir(path.join(root, directory))
  }
  ensureDir(path.join(root, 'generated'))
  writeFileSync(path.join(root, 'generated', 'README.md'), 'Generated plaintext runtime configuration is intentionally excluded from the customer ZIP.\n', 'utf8')
  if (checklist) copyRequired(checklist, path.join(root, 'customer-config-checklist.xlsx'))
  copyRequired(path.join(buildOutputRoot, 'manage-html'), path.join(root, 'frontends', 'manage-admin'))
  copyRequired(path.join(buildOutputRoot, 'admin-html'), path.join(root, 'frontends', 'pc-admin'))
  copyRequired(path.join(buildOutputRoot, 'h5-html'), path.join(root, 'frontends', 'h5'))
  if (validation.profile.installProfile === 'community' && !validation.profile.miniProgram.enabled) {
    ensureDir(path.join(root, 'mini-program-build'))
    writeFileSync(
      path.join(root, 'mini-program-build', 'NOT_APPLICABLE.md'),
      '# Mini Program build not applicable\n\nThis explicit community profile disables the Mini Program surface. No Mini AppID, AppSecret, build output, platform operation, or publication is included.\n',
      'utf8',
    )
  } else {
    copyRequired(path.join(buildOutputRoot, 'mp-weixin'), path.join(root, 'mini-program-build'))
  }
  const encryptedBundle = path.join(profileRoot, 'secrets.bundle.json')
  if (existsSync(encryptedBundle)) copyRequired(encryptedBundle, path.join(root, 'secrets.bundle.json'))
  writeFileSync(path.join(root, 'VERSION.json'), canonicalJson({
    product: 'yihetong',
    profileRevision: validation.profile.metadata.profileRevision,
    profileFingerprint: validation.profileFingerprint,
    packageKind: 'customer-profile',
    sourceVersion,
  }), 'utf8')
  const customerDependencies = lockPackages(repoRoot, [
    'esign-manage-admin/package-lock.json',
    'esign-pc-admin/package-lock.json',
    'esign-mini/package-lock.json',
  ], 'customer-frontend-build dependency')
  const finalized = finalizePackage(root, {
    packageKind: 'customer-profile',
    name: 'customer-profile',
    version: String(validation.profile.metadata.profileRevision),
    sourceVersion,
  }, customerDependencies)
  return { root, name, customerValues: customerSensitiveValues(validation.profile), ...finalized }
}

async function main() {
  const { options } = parseArgs(process.argv.slice(2))
  const repoRoot = required(options, 'repo')
  const outputRoot = required(options, 'out')
  const buildOutputRoot = options['build-output-root']
    ? path.resolve(String(options['build-output-root']))
    : path.join(repoRoot, 'deploy', 'output')
  const version = String(options.version || '')
  const sourceVersion = String(options['source-version'] || '')
  const officialTrustBundlePath = required(options, 'official-trust-bundle')
  if (!/^[0-9A-Za-z][0-9A-Za-z._-]{2,63}$/.test(version)) throw new YhtError('Invalid --version', { code: 'VERSION_INVALID' })
  if (!/^[0-9a-f]{40}$/.test(sourceVersion)) throw new YhtError('--source-version must be a full Git commit', { code: 'SOURCE_VERSION_INVALID' })
  ensureDir(outputRoot)
  const installer = assembleInstaller({ repoRoot, buildOutputRoot, outputRoot, version, sourceVersion, officialTrustBundlePath })
  let customer = null
  if (options['profile-root']) {
    const profileRoot = path.resolve(String(options['profile-root']))
    customer = assembleCustomer({
      repoRoot,
      buildOutputRoot,
      outputRoot,
      profileRoot,
      checklist: options.checklist ? path.resolve(String(options.checklist)) : null,
      sourceVersion,
    })
    runPackageHygieneGate(
      installer.root,
      customer.root,
      path.join(profileRoot, 'customer-profile.yaml'),
    )
  }
  process.stdout.write(canonicalJson({
    status: 'pass',
    installer: { root: installer.root, name: installer.name, fileCount: installer.fileCount },
    customer: customer ? { root: customer.root, name: customer.name, fileCount: customer.fileCount } : null,
  }))
}

main().catch((error) => {
  const safe = error instanceof YhtError
    ? { status: 'fail', code: error.code, message: error.message, details: error.details || [] }
    : { status: 'fail', code: 'UNEXPECTED_ERROR', message: error.message }
  process.stderr.write(canonicalJson(safe))
  process.exitCode = error.exitCode || 2
})
