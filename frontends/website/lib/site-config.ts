import { connection } from 'next/server'
import { resolvePublicHref } from './public-site'

export interface BrandConfig {
  projectName?: string
  companyName?: string
  logo?: string
  logoWhite?: string
  logoIcon?: string
  squareLogo?: string
  loginLogo?: string
  subtitle?: string
  shareImage?: string
  shareTitle?: string
  shareDesc?: string
  telphone?: string
  weixin?: string
  address?: string
  icpNo?: string
  copyrightText?: string
  websiteEnabled?: boolean
  websiteDomain?: string
  websiteSeoTitle?: string
  websiteSeoDescription?: string
  websiteSeoKeywords?: string
  websiteCtaText?: string
  websiteCtaLink?: string
  websiteSourceUrl?: string
  websiteDemoUrl?: string
  websiteUserUrl?: string
  websiteManageUrl?: string
  websiteH5Url?: string
  websiteMiniProgramQrCode?: string
  websiteOpenPlatformUrl?: string
  websiteContactEmail?: string
  websiteStatCompanyCount?: number
  websiteStatSignCount?: number
  websiteLowestUnitPrice?: number
  websiteContentJson?: string
}

export interface WebsiteFeature {
  icon?: string
  title: string
  status?: string
  statusType?: 'active' | 'beta'
  description: string
  tags?: string[]
  link?: string
  linkLabel?: string
  variant?: 'default' | 'emphasized'
}

export interface WebsiteDataPoint {
  value: number
  suffix?: string
  prefix?: string
  label: string
  description: string
}

export interface WebsiteTextCard {
  icon?: string
  title: string
  description: string
  detail?: string
  stats?: string
  tags?: string[]
}

export interface WebsiteShowcaseImage {
  src: string
  alt: string
  category: 'mobile' | 'web' | 'admin'
  span?: 'tall' | 'wide'
}

export interface WebsiteBrandVisual {
  key: 'lifecycle' | 'operations'
  src: string
  alt: string
  caption?: string
}

export interface WebsiteCompareRow {
  feature: string
  standard: string | boolean
  flagship: string | boolean
  highlight?: boolean
}

export interface WebsiteVersionHighlight {
  title: string
  desc: string
  icon?: string
}

export interface WebsitePublicLinks {
  gitEnabled?: boolean
  giteeEnabled?: boolean
  openPlatformEnabled?: boolean
  giteeUrl?: string
}

export interface WebsiteHeroPillar {
  title: string
  description: string
}

export interface WebsitePlatformCapability {
  title: string
  owner: string
  description: string
  proof?: string
  tags?: string[]
}

export interface WebsiteWorkflowStep {
  title: string
  description: string
  status?: 'pass' | 'partial' | 'blocked' | 'user_final_required'
}

export interface WebsiteCapabilityMatrixItem {
  group: string
  title: string
  description: string
  status?: string
  evidence?: string
}

export interface WebsiteRoleScenario {
  role: string
  title: string
  description: string
  actions?: string[]
  path?: string
}

export interface WebsiteDeliveryTrustItem {
  title: string
  description: string
  status: 'pass' | 'partial' | 'blocked' | 'user_final_required'
  evidence?: string
}

export interface WebsiteContentConfig {
  features?: WebsiteFeature[]
  dataPoints?: WebsiteDataPoint[]
  advantages?: WebsiteTextCard[]
  industries?: WebsiteTextCard[]
  productImages?: WebsiteShowcaseImage[]
  brandVisuals?: WebsiteBrandVisual[]
  techFeatures?: WebsiteTextCard[]
  versionCompare?: WebsiteCompareRow[]
  versionHighlights?: WebsiteVersionHighlight[]
  heroPillars?: WebsiteHeroPillar[]
  platformCapabilities?: WebsitePlatformCapability[]
  approvalWorkflow?: WebsiteWorkflowStep[]
  capabilityMatrix?: WebsiteCapabilityMatrixItem[]
  roleScenarios?: WebsiteRoleScenario[]
  deliveryTrust?: WebsiteDeliveryTrustItem[]
  ctaBullets?: string[]
  publicLinks?: WebsitePublicLinks
}

export const WEBSITE_PUBLIC_CONTENT_FIELDS = [
  'features',
  'advantages',
  'industries',
  'productImages',
  'brandVisuals',
  'techFeatures',
  'versionCompare',
  'versionHighlights',
  'publicLinks',
] as const

