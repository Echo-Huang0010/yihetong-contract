import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import test from 'node:test'

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'next/server') {
      return {
        shortCircuit: true,
        url: 'data:text/javascript,export async function connection() {}',
      }
    }
    if (specifier === './public-site' && context.parentURL?.endsWith('/lib/site-config.ts')) {
      return nextResolve(new URL('../lib/public-site.ts', import.meta.url).href, context)
    }
    return nextResolve(specifier, context)
  },
})

const {
  WEBSITE_PUBLIC_CONTENT_FIELDS,
  applyFallbackRuntimeDefaults,
  fallbackSiteConfig,
  mergeSiteConfig,
} = await import('../lib/site-config.ts')

test('uses a neutral Yihetong fallback without customer brand bytes', () => {
  assert.equal(fallbackSiteConfig.projectName, '一合通')
  assert.match(fallbackSiteConfig.websiteSeoTitle, /^一合通/)
  assert.doesNotMatch(JSON.stringify(fallbackSiteConfig), /企安签/)
})

test('publishes only the active V1 website content fields', () => {
  assert.deepEqual(WEBSITE_PUBLIC_CONTENT_FIELDS, [
    'features',
    'advantages',
    'industries',
    'productImages',
    'brandVisuals',
    'techFeatures',
    'versionCompare',
    'versionHighlights',
    'publicLinks',
  ])

  const config = mergeSiteConfig({
    websiteContentJson: JSON.stringify({
      features: [{ title: '合同签署', description: '签署链路' }],
      brandVisuals: [{ key: 'operations', src: '/brand-visuals/operations.png', alt: '多端协同' }],
      platformCapabilities: [{ title: '停用字段' }],
    }),
  })

  assert.equal(config.websiteContent.features?.[0]?.title, '合同签署')
  assert.equal(config.websiteContent.brandVisuals?.[0]?.key, 'operations')
  assert.equal(config.websiteContent.platformCapabilities, undefined)
  assert.equal('websiteContentJson' in config, false)
  assert.equal('websiteLowestUnitPrice' in config, false)
  assert.equal('websiteStatCompanyCount' in config, false)
  assert.equal('websiteStatSignCount' in config, false)
})

test('keeps backend values authoritative and preserves the website switch', () => {
  const config = mergeSiteConfig({
    websiteEnabled: false,
    websiteUserUrl: 'https://user.example.com/',
    websiteManageUrl: 'https://manage.example.com/',
    websiteH5Url: 'https://h5.example.com/',
    websiteMiniProgramQrCode: 'https://assets.example.com/mini-program.png',
    websiteOpenPlatformUrl: 'https://openapi.yi-types.com/home',
    websiteSourceUrl: 'https://git.example.com/source',
    websiteContentJson: JSON.stringify({
      publicLinks: {
        gitEnabled: true,
        giteeEnabled: true,
        openPlatformEnabled: true,
        giteeUrl: 'https://gitee.com/example/yihetong',
      },
    }),
    websiteCtaLink: '#contact',
  })

  assert.equal(config.websiteEnabled, false)
  assert.equal(config.websiteUserUrl, 'https://user.example.com/')
  assert.equal(config.websiteManageUrl, 'https://manage.example.com/')
  assert.equal(config.websiteH5Url, 'https://h5.example.com/')
  assert.equal(config.websiteMiniProgramQrCode, 'https://assets.example.com/mini-program.png')
  assert.equal(config.websiteGitEnabled, true)
  assert.equal(config.websiteGitUrl, 'https://git.example.com/source')
  assert.equal(config.websiteGiteeEnabled, true)
  assert.equal(config.websiteGiteeUrl, 'https://gitee.com/example/yihetong')
  assert.equal(config.websiteOpenPlatformEnabled, true)
  assert.equal(config.websiteOpenPlatformUrl, 'https://openapi.yi-types.com/home')
  assert.equal(config.websiteCtaLink, '#cta')
})

test('uses the local user portal only for the explicit fallback path', () => {
  const config = applyFallbackRuntimeDefaults(fallbackSiteConfig, {
    YHT_USER_PORTAL_URL: 'http://127.0.0.1:5175/',
  })

  assert.equal(config.websiteUserUrl, 'http://127.0.0.1:5175/')
  assert.equal(fallbackSiteConfig.websiteUserUrl, '')
})

test('uses runtime endpoint fallbacks when backend endpoints are relative or empty', () => {
  const config = applyFallbackRuntimeDefaults(mergeSiteConfig({
    websiteUserUrl: '/admin/',
    websiteManageUrl: '/manage/',
    websiteH5Url: '',
  }), {
    YHT_USER_PORTAL_URL: 'https://admin.example.com',
    YHT_MANAGE_PORTAL_URL: 'https://manage.example.com',
    YHT_H5_PORTAL_URL: 'https://h5.example.com',
  })

  assert.equal(config.websiteUserUrl, 'https://admin.example.com/')
  assert.equal(config.websiteManageUrl, 'https://manage.example.com/')
  assert.equal(config.websiteH5Url, 'https://h5.example.com/')
})

