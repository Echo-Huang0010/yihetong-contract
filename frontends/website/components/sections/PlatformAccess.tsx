import {
  ArrowTopRightOnSquareIcon,
  BuildingOffice2Icon,
  CloudIcon,
  CodeBracketIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline'
import SectionHeading from '@/components/sections/SectionHeading'
import type { SiteConfig } from '@/lib/site-config'

const linkIconClass = 'h-5 w-5'

export default function PlatformAccess({ config }: { config: SiteConfig }) {
  const entries = [
    {
      label: 'H5 移动端',
      description: '在手机浏览器中进入合同办理与签署服务。',
      href: config.websiteH5Url,
      icon: DevicePhoneMobileIcon,
    },
    {
      label: '用户后台',
      description: '面向企业用户处理合同、模板、审批和智能合同。',
      href: config.websiteUserUrl,
      icon: ComputerDesktopIcon,
    },
    {
      label: '管理后台',
      description: '面向平台管理员维护运营、品牌、权限和部署配置。',
      href: config.websiteManageUrl,
      icon: BuildingOffice2Icon,
    },
  ].filter((item) => Boolean(item.href))

  const developerEntries = [
    {
      label: 'Git 开源地址',
      href: config.websiteGitUrl,
      enabled: config.websiteGitEnabled,
      icon: CodeBracketIcon,
    },
    {
      label: 'Gitee 开源地址',
      href: config.websiteGiteeUrl,
      enabled: config.websiteGiteeEnabled,
      icon: CloudIcon,
    },
    {
      label: '开放平台',
      href: config.websiteOpenPlatformUrl,
      enabled: config.websiteOpenPlatformEnabled,
      icon: GlobeAltIcon,
    },
  ].filter((item) => item.enabled && Boolean(item.href))

  if (!entries.length && !config.websiteMiniProgramQrCode && !developerEntries.length) return null

  return (
    <section id="platform-access" className="bg-[var(--bg-secondary)] px-4 py-20 sm:px-8 md:py-24 lg:px-16">
      <div className="mx-auto max-w-[1180px]">
        <SectionHeading
          title="平台入口"
          description="根据使用场景进入对应终端，所有入口均由管理后台统一维护"
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {entries.map((entry) => (
            <a
              key={entry.label}
              href={entry.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex min-h-[190px] flex-col rounded-lg border bg-white p-6 transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2"
              style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-card)' }}
            >
              <span
                className="flex h-11 w-11 items-center justify-center rounded-md"
                style={{ background: 'rgba(91,92,246,0.07)', color: 'var(--accent-primary)' }}
              >
                <entry.icon className={linkIconClass} />
              </span>
              <strong className="mt-5 text-base" style={{ color: 'var(--text-primary)' }}>{entry.label}</strong>
              <span className="mt-2 flex-1 text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>{entry.description}</span>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--accent-primary)' }}>
                立即进入 <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              </span>
            </a>
          ))}

          {config.websiteMiniProgramQrCode ? (
            <div
              id="mini-program"
              className="flex min-h-[190px] items-center gap-5 rounded-lg border bg-white p-5 md:col-span-2 lg:col-span-1 lg:flex-col lg:items-start"
              style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-card)' }}
            >
              <img
                src={config.websiteMiniProgramQrCode}
                alt={`${config.projectName}微信小程序码`}
                className="h-28 w-28 flex-none rounded-md border bg-white object-contain p-1 lg:h-32 lg:w-32"
                style={{ borderColor: 'var(--border-default)' }}
              />
              <div className="min-w-0">
                <strong className="block text-base" style={{ color: 'var(--text-primary)' }}>微信小程序</strong>
                <span className="mt-2 block text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>使用微信扫码进入 {config.projectName}</span>
              </div>
            </div>
          ) : null}
        </div>

        {developerEntries.length ? (
          <div
            className="mt-7 flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between"
            style={{ borderColor: 'var(--border-default)' }}
          >
            <div>
              <strong className="text-sm" style={{ color: 'var(--text-primary)' }}>开发与开放资源</strong>
              <p className="mt-1 text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
                开源仓库和开放平台入口由管理后台独立控制
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {developerEntries.map((entry) => (
                <a
                  key={entry.label}
                  href={entry.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-2 rounded-md border bg-white px-4 text-sm font-medium transition-colors hover:bg-[var(--bg-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2"
                  style={{ borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                >
                  <entry.icon className="h-4 w-4" aria-hidden="true" />
                  {entry.label}
                  <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