export interface SiteConfig {
  projectName: string
  companyName: string
  logo: string
  logoWhite: string
  logoIcon: string
  subtitle: string
  shareImage: string
  shareTitle: string
  shareDesc: string
  telphone: string
  weixin: string
  address: string
  icpNo: string
  copyrightText: string
  websiteEnabled: boolean
  websiteDomain: string
  websiteSeoTitle: string
  websiteSeoDescription: string
  websiteSeoKeywords: string
  websiteCtaText: string
  websiteCtaLink: string
  /** Legacy inactive themes may still type-check against this field; the active site config omits it. */
  websiteSourceUrl?: string
  websiteDemoUrl: string
  websiteUserUrl: string
  websiteManageUrl: string
  websiteH5Url: string
  websiteMiniProgramQrCode: string
  websiteGitEnabled: boolean
  websiteGitUrl: string
  websiteGiteeEnabled: boolean
  websiteGiteeUrl: string
  websiteOpenPlatformEnabled: boolean
  websiteOpenPlatformUrl: string
  websiteContactEmail: string
  websiteContent: WebsiteContentConfig
}

export const fallbackSiteConfig: SiteConfig = {
  projectName: '一合通',
  companyName: '',
  logo: '',
  logoWhite: '',
  logoIcon: '',
  subtitle: '企业电子合同全流程服务平台',
  shareImage: '',
  shareTitle: '一合通 - 企业电子合同全流程服务平台',
  shareDesc: '覆盖合同模板、审批、电子签署、合同智能处理、多端协同和私有化部署。',
  telphone: '',
  weixin: '',
  address: '',
  icpNo: '',
  copyrightText: '',
  websiteEnabled: true,
  websiteDomain: '',
  websiteSeoTitle: '一合通 - 企业电子合同全流程服务平台',
  websiteSeoDescription: '面向企业提供合同模板、签署前审批、电子签署、合同生成审查与比对、H5/小程序协同以及私有化部署服务。',
  websiteSeoKeywords: '电子合同,合同审批,合同模板,合同比对,合同审查,电子签名,电子签章,私有化部署,H5,小程序,一合通',
  websiteCtaText: '预约演示',
  websiteCtaLink: '#cta',
  websiteDemoUrl: '',
  websiteUserUrl: '',
  websiteManageUrl: '',
  websiteH5Url: '',
  websiteMiniProgramQrCode: '',
  websiteGitEnabled: false,
  websiteGitUrl: '',
  websiteGiteeEnabled: false,
  websiteGiteeUrl: '',
  websiteOpenPlatformEnabled: false,
  websiteOpenPlatformUrl: '',
  websiteContactEmail: '',
  websiteContent: {},
}

