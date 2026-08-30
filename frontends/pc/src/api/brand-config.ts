import axios from 'axios';

export interface BrandConfig {
  id?: number;
  projectName: string;
  companyName: string;
  logo: string;
  subtitle: string;
  logoWhite?: string;
  logoSquare?: string;
  logoIcon?: string;
  loginBackground?: string;
  homeLogoWhiteBg?: string;
  homeBannerImages?: string;
  shareImage?: string;
  agentApplyBackground?: string;
  shareTitle?: string;
  shareDesc?: string;
  telphone?: string;
  qq?: string;
  weixin?: string;
  address?: string;
  icpNo?: string;
  copyrightText?: string;
  privacySubject?: string;
  serviceAgreementSubject?: string;
  inviteEnabled?: boolean;
  serviceAssistantEnabled?: boolean;
  startContractEnabled?: boolean;
  aiContractEnabled?: boolean;
  contractAuditEnabled?: boolean;
  contractCompareEnabled?: boolean;
  rechargeEnabled?: boolean;
  videoRecordingEnabled?: boolean;
  personalRegisterGiftContractCount?: number | null;
  enterpriseRegisterGiftContractCount?: number | null;
  websiteEnabled?: boolean;
  websiteDomain?: string;
  websiteSeoTitle?: string;
  websiteSeoDescription?: string;
  websiteSeoKeywords?: string;
  websiteCtaText?: string;
  websiteCtaLink?: string;
  websiteSourceUrl?: string;
  websiteDemoUrl?: string;
  websiteUserUrl?: string;
  websiteManageUrl?: string;
  websiteH5Url?: string;
  websiteMiniProgramQrCode?: string;
  websiteOpenPlatformUrl?: string;
  websiteContactEmail?: string;
  websiteStatCompanyCount?: number;
  websiteStatSignCount?: number;
  websiteLowestUnitPrice?: number;
  websiteContentJson?: string;
}

export interface OpenPlatformLicenseStatus {
  configured: boolean;
  openPlatformAvailable: boolean;
  startContractAllowed: boolean;
  lastCheckTime?: string;
  lastCheckResult?: string;
  contractQuota?: number;
  localAvailableContractTotal?: number;
  quotaScopeText?: string;
  subjectType?: string;
  subjectId?: number;
  reasonCode?: string;
  reasonText?: string;
}

export interface ClientRuntimeConfig {
  [key: string]: unknown;
  configVersion?: string;
  apiBaseUrl?: string;
  ossDomain?: string;
  miniAppId?: string;
  openapiRedirectUrl?: string;
  h5BaseUrl?: string;
  officialCommercialPortal?: { enabled: boolean; url: string };
  values?: Record<string, string>;
  sources?: Record<string, string>;
}

export function getBrandConfig() {
  return axios.get<BrandConfig>('/api/v1/brand-config/active', {
    headers: { reload: '0' },
  });
}

export function getClientConfig() {
  return axios.get<ClientRuntimeConfig>('/api/v1/client-config', {
    headers: { reload: '0' },
  });
}

export function getOpenPlatformLicenseStatus() {
  return axios.get<OpenPlatformLicenseStatus>('/pf/v1/brand-config/license-status', {
    headers: { reload: '0' },
  });
}

export function issueOfficialCommercialSsoCode() {
  return axios.post<{ code: string; audience: string; expiresAt: string; launchUrl: string }>(
    '/api/v1/commercial-portal/sso-code',
    {}
  );
}
