<!--
 * @Description: AI生成合同页面
 * @LastEditTime: 2023-12-14 16:09:43
 * @LastEditors: wudi
 * @Author: AI助手
-->
<template>
  <view class="page-base">
    <view class="top-bg">
      <image class="top-bg-image" src="https://resource.yi-types.com/new-sign/bg_robot_top.webp" mode="aspectFit" />
    </view>
    <!-- #ifdef H5 -->
      <custom-nav title="生成合同" :showBack="true" transparent class="generate-nav"></custom-nav>
      <!-- #endif -->
    <view v-if="token" class="container">
      <!-- 上部分内容区，仅在初始状态显示 -->
      <view class="content-box" v-if="!documentContent">
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
          根据你的提示词，免费为您生成对应合同模版，该内容仅供参考，需要更专业意见可联系平台获得专业服务支持
        </view>
        <view class="input-container">
          <view class="input-area-wrapper">
            <textarea
              class="input-area"
              v-model="prompt"
              placeholder="请输入您需要生成的合同描述，例如：生成一份租房合同"
              :maxlength="200"
              @input="onInput"
            />
            <view class="text-count">{{ prompt.length }}/200</view>
          </view>
        </view>

        <view class="file-actions">
          <view class="btn btn-vice" @click="navigateBack">取消</view>
          <view class="btn btn-primary" @click="generate" :class="{ disabled: !canGenerate }">
            {{ loading ? '生成中...' : '生成合同' }}
          </view>
        </view>
      </view>

      <view class="document-container" v-else>
        <view class="document-content">
          <view v-if="editMode" class="edit-container">
            <textarea
              class="edit-area"
              v-model="editContent"
              placeholder="请编辑合同内容"
              :maxlength="-1"
              show-confirm-bar="false"
            />
          </view>
          <view v-else class="view-container">
            <text v-if="documentContent" selectable class="result-text">{{ documentContent }}</text>
            <view v-else class="empty-result">
              <text class="empty-title">暂无生成内容</text>
              <text class="empty-desc">请返回后重新填写合同需求。</text>
            </view>
          </view>
        </view>

        <!-- 底部操作按钮 -->
        <view class="document-actions">
          <view v-if="!editMode" class="file-actions">
            <view class="btn btn-vice" @click="navigateBack">取消</view>
            <view class="btn btn-vice" @click="enterEditMode">编辑</view>
            <view class="btn btn-primary" @click="saveDocumentToFile">保存</view>
          </view>
          <view v-else class="file-actions">
            <view class="btn btn-vice" @click="cancelEdit">取消</view>
            <view class="btn btn-primary" @click="saveEdit">保存</view>
          </view>
        </view>
      </view>
    </view>
    <view v-else class="container">
      <view class="login-required">
        <view class="login-required-title">登录后生成合同</view>
        <view class="login-required-desc">输入合同需求后，可生成合同草稿并继续编辑保存。</view>
        <view class="login-required-btn" @click="goLogin">立即登录</view>
      </view>
    </view>
  </view>
</template>

<script>
import { aiGenerateContract, generateContract, generateWordContract } from '@/api/file.js';
import { upload } from '@/api/oss.js';
import { create } from '@/api/file.js';
import { mapState } from 'vuex';
import customNav from '@/components/custom-nav/custom-nav.vue';