function clean(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

const legacyPublicCompanyNames = new Set([
  '请配置运营主体',
  '一合通',
  '一合通服务',
  '一合通云签',
])

const legacyPublicEmailDomains = new Set([
  'example.com',
  'localhost',
  'yeeco.cn',
])

function normalizePublicIdentity(value: string) {
  return value.replace(/[\s\u3000]+/g, '').toLowerCase()
}

function cleanPublicCompanyName(value: unknown, projectName: string) {
  const candidate = clean(value, '')
  if (!candidate) return ''
  const normalized = normalizePublicIdentity(candidate)
  if (
    legacyPublicCompanyNames.has(normalized) ||
    normalized === normalizePublicIdentity(projectName) ||
    normalized === `${normalizePublicIdentity(projectName)}服务`
  ) {
    return ''
  }
  return candidate
}

function cleanPublicContactEmail(value: unknown) {
  const candidate = clean(value, '')
  if (!candidate) return ''
  const match = candidate.match(/^[^\s@]+@([^\s@]+)$/)
  if (!match || legacyPublicEmailDomains.has(match[1].toLowerCase())) {
    return ''
  }
  return candidate
}

function normalizeCtaLink(value: unknown, fallback: string) {
  const href = clean(value, fallback)
  return href === '#contact' ? '#cta' : href
}

function resolveExternalHttpHref(value: unknown) {
  const href = resolvePublicHref(typeof value === 'string' ? value : '', '')
  return /^https?:\/\//i.test(href) ? href : ''
}

export function applyFallbackRuntimeDefaults(
  config: SiteConfig,
  env: Readonly<Record<string, string | undefined>> = process.env,
): SiteConfig {
  const resolveEndpoint = (configured: string, ...fallbacks: Array<string | undefined>) => {
    if (/^https?:\/\//i.test(configured)) return configured
    const fallback = fallbacks.find((value) => typeof value === 'string' && value.trim())
    return resolvePublicHref(fallback, '')
  }

  return {
    ...config,
    websiteUserUrl: resolveEndpoint(
      config.websiteUserUrl,
      env.YHT_USER_PORTAL_URL,
      env.NEXT_PUBLIC_USER_PORTAL_URL,
    ),
    websiteManageUrl: resolveEndpoint(
      config.websiteManageUrl,
      env.YHT_MANAGE_PORTAL_URL,
      env.NEXT_PUBLIC_MANAGE_PORTAL_URL,
    ),
    websiteH5Url: resolveEndpoint(
      config.websiteH5Url,
      env.YHT_H5_PORTAL_URL,
      env.NEXT_PUBLIC_H5_PORTAL_URL,
    ),
    websiteMiniProgramQrCode: resolvePublicHref(
      clean(
        env.YHT_MINI_PROGRAM_QR_CODE_URL || env.NEXT_PUBLIC_MINI_PROGRAM_QR_CODE_URL,
        config.websiteMiniProgramQrCode,
      ),
      config.websiteMiniProgramQrCode,
    ),
  }
}

function pickArray<T>(value: Record<string, unknown>, key: string) {
  return Array.isArray(value[key]) ? (value[key] as T[]) : undefined
}

function parseWebsiteContent(value: unknown): WebsiteContentConfig {
  if (typeof value !== 'string' || !value.trim()) {
    return {}
  }
  try {
    const parsed = JSON.parse(value)
    if (!parsed || typeof parsed !== 'object') {
      return {}
    }
    return sanitizeWebsiteContent(parsed as Record<string, unknown>)
  } catch {
    return {}
  }
}

function sanitizeWebsiteContent(value: Record<string, unknown>): WebsiteContentConfig {
  const content: WebsiteContentConfig = {}
  content.features = pickArray<WebsiteFeature>(value, 'features')
  content.advantages = pickArray<WebsiteTextCard>(value, 'advantages')
  content.industries = pickArray<WebsiteTextCard>(value, 'industries')
  content.productImages = pickArray<WebsiteShowcaseImage>(value, 'productImages')
  content.brandVisuals = pickArray<WebsiteBrandVisual>(value, 'brandVisuals')
  content.techFeatures = pickArray<WebsiteTextCard>(value, 'techFeatures')
  content.versionCompare = pickArray<WebsiteCompareRow>(value, 'versionCompare')
  content.versionHighlights = pickArray<WebsiteVersionHighlight>(value, 'versionHighlights')
  const publicLinks = value.publicLinks
  if (publicLinks && typeof publicLinks === 'object' && !Array.isArray(publicLinks)) {
    const links = publicLinks as Record<string, unknown>
    content.publicLinks = {
      gitEnabled: links.gitEnabled === true,
      giteeEnabled: links.giteeEnabled === true,
      openPlatformEnabled: links.openPlatformEnabled === true,
      giteeUrl: resolveExternalHttpHref(links.giteeUrl),
    }
  }
  return content
}

function resolveBrandConfigUrl() {
  const explicit = process.env.NEXT_PUBLIC_BRAND_CONFIG_URL || process.env.BRAND_CONFIG_URL
  if (explicit && /\/brand-config\/active$/i.test(explicit)) {
    return explicit
  }
  if (explicit) {
    return `${explicit.replace(/\/+$/, '')}/api/v1/brand-config/active`
  }
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || process.env.YHT_API_BASE
  if (!apiBase) {
    return ''
  }
  return `${apiBase.replace(/\/+$/, '')}/api/v1/brand-config/active`
}

async function fetchBrandConfig(url: string) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 3000)
  try {
    return await fetch(url, {
      headers: { reload: '0', 'Cache-Control': 'no-cache' },
      cache: 'no-store',
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeout)
  }
}

function unwrapPayload(payload: unknown): BrandConfig | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }
  const data = (payload as { data?: unknown }).data
  if (data && typeof data === 'object') {
    return data as BrandConfig
  }
  return payload as BrandConfig
}

