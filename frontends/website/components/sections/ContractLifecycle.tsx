'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  ArchiveBoxIcon,
  ArrowPathRoundedSquareIcon,
  CodeBracketSquareIcon,
  DevicePhoneMobileIcon,
  DocumentCheckIcon,
  DocumentDuplicateIcon,
  DocumentMagnifyingGlassIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'
import type { SiteConfig, WebsiteFeature, WebsiteWorkflowStep } from '@/lib/site-config'

interface CapabilityItem {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  title: string
  status: string
  description: string
}

const fallbackCapabilities: CapabilityItem[] = [
  { icon: DocumentCheckIcon, title: '合同发起与电子签署', status: '合同主流程', description: '设置签署方、签署顺序和身份要求，持续查看合同进度。' },
  { icon: DocumentDuplicateIcon, title: '模板与合同文书', status: '材料与文书', description: '统一承接合同模板、在线文书、PDF 材料和文件合同。' },
  { icon: ShieldCheckIcon, title: '签署前审批', status: '旗舰版流程', description: '按角色、部门或指定人员完成内部审核并保留处理记录。' },
  { icon: DocumentMagnifyingGlassIcon, title: '合同智能处理', status: '按模型配置', description: '提供合同生成、内容审查和版本比对等辅助能力。' },
  { icon: DevicePhoneMobileIcon, title: '用户后台与移动端', status: '多端业务入口', description: '用户后台、H5 与小程序共享合同和流程状态。' },
  { icon: CodeBracketSquareIcon, title: '开放接口与部署', status: '系统集成', description: '连接企业系统，并按环境完成品牌配置和私有化交付。' },
]

const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  sign: PencilSquareIcon,
  contract: DocumentDuplicateIcon,
  ai: DocumentMagnifyingGlassIcon,
  shield: ShieldCheckIcon,
  api: CodeBracketSquareIcon,
  check: DocumentCheckIcon,
  mobile: DevicePhoneMobileIcon,
}

const fallbackSteps = [
  { title: '模板与材料', description: '准备合同内容与业务材料。' },
  { title: '签署前审批', description: '按规则完成内部审核。' },
  { title: '多方签署', description: '确认签署方并进入签署。' },
  { title: '状态协同', description: '各端同步合同与流程进度。' },
  { title: '文书归档', description: '沉淀文书与处理记录。' },
]

const stepIcons = [DocumentTextIcon, ShieldCheckIcon, PencilSquareIcon, ArrowPathRoundedSquareIcon, ArchiveBoxIcon]

function normalizeFeature(feature: WebsiteFeature, index: number): CapabilityItem | null {
  if (!feature.title || !feature.description) return null
  return {
    icon: iconMap[feature.icon || ''] || fallbackCapabilities[index % fallbackCapabilities.length].icon,
    title: feature.title,
    status: feature.status || '产品能力',
    description: feature.description,
  }
}

function resolveCapabilities(config?: SiteConfig) {
  const configured = config?.websiteContent.features
    ?.map(normalizeFeature)
    .filter((item): item is CapabilityItem => Boolean(item))
    .slice(0, 6)
  return configured?.length ? configured : fallbackCapabilities
}

function resolveSteps(config?: SiteConfig) {
  const configured = config?.websiteContent.approvalWorkflow
    ?.filter((item): item is WebsiteWorkflowStep => Boolean(item?.title && item.description))
    .slice(0, 5)
  return configured?.length ? configured : fallbackSteps
}

function resolvePrimaryCapabilities(capabilities: CapabilityItem[]) {
  const priorities = [
    /发起|模板|文书/,
    /审批|签署/,
    /智能|审查|比对|移动/,
  ]
  const selected: CapabilityItem[] = []

  priorities.forEach((pattern) => {
    const matched = capabilities.find((item) => (
      !selected.includes(item) && pattern.test(`${item.status} ${item.title}`)
    ))
    const fallback = capabilities.find((item) => !selected.includes(item))
    const next = matched || fallback
    if (next) selected.push(next)
  })

  return selected
}

