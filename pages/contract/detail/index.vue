<!--
 * @Description:
 * @LastEditTime: 2023-12-15 16:26:01
 * @LastEditors: wudi
 * @Author: 刘仁秀
 * @Date: 2022-09-02 15:21:16
-->
<template>
  <view>
    <view class="row-mark flex" v-if="data.result && data.state === 3">
      <uni-icons class="icon-help-filled" type="help-filled" size="18" color="#FF731D"></uni-icons>
      <view class="text-26 break-all">撤销原因: {{ data.result || '' }}</view>
    </view>
    <view class="page-base">
      <view v-if="data">
        <!-- 合同名 -->
        <view class="contai-head flex">
          <image src="/static/icon-file.png" class="icon"></image>
          <view class="text-28 bold color-base flex-1">{{ data.name || '合同不存在' }}</view>
          <view class="tag-status text-24 flex-ct" :class="'status-color-' + data.state">
            {{ data.state | stateHandle }}
          </view>
        </view>

        <!-- 签署文件 -->
        <view class="contai-file color-base" style="border-radius: 0 0 12rpx 12rpx">
          <view class="row text-28 bold">签署合同</view>

          <view class="row">
            <FileItem
              :file="{
                size: data.fileSize,
                name: data.name,
              }"
              @click.native="openFile(data.url)"
            ></FileItem>
          </view>

          <view class="row flex-fs text-26">
            <text class="key color-grey-minor">发起方</text>
            <text class="color-base">
              <!-- {{
              initiatorList.length
                ? initiatorList
                    .map(i => {
                      return i.userName;
                    })
                    .join(',')
                : '--'
            }} -->
              {{ data.initiatorName || '--' }}
            </text>
          </view>
          <view class="row flex-fs text-26">
            <text class="key color-grey-minor">签署方</text>
            <text class="color-base">
              <!-- {{
              data.signers.length
                ? data.signers
                    .map(i => {
                      return i.userName;
                    })
                    .join(',')
                : '--'
            }} -->
              {{ data.signersName || '--' }}
            </text>
          </view>
          <view class="row flex-fs text-26">
            <text class="key color-grey-minor">发起时间</text>
            <text class="color-base">{{ data.startTime || '' }}</text>
          </view>
          <view class="row flex-fs text-26">
            <text class="key color-grey-minor">截止时间</text>
            <text class="color-base">{{ data.endTime || '' }}</text>
          </view>
        </view>

        <!-- 签署流程 -->
        <view class="contai-file color-base">
          <view class="flex-sb">
            <view class="text-28 bold">签署流程</view>
            <!-- #ifdef MP -->
            <button open-type="share" class="flex-fs wx-share">
              <image src="/static/icon-share.png"></image>
              <text class="text-24">分享</text>
            </button>
            <!-- #endif -->
          </view>
          <view class="container flex-col">
            <view class="container-person width-full">
              <!-- <view class="item">
              <view class="color-grey-minor text-28">发起方</view>
              <signerInfo :item="item" v-for="(item, index) in initiatorList" :key="index" />
            </view>
            <view class="line-horizontal"></view> -->
              <view class="item">
                <view class="color-grey-minor text-28">签署方</view>
                <signerInfo :item="item" v-for="(item, index) in signersList" :key="index" />
              </view>
            </view>
          </view>
        </view>

        <!-- 签署视频记录 -->
        <view class="contai-file color-base" v-if="videoRecords.length > 0">
          <view class="contract-video-header">
            <view class="text-28 bold">签署视频</view>
            <view class="contract-video-rerecord" v-if="canReRecordVideo" @click="goReRecordVideo">
              重新录制
            </view>
          </view>
          <view class="contract-video-item" v-for="(item, index) in videoRecords" :key="index">
            <video :src="item.videoUrl" class="contract-video" controls></video>
          </view>
        </view>

        <btn-fixed
          v-if="
            data.state === 0 ||
            (mySignInfo && mySignInfo.state === 1) ||
            (data.initiatorId === userInfo.id && !mySignInfo)
          "
        >
          <view class="flex-fs">
            <!-- 0未签署 -->
            <template v-if="data.state === 0">
              <!-- 发起人才可撤销 -->
              <view
                class="c--btn"
                v-if="data.initiatorId === userInfo.id"
                @click.stop="common.navigateTo('/pages/contract/revoke/index?id=' + data.id)"
              >
                <image src="/static/icon-c1.png"></image>
                <view>撤销</view>
              </view>

              <!-- 发起方是自己 或者 签署方有自己且已签署则可催办 -->
              <view
                class="c--btn"
                v-if="data.initiatorId === userInfo.id || (mySignInfo && mySignInfo.state === 1)"
                @click="Urging"
              >
                <image src="/static/icon-c2.png"></image>
                <view>催办</view>
              </view>

              <!-- 我的签署状态为未签署才可以签署合同，不管是发起方还是签署方 -->
              <view
                v-if="mySignInfo && mySignInfo.state === 0"
                class="btn-primary"
                @click.stop="toSign"
              >
                签署合同
              </view>
            </template>
            <!--我已签署 || 我是发起方不是签署方 可以查看文件 -->
            <view
              v-if="
                (mySignInfo && mySignInfo.state === 1) ||
                (data.initiatorId === userInfo.id && !mySignInfo)
              "
              class="btn-primary"
              @click.stop="toDetail"
            >
              文件详情
            </view>
          </view>
        </btn-fixed>
      </view>
    </view>
  </view>
