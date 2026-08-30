<template>
  <view>
    <LoginTip />
    <view v-if="token" class="page-base">
      <view class="container-card">
        <CardHeader title="合同文件" :isBar="true">
          <template #right>
            <image class="icon-tip" src="https://resource.yi-types.com/new-sign/ic_tip.webp" @click="showInfo" />
          </template>
        </CardHeader>

        <FileItem :file="file" v-if="file" @click.native="openFile" style="margin-top: 30rpx;">
          <view
            class="flex-col"
            @click.stop="navigateTo('/pages/user/file/fileManage?pick=1&id=' + file.id)"
          >
            <image class="icon-change" src="@/static/IconCheckout.png" />
            <view class="text-24 color-base-minor">更改</view>
          </view>
        </FileItem>

        <view
          v-else
          class="btn-pick"
          @click="navigateTo('/pages/user/file/fileManage?pick=1')"
        >
          <image class="icon-add" src="https://resource.yi-types.com/new-sign/ic_add.webp" />
          <text class="pick-text">选择合同文件</text>
        </view>
      </view>

      <view class="container-card">
        <CardHeader title="合同名称" :showMore="false" :isBar="true"/>
        <view class="input-container">
          <input
            class="text-26 color-dark"
            type="text"
            v-model="form.name"
            placeholder="请输入合同名称"
            :maxlength="30"
            placeholder-class="text-26 color-gray"
          />
          <view class="word-count text-22 color-gray">{{form.name.length}}/30</view>
        </view>
      </view>

      <view class="container-card">
        <CardHeader title="合同截止日期" :showMore="false" :isBar="true" />

        <time-picker

          showType="yearToMinute"
          :begin-date="start"
          :end-date="end"
          @btnConfirm="e => (form.endTime = e.key + ':59')"
          v-if="!reloading"
        >
          <view class="date-picker">
            <view class="text-26" :class="form.endTime ? 'color-dark' : 'color-gray'">
              {{ form.endTime || '过期则无法签署' }}
            </view>
            <image class="icon-arrow-right" src="/static/ic_arrow.svg" />
          </view>
        </time-picker>
      </view>

      <view class="container-card">
        <CardHeader title="签署方" :showMore="false" :isBar="true"/>
        <Signatories :currentSigner="form.signers" @change="onChange" :messageInfo="messageInfo" />
      </view>

      <view class="container-card" v-if="videoRecordingAvailable">
        <CardHeader title="签署前录制视频" :showMore="false" :isBar="true"/>
        <view class="contract-video-toggle-row">
          <view class="text-26 color-grey-minor">要求签署方签署前录制视频</view>
          <switch :checked="form.requireVideo" @change="e => setFormRequireVideo(e.detail.value)" color="#317CFF" />
        </view>
        <view class="contract-video-signer-list" v-if="form.requireVideo && form.signers.length">
          <view class="contract-video-signer-item" v-for="(item, index) in form.signers" :key="index">
            <view class="contract-video-signer-info">
              <view class="text-26 color-dark">{{ getSignerName(item) }}</view>
              <view class="text-24 color-gray">{{ getSignerMobile(item) }}</view>
            </view>
            <switch :checked="item.requireVideo" @change="e => setSignerRequireVideo(index, e.detail.value)" color="#317CFF" />
          </view>
        </view>
      </view>

      <view class="btn-fixed">
        <view class="save-draft" @click="saveDraft" :class="{ dis: !userInfo.authentication }">
          <image src="/static/ic_start_draft.svg" />
          <view>保存草稿</view>
        </view>
        <view class="btn-next" :class="{ disabled: isFormDisabled }" @click="submit">
          发起签署
        </view>
      </view>
    </view>
    <view v-else class="login-required">
      <view class="login-required-title">登录后发起签署</view>
      <view class="login-required-desc">登录后可上传合同文件、添加签署方并发起正式签署流程。</view>
      <view class="login-required-btn" @click="goLogin">立即登录</view>
    </view>
  </view>