export default function ContractLifecycle({ config }: { config?: SiteConfig }) {
  const capabilities = resolveCapabilities(config)
  const steps = resolveSteps(config)
  const primaryCapabilities = resolvePrimaryCapabilities(capabilities)
  const secondaryCapabilities = capabilities.filter((item) => !primaryCapabilities.includes(item)).slice(0, 3)

  return (
    <section id="lifecycle" className="relative overflow-hidden bg-[var(--bg-secondary)] px-4 py-16 sm:px-10 md:py-24 lg:px-16">
      <span id="features" className="absolute top-0 scroll-mt-20" aria-hidden="true" />
      <div className="mx-auto max-w-[1400px]">
        <div className="grid items-start gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] lg:gap-x-16 lg:gap-y-7">
          <motion.figure
            initial={false}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="order-2 lg:order-1 lg:row-span-2"
          >
            <div
              data-testid="lifecycle-visual"
              className="relative aspect-[5/4] overflow-hidden rounded-[8px] border bg-white"
              style={{ borderColor: 'var(--border-default)' }}
            >
              <Image
                src="/brand-visuals/contract-lifecycle-v1.png"
                alt="合同材料、审批、签署与归档流程示意"
                fill
                className="object-cover object-[56%_50%]"
                sizes="(max-width: 1024px) 100vw, 44vw"
              />
            </div>
            <figcaption className="mt-3 text-sm leading-6" style={{ color: 'var(--text-tertiary)' }}>
              同一份合同贯穿材料准备、内部审批、电子签署与文书归档。
            </figcaption>
          </motion.figure>

          <motion.header
            initial={false}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="order-1 lg:order-2"
          >
            <p className="yht-section-kicker mb-4">合同全流程</p>
            <h2 className="yht-section-title">一条合同链路，贯通从起草到归档</h2>
            <p className="yht-section-copy mt-5 max-w-[720px]">
              从合同材料进入业务开始，审批、签署、智能处理和多端状态都围绕同一份合同继续流转。
            </p>
          </motion.header>

          <div className="order-3 lg:order-3" data-testid="lifecycle-primary-capabilities">
            <div className="border-y" style={{ borderColor: 'var(--border-default)' }}>
              {primaryCapabilities.map((capability, index) => (
              <motion.article
                key={capability.title}
                initial={false}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.04 }}
                data-testid="lifecycle-primary-capability"
                className="grid min-w-0 grid-cols-[40px_1fr] gap-4 border-t py-5 first:border-t-0 md:grid-cols-[44px_1fr] md:py-6"
                style={{ borderColor: 'var(--border-default)' }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-white md:h-11 md:w-11">
                  <capability.icon className="h-5 w-5" style={{ color: 'var(--accent-primary)' }} />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h3 className="text-lg font-semibold leading-7 md:text-xl" style={{ color: 'var(--text-primary)' }}>{capability.title}</h3>
                    <span className="text-sm font-medium" style={{ color: 'var(--accent-trust)' }}>{capability.status}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 md:text-base md:leading-7" style={{ color: 'var(--text-secondary)' }}>{capability.description}</p>
                </div>
              </motion.article>
              ))}
            </div>

            {secondaryCapabilities.length ? (
              <p className="mt-4 text-sm leading-6" style={{ color: 'var(--text-tertiary)' }}>
                同时覆盖：{secondaryCapabilities.map((item) => item.title).join('、')}。
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-12 border-t pt-8 md:mt-16 md:pt-9" style={{ borderColor: 'var(--border-default)' }}>
          <h3 className="text-lg font-semibold md:text-xl" style={{ color: 'var(--text-primary)' }}>五步完成主流程</h3>
          <ol className="mt-5 grid border-y sm:grid-cols-5" style={{ borderColor: 'var(--border-default)' }}>
            {steps.map((step, index) => {
              const Icon = stepIcons[index % stepIcons.length]
              return (
                <motion.li
                  key={`${step.title}-${index}`}
                  initial={false}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.04 }}
                  className="grid grid-cols-[28px_96px_1fr] items-start gap-3 border-t px-1 py-4 first:border-t-0 sm:block sm:border-l sm:border-t-0 sm:px-4 sm:py-6 sm:first:border-l-0 md:px-5"
                  style={{ borderColor: 'var(--border-default)' }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <Icon className="hidden h-5 w-5 sm:block" style={{ color: 'var(--accent-primary)' }} />
                    <span className="text-sm font-semibold" style={{ color: 'var(--accent-trust)' }}>{String(index + 1).padStart(2, '0')}</span>
                  </div>
                  <h4 className="text-sm font-semibold leading-6 sm:mt-5 sm:text-base" style={{ color: 'var(--text-primary)' }}>{step.title}</h4>
                  <p className="text-sm leading-6 sm:mt-2" style={{ color: 'var(--text-secondary)' }}>{step.description}</p>
                </motion.li>
              )
            })}
          </ol>
        </div>
      </div>
    </section>
  )
}
