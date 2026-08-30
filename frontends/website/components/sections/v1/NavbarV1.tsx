'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { ArrowRight, Menu, X } from 'lucide-react'
import type { SiteConfig } from '@/lib/site-config'
import { resolvePublicHref } from '@/lib/public-site'

type NavbarV1Config = Pick<
  SiteConfig,
  'projectName' | 'logo' | 'websiteCtaLink' | 'websiteUserUrl' | 'websiteCtaText'
>

const navItems = [
  { label: '平台能力', href: '#platform' },
  { label: '管理后台', href: '#management' },
  { label: '产品界面', href: '#product' },
  { label: '版本与交付', href: '#versions' },
]

export default function NavbarV1({ config }: { config: NavbarV1Config }) {
  const [open, setOpen] = useState(false)
  const primaryHref = resolvePublicHref(config.websiteCtaLink, '#contact')
  const userHref = resolvePublicHref(config.websiteUserUrl, '')

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <header className="sticky top-0 z-50 border-b border-black/[0.07] bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="#top" className="flex min-w-0 items-center gap-3" aria-label={`${config.projectName}首页`}>
          <span className="flex h-9 w-9 flex-none items-center justify-center overflow-hidden rounded-md border border-black/[0.06] bg-white">
            <Image src={config.logo} alt="" width={36} height={36} className="h-full w-full object-contain" priority />
          </span>
          <span className="truncate text-base font-semibold text-[var(--text-primary)] sm:text-lg">{config.projectName}</span>
        </a>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="主导航">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className="inline-flex min-h-11 items-center text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-primary)]">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {userHref ? (
            <a href={userHref} className="inline-flex min-h-11 items-center px-3 text-sm font-medium text-[var(--text-primary)] transition-colors hover:text-[var(--accent-primary)]">
              进入用户端
            </a>
          ) : null}
          <a href={primaryHref} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[var(--accent-primary)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-primary-dark)]">
            {config.websiteCtaText}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>

        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-md text-[var(--text-primary)] transition-colors hover:bg-black/[0.04] lg:hidden"
          aria-label={open ? '关闭导航' : '打开导航'}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <nav id="mobile-navigation" className="fixed inset-x-0 top-16 h-[calc(100dvh-4rem)] border-t border-black/[0.07] bg-white px-4 py-4 lg:hidden" aria-label="移动端导航">
          <div className="mx-auto flex max-w-[1200px] flex-col">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className="flex min-h-12 items-center border-b border-black/[0.06] text-base text-[var(--text-primary)]" onClick={() => setOpen(false)}>
                {item.label}
              </a>
            ))}
            {userHref ? (
              <a href={userHref} className="flex min-h-12 items-center border-b border-black/[0.06] text-base text-[var(--text-primary)]" onClick={() => setOpen(false)}>
                进入用户端
              </a>
            ) : null}
            <a href={primaryHref} className="mt-5 flex h-12 items-center justify-center gap-2 rounded-md bg-[var(--accent-primary)] text-sm font-semibold text-white" onClick={() => setOpen(false)}>
              {config.websiteCtaText}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </nav>
      ) : null}
    </header>
  )
}
