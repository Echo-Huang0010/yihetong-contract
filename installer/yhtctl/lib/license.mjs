import {
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  randomUUID,
  sign,
  verify,
} from 'node:crypto'
import {
  chownSync,
  chmodSync,
  copyFileSync,
  existsSync,
  readFileSync,
  statSync,
} from 'node:fs'
import path from 'node:path'
import {
  atomicWrite,
  canonicalize,
  canonicalJson,
  ensureDir,
  readJson,
  sha256,
  sha256Object,
  YhtError,
} from './common.mjs'

export const ENVELOPE_ALGORITHM = 'ES256'
export const LICENSE_ENVELOPE_SCHEMA = 'yht-license/v1'
export const LEASE_ENVELOPE_SCHEMA = 'yht-lease/v1'
export const INSTANCE_REQUEST_SCHEMA = 'yht-instance-request/v1'
export const INSTANCE_CHALLENGE_SCHEMA = 'yht-instance-challenge/v1'
export const TRUST_BUNDLE_SCHEMA = 'yht-trust-bundle/v1'
export const TRUST_TRANSITION_ENVELOPE_SCHEMA = 'yht-trust-transition/v1'
export const OFFICIAL_TRUST_BUNDLE_RELATIVE = 'commercial/official-trust-bundle.json'

const ACTIVATION_FILES = Object.freeze({
  identity: 'instance.json',
  ['private' + 'Key']: 'instance-private.pem',
  publicKey: 'instance-public.pem',
  license: 'license.json',
  lease: 'lease.json',
  trustBundle: 'trust-bundle.json',
})

function base64UrlEncode(value) {
  return Buffer.from(value).toString('base64url')
}

function base64UrlDecode(value, label) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new YhtError(`${label} must be base64url`, { code: 'LICENSE_ENVELOPE_INVALID' })
  }
  return Buffer.from(value, 'base64url')
}

function iso(value, label) {
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) throw new YhtError(`${label} must be an ISO timestamp`, { code: 'LICENSE_TIME_INVALID' })
  return parsed
}

function publicKeyDer(publicKeyPem) {
  try {
    return createPublicKey(publicKeyPem).export({ format: 'der', type: 'spki' })
  } catch (error) {
    throw new YhtError('Invalid ECDSA public key', { code: 'LICENSE_PUBLIC_KEY_INVALID', details: [error.message] })
  }
}

export function publicKeyFingerprint(publicKeyPem) {
  return sha256(publicKeyDer(publicKeyPem))
}

export function signedPayloadBytes(payload) {
  return Buffer.from(JSON.stringify(canonicalize(payload)), 'utf8')
}

export function createSignedEnvelope({ schemaVersion, keyId, payload, privateKeyPem }) {
  if (!schemaVersion || !keyId || !payload || !privateKeyPem) {
    throw new YhtError('Envelope signing inputs are incomplete', { code: 'LICENSE_SIGN_INPUT_INVALID' })
  }
  const payloadBytes = signedPayloadBytes(payload)
  const signature = sign('sha256', payloadBytes, createPrivateKey(privateKeyPem))
  return {
    schemaVersion,
    algorithm: ENVELOPE_ALGORITHM,
    keyId,
    payload: base64UrlEncode(payloadBytes),
    signature: base64UrlEncode(signature),
  }
}

function parseEnvelope(envelope, expectedSchema) {
  if (!envelope || typeof envelope !== 'object'
      || envelope.schemaVersion !== expectedSchema
      || envelope.algorithm !== ENVELOPE_ALGORITHM
      || typeof envelope.keyId !== 'string') {
    throw new YhtError('Signed envelope metadata is invalid', { code: 'LICENSE_ENVELOPE_INVALID' })
  }
  const payloadBytes = base64UrlDecode(envelope.payload, 'payload')
  const signature = base64UrlDecode(envelope.signature, 'signature')
  let payload
  try {
    payload = JSON.parse(payloadBytes.toString('utf8'))
  } catch (error) {
    throw new YhtError('Signed envelope payload is invalid JSON', { code: 'LICENSE_ENVELOPE_INVALID' })
  }
  if (!Buffer.from(JSON.stringify(canonicalize(payload)), 'utf8').equals(payloadBytes)) {
    throw new YhtError('Signed envelope payload is not canonical JSON', { code: 'LICENSE_PAYLOAD_NOT_CANONICAL' })
  }
  return { payload, payloadBytes, signature }
}

