<template>
  <view class="page-base">
    <view class="top-bg">
      <image class="top-bg-image" src="https://resource.yi-types.com/new-sign/bg_robot_top.webp" mode="aspectFit" />
    </view>
    <!-- #ifdef H5 -->
      <custom-nav title="合同审查" :showBack="true" transparent class="audit-nav"></custom-nav>
      <!-- #endif -->
    <view class="container">
      <template v-if="token">
        <view class="content-box audit-upload-card">
          <image class="content-box-image" src="https://resource.yi-types.com/new-sign/bg_make_contract.webp" />
          <view class="ai-assistant-box">
            <view class="assistant-avatar">
              <image class="avatar-image" src="https://resource.yi-types.com/new-sign/ic_ai_robot.webp" mode="aspectFit" />
            </view>
            <view class="assistant-content">
              <image class="assistant-bg" src="https://resource.yi-types.com/new-sign/bg_ai_tip.webp" />
              <view class="assistant-title">Hi~ 我是服务助手小弈</view>
              <view class="assistant-desc">想了解的企业问题，我都为您尽力解答哦~</view>
            </view>
          </view>
          <view class="assistant-desc-tips">
            上传合同文件后，为您生成合同审查意见。该内容仅供参考，需要更专业意见可联系平台获得专业服务支持
          </view>
          <view class="upload-container" v-if="!documentUrl">
            <view class="upload-area" @click="chooseFile">
              <view class="upload-icon-wrapper">
                <image class="upload-icon" src="https://resource.yi-types.com/new-sign/ic_upload_file.webp" mode="aspectFit" />
              </view>
              <view class="upload-text">点击上传需要审查的合同文件</view>
              <view class="upload-tip">支持 PDF、DOCX、TXT 格式</view>
            </view>
          </view>
          
          <view v-else>
            <view class="upload-container">
              <view class="upload-area">
                <view class="upload-icon-wrapper">
                  <image class="upload-icon" src="https://resource.yi-types.com/new-sign/ic_docs.webp" mode="aspectFit" />
                </view>
                <view class="file-name">{{ fileName }}</view>
              </view>
            </view>

            <view class="file-actions">
              <view class="btn btn-vice" @click.stop="chooseFile">重新上传</view>
              <view class="btn btn-primary" @click.stop="startAudit" :class="{ disabled: auditing }">
                {{ auditing ? '审查中...' : '开始审查' }}
              </view>
            </view>
          </view>
        </view>

        <view class="result-wrapper audit-result-section" v-if="auditContent">
          <view class="audit-result">
            <view class="result-header">
              <view class="result-title-box">
                <view class="result-title-line"></view>
                <view class="result-title-copy">
                  <text class="result-title">审查结果</text>
                  <text class="result-subtitle">已完成合同风险与条款严谨性分析</text>
                </view>
              </view>
              <view class="result-badge">DeepSeek</view>
            </view>
            <view class="result-summary">
              <view class="summary-item">
                <text class="summary-value">完成</text>
                <text class="summary-label">审查状态</text>
              </view>
              <view class="summary-divider"></view>
              <view class="summary-item">
                <text class="summary-value">结构化</text>
                <text class="summary-label">输出方式</text>
              </view>
              <view class="summary-divider"></view>
              <view class="summary-item">
                <text class="summary-value">需复核</text>
                <text class="summary-label">法律建议</text>
              </view>
            </view>
            <scroll-view class="result-content" scroll-y>
              <text selectable class="result-text">{{ auditContent }}</text>
            </scroll-view>
            <view class="result-actions" v-if="auditDocumentUrl">
              <view class="btn btn-primary result-document-btn" @click.stop="openAuditDocument">查看审查文档</view>
            </view>
          </view>
        </view>
      </template>
      <view v-else class="login-required">
        <view class="login-required-title">登录后使用合同审查</view>
        <view class="login-required-desc">上传合同文件后，可生成合同风险与条款严谨性审查意见。</view>
        <view class="login-required-btn" @click="goLogin">立即登录</view>
      </view>
    </view>
  </view>
</template>

<script>
import { auditDocument } from '@/api/file.js';
import { upload } from '@/api/oss.js';
import { mapState } from 'vuex';
import customNav from '@/components/custom-nav/custom-nav.vue';

