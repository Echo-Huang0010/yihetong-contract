import Image from 'next/image'
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  ClipboardCheck,
  FileCheck2,
  Home,
  LayoutDashboard,
  MonitorSmartphone,
  Network,
  ServerCog,
  Settings2,
  ShoppingBag,
  Smartphone,
  Users,
} from 'lucide-react'
import PlatformEvidence from '@/components/sections/v1/PlatformEvidence'
import type {
  SiteConfig,
  WebsiteCapabilityMatrixItem,
  WebsiteCompareRow,
  WebsitePlatformCapability,
  WebsiteShowcaseImage,
  WebsiteTextCard,
  WebsiteWorkflowStep,
} from '@/lib/site-config'
import { resolvePublicHref } from '@/lib/public-site'

const unsafeCopyPattern =
  /(终验|验收|回归|工作树|角色路径|去重|防重复|赠送|平台凭证|一致性闭环|状态回写|\bCLI\b|\bMCP\b|\bAgent\b|user_final_required|blocked|partial)/i

const defaultPlatforms: WebsitePlatformCapability[] = [
  {
    title: '管理后台',
    owner: '平台运营与治理',
    description: '统一承接客户、企业、合同、审批、内容、服务、品牌与部署管理。',
    proof: '平台运营人员集中配置和查看',
    tags: ['账号与企业', '合同与审批', '运营与配置'],
  },
  {
    title: '用户后台',
    owner: '企业业务人员',
    description: '处理合同发起、模板文书、签署进度、合同审查与版本比对。',
    proof: '复杂合同任务的主要工作入口',
    tags: ['合同管理', '模板文书', '审查比对'],
  },
  {
    title: 'H5 / 小程序',
    owner: '审批人与签署人',
    description: '在移动场景查看合同、处理审批并进入签署流程。',
    proof: '与用户后台共享合同和流程状态',
    tags: ['移动审批', '合同查看', '签署入口'],
  },
  {
    title: '服务端与接口',
    owner: '实施与集成人员',
    description: '连接签署、认证、模型服务、企业系统和私有化部署环境。',
    proof: '外部能力按配置和授权启用',
    tags: ['业务 API', '部署配置', '第三方接入'],
  },
]

const defaultWorkflow: WebsiteWorkflowStep[] = [
  { title: '模板与材料', description: '选择合同模板、录入合同信息或上传文件材料。' },
  { title: '签署前审批', description: '按业务规则进入审批流程，处理待办并保留记录。' },
  { title: '发起签署', description: '确认签署方和签署顺序后进入电子签署链路。' },
  { title: '状态同步', description: '用户后台与移动端持续查看合同和流程进度。' },
  { title: '文书归档', description: '完成合同文书查看、下载和后续业务归档。' },
]

const defaultManagement: WebsiteCapabilityMatrixItem[] = [
  {
    group: '组织与账号',
    title: '客户、企业、平台账号与审批角色',
    description: '维护个人和企业客户、平台账号及审批角色，让不同人员按职责参与业务流程。',
  },
  {
    group: '合同与流程',
    title: '合同、模板、视频规则、审批流程与待办',
    description: '集中管理合同数据、模板分类与模板内容，并配置签署前审批和相关业务材料。',
  },
  {
    group: '运营与服务',
    title: '资讯、合同文书、代理服务与业务申请',
    description: '承接公开内容、合同文书、代理分销、服务类型与服务申请等持续运营工作。',
  },
  {
    group: '交易与交付',
    title: '订单、消费、价格、品牌与部署配置',
    description: '按项目范围管理交易记录和套餐信息，并统一维护各端品牌、入口和部署参数。',
  },
]

const defaultIndustries: WebsiteTextCard[] = [
  { title: '人力资源', description: '劳动合同、入职材料、保密协议与人员文件签署。' },
  { title: '销售与采购', description: '销售合同、采购订单、合作协议与签约进度管理。' },
  { title: '企业服务', description: '服务协议、项目确认单和交付材料的统一管理。' },
  { title: '租赁与物业', description: '租赁合同、物业服务协议和设备租赁文件管理。' },
]