export function validateTrustBundle(bundle) {
  if (bundle.schemaVersion !== TRUST_BUNDLE_SCHEMA || !Array.isArray(bundle.keys) || bundle.keys.length === 0) {
    throw new YhtError('Trust bundle is invalid', { code: 'LICENSE_TRUST_BUNDLE_INVALID' })
  }
  const ids = new Set()
  for (const item of bundle.keys) {
    if (!item || item.algorithm !== ENVELOPE_ALGORITHM || !item.keyId || !item.publicKeyPem || !item.fingerprint) {
      throw new YhtError('Trust bundle key entry is invalid', { code: 'LICENSE_TRUST_BUNDLE_INVALID' })
    }
    if (ids.has(item.keyId)) throw new YhtError('Trust bundle contains duplicate key IDs', { code: 'LICENSE_TRUST_BUNDLE_INVALID' })
    ids.add(item.keyId)
    if (publicKeyFingerprint(item.publicKeyPem) !== item.fingerprint) {
      throw new YhtError('Trust bundle public key fingerprint mismatch', { code: 'LICENSE_TRUST_BUNDLE_INVALID' })
    }
  }
  if (bundle.transitionAuthorityKeyId !== undefined
      && (typeof bundle.transitionAuthorityKeyId !== 'string' || !ids.has(bundle.transitionAuthorityKeyId))) {
    throw new YhtError('Trust transition authority is not a trusted key', { code: 'LICENSE_TRUST_BUNDLE_INVALID' })
  }
  if (bundle.artifactAuthorityKeyId !== undefined
      && (typeof bundle.artifactAuthorityKeyId !== 'string' || !ids.has(bundle.artifactAuthorityKeyId))) {
    throw new YhtError('Artifact signing authority is not a trusted key', { code: 'LICENSE_TRUST_BUNDLE_INVALID' })
  }
  return bundle
}

function trustTransitionAuthority(bundle) {
  if (bundle.transitionAuthorityKeyId) return bundle.transitionAuthorityKeyId
  if (bundle.keys.length === 1) return bundle.keys[0].keyId
  throw new YhtError('A multi-key trust bundle must declare its transition authority', { code: 'TRUST_TRANSITION_AUTHORITY_INVALID' })
}

function artifactAuthority(bundle) {
  if (bundle.artifactAuthorityKeyId) return bundle.artifactAuthorityKeyId
  if (bundle.transitionAuthorityKeyId) return bundle.transitionAuthorityKeyId
  if (bundle.keys.length === 1) return bundle.keys[0].keyId
  throw new YhtError('A multi-key trust bundle must declare its artifact authority', { code: 'ARTIFACT_AUTHORITY_INVALID' })
}

export function loadTrustBundle(trustBundlePath) {
  return validateTrustBundle(readJson(path.resolve(trustBundlePath)))
}

export function applyTrustTransition({ currentTrustBundlePath, transitionPath, outputPath, now = new Date() }) {
  const current = loadTrustBundle(currentTrustBundlePath)
  const transition = readJson(path.resolve(transitionPath))
  const verified = verifySignedEnvelope({
    envelope: transition,
    expectedSchema: TRUST_TRANSITION_ENVELOPE_SCHEMA,
    trustBundle: current,
  })
  const payload = verified.payload
  if (payload.schemaVersion !== 'yht-trust-transition-payload/v1'
      || payload.fromKeyId !== transition.keyId
      || !payload.toKeyId
      || !payload.notBefore
      || !payload.expiresAt) {
    throw new YhtError('Trust transition payload is invalid', { code: 'TRUST_TRANSITION_INVALID' })
  }
  if (payload.fromKeyId !== trustTransitionAuthority(current)) {
    throw new YhtError('Trust transition was not signed by the current transition authority', { code: 'TRUST_TRANSITION_AUTHORITY_INVALID' })
  }
  const notBefore = Date.parse(payload.notBefore)
  const expiresAt = Date.parse(payload.expiresAt)
  if (!Number.isFinite(notBefore) || !Number.isFinite(expiresAt) || now.getTime() < notBefore || now.getTime() > expiresAt) {
    throw new YhtError('Trust transition is outside its validity window', { code: 'TRUST_TRANSITION_TIME_INVALID' })
  }
  const next = validateTrustBundle(payload.trustBundle)
  if (next.transitionAuthorityKeyId !== payload.toKeyId) {
    throw new YhtError('Trust transition target must become the next transition authority', { code: 'TRUST_TRANSITION_AUTHORITY_INVALID' })
  }
  if (next.artifactAuthorityKeyId !== payload.toKeyId) {
    throw new YhtError('Trust transition target must become the next artifact authority', { code: 'ARTIFACT_AUTHORITY_INVALID' })
  }
  const currentById = new Map(current.keys.map((key) => [key.keyId, key.fingerprint]))
  for (const [keyId, fingerprint] of currentById) {
    if (!next.keys.some((key) => key.keyId === keyId && key.fingerprint === fingerprint)) {
      throw new YhtError('Trust transition cannot remove or replace a currently trusted key', { code: 'TRUST_TRANSITION_DOWNGRADE' })
    }
  }
  if (!next.keys.some((key) => key.keyId === payload.toKeyId)) {
    throw new YhtError('Trust transition target key is missing', { code: 'TRUST_TRANSITION_INVALID' })
  }
  const target = path.resolve(outputPath || currentTrustBundlePath)
  atomicWrite(target, canonicalJson(next), 0o640)
  return {
    outputPath: target,
    transitionId: payload.transitionId,
    fromKeyId: payload.fromKeyId,
    toKeyId: payload.toKeyId,
    trustBundleFingerprint: sha256Object(next),
  }
}