export default {
  components: {
    customNav
  },
  data() {
    return {
      prompt: '',
      loading: false,
      previewMode: false,
      documentContent: '',
      editMode: false,
      editContent: '',
      documentUrl: '',
      fileName: '',
      showFormatPopup: false,
      selectedFormat: '',
      savingFormat: false
    };
  },
  computed: {
    // 输入是否为空
    isEmpty() {
      return this.prompt.trim() === '';
    },
    // 当前输入长度
    currentLength() {
      return this.prompt.length;
    },
    // 是否超出最大长度
    isOverLength() {
      return this.currentLength > 200;
    },
    // 是否可以生成文档
    canGenerate() {
      return !this.isEmpty && !this.isOverLength && !this.loading;
    },
    ...mapState(['token'])
  },
  methods: {
    goLogin() {
      this.common.toLogin();
    },
    navigateBack() {
      uni.navigateBack();
    },
    onInput(e) {
      // 限制字数
      if (this.prompt.length > 200) {
        this.prompt = this.prompt.slice(0, 200);
      }
    },
    generate() {
      if(!this.token){
        this.common.toLogin();
        return;
      }
      if (!this.canGenerate) {
        return;
      }

      this.loading = true;
      uni.showLoading({
        title: '正在生成内容，请稍后...'
      });

      // 调用AI接口生成合同
      aiGenerateContract({
        messages: [
          {
            role: "user",
            content: this.prompt
          }
        ],
        temperature: 0.7,
        stream: false,
        maxTokens: 4096
      }).then(res => {
        uni.hideLoading();
        this.loading = false;

        // 当API返回的是JSON字符串时尝试解析
        if (typeof res === 'string') {
          try {
            res = JSON.parse(res);
          } catch (e) {
            console.error('解析返回数据失败:', e);
          }
        }

        // 处理可能在data字段中的情况
        let data = res;
        if (res && res.data) {
          data = res.data;
        }

        // 获取生成的内容
        let content = '';

        // 处理新的返回数据结构（带choices数组的情况）
        if (data.choices && data.choices.length > 0) {
          // 取第一个choice的内容作为预览
          content = data.choices[0].content || '';
        }
        // 处理旧的返回数据结构
        else if (data.conversation && data.conversation.choices &&
                 data.conversation.choices.length > 0) {
          content = data.conversation.choices[0].content || '';
        }

        // 如果有内容，展示结果
        if (content) {
          this.documentContent = content;
          this.previewMode = false; // 不进入预览模式
          this.editMode = false; // 不进入编辑模式
          this.editContent = this.documentContent; // 保存一份可编辑的内容副本
        } else {
          uni.showToast({
            title: '生成失败，请重试',
            icon: 'none'
          });
          console.error('返回数据不包含documentUrl:', data);
        }
      }).catch(err => {
        uni.hideLoading();
        this.loading = false;
        uni.showToast({
          title: '生成失败，请重试',
          icon: 'none'
        });
        console.error('生成合同失败:', err);
      });
    },

    // 进入编辑模式
    enterEditMode() {
      this.editMode = true;
      this.previewMode = false;

      // 确保内容完整复制
      this.$nextTick(() => {
        setTimeout(() => {
          this.editContent = this.documentContent;
        }, 100);
      });
    },

    // 取消编辑，返回预览模式
    cancelEdit() {
      this.editMode = false;
      this.previewMode = true;
      this.editContent = this.documentContent; // 恢复原内容
    },

    // 保存编辑内容
    saveEdit() {
      if (this.editContent.trim() === '') {
        uni.showToast({
          title: '文档内容不能为空',
          icon: 'none'
        });
        return;
      }

      this.documentContent = this.editContent;
      this.editMode = false;
      this.previewMode = true;

      // 直接保存编辑后的内容
      this.saveDocumentToFile();
    },

    // 保存文档
    saveDocumentToFile() {
      if (!this.documentContent) {
        uni.showToast({
          title: '文档内容不存在，无法保存',
          icon: 'none'
        });
        return;
      }

      // 显示格式选择弹窗
      this.showFormatSelectPopup();
    },

    // 显示格式选择弹窗
    showFormatSelectPopup() {
      uni.showActionSheet({
        itemList: ['保存为Word文档', '保存为PDF文档'],
        success: (res) => {
          // 根据用户选择调用对应接口
          if (res.tapIndex === 0) {
            this.saveAsFormat('word');
          } else if (res.tapIndex === 1) {
            this.saveAsFormat('pdf');
          }
        },
        fail: (err) => {
          console.log('用户取消选择');
        }
      });
    },

    // 根据选择的格式保存文档
    saveAsFormat(format) {
      if (this.savingFormat) return;
      this.savingFormat = true;

      uni.showLoading({
        title: '保存中...'
      });

      const fileName = this.generateFileName();

      // 根据格式选择接口
      const saveApi = format === 'word' ? generateWordContract : generateContract;

      // 调用对应接口生成文档
      saveApi({
        content: this.documentContent,
        fileName: fileName
      }).then(res => {
        console.log("res", res);
        // 创建文件记录
        const fileObj = {
          name: res.fileName || fileName,
          url: res.documentUrl
        };

        // 创建文件记录
        create(fileObj).then(result => {
          this.savingFormat = false;
          uni.hideLoading();
          uni.showToast({
            title: '保存成功',
            icon: 'success'
          });

          // 返回上一页
          setTimeout(() => {
            // 返回并刷新上一页
            uni.navigateBack({
              delta: 1,
              success: function() {
                // 发送事件通知文件列表更新
                uni.$emit('refreshFileList');
              }
            });
          }, 1500);
        }).catch(err => {
          this.savingFormat = false;
          uni.hideLoading();
          uni.showToast({
            title: '保存失败，请重试',
            icon: 'none'
          });
          console.error('创建文件记录失败:', err);
        });
      }).catch(err => {
        this.savingFormat = false;
        uni.hideLoading();
        uni.showToast({
          title: '保存失败，请重试',
          icon: 'none'
        });
        console.error('保存文件失败:', err);
      });
    },

    generateFileName() {
      try {
        // 如果prompt为空（可能是直接保存documentUrl的情况），使用默认内容
        let promptText = this.prompt || 'AI生成文档';

        // 提取关键词作为文件名，如果过长则截取
        const keywords = promptText.split(/[，。：；？！,.:;?!]/)[0];
        const fileName = keywords.length > 15 ? keywords.substring(0, 15) + '...' : keywords;

        // 添加时间信息
        const now = new Date();
        const timeStr = `${now.getMonth()+1}月${now.getDate()}日${now.getHours()}时${now.getMinutes()}分`;

        return `AI生成-${fileName}-${timeStr}`;
      } catch (err) {
        console.error('生成文件名错误:', err);
        // 出错时返回默认文件名
        const now = new Date();
        return `AI生成文档-${now.getFullYear()}${now.getMonth()+1}${now.getDate()}${now.getHours()}${now.getMinutes()}`;
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.page-base {
  height: 100vh;
  background-color: #E4EEFF;
  box-sizing: border-box;
  padding: 0;
  margin: 0;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
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
  flex: 1;
  min-height: 0;
  width: 100%;
  box-sizing: border-box;
  padding-top: 32rpx;
  position: relative;
  z-index: 1;
}

/* #ifdef H5 */
.container {
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

.assistant-avatar-small {
  width: 90rpx;
  height: 105rpx;
  margin-right: 10rpx;
  flex-shrink: 0;
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
  padding: 0;
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

.input-container {
  background-color: #FFFFFF;
  border-radius: 16rpx;
  min-height: 260rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid #E7E7E7;
  padding: 20rpx;
  margin-bottom: 20rpx;
}

.input-area-wrapper {
  width: 100%;
  height: 260rpx;
  position: relative;
}

.input-area {
  width: 100%;
  height: 100%;
  padding: 20rpx;
  box-sizing: border-box;
  font-size: 28rpx;
  background-color: #FFFFFF;
  border-radius: 16rpx;
  border: 2rpx dashed #4A8DFF;
}

.text-count {
  position: absolute;
  right: 20rpx;
  bottom: 20rpx;
  font-size: 24rpx;
  color: #999999;
}

.preview-container {
  background-color: #FFF9F9;
  border-radius: 16rpx;
  min-height: 260rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2rpx dashed #F29B9B;
  padding: 20rpx;
  margin-bottom: 20rpx;
}

.preview-area {
  width: 100%;
  padding: 20rpx;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
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
  width: 100%;
}

/* 文档容器样式 */
.document-container {
  flex: 1;
  min-height: 0;
  width: calc(100% - 60rpx);
  margin: 24rpx 30rpx 30rpx;
  background-color: #FFFFFF;
  border-radius: 26rpx;
  overflow: hidden;
  box-shadow: 0 12rpx 28rpx rgba(37, 99, 235, 0.08);
  display: flex;
  flex-direction: column;
  border: 1rpx solid #d7e5ff;
}

.document-content {
  flex: 1;
  overflow: auto;
  padding: 30rpx;
}

.document-actions {
  padding: 20rpx 30rpx;
  border-top: 1px solid #EEEEEE;
  background-color: #FFFFFF;
}

.edit-container {
  height: 100%;
  width: 100%;
  min-height: 0;
}

.view-container {
  width: 100%;
  height: 100%;
}

.edit-area {
  width: 100% !important;
  height: 100% !important;
  min-height: 100% !important;
  font-size: 28rpx;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
  padding: 0;
  margin: 0;
  box-sizing: border-box;
  border: none;
  outline: none;
  background-color: #FFFFFF;
}

::v-deep .edit-area .uni-textarea-wrapper,
::v-deep .edit-area textarea,
::v-deep .edit-area .uni-textarea-textarea {
  min-height: 100% !important;
  height: 100% !important;
  line-height: 1.6 !important;
}

.result-text {
  font-size: 28rpx;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
  word-wrap: break-word;
  color: #333333;
  width: 100%;
  box-sizing: border-box;
  display: block;
}

.empty-result {
  min-height: 320rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #6e7c93;
}

.empty-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #1f2d3d;
}

.empty-desc {
  margin-top: 12rpx;
  font-size: 24rpx;
}

.btn {
  height: 80rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  flex: 1;
}

.btn-vice {
  background-color: #FFFFFF;
  color: #353D4B;
  border: 1px solid #D4D4D4;
  z-index: 1;
}

.btn-primary {
  z-index: 1;
  background-color: #FF6565;
  color: #FFFFFF;

  &.disabled {
    opacity: 0.6;
  }
}
</style>

