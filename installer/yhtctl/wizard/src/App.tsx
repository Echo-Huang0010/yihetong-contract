import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  Box,
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  Database,
  ExternalLink,
  HardDrive,
  KeyRound,
  LoaderCircle,
  MonitorCog,
  Network,
  Play,
  RotateCcw,
  ShieldCheck,
  Square,
  Wrench,
} from 'lucide-react'
import { Button } from './components/ui/button'
import { Field } from './components/ui/field'
import { Input } from './components/ui/input'
import { Select } from './components/ui/select'

type InstallerEvent = { sequence: number; at: string; stage: string; status: string; message: string; code?: string }
type InstallerSession = {
  id: string
  status: string
  phase: string
  mode: 'quick' | 'custom'
  sessionFingerprint: string
  secretState: { configured: boolean; names: string[] }
  entries: Array<{ id: string; label: string; url: string }>
  config?: { communityBackup?: string; rollbackReceipt?: string }
  events: InstallerEvent[]
  lastError?: { message: string } | null
}

const steps = [
  ['environment', '环境检查', MonitorCog],
  ['mode', '安装方式', Box],
  ['entries', '域名与入口', Network],
  ['resources', '数据与存储', Database],
  ['brand', '品牌信息', Square],
  ['admin', '初始管理员', KeyRound],
  ['confirm', '确认并安装', ShieldCheck],
] as const

const initialConfig = {
  environment: 'staging',
  installProfile: 'community',
  customerCode: 'yihetong-local',
  projectName: '一合通',
  companyName: '一合通',
  owner: 'local-operator',
  baseDomain: 'localhost',
  databaseHost: '127.0.0.1',
  databasePort: '3306',
  databaseName: 'esign',
  databaseUsername: 'esign',
  redisHost: '127.0.0.1',
  redisPort: '6379',
  storageCredentialMode: 'disabled',
  firstAdminPhone: '',
  thirdPartyEnabled: false,
}

function tokenFromLocation() {
  return new URLSearchParams(window.location.hash.replace(/^#/, '')).get('token') || ''
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { 'content-type': 'application/json', 'x-yht-installer-token': tokenFromLocation(), ...(init.headers || {}) },
  })
  const body = await response.json()
  if (!response.ok) throw new Error(body.message || body.code || '请求失败')
  return body
}

function ProgressStatus({ event }: { event: InstallerEvent }) {
  if (event.status === 'pass') return <Check aria-hidden="true" />
  if (event.status === 'fail') return <AlertCircle aria-hidden="true" />
  if (event.status === 'running' || event.status === 'progress') return <LoaderCircle className="spin" aria-hidden="true" />
  return <Circle aria-hidden="true" />
}

