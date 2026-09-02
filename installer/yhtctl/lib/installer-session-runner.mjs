import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { readYaml, YhtError } from './common.mjs'
import { createConfigurationWorkspace } from './config-init.mjs'
import {
  appendInstallerEvent,
  loadInstallerSecrets,
  publicInstallerSession,
  readInstallerSession,
  updateInstallerSession,
} from './installer-session.mjs'

const ACTIONS = new Set(['check', 'configure', 'install', 'verify', 'status', 'stop', 'repair', 'backup', 'rollback', 'uninstall'])

function redactLine(value) {
  return String(value)
    .replace(/((?:password|secret|token|private.?key|credential)\s*[=:]\s*)\S+/ig, '$1<redacted>')
    .slice(0, 2000)
}

function toWslPath(value) {
  const normalized = path.resolve(value).replaceAll('\\', '/')
  const match = /^([A-Za-z]):\/(.*)$/.exec(normalized)
  return match ? `/mnt/${match[1].toLowerCase()}/${match[2]}` : normalized
}

function communityInvocation(packageRoot, script, args = []) {
  const scriptPath = path.join(packageRoot, 'deploy', 'community', script)
  if (!existsSync(scriptPath)) throw new YhtError(`Community action is missing: ${script}`, { code: 'INSTALLER_ACTION_MISSING' })
  if (process.platform === 'win32') return { command: 'wsl.exe', args: [...wslDistroArgs(), '--', 'sh', toWslPath(scriptPath), ...args], cwd: packageRoot }
  return { command: 'sh', args: [scriptPath, ...args], cwd: packageRoot }
}

function wslDistroArgs() {
  const distro = String(process.env.YHT_INSTALLER_WSL_DISTRO || '').trim()
  return distro ? ['--distribution', distro] : []
}

function yhtctlInvocation(session, command, extra = []) {
  const bin = path.join(session.packageRoot, 'tools', 'yhtctl', 'bin', 'yhtctl.mjs')
  if (!existsSync(bin)) throw new YhtError('Packaged yhtctl entry was not found', { code: 'YHTCTL_ENTRY_MISSING' })
  const workspace = path.resolve(session.config.workspaceRoot || path.join(session.packageRoot, '..', `yihetong-config-${session.id}`))
  const common = [
    '--profile', path.join(workspace, 'customer-profile.yaml'),
    '--secrets', path.join(workspace, 'secrets.refs.yaml'),
  ]
  const commandArgs = {
    check: ['doctor', ...common],
    install: ['install', ...common, '--package-root', session.packageRoot, '--yes'],
    verify: ['verify', ...common],
    status: ['status', ...common],
    backup: ['backup', ...common, '--reason', 'installer-session'],
    rollback: ['rollback', ...common, '--receipt', session.config.rollbackReceipt || '', '--yes'],
    repair: ['config', 'update', ...common, '--package-root', session.packageRoot, '--yes'],
  }
  if (!commandArgs[command]) throw new YhtError(`Custom mode does not implement ${command}`, { code: 'INSTALLER_ACTION_UNSUPPORTED' })
  if (command === 'rollback' && !session.config.rollbackReceipt) throw new YhtError('Select a rollback receipt before rollback', { code: 'ROLLBACK_RECEIPT_REQUIRED' })
  if (session.config.rootPrefix) commandArgs[command].push('--root-prefix', path.resolve(session.config.rootPrefix))
  return { command: process.execPath, args: [bin, ...commandArgs[command], ...extra], cwd: session.packageRoot }
}

function environmentForSession(root, session) {
  const secrets = loadInstallerSecrets({ root, id: session.id })
  const env = { ...process.env }
  const workspace = session.config.workspaceRoot
  if (workspace && existsSync(path.join(workspace, 'secrets.refs.yaml'))) {
    const refs = readYaml(path.join(workspace, 'secrets.refs.yaml'))
    for (const [id, descriptor] of Object.entries(refs.refs || {})) {
      if (descriptor.provider === 'env' && descriptor.key && Object.hasOwn(secrets, id)) env[descriptor.key] = String(secrets[id])
    }
  }
  return env
}