export function loadOfficialTrustBundle(packageRoot) {
  const target = path.join(path.resolve(packageRoot), ...OFFICIAL_TRUST_BUNDLE_RELATIVE.split('/'))
  if (!existsSync(target)) {
    throw new YhtError('Installer does not contain the official trust bundle', {
      code: 'OFFICIAL_TRUST_ROOT_MISSING',
      exitCode: 4,
    })
  }
  return { path: target, bundle: loadTrustBundle(target) }
}

export function officialTrustBundleFingerprint(packageRoot) {
  return sha256Object(loadOfficialTrustBundle(packageRoot).bundle)
}

export function activationTrustBundleFingerprint(activationDir) {
  return sha256Object(loadTrustBundle(path.join(path.resolve(activationDir), ACTIVATION_FILES.trustBundle)))
}

export function trustBundleForPublicKey({ keyId, publicKeyPem }) {
  return {
    schemaVersion: TRUST_BUNDLE_SCHEMA,
    transitionAuthorityKeyId: keyId,
    artifactAuthorityKeyId: keyId,
    keys: [{
      keyId,
      algorithm: ENVELOPE_ALGORITHM,
      publicKeyPem,
      fingerprint: publicKeyFingerprint(publicKeyPem),
    }],
  }
}

export function verifySignedEnvelope({ envelope, expectedSchema, trustBundle, allowHistoricalArtifactKey = false }) {
  validateTrustBundle(trustBundle)
  const parsed = parseEnvelope(envelope, expectedSchema)
  const trusted = trustBundle.keys.find((item) => item.keyId === envelope.keyId)
  if (!trusted) throw new YhtError('Envelope signing key is not trusted', { code: 'LICENSE_KEY_NOT_TRUSTED' })
  const artifactAuthorityKeyId = [LICENSE_ENVELOPE_SCHEMA, LEASE_ENVELOPE_SCHEMA].includes(expectedSchema)
    ? artifactAuthority(trustBundle)
    : null
  if (artifactAuthorityKeyId && !allowHistoricalArtifactKey && envelope.keyId !== artifactAuthorityKeyId) {
    throw new YhtError('Envelope was not signed by the current artifact authority', { code: 'ARTIFACT_SIGNING_KEY_INACTIVE' })
  }
  const valid = verify('sha256', parsed.payloadBytes, createPublicKey(trusted.publicKeyPem), parsed.signature)
  if (!valid) throw new YhtError('Envelope signature verification failed', { code: 'LICENSE_SIGNATURE_INVALID' })
  return {
    ...parsed,
    envelopeFingerprint: sha256Object(envelope),
    trustedKeyFingerprint: trusted.fingerprint,
    signingKeyId: envelope.keyId,
    artifactAuthorityKeyId,
    artifactAuthorityCurrent: !artifactAuthorityKeyId || envelope.keyId === artifactAuthorityKeyId,
  }
}

