import type { MetadataRoute } from 'next'
import { getSiteConfig } from '@/lib/site-config'

export default async function robots(): Promise<MetadataRoute.Robots> {
  const config = await getSiteConfig()
  const origin = config.websiteDomain || 'https://www.example.com'

  if (!config.websiteEnabled) {
    return {
      rules: { userAgent: '*', disallow: '/' },
    }
  }

  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${origin.replace(/\/+$/, '')}/sitemap.xml`,
  }
}
