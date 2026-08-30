'use client'

import {
  BanknotesIcon,
  HomeModernIcon,
  ShoppingCartIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'
import type { SiteConfig, WebsiteTextCard } from '@/lib/site-config'
import SectionHeading from '@/components/sections/SectionHeading'

const industries = [
  {
    icon: UserGroupIcon,
    title: '人力资源',
    description: '劳动合同、入职协议、保密协议',
    stats: '批量发起与签署进度管理',
  },
  {
    icon: BanknotesIcon,
    title: '金融行业',
    description: '贷款合同、理财协议、保险单据',
    stats: '签署前审批与合同审查',
  },
  {
    icon: ShoppingCartIcon,
    title: '销售签单',
    description: '销售合同、订单确认、代理协议',
    stats: '多方签署与状态跟踪',
  },
  {
    icon: HomeModernIcon,
    title: '租赁管理',
    description: '租赁合同、物业管理、设备租赁',
    stats: '模板、签署与合同归档',
  },
]

const fallbackIcons = [UserGroupIcon, BanknotesIcon, ShoppingCartIcon, HomeModernIcon]

function normalizeIndustry(item: WebsiteTextCard, index: number) {
  if (!item?.title || !item.description) return null
  const fallback = industries[index % industries.length]

  return {
    icon: fallbackIcons[index % fallbackIcons.length],
    title: item.title,
    description: item.description,
    stats: item.stats || item.detail || fallback.stats,
  }
}

function resolveIndustries(config?: SiteConfig) {
  const configured = config?.websiteContent?.industries
    ?.map(normalizeIndustry)
    .filter((item): item is typeof industries[number] => Boolean(item))

  return configured?.length ? configured : industries
}

export default function Industries({ config }: { config?: SiteConfig }) {
  const displayIndustries = resolveIndustries(config)

  return (
    <section id="industries" className="relative overflow-hidden bg-[var(--bg-secondary)] px-4 py-20 sm:px-8 md:py-28 lg:px-16">
      <div className="absolute inset-0 bg-grid-subtle" />

      <div className="relative mx-auto max-w-[1180px]">
        <SectionHeading
          title="行业解决方案"
          description="围绕不同业务合同，组合模板、审批、签署和归档能力"
        />

        <div className="overflow-hidden rounded-lg border bg-white" style={{ borderColor: 'var(--border-default)' }}>
          <div
            className="hidden grid-cols-[1fr_1.3fr_1.2fr] gap-8 border-b px-6 py-4 text-xs font-medium md:grid"
            style={{ borderColor: 'var(--border-default)', background: 'rgba(247,247,252,0.72)', color: 'var(--text-secondary)' }}
          >
            <span>业务场景</span>
            <span>常见合同</span>
            <span>适配能力</span>
          </div>

          {displayIndustries.map((industry) => (
            <article
              key={industry.title}
              className="grid gap-4 border-b p-5 last:border-b-0 md:grid-cols-[1fr_1.3fr_1.2fr] md:items-center md:gap-8 md:px-6 md:py-5"
              style={{ borderColor: 'var(--border-default)' }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-10 w-10 flex-none items-center justify-center rounded-md"
                  style={{ background: 'rgba(91,92,246,0.055)', border: '1px solid rgba(91,92,246,0.14)', color: 'var(--accent-primary)' }}
                >
                  <industry.icon className="h-5 w-5" />
                </span>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {industry.title}
                </h3>
              </div>

              <div className="pl-[52px] md:pl-0">
                <span className="mb-1 block text-xs md:hidden" style={{ color: 'var(--text-tertiary)' }}>常见合同</span>
                <p className="text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>{industry.description}</p>
              </div>

              <div className="pl-[52px] md:pl-0">
                <span className="mb-1 block text-xs md:hidden" style={{ color: 'var(--text-tertiary)' }}>适配能力</span>
                <div className="flex items-start gap-2 text-sm leading-6" style={{ color: 'var(--accent-tech)' }}>
                  <span className="mt-[9px] h-1.5 w-1.5 flex-none rounded-full" style={{ background: 'var(--accent-tech)' }} />
                  <span>{industry.stats}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