export function generateInstanceIdentity({ activationDir, instanceId = randomUUID(), now = new Date() }) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(instanceId)) {
    throw new YhtError('Instance ID must be a version-4 UUID', { code: 'INSTANCE_ID_INVALID' })
  }
  const target = path.resolve(activationDir)
  ensureDir(target, 0o700)
  const privatePath = path.join(target, ACTIVATION_FILES.privateKey)
  const publicPath = path.join(target, ACTIVATION_FILES.publicKey)
  const identityPath = path.join(target, ACTIVATION_FILES.identity)
  if ([privatePath, publicPath, identityPath].some(existsSync)) {
    throw new YhtError('Instance identity already exists', { code: 'INSTANCE_IDENTITY_EXISTS' })
  }
  const pair = generateKeyPairSync('ec', {
    namedCurve: 'prime256v1',
    publicKeyEncoding: { format: 'pem', type: 'spki' },
    privateKeyEncoding: { format: 'pem', type: 'pkcs8' },
  })
  const fingerprint = publicKeyFingerprint(pair.publicKey)
  const identity = {
    schemaVersion: 'yht-instance-identity/v1',
    instanceId,
    algorithm: ENVELOPE_ALGORITHM,
    publicKeyFingerprint: fingerprint,
    publicKeyPem: pair.publicKey,
    createdAt: now.toISOString(),
  }
  atomicWrite(privatePath, pair.privateKey, 0o600)
  atomicWrite(publicPath, pair.publicKey, 0o644)
  atomicWrite(identityPath, canonicalJson(identity), 0o640)
  return { activationDir: target, identityPath, privatePath, publicPath, identity }
}

export function loadInstanceIdentity(activationDir, { requirePrivateKey = false } = {}) {
  const target = path.resolve(activationDir)
  const identityPath = path.join(target, ACTIVATION_FILES.identity)
  const privatePath = path.join(target, ACTIVATION_FILES.privateKey)
  const publicPath = path.join(target, ACTIVATION_FILES.publicKey)
  const identity = readJson(identityPath)
  if (identity.schemaVersion !== 'yht-instance-identity/v1'
      || identity.algorithm !== ENVELOPE_ALGORITHM
      || identity.publicKeyFingerprint !== publicKeyFingerprint(identity.publicKeyPem)) {
    throw new YhtError('Instance identity is invalid', { code: 'INSTANCE_IDENTITY_INVALID' })
  }
  if (readFileSync(publicPath, 'utf8').trim() !== identity.publicKeyPem.trim()) {
    throw new YhtError('Instance public key does not match identity', { code: 'INSTANCE_IDENTITY_INVALID' })
  }
  if (requirePrivateKey) {
    const privateKey = readFileSync(privatePath, 'utf8')
    const derived = createPublicKey(createPrivateKey(privateKey)).export({ format: 'pem', type: 'spki' })
    if (publicKeyFingerprint(derived) !== identity.publicKeyFingerprint) {
      throw new YhtError('Instance private key does not match identity', { code: 'INSTANCE_IDENTITY_INVALID' })
    }
    if (process.platform !== 'win32' && (statSync(privatePath).mode & 0o077) !== 0) {
      throw new YhtError('Instance private key permissions must be 0600', { code: 'INSTANCE_PRIVATE_KEY_PERMISSIONS' })
    }
  }
  return { activationDir: target, identityPath, privatePath, publicPath, identity }
}

export function createInstanceRequest({
  activationDir,
  profile,
  profileFingerprint,
  version,
  installerManifestFingerprint,
  now = new Date(),
}) {
  const loaded = loadInstanceIdentity(activationDir, { requirePrivateKey: true })
  if (profile.commercialAuthorization.instanceId !== loaded.identity.instanceId) {
    throw new YhtError('Profile instance ID does not match generated identity', { code: 'INSTANCE_PROFILE_MISMATCH' })
  }
  const payload = {
    schemaVersion: 'yht-instance-request-payload/v1',
    product: 'yihetong',
    version,
    installerManifestFingerprint,
    instanceId: loaded.identity.instanceId,
    instanceKeyFingerprint: loaded.identity.publicKeyFingerprint,
    instancePublicKeyPem: loaded.identity.publicKeyPem,
    profileFingerprint,
    customerCodeHash: sha256(profile.metadata.customerCode),
    nonce: randomUUID(),
    createdAt: now.toISOString(),
  }
  return createSignedEnvelope({
    schemaVersion: INSTANCE_REQUEST_SCHEMA,
    keyId: loaded.identity.publicKeyFingerprint,
    payload,
    privateKeyPem: readFileSync(loaded.privatePath, 'utf8'),
  })
}