const defaultCompare: WebsiteCompareRow[] = [
  { feature: '合同发起、签署与归档', standard: true, flagship: true },
  { feature: '合同模板与 PDF 文书', standard: true, flagship: true },
  { feature: 'Web、H5 与小程序入口', standard: true, flagship: true },
  { feature: '签署前审批与过程记录', standard: '基础流程', flagship: '完整流程' },
  { feature: '合同生成、审查与比对', standard: false, flagship: true },
  { feature: '管理后台综合运营', standard: '基础管理', flagship: '完整后台' },
  { feature: '品牌配置与私有化部署', standard: false, flagship: true },
  { feature: '开放接口与集成支持', standard: '基础接口', flagship: '按项目交付' },
]

const defaultProductImages: Record<'web' | 'mobile', WebsiteShowcaseImage> = {
  web: {
    src: '/product-images/09-pc-compare-current.png',
    alt: '一合通用户后台合同比对界面',
    category: 'web',
    span: 'wide',
  },
  mobile: {
    src: '/product-images/10-h5-home-current.png',
    alt: '一合通 H5 首页',
    category: 'mobile',
    span: 'tall',
  },
}

const platformIcons = [LayoutDashboard, MonitorSmartphone, Smartphone, ServerCog]
const managementIcons = [Users, FileCheck2, ClipboardCheck, Settings2]
const industryIcons = [Users, ShoppingBag, Building2, Home]

function isPublicText(value: unknown) {
  return typeof value === 'string' && Boolean(value.trim()) && !unsafeCopyPattern.test(value)
}

function resolvePlatforms(config: SiteConfig) {
  const configured = (config.websiteContent.platformCapabilities || []).filter(
    (item) => isPublicText(item.title) && isPublicText(item.owner) && isPublicText(item.description),
  )
  return configured.length >= 4 ? configured.slice(0, 4) : defaultPlatforms
}

function resolveWorkflow(config: SiteConfig) {
  const configured = (config.websiteContent.approvalWorkflow || []).filter(
    (item) => isPublicText(item.title) && isPublicText(item.description),
  )
  return configured.length >= 4 ? configured.slice(0, 5) : defaultWorkflow
}

function resolveManagement(config: SiteConfig) {
  const configured = (config.websiteContent.capabilityMatrix || []).filter(
    (item) => isPublicText(item.group) && isPublicText(item.title) && isPublicText(item.description),
  )
  return configured.length >= 4 ? configured.slice(0, 4) : defaultManagement
}

function resolveIndustries(config: SiteConfig) {
  const configured = (config.websiteContent.industries || []).filter(
    (item) => isPublicText(item.title) && isPublicText(item.description),
  )
  return configured.length >= 4 ? configured.slice(0, 4) : defaultIndustries
}

function resolveCompareRows(config: SiteConfig) {
  const configured = (config.websiteContent.versionCompare || []).filter((item) => {
    const copy = `${item.feature} ${String(item.standard)} ${String(item.flagship)}`
    return isPublicText(item.feature) && !unsafeCopyPattern.test(copy)
  })
  return configured.length >= 5 ? configured.slice(0, 8) : defaultCompare
}

function resolveProductImages(config: SiteConfig) {
  const configured = config.websiteContent.productImages || []
  return {
    web:
      configured.find(
        (item) => item.category === 'web' && item.src === defaultProductImages.web.src && isPublicText(item.alt),
      ) || defaultProductImages.web,
    mobile:
      configured.find(
        (item) => item.category === 'mobile' && item.src === defaultProductImages.mobile.src && isPublicText(item.alt),
      ) || defaultProductImages.mobile,
  }
}

function CompareValue({ value }: { value: string | boolean }) {
  if (value === true) return <Check className="mx-auto h-5 w-5 text-emerald-600" aria-label="包含" />
  if (value === false) return <span className="text-[var(--text-tertiary)]" aria-label="不包含">-</span>
  return <span>{value}</span>
}

