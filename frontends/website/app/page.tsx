import Navbar from '@/components/sections/Navbar'
import Hero from '@/components/sections/Hero'
import Features from '@/components/sections/Features'
import Advantages from '@/components/sections/Advantages'
import Industries from '@/components/sections/Industries'
import ProductShowcase from '@/components/sections/ProductShowcase'
import PlatformAccess from '@/components/sections/PlatformAccess'
import TechStack from '@/components/sections/TechStack'
import VersionCompare from '@/components/sections/VersionCompare'
import CTA from '@/components/sections/CTA'
import Footer from '@/components/sections/Footer'
import { getSiteConfig } from '@/lib/site-config'
import { notFound } from 'next/navigation'

export default async function Home() {
  const siteConfig = await getSiteConfig()
  if (!siteConfig.websiteEnabled) {
    notFound()
  }

  return (
    <main className="min-h-[100dvh] bg-[var(--bg-primary)]">
      <Navbar config={siteConfig} />
      <Hero config={siteConfig} />
      <PlatformAccess config={siteConfig} />
      <Features config={siteConfig} />
      <Advantages config={siteConfig} />
      <Industries config={siteConfig} />
      <ProductShowcase config={siteConfig} />
      <TechStack config={siteConfig} />
      <VersionCompare config={siteConfig} />
      <CTA config={siteConfig} />
      <Footer config={siteConfig} />
    </main>
  )
}
