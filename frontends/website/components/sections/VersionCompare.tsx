'use client'

import {
  ArrowRightIcon,
  CheckIcon,
  CpuChipIcon,
  CubeIcon,
  DocumentTextIcon,
  RocketLaunchIcon,
  SparklesIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'
import type { SiteConfig, WebsiteCompareRow, WebsiteVersionHighlight } from '@/lib/site-config'
import SectionHeading from '@/components/sections/SectionHeading'

interface CompareRow {
  feature: string
  standard: string | boolean
  flagship: string | boolean
  highlight?: boolean
}

const compareData: CompareRow[] = [
  { feature: '合同发起、签署与归档', standard: true, flagship: true },
  { feature: '多方签署与签署进度', standard: true, flagship: true },
  { feature: '合同模板与 PDF 文书', standard: true, flagship: true },
  { feature: '文件合同发起签署', standard: true, flagship: true },
  { feature: 'Web、H5 与小程序入口', standard: true, flagship: true },
  { feature: '用户与企业实名认证', standard: true, flagship: true },
  { feature: '会员充值与支付二维码', standard: true, flagship: true },
  { feature: '签署前审批与过程留痕', standard: '基础流程', flagship: '完整流程', highlight: true },
  { feature: '审批流配置、待办与工作树', standard: false, flagship: true, highlight: true },
  { feature: '角色组、权限与菜单可见性', standard: '基础权限', flagship: '精细化权限', highlight: true },
  { feature: '合同文书在线编辑与下载', standard: false, flagship: true, highlight: true },
  { feature: '合同生成、审查与比对', standard: false, flagship: true, highlight: true },
  { feature: '合同比对历史与结果查看', standard: false, flagship: true, highlight: true },
  { feature: '管理后台综合运营', standard: '基础管理', flagship: '完整后台', highlight: true },
  { feature: '内容资讯发布与运营概览', standard: false, flagship: true, highlight: true },
  { feature: '代理管理与服务管理', standard: false, flagship: true, highlight: true },
  { feature: '多端品牌与访问入口配置', standard: false, flagship: true, highlight: true },
  { feature: '品牌配置与私有化部署', standard: false, flagship: true, highlight: true },
  { feature: '部署配置与第三方服务参数', standard: false, flagship: true, highlight: true },
  { feature: '开放接口与集成支持', standard: '基础接口', flagship: '按项目交付', highlight: true },
  { feature: '客户环境独立部署与运维', standard: true, flagship: true },
]

const flagshipHighlights = [
  {
    icon: DocumentTextIcon,
    title: '签署前审批',
    desc: '通过审批流程、角色组和审批记录，在合同发起前完成内部确认。',
  },
  {
    icon: SparklesIcon,
    title: 'AI合同生成',
    desc: '在配置大模型服务后，根据业务输入辅助生成合同文本。',
  },
  {
    icon: CpuChipIcon,
    title: '合同审查与比对',
    desc: '对合同条款进行审查，并比较基准合同与目标合同的差异。',
  },
  {
    icon: UserGroupIcon,
    title: '多端协同',
    desc: '用户后台、H5 与小程序共同承接合同办理和状态查询。',
  },
  {
    icon: CubeIcon,
    title: '配置化交付',
    desc: '统一管理品牌、各端入口、开放平台与部署参数。',
  },
  {
    icon: RocketLaunchIcon,
    title: '全流程覆盖',
    desc: '覆盖起草、审批、签署、管理和归档等合同业务环节。',
  },
]

const highlightIcons = [DocumentTextIcon, SparklesIcon, CpuChipIcon, UserGroupIcon, CubeIcon, RocketLaunchIcon]

function normalizeCompareRow(row: WebsiteCompareRow): CompareRow | null {
  if (!row?.feature) return null

  return {
    feature: row.feature,
    standard: row.standard,
    flagship: row.flagship,
    highlight: Boolean(row.highlight),
  }
}

function normalizeHighlight(item: WebsiteVersionHighlight, index: number) {
  if (!item?.title || !item.desc) return null

  return {
    icon: highlightIcons[index % highlightIcons.length],
    title: item.title,
    desc: item.desc,
  }
}

function resolveCompareData(config?: SiteConfig) {
  const configured = config?.websiteContent?.versionCompare
    ?.map(normalizeCompareRow)
    .filter((item): item is CompareRow => Boolean(item))

  if (!configured?.length) return compareData

  const configuredByFeature = new Map(configured.map((row) => [row.feature, row]))
  const baselineFeatures = new Set(compareData.map((row) => row.feature))
  return [
    ...compareData.map((row) => configuredByFeature.get(row.feature) || row),
    ...configured.filter((row) => !baselineFeatures.has(row.feature)),
  ]
}

function resolveHighlights(config?: SiteConfig) {
  const configured = config?.websiteContent?.versionHighlights
    ?.map(normalizeHighlight)
    .filter((item): item is typeof flagshipHighlights[number] => Boolean(item))

  return configured?.length ? configured : flagshipHighlights
}

function CapabilityList({ items, color }: { items: string[]; color: string }) {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm" style={{ color }}>
      {items.map((item) => (
        <span key={item} className="inline-flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
          {item}
        </span>
      ))}
    </div>
  )
}

