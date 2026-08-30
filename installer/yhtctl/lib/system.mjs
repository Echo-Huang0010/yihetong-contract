import { spawnSync } from 'node:child_process'
import { accessSync, constants, existsSync, readFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { YhtError } from './common.mjs'

export function run(command, args = [], options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    env: options.env || process.env,
    encoding: options.encoding === undefined ? 'utf8' : options.encoding,
    input: options.input,
    windowsHide: true,
    stdio: options.stdio || ['pipe', 'pipe', 'pipe'],
  })
  if (result.error || (result.status !== 0 && !options.allowFailure)) {
    throw new YhtError(`Command failed: ${command}`, {
      code: options.code || 'COMMAND_FAILED',
      details: [{
        command,
        args,
        status: result.status,
        error: result.error?.message,
        stderr: String(result.stderr || '').trim().slice(0, 4000),
      }],
      exitCode: options.exitCode || 3,
    })
  }
  return result
}

export function commandExists(command) {
  return Boolean(resolveCommand(command))
}

export function resolveCommand(command) {
  const probe = process.platform === 'win32'
    ? run('where.exe', [command], { allowFailure: true })
    : run('sh', ['-c', 'command -v "$1"', 'sh', command], { allowFailure: true })
  if (probe.status !== 0) return null
  return String(probe.stdout || '').split(/\r?\n/).map((value) => value.trim()).find(Boolean) || null
}

export function targetPath(rootPrefix, absolutePath) {
  if (!path.posix.isAbsolute(absolutePath)) {
    throw new YhtError(`Target path is not absolute: ${absolutePath}`, { code: 'UNSAFE_TARGET_PATH' })
  }
  const prefix = path.resolve(rootPrefix || path.parse(process.cwd()).root)
  if (prefix === path.parse(prefix).root) return path.resolve(absolutePath)
  const relative = absolutePath.replace(/^\/+/, '').split('/')
  const resolved = path.resolve(prefix, ...relative)
  if (resolved !== prefix && !resolved.startsWith(`${prefix}${path.sep}`)) {
    throw new YhtError(`Target path escapes root prefix: ${absolutePath}`, { code: 'UNSAFE_TARGET_PATH' })
  }
  return resolved
}

export function readOsRelease() {
  if (!existsSync('/etc/os-release')) return {}
  const result = {}
  for (const line of readFileSync('/etc/os-release', 'utf8').split(/\r?\n/)) {
    const match = /^([A-Z_]+)=(.*)$/.exec(line)
    if (!match) continue
    result[match[1]] = match[2].replace(/^"|"$/g, '')
  }
  return result
}

export function doctorChecks(profile) {
  const requiredCommands = [
    'bash',
    'curl',
    'find',
    'gzip',
    'java',
    'mysql',
    'mysqldump',
    'nginx',
    'node',
    'python3',
    'redis-cli',
    'sha256sum',
    'ss',
    'systemctl',
  ]
  const checks = []
  checks.push({ id: 'os', ok: process.platform === 'linux', actual: process.platform, expected: 'linux' })
  checks.push({ id: 'arch', ok: os.arch() === 'x64', actual: os.arch(), expected: 'x64' })
  checks.push({ id: 'root', ok: typeof process.getuid !== 'function' || process.getuid() === 0, actual: typeof process.getuid === 'function' ? process.getuid() : 'unknown', expected: 0 })
  for (const command of requiredCommands) {
    const resolved = resolveCommand(command)
    checks.push({ id: `command:${command}`, ok: Boolean(resolved), actual: resolved || 'missing', expected: 'executable path' })
  }
  const mysqlVersion = String(run('mysql', ['--version'], { allowFailure: true }).stdout || '')
  const redisVersion = String(run('redis-server', ['--version'], { allowFailure: true }).stdout || '')
  const javaProbe = run('java', ['-version'], { allowFailure: true })
  const javaVersion = `${javaProbe.stdout || ''}\n${javaProbe.stderr || ''}`
  const nodeVersion = String(run('node', ['--version'], { allowFailure: true }).stdout || '').trim()
  const pythonVersion = String(run('python3', ['--version'], { allowFailure: true }).stdout || '').trim()
  const nginxProbe = run('nginx', ['-v'], { allowFailure: true })
  const nginxVersion = `${nginxProbe.stdout || ''}${nginxProbe.stderr || ''}`.trim()
  const redisMajor = Number.parseInt((/v=(\d+)/.exec(redisVersion) || [])[1] || '0', 10)
  const nodeMajor = Number.parseInt((/^v(\d+)/.exec(nodeVersion) || [])[1] || '0', 10)
  const pythonMatch = /Python\s+(\d+)\.(\d+)/.exec(pythonVersion)
  checks.push({ id: 'version:mysql', ok: /(?:Ver|Distrib)\s+8\./i.test(mysqlVersion), actual: mysqlVersion.trim(), expected: 'MySQL 8' })
  checks.push({ id: 'version:redis', ok: redisMajor >= 6, actual: redisVersion.trim(), expected: 'Redis >=6' })
  checks.push({ id: 'version:java', ok: /version\s+"1\.8\./.test(javaVersion), actual: javaVersion.trim().split(/\r?\n/)[0], expected: 'Java 8' })
  checks.push({ id: 'version:node', ok: nodeMajor >= 20, actual: nodeVersion, expected: 'Node.js >=20' })
  checks.push({ id: 'version:python', ok: Number(pythonMatch?.[1] || 0) > 3 || (Number(pythonMatch?.[1] || 0) === 3 && Number(pythonMatch?.[2] || 0) >= 10), actual: pythonVersion, expected: 'Python >=3.10' })
  checks.push({ id: 'version:nginx', ok: /nginx\/\d+\./.test(nginxVersion), actual: nginxVersion, expected: 'Nginx' })
  if (profile) {
    const ports = [profile.deployment.ports.api, profile.deployment.ports.website]
    checks.push({ id: 'port-uniqueness', ok: new Set(ports).size === ports.length, actual: ports, expected: 'unique' })
    checks.push({ id: 'provider-scope', ok: profile.storage.provider === 'aliyun-oss', actual: profile.storage.provider, expected: 'aliyun-oss' })
  }
  const osRelease = readOsRelease()
  return {
    status: checks.every((check) => check.ok) ? 'pass' : 'fail',
    checkedAt: new Date().toISOString(),
    platform: process.platform,
    architecture: os.arch(),
    osRelease: { id: osRelease.ID, versionId: osRelease.VERSION_ID, name: osRelease.NAME },
    checks,
  }
}

export function assertReadable(filePath, label = 'file') {
  try {
    accessSync(filePath, constants.R_OK)
  } catch (error) {
    throw new YhtError(`${label} is not readable: ${filePath}`, { code: 'FILE_NOT_READABLE' })
  }
}
