'use client'

import { motion } from 'framer-motion'
import {
  Bot,
  Braces,
  Cable,
  FileJson2,
  GitCommitHorizontal,
  RadioTower,
  TerminalSquare,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const integrationLanes = [
  {
    value: 'api',
    title: 'API',
    label: '接口层',
    desc: '面向合同模板、审批实例、签署状态、回写与归档的标准接口层。',
    icon: Braces,
    chips: ['合同模板', '审批实例', '状态回写', '归档查询'],
    endpoint: 'contract.core',
  },
  {
    value: 'cli',
    title: 'CLI',
    label: '交付工具',
    desc: '面向交付、配置校验、环境巡检和部署验收的命令行路径。',
    icon: TerminalSquare,
    chips: ['配置检查', '部署校验', '验收清单', '回归脚本'],
    endpoint: 'delivery.check',
  },
  {
    value: 'mcp',
    title: 'MCP',
    label: '工具协议',
    desc: '为智能工作台、外部工具和企业知识系统预留协议化集成入口。',
    icon: Cable,
    chips: ['工具协议', '上下文接入', '能力发现', '权限边界'],
    endpoint: 'tool.context',
  },
  {
    value: 'agent',
    title: 'Agent',
    label: '协作流',
    desc: '围绕合同审查、审批提醒、材料核对和交付巡检扩展自动化协作。',
    icon: Bot,
    chips: ['合同审查', '审批提醒', '材料核验', '交付巡检'],
    endpoint: 'workflow.agent',
  },
]

const supportNodes = [
  { title: 'Webhook回调', desc: '第三方签署、认证、支付等外部状态接入保留终验边界。', icon: RadioTower },
  { title: 'SDK / 沙箱', desc: '开发者可先在低风险环境试接入，避免直接绑定生产配置。', icon: FileJson2 },
  { title: '开发者文档', desc: '把接口、CLI、MCP 与 Agent 能力收束为可维护手册。', icon: GitCommitHorizontal },
]

export default function RapidIntegration() {
  return (
    <section id="rapid-integration" className="relative overflow-hidden bg-[#f0f5f4] px-4 py-16 sm:px-8 md:py-24 lg:px-12">
      <div className="relative mx-auto max-w-[1440px]">
        <div className="mb-12 max-w-4xl">
          <p className="mb-4 text-sm font-semibold text-emerald-700">快速集成能力（规划/扩展路径）</p>
          <h2 className="text-3xl font-bold leading-tight text-[var(--text-primary)] md:text-5xl">
            从合同业务核心继续长出开发者路径
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--text-secondary)]">
            API、CLI、MCP 和 Agent 不抢当前旗舰版验收口径。官网表达为后续扩展能力，连接合同业务、部署配置和第三方终验。
          </p>
        </div>

        <Tabs defaultValue="api" className="grid gap-6 rounded-[30px] border border-white/80 bg-white/70 p-4 shadow-[0_28px_90px_rgba(21,22,41,0.09)] backdrop-blur-xl md:p-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <TabsList className="grid h-auto gap-2 rounded-[22px] bg-slate-100/78 p-2 sm:grid-cols-2 lg:grid-cols-1">
            {integrationLanes.map((lane) => {
              const Icon = lane.icon
              return (
                <TabsTrigger
                  key={lane.value}
                  value={lane.value}
                  className="h-auto justify-start rounded-2xl px-4 py-4 text-left data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <span className="mr-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-emerald-700 ring-1 ring-slate-200">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-base font-semibold">{lane.title}</span>
                    <span className="block text-xs text-[var(--text-tertiary)]">{lane.label}</span>
                  </span>
                </TabsTrigger>
              )
            })}
          </TabsList>

          {integrationLanes.map((lane) => {
            const Icon = lane.icon
            return (
              <TabsContent key={lane.value} value={lane.value} className="m-0 outline-none">
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.26 }}
                  className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]"
                >
                  <div className="relative overflow-hidden rounded-[26px] bg-[#111827] p-5 text-white shadow-[0_24px_70px_rgba(17,24,39,0.20)]">
                    <div className="mb-8 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                        <span className="text-sm font-semibold text-slate-200">integration route</span>
                      </div>
                      <span className="font-mono text-xs text-slate-500">{lane.endpoint}</span>
                    </div>

                    <div className="grid gap-4 md:grid-cols-[1fr_1.2fr] md:items-center">
                      <div>
                        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-emerald-300 ring-1 ring-white/10">
                          <Icon className="h-7 w-7" />
                        </div>
                        <h3 className="text-3xl font-bold leading-tight">{lane.title} {lane.label}</h3>
                        <p className="mt-4 text-base leading-8 text-slate-300">{lane.desc}</p>
                        <div className="mt-6 flex flex-wrap gap-2">
                          {lane.chips.map((chip) => (
                            <Badge key={chip} variant="outline" className="rounded-full border-white/[0.12] bg-white/[0.08] text-slate-100">
                              {chip}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        {[
                          ['contract.core', '模板、审批、签署状态'],
                          ['delivery.config', '品牌、部署、入口配置'],
                          ['external.final', '第三方对接与终验'],
                        ].map(([key, value]) => (
                          <div key={key} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                            <div className="font-mono text-sm text-emerald-200">{key}</div>
                            <div className="mt-2 text-sm text-slate-200">{value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    {supportNodes.map((node) => {
                      const SupportIcon = node.icon
                      return (
                        <article key={node.title} className="rounded-[22px] border border-slate-200 bg-white/82 p-5 shadow-sm">
                          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                            <SupportIcon className="h-5 w-5" />
                          </div>
                          <h3 className="text-base font-semibold text-[var(--text-primary)]">{node.title}</h3>
                          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{node.desc}</p>
                        </article>
                      )
                    })}
                    <Button asChild variant="outline" className="h-12 rounded-2xl bg-white/82">
                      <a href="#cta">讨论集成路线</a>
                    </Button>
                  </div>
                </motion.div>
              </TabsContent>
            )
          })}
        </Tabs>
      </div>
    </section>
  )
}