export function verifyInstanceRequest(envelope) {
  try {
    const envelopeFields = ['algorithm', 'keyId', 'payload', 'schemaVersion', 'signature']
    if (!envelope || typeof envelope !== 'object' || Array.isArray(envelope)
        || Object.keys(envelope).sort().join('\n') !== envelopeFields.sort().join('\n')) {
      throw new YhtError('Instance request envelope fields are invalid', { code: 'INSTANCE_REQUEST_INVALID' })
    }
    const parsed = parseEnvelope(envelope, INSTANCE_REQUEST_SCHEMA)
    const payload = parsed.payload
    const payloadFields = [
      'createdAt',
      'customerCodeHash',
      'installerManifestFingerprint',
      'instanceId',
      'instanceKeyFingerprint',
      'instancePublicKeyPem',
      'nonce',
      'product',
      'profileFingerprint',
      'schemaVersion',
      'version',
    ]
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)
        || Object.keys(payload).sort().join('\n') !== payloadFields.sort().join('\n')) {
      throw new YhtError('Instance request payload fields are invalid', { code: 'INSTANCE_REQUEST_INVALID' })
    }
    const fingerprint = /^[a-f0-9]{64}$/
    const uuidV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    const createdAt = Date.parse(payload.createdAt)
    if (payload.schemaVersion !== 'yht-instance-request-payload/v1'
        || payload.product !== 'yihetong'
        || typeof payload.version !== 'string'
        || !/^[A-Za-z0-9][A-Za-z0-9._+-]{0,127}$/.test(payload.version)
        || !fingerprint.test(payload.installerManifestFingerprint)
        || !uuidV4.test(payload.instanceId)
        || !fingerprint.test(payload.instanceKeyFingerprint)
        || typeof payload.instancePublicKeyPem !== 'string'
        || payload.instancePublicKeyPem.length > 4096
        || !fingerprint.test(payload.profileFingerprint)
        || !fingerprint.test(payload.customerCodeHash)
        || !uuidV4.test(payload.nonce)
        || !Number.isFinite(createdAt)
        || new Date(createdAt).toISOString() !== payload.createdAt
        || payload.instanceKeyFingerprint !== publicKeyFingerprint(payload.instancePublicKeyPem)
        || envelope.keyId !== payload.instanceKeyFingerprint) {
      throw new YhtError('Instance request identity binding is invalid', { code: 'INSTANCE_REQUEST_INVALID' })
    }
    if (!verify('sha256', parsed.payloadBytes, createPublicKey(payload.instancePublicKeyPem), parsed.signature)) {
      throw new YhtError('Instance request proof is invalid', { code: 'INSTANCE_REQUEST_SIGNATURE_INVALID' })
    }
    return { ...parsed, requestFingerprint: sha256Object(envelope) }
  } catch (error) {
    if (['INSTANCE_REQUEST_INVALID', 'INSTANCE_REQUEST_SIGNATURE_INVALID'].includes(error?.code)) throw error
    throw new YhtError('Instance request is invalid', { code: 'INSTANCE_REQUEST_INVALID' })
  }
}

function contextChecks(payload, { profile, profileFingerprint, version, installerManifestFingerprint, identity }) {
  const failures = []
  if (payload.schemaVersion !== 'yht-license-payload/v1') failures.push('payload_schema')
  if (payload.product !== 'yihetong') failures.push('product')
  if (profile.commercialAuthorization.product !== payload.product) failures.push('profile_product')
  if (profile.commercialAuthorization.edition !== payload.edition) failures.push('edition')
  if (profile.commercialAuthorization.instanceId !== identity.instanceId) failures.push('profile_instance_id')
  if (payload.instanceId !== identity.instanceId) failures.push('instance_id')
  if (payload.instanceKeyFingerprint !== identity.publicKeyFingerprint) failures.push('instance_key')
  if (payload.customerCodeHash !== sha256(profile.metadata.customerCode)) failures.push('customer_code')
  if (payload.profileFingerprint && payload.profileFingerprint !== profileFingerprint) failures.push('profile_fingerprint')
  if (Array.isArray(payload.allowedVersions) && !payload.allowedVersions.includes(version)) failures.push('version')
  if (payload.installerManifestFingerprint
      && payload.installerManifestFingerprint !== installerManifestFingerprint) failures.push('installer_manifest')
  return failures
}

