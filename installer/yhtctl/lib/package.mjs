import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { canonicalJson, readJson, sha256, sha256Object, YhtError } from './common.mjs'

export function loadPackageMetadata(packageRoot) {
  const versionPath = path.join(packageRoot, 'VERSION.json')
  const manifestPath = path.join(packageRoot, 'MANIFEST.json')
  if (!existsSync(versionPath) || !existsSync(manifestPath)) {
    throw new YhtError('Installer package is missing VERSION.json or MANIFEST.json', {
      code: 'PACKAGE_METADATA_MISSING',
    })
  }
  const version = readJson(versionPath)
  const manifest = readJson(manifestPath)
  return { version, manifest, versionPath, manifestPath }
}

export function computeManifestFingerprint(manifest) {
  const { manifestFingerprint: _stored, ...unsigned } = manifest || {}
  return sha256Object(unsigned)
}

function packageFilePaths(root, current = root, files = []) {
  for (const name of readdirSync(current)) {
    const full = path.join(current, name)
    const stat = statSync(full)
    if (stat.isDirectory()) packageFilePaths(root, full, files)
    else if (stat.isFile()) files.push(path.relative(root, full).split(path.sep).join('/'))
  }
  return files
}

function parseChecksumFile(filePath, failures) {
  if (!existsSync(filePath)) {
    failures.push({ path: 'SHA256SUMS.txt', code: 'CHECKSUM_FILE_MISSING' })
    return new Map()
  }
  const entries = new Map()
  for (const [index, line] of readFileSync(filePath, 'utf8').split(/\r?\n/).entries()) {
    if (!line) continue
    const match = /^([a-f0-9]{64})  ([^\r\n]+)$/.exec(line)
    if (!match || entries.has(match?.[2])) {
      failures.push({ path: 'SHA256SUMS.txt', code: 'CHECKSUM_ENTRY_INVALID', line: index + 1 })
      continue
    }
    entries.set(match[2], match[1])
  }
  return entries
}

export function verifyPackage(packageRoot) {
  const { version, manifest } = loadPackageMetadata(packageRoot)
  const failures = []
  const computedFingerprint = computeManifestFingerprint(manifest)
  if (manifest.manifestFingerprint !== computedFingerprint) {
    failures.push({ path: 'MANIFEST.json', code: 'MANIFEST_FINGERPRINT_MISMATCH' })
  }
  const declaredPaths = new Set()
  for (const item of manifest.files || []) {
    if (declaredPaths.has(item.path)) {
      failures.push({ path: item.path, code: 'DUPLICATE_MANIFEST_PATH' })
      continue
    }
    declaredPaths.add(item.path)
    if (!item.path || path.isAbsolute(item.path) || item.path.includes('..')) {
      failures.push({ path: item.path, code: 'UNSAFE_MANIFEST_PATH' })
      continue
    }
    const filePath = path.resolve(packageRoot, ...item.path.split('/'))
    const root = path.resolve(packageRoot)
    if (!filePath.startsWith(`${root}${path.sep}`)) {
      failures.push({ path: item.path, code: 'MANIFEST_PATH_ESCAPE' })
      continue
    }
    if (!existsSync(filePath) || !statSync(filePath).isFile()) {
      failures.push({ path: item.path, code: 'MANIFEST_FILE_MISSING' })
      continue
    }
    const content = readFileSync(filePath)
    if (content.length !== item.bytes) failures.push({ path: item.path, code: 'MANIFEST_SIZE_MISMATCH' })
    if (sha256(content) !== item.sha256) failures.push({ path: item.path, code: 'MANIFEST_HASH_MISMATCH' })
  }
  const actualPayloadPaths = packageFilePaths(packageRoot)
    .filter((relative) => !['MANIFEST.json', 'SHA256SUMS.txt'].includes(relative))
    .sort()
  for (const relative of actualPayloadPaths) {
    if (!declaredPaths.has(relative)) failures.push({ path: relative, code: 'UNTRACKED_PACKAGE_FILE' })
  }
  for (const relative of declaredPaths) {
    if (!actualPayloadPaths.includes(relative)) failures.push({ path: relative, code: 'DECLARED_PACKAGE_FILE_MISSING' })
  }
  const checksumEntries = parseChecksumFile(path.join(packageRoot, 'SHA256SUMS.txt'), failures)
  const checksumTargets = packageFilePaths(packageRoot)
    .filter((relative) => relative !== 'SHA256SUMS.txt')
    .sort()
  for (const relative of checksumTargets) {
    const actual = sha256(readFileSync(path.join(packageRoot, ...relative.split('/'))))
    if (checksumEntries.get(relative) !== actual) failures.push({ path: relative, code: 'CHECKSUM_MISMATCH' })
  }
  for (const relative of checksumEntries.keys()) {
    if (!checksumTargets.includes(relative)) failures.push({ path: relative, code: 'CHECKSUM_TARGET_MISSING' })
  }
  const result = {
    status: failures.length ? 'fail' : 'pass',
    version: version.version,
    sourceVersion: version.sourceVersion,
    manifestFingerprint: computedFingerprint,
    checkedFiles: (manifest.files || []).length,
    failures,
  }
  if (failures.length) {
    throw new YhtError('Installer package manifest verification failed', {
      code: 'PACKAGE_MANIFEST_INVALID',
      details: failures,
    })
  }
  return result
}

export function packageSummary(packageRoot) {
  const { version, manifest } = loadPackageMetadata(packageRoot)
  return {
    version,
    manifest: {
      formatVersion: manifest.formatVersion,
      fileCount: (manifest.files || []).length,
      fingerprint: computeManifestFingerprint(manifest),
      sbom: manifest.sbom,
    },
  }
}