</template>

<script>
import userInfoApi from '@/api/api.js';
import { getCompanyState } from '@/api/company.js';
import { mapState, mapActions } from 'vuex';
import signerInfo from './components/signerInfo.vue';
import videoApi from '@/api/video.js';
import config from '@/config/index.js';
import setting from '@/config/setting.js';
export default {
  components: {
    signerInfo,
  },
  data() {
    return {
      data: '',
      contractId: '',
      companyList: [],
      authObj: {},
      authCompanyObj: {},
      enterType: '',
      videoRecords: [],
      syncSignOnLoad: false,
      signStatusPollingTimer: null,
      signStatusPollingCount: 0,
      signStatusPollingMax: 20,
      signStatusPollingDelay: 2500,
    };
  },
  computed: {
    ...mapState(['userInfo', 'brandConfig']),
    activeSetting() {
      return this.brandConfig || setting;
    },
    signersList() {
      // 签署方信息
      return this.data ? this.data.signers.filter(i => !i.asInitiator) : [];
    },
    initiatorList() {
      // 发起方信息
      return this.data ? this.data.signers.filter(i => i.asInitiator === true) : [];
    },
    mySignInfo() {
      // 当前用户的签署信息
      if (this.data) {
        const mySigner = this.data.signers.find(i => i.userId === this.userInfo.id);
        if (mySigner && this.data.initiatorId === this.userInfo.id) {
          mySigner.asInitiator = true;
        }
        return mySigner;
      } else {
        return null;
      }
    },
    canReRecordVideo() {
      return this.data
        && Number(this.data.state) === 0
        && this.mySignInfo
        && Number(this.mySignInfo.state) === 0
        && this.mySignInfo.requireVideo
        && this.videoRecords.length > 0;
    },
  },
  onLoad(options) {
    let that = this;
    that.enterType = (options && options.enterType) || '';
    that.contractId = options && options.id;
    that.syncSignOnLoad = options && options.syncSign === '1';
    that.getUserInfo().then(() => {
      const authTasks = [that.getCurrentState()];
      if (that.userInfo.authentication && that.userInfo.companyAccountId) {
        authTasks.push(that.getCurrentCompanyState());
      }
      Promise.all(authTasks).then(() => {
        if (that.syncSignOnLoad) {
          that.startSignStatusPolling();
        } else {
          that.handlePendingSignReturn();
        }
      });
    });
    that.loadVideoRecords();
    that.getCompanyList();
  },
  onShow() {
    let that = this;
    // 先刷新用户信息，确保认证状态是最新的
    that.uinfo().then(() => {
      that.getUserInfo().then(() => {
        const authTasks = [that.getCurrentState()];
        if (that.userInfo.authentication && that.userInfo.companyAccountId) {
          authTasks.push(that.getCurrentCompanyState());
        }
        Promise.all(authTasks).then(() => {
          that.handlePendingSignReturn();
        });
      });
      that.getCompanyList();
    });
  },
  mounted() {
    // #ifdef H5
    if (typeof window !== 'undefined') {
      window.addEventListener('pageshow', this.handleH5Resume);
      document.addEventListener('visibilitychange', this.handleH5VisibilityChange);
    }
    // #endif
  },
  beforeDestroy() {
    this.clearSignStatusPolling();
    // #ifdef H5
    if (typeof window !== 'undefined') {
      window.removeEventListener('pageshow', this.handleH5Resume);
      document.removeEventListener('visibilitychange', this.handleH5VisibilityChange);
    }
    // #endif
  },
  onUnload() {
    this.clearSignStatusPolling();
  },
  methods: {
    ...mapActions(['uinfo']),
    buildAuthorizePageUrl(path, options = {}) {
      const params = ['path=' + encodeURIComponent(path || '')];
      if (options.source) {
        params.push('source=' + encodeURIComponent(options.source));
      }
      if (options.contractId) {
        params.push('contractId=' + encodeURIComponent(options.contractId));
      }
      if (options.originType) {
        params.push('originType=' + encodeURIComponent(options.originType));
      }
      return '/pages/user/company/authorize?' + params.join('&');
    },
    // 检查globalAuthState
    checkGlobalAuthState(obj, type) {
      // obj - 认证对象
      // type - person用户 company公司
      // globalAuthState 全局认证状态
      // 1:需重新认证 (有authUrl直接跳转)
      // 3:认证中 (判断是否有authUrl，如果有就是认证到一半的用户，直接跳转authUrl继续认证即可，如果没有就是回调还没有回来，刷新认证状态即可)
      let flag = true;
      const that = this;
      if (obj && obj.__loadFailed) {
        uni.showToast({
          title: '\u8ba4\u8bc1\u72b6\u6001\u83b7\u53d6\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5',
          icon: 'none',
        });
        return false;
      }
      switch (obj && obj.globalAuthState) {
        case 1:
          if (obj && obj.authUrl) {
            const authorizeUrl = this.buildAuthorizePageUrl(obj.authUrl, {
              source: type === 'person' ? 'personal' : 'company',
              contractId: this.contractId,
              originType: 'sign',
            });
            uni.showModal({
              content: `由于签署渠道变更，需要重新认证${type === 'person' ? '用户' : '企业'}`,
              confirmText: '去认证',
              confirmColor: '#FF6565',
              success: function (res) {
                if (res.confirm) {
                  uni.redirectTo({
                    url: authorizeUrl,
                  });
                }
              },
            });
            flag = false;
          }
          break;
        case 3:
          if (obj && obj.authUrl) {
            const authorizeUrl = this.buildAuthorizePageUrl(obj.authUrl, {
              source: type === 'person' ? 'personal' : 'company',
              contractId: this.contractId,
              originType: 'sign',
            });
            uni.showModal({
              content: `${type === 'person' ? '用户' : '企业'}认证中，请稍后再试`,
              confirmText: '继续认证',
              confirmColor: '#FF6565',
              success: function (res) {
                if (res.confirm) {
                  uni.redirectTo({
                    url: authorizeUrl,
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
                    that.handlePendingSignReturn();
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
    toSign() {
      let that = this;

      // 先刷新一次用户信息，确保认证状态是最新的
      that.uinfo().then(async () => {
        const authTasks = [that.getCurrentState()];
        if (that.userInfo && that.userInfo.companyAccountId) {
          authTasks.push(that.getCurrentCompanyState());
        }
        await Promise.all(authTasks);

        if (!this.mySignInfo) {
          uni.showToast({
            title: '签署链接获取失败',
            icon: 'none',
          });
          return;
        }

        // 检查本地缓存中是否有标记，表示已经认证成功
        const authSuccess = uni.getStorageSync('auth_success_' + that.contractId);

        // 如果已认证或缓存中有标记，则直接进入签署流程
        if (that.userInfo.authentication || authSuccess) {
          // 设置认证成功标记，避免再次提示
          uni.setStorageSync('auth_success_' + that.contractId, true);

          const currentSigner = that.signersList.find(item => item.phone === that.userInfo.phone);
          // 公司
          if (currentSigner && currentSigner.signType === 2) {
            if (!that.userInfo.companyAccountId) {
              uni.showModal({
                content: '该操作需要企业认证，请切换企业身份或完成企业认证！',
                confirmText: '去认证',
                confirmColor: '#FF6565',
                success: function (res) {
                  if (res.confirm) {
                    uni.navigateTo({
                      url: '/pages/user/company/Certification?id=' + that.contractId + '&originType=sign',
                    });
                  }
                },
              });
              return;
            }
          }

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

          // 视频录制拦截：检查合同是否要求录制视频
          that.checkVideoBeforeSign(() => {
            uni.setStorageSync('pending_sign_contract_id', that.contractId);
            uni.navigateTo({
              url: this.buildAuthorizePageUrl(this.mySignInfo.signUrl, {
                source: 'sign',
                contractId: this.contractId,
              }),
            });
          });
        } else {
          // 未认证的情况
          if (Number(that && that.authObj && that.authObj.localAuthState) === 2) {
            uni.showModal({
              content: '用户认证中，请稍后再试',
              confirmText: '继续认证',
              confirmColor: '#FF6565',
              success: function (res) {
                if (res.confirm) {
                  uni.navigateTo({
                    url: '/pages/user/personal/Certification?id=' + that.contractId + '&originType=sign',
                  });
                }
              },
            });
            that.getCompanyList();
            that.getCurrentState();
            return;
          }
          uni.showModal({
            content: '签署前需要完成个人认证，方可进行下一步操作',
            confirmText: '去认证',
            confirmColor: '#FF6565',
            success: function (res) {
              if (res.confirm) {
                uni.navigateTo({
                  url: '/pages/user/personal/Certification?id=' + that.contractId + '&originType=sign',
                });
              }
            },
          });
        }
      });
    },
    toDetail() {
      let that = this;
      if (this.data.state === 0 && this.data.initiatorId === this.userInfo.id && !this.mySignInfo) {
        this.openFile(this.data.url);
      } else if (this.data.state === 1) {
        // this.openFile(this.data.url);
        const path = `${config.manageAdminUrl}contract?pdfUrl=${encodeURIComponent(
          that.data.url
        )}&contractId=${that.contractId}&token=${uni.getStorageSync(
          'token'
        )}&pdfName=${encodeURIComponent(that.data.name)}`;
        uni.navigateTo({
          url: '/pages/user/company/authorize?path=' + encodeURIComponent(path),
        });
      } else if (Number(this.data.state) === 0 && this.mySignInfo && Number(this.mySignInfo.state) === 1) {
        // Signed by current user, but the contract is still waiting for other signers.
        uni.setStorageSync('pending_sign_contract_id', this.contractId);
        uni.navigateTo({
          url: this.buildAuthorizePageUrl(this.mySignInfo.signUrl, {
            source: 'sign',
            contractId: this.contractId,
          }),
        });
      } else if (this.mySignInfo && Number(this.mySignInfo.state) === 0) {
        uni.setStorageSync('pending_sign_contract_id', this.contractId);
        uni.navigateTo({
          url: this.buildAuthorizePageUrl(this.mySignInfo.signUrl, {
            source: 'sign',
            contractId: this.contractId,
          }),
        });
      }
    },
    openFile(url) {
      if (url) {
        // #ifndef H5
        uni.showLoading({
          title: '请稍等',
        });
        uni.downloadFile({
          url: url,
          success: function (res) {
            var filePath = res.tempFilePath;
            uni.openDocument({
              filePath: filePath,
              showMenu: true,
              success: function (res) {
                console.log('打开文档成功');
              },
            });
          },
          complete: function (res) {
            uni.hideLoading();
          },
        });
        // #endif
        // #ifdef H5
        if (typeof window !== 'undefined') {
          const opened = window.open(url, '_blank');
          if (!opened) {
            uni.showToast({
              title: '无法打开合同文件，请检查浏览器弹窗权限或使用小程序查看',
              icon: 'none',
            });
          }
        }
        // #endif
      } else {
        // this.common.showToast('合同暂未签署完成');
      }
    },
    getUserInfo() {
      return userInfoApi
        .contractDetails({
          contractId: this.contractId,
        })
        .then(res => {
          if (res.canView === false) {
            uni.redirectTo({
              url: '/pages/contract/noAccess/index',
            });
            return;
          }
          const signersList = res.signers.filter(i => !i.asInitiator);
          const initiatorList = res.signers.filter(i => i.asInitiator);
          res.signers = [...initiatorList, ...signersList]; // 重新排序保证发起方在第一个
          this.data = res;
          uni.stopPullDownRefresh();
        })
        .catch(() => {
          uni.stopPullDownRefresh();
        });
    },
    isLocalSignPending() {
      return this.data && Number(this.data.state) === 0;
    },
    isPendingSignReturn() {
      const pendingContractId = uni.getStorageSync('pending_sign_contract_id');
      return String(pendingContractId || '') === String(this.contractId || '') && this.isLocalSignPending();
    },
    handlePendingSignReturn() {
      if (!this.data) {
        return;
      }
      if (!this.isPendingSignReturn()) {
        this.clearPendingSignStorage();
        return;
      }
      this.startSignStatusPolling();
    },
    clearPendingSignStorage(force = false) {
      const pendingContractId = uni.getStorageSync('pending_sign_contract_id');
      if (force || String(pendingContractId || '') === String(this.contractId || '')) {
        uni.removeStorageSync('pending_sign_contract_id');
      }
    },
    clearSignStatusPolling() {
      if (this.signStatusPollingTimer) {
        clearTimeout(this.signStatusPollingTimer);
        this.signStatusPollingTimer = null;
      }
    },
    startSignStatusPolling() {
      if (!this.contractId) return;
      this.clearSignStatusPolling();
      this.signStatusPollingCount = 0;
      this.pollSignStatus();
    },
    pollSignStatus() {
      if (!this.contractId) return;
      this.signStatusPollingCount += 1;
      userInfoApi
        .syncContractSignStatus(this.contractId, { silent: true })
        .catch(() => false)
        .then(() => this.getUserInfo())
        .then(() => {
          if (!this.isLocalSignPending()) {
            this.syncSignOnLoad = false;
            this.clearPendingSignStorage();
            this.clearSignStatusPolling();
            return;
          }
          if (this.signStatusPollingCount >= this.signStatusPollingMax) {
            this.syncSignOnLoad = false;
            this.clearPendingSignStorage();
            this.clearSignStatusPolling();
            return;
          }
          this.signStatusPollingTimer = setTimeout(() => {
            this.pollSignStatus();
          }, this.signStatusPollingDelay);
        })
        .catch(() => {
          this.syncSignOnLoad = false;
          this.clearPendingSignStorage();
          this.clearSignStatusPolling();
        });
    },
    handleH5Resume() {
      this.handlePendingSignReturn();
    },
    handleH5VisibilityChange() {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        this.handleH5Resume();
      }
    },
    checkVideoBeforeSign(callback) {
      videoApi.check(this.contractId).then(res => {
        if (res && res.required) {
          uni.showModal({
            title: '视频录制',
            content: '签署本合同前需要录制一段视频，请确认知悉',
            confirmText: '去录制',
            confirmColor: '#317CFF',
            success: function (r) {
              if (r.confirm) {
                this.navigateToVideoByCheckResult(res);
              }
            }.bind(this),
          });
        } else {
          callback && callback();
        }
      }).catch(() => {
        if (this.mySignInfo && this.mySignInfo.requireVideo) {
          uni.showToast({
            title: '视频录制状态检查失败，请稍后重试',
            icon: 'none',
          });
          return;
        }
        callback && callback();
      });
    },
    goReRecordVideo() {
      videoApi.check(this.contractId).then(res => {
        if (!res || !res.allowReRecord) {
          uni.showToast({ title: '当前合同不能重新录制视频', icon: 'none' });
          return;
        }
        this.navigateToVideoByCheckResult(res);
      }).catch(() => {
        uni.showToast({ title: '视频规则获取失败，请稍后重试', icon: 'none' });
      });
    },
    navigateToVideoByCheckResult(res) {
      const rules = Array.isArray(res.rules) ? res.rules : [];
      if (rules.length > 1) {
        uni.showActionSheet({
          itemList: rules.map((item, index) => '规则 ' + (index + 1)),
          success: action => {
            const rule = rules[action.tapIndex] || rules[0];
            this.openVideoRecorderWithRule(rule);
          },
          fail: () => {},
        });
        return;
      }
      this.openVideoRecorderWithRule(rules[0] || res);
    },
    openVideoRecorderWithRule(rule) {
      let url = '/pages/contract/video/index?contractId=' + this.contractId +
        '&question=' + encodeURIComponent(rule.question || '') +
        '&durationLimit=' + (rule.durationLimit || 15);
      if (rule.id) {
        url += '&ruleId=' + encodeURIComponent(rule.id);
      }
      if (rule.audioUrl) {
        url += '&audioUrl=' + encodeURIComponent(rule.audioUrl);
      }
      if (rule.suggestedDuration) {
        url += '&suggestedDuration=' + rule.suggestedDuration;
      }
      uni.navigateTo({ url });
    },
    onVideoRecorded() {
      this.getUserInfo();
      this.loadVideoRecords();
    },
    loadVideoRecords() {
      videoApi.list(this.contractId).then(res => {
        this.videoRecords = res || [];
      }).catch(() => {});
    },
    getCompanyList() {
      let that = this;
      userInfoApi
        .enterpriseList({
          pageNum: 1,
          pageSize: 999,
        })
        .then(res => {
          that.companyList = res.rows;
          if (that.companyList.length) {
            let obj = {};
            that.signersList.forEach(signer => {
              that.companyList.forEach(com => {
                if (signer.companyId === com.companyId) {
                  obj = com;
                }
              });
            });
            if (
              JSON.parse(JSON.stringify(obj)) !== '{}' &&
              !(that.mySignInfo && that.mySignInfo.asInitiator) &&
              that.enterType &&
              that.enterType === 'index'
            ) {
              that.changeRole(obj);
            }
          }
        });
    },
    changeRole(obj) {
      let that = this;
      if (obj.companyId) {
        userInfoApi
          .IdentitySwitching({ companyId: obj.companyId, identityType: obj.companyId ? 1 : 0 })
          .then(res => {
            that.uinfo();
          })
          .catch(() => {});
      }
    },
    getCurrentState() {
      return userInfoApi.getAuthState({ type: 7, params: this.contractId }, { silent: true })
        .then(res => {
          this.authObj = res || {};
        })
        .catch(() => {
          this.authObj = { __loadFailed: true };
        });
    },
    getCurrentCompanyState() {
      return getCompanyState({ type: 7, params: this.contractId }, { silent: true })
        .then(res => {
          this.authCompanyObj = res || {};
        })
        .catch(() => {
          this.authCompanyObj = { __loadFailed: true };
        });
    },
    Urging() {
      userInfoApi.urgeContract(this.contractId).then(() => {
        uni.showToast({
          title: '催办成功！',
          icon: 'success',
        });
      });
    },
  },

  onShareAppMessage() {
    return {
      title: '这份合同需要您签署，前往查看>',
      desc: '',
      path: '/pages/index/index?id=' + this.contractId + '&uid=' + this.userInfo.id,
      imageUrl: setting.share.imageUrl,
    };
  },
  onShareTimeline() {
    return {
      title: '这份合同需要您签署，前往查看>',
      desc: '',
      path: '/pages/index/index?id=' + this.contractId + '&uid=' + this.userInfo.id,
      imageUrl: setting.share.imageUrl,
    };
  },
  onPullDownRefresh() {
    let that = this;
    that.getUserInfo();
    that.getCompanyList();
    that.getCurrentState();
    if (that.userInfo.authentication && that.userInfo.companyAccountId) {
      that.getCurrentCompanyState();
    }
  },
};
</script>

<style lang="scss" scoped>
.line-horizontal {
  margin: 0 0 30rpx 0;
  border-bottom: 1px dashed #e6e6e6;
}

.contai-file {
  box-sizing: border-box;
  padding: 32rpx;
  margin-bottom: 32rpx;
  width: 686rpx;
  background: #ffffff;
  border-radius: 12rpx;
  .wx-share {
    border-radius: 8rpx;
    padding: 0 24rpx;
    background: $uni-color-primary;
    image {
      width: 26rpx;
      height: 26rpx;
      margin-right: 10rpx;
    }
    text {
      color: white;
    }
  }

  .row {
    margin-bottom: 20rpx;

    &:last-child {
      margin: 0;
    }
  }

  .key {
    width: 152rpx;
  }

  .container {
    box-sizing: border-box;
    margin-top: 40rpx;
    padding-left: 25rpx;
    border-left: 1px solid $uni-border-color;

    .container-person {
      margin-top: -20rpx;
    }

    .item {
      position: relative;
      padding-bottom: 24rpx;
      &::before {
        content: '';
        position: absolute;
        top: 12rpx;
        left: -30rpx;
        width: 12rpx;
        height: 12rpx;
        background: $uni-color-primary;
        border-radius: 50%;
      }
    }
  }
}

.contai-head {
  box-sizing: border-box;
  padding: 32rpx;
  width: 686rpx;
  background: #ffffff;
  margin-top: 32rpx;
  border-radius: 12rpx 12rpx 0 0;
  border-bottom: 1px solid #f5f5f5;
  .icon {
    width: 40rpx;
    height: 40rpx;
    margin-right: 12rpx;
  }
  .color-base {
    word-break: break-all;
  }
  .tag-status {
    padding: 0 20rpx;
    height: 40rpx;
    border-radius: 22rpx;
    margin-left: 30rpx;
  }
}

.btn-primary {
  width: 598rpx;
  flex: 1;
  height: 88rpx;
  border-radius: 8rpx;
}
.c--btn {
  margin-right: 40rpx;
  image {
    width: 46rpx;
    height: 46rpx;
    display: block;
    margin: 0 auto;
  }
  text-align: center;
  view {
    color: #333;
  }
}

.contract-video-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  margin-bottom: 20rpx;
}

.contract-video-rerecord {
  flex-shrink: 0;
  height: 52rpx;
  padding: 0 22rpx;
  border-radius: 26rpx;
  background-color: #eef5ff;
  color: #317cff;
  font-size: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.row-mark {
  padding: 16rpx 32rpx;
  background: #fdf0e2;
  border-radius: 8rpx;

  .icon-help-filled {
    /* width: 24rpx; */
    margin-right: 8rpx;
    position: relative;
    display: flex;
    justify-content: flex-start;
    flex-direction: column;
  }

  .text-26 {
    color: #000;
  }
}
.break-all {
  word-break: break-all;
}
.contract-video-item {
  margin-bottom: 20rpx;
}
.contract-video {
  width: 100%;
  height: 400rpx;
  border-radius: 12rpx;
}
</style>
