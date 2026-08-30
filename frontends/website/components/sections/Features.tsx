'use client'

import { motion } from 'framer-motion'
import {
  PencilSquareIcon,
  DocumentDuplicateIcon,
  SparklesIcon,
  ShieldCheckIcon,
  ServerIcon,
  CodeBracketSquareIcon,
  DocumentCheckIcon,
  DevicePhoneMobileIcon,
  BoltIcon,
} from '@heroicons/react/24/outline'
import type { SiteConfig, WebsiteFeature } from '@/lib/site-config'

interface FeatureCard {
  icon: React.ComponentType<{ className?: string }>
  title: string
  status: string
  statusType: 'active' | 'beta'
  description: string
  tags: string[]
  link: string
  linkLabel: string
  variant: 'default' | 'emphasized'
}

const features: FeatureCard[] = [
  {
    icon: DocumentCheckIcon,
    title: '合同发起与签署',
    status: '核心能力',
    statusType: 'active',
    description: '覆盖合同发起、签署方设置、电子签署、进度跟踪和完成归档，适配多方签署场景。',
    tags: ['多方签署', '电子印章', '进度跟踪'],
    link: '#showcase',
    linkLabel: '查看产品',
    variant: 'default',
  },
  {
    icon: DocumentDuplicateIcon,
    title: '模板与合同文书',
    status: '核心能力',
    statusType: 'active',
    description: '支持合同模板、在线合同文书、PDF 材料和文件合同发起，满足不同合同来源的业务需求。',
    tags: ['模板管理', 'PDF 材料', '文件合同'],
    link: '#showcase',
    linkLabel: '查看界面',
    variant: 'default',
  },
  {
    icon: ShieldCheckIcon,
    title: '签署前审批',
    status: '旗舰版能力',
    statusType: 'active',
    description: '在合同发起前配置审批流程，支持角色组、固定审批与共享审批，并保留节点和处理记录。',
    tags: ['审批流程', '角色组', '审批记录'],
    link: '#version-compare',
    linkLabel: '了解旗舰版',
    variant: 'default',
  },
  {
    icon: SparklesIcon,
    title: '智能合同工作台',
    status: '按配置启用',
    statusType: 'beta',
    description: '在已配置大模型服务的环境中提供合同生成、合同审查和合同比对，辅助处理合同文本。',
    tags: ['合同生成', '合同审查', '合同比对'],
    link: '#showcase',
    linkLabel: '查看合同比对',
    variant: 'emphasized',
  },
  {
    icon: DevicePhoneMobileIcon,
    title: '多端协同',
    status: '全平台覆盖',
    statusType: 'active',
    description: '用户后台、H5 与小程序协同承接合同模板、审批、签署和合同状态查询。',
    tags: ['用户后台', 'H5', '小程序'],
    link: '#showcase',
    linkLabel: '查看多端产品',
    variant: 'default',
  },
  {
    icon: CodeBracketSquareIcon,
    title: '综合管理与交付',
    status: '交付能力',
    statusType: 'active',
    description: '管理后台统一承载角色权限、审批流程、合同模板、内容运营及品牌部署配置，并支持开放接口与私有化交付。',
    tags: ['管理后台', '部署配置', '开放集成'],
    link: '#cta',
    linkLabel: '咨询部署方案',
    variant: 'default',
  },
]

const fallbackIcons = [
  PencilSquareIcon,
  DocumentDuplicateIcon,
  SparklesIcon,
  ShieldCheckIcon,
  ServerIcon,
  CodeBracketSquareIcon,
  DocumentCheckIcon,
  DevicePhoneMobileIcon,
]

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  sign: PencilSquareIcon,
  contract: DocumentDuplicateIcon,
  ai: SparklesIcon,
  shield: ShieldCheckIcon,
  server: ServerIcon,
  api: CodeBracketSquareIcon,
  check: DocumentCheckIcon,
  mobile: DevicePhoneMobileIcon,
}

