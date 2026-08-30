<!--
 * @Author: wudi
 * @Date: 2023-09-13 09:52:14
 * @LastEditors: wudi
 * @LastEditTime: 2023-12-15 16:25:22
 * @Description:
-->
<template>
  <view class="content">
    <!-- 欢迎页 -->
	<view class="splash">
		<view class="splash-logo">
			<image v-if="splashLogo" class="splash-logo-img" :src="splashLogo" mode="aspectFit"></image>
			<text v-else class="splash-logo-text">签</text>
		</view>
		<text class="splash-title">{{ activeSetting.appName || '一合通' }}</text>
		<view class="splash-loading"></view>
	</view>
	<!-- #ifdef MP-WEIXIN -->
	<wxPrivacy ref="wxPrivacy" @agree="handlePrivacyAgree"></wxPrivacy>
	<!-- #endif -->
  </view>
</template>

<script>
// #ifdef MP-WEIXIN
import wxPrivacy from '@/components/wxPrivacy/index.vue'
import {
	requirePrivacyAuthorize
} from '@/wxToPromise'
// #endif
import { mapState, mapActions } from 'vuex';
import setting from '@/config/setting.js';
export default {
	components: {
		// #ifdef MP-WEIXIN
		wxPrivacy,
		// #endif
	},
  data() {
    return {
		param: {}
	};
  },
  computed: {
    ...mapState(['token', 'brandConfig']),
	activeSetting() {
		return this.brandConfig || setting;
	},
	splashLogo() {
		return this.activeSetting.logoIcon ||
			this.activeSetting.logoSquare ||
			this.activeSetting.logo ||
			this.activeSetting.miniNavLogo ||
			setting.logoIcon;
	},
  },
  onLoad(e) {
	console.log('欢迎页收到小程序调起参数:', e);
    // 处理从其他小程序调起的参数
    if(e.type && e.id) {
      // 将参数存储到本地
      uni.setStorageSync('external_params', {
        type: e.type,
        id: e.id
      });
    }

    // 处理直接传递的合同ID和用户ID
    if(e.id) {
      console.log('检测到直接传递的合同ID:', e.id);
      // 无需额外处理，直接使用e.id即可
    }

    // 处理扫描二维码进入小程序的情况
    if(e.q) {
      try {
        // 解码URL
        const decodedUrl = decodeURIComponent(e.q);
        console.log('解码后的URL:', decodedUrl);

        // 解析URL中的参数 - 使用更兼容的方式
        const queryString = decodedUrl.split('?')[1];
        if(queryString) {
          const params = queryString.split('&');
          let id, uid;

          params.forEach(param => {
            const [key, value] = param.split('=');
            if(key === 'id') {
              id = value;
            } else if(key === 'uid') {
              uid = value;
            }
          });

          console.log('从二维码解析到的参数: id=', id, 'uid=', uid);

          if(id) {
            // 将id赋值给e.id，以便后续处理
            e.id = id;
            console.log('设置e.id为:', e.id);
          }
        }
      } catch(error) {
        console.error('解析二维码URL失败:', error);
      }
    }

    // 处理小程序码中的scene参数
    if(e.scene) {
      try {
        // 对scene进行解码
        const decodedScene = decodeURIComponent(e.scene);
        console.log('解码后的scene参数:', decodedScene);

        // 提取inviteCode
        const match = decodedScene.match(/inviteCode=([^&]+)/);
        if(match && match[1]) {
          e.inviteCode = match[1];
          console.log('提取到的inviteCode:', e.inviteCode);
        }
      } catch(error) {
        console.error('解析scene参数失败:', error);
      }
    }

	let that = this;
	this.param = e
	const token = uni.getStorageSync('token') || '';
	if(token) {
		that.$store.commit('setToken', token);
	}
	let settled = false;
	let privacyGuard = null;
	const enterApp = () => {
		if (settled) return;
		settled = true;
		clearTimeout(privacyGuard);
		that.unit(that.param);
	};
	const showPrivacyModal = () => {
		if (settled) return;
		settled = true;
		clearTimeout(privacyGuard);
		that.$nextTick(() => {
			if (that.$refs.wxPrivacy) {
				that.$refs.wxPrivacy.showModal();
			} else {
				that.unit(that.param);
			}
		});
	};
	// #ifdef MP-WEIXIN
	if(typeof wx !== 'undefined' && wx.getPrivacySetting) {
		privacyGuard = setTimeout(enterApp, 1500);
		wx.getPrivacySetting({
			success: async (res) => {
				console.log(res)
				clearTimeout(privacyGuard);
				if (!res.needAuthorization) {
					enterApp()
					return
				}
				try {
					const requireVal = await requirePrivacyAuthorize()
					console.log('requireVal')
					console.log(requireVal)
					if (!requireVal) {
						showPrivacyModal()
					} else {
						enterApp()
					}
				} catch (err) {
					showPrivacyModal()
				}
			},
			fail: () => {
				enterApp()
			}
		})
	} else {
		enterApp()
	}
	// #endif
	// #ifndef MP-WEIXIN
	enterApp()
	// #endif
    if(that.token) {
      that.uinfo()
    }
  },
  methods: {
    ...mapActions(['uinfo']),
	  handlePrivacyAgree() {
		  this.unit(this.param)
	  },
	  unit(e) {
		  console.log('unit方法接收到的参数:', e);
		  console.log('this.userInfo :', this.userInfo)
      if (e.id) {
		        // 有合同 && 当前用户是签署方
		        uni.redirectTo({
		          url: '/pages/contract/detail/index?id=' + e.id + '&enterType=index',
		        });
		      } else {
            // 在URL中带上inviteCode参数
            const url = e.inviteCode
              ? '/pages/home/index?inviteCode=' + e.inviteCode
              : '/pages/home/index';

		        uni.reLaunch({
		          url: url,
		        });
		      }
      }
  }
};
</script>
<style lang="scss" scoped>
.content {
	min-height: 100vh;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #f6faff;
}

.splash {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	min-height: 100vh;
}

.splash-logo {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 120rpx;
	height: 120rpx;
	border-radius: 24rpx;
	background: #ffffff;
	box-shadow: 0 18rpx 40rpx rgba(20, 103, 255, 0.16);
	overflow: hidden;
}

.splash-logo-img {
	width: 100%;
	height: 100%;
}

.splash-logo-text {
	color: #1677ff;
	font-size: 52rpx;
	font-weight: 700;
	line-height: 120rpx;
}

.splash-title {
	margin-top: 28rpx;
	color: #172033;
	font-size: 34rpx;
	font-weight: 600;
	line-height: 48rpx;
}

.splash-loading {
	width: 48rpx;
	height: 48rpx;
	margin-top: 34rpx;
	border: 6rpx solid rgba(20, 103, 255, 0.14);
	border-top-color: #1467ff;
	border-radius: 50%;
	animation: splash-spin 0.8s linear infinite;
}

@keyframes splash-spin {
	from {
		transform: rotate(0deg);
	}

	to {
		transform: rotate(360deg);
	}
}
</style>
