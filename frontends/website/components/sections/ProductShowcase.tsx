'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  MagnifyingGlassPlusIcon,
  PhotoIcon,
  ServerIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import type { SiteConfig, WebsiteShowcaseImage } from '@/lib/site-config'
import SectionHeading from '@/components/sections/SectionHeading'

type Category = 'mobile' | 'web' | 'admin'

interface ShowcaseImage {
  src: string
  alt: string
  category: Category
  span?: 'tall' | 'wide'
}

const legacyShowcaseSources = new Set([
  '/product-images/09-pc-compare-current.png',
  '/product-images/10-h5-home-current.png',
  '/product-images/12-h5-home.png',
  '/product-images/13-pc-contract-compare.png',
  '/product-images/14-manage-brand-config.png',
  '/product-images/15-h5-home-device.jpg',
  '/product-images/16-pc-contract-compare-device.jpg',
])

function isLegacyShowcaseSource(src: string) {
  const normalized = src.trim().replace(/\\/g, '/').toLowerCase()
  return Array.from(legacyShowcaseSources).some((legacy) => normalized.endsWith(legacy.toLowerCase()))
}

const categories: {
  key: Category
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}[] = [
  {
    key: 'mobile',
    label: '移动端',
    description: '在 H5 与小程序端承接合同办理、审批和状态查询。',
    icon: DevicePhoneMobileIcon,
  },
  {
    key: 'web',
    label: 'Web 端',
    description: '在用户后台集中处理合同签署、智能合同与合同比对。',
    icon: ComputerDesktopIcon,
  },
  {
    key: 'admin',
    label: '管理后台',
    description: '统一配置权限、审批、内容运营和品牌部署参数。',
    icon: ServerIcon,
  },
]

function normalizeShowcaseImage(image: WebsiteShowcaseImage): ShowcaseImage | null {
  if (!image?.src || !image.alt || !['mobile', 'web', 'admin'].includes(image.category)) return null
  if (isLegacyShowcaseSource(image.src)) return null

  return {
    src: image.src,
    alt: image.alt,
    category: image.category,
    span: image.span === 'tall' || image.span === 'wide' ? image.span : undefined,
  }
}

function resolveImages(config?: SiteConfig) {
  const configured = config?.websiteContent?.productImages
    ?.map(normalizeShowcaseImage)
    .filter((item): item is ShowcaseImage => Boolean(item))

  return configured || []
}

