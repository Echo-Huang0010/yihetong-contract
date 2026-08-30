'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import type { SiteConfig } from '@/lib/site-config'

const navLinks = [
  { label: '产品功能', href: '#features' },
  { label: '产品展示', href: '#showcase' },
  { label: '平台入口', href: '#platform-access' },
  { label: '版本对比', href: '#version-compare' },
  { label: '解决方案', href: '#industries' },
]

export default function Navbar({ config }: { config: SiteConfig }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const platformLinks = [
    { label: 'H5', href: config.websiteH5Url, external: true },
    { label: '用户端', href: config.websiteUserUrl, external: true },
    { label: '管理后台', href: config.websiteManageUrl, external: true },
    { label: '小程序', href: config.websiteMiniProgramQrCode ? '#platform-access' : '', external: false },
  ].filter((item) => Boolean(item.href))

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(250, 250, 248, 0.84)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--border-default)' : '1px solid transparent',
      }}
    >
      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16">
        <div className="flex items-center justify-between h-16 md:h-18">
          <a href="#" className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-md overflow-hidden flex items-center justify-center bg-white shadow-sm">
              {config.logoIcon || config.logo ? (
                <img src={config.logoIcon || config.logo} alt={config.projectName} className="w-full h-full object-contain" />
              ) : (
                <span className="text-sm font-bold" style={{ color: 'var(--accent-primary)' }}>{config.projectName.slice(0, 1)}</span>
              )}
            </span>
            <span className="text-base font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {config.projectName}
            </span>
          </a>

          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-3.5 py-2 text-sm rounded-md hover:bg-black/[0.04] transition-all"
                style={{ color: 'var(--text-secondary)' }}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-2">
            {platformLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target={link.external ? '_blank' : undefined}
                rel={link.external ? 'noopener noreferrer' : undefined}
                className="text-sm px-3 py-2 rounded-md hover:bg-black/[0.04] transition-all"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {link.label}
              </a>
            ))}
            
            <motion.a
              href={config.websiteCtaLink}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="ml-1 px-4 py-2 rounded-md text-sm font-semibold text-white transition-all"
              style={{
                background: 'var(--gradient-brand)',
                boxShadow: '0 1px 6px rgba(91, 92, 246, 0.25)',
              }}
            >
              {config.websiteCtaText}
            </motion.a>
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-md hover:bg-black/[0.04] transition-all"
            aria-label="菜单"
            style={{ color: 'var(--text-secondary)' }}
          >
            {mobileOpen ? <XMarkIcon className="w-5 h-5" /> : <Bars3Icon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="lg:hidden border-t"
            style={{
              background: 'rgba(250, 250, 248, 0.97)',
              backdropFilter: 'blur(20px)',
              borderColor: 'var(--border-default)',
            }}
          >
            <nav className="px-6 py-4 space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2.5 rounded-md text-sm transition-all"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-2 px-3 space-y-2">
                
                {platformLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target={link.external ? '_blank' : undefined}
                    rel={link.external ? 'noopener noreferrer' : undefined}
                    onClick={() => setMobileOpen(false)}
                    className="block text-sm"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {link.label} →
                  </a>
                ))}
                <a
                  href={config.websiteCtaLink}
                  onClick={() => setMobileOpen(false)}
                  className="block w-full text-center px-4 py-2.5 rounded-md text-sm font-semibold text-white transition-all"
                  style={{
                    background: 'var(--gradient-brand)',
                    boxShadow: '0 1px 6px rgba(91, 92, 246, 0.25)',
                  }}
                >
                  {config.websiteCtaText}
                </a>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}


