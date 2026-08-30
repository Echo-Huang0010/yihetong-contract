'use client'

import { motion } from 'framer-motion'
import CountUpNumber from '@/components/animations/CountUpNumber'
import { useRef } from 'react'
import { useInView } from '@/hooks/useInView'
import type { SiteConfig, WebsiteDataPoint } from '@/lib/site-config'

function normalizeDataPoint(point: WebsiteDataPoint): WebsiteDataPoint | null {
  if (!point || typeof point.value !== 'number' || !Number.isFinite(point.value) || point.value <= 0 || !point.label) {
    return null
  }
  return {
    value: point.value,
    prefix: point.prefix || '',
    suffix: point.suffix || '',
    label: point.label,
    description: point.description || '',
  }
}

function resolveDataPoints(config?: SiteConfig) {
  return (config?.websiteContent?.dataPoints || [])
    ?.map(normalizeDataPoint)
    .filter((item): item is WebsiteDataPoint => Boolean(item))
}

export default function DataShowcase({ config }: { config?: SiteConfig }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { threshold: 0.1 })
  const dataPoints = resolveDataPoints(config)

  if (!dataPoints.length) return null

  return (
    <section className="relative py-16 md:py-32 px-4 sm:px-10 lg:px-16 bg-[var(--bg-secondary)] overflow-hidden">
      <div className="absolute inset-0 bg-grid-subtle" />

      {/* 蓝色光晕 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[180px] opacity-[0.04] pointer-events-none"
        style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)' }} />

      <div className="relative max-w-[1400px] mx-auto" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-10 md:mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-3 md:mb-4" style={{ color: 'var(--text-primary)' }}>
            数据说话
          </h2>
          <p className="text-sm md:text-lg" style={{ color: 'var(--text-secondary)' }}>
            用数字证明我们的实力和可靠性
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          {dataPoints.map((data, index) => (
            <motion.div
              key={data.label}
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1, ease: 'easeOut' }}
              className="group"
            >
              <div className="relative glass-card backdrop-blur-[16px] p-5 sm:p-10 text-center h-full rounded-2xl transition-all duration-500 hover:-translate-y-1.5 overflow-hidden"
                style={{ boxShadow: 'var(--glow-card-hover)' }}>
                {/* Hover 光晕 */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: 'var(--gradient-subtle)' }}
                />
                {/* 流动光线 */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-shimmer"
                  style={{
                    background: 'linear-gradient(135deg, transparent 0%, rgba(91,92,246,0.04) 50%, transparent 100%)',
                    backgroundSize: '200% 200%',
                  }}
                />
                <div className="relative space-y-3 md:space-y-5">
                  {/* 数字光环 */}
                  <div className="relative inline-flex items-center justify-center">
                    <svg className="absolute w-20 h-20 md:w-24 md:h-24 opacity-30 group-hover:opacity-60 transition-opacity duration-500" viewBox="0 0 100 100">
                      <circle
                        cx="50" cy="50" r="42"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                        strokeDasharray="8 4"
                        className="animate-spin-slow"
                        style={{ color: 'var(--accent-primary)', transformOrigin: 'center' }}
                      />
                    </svg>
                    <div className="relative text-4xl md:text-5xl font-bold tabular-nums text-glow-brand" style={{ color: 'var(--accent-primary)' }}>
                      {data.prefix}
                      <CountUpNumber end={data.value} duration={1200} />
                      {data.suffix}
                    </div>
                  </div>
                  <div className="text-lg md:text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{data.label}</div>
                  <div className="text-xs md:text-sm" style={{ color: 'var(--text-tertiary)' }}>{data.description}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