function mobileCompareValue(value: string | boolean) {
  if (value === true) return '包含'
  if (value === false) return '不包含'
  return value
}

export default function HomeV1({ config }: { config: SiteConfig }) {
  const platforms = resolvePlatforms(config)
  const workflow = resolveWorkflow(config)
  const management = resolveManagement(config)
  const industries = resolveIndustries(config)
  const compareRows = resolveCompareRows(config)
  const productImages = resolveProductImages(config)
  const primaryHref = resolvePublicHref(config.websiteCtaLink, '#contact')
  const userHref = resolvePublicHref(config.websiteUserUrl, '')
  const contactHref = config.websiteContactEmail
    ? `mailto:${config.websiteContactEmail}?subject=${encodeURIComponent(`${config.projectName}旗舰版演示咨询`)}`
    : primaryHref

  return (
    <>
      <section id="top" className="overflow-hidden border-b border-black/[0.07] bg-white px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[calc(100dvh-96px)] max-w-[1200px] flex-col items-center justify-center py-10 text-center md:py-12">
          <p className="border-b border-[var(--accent-primary)] pb-1 text-sm font-semibold text-[var(--accent-primary)]">
            企业电子合同全流程服务平台
          </p>
          <h1 className="mt-5 text-4xl font-bold leading-[1.1] text-[var(--text-primary)] sm:text-5xl md:text-6xl lg:text-7xl">
            {config.projectName}
          </h1>
          <p className="mt-3 text-2xl font-semibold text-[var(--accent-primary)] sm:text-3xl">让签署更简单</p>
          <p className="mt-5 max-w-[760px] text-base leading-8 text-[var(--text-secondary)] md:text-lg">
            把合同模板、签署前审批、电子签署、智能处理和文书归档放进同一条业务链路，管理后台、用户后台与移动端共享真实业务状态。
          </p>
          <div className="mt-7 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
            <a href={primaryHref} className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[var(--accent-primary)] px-6 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-primary-dark)]">
              {config.websiteCtaText}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
            <a href="#product" className="inline-flex h-12 items-center justify-center rounded-md border border-black/[0.12] bg-white px-6 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]">
              查看真实产品界面
            </a>
          </div>

          <div className="relative mt-9 h-[225px] w-full max-w-[1040px] overflow-hidden rounded-t-md border border-b-0 border-black/[0.09] bg-[var(--bg-secondary)] shadow-[var(--shadow-elevated)] sm:h-[260px] md:h-[300px]">
            <Image
              src={productImages.web.src}
              alt={productImages.web.alt}
              width={1032}
              height={650}
              className="hidden h-auto w-full object-cover object-top md:block"
              priority
            />
            <Image
              src={productImages.mobile.src}
              alt={productImages.mobile.alt}
              width={390}
              height={844}
              className="mx-auto h-auto w-[190px] object-contain sm:w-[220px] md:hidden"
              priority
              unoptimized
            />
          </div>
        </div>
      </section>

      <section id="platform" className="border-b border-black/[0.07] bg-[var(--bg-secondary)] px-4 py-16 sm:px-6 md:py-20 lg:px-8">
        <span id="capabilities" className="sr-only" aria-hidden="true" />
        <div className="mx-auto max-w-[1200px]">
          <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="text-sm font-semibold text-[var(--accent-primary)]">一套平台，四个业务端</p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight text-[var(--text-primary)] md:text-5xl">每个角色都有清楚的工作入口</h2>
            </div>
            <p className="max-w-[680px] text-base leading-8 text-[var(--text-secondary)] lg:justify-self-end">
              管理端负责治理和配置，用户端承接复杂业务，H5 与小程序处理移动任务，服务端与接口连接外部能力和企业系统。
            </p>
          </div>

          <div className="mt-10 grid border-y border-black/[0.08] md:grid-cols-2 lg:grid-cols-4">
            {platforms.map((item, index) => {
              const Icon = platformIcons[index % platformIcons.length]
              return (
                <article key={item.title} className="border-b border-black/[0.08] py-7 md:px-6 lg:border-b-0 lg:border-l lg:first:border-l-0 lg:first:pl-0">
                  <Icon className="h-6 w-6 text-[var(--accent-primary)]" aria-hidden="true" />
                  <p className="mt-5 text-xs font-semibold text-[var(--text-tertiary)]">{item.owner}</p>
                  <h3 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{item.description}</p>
                  {item.tags?.length ? <p className="mt-4 text-xs leading-6 text-[var(--text-tertiary)]">{item.tags.slice(0, 3).join(' · ')}</p> : null}
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section id="process" className="bg-white px-4 py-16 sm:px-6 md:py-24 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
          <div className="max-w-[760px]">
            <p className="text-sm font-semibold text-[var(--accent-primary)]">合同全生命周期</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-[var(--text-primary)] md:text-5xl">从模板开始，到文书归档结束</h2>
            <p className="mt-5 text-base leading-8 text-[var(--text-secondary)]">流程按真实业务顺序展开，审批、签署和多端状态不再被拆成彼此孤立的功能点。</p>
          </div>

          <ol className="mt-10 grid border-t border-black/[0.1] md:grid-cols-5">
            {workflow.map((step, index) => (
              <li key={step.title} className="relative border-b border-black/[0.08] py-6 md:border-b-0 md:border-l md:px-5 md:first:border-l-0 md:first:pl-0">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-sm bg-[var(--accent-soft)] text-sm font-semibold text-[var(--accent-primary)]">{index + 1}</span>
                <h3 className="mt-5 text-lg font-semibold text-[var(--text-primary)]">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="management" className="border-y border-black/[0.07] bg-[var(--accent-soft)] px-4 py-16 sm:px-6 md:py-24 lg:px-8">
        <div className="mx-auto grid max-w-[1200px] gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
          <div>
            <p className="text-sm font-semibold text-[var(--accent-primary)]">旗舰版管理中枢</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-[var(--text-primary)] md:text-5xl">管理后台不只是合同列表</h2>
            <p className="mt-5 max-w-[560px] text-base leading-8 text-[var(--text-secondary)]">
              它负责把组织、合同流程、平台运营和项目交付连接起来，让多个业务端在同一套配置和数据边界下协同工作。
            </p>
            <ul className="mt-8 space-y-4 text-sm leading-6 text-[var(--text-primary)]">
              {['集中维护业务规则和公开配置', '统一查看合同、审批与运营入口', '按部署环境接入外部平台能力'].map((item) => (
                <li key={item} className="flex gap-3"><Check className="mt-0.5 h-5 w-5 flex-none text-emerald-600" aria-hidden="true" />{item}</li>
              ))}
            </ul>
          </div>

          <dl className="border-t border-black/[0.11]">
            {management.map((item, index) => {
              const Icon = managementIcons[index % managementIcons.length]
              return (
                <div key={`${item.group}-${item.title}`} className="grid gap-4 border-b border-black/[0.11] py-6 sm:grid-cols-[48px_1fr] sm:gap-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-md bg-white text-[var(--accent-primary)] shadow-sm">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-[var(--accent-primary)]">{item.group}</dt>
                    <dd className="mt-2">
                      <h3 className="text-xl font-semibold text-[var(--text-primary)]">{item.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">{item.description}</p>
                    </dd>
                  </div>
                </div>
              )
            })}
          </dl>
        </div>

        <div className="mx-auto mt-12 grid max-w-[1200px] border-y border-black/[0.1] py-5 text-sm font-medium text-[var(--text-primary)] md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center md:text-center">
          <span className="py-2">管理后台配置与运营</span>
          <ArrowRight className="mx-auto hidden h-4 w-4 text-[var(--accent-primary)] md:block" aria-hidden="true" />
          <span className="border-t border-black/[0.08] py-2 md:border-t-0">服务端规则与数据</span>
          <ArrowRight className="mx-auto hidden h-4 w-4 text-[var(--accent-primary)] md:block" aria-hidden="true" />
          <span className="border-t border-black/[0.08] py-2 md:border-t-0">用户后台与移动端执行</span>
        </div>
      </section>

      <section id="product" className="bg-white px-4 py-16 sm:px-6 md:py-24 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-9 max-w-[760px]">
            <p className="text-sm font-semibold text-[var(--accent-primary)]">真实产品界面</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-[var(--text-primary)] md:text-5xl">电脑端处理复杂任务，移动端随时接续</h2>
            <p className="mt-5 text-base leading-8 text-[var(--text-secondary)]">只展示当前一合通代码包已经核对的用户后台与 H5 画面，不使用旧客户镜像或未经确认的后台截图。</p>
          </div>
          <PlatformEvidence web={productImages.web} mobile={productImages.mobile} />
        </div>
      </section>

      <section id="solutions" className="border-y border-black/[0.07] bg-[var(--bg-secondary)] px-4 py-16 sm:px-6 md:py-20 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="text-sm font-semibold text-[var(--accent-primary)]">常见业务场景</p>
              <h2 className="mt-3 text-3xl font-semibold text-[var(--text-primary)] md:text-4xl">围绕合同类型组织流程</h2>
            </div>
            <p className="max-w-[660px] text-base leading-8 text-[var(--text-secondary)] lg:justify-self-end">行业不是孤立模板，而是合同材料、审批方式、签署角色和归档要求的不同组合。</p>
          </div>
          <div className="mt-9 grid gap-x-10 md:grid-cols-2">
            {industries.map((item, index) => {
              const Icon = industryIcons[index % industryIcons.length]
              return (
                <article key={item.title} className="flex gap-4 border-t border-black/[0.1] py-5">
                  <Icon className="mt-1 h-5 w-5 flex-none text-[var(--accent-primary)]" aria-hidden="true" />
                  <div><h3 className="font-semibold text-[var(--text-primary)]">{item.title}</h3><p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{item.description}</p></div>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section id="versions" className="bg-white px-4 py-16 sm:px-6 md:py-24 lg:px-8">
        <div className="mx-auto max-w-[1050px]">
          <div className="mx-auto mb-10 max-w-[760px] text-center">
            <p className="text-sm font-semibold text-[var(--accent-primary)]">版本边界</p>
            <h2 className="mt-3 text-3xl font-semibold text-[var(--text-primary)] md:text-5xl">按业务复杂度选择交付范围</h2>
            <p className="mt-5 text-base leading-8 text-[var(--text-secondary)]">基础合同业务与旗舰管理能力分开说明，避免把可选配置写成默认完成。</p>
          </div>

          <div className="hidden overflow-hidden rounded-md border border-black/[0.09] md:block">
            <table className="w-full border-collapse text-left text-sm">
              <thead><tr className="bg-[var(--bg-secondary)]"><th className="px-5 py-4 font-semibold text-[var(--text-primary)]">功能</th><th className="px-5 py-4 text-center font-semibold text-[var(--text-primary)]">标准使用</th><th className="px-5 py-4 text-center font-semibold text-[var(--accent-primary)]">旗舰交付</th></tr></thead>
              <tbody>{compareRows.map((row) => <tr key={row.feature} className="border-t border-black/[0.08]"><td className="px-5 py-4 font-medium text-[var(--text-primary)]">{row.feature}</td><td className="px-5 py-4 text-center text-[var(--text-secondary)]"><CompareValue value={row.standard} /></td><td className="bg-[var(--accent-soft)] px-5 py-4 text-center font-medium text-[var(--text-primary)]"><CompareValue value={row.flagship} /></td></tr>)}</tbody>
            </table>
          </div>

          <ul className="divide-y divide-black/[0.08] border-y border-black/[0.09] md:hidden">
            {compareRows.map((row) => (
              <li key={row.feature} className="py-5">
                <h3 className="font-semibold text-[var(--text-primary)]">{row.feature}</h3>
                <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div><dt className="text-[var(--text-tertiary)]">标准使用</dt><dd className="mt-1 text-[var(--text-secondary)]">{mobileCompareValue(row.standard)}</dd></div>
                  <div><dt className="text-[var(--accent-primary)]">旗舰交付</dt><dd className="mt-1 font-medium text-[var(--text-primary)]">{mobileCompareValue(row.flagship)}</dd></div>
                </dl>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="delivery" className="border-y border-black/[0.07] bg-[var(--bg-secondary)] px-4 py-16 sm:px-6 md:py-20 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
          <div className="max-w-[760px]">
            <p className="text-sm font-semibold text-[var(--accent-primary)]">实施与交付</p>
            <h2 className="mt-3 text-3xl font-semibold text-[var(--text-primary)] md:text-4xl">配置、接入与验证分阶段完成</h2>
            <p className="mt-5 text-base leading-8 text-[var(--text-secondary)]">签署、实名认证、支付和模型能力依赖对应平台配置及授权，官网只承诺已经明确的产品与交付边界。</p>
          </div>

          <ol className="mt-9 grid border-y border-black/[0.09] md:grid-cols-3">
            {[
              { icon: Network, title: '确认业务与部署范围', description: '梳理合同类型、审批方式、使用终端、品牌和数据边界。' },
              { icon: ServerCog, title: '完成环境与外部接入', description: '配置域名、存储、开放接口及项目所需的第三方平台能力。' },
              { icon: BadgeCheck, title: '验证关键业务链路', description: '逐项检查模板、审批、签署、文书、状态和多端入口。' },
            ].map((step, index) => (
              <li key={step.title} className="border-b border-black/[0.08] py-6 md:border-b-0 md:border-l md:px-7 md:first:border-l-0 md:first:pl-0">
                <div className="flex items-center gap-3"><span className="text-sm font-semibold text-[var(--accent-primary)]">0{index + 1}</span><step.icon className="h-5 w-5 text-[var(--accent-primary)]" aria-hidden="true" /></div>
                <h3 className="mt-4 text-lg font-semibold text-[var(--text-primary)]">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="contact" className="bg-[var(--accent-primary)] px-4 py-16 text-white sm:px-6 md:py-20 lg:px-8">
        <div className="mx-auto flex max-w-[1000px] flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div className="max-w-[680px]">
            <p className="text-sm font-semibold text-white/80">旗舰版产品咨询</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight md:text-5xl">先看管理能力，再确认实施范围</h2>
            <p className="mt-4 text-base leading-7 text-white/85">说明合同场景、审批方式、使用终端和部署要求，我们据此安排管理后台演示与项目方案。</p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto">
            <a href={contactHref} className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-white px-6 text-sm font-semibold text-[var(--accent-primary)] transition-colors hover:bg-violet-50">
              预约旗舰版演示<ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
            {userHref ? <a href={userHref} className="inline-flex h-12 items-center justify-center rounded-md border border-white/55 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10">进入用户端</a> : null}
          </div>
        </div>
      </section>

      <footer className="bg-white px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
          <div className="flex flex-col gap-8 border-b border-black/[0.08] pb-8 md:flex-row md:items-start md:justify-between">
            <div className="max-w-[420px]">
              <div className="font-semibold text-[var(--text-primary)]">{config.projectName}</div>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">面向企业合同发起、审批、签署、运营和归档的多端业务平台。</p>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-[var(--text-secondary)]">
              <a href="#platform" className="hover:text-[var(--accent-primary)]">平台能力</a>
              <a href="#management" className="hover:text-[var(--accent-primary)]">管理后台</a>
              <a href="#product" className="hover:text-[var(--accent-primary)]">产品界面</a>
              <a href="#delivery" className="hover:text-[var(--accent-primary)]">交付方式</a>
              {config.websiteContactEmail ? <a href={`mailto:${config.websiteContactEmail}`} className="hover:text-[var(--accent-primary)]">{config.websiteContactEmail}</a> : null}
            </div>
          </div>
          <div className="flex flex-col gap-2 pt-6 text-xs text-[var(--text-tertiary)] sm:flex-row sm:items-center sm:justify-between"><span>© {new Date().getFullYear()} {config.companyName}</span>{config.icpNo ? <span>{config.icpNo}</span> : null}</div>
        </div>
      </footer>
    </>
  )
}
