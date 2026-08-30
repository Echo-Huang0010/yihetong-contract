'use client'

import { CheckIcon } from '@heroicons/react/24/outline'
import type { SiteConfig, WebsiteBrandVisual, WebsiteTextCard } from '@/lib/site-config'
import SectionHeading from '@/components/sections/SectionHeading'

const techFeatures = [
  { title: '合同签署与身份核验', description: '根据项目配置接入电子签署、实名认证和相关第三方服务。' },
  { title: '合同 PDF 与业务材料', description: '统一承接模板 PDF、合同文书、文件合同以及审批所需材料。' },
  { title: '审批过程记录', description: '保留审批节点、处理状态和审批历史，便于业务追踪。' },
  { title: '跨端状态一致', description: '在用户后台、H5、小程序和服务端之间保持合同与审批状态一致。' },
  { title: '品牌与部署配置', description: '集中管理各端公开品牌、访问入口和部署所需配置。' },
  { title: '开放平台与系统集成', description: '通过开放接口连接企业既有业务系统，并支持私有化交付。' },
]

const defaultOperationsVisual: WebsiteBrandVisual = {
  key: 'operations',
  src: '/brand-visuals/multi-end-operations-v1.png',
  alt: '多端合同业务协同与系统集成示意',
  caption: '多端产品围绕同一合同业务链路协同。',
}

function normalizeTechFeature(item: WebsiteTextCard) {
  if (!item?.title || !item.description) return null

  return {
    title: item.title,
    description: item.description,
  }
}

function resolveTechFeatures(config?: SiteConfig) {
  const configured = config?.websiteContent?.techFeatures
    ?.map(normalizeTechFeature)
    .filter((item): item is typeof techFeatures[number] => Boolean(item))

  return configured?.length ? configured : techFeatures
}

export default function TechStack({ config }: { config?: SiteConfig }) {
  const displayTechFeatures = resolveTechFeatures(config)
  const configuredOperationsVisual = config?.websiteContent?.brandVisuals?.find(
    (item) => item?.key === 'operations' && item.src && item.alt,
  )
  const operationsVisual = configuredOperationsVisual || defaultOperationsVisual

  return (
    <section id="tech" className="relative overflow-hidden bg-[var(--bg-secondary)] px-4 py-20 sm:px-8 md:py-28 lg:px-16">
      <div className="absolute inset-0 bg-grid-subtle" />

      <div className="relative mx-auto max-w-[1180px]">
        <SectionHeading
          title="安全与交付能力"
          description="围绕合同材料、审批记录、多端一致性和部署集成组织系统能力"
        />

        <div className="grid gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-stretch lg:gap-14">
          <div className="border-y" style={{ borderColor: 'var(--border-default)' }}>
            {displayTechFeatures.map((feature) => (
              <article
                key={feature.title}
                className="flex gap-4 border-b py-5 last:border-b-0 md:py-6"
                style={{ borderColor: 'var(--border-default)' }}
              >
                <span
                  className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-md"
                  style={{ background: 'rgba(5,150,105,0.07)', color: 'var(--accent-trust)' }}
                >
                  <CheckIcon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold leading-6" style={{ color: 'var(--text-primary)' }}>
                    {feature.title}
                  </h3>
                  <p className="mt-1 text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
                    {feature.description}
                  </p>
                </div>
              </article>
            ))}
          </div>

          <figure className="flex flex-col overflow-hidden rounded-lg border bg-white" style={{ borderColor: 'var(--border-default)' }}>
            <div className="flex min-h-[280px] flex-1 items-center justify-center bg-[rgba(247,247,252,0.72)] p-5 sm:p-7 md:min-h-[360px] lg:min-h-[500px]">
              <img
                src={operationsVisual.src}
                alt={operationsVisual.alt}
                className="max-h-[300px] w-full object-contain md:max-h-[430px]"
                loading="lazy"
              />
            </div>
            <figcaption
              className="border-t px-5 py-4 text-sm leading-6 md:px-6"
              style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
            >
              {operationsVisual?.caption || '客户品牌素材由管理后台统一维护。'}
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  )
}
