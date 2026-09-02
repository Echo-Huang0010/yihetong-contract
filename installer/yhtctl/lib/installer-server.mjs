import { randomBytes } from 'node:crypto'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createInstallerSession, publicInstallerSession, storeInstallerSecrets } from './installer-session.mjs'
import { runInstallerAction } from './installer-session-runner.mjs'
import { YhtError } from './common.mjs'

const moduleRoot = path.dirname(fileURLToPath(import.meta.url))
const defaultStaticRoot = path.resolve(moduleRoot, '..', 'wizard', 'dist')
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
}

function sendJson(response, status, body) {
  const content = `${JSON.stringify(body)}\n`
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(content),
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  })
  response.end(content)
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    request.on('data', (chunk) => {
      size += chunk.length
      if (size > 256 * 1024) {
        reject(new YhtError('Request body is too large', { code: 'REQUEST_BODY_TOO_LARGE' }))
        request.destroy()
      } else chunks.push(chunk)
    })
    request.on('end', () => {
      try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}) }
      catch { reject(new YhtError('Request body must be JSON', { code: 'REQUEST_JSON_INVALID' })) }
    })
    request.on('error', reject)
  })
}

function serveStatic(response, staticRoot, pathname) {
  const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '')
  const candidate = path.resolve(staticRoot, relative)
  const root = path.resolve(staticRoot)
  const safe = candidate === root || candidate.startsWith(`${root}${path.sep}`)
  const target = safe && existsSync(candidate) && statSync(candidate).isFile() ? candidate : path.join(root, 'index.html')
  if (!existsSync(target)) {
    response.writeHead(503, { 'content-type': 'text/plain; charset=utf-8' })
    response.end('Installer wizard assets are not built. Run npm run build in tools/yhtctl/wizard.\n')
    return
  }
  response.writeHead(200, {
    'content-type': contentTypes[path.extname(target)] || 'application/octet-stream',
    'cache-control': path.basename(target) === 'index.html' ? 'no-store' : 'public, max-age=31536000, immutable',
    'x-content-type-options': 'nosniff',
    'content-security-policy': "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
  })
  createReadStream(target).pipe(response)
}

export async function startInstallerServer({ host = '127.0.0.1', port = 0, stateRoot, packageRoot = path.resolve(moduleRoot, '..', '..', '..'), staticRoot = defaultStaticRoot } = {}) {
  if (!['127.0.0.1', '::1', 'localhost'].includes(host)) {
    throw new YhtError('Installer wizard may only bind to loopback', { code: 'INSTALLER_LOOPBACK_REQUIRED' })
  }
  const token = randomBytes(24).toString('base64url')
  const server = createServer(async (request, response) => {
    const url = new URL(request.url || '/', `http://${request.headers.host || '127.0.0.1'}`)
    try {
      if (request.method === 'GET' && url.pathname === '/api/health') return sendJson(response, 200, { status: 'pass', service: 'yihetong-installer' })
      if (url.pathname.startsWith('/api/') && request.method !== 'GET' && request.headers['x-yht-installer-token'] !== token) {
        return sendJson(response, 403, { status: 'fail', code: 'INSTALLER_TOKEN_REQUIRED', message: '本机会话令牌无效，请从安装器重新打开向导。' })
      }
      if (request.method === 'POST' && url.pathname === '/api/sessions') {
        const body = await readBody(request)
        const session = createInstallerSession({
          root: stateRoot,
          packageRoot,
          mode: body.mode,
          platform: body.platform || process.platform,
          config: body.config || {},
          createdBy: 'web',
        })
        return sendJson(response, 201, publicInstallerSession({ root: stateRoot, id: session.id }))
      }
      const match = /^\/api\/sessions\/([0-9a-f-]{36})(?:\/(secrets|actions\/([a-z-]+)))?$/.exec(url.pathname)
      if (match && request.method === 'GET' && !match[2]) return sendJson(response, 200, publicInstallerSession({ root: stateRoot, id: match[1] }))
      if (match && request.method === 'POST' && match[2] === 'secrets') {
        const body = await readBody(request)
        return sendJson(response, 200, storeInstallerSecrets({ root: stateRoot, id: match[1], secrets: body.secrets || {} }))
      }
      if (match && request.method === 'POST' && match[3]) {
        const body = await readBody(request)
        const result = await runInstallerAction({ root: stateRoot, id: match[1], action: match[3], dryRun: body.dryRun === true })
        return sendJson(response, 200, result)
      }
      if (url.pathname.startsWith('/api/')) return sendJson(response, 404, { status: 'fail', code: 'NOT_FOUND' })
      return serveStatic(response, staticRoot, url.pathname)
    } catch (error) {
      const status = error.code === 'INSTALLER_SESSION_NOT_FOUND' ? 404 : 400
      return sendJson(response, status, {
        status: 'fail',
        code: error.code || 'INSTALLER_REQUEST_FAILED',
        message: String(error.message || 'Request failed').replace(/((?:password|secret|token)\s*[=:]\s*)\S+/ig, '$1<redacted>'),
        details: Array.isArray(error.details) ? error.details : [],
      })
    }
  })
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, host, resolve)
  })
  const address = server.address()
  const origin = `http://${host.includes(':') ? `[${host}]` : host}:${address.port}`
  return { server, host, port: address.port, origin, token, url: `${origin}/#token=${token}` }
}
