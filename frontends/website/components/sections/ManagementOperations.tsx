'use client'

import { motion } from 'framer-motion'
import {
  BanknotesIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  DocumentCheckIcon,
  MegaphoneIcon,
  Squares2X2Icon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'
import type {
  SiteConfig,
  WebsiteCapabilityMatrixItem,
  WebsitePlatformCapability,
} from '@/lib/site-config'

const defaultPlatforms: WebsitePlatformCapability[] = [
  { title: '管理后台', owner: '运营与平台管理员', description: '集中管理运营概览、客户账号、合同模板、审批流程、交易财务、内容服务、品牌和部署配置。' },
  { title: '用户后台', owner: '企业业务人员', description: '承接合同发起、文书处理、智能生成与审查、合同比对、审批和签署入口。' },
  { title: 'H5 与小程序', owner: '移动端用户', description: '覆盖登录、模板选择、合同管理、审批详情、签署操作和服务查看。' },
  { title: '服务端与开放接口', owner: '实施与集成团队', description: '连接身份核验、签署服务、模型服务、支付能力及企业既有系统。' },
]

const defaultMatrix: WebsiteCapabilityMatrixItem[] = [
  { group: '运营概览', title: '核心业务数据概览', description: '集中查看客户、合同、交易和服务等核心业务数据。' },
  { group: '运营概览', title: '关键指标与运行趋势', description: '按业务维度观察运营变化，辅助平台日常管理。' },
  { group: '客户与账号', title: '个人、企业与平台账号', description: '维护客户主体、企业资料、平台用户和账号状态。' },
  { group: '客户与账号', title: '角色、权限与审批角色', description: '分配后台菜单和操作权限，管理审批角色与成员范围。' },
  { group: '合同与模板', title: '合同列表、模板与文书', description: '统一管理合同记录、模板分类、PDF 材料和在线文书。' },
  { group: '合同与模板', title: '审批流程、待办与签署规则', description: '配置签署前审批，查看待办、节点结果和签署材料规则。' },
  { group: '交易与财务', title: '采购、销售与消费记录', description: '查看采购订单、销售订单和平台消费流水。' },
  { group: '交易与财务', title: '财务、价格与代理管理', description: '管理财务信息、版本定价和代理业务关系。' },
  { group: '内容与服务', title: '文档、资讯与内容发布', description: '维护平台文档、资讯分类和公开展示内容。' },
  { group: '内容与服务', title: '服务类型与服务申请', description: '管理企业服务类型、申请记录和处理详情。' },
  { group: '系统配置', title: '品牌与多端入口配置', description: '统一配置名称、标识、官网内容、访问入口和联系方式。' },
  { group: '系统配置', title: '部署与第三方能力配置', description: '维护签署、认证、模型、支付和运行环境所需配置。' },
]

const groupMeta = {
  '运营概览': { summary: '数据概况、指标与趋势', icon: ChartBarIcon },
  '客户与账号': { summary: '主体、账号、角色与权限', icon: UserGroupIcon },
  '合同与模板': { summary: '合同、模板、审批与签署', icon: DocumentCheckIcon },
  '交易与财务': { summary: '订单、消费、财务与代理', icon: BanknotesIcon },
  '内容与服务': { summary: '文档、资讯、服务与申请', icon: MegaphoneIcon },
  '系统配置': { summary: '品牌、入口、部署与第三方', icon: Cog6ToothIcon },
}

const fallbackGroupMeta = { summary: '管理后台业务能力', icon: Cog6ToothIcon }

function resolvePlatforms(config?: SiteConfig) {
  const configured = config?.websiteContent.platformCapabilities
    ?.filter((item): item is WebsitePlatformCapability => Boolean(item?.title && item.owner && item.description))
    .slice(0, 4)
  return configured?.length ? configured : defaultPlatforms
}

function resolveMatrix(config?: SiteConfig) {
  const configured = config?.websiteContent.capabilityMatrix
    ?.filter((item): item is WebsiteCapabilityMatrixItem => Boolean(item?.group && item.title && item.description))
  return configured?.length ? configured : defaultMatrix
}

export default function ManagementOperations({ config }: { config?: SiteConfig }) {
  const platforms = resolvePlatforms(config)
  const matrix = resolveMatrix(config)
  const capabilityGroups = Array.from(new Set(matrix.map((item) => item.group))).map((group) => ({
    group,
    items: matrix.filter((item) => item.group === group),
  }))

  return (
    <section id="operations" className="relative overflow-hidden bg-[var(--bg-secondary)] px-4 py-14 sm:px-10 md:py-20 lg:px-16">
      <div className="mx-auto max-w-[1400px]">
        <motion.div initial={false} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-[920px]">
          <p className="yht-section-kicker mb-4" style={{ color: 'var(--accent-trust)' }}>管理后台</p>
          <h2 className="yht-section-title">合同、审批、权限与交付配置集中在一个后台</h2>
          <p className="yht-section-copy mt-5 max-w-[840px]">
            管理后台覆盖组织账号、角色权限、合同流程、内容运营、交易服务和部署配置，业务人员在用户后台与移动端继续完成具体合同操作。
          </p>
        </motion.div>

        <div className="mt-10 md:mt-14" data-testid="management-capability-map">
          <div className="flex flex-col gap-2 pb-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="yht-section-kicker">管理后台主要功能</p>
              <h3 className="yht-subsection-title mt-2">六个后台分区，十二项核心能力</h3>
            </div>
            <p className="yht-meta-copy">所有功能直接展开，无需切换标签查看</p>
          </div>

          <div className="border-y" style={{ borderColor: 'var(--border-default)' }}>
            {capabilityGroups.map((capabilityGroup, groupIndex) => {
              const meta = groupMeta[capabilityGroup.group as keyof typeof groupMeta] || fallbackGroupMeta
              const Icon = meta.icon
              return (
                <motion.section
                  key={capabilityGroup.group}
                  initial={false}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: groupIndex * 0.035 }}
                  className="grid border-b last:border-b-0 md:grid-cols-[220px_1fr]"
                  style={{ borderColor: 'var(--border-default)' }}
                >
                  <div className="border-b px-3 py-4 sm:px-4 sm:py-5 md:border-b-0 md:border-r md:px-6 md:py-6" style={{ borderColor: 'var(--border-default)' }}>
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-md border bg-white" style={{ borderColor: 'var(--border-default)', color: 'var(--accent-primary)' }}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <h4 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{capabilityGroup.group}</h4>
                    </div>
                    <p className="mt-2 text-sm leading-6 sm:mt-3" style={{ color: 'var(--text-secondary)' }}>{meta.summary}</p>
                  </div>

                  <div className={`grid grid-cols-2 ${capabilityGroup.items.length === 1 ? 'md:grid-cols-1' : capabilityGroup.items.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
                    {capabilityGroup.items.map((item, itemIndex) => {
                      const itemCount = capabilityGroup.items.length
                      const mobileLastRowStart = itemCount - (itemCount % 2 === 0 ? 2 : 1)
                      const mobileLastItemSpans = itemCount % 2 === 1 && itemIndex === itemCount - 1
                      return (
                        <article
                          key={item.title}
                          className={`min-w-0 px-3 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6 ${itemIndex < mobileLastRowStart ? 'border-b md:border-b-0' : ''} ${itemIndex % 2 === 1 ? 'border-l md:border-l-0' : ''} ${itemIndex > 0 ? 'md:border-l' : ''} ${mobileLastItemSpans ? 'col-span-2 md:col-span-1' : ''}`}
                          style={{ borderColor: 'var(--border-default)' }}
                        >
                          <h5 className="text-base font-semibold md:text-lg" style={{ color: 'var(--text-primary)' }}>{item.title}</h5>
                          <p className="mt-2 hidden text-sm leading-6 sm:block" style={{ color: 'var(--text-secondary)' }}>{item.description}</p>
                        </article>
                      )
                    })}
                  </div>
                </motion.section>
              )
            })}
          </div>
        </div>

        <div className="mt-12 lg:mt-14">
          <div className="flex items-end justify-between gap-6 border-b pb-5" style={{ borderColor: 'var(--border-default)' }}>
            <div>
              <p className="yht-section-kicker">多端分工</p>
              <h3 className="mt-2 text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>后台负责治理，各端负责执行</h3>
            </div>
            <Squares2X2Icon className="hidden h-5 w-5 sm:block" style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <ol className="mt-5 grid border-l border-t sm:grid-cols-2 lg:grid-cols-4" style={{ borderColor: 'var(--border-default)' }}>
            {platforms.map((platform, index) => (
              <motion.li
                key={platform.title}
                initial={false}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.04 }}
                className="min-w-0 border-b border-r px-4 py-5 sm:px-5 md:py-6"
                style={{ borderColor: 'var(--border-default)' }}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold" style={{ color: 'var(--accent-trust)' }}>{String(index + 1).padStart(2, '0')}</span>
                  <span className="text-right text-sm" style={{ color: 'var(--text-tertiary)' }}>{platform.owner}</span>
                </div>
                <h4 className="mt-5 text-base font-semibold md:text-lg" style={{ color: 'var(--text-primary)' }}>{platform.title}</h4>
                <p className="mt-2 text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>{platform.description}</p>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
