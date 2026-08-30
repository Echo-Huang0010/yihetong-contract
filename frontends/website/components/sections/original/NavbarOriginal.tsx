'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  ArrowRightIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import type { SiteConfig } from '@/lib/site-config'
import { resolvePublicHref } from '@/lib/public-site'

type NavbarOriginalConfig = Pick<
  SiteConfig,
  'projectName' | 'logo' | 'websiteCtaText' | 'websiteCtaLink' | 'websiteUserUrl'
>

const navItems = [
  { label: '产品能力', href: '#capabilities' },
  { label: '产品界面', href: '#product' },
  { label: '解决方案', href: '#solutions' },
  { label: '交付方式', href: '#delivery' },
]

export default function NavbarOriginal({ config }: { config: NavbarOriginalConfig }) {
  const [open, setOpen] = useState(false)
  const primaryHref = resolvePublicHref(config.websiteCtaLink, '#contact')
  const userHref = resolvePublicHref(config.websiteUserUrl, '')

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 sm:px-8 lg:px-0">
        <a href="#top" className="flex min-w-0 items-center gap-3" aria-label={`${config.projectName}首页`}>
          <Image
            src={config.logo}
            alt=""
            width={120}
            height={36}
            className="h-8 w-auto flex-none object-contain"
            priority
          />
          <span className="truncate text-base font-semibold text-slate-900 sm:text-lg">
            {config.projectName}
          </span>
        </a>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="主导航">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-slate-600 transition-colors duration-200 hover:text-[#1a5276]"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {userHref ? (
            <a
              href={userHref}
              className="px-2 py-2 text-sm font-medium text-slate-700 transition-colors duration-200 hover:text-[#1a5276]"
            >
              平台登录
            </a>
          ) : null}
          <a
            href={primaryHref}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-[#1a5276] px-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#154360]"
          >
            {config.websiteCtaText}
            <ArrowRightIcon className="h-4 w-4" />
          </a>
        </div>

        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-md text-slate-700 transition-colors hover:bg-slate-100 lg:hidden"
          aria-label={open ? '关闭导航' : '打开导航'}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
        </button>
      </div>

      {open ? (
        <nav className="border-t border-slate-200 bg-white px-4 py-3 lg:hidden" aria-label="移动端导航">
          <div className="mx-auto flex max-w-[1200px] flex-col">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="flex min-h-11 items-center border-b border-slate-100 text-sm font-medium text-slate-700"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ))}
            {userHref ? (
              <a
                href={userHref}
                className="flex min-h-11 items-center border-b border-slate-100 text-sm font-medium text-slate-700"
                onClick={() => setOpen(false)}
              >
                平台登录
              </a>
            ) : null}
            <a
              href={primaryHref}
              className="mt-3 flex h-12 items-center justify-center rounded-md bg-[#1a5276] text-sm font-semibold text-white"
              onClick={() => setOpen(false)}
            >
              {config.websiteCtaText}
            </a>
          </div>
        </nav>
      ) : null}
    </header>
  )
}
