'use client'

import { motion } from 'framer-motion'
import {
  ArrowRightIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  DocumentMagnifyingGlassIcon,
} from '@heroicons/react/24/outline'
import type { SiteConfig, WebsiteFeature } from '@/lib/site-config'

interface FlagshipCapability {
  title: string
  description: string
  points: string[]
}

const fallbackCapabilities: FlagshipCapability[] = [
  {
    title: '签署前审批',
    description: '把内部审核放在电子签署之前，按组织和业务规则配置审批路径。',
    points: ['角色组、固定审批与共享审批', '待办、审批详情与过程记录', '审批完成后再进入签署链路'],
  },
  {
    title: '合同生成、审查与比对',
    description: '在已配置模型服务的环境中，把智能处理接入真实合同业务。',
    points: ['合同生成、审查和版本比对', '按部署环境启用模型能力', '处理结果继续进入合同流程'],
  },
]

function featureToCapability(feature: WebsiteFeature | undefined, fallback: FlagshipCapability) {
  if (!feature) return fallback
  const points = feature.tags?.filter(Boolean).slice(0, 3)
  return {
    title: feature.title,
    description: feature.description,
    points: points?.length ? points : fallback.points,
  }
}

function resolveCapabilities(config?: SiteConfig) {
  const features = config?.websiteContent.features || []
  const approval = features.find((feature) => /审批/.test(feature.title))
  const intelligence = features.find((feature) => /智能|生成|审查|比对/.test(feature.title))
  return [
    featureToCapability(approval, fallbackCapabilities[0]),
    featureToCapability(intelligence, fallbackCapabilities[1]),
  ]
}

export default function FlagshipCapabilities({ config }: { config?: SiteConfig }) {
  const capabilities = resolveCapabilities(config)
  const icons = [ShieldCheckIcon, DocumentMagnifyingGlassIcon]

  return (
    <section id="flagship" className="relative overflow-hidden bg-[var(--bg-primary)] px-4 py-16 sm:px-10 md:py-20 lg:px-16">
      <span id="advantages" className="absolute top-0 scroll-mt-20" aria-hidden="true" />
      <div className="mx-auto max-w-[1400px]">
        <motion.div
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-[820px]"
        >
          <h2 className="yht-section-title">
            旗舰版把审批与智能处理接入合同主流程
          </h2>
          <p className="yht-section-copy mt-5 max-w-[720px]">
            高级能力不是独立工具，而是沿用同一份合同、同一套权限和同一条状态链路继续处理。
          </p>
        </motion.div>

        <div className="mt-10 grid border-y md:mt-14 md:grid-cols-2" style={{ borderColor: 'var(--border-default)' }}>
          {capabilities.map((capability, index) => {
            const Icon = icons[index]
            return (
              <motion.article
                key={capability.title}
                initial={false}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06 }}
                className={`py-8 md:py-10 ${index === 0 ? 'border-b md:border-b-0 md:pr-12' : 'md:border-l md:pl-12'}`}
                style={{ borderColor: 'var(--border-default)' }}
              >
                <div className="flex items-start gap-5">
                  <div className="flex h-11 w-11 flex-none items-center justify-center rounded-md" style={{ background: 'rgba(91,92,246,0.08)', color: 'var(--accent-primary)' }}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold md:text-[22px]" style={{ color: 'var(--text-primary)' }}>{capability.title}</h3>
                    <p className="mt-3 max-w-[560px] text-sm leading-7 md:text-base" style={{ color: 'var(--text-secondary)' }}>{capability.description}</p>
                  </div>
                </div>

                <ul className="mt-7 grid gap-3 pl-16 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  {capability.points.map((point) => (
                    <li key={point} className="flex items-start gap-3">
                      <CheckCircleIcon className="mt-0.5 h-5 w-5 flex-none" style={{ color: 'var(--accent-trust)' }} />
                      <span className="leading-6">{point}</span>
                    </li>
                  ))}
                </ul>
              </motion.article>
            )
          })}
        </div>

        <a href="#version-compare" className="mt-7 inline-flex min-h-11 items-center gap-2 text-sm font-semibold transition-colors hover:text-[var(--accent-primary)]" style={{ color: 'var(--text-primary)' }}>
          查看版本边界 <ArrowRightIcon className="h-4 w-4" />
        </a>
      </div>
    </section>
  )
}