export default {
  components: {
    customNav
  },
  data() {
    return {
      documentUrl: '',
      fileName: '',
      auditing: false,
      auditContent: '',
      auditDocumentUrl: ''
    };
  },
  computed: {
    ...mapState(['token']),
  },
  methods: {
    goLogin() {
      this.common.toLogin();
    },
    // 选择文件
    chooseFile() {
    if(!this.token){
        this.common.toLogin();
      return;
    }
      // #ifdef H5
      uni.chooseFile({
        count: 1,
        extension: ['.pdf', '.docx', '.txt'],
        success: (res) => {
          if (res.tempFiles[0]) {
            if (res.tempFiles[0].size / 1024 / 1024 > 5) {
              uni.showToast({
                title: '文件最大5M',
                icon: 'none'
              });
              return;
            }
            this.uploadFile(res.tempFiles[0]);
          }
        },
        fail: (err) => {
          if (err.errMsg.includes('cancel')) return;
          uni.showToast({
            title: '选择文件失败',
            icon: 'none'
          });
        }
      });
      // #endif
      
      // #ifdef MP-WEIXIN
      wx.chooseMessageFile({
        count: 1,
        type: 'file',
        success: (res) => {
          if (res.tempFiles[0]) {
            let index = res.tempFiles[0].name.lastIndexOf('.') + 1;
            let type = res.tempFiles[0].name.slice(index, res.tempFiles[0].name.length).toLowerCase();
            if (['pdf', 'docx', 'txt'].includes(type)) {
              if (res.tempFiles[0].size / 1024 / 1024 > 5) {
                uni.showToast({
                  title: '文件最大5M',
                  icon: 'none'
                });
                return;
              }
              this.uploadFile(res.tempFiles[0]);
            } else {
              uni.showToast({
                title: '仅支持 PDF、DOCX、TXT 格式',
                icon: 'none'
              });
            }
          }
        },
        fail: (err) => {
          if (err.errMsg.includes('cancel')) return;
          uni.showToast({
            title: '选择文件失败',
            icon: 'none'
          });
        }
      });
      // #endif
    },
    
    // 上传文件
    async uploadFile(file) {
      uni.showLoading({
        title: '上传中...'
      });
      
      try {
        const res = await upload([file]);
        if (res && res[0]) {
          this.documentUrl = res[0].url;
          this.fileName = file.name || '合同文件.docx';
          uni.hideLoading();
        } else {
          throw new Error('上传失败');
        }
      } catch (err) {
        uni.hideLoading();
        uni.showToast({
          title: '上传失败，请重试',
          icon: 'none'
        });
        console.error('上传文件失败:', err);
      }
    },
    
    // 开始审查
    async startAudit() {
      if (this.auditing) return;
      
      this.auditing = true;
      this.auditContent = '';
      this.auditDocumentUrl = '';
      
      uni.showLoading({
        title: '正在审查...'
      });
      
      try {
        const res = await auditDocument({
          documentUrl: this.documentUrl,
          question: '请对合同进行全面法律合规性与内容严谨性审核，输出结构化分析报告。具体要求如下：\n' +
            '1. 法律合规性审查：\n' +
            '- 依据 [国家 / 地区名称] 现行法律法规（如《民法典》《合同法》等），检查合同条款是否存在违法、无效或可撤销风险\n' +
            '- 重点核查合同主体资格、权利义务分配、违约责任、争议解决等核心条款合法性\n' +
            '- 识别潜在的法律风险点，如霸王条款、权利义务严重失衡、侵犯第三方权益等\n' +
            '2. 内容严谨性审查：\n' +
            '- 模糊用语专项审核：\n' +
            '- 排查合同中可能导致理解分歧的模糊词汇，如 "尽快""适当""合理期限" 等，判断其是否缺乏具体标准或量化指标\n' +
            '- 检查描述行为、条件、程度的用语是否表意清晰，避免因语义宽泛引发履行争议（例如 "重大损失" 需明确界定金额或比例）\n' +
            '- 审查指代不明的代词（如 ""该"）是否可能混淆合同主体或对象\n' +
            '- 常规内容审查：\n' +
            '- 检查合同条款表述是否清晰明确，无歧义或模糊表述\n' +
            '- 核查关键要素（金额、日期、履行标准等）是否完整且逻辑一致\n' +
            '- 确认合同条款之间无冲突，权利义务对应性强，履行流程可操作性高\n' +
            '3. 格式规范性审查：\n' +
            '- 验证合同结构是否完整（前言、正文、签署页等）\n' +
            '- 检查条款编号、排版、术语使用是否统一规范\n' +
            '4. 输出要求：\n' +
            '- 以「风险等级（高 / 中 / 低）+ 问题描述 + 法律依据 + 修改建议」的格式列出所有问题\n' +
            '- 若存在需重点关注的法律风险，请单独标注并说明潜在后果\n' +
            '- 对修改后的合同条款提供优化示例',
        });
        
        uni.hideLoading();
        this.auditing = false;
        
        // 处理返回数据
        let content = '';
        let responseData = res;
        if (typeof res === 'string') {
          try {
            responseData = JSON.parse(res);
            content = this.extractContent(responseData);
          } catch (e) {
            content = res;
          }
        } else {
          content = this.extractContent(responseData);
        }
        this.auditDocumentUrl = this.extractDocumentUrl(responseData);
        
        if (content) {
          this.auditContent = content;
        } else {
          throw new Error('未获取到审查结果');
        }
      } catch (err) {
        uni.hideLoading();
        this.auditing = false;
        uni.showToast({
          title: '审查失败，请重试',
          icon: 'none'
        });
        console.error('审查失败:', err);
      }
    },
    
    // 提取返回内容
    extractContent(data) {
      if (!data) return '';
      
      // 处理新的返回数据结构（带choices数组的情况）
      if (data.choices && data.choices.length > 0) {
        return data.choices[0].content || '';
      }
      
      // 处理旧的返回数据结构
      if (data.conversation && data.conversation.choices && 
          data.conversation.choices.length > 0) {
        return data.conversation.choices[0].content || '';
      }
      
      // 处理可能在data字段中的情况
      if (data.data) {
        return this.extractContent(data.data);
      }
      
      return '';
    },

    extractDocumentUrl(data) {
      if (!data) return '';
      if (typeof data === 'string') return '';
      if (data.documentUrl) return data.documentUrl;
      if (data.url) return data.url;
      if (data.data) return this.extractDocumentUrl(data.data);
      if (data.conversation) return this.extractDocumentUrl(data.conversation);
      return '';
    },

    openAuditDocument() {
      if (!this.auditDocumentUrl) return;

      // #ifdef H5
      window.open(this.auditDocumentUrl, '_blank');
      // #endif

      // #ifndef H5
      uni.downloadFile({
        url: this.auditDocumentUrl,
        success: (res) => {
          if (res.statusCode === 200) {
            uni.openDocument({
              filePath: res.tempFilePath,
              showMenu: true
            });
          }
        },
        fail: () => {
          uni.showToast({
            title: '打开文档失败',
            icon: 'none'
          });
        }
      });
      // #endif
    }
  }
};
</script>

