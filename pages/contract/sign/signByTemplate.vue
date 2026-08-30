<template>
  <view>
    <LoginTip />
    <view class="page-base">
      <view class="container-card">
        <view class="title bold text-28 color-base sign-box">
          <view>合同文件</view>
          <!-- <uni-icons type="info" size="24" color="#FF6565" @click="showInfo"></uni-icons> -->
        </view>
        <FileItem
          :file="{
            name: contractDetail.name,
          }"
          @click.native="openFile(contractDetail.pdfUrl)"
        ></FileItem>
      </view>

      <view class="container-card">
        <view class="title bold text-28 color-base">合同名称</view>
        <view class="item">
          <input
            class="text-26"
            type="text"
            v-model="form.name"
            placeholder="请输入合同名称"
            :maxlength="100"
            placeholder-class="text-26 color-grey"
          />
        </view>
        <view class="line-horizontal"></view>
        <view class="title bold text-28 color-base">签署截止日期</view>
        <time-picker
          showType="yearToMinute"
          :begin-date="start"
          :end-date="end"
          @btnConfirm="e => (form.endTime = e.key + ':59')"
          v-if="!reloading"
        >
          <!-- <picker mode="date" :value="form.endTime" :start="start" @change="change" v-if="!reloading"> -->
          <view class="flex-sb">
            <view class="text-26 color-base" v-if="form.endTime">{{ form.endTime }}</view>
            <view v-else class="color-grey text-26">过期则无法签署</view>
            <uni-icons type="forward" size="15" color="#B3B3B3" class="flex-ct"></uni-icons>
          </view>
          <!-- </picker> -->
        </time-picker>
      </view>

      <view class="flex-fs" style="margin-top: 32rpx">
        <view class="bold text-28 color-base">签署方</view>
        <text class="text-22 color-grey" style="margin-left: 10rpx">
          支持单个签署方添加多个签署人，批量发起多份合同
        </text>
      </view>
      <view class="container-card">
        <view v-for="(signer, i) in tempItems" :key="i">
          <view class="flex-sb" style="padding: 24rpx 0">
            <text class="text-28 bold">{{ signer.signerFlag }}</text>
            <!-- <text
              class="text-28"
              :class="
                !forbidAddSigner ||
                ((signer.signers.length > 1 || signer.signers.length === 0) &&
                  forbidAddSigner &&
                  signer.signers.length < 10)
                  ? 'color-base'
                  : 'color-grey'
              "
              @click="
                handleIndex = [i, -1];
                !forbidAddSigner ||
                ((signer.signers.length > 1 || signer.signers.length === 0) &&
                  forbidAddSigner &&
                  signer.signers.length < 10)
                  ? addSinger(signer)
                  : '';
              "
            >
              添加{{ signer.signerFlag }}
            </text> -->
          </view>
          <view v-for="(item, index) in signer.signers" :key="index">
            <view class="signer-item">
              <!-- 个人 -->
              <view
                v-if="item.signerType === 1"
                class="flex flex-1"
                @click="
                  handleIndex = [i, index];
                  $refs.addSignerRef.open(0, item.person.name ? item.person : '');
                "
              >
                <image class="img-avatar" src="/static/ImgDefAvatar.png"></image>
                <view class="flex-wrap flex-1" v-if="item.person.name">
                  <view class="text-28 color-base bold width-full">
                    {{ item.person.name }}
                  </view>
                  <view class="text-28 color-grey-minor" style="margin: 10rpx 0 0">
                    {{ item.person.mobile }}
                  </view>
                </view>
              </view>
              <!-- 企业 -->
              <view
                v-else-if="item.signerType === 2"
                class="flex flex-1"
                @click="
                  handleIndex = [i, index];
                  $refs.addSignerRef.open(1, item.company.agentName ? item.company : '');
                "
              >
                <image class="img-avatar" src="/static/ImgDefEnterprise.png"></image>
                <view class="flex-1" v-if="item.company.agentName">
                  <view class="text-28 color-base bold width-full">
                    {{ item.company.agentName }}
                  </view>
                  <view class="text-28 color-grey-minor" style="margin: 10rpx 0">
                    {{ item.company.agentMobile }}
                  </view>
                  <view class="text-28 color-base">
                    {{ item.company.name }}
                  </view>
                </view>
              </view>
              <label @click="tempItems[i].signers.splice(index, 1)">
                <uni-icons type="trash" size="20" color="#dd524d"></uni-icons>
              </label>
              <view class="contract-video-inline-switch" v-if="form.requireVideo">
                <text class="text-24 color-grey-minor">录制</text>
                <switch
                  :checked="item.requireVideo"
                  @change="e => setTemplateSignerRequireVideo(i, index, e.detail.value)"
                  color="#317CFF"
                />
              </view>
            </view>
          </view>

          <!--          <view
            class="add-text signer-item"
            v-if="!signer.signers.length"
            @click="
              handleIndex = [i, -1];
              addSinger(signer);
            "
          >
            + 添加{{ signer.signerFlag }}
          </view> -->
          <view
            class="signer-item"
            v-if="
              !forbidAddSigner ||
              ((signer.signers.length > 1 || signer.signers.length === 0) &&
                forbidAddSigner &&
                signer.signers.length < 10)
            "
            @click="
              handleIndex = [i, -1];
              addSinger(signer);
            "
          >
            <image
              v-if="signer.signerType === 1"
              class="img-avatar"
              src="/static/ImgDefAvatar.png"
            ></image>
            <image v-else class="img-avatar" src="/static/ImgDefEnterprise.png"></image>
            <text class="add-text">+ 添加{{ signer.signerFlag }}</text>
          </view>
        </view>
      </view>

      <view class="container-card contract-video-card" style="margin-top: 32rpx;">
        <view class="flex-sb" style="padding: 20rpx 0;">
          <view>
            <view class="text-28 bold color-base">签署前录制视频</view>
            <view class="text-24 color-grey-minor">要求签署方签署前录制视频</view>
          </view>
          <switch :checked="form.requireVideo" @change="e => setFormRequireVideo(e.detail.value)" color="#317CFF" />
        </view>
        <view class="contract-video-empty" v-if="form.requireVideo">
          <text class="text-24 color-grey-minor">开启后默认要求全部已添加签署方录制，可在每个签署方卡片中关闭。</text>
        </view>
      </view>

      <btn-fixed>
        <view class="flex-fs">
          <view
            class="save-draft"
            @click="saveDraft"
            :class="{
              dis: !userInfo.authentication,
            }"
          >
            <image src="/static/icon-draft.png"></image>
            <view>保存草稿</view>
          </view>
          <view class="btn-next btn-primary" @click="submit">{{ submitButtonText }}</view>
        </view>
      </btn-fixed>
    </view>
    <addSigner :unSwitch="1" ref="addSignerRef" @change="onChange" :messageInfo="messageInfo" />
  </view>