export default function App() {
  const [step, setStep] = useState(0)
  const [mode, setMode] = useState<'quick' | 'custom'>('quick')
  const [config, setConfig] = useState(initialConfig)
  const [secrets, setSecrets] = useState({
    'database.password': '',
    'database.migration-password': '',
    'database.backup-password': '',
    'redis.user.password': '',
    'redis.default.password': '',
    'first-admin.password': '',
  })
  const [session, setSession] = useState<InstallerSession | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [showSecrets, setShowSecrets] = useState(false)

  const update = (name: keyof typeof config, value: string | boolean) => setConfig((current) => ({ ...current, [name]: value }))
  const completedSteps = useMemo(() => session?.status === 'pass' ? steps.length : step, [session, step])

  useEffect(() => {
    if (!session || !busy) return
    const timer = window.setInterval(async () => {
      try { setSession(await request(`/api/sessions/${session.id}`)) } catch { /* action request reports the useful error */ }
    }, 900)
    return () => window.clearInterval(timer)
  }, [session?.id, busy])

  async function ensureSession() {
    if (session) return session
    const created = await request<InstallerSession>('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({ mode, config: { ...config, installProfile: mode === 'quick' ? 'community' : config.installProfile } }),
    })
    setSession(created)
    return created
  }

  async function saveSecrets(target: InstallerSession) {
    const supplied = Object.fromEntries(Object.entries(secrets).filter(([, value]) => value.length > 0))
    if (!Object.keys(supplied).length) return
    await request(`/api/sessions/${target.id}/secrets`, { method: 'POST', body: JSON.stringify({ secrets: supplied }) })
    setSecrets((current) => Object.fromEntries(Object.keys(current).map((key) => [key, ''])) as typeof current)
  }

  async function runAction(action: string) {
    if ((action === 'rollback' || action === 'uninstall') && !window.confirm(action === 'rollback' ? '确认回退到当前会话最近一次备份？' : '确认卸载当前会话管理的专用容器、网络、数据卷和本地凭据？此操作不可撤销。')) return
    setBusy(true)
    setError('')
    try {
      const target = await ensureSession()
      if (action === 'configure' || action === 'install') await saveSecrets(target)
      const next = await request<InstallerSession>(`/api/sessions/${target.id}/actions/${action}`, { method: 'POST', body: '{}' })
      setSession(next)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '操作失败')
      if (session) {
        try { setSession(await request(`/api/sessions/${session.id}`)) } catch { /* keep primary error */ }
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup"><span className="brand-mark">Y</span><span>一合通安装器</span></div>
        <div className="local-status"><ShieldCheck aria-hidden="true" />仅连接本机</div>
      </header>

      <div className="workspace">
        <aside className="step-rail" aria-label="安装步骤">
          <div className="step-intro"><h1>安装一个运行环境</h1><p>所有入口共用同一会话、配置与回退记录。</p></div>
          <ol>
            {steps.map(([id, label, Icon], index) => (
              <li key={id}>
                <button className={index === step ? 'active' : index < completedSteps ? 'done' : ''} onClick={() => setStep(index)}>
                  <span className="step-icon">{index < completedSteps ? <Check /> : <Icon />}</span>
                  <span><strong>{label}</strong><small>{index === step ? '当前步骤' : index < completedSteps ? '已确认' : '待处理'}</small></span>
                </button>
              </li>
            ))}
          </ol>
          <div className="support-note"><Wrench aria-hidden="true" /><span>失败时保留错误码与脱敏日志；无需重填已确认内容。</span></div>
        </aside>

        <main className="main-panel">
          <div className="mobile-progress"><span>步骤 {step + 1} / {steps.length}</span><strong>{steps[step][1]}</strong><div><i style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div></div>
          {step === 0 && <section>
            <h2>先确认这台设备可以安装</h2>
            <p className="lead">Windows 使用 WSL2 与 Docker Desktop；Ubuntu 22.04/24.04 使用 Docker Engine。检查不会修改全局设置。</p>
            <div className="requirement-list">
              <div><MonitorCog /><span><strong>Windows</strong><small>Windows 10/11、WSL2 Ubuntu 22.04/24.04、Docker Desktop 已启动并启用 WSL 集成。</small></span></div>
              <div><HardDrive /><span><strong>Ubuntu</strong><small>Ubuntu 22.04/24.04、Docker Engine 与 Compose v2，可用磁盘空间不少于 20 GB。</small></span></div>
              <div><ShieldCheck /><span><strong>本地权限</strong><small>仅操作安装目录、专用容器与本机会话目录，不代改 DNS、TLS 或平台账号。</small></span></div>
            </div>
            <Button onClick={() => runAction('check')} disabled={busy} icon={busy ? <LoaderCircle className="spin" /> : <Play />}>{busy ? '正在检查' : '运行环境检查'}</Button>
          </section>}

          {step === 1 && <section>
            <h2>选择安装方式</h2>
            <p className="lead">首次体验建议使用快速安装；已有 MySQL 与 Redis 的 Ubuntu 服务器可选择自定义安装。</p>
            <div className="choice-list">
              <button className={mode === 'quick' ? 'selected' : ''} onClick={() => setMode('quick')}><span className="choice-radio" /><span><strong>快速安装</strong><small>创建一个社区体验环境，由安装器管理容器、数据卷、验证与备份。</small></span><span className="tag">Windows / Ubuntu</span></button>
              <button className={mode === 'custom' ? 'selected' : ''} onClick={() => setMode('custom')}><span className="choice-radio" /><span><strong>使用现有 MySQL 与 Redis</strong><small>连接客户自有基础设施，生成独立配置工作区并继续正式安装流程。</small></span><span className="tag">Ubuntu</span></button>
            </div>
            {mode === 'custom' && <div className="inline-warning"><AlertCircle /><span>自定义模式不在 Windows 本地体验中启用；商业版还需要与当前实例匹配的正式授权材料。</span></div>}
          </section>}

          {step === 2 && <section>
            <h2>确认访问域名与入口</h2>
            <p className="lead">本地体验使用 localhost；正式域名、DNS 与 TLS 仍由客户或平台负责人完成。</p>
            <div className="form-grid">
              <Field label="基础域名" hint="例如 example.com；本地体验保持 localhost"><Input value={config.baseDomain} onChange={(e) => update('baseDomain', e.target.value)} /></Field>
              <Field label="环境"><Select value={config.environment} onChange={(e) => update('environment', e.target.value)}><option value="staging">测试 / 本地</option><option value="production">生产候选</option></Select></Field>
            </div>
            <div className="endpoint-table" role="table" aria-label="系统入口">
              {['用户端', '管理端', 'H5', '官网', 'API'].map((label, index) => <div role="row" key={label}><span>{label}</span><code>{config.baseDomain === 'localhost' ? ['localhost:18080', 'localhost:18081', 'localhost:18082', 'localhost:13001', 'localhost:18763'][index] : `${['user', 'manage', 'h5', 'www', 'api'][index]}.${config.baseDomain}`}</code></div>)}
            </div>
          </section>}

          {step === 3 && <section>
            <h2>配置数据与存储</h2>
            <p className="lead">这里只记录地址与非秘密标识。密码在“初始管理员”步骤通过本机受保护表单单独保存。</p>
            <div className="form-grid">
              <Field label="MySQL 地址"><Input value={config.databaseHost} onChange={(e) => update('databaseHost', e.target.value)} disabled={mode === 'quick'} /></Field>
              <Field label="MySQL 端口"><Input inputMode="numeric" value={config.databasePort} onChange={(e) => update('databasePort', e.target.value)} disabled={mode === 'quick'} /></Field>
              <Field label="数据库名"><Input value={config.databaseName} onChange={(e) => update('databaseName', e.target.value)} disabled={mode === 'quick'} /></Field>
              <Field label="数据库用户"><Input value={config.databaseUsername} onChange={(e) => update('databaseUsername', e.target.value)} disabled={mode === 'quick'} /></Field>
              <Field label="Redis 地址"><Input value={config.redisHost} onChange={(e) => update('redisHost', e.target.value)} disabled={mode === 'quick'} /></Field>
              <Field label="Redis 端口"><Input inputMode="numeric" value={config.redisPort} onChange={(e) => update('redisPort', e.target.value)} disabled={mode === 'quick'} /></Field>
              <Field label="对象存储"><Select value={config.storageCredentialMode} onChange={(e) => update('storageCredentialMode', e.target.value)}><option value="disabled">当前不启用</option><option value="secret-ref">使用受保护密钥引用</option><option value="ram-role">使用实例角色</option></Select></Field>
            </div>
          </section>}

          {step === 4 && <section>
            <h2>确认产品与运营主体</h2>
            <p className="lead">这些文字会进入部署配置。品牌素材需使用已确认的真实文件，向导不会自动生成或冒充。</p>
            <div className="form-grid">
              <Field label="产品名称"><Input value={config.projectName} onChange={(e) => update('projectName', e.target.value)} /></Field>
              <Field label="运营主体"><Input value={config.companyName} onChange={(e) => update('companyName', e.target.value)} /></Field>
              <Field label="客户代码" hint="小写字母、数字与连字符"><Input value={config.customerCode} onChange={(e) => update('customerCode', e.target.value)} /></Field>
              <Field label="配置负责人"><Input value={config.owner} onChange={(e) => update('owner', e.target.value)} /></Field>
            </div>
          </section>}

          {step === 5 && <section>
            <h2>设置初始管理员与受保护凭据</h2>
            <p className="lead">凭据只提交给 127.0.0.1 的安装器进程并在本机加密保存；不会进入配置文件、日志、回执或智能助手上下文。</p>
            <div className="form-grid">
              <Field label="管理员手机号"><Input inputMode="tel" value={config.firstAdminPhone} onChange={(e) => update('firstAdminPhone', e.target.value)} /></Field>
              <Field label="管理员初始密码"><Input type={showSecrets ? 'text' : 'password'} autoComplete="new-password" value={secrets['first-admin.password']} onChange={(e) => setSecrets({ ...secrets, 'first-admin.password': e.target.value })} /></Field>
              {mode === 'custom' && <>
                <Field label="业务数据库密码"><Input type={showSecrets ? 'text' : 'password'} autoComplete="new-password" value={secrets['database.password']} onChange={(e) => setSecrets({ ...secrets, 'database.password': e.target.value })} /></Field>
                <Field label="迁移数据库密码"><Input type={showSecrets ? 'text' : 'password'} autoComplete="new-password" value={secrets['database.migration-password']} onChange={(e) => setSecrets({ ...secrets, 'database.migration-password': e.target.value })} /></Field>
                <Field label="备份数据库密码"><Input type={showSecrets ? 'text' : 'password'} autoComplete="new-password" value={secrets['database.backup-password']} onChange={(e) => setSecrets({ ...secrets, 'database.backup-password': e.target.value })} /></Field>
                <Field label="Redis 业务密码"><Input type={showSecrets ? 'text' : 'password'} autoComplete="new-password" value={secrets['redis.user.password']} onChange={(e) => setSecrets({ ...secrets, 'redis.user.password': e.target.value })} /></Field>
                <Field label="Redis 默认密码"><Input type={showSecrets ? 'text' : 'password'} autoComplete="new-password" value={secrets['redis.default.password']} onChange={(e) => setSecrets({ ...secrets, 'redis.default.password': e.target.value })} /></Field>
              </>}
            </div>
            <label className="checkbox"><input type="checkbox" checked={showSecrets} onChange={(e) => setShowSecrets(e.target.checked)} /><span>临时显示当前输入</span></label>
            <label className="checkbox"><input type="checkbox" checked={config.thirdPartyEnabled} onChange={(e) => update('thirdPartyEnabled', e.target.checked)} /><span>本次需要配置可选第三方能力（安装后按清单处理）</span></label>
          </section>}

          {step === 6 && <section>
            <h2>确认配置并开始安装</h2>
            <p className="lead">安装器会先建立会话，再生成配置、执行安装并运行真实验证。失败不会显示成功，且可从当前会话继续修复。</p>
            <dl className="review-list">
              <div><dt>安装方式</dt><dd>{mode === 'quick' ? '快速安装' : '现有 MySQL 与 Redis'}</dd></div>
              <div><dt>环境与域名</dt><dd>{config.environment} · {config.baseDomain}</dd></div>
              <div><dt>产品与主体</dt><dd>{config.projectName} · {config.companyName}</dd></div>
              <div><dt>第三方能力</dt><dd>{config.thirdPartyEnabled ? '安装后按清单配置' : '当前不启用'}</dd></div>
              <div><dt>商业边界</dt><dd>{mode === 'quick' ? '社区体验，签署能力保持关闭' : '需正式 Instance / License / Lease'}</dd></div>
            </dl>
            <div className="action-row">
              {mode === 'custom' && <Button variant="secondary" onClick={() => runAction('configure')} disabled={busy}>生成并校验配置</Button>}
              <Button onClick={() => runAction('install')} disabled={busy} icon={busy ? <LoaderCircle className="spin" /> : <Play />}>{busy ? '正在执行，请勿关闭' : '开始安装'}</Button>
            </div>
          </section>}

          {error && <div className="error-banner" role="alert"><AlertCircle /><span><strong>操作未完成</strong>{error}</span></div>}

          <footer className="panel-footer">
            <Button variant="secondary" onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0 || busy} icon={<ChevronLeft />}>上一步</Button>
            {step < steps.length - 1 && <Button onClick={() => setStep((value) => Math.min(steps.length - 1, value + 1))} disabled={busy}>下一步<ChevronRight /></Button>}
          </footer>
        </main>

        <aside className="activity-panel" aria-label="安装进度">
          <div className="activity-heading"><span><strong>安装进度</strong><small>{session ? `会话 ${session.id.slice(0, 8)}` : '尚未开始'}</small></span><span className={`state-badge state-${session?.status || 'idle'}`}>{session?.status === 'pass' ? '已通过' : session?.status === 'failed' ? '需处理' : busy ? '执行中' : '待开始'}</span></div>
          {!session?.events.length ? <div className="empty-state"><Circle /><strong>等待开始</strong><p>环境检查、配置、安装和验证的真实事件会出现在这里。</p></div> : <ol className="event-list">{session.events.slice(-12).reverse().map((event) => <li key={event.sequence} className={`event-${event.status}`}><span className="event-icon"><ProgressStatus event={event} /></span><span><strong>{event.message}</strong><small>{new Date(event.at).toLocaleTimeString('zh-CN', { hour12: false })} · {event.stage}</small></span></li>)}</ol>}
          {(session?.entries?.length ?? 0) > 0 && <div className="entry-list"><h3>可用入口</h3>{session?.entries.map((entry) => <a key={entry.id} href={entry.url} target="_blank" rel="noreferrer"><span>{entry.label}<small>{entry.url}</small></span><ExternalLink /></a>)}</div>}
          {session && <div className="recovery-actions"><Button variant="secondary" onClick={() => runAction('verify')} disabled={busy} icon={<ShieldCheck />}>验证</Button><Button variant="secondary" onClick={() => runAction('repair')} disabled={busy} icon={<RotateCcw />}>修复</Button>{session.mode === 'quick' && <Button variant="secondary" onClick={() => runAction('stop')} disabled={busy}>停止</Button>}<Button variant="secondary" onClick={() => runAction('backup')} disabled={busy}>备份</Button>{(session.config?.communityBackup || session.config?.rollbackReceipt) && <Button variant="secondary" onClick={() => runAction('rollback')} disabled={busy}>回退</Button>}{session.mode === 'quick' && <Button variant="danger" onClick={() => runAction('uninstall')} disabled={busy}>卸载</Button>}</div>}
          {session && <code className="fingerprint">会话指纹 {session.sessionFingerprint.slice(0, 16)}…</code>}
        </aside>
      </div>
    </div>
  )
}