function normalizeFeature(feature: WebsiteFeature, index: number): FeatureCard | null {
  if (!feature.title || !feature.description) {
    return null
  }
  const fallback = features[index % features.length]
  return {
    icon: iconMap[feature.icon || ''] || fallback.icon || fallbackIcons[index % fallbackIcons.length],
    title: feature.title,
    status: feature.status || fallback.status,
    statusType: feature.statusType || fallback.statusType,
    description: feature.description,
    tags: Array.isArray(feature.tags) ? feature.tags.filter(Boolean) : fallback.tags,
    link: feature.link || fallback.link,
    linkLabel: feature.linkLabel || fallback.linkLabel,
    variant: feature.variant || fallback.variant,
  }
}

function resolveFeatures(config?: SiteConfig) {
  const configured = config?.websiteContent?.features
    ?.map(normalizeFeature)
    .filter((item): item is FeatureCard => Boolean(item))
  return configured?.length ? configured.slice(0, 6) : features
}

export default function Features({ config }: { config?: SiteConfig }) {
  const displayFeatures = resolveFeatures(config)
  const productName = config?.projectName || '一合通'

  return (
    <section id="features" className="relative py-16 md:py-32 px-4 sm:px-10 lg:px-16 bg-[var(--bg-secondary)] overflow-hidden">
      <div className="absolute inset-0 bg-grid-subtle" />

      <div className="relative max-w-[1400px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-10 md:mb-20"
        >
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-3 md:mb-4" style={{ color: 'var(--text-primary)' }}>
            核心功能
          </h2>
          <p className="text-sm md:text-lg" style={{ color: 'var(--text-secondary)' }}>
            以「{productName}」为核心，连接电子合同全生命周期
          </p>
        </motion.div>

        {/* Mobile/Tablet: 垂直堆叠 */}
        <div className="xl:hidden space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="mx-auto w-40 h-40 rounded-full flex flex-col items-center justify-center mb-6"
            style={{
              background: 'radial-gradient(circle, rgba(91, 92, 246, 0.1) 0%, rgba(91, 92, 246, 0.02) 100%)',
              border: '1.5px solid rgba(91, 92, 246, 0.2)',
              boxShadow: '0 0 24px rgba(91, 92, 246, 0.1)',
            }}
          >
            <BoltIcon className="w-8 h-8 mb-2" style={{ color: 'var(--accent-primary)' }} />
            <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{productName}</span>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>合同全生命周期</span>
          </motion.div>

          {displayFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.04 }}
              className="p-4 sm:p-8 rounded-xl glass-card backdrop-blur-[16px] transition-all duration-300 hover:-translate-y-0.5"
              style={{
                boxShadow: feature.variant === 'emphasized' ? 'var(--glow-brand)' : undefined,
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{
                    background: 'rgba(91, 92, 246, 0.07)',
                    border: '1px solid rgba(91, 92, 246, 0.12)',
                  }}>
                  <span style={{ color: 'var(--accent-primary)' }}><feature.icon className="w-4.5 h-4.5" /></span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    background: feature.statusType === 'active' ? 'rgba(5, 150, 105, 0.1)' : 'rgba(91, 92, 246, 0.1)',
                    color: feature.statusType === 'active' ? 'var(--accent-trust)' : 'var(--accent-secondary)',
                  }}>
                  {feature.status}
                </span>
              </div>
              <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{feature.title}</h3>
              <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-tertiary)' }}>{feature.description}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {feature.tags.map(tag => (
                  <span key={tag} className="text-xs px-2 py-1 rounded-md"
                    style={{ background: 'rgba(0,0,0,0.03)', color: 'var(--text-tertiary)' }}>
                    {tag}
                  </span>
                ))}
              </div>
              <a href={feature.link} target={feature.link.startsWith('#') ? undefined : '_blank'} rel={feature.link.startsWith('#') ? undefined : 'noopener noreferrer'}
                className="inline-flex items-center gap-1 text-sm hover:gap-2 transition-all"
                style={{ color: 'var(--accent-primary)' }}>
                {feature.linkLabel} →
              </a>
            </motion.div>
          ))}
        </div>

        {/* Desktop: 径向布局 (≥1280px) */}
        <div className="hidden xl:block relative w-full max-w-[1400px] h-[1000px] mx-auto overflow-visible">
          <svg className="absolute inset-0 w-full h-full z-[1] pointer-events-none" viewBox="0 0 1400 1000" preserveAspectRatio="xMidYMid meet">
            <line x1="700" y1="500" x2="700" y2="100" className="connection-line" />
            <line x1="700" y1="500" x2="1060" y2="280" className="connection-line" />
            <line x1="700" y1="500" x2="1060" y2="720" className="connection-line" />
            <line x1="700" y1="500" x2="700" y2="900" className="connection-line" />
            <line x1="700" y1="500" x2="340" y2="720" className="connection-line" />
            <line x1="700" y1="500" x2="340" y2="280" className="connection-line" />
          </svg>

          {/* 中心节点 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
          >
            <div
              className="w-52 h-52 rounded-full flex flex-col items-center justify-center"
              style={{
                background: 'radial-gradient(circle, rgba(91, 92, 246, 0.1) 0%, rgba(91, 92, 246, 0.02) 100%)',
                border: '1.5px solid rgba(91, 92, 246, 0.25)',
                boxShadow: '0 0 32px rgba(91, 92, 246, 0.1)',
              }}
            >
              <BoltIcon className="w-10 h-10 mb-2" style={{ color: 'var(--accent-primary)' }} />
              <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{productName}</span>
              <span className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>合同全生命周期</span>
              <span className="mt-2 px-3 py-1 rounded-full text-xs"
                style={{ background: 'rgba(91, 92, 246, 0.06)', border: '1px solid rgba(91, 92, 246, 0.12)', color: 'var(--accent-primary)' }}>
                审批 + 签署 + 管理
              </span>
            </div>
          </motion.div>

          {/* 六个功能卡片 */}
          {displayFeatures.map((feature, index) => {
            const positions = [
              { top: 20, left: '50%', marginLeft: -150 },
              { top: 150, right: 60 },
              { bottom: 150, right: 60 },
              { bottom: 20, left: '50%', marginLeft: -150 },
              { bottom: 150, left: 60 },
              { top: 150, left: 60 },
            ]
            const pos = positions[index]

            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.06 }}
                className="absolute w-[300px] z-10 group"
                style={pos}
              >
                <div
                  className="p-6 rounded-2xl transition-all duration-300 group-hover:-translate-y-1 glass-card backdrop-blur-[16px]"
                  style={{
                    boxShadow: feature.variant === 'emphasized' ? 'var(--glow-brand)' : undefined,
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{
                        background: 'rgba(91, 92, 246, 0.07)',
                        border: '1px solid rgba(91, 92, 246, 0.12)',
                      }}>
                      <span style={{ color: 'var(--accent-primary)' }}><feature.icon className="w-4 h-4" /></span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{
                        background: feature.statusType === 'active' ? 'rgba(5, 150, 105, 0.1)' : 'rgba(91, 92, 246, 0.1)',
                        color: feature.statusType === 'active' ? 'var(--accent-trust)' : 'var(--accent-secondary)',
                      }}>
                      {feature.status}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>{feature.title}</h3>
                  <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-tertiary)' }}>{feature.description}</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {feature.tags.map(tag => (
                      <span key={tag} className="text-xs px-2 py-1 rounded-md"
                        style={{ background: 'rgba(0,0,0,0.03)', color: 'var(--text-tertiary)' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <a href={feature.link} target={feature.link.startsWith('#') ? undefined : '_blank'} rel={feature.link.startsWith('#') ? undefined : 'noopener noreferrer'}
                    className="inline-flex items-center gap-1 text-sm hover:gap-2 transition-all"
                    style={{ color: 'var(--accent-primary)' }}>
                    {feature.linkLabel} →
                  </a>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