export default function ProductShowcase({ config }: { config?: SiteConfig }) {
  const [activeCategory, setActiveCategory] = useState<Category>('mobile')
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [lightbox, setLightbox] = useState<ShowcaseImage | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const displayImages = useMemo(() => resolveImages(config), [config])
  const availableCategories = useMemo(
    () => categories.filter((category) => displayImages.some((image) => image.category === category.key)),
    [displayImages],
  )
  const resolvedActiveCategory = availableCategories.some((category) => category.key === activeCategory)
    ? activeCategory
    : availableCategories[0]?.key || 'mobile'
  const filteredImages = useMemo(
    () => displayImages.filter((image) => image.category === resolvedActiveCategory),
    [displayImages, resolvedActiveCategory],
  )
  const selectedImage = filteredImages[Math.min(activeImageIndex, Math.max(filteredImages.length - 1, 0))]
  const selectedCategory = categories.find((category) => category.key === resolvedActiveCategory) || categories[0]

  useEffect(() => {
    if (!lightbox) return

    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightbox(null)
    }

    document.addEventListener('keydown', handleKeyDown)
    dialogRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previousFocus?.focus()
    }
  }, [lightbox])

  return (
    <section id="showcase" className="relative overflow-hidden bg-[var(--bg-primary)] px-4 py-20 sm:px-8 md:py-28 lg:px-16">
      <div className="absolute inset-0 bg-grid-subtle" />

      <div className="relative mx-auto max-w-[1180px]">
        <SectionHeading
          title="产品展示"
          description="查看移动端、用户后台和管理后台的真实产品界面"
        />

        {displayImages.length ? (
        <div className="overflow-hidden rounded-lg border bg-white" style={{ borderColor: 'var(--border-default)' }}>
          <div
            className="flex justify-center border-b px-4 py-3 md:px-6 md:py-4"
            style={{ borderColor: 'var(--border-default)', background: 'rgba(247,247,252,0.72)' }}
          >
            <div className="inline-flex rounded-lg border bg-white p-1" style={{ borderColor: 'var(--border-default)' }}>
            {availableCategories.map((category) => {
              const active = category.key === resolvedActiveCategory
              return (
                <button
                  key={category.key}
                  type="button"
                  onClick={() => {
                    setActiveCategory(category.key)
                    setActiveImageIndex(0)
                  }}
                  aria-pressed={active}
                  className="flex min-h-11 items-center gap-2 rounded-md px-4 text-sm font-medium transition-colors md:px-5"
                  style={{
                    background: active ? 'rgba(91,92,246,0.09)' : 'transparent',
                    color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  }}
                >
                  <category.icon className="h-4 w-4" />
                  {category.label}
                </button>
              )
            })}
            </div>
          </div>

          {selectedImage ? (
          <div className="grid lg:grid-cols-[300px_minmax(0,1fr)]">
            <div className="p-6 md:p-8 lg:border-r" style={{ borderColor: 'var(--border-default)' }}>
              <div className="mb-5 flex items-center gap-3">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-md"
                  style={{ background: 'rgba(91,92,246,0.055)', border: '1px solid rgba(91,92,246,0.14)', color: 'var(--accent-primary)' }}
                >
                  <selectedCategory.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{selectedCategory.label}</p>
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedImage.alt}</h3>
                </div>
              </div>

              <p className="mb-6 text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>
                {selectedCategory.description}
              </p>

              {filteredImages.length > 1 ? (
                <div className="mb-6 flex flex-wrap gap-2">
                  {filteredImages.map((image, index) => (
                    <button
                      key={image.src}
                      type="button"
                      onClick={() => setActiveImageIndex(index)}
                      className="min-h-11 rounded-md border px-3 text-xs"
                      style={{
                        borderColor: index === activeImageIndex ? 'rgba(91,92,246,0.36)' : 'var(--border-default)',
                        color: index === activeImageIndex ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                      }}
                    >
                      界面 {index + 1}
                    </button>
                  ))}
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => setLightbox(selectedImage)}
                className="inline-flex min-h-11 items-center gap-2 rounded-md px-1 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
                style={{ color: 'var(--accent-primary)' }}
              >
                <MagnifyingGlassPlusIcon className="h-5 w-5" />
                查看完整界面
              </button>
            </div>

            <div
              className="flex min-h-[360px] items-center justify-center border-t p-5 sm:p-8 md:min-h-[440px] lg:min-h-[520px] lg:border-t-0"
              style={{ borderColor: 'var(--border-default)', background: 'rgba(247,247,252,0.72)' }}
            >
              <button
                type="button"
                onClick={() => setLightbox(selectedImage)}
                aria-label={`放大查看${selectedImage.alt}`}
                className="flex max-h-[500px] max-w-full items-center justify-center overflow-hidden rounded-lg border bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
                style={{ borderColor: 'var(--border-default)' }}
              >
                <img
                  src={selectedImage.src}
                  alt={selectedImage.alt}
                  className={selectedImage.span === 'tall'
                    ? 'max-h-[380px] w-auto max-w-full object-contain md:max-h-[480px]'
                    : 'max-h-[320px] w-full max-w-[800px] object-contain md:max-h-[460px]'}
                  loading="lazy"
                />
              </button>
            </div>
          </div>
          ) : null}
        </div>
        ) : (
          <div
            className="flex min-h-[260px] flex-col items-center justify-center rounded-lg border bg-white px-6 py-12 text-center"
            style={{ borderColor: 'var(--border-default)' }}
          >
            <span
              className="flex h-12 w-12 items-center justify-center rounded-lg"
              style={{ background: 'rgba(91,92,246,0.07)', color: 'var(--accent-primary)' }}
            >
              <PhotoIcon className="h-6 w-6" />
            </span>
            <h3 className="mt-5 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>产品界面正在更新</h3>
            <p className="mt-2 max-w-md text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
              当前客户产品截图尚未发布，请通过管理后台上传移动端、用户后台和管理后台的最新界面。
            </p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {lightbox ? (
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={`查看${lightbox.alt}`}
            tabIndex={-1}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 outline-none md:p-8"
            style={{ background: 'rgba(23,23,43,0.9)', backdropFilter: 'blur(12px)' }}
            onClick={() => setLightbox(null)}
          >
            <button
              type="button"
              onClick={() => setLightbox(null)}
              aria-label="关闭产品截图"
              className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-lg text-white hover:bg-white/10"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
            <motion.img
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              src={lightbox.src}
              alt={lightbox.alt}
              className="max-h-[86vh] max-w-full rounded-lg object-contain"
              onClick={(event) => event.stopPropagation()}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  )
}