function evaluateLease({ leaseEnvelope, trustBundle, licensePayload, licenseFingerprint, identity, nowMs }) {
  if (!leaseEnvelope) return { state: 'missing', reason: 'lease_missing' }
  const verified = verifySignedEnvelope({ envelope: leaseEnvelope, expectedSchema: LEASE_ENVELOPE_SCHEMA, trustBundle })
  const payload = verified.payload
  if (payload.schemaVersion !== 'yht-lease-payload/v1'
      || payload.licenseId !== licensePayload.licenseId
      || payload.licenseEnvelopeFingerprint !== licenseFingerprint
      || payload.instanceId !== identity.instanceId
      || payload.instanceKeyFingerprint !== identity.publicKeyFingerprint) {
    return { state: 'invalid', reason: 'lease_binding_mismatch' }
  }
  if (payload.status === 'revoked') return { state: 'revoked', reason: 'lease_revoked', payload, verified }
  if (nowMs > iso(payload.expiresAt, 'lease.expiresAt')) return { state: 'expired', reason: 'lease_expired', payload, verified }
  if (nowMs < iso(payload.notBefore, 'lease.notBefore')) return { state: 'invalid', reason: 'lease_not_yet_valid', payload, verified }
  return { state: 'active', reason: 'lease_active', payload, verified }
}

export function evaluateCommercialAuthorization({
  profile,
  profileFingerprint,
  version,
  installerManifestFingerprint,
  activationDir,
  purpose = 'runtime',
  now = new Date(),
}) {
  const loaded = loadInstanceIdentity(activationDir, { requirePrivateKey: false })
  const trustBundle = loadTrustBundle(path.join(loaded.activationDir, ACTIVATION_FILES.trustBundle))
  const licenseEnvelope = readJson(path.join(loaded.activationDir, ACTIVATION_FILES.license))
  const verifiedLicense = verifySignedEnvelope({
    envelope: licenseEnvelope,
    expectedSchema: LICENSE_ENVELOPE_SCHEMA,
    trustBundle,
    allowHistoricalArtifactKey: true,
  })
  const payload = verifiedLicense.payload
  const failures = contextChecks(payload, {
    profile,
    profileFingerprint,
    version,
    installerManifestFingerprint,
    identity: loaded.identity,
  })
  if (failures.length) {
    return { state: 'restricted', reason: 'license_binding_mismatch', failures, licenseFingerprint: verifiedLicense.envelopeFingerprint }
  }
  const nowMs = now.getTime()
  if (payload.status === 'revoked') return { state: 'restricted', reason: 'license_revoked', licenseFingerprint: verifiedLicense.envelopeFingerprint }
  if (nowMs < iso(payload.notBefore, 'license.notBefore')) return { state: 'restricted', reason: 'license_not_yet_valid', licenseFingerprint: verifiedLicense.envelopeFingerprint }
  const expiresAt = iso(payload.expiresAt, 'license.expiresAt')
  const graceUntil = iso(payload.graceUntil, 'license.graceUntil')
  if (nowMs > graceUntil) return { state: 'restricted', reason: 'license_grace_expired', licenseFingerprint: verifiedLicense.envelopeFingerprint }
  if (!Array.isArray(payload.entitlements) || !payload.entitlements.includes(purpose)) {
    return { state: 'restricted', reason: 'entitlement_missing', failures: [purpose], licenseFingerprint: verifiedLicense.envelopeFingerprint }
  }
  const leasePath = path.join(loaded.activationDir, ACTIVATION_FILES.lease)
  const leaseEnvelope = existsSync(leasePath) ? readJson(leasePath) : null
  const lease = payload.leaseRequired
    ? evaluateLease({
      leaseEnvelope,
      trustBundle,
      licensePayload: payload,
      licenseFingerprint: verifiedLicense.envelopeFingerprint,
      identity: loaded.identity,
      nowMs,
    })
    : { state: 'not_required', reason: 'lease_not_required' }
  let state = 'active'
  let reason = 'license_active'
  if (nowMs > expiresAt) {
    state = 'grace'
    reason = 'license_expired_in_grace'
  }
  if (payload.leaseRequired && lease.state !== 'active') {
    const bootstrapUntil = payload.bootstrapUntil ? iso(payload.bootstrapUntil, 'license.bootstrapUntil') : 0
    if (lease.state === 'revoked') {
      state = 'restricted'
      reason = lease.reason
    } else if (nowMs <= bootstrapUntil) {
      state = 'bootstrap'
      reason = 'lease_bootstrap_window'
    } else if (nowMs <= graceUntil && lease.state === 'expired') {
      state = 'grace'
      reason = 'lease_expired_in_grace'
    } else {
      state = 'restricted'
      reason = lease.reason
    }
  }
  if (!verifiedLicense.artifactAuthorityCurrent && lease.state !== 'active') {
    state = 'restricted'
    reason = 'historical_license_requires_current_lease'
  }
  return {
    state,
    reason,
    licenseId: payload.licenseId,
    edition: payload.edition,
    expiresAt: payload.expiresAt,
    graceUntil: payload.graceUntil,
    leaseState: lease.state,
    licenseFingerprint: verifiedLicense.envelopeFingerprint,
    trustedKeyFingerprint: verifiedLicense.trustedKeyFingerprint,
  }
}