test('keeps absolute backend endpoints authoritative over runtime fallbacks', () => {
  const config = applyFallbackRuntimeDefaults(mergeSiteConfig({
    websiteUserUrl: 'https://configured.example.com/',
  }), {
    YHT_USER_PORTAL_URL: 'https://fallback.example.com/',
  })

  assert.equal(config.websiteUserUrl, 'https://configured.example.com/')
})

test('hides relative portal endpoints when no absolute runtime fallback exists', () => {
  const config = applyFallbackRuntimeDefaults(mergeSiteConfig({
    websiteUserUrl: '/admin/',
    websiteManageUrl: '/manage/',
    websiteMiniProgramQrCode: '/assets/mini-program.png',
  }), {})

  assert.equal(config.websiteUserUrl, '')
  assert.equal(config.websiteManageUrl, '')
  assert.equal(config.websiteMiniProgramQrCode, '/assets/mini-program.png')
})

test('uses only the explicitly supplied official mini-program QR asset', () => {
  const config = applyFallbackRuntimeDefaults(mergeSiteConfig({
    websiteMiniProgramQrCode: '',
  }), {
    YHT_MINI_PROGRAM_QR_CODE_URL: '/official-mini-program-qr.png',
  })

  assert.equal(config.websiteMiniProgramQrCode, '/official-mini-program-qr.png')
})

test('keeps the mini-program entry hidden when no official QR asset is configured', () => {
  const config = applyFallbackRuntimeDefaults(mergeSiteConfig({
    websiteMiniProgramQrCode: '',
  }), {})

  assert.equal(config.websiteMiniProgramQrCode, '')
})

test('maps the backend square logo to the public icon asset', () => {
  const config = mergeSiteConfig({
    logo: 'https://assets.example.com/logo.png',
    squareLogo: 'https://assets.example.com/square.png',
  })

  assert.equal(config.logo, 'https://assets.example.com/logo.png')
  assert.equal(config.logoIcon, 'https://assets.example.com/square.png')
})

test('keeps configured management links and rejects unsafe public or developer links', () => {
  const config = mergeSiteConfig({
    websiteUserUrl: 'https://example.com/manage/',
    websiteSourceUrl: '/manage/source',
    websiteMiniProgramQrCode: 'javascript:alert(1)',
    websiteContentJson: JSON.stringify({
      publicLinks: {
        gitEnabled: true,
        giteeEnabled: true,
        openPlatformEnabled: true,
        giteeUrl: 'javascript:alert(1)',
      },
    }),
  })

  assert.equal(config.websiteUserUrl, 'https://example.com/manage/')
  assert.equal(config.websiteGitEnabled, false)
  assert.equal(config.websiteGitUrl, '')
  assert.equal(config.websiteGiteeEnabled, false)
  assert.equal(config.websiteGiteeUrl, '')
  assert.equal(config.websiteOpenPlatformEnabled, false)
  assert.equal(config.websiteMiniProgramQrCode, '')
})

test('keeps developer buttons hidden when their independent switches are off', () => {
  const config = mergeSiteConfig({
    websiteSourceUrl: 'https://github.com/example/yihetong',
    websiteOpenPlatformUrl: 'https://openapi.example.com/home',
    websiteContentJson: JSON.stringify({
      publicLinks: {
        gitEnabled: false,
        giteeEnabled: false,
        openPlatformEnabled: false,
        giteeUrl: 'https://gitee.com/example/yihetong',
      },
    }),
  })

  assert.equal(config.websiteGitEnabled, false)
  assert.equal(config.websiteGiteeEnabled, false)
  assert.equal(config.websiteOpenPlatformEnabled, false)
})

test('maps footer identity and contact fields from the backend brand config', () => {
  const config = mergeSiteConfig({
    companyName: '客户运营主体',
    telphone: '400-000-0000',
    weixin: 'customer-service',
    address: '客户联系地址',
    icpNo: '示例备案号',
    copyrightText: 'Copyright © 客户运营主体',
    websiteContactEmail: 'service@customer.cn',
  })

  assert.equal(config.companyName, '客户运营主体')
  assert.equal(config.telphone, '400-000-0000')
  assert.equal(config.weixin, 'customer-service')
  assert.equal(config.address, '客户联系地址')
  assert.equal(config.icpNo, '示例备案号')
  assert.equal(config.copyrightText, 'Copyright © 客户运营主体')
  assert.equal(config.websiteContactEmail, 'service@customer.cn')
})

test('does not publish legacy product identity or old vendor contact details', () => {
  const config = mergeSiteConfig({
    projectName: '企安签',
    companyName: '企安签服务',
    websiteContactEmail: 'support@yeeco.cn',
  })

  assert.equal(config.companyName, '')
  assert.equal(config.websiteContactEmail, '')
})
