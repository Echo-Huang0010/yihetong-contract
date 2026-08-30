'use client'

import {
  AdjustmentsHorizontalIcon,
  CloudArrowUpIcon,
  DevicePhoneMobileIcon,
  DocumentCheckIcon,
} from '@heroicons/react/24/outline'
import type { SiteConfig, WebsiteTextCard } from '@/lib/site-config'
import SectionHeading from '@/components/sections/SectionHeading'

const advantages = [
  {
    icon: DocumentCheckIcon,
    title: '流程完整',
    description: '审批、签署与合同管理协同',
    detail: '从模板和合同发起，到签署前审批、电子签署、状态查询与归档，核心流程集中处理。',
  },
  {
    icon: DevicePhoneMobileIcon,
    title: '多端覆盖',
    description: '用户后台、H5 与小程序协同',
    detail: '不同终端承接各自适合的合同办理场景，并保持合同、审批和签署状态一致。',
  },
  {
    icon: AdjustmentsHorizontalIcon,
    title: '配置化交付',
    description: '品牌、入口与部署参数统一管理',
    detail: '面向不同客户环境配置品牌信息、各端入口、开放平台和部署所需参数。',
  },
  {
    icon: CloudArrowUpIcon,
    title: '私有化能力',
    description: '支持企业环境部署与系统集成',
    detail: '结合开放接口与部署配置能力，按企业现有系统和数据边界完成集成交付。',
  },
]

const fallbackIcons = [DocumentCheckIcon, DevicePhoneMobileIcon, AdjustmentsHorizontalIcon, CloudArrowUpIcon]

function normalizeAdvantage(item: WebsiteTextCard, index: number) {
  if (!item?.title || !item.description) return null
  const fallback = advantages[index % advantages.length]

  return {
    icon: fallbackIcons[index % fallbackIcons.length],
    title: item.title,
    description: item.description,
    detail: item.detail || fallback.detail,
  }
}

function resolveAdvantages(config?: SiteConfig) {
  const configured = config?.websiteContent?.advantages
    ?.map(normalizeAdvantage)
    .filter((item): item is typeof advantages[number] => Boolean(item))

  return configured?.length ? configured : advantages
}

export default function Advantages({ config }: { config?: SiteConfig }) {
  const displayAdvantages = resolveAdvantages(config)

  return (
    <section id="advantages" className="relative overflow-hidden bg-[var(--bg-primary)] px-4 py-20 sm:px-8 md:py-28 lg:px-16">
      <div className="absolute inset-0 bg-grid-subtle" />

      <div className="relative mx-auto max-w-[1180px]">
        <SectionHeading
          title="差异化优势"
          description="从合同办理到多端协同和私有化交付，围绕企业实际业务组织能力。"
        />

        <div className="grid border-y md:grid-cols-2" style={{ borderColor: 'var(--border-default)' }}>
          {displayAdvantages.map((advantage, index) => (
            <article
              key={advantage.title}
              className={`py-7 md:p-8 ${index < displayAdvantages.length - 1 ? 'border-b' : ''} ${index < 2 ? 'md:border-b' : 'md:border-b-0'} ${index % 2 === 0 ? 'md:border-r md:pr-10' : 'md:pl-10'}`}
              style={{ borderColor: 'var(--border-default)' }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-10 w-10 flex-none items-center justify-center rounded-md"
                  style={{
                    background: 'rgba(91,92,246,0.055)',
                    border: '1px solid rgba(91,92,246,0.14)',
                    color: 'var(--accent-primary)',
                  }}
                >
                  <advantage.icon className="h-5 w-5" />
                </span>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {advantage.title}
                </h3>
              </div>
              <p className="mt-5 text-base font-medium leading-7" style={{ color: 'var(--text-primary)' }}>
                {advantage.description}
              </p>
              {advantage.detail ? (
                <p className="mt-2 text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
                  {advantage.detail}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