</template>

<script>
var that;
import { recent, getCompanyState } from '@/api/company.js';
import { addTempStorage, templateDetail } from '@/api/file.js';
import { approvalDetail, approvalConfig } from '@/api/contract-approval.js';
import { save, edit, detail, del } from '@/api/draft.js';
import config from '@/config/index.js';
import { mapState, mapActions } from 'vuex';
import userInfoApi from '@/api/api.js';
import addSigner from './components/addSigner.vue';
import {
  normalizeTemplateSignerId,
  normalizeTemplateItems,
  mergeApprovalSignerSnapshot,
  findMissingTemplateSigner,
} from '@/utils/templateSigner.js';
// const FileSystemManager = wx.getFileSystemManager()
export default {
  components: { addSigner },
  data() {
    return {
      start: '',
      end: '',
      form: {
        ctId: '', // 合同模板id
        endTime: '',
        name: '',
        fileSize: 0,
        requireVideo: true,
        items: [
          // {
          //   signers: [],
          //   components: []
          // }
        ],
      },
      tempItems: [], // 没有组装为后端所需的格式
      contractDetail: {},
      templateLoadError: '',
      reloading: true,
      fastClick: true,
      DraftId: '',
      requireVideoTouched: false,
      authObj: {},
      authCompanyObj: {},
      messageInfo: '', // 短信链接跳转信息
      handleIndex: [-1, -1], // 操作的索引值
      DraftId: '',
      ApprovalId: '',
      approvalRequired: false,
    };
  },
  computed: {
    ...mapState(['userInfo', 'token', 'brandConfig']),
    forbidAddSigner() {
      return this.tempItems.find(i => Array.isArray(i.signers) && i.signers.length > 1);
    },
    submitButtonText() {
      return this.approvalRequired ? '下一步：提交审批' : '下一步';
    },
    submittingTitle() {
      return this.approvalRequired ? '准备提交审批...' : '发起中...';
    },
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
    that.end = this.GetDateStr(90).replace(' 23:59:59', '')
    // this.form.endTime = endTime;
    this.getCurrentState();
    if (that.userInfo.authentication && that.userInfo.companyAccountId) {
      that.getCurrentCompanyState();
    }
    setTimeout(() => {
      this.start = endTime.replace(' 23:59:59', '');
      this.reloading = false;
      this.$forceUpdate();
    }, 100);
    if (e.tid) {
      this.form.ctId = e.tid;
      this.ApprovalId = e.approvalId || '';
      this.getTemplateDetail();
    }
    if (e.draftId) {
      this.DraftId = e.draftId;
      this.getDraftDetail();
    }
  },
  methods: {
    getDraftDetail() {
      detail(this.DraftId).then(res => {
        const content = JSON.parse(res.content);
        console.log(content);
        this.form = content.form;
        this.tempItems = normalizeTemplateItems(content.tempItems);
        this.requireVideoTouched = true;
        this.getTemplateDetail(true);
      });
    },
    setFormRequireVideo(value) {
      this.requireVideoTouched = true;
      this.form.requireVideo = value;
    },
    addSinger(signer) {
      const that = this;
      let list = [];
      this.tempItems.forEach(item => {
        list = [...list, ...item.signers];
      });
      if (signer.signerType === 1) {
        this.$refs.addSignerRef.open(0, signer.person.name ? signer.person : '', list);
      } else {
        this.$refs.addSignerRef.open(1, signer.company.agentName ? signer.company : '', list);
      }
    },
    async getTemplateDetail(ByTemplate) {
      this.templateLoadError = '';
      const res = await templateDetail(this.form.ctId);
      if (!res) {
        this.templateLoadError = '模板信息不存在，请返回重新选择模板';
        uni.showToast({ title: this.templateLoadError, icon: 'none' });
        return;
      }
      const pdfUrl = this.resolveTemplatePdfUrl(res);
      if (!pdfUrl) {
        this.templateLoadError = '模板PDF未生成，请联系管理员重新上传或转换模板文件';
        uni.showModal({
          title: '模板无法发起',
          content: this.templateLoadError,
          showCancel: false,
        });
      }
      const templateSigners = Array.isArray(res.signers) ? res.signers : [];
      const templateComponents = Array.isArray(res.components) ? res.components : [];
      res.signers = normalizeTemplateItems(templateSigners).map(i => {
        if (i.signerType === 1) {
          i.person = {
            name: '',
            mobile: '',
          };
        } else {
          i.company = {
            name: '',
            agentName: '',
            agentMobile: '',
          };
        }
        return i;
      });
      res.components = templateComponents.map(i => {
        const matchedSigner = res.signers.find(j =>
          normalizeTemplateSignerId(j.ctSignerId) === normalizeTemplateSignerId(i.ctSignerId));
        i.signerBoxColor = matchedSigner ? matchedSigner.signerBoxColor : '#317CFF';
        i.value = '';
        return i;
      });
      if (ByTemplate !== true) {
        this.tempItems = normalizeTemplateItems(res.signers).map(i => {
          return {
            signers: [],
            ...i,
          };
        });
        this.form.name = res.name;
        this.form.pdfUrl = pdfUrl;
        this.form.fileUrl = res.fileUrl;

        // 从本地存储获取外部参数
        const externalParams = uni.getStorageSync('external_params');
        // const externalParams = {type: 'cxs', id: '21'};
        if(externalParams && externalParams.type && externalParams.id) {
          const key = `${externalParams.type}:${externalParams.id}`;
          try {
            // 调用接口获取缓存数据
            const response = await uni.request({
              url: `${config.getBaseUrl()}/api/tc/v1/cache/${key}`,
              method: 'GET'
            });
            if (response[1].data.code === 0 && response[1].data.data) {
              const cacheData = response[1].data.data;

              // 设置签署截止时间为当天23:59:59
              const today = new Date();
              const year = today.getFullYear();
              const month = String(today.getMonth() + 1).padStart(2, '0');
              const day = String(today.getDate()).padStart(2, '0');
              this.form.endTime = `${year}-${month}-${day} 23:59:59`;

              // 构造签署方数据并调用onChange方法
              this.tempItems.forEach((item, index) => {
                if (item.signerType === 1) {
                  // 个人签署方
                  const personData = {
                    type: 0,
                    person: {
                      name: cacheData.b.name,
                      mobile: cacheData.b.phone
                    }
                  };
                  this.handleIndex = [index, -1];
                  this.onChange(personData);
                } else {
                  // 历史版本曾在这里注入固定客户企业名称。该逻辑已注销：
                  // 缓存仅包含经办人时，不能推断企业主体，必须由用户重新选择真实企业。
                  console.warn('企业签署方缺少真实企业主体，已跳过历史缓存自动填充');
                }
              });
            }
          } catch (error) {
            console.error('获取缓存数据失败:', error);
          }
        }
      }
      this.contractDetail = res;
      this.contractDetail.pdfUrl = pdfUrl;
      await this.loadApprovalConfig();
      if (this.ApprovalId && ByTemplate !== true) {
        await this.restoreApprovalSnapshot();
      }
    },
    resolveTemplatePdfUrl(template) {
      const pdfUrl = (template && template.pdfUrl) || '';
      if (pdfUrl) return pdfUrl;
      const fileUrl = (template && template.fileUrl) || '';
      if (/\.pdf(\?|#|$)/i.test(fileUrl)) {
        return fileUrl;
      }
      return '';
    },
    async loadApprovalConfig() {
      this.approvalRequired = false;
      if (!this.form.ctId) return;
      try {
        const approval = await approvalConfig(this.form.ctId, { silent: true });
        this.approvalRequired = !!(approval && approval.requiresApproval);
      } catch (e) {
        this.approvalRequired = false;
      }
    },
    async restoreApprovalSnapshot() {
      const approval = await approvalDetail(this.ApprovalId);
      const templateSigners = approval
        ? (approval.templateSignersJson || approval.signersJson || approval.templateSigners)
        : [];
      const components = this.safeJson(approval && approval.componentsJson, []);
      if (approval.contractName) {
        this.form.name = approval.contractName;
      }
      if (approval.endTime) {
        this.form.endTime = approval.endTime;
      }
      this.form.requireVideo = !!approval.requireVideo;
      this.requireVideoTouched = true;
      if (templateSigners) {
        this.tempItems = mergeApprovalSignerSnapshot(this.tempItems, templateSigners)
          .map(item => ({
            ...item,
            signers: item.signers.map(signer => ({
              ...signer,
              requireVideo:
                signer.requireVideo !== undefined ? signer.requireVideo : this.form.requireVideo,
            })),
          }));
      }
      if (Array.isArray(components) && components.length) {
        const valueMap = {};
        components.forEach(component => {
          if (component && component.id !== undefined) {
            valueMap[String(component.id)] = component.value;
          }
        });
        this.contractDetail.components = (this.contractDetail.components || []).map(component => ({
          ...component,
          value:
            valueMap[String(component.id)] !== undefined
              ? valueMap[String(component.id)]
              : component.value,
        }));
      }
    },
    safeJson(text, fallback) {
      if (!text) return fallback;
      try {
        return JSON.parse(text);
      } catch (e) {
        return fallback;
      }
    },
    ...mapActions(['uinfo']),
    onChange(e) {
      console.log('singaer :', e)
      const signer = JSON.parse(JSON.stringify(this.tempItems[this.handleIndex[0]]));
      delete signer.signers;
      signer.requireVideo = this.form.requireVideo;
      if (e.type === 0) {
        if (this.handleIndex[1] === -1) {
          this.tempItems[this.handleIndex[0]].signers.push({
            ...signer,
            person: e.person,
          });
        } else {
          this.tempItems[this.handleIndex[0]].signers[this.handleIndex[1]].person = e.person;
        }
      } else {
        if (this.handleIndex[1] === -1) {
          this.tempItems[this.handleIndex[0]].signers.push({
            ...signer,
            company: e.company,
          });
        } else {
          this.tempItems[this.handleIndex[0]].signers[this.handleIndex[1]].company = e.company;
        }
      }
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
      this.uinfo();
    },
    change(e) {
      this.form.endTime = e.detail.value + ' 23:59:59';
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
    saveDraft() {
      if (this.templateLoadError || !this.form.pdfUrl) {
        uni.showToast({ title: this.templateLoadError || '模板PDF未生成，暂不能保存草稿', icon: 'none' });
        return;
      }
      // 未认证
      if (!this.userInfo.authentication) {
        // this.common.showAuthModal(
        //   '?originType=sign',
        //   '保存草稿需先完成个人认证，方可进行下一步操作'
        // );
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
      if (findMissingTemplateSigner(that.tempItems)) {
        uni.showToast({ title: '请添加签署方信息', icon: 'none' });
        return;
      }
      const formData = {
        id: this.DraftId,
        type: 1,
        content: JSON.stringify({
          form: this.form,
          tempItems: this.tempItems,
        }),
        templateId: this.form.ctId,
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
    submit() {
      let personFlag = true;
      let companyFlag = true;
      if (this.templateLoadError || !this.form.pdfUrl) {
        uni.showToast({ title: this.templateLoadError || '模板PDF未生成，暂不能发起', icon: 'none' });
        return;
      }
      // 未认证
      if (!this.userInfo.authentication) {
        this.common.showAuthModal('?originType=sign');
        return;
      }
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

      if (!that.fastClick) return;
      // 合同数不足
      if (
        (this.userInfo.companyId && this.userInfo.companyMealCount < 1) ||
        (!this.userInfo.companyId && this.userInfo.individualMealCount < 1)
      ) {
        const type = this.userInfo.companyId ? 1 : 0;
        uni.showModal({
          title: '',
          content: '剩余合同份数为0，请先购买套餐',
          confirmText: '购买',
          cancelText: '取消',
          confirmColor: '#FF6565',
          cancelColor: '#999999',
          success: function (res) {
            if (res.confirm) {
              that.common.navigateTo(`/pages/user/package/buy?type=${type}`);
            }
          },
        });
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
      this.tempItems = normalizeTemplateItems(this.tempItems);
      if (findMissingTemplateSigner(that.tempItems)) {
        uni.showToast({ title: '请添加签署方信息', icon: 'none' });
        return;
      }
      if (that.form.requireVideo) {
        const selectedVideoSigner = that.tempItems.some(item =>
          item.signers.some(signer => signer.requireVideo)
        );
        if (!selectedVideoSigner) {
          uni.showToast({ title: '请至少选择一个需要录制视频的签署方', icon: 'none' });
          return;
        }
      }
      // 重新组装数据
      let items = [];
      const maxItems = that.tempItems.find(i => i.signers.length > 1);
      if (maxItems) {
        console.log('一对多');
        items = maxItems.signers.map(k => {
          k['mutiple'] = false; // 是1
          let otherSigners = this.tempItems.filter(l =>
            normalizeTemplateSignerId(l.ctSignerId) !== normalizeTemplateSignerId(k.ctSignerId));
          otherSigners = otherSigners.map(i => {
            i.signers[0]['mutiple'] = true; // 是多
            return i.signers[0];
          });
          return {
            signers: [...[k], ...otherSigners],
            components: this.contractDetail.components || [],
          };
        });
      } else {
        console.log('一对一');
        items = [
          {
            signers: that.tempItems.map(k => {
              k.signers[0]['mutiple'] = false;
              return k.signers[0];
            }),
            components: this.contractDetail.components || [],
          },
        ];
      }
      let form = JSON.parse(JSON.stringify(this.form));
      form.items = items;
      that.fastClick = false;
      uni.showLoading({
        title: this.submittingTitle,
      });
      console.log(form);

      // 获取存储的外部参数
      const externalParams = uni.getStorageSync('external_params');
      // const externalParams = {type: 'cxs', id: '21'};
      addTempStorage({
        draftId: this.DraftId,
        type: 1,
        tempItems: this.tempItems,
        initiatorName: this.userInfo.nickname,
        signatoryName: this.getNames(),
        ...form,
      })
        .then(res => {
          if (that.DraftId) del(that.DraftId);
          let path = encodeURIComponent(
            config.manageAdminUrl + 'contract?token=' + uni.getStorageSync('token')
          );
          console.log('externalParams :', externalParams)
          // 如果有外部参数，添加到URL中


          if(externalParams && externalParams.type && externalParams.id) {
            const key = `${externalParams.type}:${externalParams.id}`;
            path += encodeURIComponent(`&key=${key}`);
            // 使用完参数后清除存储
            uni.removeStorageSync('external_params');
          }
          let url = `/pages/user/company/authorize?path=${path}&title=合同预览`;
          console.log('url :', url)
          uni.navigateTo({
            url: url
          });
        })
        .finally(() => {
          that.fastClick = true;
          uni.hideLoading();
        });
    },
    getNames() {
      let names = [];
      for (let i = 0; i < this.tempItems.length; i++) {
        this.tempItems[i].signers.forEach(s => {
          if (s.signerType === 1) {
            names.push(s.person.name);
          } else {
            names.push(s.company.agentName);
          }
        });
      }
      return names.join(',');
    },
    getCurrentState() {
      userInfoApi.getAuthState({ type: 7 }).then(res => {
        this.authObj = res;
      });
    },
    getCurrentCompanyState() {
      getCompanyState({ type: 7 }).then(res => {
        this.authCompanyObj = res;
      });
    },
    setTemplateSignerRequireVideo(itemIndex, signerIndex, value) {
      this.$set(this.tempItems[itemIndex].signers[signerIndex], 'requireVideo', value);
    },
    showInfo() {
      uni.showModal({
        showCancel: false,
        content: '签署文件最大5M，支持格式为pdf、doc、docx',
        title: '提示',
      });
    },
    getPdfDownloadUrl(url) {
      const source = (url || '').trim();
      if (!source || !/^https?:\/\//i.test(source)) {
        return source;
      }
      const proxyPrefix = `${config.getBaseUrl()}/upload/v1/pdf`;
      if (source.indexOf(proxyPrefix) === 0) {
        return source;
      }
      return `${proxyPrefix}?url=${encodeURIComponent(source)}`;
    },
    openFile(url) {
      if (url) {
        // #ifndef H5
        uni.showLoading({
          title: '请稍等',
        });
        uni.downloadFile({
          url: this.getPdfDownloadUrl(url),
          header: {
            'x-access-token': this.token,
          },
          success: function (res) {
            var filePath = res.tempFilePath;
            uni.openDocument({
              filePath: filePath,
              showMenu: true,
              fileType: 'pdf',
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
          window.open(this.getPdfDownloadUrl(url), '_blank');
        }
        // #endif
      } else {
        uni.showToast({ title: '模板PDF未生成，暂不能预览', icon: 'none' });
      }
    },
  },
  watch: {
    'form.requireVideo'(value) {
      this.tempItems.forEach((item, itemIndex) => {
        item.signers.forEach((signer, signerIndex) => {
          this.$set(this.tempItems[itemIndex].signers[signerIndex], 'requireVideo', value);
        });
      });
    },
    userInfo(value) {
      this.getCurrentState();
      if (value.authentication && value.companyAccountId) {
        that.getCurrentCompanyState();
      }
    },
  },
};
</script>
<style lang="scss" scoped>
.page-base {
  padding-bottom: calc(32rpx + env(safe-area-inset-bottom)) !important;
}
.icon-change {
  margin-top: 8rpx;
  width: 32rpx;
  height: 32rpx;
}
.container-card {
  margin-top: 32rpx;
  box-sizing: border-box;
  padding: 32rpx;
  width: 686rpx;
  background-color: #fff;
  border-radius: 12rpx;
  .sign-box {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 20rpx;
  }
  .signer-item {
    margin-top: 16rpx;
    box-sizing: border-box;
    padding: 24rpx;
    min-height: 128rpx;
    background: #fafafa;
    border-radius: 8rpx;
    display: flex;

    .img-avatar {
      flex-shrink: 0;
      margin-right: 16rpx;
      width: 80rpx;
      height: 80rpx;
      border-radius: 8rpx;
    }
  }
  .add-text {
    justify-content: center;
    text-align: center;
    flex: 1;
    line-height: 80rpx;
    font-size: 28rpx;
    color: $uni-color-primary;
  }
}

.title {
  padding-bottom: 20rpx;
}

.line-horizontal {
  width: 100%;
  height: 1px;
  margin: 32rpx 0;
  background: #e6e6e6;
}

.text-26 {
  line-height: 38rpx;
}

.btn-pick {
  margin: 40rpx auto 8rpx;
  width: 360rpx;
  height: 82rpx;
  border-radius: 8rpx;
}
.save-draft {
  image {
    width: 40rpx;
    height: 40rpx;
  }
  padding-right: 40rpx;
  text-align: center;
  view {
    color: #333;
    font-size: 24rpx;
  }
  &.dis {
    opacity: 0.4;
  }
}
.btn-next {
  width: 598rpx;
  flex: 1;
  height: 88rpx;
  border-radius: 8rpx;
}

.contract-video-card {
  .contract-video-empty {
    padding: 0 0 20rpx;
  }
}

.contract-video-inline-switch {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-left: 16rpx;
}
</style>
