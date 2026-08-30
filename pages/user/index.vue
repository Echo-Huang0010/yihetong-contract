<template>
  <view>
    <!-- #ifdef H5 -->
    <view class="h5-page-title">我的</view>
    <!-- #endif -->
      <view class="container">
        <!-- 第一层：顶部背景 -->
        <image class="top-bg" src="https://resource.yi-types.com/new-sign/bg_top.webp" mode="aspectFill"></image>

        <!-- 第二层：页面内容 -->
        <view class="content-layer">
          <!-- Logo和标题 -->
          <view class="logo-section">
            <view class="logo logo-badge">
              <text class="logo-fallback-text">签</text>
              <image class="logo-image" :src="pageLogo" mode="aspectFit"></image>
            </view>
            <text class="app-title">{{ activeSetting.appName }}</text>
          </view>

          <!-- 用户信息卡片 -->
          <view class="user-info-card" @click="handleProfileClick">
            <view class="user-info-content">
              <view class="user-text-info">
                <text class="username">{{ userInfo ? (userInfo.nickname || userInfo.phone) : '登录/注册' }}</text>
                <view v-if="!userInfo" class="user-desc">登录后可开始使用更多功能</view>
                <view v-else-if="userInfo && userInfo.authentication" class="auth-tag" :class="userInfo.companyId ? 'company-auth' : 'personal-auth'">
                  <image class="auth-icon" :src="userInfo.companyId ? 'https://resource.yi-types.com/new-sign/ic_tag_company.webp' : 'https://resource.yi-types.com/new-sign/ic_tag_personl.webp'" mode="aspectFit"></image>
                  <text class="auth-text">{{ userInfo.companyId ? '企业认证' : '个人认证' }}</text>
                </view>
              </view>

              <!-- 合同信息 -->
              <view class="contract-info">
                <view class="contract-header">
                  <image class="contract-icon" src="https://resource.yi-types.com/new-sign/ic_my_contract.webp" mode="aspectFit"></image>
                  <text class="contract-title">我的电子合同</text>
                </view>
                <view class="contract-footer">
                  <view class="contract-count">
                    <text class="count-text">剩余</text>
                    <text class="count-num">{{ userInfo && userInfo.companyId ? userInfo.companyMealCount || 0 : userInfo ? userInfo.individualMealCount || 0 : 0 }}</text>
                    <text class="count-text">份</text>
                  </view>
                  <view class="contract-action" @click.stop="navigateTo(`/pages/user/package/comboDetails?type=${userInfo && userInfo.companyId ? 1 : 0}`, 1, null)">
                    <text class="action-text">查看详情</text>
                    <image class="action-arrow" src="https://resource.yi-types.com/new-sign/ic_right_arrow.webp" mode="aspectFit"></image>
                  </view>
                </view>
              </view>
            </view>
          </view>

          <!-- 功能卡片区域 -->
          <view class="function-cards">
            <!-- 我的企业卡片 -->
            <view class="company-card" @click="navigateTo('/pages/user/company/myCompany?originType=mine', 1, false, true)">
              <text class="card-title">我的企业</text>
              <text class="card-desc">查看管理我的企业</text>
              <image class="card-icon" src="https://resource.yi-types.com/new-sign/ic_my_company.webp" mode="aspectFit"></image>
            </view>

            <!-- 右侧两个卡片 -->
            <view class="right-cards">
              <!-- 成员管理卡片 -->
              <view class="small-card" @click="navigateTo('/pages/user/companyMembers/index', 1, true, true)">
                <view class="card-left">
                  <text class="card-title">成员管理</text>
                  <text class="card-desc">管理我的成员</text>
                </view>
                <image class="card-icon" src="https://resource.yi-types.com/new-sign/ic_my_member.webp" mode="aspectFit"></image>
              </view>

              <!-- 文件管理卡片 -->
              <view class="small-card" @click="navigateTo('/pages/user/file/fileManage', 1, false)">
                <view class="card-left">
                  <text class="card-title">文件管理</text>
                  <text class="card-desc">管理我的文件</text>
                </view>
                <image class="card-icon" src="https://resource.yi-types.com/new-sign/ic_my_files.webp" mode="aspectFit"></image>
              </view>
            </view>
          </view>

          <!-- 邀请用户卡片 -->
          <view v-if="activeSetting.inviteEnabled !== false" class="link-card" @click="inviteOrAgentApply">
            <view class="link-left">
              <view class="link-bar"></view>
              <text class="link-title">邀请用户</text>
            </view>
            <image class="link-arrow" src="/static/ic_arrow.svg" mode="aspectFit" />
          </view>

          <!-- 隐私政策卡片 -->
          <view class="link-card" @click="navigateTo('/pages/user/setting/Privacy', false, false)">
            <view class="link-left">
              <view class="link-bar"></view>
              <text class="link-title">隐私政策</text>
            </view>
            <image class="link-arrow" src="/static/ic_arrow.svg" mode="aspectFit" />
          </view>

          <!-- 退出登录按钮 -->
          <view v-if="token" class="btn-logout" @click="$refs.popupRef.open()">退出登录</view>
        </view>

        <!-- 第三层：用户头像和切换按钮 -->
        <view class="avatar-layer">
          <view class="avatar-container" @click.stop="handleProfileClick">
            <image class="avatar" :src="userInfo && userInfo.avatar ? userInfo.avatar : 'https://resource.yi-types.com/new-sign/ic_user_head.webp'" mode="aspectFill" />
          </view>
          <view v-if="userInfo && userInfo.authentication" class="role-switch-btn" @click.stop="$refs.checkUserRef.open()">
            <image class="switch-icon" src="https://resource.yi-types.com/new-sign/ic_my_roles_change.webp" mode="aspectFit"></image>
          </view>
        </view>

        <!-- 退出弹窗 -->
        <uni-popup ref="popupRef" type="bottom" class="color-base" :safe-area="false">
          <view class="popup">
            <view class="tips">退出后，将不能发起个人签署和企业签署</view>
            <view class="logout-txt row-popup text-28 flex-ct" @click="logout">确认退出</view>
            <view class="row-popup text-28 flex-ct" @click="$refs.popupRef.close()">取消</view>
          </view>
        </uni-popup>

        <tabbar />
      </view>
    <checkUser ref="checkUserRef" :check="false" backType="mine" />
  </view>