export function assertCommercialAuthorization(options) {
  let result
  try {
    result = evaluateCommercialAuthorization(options)
  } catch (error) {
    if (!(error instanceof YhtError)) throw error
    throw new YhtError('Commercial authorization rejected: activation_invalid', {
      code: 'COMMERCIAL_AUTHORIZATION_REQUIRED',
      exitCode: 4,
      details: [{ state: 'restricted', reason: 'activation_invalid', cause: error.code }],
    })
  }
  const allowed = options.purpose === 'install'
    ? ['active', 'bootstrap'].includes(result.state)
    : ['active', 'bootstrap', 'grace'].includes(result.state)
  if (!allowed) {
    throw new YhtError(`Commercial authorization rejected: ${result.reason}`, {
      code: 'COMMERCIAL_AUTHORIZATION_REQUIRED',
      exitCode: 4,
      details: [{ state: result.state, reason: result.reason }],
    })
  }
  return result
}

export function activateCommercialLicense({
  activationDir,
  licensePath,
  officialTrustBundlePath,
  suppliedTrustBundlePath = null,
  leasePath = null,
}) {
  const loaded = loadInstanceIdentity(activationDir, { requirePrivateKey: true })
  const trustBundle = loadTrustBundle(officialTrustBundlePath)
  if (suppliedTrustBundlePath) {
    const supplied = loadTrustBundle(suppliedTrustBundlePath)
    if (sha256Object(supplied) !== sha256Object(trustBundle)) {
      throw new YhtError('Supplied trust bundle does not match the installer-pinned official root', {
        code: 'OFFICIAL_TRUST_ROOT_MISMATCH',
        exitCode: 4,
      })
    }
  }
  const licenseEnvelope = readJson(licensePath)
  const verified = verifySignedEnvelope({ envelope: licenseEnvelope, expectedSchema: LICENSE_ENVELOPE_SCHEMA, trustBundle })
  if (verified.payload.instanceId !== loaded.identity.instanceId
      || verified.payload.instanceKeyFingerprint !== loaded.identity.publicKeyFingerprint) {
    throw new YhtError('License is bound to a different instance', { code: 'LICENSE_INSTANCE_MISMATCH' })
  }
  atomicWrite(path.join(loaded.activationDir, ACTIVATION_FILES.trustBundle), canonicalJson(trustBundle), 0o640)
  atomicWrite(path.join(loaded.activationDir, ACTIVATION_FILES.license), canonicalJson(licenseEnvelope), 0o640)
  if (leasePath) {
    const leaseEnvelope = readJson(leasePath)
    verifySignedEnvelope({ envelope: leaseEnvelope, expectedSchema: LEASE_ENVELOPE_SCHEMA, trustBundle })
    atomicWrite(path.join(loaded.activationDir, ACTIVATION_FILES.lease), canonicalJson(leaseEnvelope), 0o640)
  }
  return { activationDir: loaded.activationDir, licenseFingerprint: verified.envelopeFingerprint }
}

export function createInstanceChallenge({ activationDir, licenseId, now = new Date() }) {
  const loaded = loadInstanceIdentity(activationDir, { requirePrivateKey: true })
  const payload = {
    schemaVersion: 'yht-instance-challenge-payload/v1',
    licenseId,
    instanceId: loaded.identity.instanceId,
    instanceKeyFingerprint: loaded.identity.publicKeyFingerprint,
    nonce: randomUUID(),
    createdAt: now.toISOString(),
  }
  return createSignedEnvelope({
    schemaVersion: INSTANCE_CHALLENGE_SCHEMA,
    keyId: loaded.identity.publicKeyFingerprint,
    payload,
    privateKeyPem: readFileSync(loaded.privatePath, 'utf8'),
  })
}

