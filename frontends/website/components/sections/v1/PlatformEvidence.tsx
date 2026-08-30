'use client'

import Image from 'next/image'
import { ExternalLink, Monitor, Smartphone } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { WebsiteShowcaseImage } from '@/lib/site-config'

interface PlatformEvidenceProps {
  web: WebsiteShowcaseImage
  mobile: WebsiteShowcaseImage
}

const evidenceCopy = {
  web: {
    label: '用户后台',
    title: '复杂合同任务在电脑端集中处理',
    description: '合同模板、合同文书、文件合同、合同审查和合同比对在同一业务入口内衔接。',
    points: ['合同管理与签署入口', '合同生成、审查与比对', '模板、文书与文件合同'],
  },
  mobile: {
    label: 'H5 / 小程序',
    title: '移动端承接查看、审批与签署',
    description: '移动入口共享合同与流程状态，适合审批人和签署人在碎片化场景中快速处理。',
    points: ['合同与审批待办', '移动签署入口', 'H5 与小程序同源'],
  },
}

function EvidenceDetails({ type }: { type: 'web' | 'mobile' }) {
  const copy = evidenceCopy[type]
  return (
    <div className="border-t border-black/[0.08] pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
      <p className="text-sm font-semibold text-[var(--accent-primary)]">{copy.label}</p>
      <h3 className="mt-3 text-2xl font-semibold leading-tight text-[var(--text-primary)]">{copy.title}</h3>
      <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">{copy.description}</p>
      <ul className="mt-6 divide-y divide-black/[0.07] border-y border-black/[0.07] text-sm text-[var(--text-primary)]">
        {copy.points.map((point) => <li key={point} className="py-3">{point}</li>)}
      </ul>
    </div>
  )
}

export default function PlatformEvidence({ web, mobile }: PlatformEvidenceProps) {
  return (
    <Tabs defaultValue="web" className="flex-col gap-7">
      <TabsList className="grid h-12 w-full max-w-[360px] grid-cols-2 rounded-md border border-black/[0.08] bg-white p-1" aria-label="产品界面切换">
        <TabsTrigger value="web" className="h-10 rounded-sm px-4 text-sm text-[var(--text-secondary)] data-active:bg-[var(--accent-soft)] data-active:text-[var(--accent-primary)]">
          <Monitor className="h-4 w-4" aria-hidden="true" />用户后台
        </TabsTrigger>
        <TabsTrigger value="mobile" className="h-10 rounded-sm px-4 text-sm text-[var(--text-secondary)] data-active:bg-[var(--accent-soft)] data-active:text-[var(--accent-primary)]">
          <Smartphone className="h-4 w-4" aria-hidden="true" />H5 / 小程序
        </TabsTrigger>
      </TabsList>

      <TabsContent value="web">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
          <figure>
            <a href={web.src} target="_blank" rel="noreferrer" className="group block overflow-hidden rounded-md border border-black/[0.09] bg-white p-2 shadow-[var(--shadow-elevated)]" aria-label={`查看${web.alt}原图`}>
              <Image src={web.src} alt={web.alt} width={1032} height={650} className="h-auto w-full rounded-sm" />
            </a>
            <figcaption className="mt-3 flex items-center justify-between gap-4 text-sm text-[var(--text-tertiary)]">
              <span>{web.alt}</span><ExternalLink className="h-4 w-4 flex-none" aria-hidden="true" />
            </figcaption>
          </figure>
          <EvidenceDetails type="web" />
        </div>
      </TabsContent>

      <TabsContent value="mobile">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
          <figure className="flex flex-col items-center lg:items-start">
            <a href={mobile.src} target="_blank" rel="noreferrer" className="group block w-full max-w-[340px] overflow-hidden rounded-md border border-black/[0.09] bg-white p-2 shadow-[var(--shadow-elevated)]" aria-label={`查看${mobile.alt}原图`}>
              <Image src={mobile.src} alt={mobile.alt} width={390} height={844} className="h-auto w-full rounded-sm" unoptimized />
            </a>
            <figcaption className="mt-3 flex w-full max-w-[340px] items-center justify-between gap-4 text-sm text-[var(--text-tertiary)]">
              <span>{mobile.alt}</span><ExternalLink className="h-4 w-4 flex-none" aria-hidden="true" />
            </figcaption>
          </figure>
          <EvidenceDetails type="mobile" />
        </div>
      </TabsContent>
    </Tabs>
  )
}
