<template>
  <view class="my-document-detail-page">
    
    <view class="document-container">
      <!-- 文书标题 -->
      <view class="document-header">
        <text class="document-title">{{ documentData.title }}</text>
      </view>
      
      <!-- 文书内容 -->
      <view class="document-content">
        <!-- 编辑模式 -->
        <view v-if="editMode" class="edit-container">
          <textarea 
            class="edit-area"
            v-model="editContent"
            placeholder="请编辑文书内容"
            :maxlength="-1"
            show-confirm-bar="false"
          />
        </view>
        <!-- 查看模式 -->
        <view v-else class="view-container">
          <rich-text class="content-text rich-document-content" :nodes="renderedDocumentContent"></rich-text>
        </view>
      </view>
    </view>
    
    <!-- 底部操作按钮 -->
    <view class="bottom-actions">
      <!-- 编辑模式下的按钮 -->
      <view v-if="editMode" class="action-buttons">
        <view class="btn btn-cancel" @click="cancelEdit">取消</view>
        <view class="btn btn-primary" @click="saveAndInitiate">保存并发起签署</view>
      </view>
      <!-- 查看模式下的按钮 -->
      <view v-else class="action-buttons">
        <view class="btn btn-edit" @click="enterEditMode">编辑</view>
        <view class="btn btn-primary" @click="initiateSignature">发起签署</view>
      </view>
    </view>
    
    <!-- 加载状态 -->
    <view class="loading-mask" v-if="loading">
      <view class="loading-spinner"></view>
      <text class="loading-text">加载中...</text>
    </view>
  </view>
</template>

<script>
import { getUserDocumentDetail } from '@/api/content.js';
import { generateContract, generateWordContract, create } from '@/api/file.js';
import customNav from '@/components/custom-nav/custom-nav.vue';
import { processRichText } from '@/utils/richText.js';

