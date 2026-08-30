'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  GitBranch,
  History,
  RotateCcw,
  ShieldCheck,
  Video,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { SiteConfig } from '@/lib/site-config'

const defaultFlow = [
  { title: '模板填写', desc: '企业用户填写模板控件和签署人信息。', icon: FileText },
  { title: 'PDF生成', desc: '合成合同 PDF，固化本次材料。', icon: FileText },
  { title: '视频材料', desc: '按模板规则采集签前视频。', icon: Video },
  { title: '提交审批', desc: '绑定审批流程后进入预发起审批。', icon: GitBranch },
  { title: '后台审批', desc: '审批人查看 PDF、视频和签署人。', icon: ShieldCheck },
  { title: '继续签署', desc: '审批通过后继续第三方签署对接。', icon: ArrowRight },
  { title: '状态回写', desc: '外部回调维护正式合同状态。', icon: History },
  { title: '归档/比对', desc: '归档合同文书，支持后续比对。', icon: CheckCircle2 },
]

const flowIcons = [FileText, FileText, Video, GitBranch, ShieldCheck, ArrowRight, History, CheckCircle2]

export default function ApprovalWorkflow({ config }: { config?: SiteConfig }) {
  const configuredFlow = (config?.websiteContent.approvalWorkflow || [])
    .filter((item) => item.title && item.description)
    .slice(0, 8)
  const flow = configuredFlow.length
    ? configuredFlow.map((item, index) => ({
        title: item.title,
        desc: item.description,
        icon: flowIcons[index % flowIcons.length],
      }))
    : defaultFlow

  return (
    <section id="approval-loop" className="relative overflow-hidden bg-[#fbfbf8] px-4 py-16 sm:px-8 md:py-24 lg:px-12">
      <div className="relative mx-auto max-w-[1440px]">
        <div className="mb-12 max-w-4xl">
          <p className="mb-4 text-sm font-semibold text-blue-700">预发起审批闭环</p>
          <h2 className="text-3xl font-bold leading-tight text-[var(--text-primary)] md:text-5xl">
            审批轨道先固化材料，再进入第三方签署终验
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--text-secondary)]">
            官网不把外部签署、认证、支付写成已自动验收。这里展示的是旗舰版可承载的业务闭环和终验边界。
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[420px_minmax(0,1fr)]">
          <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(21,22,41,0.10)]">
            <div className="border-b border-slate-100 p-5">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                <ShieldCheck className="h-4 w-4 text-emerald-700" />
                正式生效口径
              </div>
              <p className="text-sm leading-6 text-[var(--text-secondary)]">
                合同正式生效 = 预发起审批通过 + 第三方签署完成。
              </p>
            </div>
            <div className="relative p-5">
              <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-slate-50">
                <Image
                  src="/product-images/01-contract-doc.png"
                  alt="合同模板 PDF 材料"
                  width={720}
                  height={520}
                  className="h-[260px] w-full object-cover object-left-top"
                />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-emerald-50 p-4">
                  <div className="text-sm font-semibold text-emerald-800">材料复用</div>
                  <p className="mt-2 text-xs leading-5 text-emerald-900/70">通过审批后继续进入签署，不重复生成合同主件。</p>
                </div>
                <div className="rounded-2xl bg-blue-50 p-4">
                  <div className="text-sm font-semibold text-blue-800">状态独立</div>
                  <p className="mt-2 text-xs leading-5 text-blue-900/70">审批、签署和归档状态分别维护并回写。</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[28px] border border-white bg-[linear-gradient(135deg,#f3f7f8,#ffffff_44%,#eef7f3)] p-4 shadow-[0_24px_80px_rgba(21,22,41,0.09)] md:p-6">
            <div className="absolute bottom-0 left-10 top-0 hidden w-px bg-gradient-to-b from-transparent via-emerald-300 to-transparent md:block" />
            <ol className="grid gap-3 md:grid-cols-2">
              {flow.map((step, index) => {
                const Icon = step.icon
                return (
                  <motion.li
                    key={step.title}
                    whileHover={{ y: -3 }}
                    className="relative rounded-[22px] border border-white/90 bg-white/78 p-4 shadow-sm backdrop-blur"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-emerald-700">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="font-mono text-xs text-[var(--text-tertiary)]">{String(index + 1).padStart(2, '0')}</span>
                    </div>
                    <h3 className="text-base font-semibold text-[var(--text-primary)]">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{step.desc}</p>
                  </motion.li>
                )
              })}
            </ol>

            <div className="mt-4 grid gap-3 rounded-[24px] border border-amber-200 bg-amber-50/78 p-4 md:grid-cols-[220px_1fr] md:items-center">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                <RotateCcw className="h-4 w-4" />
                审批拒绝分支
              </div>
              <p className="text-sm leading-6 text-amber-900/76">
                拒绝后不进入第三方签署。用户修改内容、重新合成 PDF 或重新录制视频，再次提交审批。
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {['审批状态独立维护', '材料通过后复用', '签署完成才生效'].map((item) => (
                <Badge key={item} variant="outline" className="rounded-full border-emerald-100 bg-white/80 text-emerald-800">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
