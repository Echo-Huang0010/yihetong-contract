import type { SiteConfig } from '@/lib/site-config'

const footerLinkClass = 'inline-flex min-h-11 items-center text-sm text-white/70 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70'

export default function Footer({ config }: { config: SiteConfig }) {
  const currentYear = new Date().getFullYear()
  const copyright = config.copyrightText || `Copyright © ${currentYear} ${config.projectName}`

  return (
    <footer
      className="border-t px-4 py-12 text-white sm:px-8 md:py-14 lg:px-16"
      style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'var(--text-primary)' }}
    >
      <div className="mx-auto max-w-[1180px]">
        <div className="grid gap-9 md:grid-cols-2 lg:grid-cols-[1.35fr_0.8fr_0.9fr_1fr] lg:gap-12">
          <div className="max-w-sm">
            {config.logoWhite || config.logo ? (
              <img src={config.logoWhite || config.logo} alt={config.projectName} className="max-h-24 w-auto max-w-[300px] object-contain object-left" />
            ) : (
              <strong className="text-xl font-semibold text-white">{config.projectName}</strong>
            )}
            <p className="mt-4 text-sm leading-6 text-white/70">
              {config.subtitle}
            </p>
            
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">产品</h4>
            <ul className="mt-3">
              <li><a href="#features" className={footerLinkClass}>产品功能</a></li>
              <li><a href="#industries" className={footerLinkClass}>解决方案</a></li>
              <li><a href="#version-compare" className={footerLinkClass}>版本对比</a></li>
              <li><a href="#cta" className={footerLinkClass}>{config.websiteCtaText}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">平台入口</h4>
            <ul className="mt-3">
              {config.websiteUserUrl ? (
                <li><a href={config.websiteUserUrl} target="_blank" rel="noopener noreferrer" className={footerLinkClass}>用户端</a></li>
              ) : null}
              {config.websiteManageUrl ? (
                <li><a href={config.websiteManageUrl} target="_blank" rel="noopener noreferrer" className={footerLinkClass}>管理后台</a></li>
              ) : null}
              {config.websiteH5Url ? (
                <li><a href={config.websiteH5Url} target="_blank" rel="noopener noreferrer" className={footerLinkClass}>H5</a></li>
              ) : null}
              {config.websiteMiniProgramQrCode ? (
                <li><a href="#mini-program" className={footerLinkClass}>微信小程序</a></li>
              ) : null}
              
              
              {config.websiteDemoUrl ? (
                <li><a href={config.websiteDemoUrl} target="_blank" rel="noopener noreferrer" className={footerLinkClass}>在线演示</a></li>
              ) : null}
              {config.websiteGitEnabled && config.websiteGitUrl ? (
                <li><a href={config.websiteGitUrl} target="_blank" rel="noopener noreferrer" className={footerLinkClass}>Git 开源地址</a></li>
              ) : null}
              {config.websiteGiteeEnabled && config.websiteGiteeUrl ? (
                <li><a href={config.websiteGiteeUrl} target="_blank" rel="noopener noreferrer" className={footerLinkClass}>Gitee 开源地址</a></li>
              ) : null}
              {config.websiteOpenPlatformEnabled && config.websiteOpenPlatformUrl ? (
                <li><a href={config.websiteOpenPlatformUrl} target="_blank" rel="noopener noreferrer" className={footerLinkClass}>开放平台</a></li>
              ) : null}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">联系与主体</h4>
            <ul className="mt-3">
              <li className="py-3 text-sm leading-6 text-white/70">
                {config.companyName || '联系信息尚未发布'}
              </li>
              {config.websiteContactEmail ? (
                <li><a href={`mailto:${config.websiteContactEmail}`} className={footerLinkClass}>{config.websiteContactEmail}</a></li>
              ) : null}
              {config.telphone ? (
                <li><a href={`tel:${config.telphone}`} className={footerLinkClass}>{config.telphone}</a></li>
              ) : null}
              {config.weixin ? <li className="py-3 text-sm leading-6 text-white/70">微信：{config.weixin}</li> : null}
              {config.address ? <li className="py-3 text-sm leading-6 text-white/70">{config.address}</li> : null}
            </ul>
          </div>
        </div>

        <div
          className="mt-10 flex flex-col gap-2 border-t pt-6 text-xs sm:flex-row sm:items-center sm:justify-between"
          style={{ borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.62)' }}
        >
          <p>{copyright}</p>
          {config.icpNo ? <p>{config.icpNo}</p> : null}
        </div>
      </div>
    </footer>
  )
}