export default {
  components: {
    customNav
  },
  data() {
    return {
      id: '',
      loading: false,
      editMode: false,
      documentData: {
        title: '',
        content: '',
        fileUrl: '',
        fileType: ''
      },
      editContent: '',
      savingFormat: false
    };
  },
  computed: {
    renderedDocumentContent() {
      return processRichText(this.documentData.content || '');
    }
  },
  onLoad(options) {
    if (options.id) {
      this.id = options.id;
      this.getDocumentDetail();
    } else {
      uni.showToast({
        title: '参数错误',
        icon: 'none'
      });
      setTimeout(() => {
        uni.navigateBack();
      }, 1500);
    }
  },
  methods: {
    // 获取文书详情
    async getDocumentDetail() {
      this.loading = true;
      try {
        const res = await getUserDocumentDetail(this.id);
        
        if (res) {
          this.documentData = {
            title: res.title || '',
            content: res.content || '',
            fileUrl: res.fileUrl || '',
            fileType: res.fileType || ''
          };
          // 初始化编辑内容
          this.editContent = this.documentData.content;
        } else {
          uni.showToast({
            title: '获取文书详情失败',
            icon: 'none'
          });
        }
      } catch (error) {
        console.error('获取文书详情异常:', error);
        uni.showToast({
          title: '获取文书详情失败',
          icon: 'none'
        });
      } finally {
        this.loading = false;
      }
    },
    
    // 进入编辑模式
    enterEditMode() {
      this.editMode = true;
      // 确保内容完整复制
      this.editContent = this.documentData.content;
    },
    
    // 取消编辑
    cancelEdit() {
      this.editMode = false;
      this.editContent = this.documentData.content; // 恢复原内容
    },
    
    // 保存编辑并发起签署
    saveAndInitiate() {
      if (this.editContent.trim() === '') {
        uni.showToast({
          title: '文书内容不能为空',
          icon: 'none'
        });
        return;
      }
      
      // 更新内容
      this.documentData.content = this.editContent;
      this.editMode = false;
      
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
      console.log('this.editContent',this.editContent);
      // 调用对应接口生成文档
      saveApi({
        content: this.editContent,
        fileName: fileName
      }).then(res => {
        console.log("保存结果:", res);
        
        // 创建文件记录
        const fileObj = {
          name: res.fileName || fileName,
          url: res.documentUrl
        };
        
        // 创建文件记录
        create(fileObj).then(result => {
          this.savingFormat = false;
          uni.hideLoading();
          
          // 获取返回的文件信息，准备发起签署
          const fileInfo = {
            id: result.id || this.id,
            name: res.fileName || fileName,
            url: res.documentUrl,
            size: res.fileSize || 0,
            from: 'myDocument'
          };
          
          // 使用全局数据存储文件信息
          getApp().globalData = getApp().globalData || {};
          getApp().globalData.tempFileInfo = fileInfo;
          
          // 跳转到发起签署页面
          uni.navigateTo({
            url: '/pages/contract/sign/index?fromMyDocument=true'
          });
          
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
    
    // 生成文件名
    generateFileName() {
      try {
        // 使用文档标题作为文件名
        let title = this.documentData.title || '文书';
        
        // 如果标题过长则截取
        const fileName = title.length > 15 ? title.substring(0, 15) + '...' : title;
        
        // 添加时间信息
        const now = new Date();
        const timeStr = `${now.getMonth()+1}月${now.getDate()}日${now.getHours()}时${now.getMinutes()}分`;
        
        return `${fileName}-${timeStr}`;
      } catch (err) {
        console.error('生成文件名错误:', err);
        // 出错时返回默认文件名
        const now = new Date();
        return `文书-${now.getFullYear()}${now.getMonth()+1}${now.getDate()}${now.getHours()}${now.getMinutes()}`;
      }
    },
    
    // 发起签署
    initiateSignature() {
      // 如果有文件URL，直接使用
      if (this.documentData.fileUrl) {
        const fileInfo = {
          id: this.id,
          name: this.documentData.title,
          url: this.documentData.fileUrl,
          size: 0,
          from: 'myDocument'
        };
        
        // 使用全局数据存储文件信息
        getApp().globalData = getApp().globalData || {};
        getApp().globalData.tempFileInfo = fileInfo;
        
        // 跳转到发起签署页面
        uni.navigateTo({
          url: '/pages/contract/sign/index?fromMyDocument=true'
        });
      } else {
        // 如果没有文件URL，需要先保存
        this.showFormatSelectPopup();
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.my-document-detail-page {
  padding-top: 30rpx;
  min-height: 100vh;
  background-color: #F3F3F3;
  padding-bottom: 150rpx;
  position: relative;
}

.document-container {
  margin: 30rpx;
  background-color: #FFFFFF;
  border-radius: 30rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  height: calc(100vh - var(--status-bar-height) - 100rpx - 60rpx - 150rpx);
}

.document-header {
  padding: 30rpx;
  border-bottom: 1rpx solid #E8E8E8;
  
  .document-title {
    font-size: 34rpx;
    color: #353D4B;
    font-weight: 500;
  }
}

.document-content {
  flex: 1;
  overflow: auto;
  padding: 30rpx;
}

.edit-container {
  height: 100%;
  width: 100%;
}

.edit-area {
  width: 100%;
  height: 100%;
  font-size: 28rpx;
  line-height: 1.6;
  color: #333333;
  padding: 0;
  box-sizing: border-box;
}

.view-container {
  width: 100%;
  height: 100%;
}

.content-text {
  display: block;
  font-size: 28rpx;
  line-height: 1.78;
  color: #333333;
  width: 100%;
  white-space: pre-wrap;
  word-break: break-word;
}

.rich-document-content :deep(p) {
  margin: 0 0 18rpx;
}

.rich-document-content :deep(h1),
.rich-document-content :deep(h2),
.rich-document-content :deep(h3) {
  margin: 24rpx 0 16rpx;
  color: #1f2d3d;
  font-weight: 700;
}

.rich-document-content :deep(ul),
.rich-document-content :deep(ol) {
  padding-left: 36rpx;
  margin: 16rpx 0;
}

.rich-document-content :deep(table) {
  width: 100%;
  margin: 18rpx 0;
  border-collapse: collapse;
}

.rich-document-content :deep(td),
.rich-document-content :deep(th) {
  padding: 12rpx;
  border: 1rpx solid #dce3ee;
}

.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background-color: #FFFFFF;
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  box-shadow: 0 -4rpx 12rpx rgba(0, 0, 0, 0.05);
  z-index: 100;
}

.action-buttons {
  display: flex;
  justify-content: space-between;
}

.btn {
  height: 88rpx;
  border-radius: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
  flex: 1;
}

.btn-edit, .btn-cancel {
  background-color: #FFFFFF;
  color: #353D4B;
  border: 1rpx solid #D4D4D4;
  margin-right: 30rpx;
}

.btn-primary {
  background-color: #317CFF;
  color: #FFFFFF;
}

/* 加载状态 */
.loading-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-spinner {
  width: 80rpx;
  height: 80rpx;
  border: 4rpx solid #FFFFFF;
  border-top-color: #317CFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  margin-top: 20rpx;
  font-size: 28rpx;
  color: #FFFFFF;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style> 