function CompareValue({ value, flagship = false }: { value: string | boolean; flagship?: boolean }) {
  if (typeof value === 'boolean') {
    return value ? (
      <CheckIcon
        className="mx-auto h-5 w-5"
        aria-label="支持"
        style={{ color: flagship ? 'var(--accent-primary)' : 'var(--accent-tech)' }}
      />
    ) : (
      <span aria-label="不支持" style={{ color: 'var(--text-tertiary)' }}>—</span>
    )
  }

  return <span>{value}</span>
}

export default function VersionCompare({ config }: { config?: SiteConfig }) {
  const displayCompareData = resolveCompareData(config)
  const displayHighlights = resolveHighlights(config)
  const productName = config?.projectName || '一合通'

  return (
    <section id="version-compare" className="relative overflow-hidden bg-[var(--bg-primary)] px-4 py-20 sm:px-8 md:py-28 lg:px-16">
      <div className="absolute inset-0 bg-grid-subtle" />

      <div className="relative mx-auto max-w-[1180px]">
        <SectionHeading
          title="版本对比"
          description="先判断业务复杂度，再选择标准版或旗舰版"
        />

        <div className="grid border-y lg:grid-cols-2" style={{ borderColor: 'var(--border-default)' }}>
          <article className="py-7 md:py-9 lg:pr-10">
            <div className="flex items-center gap-3">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-md"
                style={{ background: 'rgba(37,99,235,0.055)', border: '1px solid rgba(37,99,235,0.14)', color: 'var(--accent-tech)' }}
              >
                <CubeIcon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-xl font-semibold md:text-2xl" style={{ color: 'var(--text-primary)' }}>标准版</h3>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>标准合同服务</p>
              </div>
            </div>
            <p className="mt-5 max-w-[56ch] text-base leading-7" style={{ color: 'var(--text-secondary)' }}>
              适合以合同发起、电子签署、模板和多端合同管理为主的团队。
            </p>
            <div className="mt-5">
              <CapabilityList
                items={['合同发起', '电子签署', '模板管理', '多端覆盖', '私有化部署']}
                color="var(--accent-tech)"
              />
            </div>
            <a
              href="#cta"
              className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-tech)]"
              style={{ color: 'var(--accent-tech)' }}
            >
              查看标准版
              <ArrowRightIcon className="h-4 w-4" />
            </a>
          </article>

          <article
            className="border-t px-5 py-7 md:px-8 md:py-9 lg:border-l lg:border-t-0 lg:px-10"
            style={{ borderColor: 'var(--border-default)', background: 'rgba(91,92,246,0.035)' }}
          >
            <div className="flex flex-wrap items-center gap-3">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-md"
                style={{ background: 'rgba(91,92,246,0.07)', border: '1px solid rgba(91,92,246,0.16)', color: 'var(--accent-primary)' }}
              >
                <SparklesIcon className="h-5 w-5" />
              </span>
              <div className="mr-auto">
                <h3 className="text-xl font-semibold md:text-2xl" style={{ color: 'var(--text-primary)' }}>旗舰版</h3>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{productName}旗舰版</p>
              </div>
              <span className="rounded-md px-2.5 py-1 text-xs font-medium text-white" style={{ background: 'var(--accent-primary)' }}>
                当前版本
              </span>
            </div>
            <p className="mt-5 max-w-[56ch] text-base leading-7" style={{ color: 'var(--text-secondary)' }}>
              适合需要签署前审批、合同文书、智能合同、合同比对和配置化交付的企业。
            </p>
            <div className="mt-5">
              <CapabilityList
                items={['签署前审批', '合同生成', '合同审查', '合同比对', '多端配置', '全流程覆盖']}
                color="var(--accent-primary)"
              />
            </div>
            <a
              href="#cta"
              className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
              style={{ color: 'var(--accent-primary)' }}
            >
              咨询旗舰版
              <ArrowRightIcon className="h-4 w-4" />
            </a>
          </article>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[0.36fr_1.64fr] lg:gap-14">
          <div className="max-w-[340px]">
            <h3 className="text-xl font-semibold md:text-2xl" style={{ color: 'var(--text-primary)' }}>旗舰版扩展能力</h3>
            <p className="mt-3 text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>
              在标准签署能力之上，补齐企业内部决策、智能处理和交付管理。
            </p>
          </div>

          <div className="grid gap-x-8 md:grid-cols-2 lg:grid-cols-3">
            {displayHighlights.map((item) => (
              <article
                key={item.title}
                className="flex gap-3 border-t py-5"
                style={{ borderColor: 'var(--border-default)' }}
              >
                <item.icon className="mt-0.5 h-5 w-5 flex-none" style={{ color: 'var(--accent-primary)' }} />
                <div>
                  <h4 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{item.title}</h4>
                  <p className="mt-1 text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>{item.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-12">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <h3 className="text-xl font-semibold md:text-2xl" style={{ color: 'var(--text-primary)' }}>详细功能对比</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>表格内可纵向查看全部能力</p>
          </div>

          <div className="overflow-x-auto rounded-lg border bg-white" style={{ borderColor: 'var(--border-default)' }}>
            <table className="w-full table-fixed border-collapse text-xs sm:table-auto sm:text-sm">
              <thead className="sticky top-0 z-10" style={{ background: 'var(--bg-secondary)' }}>
                <tr>
                  <th className="w-[50%] px-4 py-3 text-left font-semibold sm:w-auto sm:px-6 sm:py-4" style={{ color: 'var(--text-primary)' }}>功能</th>
                  <th className="w-[23%] px-2 py-3 text-center font-semibold sm:w-[150px] sm:px-5 sm:py-4" style={{ color: 'var(--text-primary)' }}>标准版</th>
                  <th className="w-[27%] px-2 py-3 text-center font-semibold sm:w-[180px] sm:px-5 sm:py-4" style={{ color: 'var(--accent-primary)' }}>旗舰版</th>
                </tr>
              </thead>
              <tbody>
                {displayCompareData.map((row) => (
                  <tr
                    key={row.feature}
                    className="border-t"
                    style={{ borderColor: 'var(--border-default)', background: row.highlight ? 'rgba(91,92,246,0.025)' : '#fff' }}
                  >
                    <th scope="row" className="px-4 py-3 text-left font-medium leading-5 sm:px-6 sm:py-3.5" style={{ color: 'var(--text-primary)' }}>
                      {row.feature}
                    </th>
                    <td className="px-2 py-3 text-center leading-5 sm:px-5 sm:py-3.5" style={{ color: 'var(--text-secondary)' }}>
                      <CompareValue value={row.standard} />
                    </td>
                    <td className="px-2 py-3 text-center font-medium leading-5 sm:px-5 sm:py-3.5" style={{ color: 'var(--text-primary)' }}>
                      <CompareValue value={row.flagship} flagship />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-6 text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>商业授权说明：</span>
          实际可用功能取决于采购版本、部署环境以及第三方服务配置。商业授权、实施范围和服务价格请以正式方案为准。
        </p>
      </div>
    </section>
  )
}