</template>

<script>
import { upload } from '@/api/oss.js';
import userInfoApi from '@/api/api';
import { getCompanyState, isAdmin } from '@/api/company.js';
import { logout } from '@/api/login';
import { mapState, mapActions } from 'vuex';
import setting from '@/config/setting.js';
import { buildMiniInviteShare, buildMiniInviteTimeline } from '@/utils/invite-share.js';
export default {
  data() {
    let self = this;
    console.log(self.userInfo);
    return {
      setting,
      statusBarHeight: 0,
      list: [
        {
          title: '我的企业',
          icon: '/static/IconEnterprise.png',
          url: '/pages/user/company/myCompany?originType=mine',
          hidden: false,
          checkToken: true,
          mustCompany: false,
          mustCross: true,
          type: 'service'
        },
        {
          title: '企业成员',
          icon: '/static/iconMember.png',
          url: '/pages/user/companyMembers/index',
          hidden: false,
          checkToken: true,
          mustCompany: true,
          mustAdmin: true,
          mustCross: true,
          type: 'service'
        },
        {
          title: '企业印章',
          icon: '/static/IconSeal.png',
          url: '/pages/user/company/companySeal',
          hidden: true,
          checkToken: true,
          mustCompany: true,
          type: 'service'
        },
        {
          title: '文件管理',
          icon: '/static/IconFilder.png',
          url: '/pages/user/file/fileManage',
          hidden: false,
          checkToken: true,
          mustCompany: false,
          type: 'service'
        },
        {
          title: '印章管理',
          icon: '/static/IconSign.png',
          url: '/pages/user/mySign/index',
          hidden: false,
          checkToken: true,
          mustCompany: false,
          signType: 1, // channel: 1=open platform 2=legacy 3=third-party
          type: 'service'
        },
        {
          title: '邀请用户',
          icon: '/static/ImgInvite.png',
          url: '/pages/user/invite/index',
          hidden: false,
          checkToken: true,
          mustCompany: false,
          type: 'service'
        },
        {
          title: '隐私政策',
          icon: '/static/IconPrivacy.png',
          url: '/pages/user/setting/Privacy',
          hidden: false,
          checkToken: false,
          mustCompany: false,
          type: 'service'
        },
        {
          title: '修改密码',
          icon: '/static/IconPwd.png',
          url: '/pages/login/reset',
          hidden: true,
          checkToken: false,
          mustCompany: false,
          type: 'setting'
        },
      ],
      authObj: {},
      authCompanyObj: {},
      admin: false,
    };
  },
  onShow() {
    this.init();
  },
  onLoad() {
    // 获取状态栏高度
    try {
      const systemInfo = uni.getSystemInfoSync();
      this.statusBarHeight = systemInfo.statusBarHeight || 0;
    } catch (e) {
      console.error('获取系统信息失败', e);
    }
  },
  onShareAppMessage() {
    return buildMiniInviteShare(
      this.activeSetting,
      this.userInfo && this.userInfo.inviteCode
    );
  },
  onShareTimeline() {
    return buildMiniInviteTimeline(
      this.activeSetting,
      this.userInfo && this.userInfo.inviteCode
    );
  },
  computed: {
    ...mapState(['userInfo', 'token', 'brandConfig']),
    activeSetting() {
      return this.brandConfig || this.setting;
    },
    pageLogo() {
      return this.activeSetting.logoIcon ||
        this.activeSetting.logoSquare ||
        this.activeSetting.logo ||
        this.activeSetting.miniNavLogo ||
        this.setting.logoIcon;
    },
    filteredServiceList() {
      return this.list.filter(
        item =>
          item.type === 'service' &&
          item.hidden === false &&
          (item.url !== '/pages/user/invite/index' || this.activeSetting.inviteEnabled !== false) &&
          (!item.mustAdmin || this.admin) &&
          (!item.signType || (item.signType && this.userInfo.batchSignPlan === item.signType))
      );
    },
  },
  methods: {
    ...mapActions(['uinfo']),
    handleProfileClick() {
      if (!this.userInfo) {
        this.common.navigateTo('/pages/login/login');
      }
    },
    init() {
      if (!this.token) return;
      this.uinfo();
    },

    // 邀请用户或申请代理
    inviteOrAgentApply() {
      if (this.activeSetting.inviteEnabled === false) {
        uni.showToast({
          title: '邀请用户功能已关闭',
          icon: 'none'
        });
        return;
      }
      if (!this.token) {
        this.common.toLogin();
        return;
      }

      // 检查用户是否有邀请码
      if (this.userInfo && this.userInfo.inviteCode) {
        // 有邀请码，跳转到邀请用户页面
        this.navigateTo('/pages/user/invite/index', 1, false);
      } else {
        // 无邀请码，跳转到申请代理页面
        this.navigateTo('/pages/user/agent/apply', 1, false);
      }
    },

    // 检查globalAuthState
    checkGlobalAuthState(obj, type) {
      // obj - 认证对象
      // type - person用户 company公司
      // globalAuthState 全局认证状态
      // 1:需重新认证 (有authUrl直接跳转)
      // 3:认证中 (判断是否有authUrl，如果有就是认证到一半的用户，直接跳转authUrl继续认证即可，如果没有就是回调还没有回来，刷新认证状态即可)
      let flag = true;
      switch (obj && obj.globalAuthState) {
        case 1:
          if (obj && obj.authUrl) {
            uni.showModal({
              content: `由于签署渠道变更，需要重新认证${type === 'person' ? '用户' : '企业'}`,
              confirmText: '去认证',
              confirmColor: '#FF6565',
              success: function (res) {
                if (res.confirm) {
                  uni.redirectTo({
                    url: '/pages/user/company/authorize?path=' + encodeURIComponent(obj && obj.authUrl),
                  });
                }
              },
            });
            flag = false;
          }
          break;
        case 3:
          if (obj && obj.authUrl) {
            uni.showModal({
              content: `${type === 'person' ? '用户' : '企业'}认证中，请稍后再试`,
              confirmText: '继续认证',
              confirmColor: '#FF6565',
              success: function (res) {
                if (res.confirm) {
                  uni.redirectTo({
                    url: '/pages/user/company/authorize?path=' + encodeURIComponent(obj && obj.authUrl),
                  });
                }
              },
            });
            flag = false;
          } else {
            uni.showModal({
              content: `${type === 'person' ? '用户' : '企业'}认证中，请稍后再试`,
              confirmText: '刷新状态',
              confirmColor: '#FF6565',
              success: function (res) {
                if (res.confirm) {
                  if (type === 'person') {
                    that.getCurrentState();
                  } else {
                    that.getCurrentCompanyState();
                  }
                }
              },
            });
            flag = false;
          }
          break;
        default:
          break;
      }

      return flag;
    },
    navigateTo(url, checkToken, mustCompany, mustCross) {
      if (checkToken && !this.token) {
        this.common.toLogin();
        return;
      }
      if (mustCompany && !this.userInfo.companyId) {
        if (!this.userInfo.authentication) {
          uni.showModal({
            content: '需要完成个人认证，方可进行下一步操作',
            confirmText: '去认证',
            confirmColor: '#FF6565',
            success: function (res) {
              if (res.confirm) {
                uni.navigateTo({
                  url: '/pages/user/personal/Certification?originType=mine',
                });
              }
            },
          });
          return;
        }
        uni.showModal({
          title: '温馨提示',
          content: '该操作需要企业认证，请切换企业身份或进行企业认证！',
          confirmText: '去认证',
          cancelText: '取消',
          confirmColor: '#FF6565',
          cancelColor: '#999999',
          success: function (res) {
            if (res.confirm) {
              uni.navigateTo({
                url: '/pages/user/company/Certification?originType=mine',
              });
            }
          },
        });
        return;
      }

      let that = this;
      if (mustCross) {
        let personFlag = true;
        let companyFlag = true;
        // 检查个人globalAuthState
        personFlag = that.checkGlobalAuthState(that && that.authObj, 'person');
        if (!personFlag) {
          return;
        }
        // 检查公司globalAuthState
        companyFlag = that.checkGlobalAuthState(that && that.authCompanyObj, 'company');
        if (!companyFlag) {
          return;
        }
      }

      this.common.navigateTo(url);
    },
    getCurrentState() {
      userInfoApi.getAuthState({ type: 6 }, { silent: true })
        .then(res => {
          this.authObj = res || {};
        })
        .catch(() => {
          this.authObj = {};
        });
    },
    getCurrentCompanyState() {
      getCompanyState({ type: 6 }, { silent: true })
        .then(res => {
          this.authCompanyObj = res || {};
          if (res && res.globalAuthState === 2) {
            this.getIsAdmin();
          } else {
            this.admin = false;
          }
        })
        .catch(() => {
          this.authCompanyObj = {};
          this.admin = false;
        });
    },
    getIsAdmin() {
      isAdmin().then(res => {
        this.admin = res;
      });
    },
    logout() {
      logout().then(() => {
        uni.redirectTo({
          url: '/pages/login/login',
        });
      });
    },
    handleShare() {
      uni.showShareMenu({
        withShareTicket: true,
        menus: ['shareAppMessage']
      })
    },
  },
  watch: {
    userInfo(value) {
      this.getCurrentState();
      if (!value.companyAccountId) {
        this.admin = false;
      }
      if (value.companyAccountId && value.authentication) {
        this.getCurrentCompanyState();
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background-color: #F6FAFF;
  padding-bottom: 120rpx;
  position: relative;
  padding: 0 !important;
}

/* 第一层：顶部背景 */
.top-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 700rpx;
  z-index: 1;
}

/* 第二层：页面内容 */
.content-layer {
  position: relative;
  z-index: 2;
  padding: 30rpx;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;

  .logo-section {
    margin-top: 56rpx;
    margin-left: 2rpx;
    display: flex;
    align-items: center;

    .logo {
      width: 56rpx;
      height: 56rpx;
    }

    .logo-badge {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 16rpx;
      background: #FFFFFF;
      overflow: hidden;
      box-shadow: 0 8rpx 18rpx rgba(0, 56, 144, 0.16);
    }

    .logo-image {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      z-index: 2;
    }

    .logo-fallback-text {
      color: #1677FF;
      font-size: 30rpx;
      font-weight: 700;
      line-height: 56rpx;
      z-index: 1;
    }

    .app-title {
      margin-left: 24rpx;
      color: #FFFFFF;
      font-size: 30rpx;
    }
  }

  .user-info-card {
    margin-top: 46rpx;
    width: 100%;
    height: 400rpx;
    background: #FFFFFF;
    border-radius: 30rpx;
    position: relative;

    .user-info-content {
      padding: 0;
      height: 100%;
      display: flex;
      flex-direction: column;

      .user-text-info {
        margin-left: 240rpx;
        margin-top: 20rpx;

        .username {
          font-size: 36rpx;
          font-weight: bold;
          color: #353D4B;
          line-height: 1.2;
        }

        .user-desc {
          margin-top: 10rpx;
          font-size: 24rpx;
          color: #6E7C93;
        }

        .auth-tag {
          margin-top: 10rpx;
          display: flex;
          align-items: center;
          padding: 8rpx 16rpx;
          border-radius: 10rpx;
          border: 2rpx solid;
          width: fit-content;

          &.personal-auth {
            background: #E9FFF2;
            border-color: #78FFBC;
          }

          &.company-auth {
            background: #DFF3FF;
            border-color: #317CFF;
          }

          .auth-icon {
            width: 28rpx;
            height: 28rpx;
          }

          .auth-text {
            margin-left: 8rpx;
            font-size: 24rpx;
            font-weight: bold;
            color: #353D4B;
          }
        }
      }

      .contract-info {
        margin: 30rpx;
        width: calc(100% - 60rpx);
        height: 210rpx;
        position: absolute;
        background: #F0F7FF;
        border-radius: 30rpx;
        bottom: 0;

        .contract-header {
          margin-top: 40rpx;
          margin-left: 40rpx;
          display: flex;
          align-items: center;

          .contract-icon {
            width: 40rpx;
            height: 48rpx;
          }

          .contract-title {
            margin-left: 18rpx;
            font-size: 32rpx;
            color: #353D4B;
          }
        }

        .contract-footer {
          margin-left: 40rpx;
          margin-right: 30rpx;
          margin-bottom: 38rpx;
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          display: flex;
          justify-content: space-between;
          align-items: baseline;

          .contract-count {
            display: flex;
            align-items: baseline;

            .count-text {
              font-size: 30rpx;
              color: #353D4B;
            }

            .count-num {
              font-size: 68rpx;
              font-weight: bold;
              color: #317CFF;
              margin: 0 8rpx;
            }
          }

          .contract-action {
            display: flex;
            align-items: center;

            .action-text {
              font-size: 24rpx;
              font-weight: bold;
              color: #4A8DFF;
            }

            .action-arrow {
              margin-left: 20rpx;
              width: 18rpx;
              height: 30rpx;
            }
          }
        }
      }
    }
  }
}

  .function-cards {
    margin-top: 30rpx;
    width: 100%;
    height: 300rpx;
    display: flex;
    gap: 20rpx;
    min-width: 0;

    .company-card {
      flex: 1;
      min-width: 0;
      box-sizing: border-box;
      background: linear-gradient(to right, #FFFFFF, #D7E6FF);
      border-radius: 30rpx;
      padding: 30rpx;
      position: relative;
      display: flex;
      flex-direction: column;

      .card-title {
        font-size: 30rpx;
        color: #353D4B;
      }

      .card-desc {
        margin-top: 12rpx;
        font-size: 24rpx;
        color: #6E7C93;
      }

      .card-icon {
        position: absolute;
        right:30rpx;
        bottom: 30rpx;
        width: 120rpx;
        height: 120rpx;
      }
    }

    .right-cards {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 20rpx;

      .small-card {
        flex: 1;
        background: linear-gradient(to right, #FFFFFF, #D7E6FF);
        border-radius: 30rpx;
        padding: 30rpx;
        display: flex;
        justify-content: space-between;
        align-items: center;
        min-width: 0;
        box-sizing: border-box;

        .card-left {
          display: flex;
          flex-direction: column;
          .card-title {
            font-size: 30rpx;
            color: #353D4B;
          }

          .card-desc {
            margin-top: 8rpx;
            font-size: 24rpx;
            color: #6E7C93;
          }
        }

        .card-icon {
          width: 80rpx;
          height: 80rpx;
        }
      }
    }
  }

  /* 链接卡片 */
  .link-card {
    width: 100%;
    height: 100rpx;
    background-color: #FFFFFF;
    border-radius: 20rpx;
    margin-top: 30rpx;
    padding: 0 30rpx;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .link-left {
      display: flex;
      align-items: center;

      .link-bar {
        width: 6rpx;
        height: 30rpx;
        background-color: #317CFF;
        border-radius: 120rpx;
      }

      .link-title {
        font-size: 30rpx;
        font-weight: bold;
        color: #353D4B;
        margin-left: 20rpx;
      }
    }

    .link-arrow {
      width: 24rpx;
      height: 24rpx;
    }
  }

  /* 退出登录按钮 */
  .btn-logout {
    width: 100%;
    height: 88rpx;
    background-color: #317CFF;
    border-radius: 16rpx;
    margin-top: 40rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28rpx;
    color: #FFFFFF;
  }

/* 第三层：用户头像和切换按钮 */
.avatar-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 3;
  padding: 30rpx;
  box-sizing: border-box;
  pointer-events: none;

  .avatar-container {
    margin-top: 128rpx;
    margin-left: 50rpx;
    width: 160rpx;
    height: 160rpx;
    border-radius: 50%;
    overflow: hidden;
    background-color: #f5f5f5;
    pointer-events: auto;

    .avatar {
      width: 100%;
      height: 100%;
    }
  }

  .role-switch-btn {
    position: absolute;
    top: 188rpx;
    right: 30rpx;
    pointer-events: auto;

    .switch-icon {
      width: 134rpx;
      height: 56rpx;
    }
  }
}

/* 弹窗样式 */
.popup {
  overflow: hidden;
  border-radius: 16rpx 16rpx 0 0;
  background-color: #fff;

  .tips {
    width: 100%;
    height: 104rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #999;
    font-size: 26rpx;
  }

  .row-popup {
    width: 100%;
    height: 104rpx;
    border-bottom: 1px solid #f0f4f9;

    &:last-child {
      border: none;
    }
  }

  .logout-txt {
    color: #317CFF;
    font-weight: 500;
  }
}

.flex-ct {
  display: flex;
  align-items: center;
  justify-content: center;
}

.text-28 {
  font-size: 28rpx;
}
</style>