export function verifyInstanceChallenge(envelope, publicKeyPem) {
  const parsed = parseEnvelope(envelope, INSTANCE_CHALLENGE_SCHEMA)
  const payload = parsed.payload
  if (payload.schemaVersion !== 'yht-instance-challenge-payload/v1'
      || payload.instanceKeyFingerprint !== publicKeyFingerprint(publicKeyPem)
      || envelope.keyId !== payload.instanceKeyFingerprint
      || !verify('sha256', parsed.payloadBytes, createPublicKey(publicKeyPem), parsed.signature)) {
    throw new YhtError('Instance challenge proof is invalid', { code: 'INSTANCE_CHALLENGE_INVALID' })
  }
  return parsed
}

export async function refreshCommercialLease({ activationDir, controlPlaneUrl }) {
  const loaded = loadInstanceIdentity(activationDir, { requirePrivateKey: true })
  const licenseEnvelope = readJson(path.join(loaded.activationDir, ACTIVATION_FILES.license))
  const trustBundle = loadTrustBundle(path.join(loaded.activationDir, ACTIVATION_FILES.trustBundle))
  const license = verifySignedEnvelope({
    envelope: licenseEnvelope,
    expectedSchema: LICENSE_ENVELOPE_SCHEMA,
    trustBundle,
    allowHistoricalArtifactKey: true,
  })
  const challenge = createInstanceChallenge({ activationDir, licenseId: license.payload.licenseId })
  const response = await fetch(new URL('/v1/leases/refresh', controlPlaneUrl), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ license: licenseEnvelope, challenge }),
  })
  const body = await response.json().catch(() => null)
  if (!response.ok || !body?.lease) {
    throw new YhtError('Commercial control plane lease refresh failed', {
      code: 'LEASE_REFRESH_FAILED',
      details: [{ status: response.status, reason: body?.reason || 'invalid_response' }],
    })
  }
  verifySignedEnvelope({ envelope: body.lease, expectedSchema: LEASE_ENVELOPE_SCHEMA, trustBundle })
  const leasePath = path.join(loaded.activationDir, ACTIVATION_FILES.lease)
  const directoryStat = statSync(loaded.activationDir)
  atomicWrite(leasePath, canonicalJson(body.lease), 0o640)
  if (process.platform === 'linux') chownSync(leasePath, directoryStat.uid, directoryStat.gid)
  chmodSync(leasePath, 0o640)
  return { status: 'pass', leasePath, leaseFingerprint: sha256Object(body.lease) }
}

export function copyActivationFilesToRender({ activationDir, outputDir }) {
  const loaded = loadInstanceIdentity(activationDir, { requirePrivateKey: true })
  const required = [ACTIVATION_FILES.identity, ACTIVATION_FILES.privateKey, ACTIVATION_FILES.publicKey, ACTIVATION_FILES.license, ACTIVATION_FILES.trustBundle]
  const optional = [ACTIVATION_FILES.lease]
  const copied = []
  for (const name of [...required, ...optional]) {
    const source = path.join(loaded.activationDir, name)
    if (!existsSync(source)) {
      if (required.includes(name)) throw new YhtError(`Activation file is missing: ${name}`, { code: 'ACTIVATION_FILE_MISSING' })
      continue
    }
    const target = path.join(outputDir, 'commercial', name)
    ensureDir(path.dirname(target), 0o700)
    copyFileSync(source, target)
    const mode = name === ACTIVATION_FILES.privateKey ? 0o600 : 0o640
    chmodSync(target, mode)
    copied.push({ path: `commercial/${name}`, sensitive: name === ACTIVATION_FILES.privateKey, mode })
  }
  return copied
}

export function activationFileDescriptors(activationDir) {
  const loaded = loadInstanceIdentity(activationDir, { requirePrivateKey: true })
  const required = [ACTIVATION_FILES.identity, ACTIVATION_FILES.privateKey, ACTIVATION_FILES.publicKey, ACTIVATION_FILES.license, ACTIVATION_FILES.trustBundle]
  const optional = [ACTIVATION_FILES.lease]
  const descriptors = {}
  for (const name of [...required, ...optional]) {
    const source = path.join(loaded.activationDir, name)
    if (!existsSync(source)) {
      if (required.includes(name)) throw new YhtError(`Activation file is missing: ${name}`, { code: 'ACTIVATION_FILE_MISSING' })
      continue
    }
    descriptors[`commercial/${name}`] = {
      content: readFileSync(source, 'utf8'),
      mode: name === ACTIVATION_FILES.privateKey ? 0o600 : 0o640,
      sensitive: name === ACTIVATION_FILES.privateKey,
    }
  }
  return descriptors
}

export function activationFiles() {
  return { ...ACTIVATION_FILES }
}
