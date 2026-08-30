'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { Building2, CheckCircle2, Code2, Handshake, Smartphone, UserRound } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { SiteConfig, WebsiteRoleScenario } from '@/lib/site-config'

const defaultRoles: (WebsiteRoleScenario & { image: string })[] = [
  {
    role: '管理员',
    title: '配置审批、角色、模板和交付参数',
    description: '管理后台承担审批角色组、审批工作树、模板配置、品牌配置和部署参数治理。',
    actions: ['配置审批流程和角色组', '维护合同模板与品牌', '查看审批待办与历史'],
    path: '管理后台路径',
    image: '/product-images/14-manage-brand-config.png',
  },
  {
    role: '企业用户',
    title: '从合同模板进入审批、签署和归档',
    description: '用户后台承接合同发起、文书、比对、审批状态和继续签署。',
    actions: ['填写合同模板', '查看审批状态', '审批通过后继续签署'],
    path: '用户后台路径',
    image: '/product-images/13-pc-contract-compare.png',
  },
  {
    role: '移动端用户',
    title: '在 H5/小程序完成移动发起与签署入口',
    description: '移动端关注模板入口、审批详情、未登录拦截、签署入口与多端状态一致。',
    actions: ['移动端模板入口', '审批状态展示', '签署入口与未登录拦截'],
    path: '移动端路径',
    image: '/product-images/12-h5-home.png',
  },
  {
    role: '开发部署',
    title: '把 API、配置和验收接入客户环境',
    description: '开发和交付人员负责 API、部署配置、品牌入口、验收脚本与未来快速集成路径。',
    actions: ['对接后端/API', '验证部署配置', '规划 CLI/MCP/Agent 集成'],
    path: '开发与部署路径',
    image: '/product-images/01-contract-doc.png',
  },
  {
    role: '渠道代理',
    title: '按客户合同成熟度选择交付版本',
    description: '渠道侧围绕标准版/旗舰版边界、第三方终验事项和交付清单组织客户沟通。',
    actions: ['识别客户流程成熟度', '选择标准版或旗舰版', '确认第三方终验事项'],
    path: '渠道交付路径',
    image: '/product-images/16-pc-contract-compare-device.jpg',
  },
]

const icons = [Building2, UserRound, Smartphone, Code2, Handshake]

const defaultTrustItems = [
  ['全链路验收清单', '模板、审批、签署、回写、归档和比对按清单验证。'],
  ['可部署验收', '品牌、入口、配置、环境和回归路径纳入交付边界。'],
  ['用户/第三方终验', '第三方签署、认证、支付保留外部服务和用户最终确认。'],
]

export default function RoleScenarios({ config }: { config?: SiteConfig }) {
  const configuredRoles = (config?.websiteContent.roleScenarios || [])
    .filter((item) => item.role && item.title && item.description)
    .slice(0, 5)
  const roles: (WebsiteRoleScenario & { image: string })[] = configuredRoles.length
    ? configuredRoles.map((item, index) => ({
        ...item,
        image: defaultRoles[index % defaultRoles.length].image,
      }))
    : defaultRoles
  const configuredTrustItems = (config?.websiteContent.deliveryTrust || [])
    .filter((item) => item.title && item.description)
    .slice(0, 3)
    .map((item) => [item.title, item.description] as const)
  const trustItems = configuredTrustItems.length ? configuredTrustItems : defaultTrustItems

  return (
    <section id="role-scenarios" className="relative overflow-hidden bg-[#fbfbf8] px-4 py-16 sm:px-8 md:py-24 lg:px-12">
      <div className="relative mx-auto max-w-[1440px]">
        <div className="mb-12 max-w-4xl">
          <p className="mb-4 text-sm font-semibold text-emerald-700">角色路径与交付可信度</p>
          <h2 className="text-3xl font-bold leading-tight text-[var(--text-primary)] md:text-5xl">
            不同角色不同入口，最终回到同一条合同闭环
          </h2>
        </div>

        <Tabs defaultValue={roles[0].role} className="rounded-[30px] border border-slate-200/80 bg-white/74 p-4 shadow-[0_28px_90px_rgba(21,22,41,0.08)] backdrop-blur-xl md:p-6">
          <TabsList className="mb-6 grid h-auto grid-cols-2 gap-2 rounded-[22px] bg-slate-100/80 p-2 md:grid-cols-5">
            {roles.map((role, index) => {
              const Icon = icons[index % icons.length]
              return (
                <TabsTrigger key={role.role} value={role.role} className="h-auto rounded-2xl px-3 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Icon className="mr-2 h-4 w-4" />
                  {role.role}
                </TabsTrigger>
              )
            })}
          </TabsList>

          {roles.map((role, index) => {
            const Icon = icons[index % icons.length]
            return (
              <TabsContent key={role.role} value={role.role} className="m-0 outline-none">
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.26 }}
                  className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_390px]"
                >
                  <div className="relative min-h-[320px] overflow-hidden rounded-[26px] border border-slate-200 bg-slate-50 md:min-h-[420px]">
                    <Image
                      src={role.image}
                      alt={role.title}
                      width={1040}
                      height={640}
                      loading={index === 0 ? 'eager' : 'lazy'}
                      className="h-[320px] w-full object-cover object-left-top md:h-full md:min-h-[420px]"
                    />
                    <div className="absolute inset-x-5 bottom-5 rounded-[22px] border border-white/80 bg-white/88 p-5 shadow-[0_18px_55px_rgba(21,22,41,0.14)] backdrop-blur">
                      <p className="text-sm font-semibold text-emerald-700">{role.path}</p>
                      <h3 className="mt-2 text-2xl font-bold leading-tight text-[var(--text-primary)]">{role.title}</h3>
                      <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">{role.description}</p>
                    </div>
                  </div>

                  <div className="rounded-[26px] border border-slate-200 bg-white p-6">
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h4 className="text-sm font-semibold text-[var(--text-primary)]">关键动作</h4>
                    <ul className="mt-5 space-y-4">
                      {(role.actions || []).map((action) => (
                        <li key={action} className="flex gap-3 text-sm leading-6 text-[var(--text-secondary)]">
                          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-emerald-600" />
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              </TabsContent>
            )
          })}
        </Tabs>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {trustItems.map(([title, desc]) => (
            <div key={title} className="rounded-[22px] border border-emerald-100 bg-emerald-50/55 p-5">
              <div className="text-base font-semibold text-[var(--text-primary)]">{title}</div>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
