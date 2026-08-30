import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { YhtError } from './common.mjs'

export const documentDependencyScript = 'deploy/ops/install-document-conversion-deps.sh'

export function documentPreparationPlan(packageRoot) {
  const root = path.resolve(packageRoot)
  const script = path.join(root, ...documentDependencyScript.split('/'))
  if (!existsSync(script)) {
    throw new YhtError(`Document conversion dependency installer is missing: ${documentDependencyScript}`, {
      code: 'DOCUMENT_DEPENDENCY_SCRIPT_MISSING',
    })
  }
  const source = readFileSync(script, 'utf8')
  if (!source.includes('detect_package_family') || !source.includes('fonts-noto-cjk') || !source.includes('google-noto-sans-cjk-fonts')) {
    throw new YhtError('Document dependency installer does not contain the required deb/rpm branches', {
      code: 'DOCUMENT_DEPENDENCY_SCRIPT_INVALID',
    })
  }
  return { packageRoot: root, script, relativeScript: documentDependencyScript }
}

export function prepareDocumentDependencies({ packageRoot, install = false, runner = spawnSync, platform = process.platform }) {
  if (platform !== 'linux') {
    throw new YhtError('Host preparation must run on the target Linux server', {
      code: 'LINUX_TARGET_REQUIRED',
      exitCode: 3,
    })
  }
  const plan = documentPreparationPlan(packageRoot)
  const mode = install ? 'install' : 'check'
  const result = runner('bash', [plan.script], {
    cwd: plan.packageRoot,
    encoding: 'utf8',
    env: { ...process.env, MODE: mode },
    windowsHide: true,
  })
  if (result.error || result.status !== 0) {
    throw new YhtError(`Document dependency ${mode} failed`, {
      code: 'DOCUMENT_DEPENDENCIES_FAILED',
      details: [result.error?.message, result.stdout, result.stderr].filter(Boolean),
      exitCode: 1,
    })
  }
  const lines = String(result.stdout || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  return {
    status: 'pass',
    action: install ? 'installed_and_checked' : 'checked',
    packageRoot: plan.packageRoot,
    script: plan.relativeScript,
    output: lines,
  }
}