function runStreaming(invocation, { env, onLine }) {
  return new Promise((resolve, reject) => {
    const child = spawn(invocation.command, invocation.args, {
      cwd: invocation.cwd,
      env,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''
    const collect = (stream, target) => {
      stream.setEncoding('utf8')
      stream.on('data', (chunk) => {
        if (target === 'stdout') stdout += chunk
        else stderr += chunk
        for (const line of String(chunk).split(/\r?\n/).filter(Boolean)) onLine(redactLine(line), target)
      })
    }
    collect(child.stdout, 'stdout')
    collect(child.stderr, 'stderr')
    child.once('error', reject)
    child.once('close', (code) => resolve({ code, stdout: redactLine(stdout), stderr: redactLine(stderr) }))
  })
}

function configureSession(root, session) {
  const workspaceRoot = path.resolve(session.config.workspaceRoot || path.join(session.packageRoot, '..', `yihetong-config-${session.id}`))
  if (!existsSync(workspaceRoot)) {
    createConfigurationWorkspace({
      outputDir: workspaceRoot,
      packageRoot: session.packageRoot,
      answers: {
        environment: session.config.environment || 'staging',
        installProfile: session.config.installProfile || 'community',
        customerCode: session.config.customerCode || 'yihetong-local',
        projectName: session.config.projectName || '一合通',
        companyName: session.config.companyName || '一合通',
        owner: session.config.owner || 'local-operator',
        baseDomain: session.config.baseDomain || 'localhost',
        provider: session.config.provider || 'generic-linux',
        databaseHost: session.config.databaseHost,
        databasePort: session.config.databasePort,
        databaseName: session.config.databaseName,
        databaseUsername: session.config.databaseUsername,
        redisHost: session.config.redisHost,
        redisPort: session.config.redisPort,
        storageCredentialMode: session.config.storageCredentialMode || 'disabled',
      },
    })
  }
  updateInstallerSession({ root, id: session.id, patch: { phase: 'confirmation', status: 'configured', config: { ...session.config, workspaceRoot } } })
  appendInstallerEvent({ root, id: session.id, stage: 'configure', status: 'pass', message: '非秘密配置工作区已生成并进入确认阶段。' })
  return publicInstallerSession({ root, id: session.id })
}

function invocationFor(session, action) {
  if (session.mode === 'custom') return yhtctlInvocation(session, action)
  const commands = {
    check: ['runtime-guard.sh'],
    install: ['start.sh'],
    verify: ['verify.sh'],
    status: ['verify.sh'],
    stop: ['stop.sh'],
    repair: ['start.sh'],
    backup: ['backup.sh'],
    rollback: ['rollback.sh', session.config.communityBackup ? [session.config.communityBackup, '--yes'] : []],
    uninstall: ['uninstall.sh', ['--yes']],
  }
  const selected = commands[action]
  if (!selected) throw new YhtError(`Quick mode does not implement ${action}`, { code: 'INSTALLER_ACTION_UNSUPPORTED' })
  const [script, args = []] = selected
  if (action === 'rollback' && !session.config.communityBackup) throw new YhtError('Select a community backup before rollback', { code: 'ROLLBACK_BACKUP_REQUIRED' })
  if (action === 'check') {
    const guard = path.join(session.packageRoot, 'deploy', 'community', 'runtime-guard.sh')
    const source = process.platform === 'win32' ? toWslPath(guard) : guard
    if (process.platform === 'win32') return { command: 'wsl.exe', args: [...wslDistroArgs(), '--', 'sh', '-c', `. '${source}'; require_supported_runtime`], cwd: session.packageRoot }
    return { command: 'sh', args: ['-c', `. '${source}'; require_supported_runtime`], cwd: session.packageRoot }
  }
  return communityInvocation(session.packageRoot, script, args)
}

export async function runInstallerAction({ root, id, action, dryRun = false }) {
  if (!ACTIONS.has(action)) throw new YhtError('Unknown installer action', { code: 'INSTALLER_ACTION_INVALID' })
  const session = readInstallerSession({ root, id })
  if (action === 'configure') return configureSession(root, session)
  if (session.mode === 'custom' && !session.config.workspaceRoot) {
    throw new YhtError('Run configure before custom installation actions', { code: 'INSTALLER_CONFIG_REQUIRED' })
  }
  const invocation = invocationFor(session, action)
  appendInstallerEvent({ root, id, stage: action, status: 'running', message: `正在执行：${action}` })
  updateInstallerSession({ root, id, patch: { status: 'running', phase: action, lastAction: action, lastError: null } })
  if (dryRun) {
    appendInstallerEvent({ root, id, stage: action, status: 'pass', message: '结构化演练完成；未改变运行环境。', details: { command: invocation.command, argumentCount: invocation.args.length } })
    updateInstallerSession({ root, id, patch: { status: 'dry_run_pass' } })
    return publicInstallerSession({ root, id })
  }
  const result = await runStreaming(invocation, {
    env: environmentForSession(root, session),
    onLine: (line, channel) => appendInstallerEvent({ root, id, stage: action, status: 'progress', message: line, details: { channel } }),
  })
  if (result.code !== 0) {
    const error = { code: 'INSTALLER_ACTION_FAILED', action, exitCode: result.code, message: result.stderr || result.stdout || `${action} failed` }
    appendInstallerEvent({ root, id, stage: action, status: 'fail', message: error.message, code: error.code })
    updateInstallerSession({ root, id, patch: { status: 'failed', lastError: error } })
    throw new YhtError(error.message, { code: error.code, details: [{ action, exitCode: result.code }] })
  }
  let maintenancePatch = {}
  if (action === 'backup') {
    if (session.mode === 'quick') {
      const backup = /directory=([^\r\n]+)/.exec(result.stdout)?.[1]?.trim()
      if (backup) maintenancePatch = { config: { ...session.config, communityBackup: backup } }
    } else {
      try {
        const backup = JSON.parse(result.stdout)
        if (backup.receiptPath) maintenancePatch = { config: { ...session.config, rollbackReceipt: backup.receiptPath } }
      } catch { /* the backup command already passed; absence of structured output only disables one-click rollback */ }
    }
  }
  const entries = action === 'install' || action === 'verify' ? [
    { id: 'pc', label: '用户端', url: 'http://localhost:18080' },
    { id: 'admin', label: '管理端', url: 'http://localhost:18081' },
    { id: 'h5', label: 'H5', url: 'http://localhost:18082' },
    { id: 'website', label: '官网', url: 'http://localhost:13001' },
    { id: 'api', label: 'API', url: 'http://localhost:18763' },
  ] : session.entries
  appendInstallerEvent({ root, id, stage: action, status: 'pass', message: `${action} 已完成。` })
  updateInstallerSession({ root, id, patch: { status: 'pass', entries, lastError: null, phase: action === 'install' || action === 'verify' ? 'complete' : action, ...maintenancePatch } })
  return publicInstallerSession({ root, id })
}

export const installerActions = [...ACTIONS]