export function mergeSiteConfig(config?: BrandConfig | null): SiteConfig {
  if (!config) {
    return fallbackSiteConfig
  }
  const projectName = clean(config.projectName, fallbackSiteConfig.projectName)
  const websiteContent = parseWebsiteContent(config.websiteContentJson)
  const publicLinks = websiteContent.publicLinks || {}
  const websiteGitUrl = resolveExternalHttpHref(config.websiteSourceUrl)
  const websiteGiteeUrl = resolveExternalHttpHref(publicLinks.giteeUrl)
  const websiteOpenPlatformUrl = resolveExternalHttpHref(config.websiteOpenPlatformUrl)
  return {
    ...fallbackSiteConfig,
    projectName,
    companyName: cleanPublicCompanyName(config.companyName, projectName),
    logo: clean(config.logo, fallbackSiteConfig.logo),
    logoWhite: clean(config.logoWhite, fallbackSiteConfig.logoWhite),
    logoIcon: clean(config.squareLogo || config.logoIcon, clean(config.logo, fallbackSiteConfig.logoIcon)),
    subtitle: clean(config.subtitle, fallbackSiteConfig.subtitle),
    shareImage: clean(config.shareImage, fallbackSiteConfig.shareImage),
    shareTitle: clean(config.shareTitle, fallbackSiteConfig.shareTitle),
    shareDesc: clean(config.shareDesc, fallbackSiteConfig.shareDesc),
    telphone: clean(config.telphone, fallbackSiteConfig.telphone),
    weixin: clean(config.weixin, fallbackSiteConfig.weixin),
    address: clean(config.address, fallbackSiteConfig.address),
    icpNo: clean(config.icpNo, fallbackSiteConfig.icpNo),
    copyrightText: clean(config.copyrightText, fallbackSiteConfig.copyrightText),
    websiteEnabled: config.websiteEnabled !== false,
    websiteDomain: clean(config.websiteDomain, fallbackSiteConfig.websiteDomain),
    websiteSeoTitle: clean(config.websiteSeoTitle, fallbackSiteConfig.websiteSeoTitle),
    websiteSeoDescription: clean(config.websiteSeoDescription, fallbackSiteConfig.websiteSeoDescription),
    websiteSeoKeywords: clean(config.websiteSeoKeywords, fallbackSiteConfig.websiteSeoKeywords),
    websiteCtaText: clean(config.websiteCtaText, fallbackSiteConfig.websiteCtaText),
    websiteCtaLink: resolvePublicHref(
      normalizeCtaLink(config.websiteCtaLink, fallbackSiteConfig.websiteCtaLink),
      fallbackSiteConfig.websiteCtaLink,
    ),
    websiteDemoUrl: resolvePublicHref(config.websiteDemoUrl, fallbackSiteConfig.websiteDemoUrl),
    websiteUserUrl: resolvePublicHref(config.websiteUserUrl, fallbackSiteConfig.websiteUserUrl),
    websiteManageUrl: resolvePublicHref(config.websiteManageUrl, fallbackSiteConfig.websiteManageUrl),
    websiteH5Url: resolvePublicHref(config.websiteH5Url, fallbackSiteConfig.websiteH5Url),
    websiteMiniProgramQrCode: resolvePublicHref(
      config.websiteMiniProgramQrCode,
      fallbackSiteConfig.websiteMiniProgramQrCode,
    ),
    websiteGitEnabled: publicLinks.gitEnabled === true && Boolean(websiteGitUrl),
    websiteGitUrl,
    websiteGiteeEnabled: publicLinks.giteeEnabled === true && Boolean(websiteGiteeUrl),
    websiteGiteeUrl,
    websiteOpenPlatformEnabled:
      publicLinks.openPlatformEnabled === true && Boolean(websiteOpenPlatformUrl),
    websiteOpenPlatformUrl,
    websiteContactEmail: cleanPublicContactEmail(config.websiteContactEmail),
    websiteContent,
  }
}

export async function getSiteConfig(): Promise<SiteConfig> {
  await connection()
  try {
    const brandConfigUrl = resolveBrandConfigUrl()
    if (!brandConfigUrl) {
      return applyFallbackRuntimeDefaults(fallbackSiteConfig)
    }
    const response = await fetchBrandConfig(brandConfigUrl)
    if (!response.ok) {
      return applyFallbackRuntimeDefaults(fallbackSiteConfig)
    }
    return applyFallbackRuntimeDefaults(mergeSiteConfig(unwrapPayload(await response.json())))
  } catch {
    return applyFallbackRuntimeDefaults(fallbackSiteConfig)
  }
}

