import type { Metadata, Viewport } from 'next'
import './globals.css'
import { getSiteConfig } from '@/lib/site-config'
import type { SiteConfig } from '@/lib/site-config'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#fafaf8',
}

function resolveMetadataBase(domain: string) {
  const fallback = 'https://www.example.com'
  const raw = domain || fallback
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
  try {
    return new URL(withScheme)
  } catch {
    return new URL(fallback)
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig()
  const keywords = config.websiteSeoKeywords
    .split(',')
    .map((keyword) => keyword.trim())
    .filter((keyword) => keyword && !/^(CLI|MCP|Agent)$/i.test(keyword))

  return {
    metadataBase: resolveMetadataBase(config.websiteDomain),
    title: config.websiteSeoTitle,
    description: config.websiteSeoDescription,
    keywords,
    authors: [{ name: config.companyName || config.projectName }],
    robots: config.websiteEnabled ? undefined : { index: false, follow: false },
    icons: config.logoIcon || config.logo ? {
      icon: config.logoIcon || config.logo,
      shortcut: config.logoIcon || config.logo,
    } : undefined,
    openGraph: {
      title: config.websiteSeoTitle,
      description: config.websiteSeoDescription,
      type: 'website',
      images: config.shareImage ? [config.shareImage] : undefined,
    },
  }
}

function createJsonLd(config: SiteConfig) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: config.projectName,
    description: config.websiteSeoDescription,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    provider: {
      '@type': 'Organization',
      name: config.companyName || config.projectName,
    },
    featureList: [
      '合同发起与电子签署',
      '合同模板与 PDF 文书',
      '签署前审批',
      '合同生成、审查与比对',
      'Web、H5 与小程序协同',
      '开放接口与系统集成',
      '私有化部署',
    ],
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const siteConfig = await getSiteConfig()

  return (
    <html lang="zh-CN" className="scroll-smooth">
      <body className="antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(createJsonLd(siteConfig)) }}
        />
        {children}
      </body>
    </html>
  )
}
