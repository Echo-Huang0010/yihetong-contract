'use client'

import { motion } from 'framer-motion'
import ParticleBackground from '@/components/effects/ParticleBackground'
import type { SiteConfig } from '@/lib/site-config'

export default function Hero({ config }: { config: SiteConfig }) {
  const platformLinks = [
    { label: '进入用户端', href: config.websiteUserUrl },
    { label: '打开 H5', href: config.websiteH5Url },
    { label: '管理后台', href: config.websiteManageUrl },
  ].filter((item) => Boolean(item.href))

  return (
    <section className="relative min-h-[calc(100dvh-3rem)] flex items-center justify-center overflow-hidden bg-[var(--bg-primary)]">
      <ParticleBackground />
      <div className="absolute inset-0 bg-grid-subtle" />

      <div className="relative w-full max-w-[1400px] mx-auto px-4 sm:px-10 lg:px-16 pt-24 pb-14 md:pt-28 md:pb-20">
        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="flex items-center gap-3 mb-8"
          >
            <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border bg-white shadow-sm" style={{ borderColor: 'var(--border-default)' }}>
              {config.logoIcon || config.logo ? (
                <img src={config.logoIcon || config.logo} alt="" className="h-full w-full object-contain" />
              ) : (
                <span className="text-sm font-bold" style={{ color: 'var(--accent-primary)' }}>{config.projectName.slice(0, 1)}</span>
              )}
            </span>
            <span className="text-sm tracking-widest uppercase" style={{ color: 'var(--text-tertiary)' }}>
              {config.subtitle}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08] max-w-[860px] mb-6"
          >
            <span className="text-gradient-brand text-glow-brand">{config.projectName}</span>
            <br />
            <span style={{ color: 'var(--text-primary)' }}>让签署更简单</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
            className="text-base md:text-xl leading-relaxed max-w-[680px] mb-8 md:mb-10"
            style={{ color: 'var(--text-secondary)' }}
          >
            {config.websiteSeoDescription}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25, ease: 'easeOut' }}
            className="flex flex-col sm:flex-row gap-4 mb-10"
          >
            <motion.a
              href={config.websiteCtaLink}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 md:px-8 py-3 md:py-3.5 rounded-lg font-semibold text-white text-center transition-all text-sm md:text-base"
              style={{
                background: 'var(--gradient-brand)',
                boxShadow: 'var(--glow-brand)',
              }}
            >
              {config.websiteCtaText}
            </motion.a>
            
          </motion.div>

          {platformLinks.length ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.32, ease: 'easeOut' }}
              className="flex flex-wrap justify-center gap-3 mb-10"
            >
              {platformLinks.map((link) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 rounded-lg text-sm font-semibold transition-all glass-card backdrop-blur-[16px]"
                  style={{
                    color: 'var(--text-secondary)',
                    border: '1px solid rgba(91, 92, 246, 0.14)',
                  }}
                >
                  {link.label} →
                </motion.a>
              ))}
            </motion.div>
          ) : null}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {['合同全流程协同', 'Web、H5 与小程序覆盖', '支持私有化部署'].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent-trust)' }} />
                {item}
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}


