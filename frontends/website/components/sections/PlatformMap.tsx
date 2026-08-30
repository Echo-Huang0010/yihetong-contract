'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import {
  Braces,
  Building2,
  FileSearch,
  Layers3,
  ServerCog,
  Smartphone,
  Workflow,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { SiteConfig } from '@/lib/site-config'

const defaultZones = [
  {
    title: '管理后台',
    owner: '运营和审批管理员',
    desc: '审批角色组、审批工作树、模板、品牌和部署配置归到同一个治理入口。',
    icon: Building2,
    tags: ['审批角色组', '审批工作树', '品牌配置'],
  },
  {
    title: '用户后台',
    owner: '企业合同业务人员',
    desc: '合同发起、文书、比对、审批状态和继续签署入口在业务侧闭合。',
    icon: FileSearch,
    tags: ['合同文书', '合同比对', '继续发起'],
  },
  {
    title: 'H5/小程序',
    owner: '移动端用户',
    desc: '移动模板填写、签署入口、未登录拦截和多端状态保持一致。',
    icon: Smartphone,
    tags: ['移动发起', '签署入口', '状态一致'],
  },
  {
    title: '后端/API',
    owner: '开发与集成团队',
    desc: '审批实例、状态回写、去重规则、数据一致性和外部接口承载。',
    icon: ServerCog,
    tags: ['状态回写', '签署方去重', '数据一致性'],
  },
  {
    title: '部署配置',
    owner: '交付与运维',
    desc: '品牌、入口、私有化部署参数和终验清单按配置驱动。',
    icon: Layers3,
    tags: ['私有化部署', '认证防重复', '历史回归'],
  },
]

const zoneIcons = [Building2, FileSearch, Smartphone, ServerCog, Layers3]
const defaultCapabilityTags = ['模板PDF', '合同文书', '合同比对', '签署方去重', '认证赠送防重复', 'H5/小程序一致性', '品牌部署配置']

export default function PlatformMap({ config }: { config?: SiteConfig }) {
  const configuredZones = (config?.websiteContent.platformCapabilities || [])
    .filter((item) => item.title && item.owner && item.description)
    .slice(0, 5)
  const zones = configuredZones.length
    ? configuredZones.map((item, index) => ({
        title: item.title,
        owner: item.owner,
        desc: item.description,
        icon: zoneIcons[index % zoneIcons.length],
        tags: (item.tags || []).filter(Boolean).slice(0, 4),
      }))
    : defaultZones
  const configuredCapabilityTags = (config?.websiteContent.capabilityMatrix || [])
    .map((item) => item.title)
    .filter(Boolean)
    .slice(0, 8)
  const capabilityTags = configuredCapabilityTags.length ? configuredCapabilityTags : defaultCapabilityTags

  return (
    <section id="platform-map" className="relative overflow-hidden bg-[#f6faf8] px-4 py-16 sm:px-8 md:py-24 lg:px-12">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-200 to-transparent" />
      <div className="relative mx-auto max-w-[1440px]">
        <div className="mb-10 max-w-3xl">
          <p className="mb-4 text-sm font-semibold text-emerald-700">全平台能力地图</p>
          <h2 className="text-3xl font-bold leading-tight text-[var(--text-primary)] md:text-5xl">
            把合同业务拆成入口、材料、审批和回写四层
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--text-secondary)]">
            旗舰版不是功能清单扩容，而是把管理后台、用户后台、移动端、后端接口和部署配置放进同一张系统图。
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.18fr)_420px] lg:items-stretch">
          <div className="relative min-h-[620px] overflow-hidden rounded-[28px] border border-emerald-100/80 bg-white shadow-[0_28px_90px_rgba(20,78,67,0.10)]">
            <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(31,138,112,0.08),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.92),rgba(243,248,246,0.76))]" />
            <div className="absolute left-6 right-6 top-6 flex items-center justify-between rounded-2xl border border-slate-200/70 bg-white/82 px-4 py-3 text-sm backdrop-blur">
              <div className="flex items-center gap-2 font-semibold text-[var(--text-primary)]">
                <Workflow className="h-4 w-4 text-emerald-700" />
                合同业务中台
              </div>
              <span className="text-xs text-[var(--text-tertiary)]">template · approval · signing · archive</span>
            </div>

            <div className="absolute left-6 top-24 w-[72%] overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(21,22,41,0.12)] md:left-10 md:top-28">
              <Image
                src="/product-images/14-manage-brand-config.png"
                alt="管理后台能力预览"
                width={1120}
                height={640}
                className="h-[320px] w-full object-cover object-left-top md:h-[410px]"
                priority
              />
            </div>

            <motion.div
              whileHover={{ y: -6, rotate: 0 }}
              className="absolute right-5 top-28 w-[34%] min-w-[170px] overflow-hidden rounded-[22px] border border-white bg-white shadow-[0_24px_70px_rgba(21,22,41,0.16)] md:right-10"
            >
              <Image
                src="/product-images/12-h5-home.png"
                alt="H5/小程序签署入口"
                width={420}
                height={620}
                className="h-[280px] w-full object-cover object-top"
              />
            </motion.div>

            <motion.div
              whileHover={{ y: -6 }}
              className="absolute bottom-24 left-8 w-[46%] overflow-hidden rounded-[22px] border border-white bg-white shadow-[0_20px_56px_rgba(21,22,41,0.13)] md:left-12"
            >
              <Image
                src="/product-images/01-contract-doc.png"
                alt="合同文书与模板 PDF"
                width={720}
                height={460}
                className="h-[190px] w-full object-cover object-left-top"
              />
            </motion.div>

            <div className="absolute bottom-6 left-6 right-6 rounded-[24px] border border-emerald-100 bg-white/86 p-4 shadow-sm backdrop-blur">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                <Braces className="h-4 w-4 text-emerald-700" />
                能力挂接到业务链，不做孤立功能展示
              </div>
              <div className="flex flex-wrap gap-2">
                {capabilityTags.map((tag) => (
                  <Badge key={tag} variant="outline" className="rounded-full border-emerald-100 bg-emerald-50/70 text-emerald-800">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200/80 bg-white/78 p-5 shadow-[0_18px_60px_rgba(21,22,41,0.08)] backdrop-blur">
            <div className="space-y-2">
              {zones.map((zone, index) => {
                const Icon = zone.icon
                return (
                  <motion.article
                    key={zone.title}
                    whileHover={{ x: 4 }}
                    className="group rounded-2xl px-4 py-4 transition-colors hover:bg-emerald-50/70"
                  >
                    <div className="flex gap-4">
                      <span className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-slate-100 text-emerald-700 transition-colors group-hover:bg-white">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-[var(--text-primary)]">{zone.title}</h3>
                          <span className="font-mono text-xs text-[var(--text-tertiary)]">{String(index + 1).padStart(2, '0')}</span>
                        </div>
                        <p className="mt-1 text-sm font-medium text-emerald-700">{zone.owner}</p>
                        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{zone.desc}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {zone.tags.map((tag) => (
                            <span key={tag} className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm ring-1 ring-slate-200">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.article>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