</template>

<script>
var that;
import { sign, recent, getCompanyState } from '@/api/company.js';
import Signatories from './components/Signatories';
import { mapState, mapActions } from 'vuex';
import userInfoApi from '@/api/api.js';
import { save, edit, detail, del } from '@/api/draft.js';
import CardHeader from '@/components/CardHeader';

export default {
  components: { Signatories, CardHeader },
  data() {
    return {
      start: '',
      end: '',
      file: '',
      form: {
        initiateType: 0, // 发起类型(0:个人;1:公司;)
        name: '',
        signers: [],
        endTime: '',
        url: '',
        requireVideo: true,
      },
      showReadeMe: false,
      reloading: true,
      fastClick: true,
      authObj: {},
      authCompanyObj: {},
      balanceQuery: {},
      messageInfo: {}, // 短信链接跳转信息
      DraftId: '',
      requireVideoTouched: false,
    };
  },
  computed: {
    isFormDisabled() {
      return !this.form.url || !this.form.signers.length;
    },
    activeSetting() {
      return this.brandConfig || {};
    },
    videoRecordingAvailable() {
      const enabled = this.activeSetting.videoRecordingEnabled;
      return enabled === undefined || enabled === null || enabled === true ||
        enabled === 1 || enabled === '1' || enabled === 'true';
    },
    ...mapState(['token', 'userInfo', 'brandConfig']),
  },
  onShow(e) {
    this.init();
    if (e && e.companyName) {
      this.messageInfo = e;
    }
    if (e && e.name) {
      this.messageInfo = e;
    }
  },
  onLoad(e) {
    that = this;
    uni.setStorageSync('signing', true);
    const endTime = this.GetDateStr(0);
    that.end = this.GetDateStr(90).replace(' 23:59:59', '');
    // this.form.endTime = endTime;
    if(this.token){
    this.getCurrentState();
    }
    if (that.userInfo.authentication && that.userInfo.companyAccountId) {
      that.getCurrentCompanyState();
    }
    setTimeout(() => {
      this.start = endTime.replace(' 23:59:59', '');
      this.reloading = false;
      this.$forceUpdate();
    }, 100);
    if (e.draftId) {
      this.DraftId = e.draftId;
      this.getDraftDetail();
    }

    // 如果是从我的文书详情页跳转过来的
    if (e.fromMyDocument === 'true') {
      console.log('从我的文书详情页跳转过来');
      // 从全局数据中获取文件信息
      const app = getApp();
      if (app.globalData && app.globalData.tempFileInfo) {
        const fileInfo = app.globalData.tempFileInfo;
        console.log('获取到的文件信息:', fileInfo);

        // 设置文件信息
        that.file = fileInfo;
        that.form.url = fileInfo.url;
        that.form.name = fileInfo.name;

        // 清除临时数据
        app.globalData.tempFileInfo = null;
      }
    }
  },
  methods: {
    dateChange(e) {
      console.log(e);
    },
    ...mapActions(['uinfo']),
    async refreshSignContext(silent = true) {
      try {
        await this.uinfo({ silent });
        const balance = await userInfoApi.balanceQuery({ silent });
        this.balanceQuery = balance || {};
        return true;
      } catch (e) {
        if (silent) {
          this.balanceQuery = {};
        }
        return false;
      }
    },
    getRemainingCount() {
      const user = this.userInfo || {};
      const meal = this.balanceQuery || {};
      if (user.companyId) {
        const count = meal.companyMealCount !== undefined ? meal.companyMealCount : user.companyMealCount;
        return Number(count || 0);
      }
      const count = meal.personalMealCount !== undefined
        ? meal.personalMealCount
        : (meal.individualMealCount !== undefined ? meal.individualMealCount : user.individualMealCount);
      return Number(count || 0);
    },
    normalizeSubmitForm() {
      const form = JSON.parse(JSON.stringify(this.form));
      if (!this.videoRecordingAvailable) {
        form.requireVideo = false;
        if (Array.isArray(form.signers)) {
          form.signers.forEach(item => {
            item.requireVideo = false;
          });
        }
        return form;
      }
      form.requireVideo = Boolean(form.requireVideo);
      if (Array.isArray(form.signers)) {
        form.signers.forEach(item => {
          item.requireVideo = form.requireVideo && Boolean(item.requireVideo);
        });
      }
      return form;
    },
    onChange(e) {
      const oldMap = {};
      this.form.signers.forEach(item => {
        oldMap[this.getSignerKey(item)] = item.requireVideo;
      });
      this.form.signers = JSON.parse(JSON.stringify(e)).map(item => {
        const key = this.getSignerKey(item);
        this.$set(item, 'requireVideo',
          this.form.requireVideo ? (oldMap[key] !== undefined ? oldMap[key] : true) : false);
        return item;
      });
    },
    getDraftDetail() {
      detail(this.DraftId).then(res => {
        const content = JSON.parse(res.content);
        this.file = content.file;
        this.form = content.form;
        this.requireVideoTouched = true;
      });
    },
    setFormRequireVideo(value) {
      this.requireVideoTouched = true;
      this.form.requireVideo = value;
    },
    GetDateStr(AddDayCount) {
      //获取AddDayCount天后的日期
      var dd = new Date();
      dd.setDate(dd.getDate() + AddDayCount);
      var y = dd.getFullYear();
      var m = dd.getMonth() + 1;
      m = m < 10 ? '0' + m : m;
      var d = dd.getDate();
      d = d < 10 ? '0' + d : d;
      return y + '-' + m + '-' + d + ' 23:59:59';
    },
    init() {
       if (!this.token) {
        return;
      }
      that = this;
      that.refreshSignContext(true);
      uni.getStorage({
        key: 'readeMe',
        success: function (state) {
          that.showReadeMe = !state.data;
        },
        fail(err) {
          that.showReadeMe = true;
        },
      });
      uni.$once('file', file => {
        console.log('file', file);
        that.file = file;
        that.form.url = file.url;
        let index = file.name.lastIndexOf('.');
        index = index > 20 ? 20 : index;
        that.form.name = file.name.slice(0, index);

        // 如果是从我的文书详情页面过来的，默认填充文件名
        if (file.from === 'myDocument') {
          that.form.name = file.name;
        }
      });
    },
    iknow() {
      uni.setStorageSync('readeMe', true);
      this.showReadeMe = false;
    },
    navigateTo(url) {
      // 未登录
      if (!this.userInfo || !this.userInfo.id) {
        this.common.toLogin();
        return;
      }
      this.common.navigateTo(url);
    },
    goLogin() {
      this.common.toLogin();
    },
    change(e) {
      this.form.endTime = e.detail.value + ' 23:59:59';
    },
    // 检查globalAuthState
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
    checkGlobalAuthState(obj, type) {
      // obj - 认证对象
      // type - person用户 company公司
      // globalAuthState 全局认证状态
      // 1:需重新认证 (有authUrl直接跳转)
      // 3:认证中 (判断是否有authUrl，如果有就是认证到一半的用户，直接跳转authUrl继续认证即可，如果没有就是回调还没有回来，刷新认证状态即可)
      let flag = true;
      const page = this;

      if (obj && obj.__loadFailed) {
        uni.showToast({
          title: '认证状态获取失败，请稍后重试',
          icon: 'none',
        });
        return false;
      }

      // 安全检查，如果obj为空则直接返回
      if (!obj || obj.globalAuthState === undefined) {
        return flag;
      }

      switch (obj.globalAuthState) {
        case 1:
          if (obj.authUrl) {
            uni.showModal({
              content: `由于签署渠道变更，需要重新认证${type === 'person' ? '用户' : '企业'}`,
              confirmText: '去认证',
              confirmColor: '#317CFF',
              success: function (res) {
                if (res.confirm) {
                  uni.redirectTo({
                    url: page.buildAuthorizePageUrl(obj.authUrl, {
                      source: type === 'person' ? 'personal' : 'company',
                      originType: 'sign',
                    }),
                  });
                }
              },
            });
            flag = false;
          }
          break;
        case 3:
          if (obj.authUrl) {
            uni.showModal({
              content: `${type === 'person' ? '用户' : '企业'}认证中，请稍后再试`,
              confirmText: '继续认证',
              confirmColor: '#317CFF',
              success: function (res) {
                if (res.confirm) {
                  uni.redirectTo({
                    url: page.buildAuthorizePageUrl(obj.authUrl, {
                      source: type === 'person' ? 'personal' : 'company',
                      originType: 'sign',
                    }),
                  });
                }
              },
            });
            flag = false;
          } else {
            uni.showModal({
              content: `${type === 'person' ? '用户' : '企业'}认证中，请稍后再试`,
              confirmText: '刷新状态',
              confirmColor: '#317CFF',
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
    async submit() {
      if (!this.token) {
        this.common.toLogin();
        return;
      }
      const contextReady = await this.refreshSignContext(false);
      if (!contextReady) {
        return;
      }
      const authTasks = [this.getCurrentState()];
      if (this.userInfo && this.userInfo.companyAccountId) {
        authTasks.push(this.getCurrentCompanyState());
      } else {
        this.authCompanyObj = {};
      }
      await Promise.all(authTasks);
      // 未认证
      if (!this.userInfo.authentication) {
        this.common.showAuthModal('?originType=sign');
        return;
      }
      let personFlag = true;
      let companyFlag = true;
      // 检查个人globalAuthState
      personFlag = that.checkGlobalAuthState(that.authObj, 'person');
      if (!personFlag) {
        return;
      }
      // 检查公司globalAuthState
      companyFlag = that.checkGlobalAuthState(that.authCompanyObj, 'company');
      if (!companyFlag) {
        return;
      }

      if (!that.fastClick) return;
      // 合同数不足
      if (this.getRemainingCount() < 1) {
        const type = this.userInfo.companyId ? 1 : 0;
        uni.showModal({
          title: '',
          content: '剩余合同份数为0，请先购买套餐',
          confirmText: '购买',
          cancelText: '取消',
          confirmColor: '#317CFF',
          cancelColor: '#999999',
          success: function (res) {
            if (res.confirm) {
              that.common.navigateTo(`/pages/user/package/buy?type=${type}`);
            }
          },
        });
        return;
      }
      if (!that.file) {
        uni.showToast({ title: '请选择签署文件', icon: 'none' });
        return;
      }
      if (!that.form.name.trim()) {
        uni.showToast({ title: '请输入合同名称', icon: 'none' });
        return;
      }
      if (!that.form.endTime) {
        uni.showToast({ title: '请选择截止时间', icon: 'none' });
        return;
      }
      let pickDate = Date.parse(that.form.endTime.replace(/-/g, '/'));
      if (new Date().getTime() >= pickDate) {
        uni.showToast({ title: '截止时间不得小于当前时间', icon: 'none' });
        return;
      }
      if (!that.form.signers.length) {
        uni.showToast({ title: '请添加签署方', icon: 'none' });
        return;
      }
      if (that.videoRecordingAvailable && that.form.requireVideo && !that.form.signers.some(item => item.requireVideo)) {
        uni.showToast({ title: '请至少选择一个需要录制视频的签署方', icon: 'none' });
        return;
      }
      uni.showModal({
        title: '发起后，将扣减账户1份合同',
        content: '',
        confirmText: '确认发起',
        cancelText: '取消',
        confirmColor: '#317CFF',
        cancelColor: '#999999',
        success: function (r) {
          if (r.confirm) {
            that.fastClick = false;
            uni.showLoading({
              title: '发起中...',
            });
            let form = that.normalizeSubmitForm();
            form.fileSize = that.file.size;
            form.initiateType = that.userInfo.companyId ? 1 : 0;
            sign(form)
              .then(res => {
                uni.hideLoading();
                if (that.DraftId) del(that.DraftId);
                uni.showModal({
                  title: '签署发起成功',
                  content: '请提醒签署方注意留意手机短信，进行签署操作',
                  confirmText: '好的',
                  showCancel: false,
                  cancelText: '取消',
                  confirmColor: '#317CFF',
                  cancelColor: '#999999',
                  success: function (res1) {
                    uni.hideLoading();
                    if (res1.confirm) {
                      that.file = '';
                      that.form.name = '';
                      that.form.url = '';
                      that.form.signers = [];
                      // 本人是否签署方
                      if (res.isSigner) {
                        uni.setStorageSync('pending_sign_contract_id', res.id);
                        uni.redirectTo({
                          url:
                            that.buildAuthorizePageUrl(res.signUrl, {
                              source: 'sign',
                              contractId: res.id,
                            }),
                        });
                      } else {
                        uni.redirectTo({
                          url: `/pages/contract/detail/index?id=${res.id}`,
                        });
                      }
                    }
                  },
                  complete() {
                    that.fastClick = true;
                  },
                });
              })
              .catch(() => {
                that.fastClick = true;
                setTimeout(() => {
                  uni.hideLoading();
                }, 1000);
              });
          }
        },
      });
    },
    saveDraft() {
      // 未认证
      if (!this.userInfo.authentication) {
        // this.common.showAuthModal(
        //   '?originType=sign',
        //   '保存草稿需先完成个人认证，方可进行下一步操作'
        // );
        return;
      }
      if (!that.file) {
        uni.showToast({ title: '请选择签署文件', icon: 'none' });
        return;
      }
      if (!that.form.name.trim()) {
        uni.showToast({ title: '请输入合同名称', icon: 'none' });
        return;
      }
      if (!that.form.endTime) {
        uni.showToast({ title: '请选择截止时间', icon: 'none' });
        return;
      }
      let pickDate = Date.parse(that.form.endTime.replace(/-/g, '/'));
      if (new Date().getTime() >= pickDate) {
        uni.showToast({ title: '截止时间不得小于当前时间', icon: 'none' });
        return;
      }
      if (!that.form.signers.length) {
        uni.showToast({ title: '请添加签署方', icon: 'none' });
        return;
      }

      const formData = {
        id: this.DraftId,
        type: 2,
        content: JSON.stringify({
          form: this.form,
          file: this.file,
        }),
        initiatorName: this.userInfo.nickname,
        signatoryName: this.getNames(),
      };
      if (this.DraftId) {
        edit(formData).then(res => {
          uni.showToast({
            title: '保存成功',
            icon: 'success',
          });
          setTimeout(() => {
            uni.switchTab({
              url: '/pages/home/index',
            });
          }, 888);
        });
      } else {
        save(formData).then(res => {
          this.DraftId = res;
          uni.showToast({
            title: '保存成功',
            icon: 'success',
          });
          setTimeout(() => {
            uni.switchTab({
              url: '/pages/home/index',
            });
          }, 888);
        });
      }
    },
    getNames() {
      let names = [];
      for (let i = 0; i < this.form.signers.length; i++) {
        if (this.form.signers[i].type === 0) {
          names.push(this.form.signers[i].person.name);
        } else {
          names.push(this.form.signers[i].company.agentName);
        }
      }
      return names.join(',');
    },
    getCurrentState() {
      return userInfoApi.getAuthState({ type: 7 }, { silent: true })
        .then(res => {
          this.authObj = res || {};
        })
        .catch(() => {
          this.authObj = { __loadFailed: true };
        });
    },
    getCurrentCompanyState() {
      return getCompanyState({ type: 7 }, { silent: true })
        .then(res => {
          this.authCompanyObj = res || {};
        })
        .catch(() => {
          this.authCompanyObj = { __loadFailed: true };
        });
    },
    getSignerKey(item) {
      if (!item) return '';
      if (item.type === 0) {
        return 'person:' + (item.person && item.person.mobile ? item.person.mobile : '');
      }
      return 'company:' + (item.company && item.company.agentMobile ? item.company.agentMobile : '');
    },
    getSignerName(item) {
      if (!item) return '--';
      if (item.type === 0) {
        return item.person && item.person.name ? item.person.name : '--';
      }
      return item.company && item.company.agentName ? item.company.agentName : '--';
    },
    getSignerMobile(item) {
      if (!item) return '';
      if (item.type === 0) {
        return item.person && item.person.mobile ? item.person.mobile : '';
      }
      return item.company && item.company.agentMobile ? item.company.agentMobile : '';
    },
    setSignerRequireVideo(index, value) {
      this.$set(this.form.signers[index], 'requireVideo', value);
    },
    showInfo() {
      uni.showModal({
        showCancel: false,
        content: '签署文件最大5M，支持格式为pdf、doc、docx、png、jpg、jpeg',
        title: '提示',
      });
    },
    openFile() {
      if (this.file.url) {
        // #ifndef H5
        uni.showLoading({
          title: '请稍等',
        });
        uni.downloadFile({
          url: this.file.url,
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
          const opened = window.open(this.file.url, '_blank');
          if (!opened) {
            uni.showToast({
              title: '无法打开合同文件，请检查浏览器弹窗权限或使用小程序查看',
              icon: 'none',
            });
          }
        }
        // #endif
      }
    },
  },
  watch: {
    'form.requireVideo'(value) {
      if (!this.videoRecordingAvailable && value) {
        this.form.requireVideo = false;
        return;
      }
      this.form.signers.forEach((item, index) => {
        this.$set(this.form.signers[index], 'requireVideo', value);
      });
    },
    videoRecordingAvailable(value) {
      if (!value) {
        this.form.requireVideo = false;
        this.form.signers.forEach((item, index) => {
          this.$set(this.form.signers[index], 'requireVideo', false);
        });
      } else if (!this.requireVideoTouched && !this.DraftId) {
        this.form.requireVideo = true;
        this.form.signers.forEach((item, index) => {
          this.$set(this.form.signers[index], 'requireVideo', true);
        });
      }
    },
    userInfo(value) {
      if (value.companyId) {
        this.form.initiateType = 1;
      } else {
        this.form.initiateType = 0;
      }
      this.getCurrentState();
      if (value.authentication && value.companyAccountId) {
        that.getCurrentCompanyState();
      }
    },
  },
  onTabItemTap() {
    let that = this;
    if (that.userInfo) {
      that.file = '';
      that.form.initiateType = 0;
      that.form.name = '';
      that.form.signers = [];
      that.form.url = '';
    }
  },
};
</script>
<style lang="scss">
.group {
  margin-bottom: 20rpx;
  .row {
    margin-top: 16rpx;
    box-sizing: border-box;
    // padding: 24rpx;
    min-height: 128rpx;
    // background: #fafafa;
    // border-radius: 20rpx;
  }
}
</style>
<style lang="scss" scoped>
.page-base {
  padding-bottom: calc(120rpx + env(safe-area-inset-bottom)) !important;
  background-color: #F3F3F3;
}

.login-required {
  margin: 32rpx auto 0;
  box-sizing: border-box;
  padding: 56rpx 36rpx;
  width: 690rpx;
  background: #ffffff;
  border-radius: 20rpx;
}

.login-required-title {
  font-size: 34rpx;
  line-height: 46rpx;
  font-weight: 600;
  color: #17233d;
}

.login-required-desc {
  margin-top: 16rpx;
  font-size: 26rpx;
  line-height: 40rpx;
  color: #5f6f89;
}

.login-required-btn {
  margin-top: 36rpx;
  width: 220rpx;
  height: 76rpx;
  line-height: 76rpx;
  text-align: center;
  border-radius: 8rpx;
  background: #317cff;
  color: #ffffff;
  font-size: 28rpx;
  font-weight: 500;
}

.container-card {
  margin: 32rpx auto 0;
  box-sizing: border-box;
  padding: 30rpx;
  width: 690rpx;
  background-color: #fff;
  border-radius: 30rpx;
}

.icon-tip {
  width: 32rpx;
  height: 32rpx;
}

.btn-pick {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  width: 100%;
  height: 88rpx;
  border-radius: 30rpx;
  border: 2rpx dashed #317CFF;
  background-color: #fff;
  margin-top: 30rpx;

  .icon-add {
    width: 32rpx;
    height: 32rpx;
    margin-right: 10rpx;
  }

  .pick-text {
    color: #317CFF;
    font-size: 30rpx;
  }
}

.input-container {
  position: relative;
  height: 88rpx;
  border-radius: 30rpx;
  border: 2rpx solid #E7E7E7;
  display: flex;
  align-items: center;
  padding: 0 30rpx;
  margin-top: 30rpx;

  input {
    flex: 1;
    height: 100%;
    font-size: 26rpx;
    color: #353D4B;
  }

  .word-count {
    font-size: 22rpx;
    color: #6E7C93;
  }
}

.date-picker {
  height: 88rpx;
  border-radius: 30rpx;
  border: 2rpx solid #E7E7E7;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30rpx;
  margin-top: 30rpx;

  .text-26 {
    font-size: 26rpx;

    &.color-dark {
      color: #353D4B;
    }

    &.color-gray {
      color: #6E7C93;
    }
  }

  .icon-arrow-right {
    width: 24rpx;
    height: 24rpx;
  }
}

.btn-fixed {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  min-height: 108rpx;
  box-sizing: border-box;
  padding: 14rpx 30rpx calc(14rpx + env(safe-area-inset-bottom));
  background-color: #fff;
  display: flex;
  align-items: center;
  gap: 20rpx;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.save-draft {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 180rpx;
  height: 82rpx;
  box-sizing: border-box;
  border: 1rpx solid #D9E4F6;
  border-radius: 18rpx;
  background-color: #F7FAFF;
  gap: 8rpx;

  image {
    width: 32rpx;
    height: 32rpx;
  }

  view {
    color: #2F3B52;
    font-size: 24rpx;
    line-height: 1;
    white-space: nowrap;
  }

  &.dis {
    opacity: 0.4;
  }
}

.btn-next {
  flex: 1;
  min-width: 0;
  height: 82rpx;
  border-radius: 18rpx;
  background-color: #317CFF;
  color: #fff;
  font-size: 30rpx;
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: center;

  &.disabled {
    background-color: #A7C3F8;
    color: rgba(255, 255, 255, 0.92);
  }
}

/* #ifdef H5 */
@media screen and (max-width: 380px) {
  .btn-fixed {
    padding-left: 22rpx;
    padding-right: 22rpx;
    gap: 14rpx;
  }

  .save-draft {
    width: 166rpx;
  }

  .save-draft view {
    font-size: 22rpx;
  }

  .btn-next {
    font-size: 28rpx;
  }
}
/* #endif */

.color-dark {
  color: #353D4B;
}

.contract-video-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 0;
}

.contract-video-signer-list {
  margin-top: 16rpx;
  border-top: 1px solid #f0f0f0;
}

.contract-video-signer-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22rpx 0;
}

.contract-video-signer-info {
  flex: 1;
  padding-right: 20rpx;
}

.color-gray {
  color: #6E7C93;
}

.text-30 {
  font-size: 30rpx;
}

.text-26 {
  font-size: 26rpx;
}

.text-22 {
  font-size: 22rpx;
}

.text-20 {
  font-size: 20rpx;
}

.icon-change {
  margin-top: 8rpx;
  width: 32rpx;
  height: 32rpx;
}
</style>
