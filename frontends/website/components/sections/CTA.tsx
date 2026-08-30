'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline'
import type { SiteConfig } from '@/lib/site-config'

const trustItems = ['业务场景沟通', '多端产品演示', '部署方案确认']

export default function CTA({ config }: { config: SiteConfig }) {
  const [showContact, setShowContact] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const primaryLink = config.websiteCtaLink.trim()
  const primaryIsContact = !primaryLink || primaryLink === '#cta' || primaryLink === '#contact'
  const hasContactDetails = Boolean(
    config.websiteContactEmail || config.telphone || config.weixin || config.address,
  )

  useEffect(() => {
    if (!showContact) return

    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowContact(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    dialogRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previousFocus?.focus()
    }
  }, [showContact])

  return (
    <section id="cta" className="relative overflow-hidden bg-[var(--bg-secondary)] px-4 py-20 sm:px-8 md:py-28 lg:px-16">
      <div className="absolute inset-0 bg-grid-subtle" />

      <div className="relative mx-auto max-w-[1180px]">
        <div
          className="flex flex-col gap-8 border-y py-10 md:flex-row md:items-center md:justify-between md:gap-12 md:py-12"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <div className="max-w-[720px]">
            <p className="text-sm font-semibold" style={{ color: 'var(--accent-primary)' }}>产品咨询与演示</p>
            <h2 className="mt-3 text-3xl font-bold leading-[1.2] md:text-4xl" style={{ color: 'var(--text-primary)' }}>
              先确认业务场景，再安排演示与试用
            </h2>
            <p className="mt-4 text-base leading-7" style={{ color: 'var(--text-secondary)' }}>
              {config.shareDesc || config.websiteSeoDescription}
            </p>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
              {trustItems.map((item) => (
                <span key={item} className="inline-flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <CheckCircleIcon className="h-5 w-5" style={{ color: 'var(--accent-trust)' }} />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row md:flex-col">
            {primaryIsContact ? (
              <button
                type="button"
                onClick={() => setShowContact(true)}
                className="inline-flex h-12 min-w-[160px] items-center justify-center rounded-md px-7 text-sm font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2"
                style={{ background: 'var(--accent-primary)' }}
              >
                {config.websiteCtaText}
              </button>
            ) : (
              <a
                href={primaryLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 min-w-[160px] items-center justify-center rounded-md px-7 text-sm font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2"
                style={{ background: 'var(--accent-primary)' }}
              >
                {config.websiteCtaText}
              </a>
            )}
            {!primaryIsContact ? (
              <button
                type="button"
                onClick={() => setShowContact(true)}
                className="inline-flex h-12 min-w-[160px] items-center justify-center rounded-md border bg-white px-7 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
                style={{ borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
              >
                联系销售
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showContact ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ background: 'rgba(23,23,43,0.64)', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowContact(false)}
          >
            <motion.div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="contact-dialog-title"
              tabIndex={-1}
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              onClick={(event) => event.stopPropagation()}
              className="relative w-full max-w-md rounded-lg border bg-white p-6 outline-none md:p-8"
              style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-elevated)' }}
            >
              <button
                type="button"
                onClick={() => setShowContact(false)}
                className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-md transition-colors hover:bg-black/[0.04]"
                style={{ color: 'var(--text-secondary)' }}
                aria-label="关闭"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
              <h3 id="contact-dialog-title" className="pr-12 text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>联系销售</h3>
              <p className="mt-2 text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>获取适合当前业务与部署环境的方案。</p>

              <dl className="mt-6 border-y" style={{ borderColor: 'var(--border-default)' }}>
                {config.websiteContactEmail ? (
                  <div className="flex items-center gap-4 py-4">
                    <dt className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>邮箱</dt>
                    <dd className="ml-auto min-w-0">
                      <a href={`mailto:${config.websiteContactEmail}`} className="break-all text-sm" style={{ color: 'var(--accent-primary)' }}>
                        {config.websiteContactEmail}
                      </a>
                    </dd>
                  </div>
                ) : null}
                {config.telphone ? (
                  <div className="flex items-center gap-4 border-t py-4" style={{ borderColor: 'var(--border-default)' }}>
                    <dt className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>电话</dt>
                    <dd className="ml-auto"><a href={`tel:${config.telphone}`} className="text-sm" style={{ color: 'var(--accent-primary)' }}>{config.telphone}</a></dd>
                  </div>
                ) : null}
                {config.weixin ? (
                  <div className="flex items-center gap-4 border-t py-4" style={{ borderColor: 'var(--border-default)' }}>
                    <dt className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>微信</dt>
                    <dd className="ml-auto text-sm" style={{ color: 'var(--text-secondary)' }}>{config.weixin}</dd>
                  </div>
                ) : null}
                {config.address ? (
                  <div className="flex items-start gap-4 border-t py-4" style={{ borderColor: 'var(--border-default)' }}>
                    <dt className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>地址</dt>
                    <dd className="ml-auto max-w-[260px] text-right text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>{config.address}</dd>
                  </div>
                ) : null}
                {config.websiteDemoUrl ? (
                  <div className="flex items-center gap-4 border-t py-4" style={{ borderColor: 'var(--border-default)' }}>
                    <dt className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>演示</dt>
                    <dd className="ml-auto">
                      <a href={config.websiteDemoUrl} target="_blank" rel="noopener noreferrer" className="text-sm" style={{ color: 'var(--accent-primary)' }}>
                        打开演示
                      </a>
                    </dd>
                  </div>
                ) : null}
                {!hasContactDetails && !config.websiteDemoUrl ? (
                  <div className="py-4 text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
                    联系方式尚未发布，请在管理后台完善官网联系信息。
                  </div>
                ) : null}
              </dl>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  )
}
