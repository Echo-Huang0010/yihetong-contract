<!--
 * @Description: 邀请用户主页面
-->
<template>
    <view class="page">
      <!-- 顶部收益统计卡片 -->
      <view class="profit-card">
        <image class="profit-bg" :src="inviteBackground" mode="aspectFill" @error="handleInviteBackgroundError" />
        <view class="card-title-row">
          <text class="card-title">收益统计</text>
          <view class="history-link" @click="goToHistory">
            <text>历史提现</text>
            <uni-icons type="right" size="14" color="#FFFFFF"></uni-icons>
          </view>
        </view>
        <view class="profit-grid">
          <view class="profit-item">
            <text class="value">¥{{ formatAmount(distributorInfo.commission) }}</text>
            <text class="label">未提现金额</text>
          </view>
          <view class="divider"></view>
          <view class="profit-item">
            <text class="value">¥{{ formatAmount(distributorInfo.withdrawCommission) }}</text>
            <text class="label">已提现金额</text>
          </view>
        </view>
        <view class="withdraw-btn" @click="showWithdrawModal">
          <image class="withdraw-bg" src="/static/img_withdraw.svg" mode="aspectFill" />
          <text>提现</text>
          <uni-icons type="right" size="14" color="#FFFFFF"></uni-icons>
        </view>
      </view>

      <!-- 功能入口卡片 -->
      <view class="feature-card">
        <view class="feature-item" @click="goToCommissionRecords">
          <image class="feature-icon" src="https://resource.yi-types.com/new-sign/ic_trade.webp" mode="aspectFit" />
          <text class="feature-name">合同交易数据</text>
        </view>
        <view class="feature-item" @click="goToLowerUsers">
          <image class="feature-icon" src="https://resource.yi-types.com/new-sign/ic_shared.webp" mode="aspectFit" />
          <text class="feature-name">分享用户数据</text>
        </view>
      </view>

      <!-- 合同份额记录卡片 -->
      <view class="share-card">
        <CardHeader
          title="合同份额记录"
          moreText="查看更多"
          @more-click="goToShareRecords"
        />
        <view class="share-data">
          <view class="share-item">
            <text class="share-value color-primary">{{ contractSummary.num || 0 }}</text>
            <text class="share-label">当前总份额</text>
          </view>
          <view class="share-divider"></view>
          <view class="share-item">
            <text class="share-value color-primary">{{ contractSummary.dispatchedNum || 0 }}</text>
            <text class="share-label">已分配份额</text>
          </view>
        </view>
      </view>

      <!-- 分享按钮 -->
      <button class="share-btn" @click="showShareModal">
        分享{{ setting.appName }}电子签
      </button>

      <!-- 提现弹窗 -->
      <uni-popup ref="withdrawPopup" type="center">
        <view class="withdraw-modal">
          <view class="modal-title">提现</view>
          <view class="modal-content">
            <text class="available">可提现金额：¥{{ formatAmount(distributorInfo.commission) }}</text>
            <input
              type="digit"
              v-model="withdrawAmount"
              placeholder="请输入提现金额"
              class="withdraw-input"
            />
            <!-- 添加上传收款图片 -->
            <view class="upload-section">
              <text class="upload-label">奖励二维码截图</text>
              <view class="upload-area" @click="chooseImage" v-if="!paymentImage">
                <uni-icons type="camera" size="24" color="#999999"></uni-icons>
                <text class="upload-text">上传图片</text>
              </view>
              <view class="image-preview" v-else>
                <image :src="paymentImage" mode="aspectFit" class="preview-image" @click="previewImage" />
                <view class="delete-icon" @click.stop="deleteImage">
                  <uni-icons type="closeempty" size="20" color="#FFFFFF"></uni-icons>
                </view>
              </view>
            </view>
          </view>
          <view class="modal-footer">
            <view class="btn cancel" @click="closeWithdrawModal">取消</view>
            <view class="btn confirm" @click="confirmWithdraw">确认提现</view>
          </view>
        </view>
      </uni-popup>

      <!-- 分享弹窗 -->
      <uni-popup ref="sharePopup" type="bottom">
        <view class="share-modal">
          <!-- Logo和标题 -->
          <view class="share-header">
            <image class="logo" :src="setting.logoSquare || setting.logo" mode="aspectFit" />
            <text class="app-name">{{ setting.appName }}</text>
          </view>

          <!-- 小程序码 -->
          <view class="qrcode-section">
            <!-- 添加canvas元素，用于生成二维码 -->
            <canvas
              canvas-id="qrCodeCanvas"
              class="qr-canvas"
              style="width: 288px; height: 288px; visibility: hidden; position: absolute;"
            ></canvas>
            <image class="qrcode" :src="qrCodeUrl" mode="aspectFit" />
          </view>

          <!-- 邀请文案 -->
          <view class="invite-text">
            <text>邀请使用{{ setting.appName }}</text>
          </view>

          <!-- 底部按钮 -->
          <view class="share-actions">
            <!-- #ifdef MP-WEIXIN -->
            <button class="action-btn" open-type="share">
              <image class="action-icon" src="https://resource.yi-types.com/new-sign/ic_share_link.webp" mode="aspectFit" />
              <text class="action-text">分享链接</text>
            </button>
            <!-- #endif -->
            <!-- #ifdef H5 -->
            <view class="action-btn" @click="copyShareLink">
              <image class="action-icon" src="https://resource.yi-types.com/new-sign/ic_share_link.webp" mode="aspectFit" />
              <text class="action-text">分享链接</text>
            </view>
            <!-- #endif -->
            <view class="action-btn" @click="saveShareImage">
              <image class="action-icon" src="https://resource.yi-types.com/new-sign/ic_save_pic.webp" mode="aspectFit" />
              <text class="action-text">保存图片</text>
            </view>
          </view>
        </view>
      </uni-popup>

      <!-- 隐藏的canvas用于生成分享图片 -->
      <canvas
        canvas-id="shareCanvas"
        style="width: 600rpx; height: 1136rpx; position: absolute; left: -9999px; top: -9999px;"
      ></canvas>
    </view>
  </template>

  <script>
  // 导入API接口
  import {
    getDistributorInfo,
    withdraw,
    formatAmount,
    getContractSummary,
    getWxaCode
  } from '@/api/invite';
  import { upload } from '@/api/oss';
  import CardHeader from '@/components/CardHeader';
  import config from '@/config/index.js';
  import setting from '@/config/setting.js';
  import {
    buildMiniInviteShare,
    buildMiniInviteTimeline,
    shareOrCopyH5Invite,
  } from '@/utils/invite-share.js';

  const DEFAULT_INVITE_BACKGROUND = 'https://resource.yi-types.com/new-sign/img_revenue_statistics.webp';

  export default {
    components: { CardHeader },
    data() {
      return {
        setting,
        distributorInfo: {
          inviteCode: '',
          commission: 0,
          withdrawCommission: 0
        },
        contractSummary: {
          num: 0,
          dispatchedNum: 0
        },
        withdrawAmount: '',
        paymentImage: '', // 收款图片
        qrCodeUrl: '', // 小程序二维码URL
        qrCodeBase64: '', // 小程序码的base64数据
        inviteBackgroundFailed: false,
      }
    },
    onLoad() {
      const brandConfig = uni.getStorageSync('brandConfig') || setting;
      this.setting = {
        ...this.setting,
        ...brandConfig,
      };
      if (this.setting.inviteEnabled === false) {
        uni.showToast({
          title: '邀请用户功能已关闭',
          icon: 'none'
        });
        uni.switchTab({
          url: '/pages/user/index'
        });
        return;
      }
      // 获取数据
      this.loadData()
    },
    onShareAppMessage() {
      return buildMiniInviteShare(this.setting, this.distributorInfo.inviteCode);
    },
    onShareTimeline() {
      return buildMiniInviteTimeline(this.setting, this.distributorInfo.inviteCode);
    },
    computed: {
      inviteBackground() {
        return this.inviteBackgroundFailed
          ? DEFAULT_INVITE_BACKGROUND
          : (this.setting.inviteBackground || DEFAULT_INVITE_BACKGROUND);
      },
    },
    methods: {
      handleInviteBackgroundError() {
        this.inviteBackgroundFailed = true;
      },
      // 获取页面所需的数据
      async loadData() {
        uni.showLoading({
          title: '加载中'
        })

        try {
          // 获取分销信息
          await this.fetchDistributorInfo()
          // 获取合同份额信息
          await this.fetchContractSummary()
        } catch (err) {
          console.error('加载数据失败', err)
        } finally {
          uni.hideLoading()
        }
      },

      // 获取分销信息
      async fetchDistributorInfo() {
        try {
          const data = await getDistributorInfo()
          this.distributorInfo = data
        } catch (err) {
          // 错误处理已在request中统一处理
          console.error('获取分销信息失败', err)
        }
      },

      // 获取合同份额信息
      async fetchContractSummary() {
        try {
          const data = await getContractSummary()
          this.contractSummary = data
        } catch (err) {
          console.error('获取合同份额信息失败', err)
        }
      },

      // 跳转到历史提现页面
      goToHistory() {
        uni.navigateTo({
          url: '/pages/user/invite/transaction'
        })
      },

      // 跳转到合同交易数据页面
      goToCommissionRecords() {
        uni.navigateTo({
          url: '/pages/user/invite/commission-records'
        })
      },

      // 跳转到分享用户数据页面
      goToLowerUsers() {
        uni.navigateTo({
          url: '/pages/user/invite/lower-users'
        })
      },

      // 跳转到合同份额记录页面
      goToShareRecords() {
        uni.navigateTo({
          url: '/pages/user/invite/share-records'
        })
      },

      // 显示提现弹窗
      showWithdrawModal() {
        this.$refs.withdrawPopup.open()
      },

      // 关闭提现弹窗
      closeWithdrawModal() {
        this.$refs.withdrawPopup.close()
        this.withdrawAmount = ''
        this.paymentImage = ''
      },

      // 确认提现
      async confirmWithdraw() {
        if (!this.withdrawAmount) {
          uni.showToast({
            title: '请输入提现金额',
            icon: 'none'
          })
          return
        }

        const amount = parseFloat(this.withdrawAmount)
        if (isNaN(amount) || amount <= 0) {
          uni.showToast({
            title: '请输入正确的金额',
            icon: 'none'
          })
          return
        }

        // 转换为分
        const amountInCents = Math.floor(amount * 100)

        if (amountInCents > this.distributorInfo.commission) {
          uni.showToast({
            title: '提现金额不能大于可提现金额',
            icon: 'none'
          })
          return
        }

        if (!this.paymentImage) {
          uni.showToast({
            title: '请上传收款图片',
            icon: 'none'
          })
          return
        }

        uni.showLoading({
          title: '提交中'
        })

        try {
          await withdraw({
            amount: amountInCents,
            url: this.paymentImage
          })

          uni.showToast({
            title: '提现成功',
            icon: 'success'
          })

          // 刷新分销信息
          await this.fetchDistributorInfo()
          this.closeWithdrawModal()
        } catch (err) {
          // 错误处理已在request中统一处理
          console.error('提现失败', err)
        } finally {
          uni.hideLoading()
        }
      },

      // 格式化工具方法
      formatAmount,

      // 选择图片
      chooseImage() {
        uni.chooseImage({
          count: 1,
          sizeType: ['compressed'],
          sourceType: ['album', 'camera'],
          success: (res) => {
            // 获取临时文件路径
            const tempFilePath = res.tempFilePaths[0]

            // 上传图片到服务器
            this.uploadImage(tempFilePath)
          }
        })
      },

      // 上传图片
      async uploadImage(filePath) {
        uni.showLoading({
          title: '上传中'
        })

        try {
          // 构建文件对象列表 (oss.js的upload接口需要文件数组)
          const fileObj = {
            path: filePath
          }

          // 调用OSS上传接口
          const result = await upload([fileObj])

          if (result && result.length > 0) {
            // OSS接口返回的是包含url的对象数组
            this.paymentImage = result[0].url
            uni.showToast({
              title: '上传成功',
              icon: 'success'
            })
          } else {
            throw new Error('上传返回结果异常')
          }
        } catch (err) {
          console.error('上传失败', err)
          uni.showToast({
            title: '上传失败',
            icon: 'none'
          })
        } finally {
          uni.hideLoading()
        }
      },

      // 预览图片
      previewImage() {
        uni.previewImage({
          urls: [this.paymentImage],
          current: this.paymentImage
        })
      },

      // 删除图片
      deleteImage() {
        this.paymentImage = ''
      },

      // 显示分享弹窗
      showShareModal() {
        // 打开弹窗
        this.$refs.sharePopup.open()

        // 弹窗打开后生成二维码
        this.$nextTick(() => {
          this.generateQRCode()
        })
      },

      // 生成分享二维码
      async generateQRCode() {
        try {
          if (!this.distributorInfo.inviteCode) {
            uni.showToast({
              title: '邀请码获取失败',
              icon: 'none'
            })
            return
          }

          uni.showLoading({
            title: '生成中'
          })

          try {
            // 使用API获取小程序码
            const response = await getWxaCode()
            if (response) {
              const value = String(response).trim()
              this.qrCodeUrl = /^https?:\/\//i.test(value)
                ? value
                : config.getBasicsUrl() + (value.startsWith('/') ? value : '/' + value)
              this.qrCodeBase64 = ''
              uni.hideLoading()
            } else {
              throw new Error('获取小程序码失败：返回数据格式错误')
            }
          } catch (err) {
            console.error('获取小程序码失败', err)
            this.qrCodeUrl = ''
            this.qrCodeBase64 = ''
            uni.hideLoading()
            uni.showToast({
              title: '生成小程序码失败',
              icon: 'none'
            })
          }
        } catch (err) {
          console.error('生成小程序码失败', err)
          this.qrCodeUrl = ''
          this.qrCodeBase64 = ''
          uni.hideLoading()
        }
      },

      // 复制分享链接
      async copyShareLink() {
        try {
          const result = await shareOrCopyH5Invite(
            this.setting,
            this.distributorInfo.inviteCode
          );
          if (result === 'copied') {
            uni.showToast({ title: '链接已复制', icon: 'success' });
          }
        } catch (error) {
          uni.showToast({ title: '分享链接生成失败', icon: 'none' });
        }
      },

      // 保存分享图片
      saveShareImage() {
        uni.showLoading({
          title: '保存中'
        })

        try {
          if (!this.qrCodeUrl) {
            uni.showToast({
              title: '暂无图片可保存',
              icon: 'none'
            })
            uni.hideLoading()
            return
          }

          // #ifdef H5
          this.saveFullShareImage()
          return
          // #endif

          // #ifndef H5
          // 先获取用户授权设置
          uni.getSetting({
            success: (res) => {
              if (res.authSetting['scope.writePhotosAlbum']) {
                // 已授权，直接保存图片
                this.saveFullShareImage()
              } else if (res.authSetting['scope.writePhotosAlbum'] === false) {
                // 用户已拒绝授权，引导用户打开设置页面手动授权
                uni.hideLoading()
                uni.showModal({
                  title: '提示',
                  content: '保存图片需要授权相册权限，请在设置中开启',
                  confirmText: '去设置',
                  cancelText: '取消',
                  success: (res) => {
                    if (res.confirm) {
                      uni.openSetting({
                        success: (settingRes) => {
                          console.log('设置结果', settingRes)
                          if (settingRes.authSetting['scope.writePhotosAlbum']) {
                            this.saveFullShareImage()
                          }
                        }
                      })
                    } else {
                      uni.hideLoading()
                    }
                  }
                })
              } else {
                // 首次发起授权
                uni.authorize({
                  scope: 'scope.writePhotosAlbum',
                  success: () => {
                    this.saveFullShareImage()
                  },
                  fail: (err) => {
                    console.error('授权失败', err)
                    uni.hideLoading()
                    uni.showToast({
                      title: '授权失败，无法保存图片',
                      icon: 'none'
                    })
                  }
                })
              }
            },
            fail: (err) => {
              console.error('获取设置失败', err)
              uni.hideLoading()
              uni.showToast({
                title: '获取授权设置失败',
                icon: 'none'
              })
            }
          })
          // #endif
        } catch (err) {
          console.error('保存图片失败', err)
          uni.showToast({
            title: '保存失败',
            icon: 'none'
          })
          uni.hideLoading()
        }
      },

      // 保存完整的分享图片
      async saveFullShareImage() {
        try {
          const canvasId = 'shareCanvas';

          // 创建临时canvas绘制整个分享图
          let canvasWidth = 600;  // 弹窗宽度（rpx）
          let canvasHeight = 1136; // 上半部分高度（rpx）

          // rpx转px
          const systemInfo = uni.getSystemInfoSync();
          const ratio = systemInfo.windowWidth / 750;
          const pixelWidth = Math.floor(canvasWidth * ratio);
          const pixelHeight = Math.floor(canvasHeight * ratio);

          // 下载二维码图片
          const qrImagePromise = new Promise((resolve, reject) => {
            if (this.qrCodeUrl && this.qrCodeUrl.startsWith('http')) {
              uni.downloadFile({
                url: this.qrCodeUrl,
                success: res => {
                  if (res.statusCode === 200) {
                    resolve(res.tempFilePath);
                  } else {
                    reject(new Error('下载二维码失败'));
                  }
                },
                fail: err => {
                  reject(err);
                }
              });
            } else {
              // 如果已经是本地路径
              resolve(this.qrCodeUrl);
            }
          });

          // 等待二维码下载完成
          const qrImagePath = await qrImagePromise;

          // 创建canvas上下文
          const ctx = uni.createCanvasContext(canvasId, this);

          // 绘制品牌海报背景，避免依赖旧品牌远程图片
          ctx.setFillStyle('#1F6BFF');
          ctx.fillRect(0, 0, pixelWidth, pixelHeight);
          ctx.setFillStyle('#FFFFFF');
          ctx.setTextAlign('center');
          ctx.setFontSize(Math.floor(42 * ratio));
          ctx.fillText(this.setting.appName, pixelWidth / 2, Math.floor(170 * ratio));
          ctx.setFontSize(Math.floor(28 * ratio));
          ctx.fillText('便捷签署电子合同', pixelWidth / 2, Math.floor(220 * ratio));
          ctx.setFillStyle('#FFFFFF');
          ctx.fillRect(Math.floor(70 * ratio), Math.floor(610 * ratio), Math.floor(460 * ratio), Math.floor(410 * ratio));

          // 计算二维码位置
          const qrSize = Math.floor(240 * ratio);
          const qrX = (pixelWidth - qrSize) / 2;
          const qrY = Math.floor(680 * ratio);

          // 绘制二维码
          ctx.drawImage(qrImagePath, qrX, qrY, qrSize, qrSize);

          // 绘制完成
          ctx.draw(false, () => {
            setTimeout(() => {
              // 将canvas转换为临时文件
              uni.canvasToTempFilePath({
                canvasId: canvasId,
                success: (res) => {
                  // #ifdef H5
                  if (typeof document === 'undefined') {
                    throw new Error('当前浏览器不支持下载图片')
                  }
                  const downloadLink = document.createElement('a')
                  downloadLink.href = res.tempFilePath
                  downloadLink.download = `${this.setting.appName || '邀请'}-邀请二维码.png`
                  document.body.appendChild(downloadLink)
                  downloadLink.click()
                  document.body.removeChild(downloadLink)
                  uni.hideLoading()
                  uni.showToast({ title: '图片已下载', icon: 'success' })
                  // #endif

                  // #ifndef H5
                  // 保存到相册
                  uni.saveImageToPhotosAlbum({
                    filePath: res.tempFilePath,
                    success: () => {
                      uni.hideLoading();
                      uni.showToast({
                        title: '保存成功',
                        icon: 'success'
                      });
                    },
                    fail: (err) => {
                      console.error('保存到相册失败', err);
                      uni.hideLoading();
                      uni.showToast({
                        title: '保存失败: ' + (err.errMsg || '未知错误'),
                        icon: 'none'
                      });
                    }
                  });
                  // #endif
                },
                fail: (err) => {
                  console.error('canvas转图片失败', err);
                  uni.hideLoading();
                  uni.showToast({
                    title: '图片生成失败',
                    icon: 'none'
                  });
                }
              }, this);
            }, 500); // 延迟确保绘制完成
          });
        } catch (err) {
          console.error('绘制图片失败', err);
          uni.hideLoading();
          uni.showToast({
            title: '图片生成失败: ' + (err.message || '未知错误'),
            icon: 'none'
          });
        }
      },
    }
  }
  </script>

  <style lang="scss" scoped>
  .page {
    min-height: 100vh;
    background: #F3F3F3;
    padding: 30rpx;
    box-sizing: border-box;
  }

  .profit-card {
    position: relative;
    width: 690rpx;
    height: 400rpx;
    border-radius: 30rpx;
    margin-bottom: 30rpx;
    overflow: hidden;

    .profit-bg {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 0;
    }

    .card-title-row {
      position: relative;
      z-index: 1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 30rpx;
    }

    .card-title {
      font-size: 32rpx;
      color: #FFFFFF;
    }

    .history-link {
      display: flex;
      align-items: center;

      text {
        font-size: 24rpx;
        color: #FFFFFF;
        margin-right: 4rpx;
      }
    }

    .profit-grid {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 30rpx;
      margin-top: 30rpx;
    }

    .profit-item {
      flex: 1;
      text-align: center;

      .value {
        font-size: 52rpx;
        font-weight: bold;
        color: #FFFFFF;
        display: block;
        margin-bottom: 10rpx;
      }

      .label {
        font-size: 26rpx;
        color: #FFFFFF;
      }
    }

    .divider {
      width: 2rpx;
      height: 36rpx;
      background: #E5E5E5;
      margin: 0 30rpx;
    }

    .withdraw-btn {
      position: relative;
      z-index: 1;
      margin: 30rpx;
      height: 86rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 43rpx;
      overflow: hidden;

      .withdraw-bg {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 0;
      }

      text {
        position: relative;
        z-index: 1;
        font-size: 30rpx;
        color: #FFFFFF;
        margin-right: 8rpx;
      }

      uni-icons {
        position: relative;
        z-index: 1;
      }
    }
  }

  .feature-card {
    display: flex;
    justify-content: space-between;
    gap: 30rpx;
    margin-bottom: 30rpx;

    .feature-item {
      flex: 1;
      height: 200rpx;
      background: #FFFFFF;
      border-radius: 30rpx;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      .feature-icon {
        width: 96rpx;
        height: 96rpx;
        margin-bottom: 16rpx;
      }

      .feature-name {
        font-size: 30rpx;
        color: #353D4B;
      }
    }
  }

  .share-card {
    background: #FFFFFF;
    border-radius: 30rpx;
    padding: 30rpx;
    height: 260rpx;
    margin-bottom: 30rpx;
    box-sizing: border-box;

    .share-data {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 30rpx;
    }

    .share-item {
      flex: 1;
      text-align: center;

      .share-value {
        font-size: 48rpx;
        color: #FF6565;
        font-weight: bold;
        display: block;
        margin-bottom: 10rpx;
      }

      .share-label {
        font-size: 24rpx;
        color: #353D4B;
      }
    }

    .share-divider {
      width: 2rpx;
      height: 36rpx;
      background: #E5E5E5;
      margin: 0 30rpx;
    }
  }

  .share-btn {
    width: 690rpx;
    height: 88rpx;
    background: #317CFF;
    border-radius: 30rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32rpx;
    color: #FFFFFF;
    margin-bottom: 30rpx;
    padding: 0 30rpx;
    border: none;

    &::after {
      border: none;
    }
  }

  .withdraw-modal {
    background: #ffffff;
    border-radius: 24rpx;
    width: 600rpx;
    padding: 32rpx;

    .modal-title {
      font-size: 32rpx;
      text-align: center;
      margin-bottom: 32rpx;
      color: #333333;
    }

    .modal-content {
      .available {
        font-size: 28rpx;
        color: #666666;
        margin-bottom: 16rpx;
        display: block;
      }

      .withdraw-input {
        height: 88rpx;
        background: #f5f5f5;
        border-radius: 12rpx;
        padding: 0 24rpx;
        font-size: 28rpx;
        color: #333333;
        margin-bottom: 24rpx;

        &::placeholder {
          color: #999999;
        }
      }

      .upload-section {
        margin-top: 8rpx;

        .upload-label {
          font-size: 28rpx;
          color: #666666;
          margin-bottom: 16rpx;
          display: block;
        }

        .upload-area {
          height: 200rpx;
          background: #f5f5f5;
          border-radius: 12rpx;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;

          .upload-text {
            font-size: 28rpx;
            color: #999999;
            margin-top: 16rpx;
          }
        }

        .image-preview {
          position: relative;
          width: 100%;
          height: 200rpx;
          border-radius: 12rpx;
          overflow: hidden;

          .preview-image {
            width: 100%;
            height: 100%;
          }

          .delete-icon {
            position: absolute;
            top: 8rpx;
            right: 8rpx;
            width: 40rpx;
            height: 40rpx;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        }
      }
    }

    .modal-footer {
      margin-top: 32rpx;
      display: flex;
      justify-content: space-between;
      gap: 24rpx;

      .btn {
        flex: 1;
        height: 88rpx;
        border-radius: 44rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32rpx;

        &.cancel {
          background: #f5f5f5;
          color: #666666;
        }

        &.confirm {
          background: #317CFF;
          color: #ffffff;
          letter-spacing: 2rpx;
        }
      }
    }
  }

  .share-modal {
    background: #FFFFFF;
    width: 100%;
    height: 800rpx;
    padding: 30rpx;
    border-radius: 15rpx 15rpx 0 0;
    display: flex;
    flex-direction: column;
    align-items: center;

    .share-header {
      display: flex;
      align-items: center;
      margin-bottom: 30rpx;

      .logo {
        width: 88rpx;
        height: 88rpx;
        margin-right: 10rpx;
      }

      .app-name {
        font-size: 36rpx;
        color: #353D4B;
        font-weight: bold;
      }
    }

    .qrcode-section {
      position: relative;
      margin-bottom: 20rpx;

      .qr-canvas {
        position: absolute;
        visibility: hidden;
        z-index: -1;
      }

      .qrcode {
        width: 288rpx;
        height: 288rpx;
      }
    }

    .invite-text {
      margin-bottom: 30rpx;

      text {
        font-size: 36rpx;
        color: #353D4B;
      }
    }

    .share-actions {
      display: flex;
      width: 100%;
      gap: 20rpx;

      .action-btn {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        border: none;

        &::after {
          border: none;
        }

        .action-icon {
          width: 92rpx;
          height: 92rpx;
        }

        .action-text {
          margin-top: 10rpx;
          font-size: 26rpx;
          font-weight: bold;
          color: #353D4B;
        }
      }
    }
  }
  </style>