<style lang="scss" scoped>
.page-base {
  min-height: 100vh;
  background-color: #E4EEFF;
  box-sizing: border-box;
  padding: 0;
  margin: 0;
  position: relative;
}

.top-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 816rpx;
  z-index: 0;
}

.top-bg-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.container {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100vh;
  box-sizing: border-box;
  padding-top: 32rpx;
  position: relative;
  z-index: 1;
}

/* #ifdef H5 */
.container {
  min-height: calc(100vh - 90rpx);
  padding-top: 32rpx;
}
/* #endif */

.content-box {
  margin-top: 30rpx;
  border-radius: 15rpx;
  padding: 20rpx 30rpx;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  position: relative;
}

.audit-upload-card {
  margin-bottom: 0;
}

/* #ifdef H5 */
.content-box {
  margin: 30rpx 28rpx 0;
  padding: 24rpx 28rpx 30rpx;
}
/* #endif */

.login-required {
  margin: 30rpx 28rpx 0;
  padding: 56rpx 36rpx;
  background: #ffffff;
  border-radius: 16rpx;
  box-shadow: 0 12rpx 34rpx rgba(38, 91, 160, 0.10);
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

.content-box-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.ai-assistant-box {
  display: flex;
  margin-bottom: 20rpx;
}

.assistant-avatar {
  width: 180rpx;
  height: 210rpx;
  margin-right: 10rpx;
  flex-shrink: 0;
  position: relative;
  margin-top: -56rpx;
}

.avatar-image {
  width: 100%;
  height: 100%;
}

.assistant-content {
  position: relative;
  width: 420rpx;
  height: 150rpx;
  flex: 1;
}


.assistant-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
.assistant-title,
.assistant-desc {
  // 这两个元素的 z-index 需要高于背景图
  position: relative; /* 必须设置，以使 z-index 生效 */
  z-index: 1; /* 确保文本在背景图之上 */
}

.assistant-title {
  font-size: 32rpx;
  font-weight: 500;
  color: #FFFFFF;
  margin-bottom: 8rpx;
  margin-top: 20rpx;
  margin-left: 30rpx;
}

.assistant-desc {
  font-size: 24rpx;
  color: #FFFFFF;
  line-height: 1.4;
  margin-top: 14rpx;
  margin-left: 30rpx;
  margin-right: 30rpx;
}

.assistant-desc-tips {
  font-size: 26rpx;
  color: #353D4B;
  line-height: 1.4;
  margin-left: 30rpx;
  margin-right: 30rpx;
  z-index: 1;
}

.upload-container {
  background-color: #fff;
  border-radius: 16rpx;
  min-height: 260rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2rpx dashed #4A8DFF;
  padding: 20rpx;
  margin-bottom: 20rpx;
  margin-top: 20rpx;
  z-index: 1;
}

.upload-area {
  width: 100%;
  padding: 20rpx;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.upload-icon-wrapper {
  width: 100rpx;
  height: 100rpx;
  margin-bottom: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-icon {
  width: 100rpx;
  height: 100rpx;
}

.upload-text {
  font-size: 26rpx;
  color: #317CFF;
  margin-bottom: 10rpx;
  font-weight: 500;
  text-align: center;
}

.upload-tip {
  font-size: 24rpx;
  color: #8D98A5;
  text-align: center;
}

.file-name {
  font-size: 28rpx;
  color: #333333;
  margin-top: 10rpx;
  word-break: break-all;
  text-align: center;
}

.file-actions {
  display: flex;
  justify-content: space-between;
  gap: 20rpx;
  margin-bottom: 10rpx;
}

/* #ifdef H5 */
.file-actions {
  margin-bottom: 28rpx;
}
/* #endif */

.result-wrapper {
  padding: 0 30rpx 40rpx;
  display: flex;
  flex-direction: column;
}

.audit-result-section {
  margin-top: 24rpx;
  border-top: 1rpx solid rgba(220, 233, 255, 0.8);
}

/* #ifdef H5 */
.result-wrapper {
  padding: 24rpx 28rpx 44rpx;
}
/* #endif */

.audit-result {
  background-color: #FFFFFF;
  border-radius: 24rpx;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 560rpx;
  box-shadow: 0 12rpx 34rpx rgba(38, 91, 160, 0.10);
  border: 1rpx solid #dce9ff;
}

/* #ifdef H5 */
.audit-result {
  min-height: 0;
}
/* #endif */

.result-header {
  padding: 28rpx 30rpx 22rpx;
  border-bottom: 1px solid #eef4ff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
}

.result-title-box {
  display: flex;
  align-items: flex-start;
}

.result-title-line {
  width: 6rpx;
  height: 64rpx;
  background-color: #317CFF;
  border-radius: 6rpx;
  margin-right: 16rpx;
  margin-top: 4rpx;
}

.result-title-copy {
  display: flex;
  flex-direction: column;
}

.result-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #1f2d3d;
  line-height: 40rpx;
}

.result-subtitle {
  margin-top: 8rpx;
  font-size: 22rpx;
  line-height: 30rpx;
  color: #7a8798;
}

.result-badge {
  height: 44rpx;
  padding: 0 18rpx;
  border-radius: 24rpx;
  background: #edf5ff;
  color: #317CFF;
  font-size: 22rpx;
  line-height: 44rpx;
  font-weight: 600;
}

.result-summary {
  margin: 22rpx 30rpx 0;
  height: 100rpx;
  border-radius: 18rpx;
  background: #f5f9ff;
  display: flex;
  align-items: center;
}

.summary-item {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.summary-value {
  font-size: 28rpx;
  line-height: 36rpx;
  color: #317CFF;
  font-weight: 700;
}

.summary-label {
  margin-top: 6rpx;
  font-size: 22rpx;
  line-height: 28rpx;
  color: #7a8798;
}

.summary-divider {
  width: 1px;
  height: 48rpx;
  background: #dce9ff;
}

.result-content {
  height: 560rpx;
  margin: 24rpx 30rpx 0;
  padding: 28rpx;
  box-sizing: border-box;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  border-radius: 18rpx;
  background: #ffffff;
  border: 1rpx solid #eef2f8;
}

/* #ifdef H5 */
.result-content {
  height: 660rpx;
  max-height: 44vh;
  margin: 24rpx 30rpx 0;
  padding: 34rpx 32rpx;
}
/* #endif */

.result-text {
  font-size: 27rpx;
  line-height: 1.78;
  white-space: pre-wrap;
  word-break: break-all;
  word-wrap: break-word;
  color: #2f3a4a;
  width: 100%;
  box-sizing: border-box;
  display: block;
}

.result-actions {
  padding: 24rpx 30rpx 30rpx;
}

.result-document-btn {
  width: 100%;
  flex: none;
}

.btn {
  height: 80rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  flex: 1;
  z-index: 1;
}

.btn-vice {
  background-color: #FFFFFF;
  color: #353D4B;
  border: 1px solid #D4D4D4;
}

.btn-primary {
  background-color: #317CFF;
  color: #FFFFFF;
  
  &.disabled {
    opacity: 0.6;
  }
}
</style> 

