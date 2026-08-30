/**
 * 小程序相关配置
 * logo：企业logo 登录页使用
 * appName: 小程序名称
 * companyName： 企业名称 隐私政策用
 * telphone：客服电话 隐私政策用
 * address： 企业地址
 * share：小程序分享配置
 */
let setting = {
  logo: '/static/flagship-logo.svg',
  logoWhite: '/static/flagship-logo-white.svg',
  logoSquare: '/static/flagship-logo.svg',
  logoIcon: '/static/flagship-logo.svg',
  miniNavLogo: '/static/flagship-logo-white.svg',
  loginBackground: '/static/flagship-login-bg.svg',
  homeLogoWhiteBg: '/static/flagship-logo.svg',
  homeBannerImages: ['https://resource.yi-types.com/new-sign/banner.webp'],
  shareImage: '/static/flagship-share.svg',
  agentApplyBackground: 'https://resource.yi-types.com/new-sign/yaoqing_bg.webp',
  inviteBackground: 'https://resource.yi-types.com/new-sign/img_revenue_statistics.webp',
  appName: '一合通',
  companyName: '请配置运营主体',
  telphone: '',
  qq: '',
  weixin: '',
  customerServiceQrCode: '',
  address: '',
  inviteEnabled: true,
  serviceAssistantEnabled: true,
  startContractEnabled: true,
  aiContractEnabled: true,
  contractAuditEnabled: true,
  contractCompareEnabled: true,
  rechargeEnabled: true,
  videoRecordingEnabled: true,
  personalRegisterGiftContractCount: 2,
  enterpriseRegisterGiftContractCount: 2,
  share: {
    title: '便捷签署电子合同，用一合通',
    desc: '',
    path: '/pages/home/index',
    imageUrl: '/static/flagship-share.svg',
  },
};

export default setting;
