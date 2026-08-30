<template>
  <view class="contract-video-page" :class="{ 'contract-video-page-h5': isH5UploadMode }">
    <view class="contract-video-tip-card">
      <view class="text-28 bold color-base">{{ isH5UploadMode ? '签署前视频上传' : '签署前视频录制' }}</view>

      <!-- 音频播放条 -->
      <view class="contract-video-audio-bar" v-if="audioUrl">
        <view class="contract-video-audio-control" @click="toggleAudioPlay">
          <text class="contract-video-audio-text">{{ audioPlaying ? '暂停' : '播放' }}</text>
        </view>
        <view class="contract-video-audio-slider">
          <slider
            :value="audioProgress"
            :max="1000"
            activeColor="#317CFF"
            :blockSize="14"
            :disabled="!audioLoaded"
            @change="onAudioSeek"
            @changing="onAudioSeeking"
          />
        </view>
        <view class="contract-video-audio-time text-24 color-grey-minor">
          {{ formatAudioTime(currentAudioTime) }} / {{ formatAudioTime(audioDuration) }}
        </view>
      </view>

      <scroll-view
        v-if="question"
        scroll-y
        class="contract-video-question text-26 color-grey-minor"
        :scroll-top="questionScrollTop"
        :style="{ maxHeight: audioUrl ? '480rpx' : '360rpx' }"
      >
        <view class="contract-video-question-inner">
          <text
            v-for="(line, li) in questionLines"
            :key="li"
            class="contract-video-question-line"
            :class="{ 'question-line-active': li === currentQuestionLine }"
          >
            {{ line }}
          </text>
        </view>
      </scroll-view>

      <view class="contract-video-duration-info text-24 color-grey-minor" v-if="suggestedDuration">
        <text>建议录制时长 {{ suggestedDuration }} 秒</text>
      </view>

      <view class="contract-video-rule-list" v-if="rules.length > 1 && !videoUrl">
        <view
          class="contract-video-rule-item"
          :class="{ active: String(rule.id) === String(ruleId) }"
          v-for="rule in rules"
          :key="rule.id"
          @click="selectVideoRule(rule)"
        >
          <view class="contract-video-rule-title">视频规则 {{ rule.id }}</view>
          <view class="contract-video-rule-desc">{{ rule.question }}</view>
        </view>
      </view>
    </view>

    <!-- #ifdef MP-WEIXIN -->
    <view class="contract-video-area" v-if="!videoUrl">
      <camera
        id="contractVideoCamera"
        device-position="front"
        flash="off"
        class="contract-video-camera"
        resolution="medium"
        @initdone="cameraReady = true"
        @error="handleCameraError"
        :style="{ height: cameraHeight + 'px' }"
      >
        <cover-view class="contract-video-camera-tip" v-if="!isRecording">
          <cover-view class="text-26">请正对摄像头</cover-view>
        </cover-view>
        <cover-view class="contract-video-recording-tip" v-if="isRecording">
          <cover-view class="contract-video-recording-dot"></cover-view>
          <cover-view class="text-26">{{ recordingTime }}s</cover-view>
        </cover-view>
        <cover-view class="contract-video-evidence-overlay" v-if="isRecording && (audioUrl || question)">
          <cover-view class="contract-video-evidence-title">提示内容录制中</cover-view>
          <cover-view class="contract-video-evidence-audio" v-if="audioUrl">
            <cover-view class="contract-video-evidence-label">{{ audioPlaying ? '语音播放中' : '语音提示' }}</cover-view>
            <cover-view class="contract-video-evidence-track">
              <cover-view
                class="contract-video-evidence-track-inner"
                :style="{ width: cameraAudioProgressPercent + '%' }"
              ></cover-view>
            </cover-view>
            <cover-view class="contract-video-evidence-time">
              {{ formatAudioTime(currentAudioTime) }}/{{ formatAudioTime(audioDuration) }}
            </cover-view>
          </cover-view>
          <cover-view class="contract-video-evidence-question" v-if="currentQuestionText">
            {{ currentQuestionText }}
          </cover-view>
        </cover-view>
      </camera>
    </view>
    <!-- #endif -->

    <!-- #ifdef H5 -->
    <view class="contract-video-area contract-video-h5-area" v-if="!videoUrl">
      <view class="contract-video-h5-upload">
        <view class="contract-video-h5-title">上传手机视频</view>
        <view class="contract-video-h5-desc">
          H5仅支持上传已录制的视频，实时视频录制请在小程序完成。
        </view>
        <view class="contract-video-h5-action" @click="chooseH5Video">选择视频</view>
      </view>
    </view>
    <!-- #endif -->

    <view class="contract-video-area" :class="{ 'contract-video-preview-area-h5': isH5UploadMode }" v-else>
      <video
        :src="videoUrl"
        class="contract-video-preview"
        :class="{ 'contract-video-preview-h5': isH5UploadMode }"
        controls
      ></video>
    </view>

    <view class="contract-video-btn-area" v-if="!videoUrl">
      <!-- #ifdef MP-WEIXIN -->
      <view class="contract-video-btn-record" :class="{ recording: isRecording }" @click="toggleRecord">
        <view class="contract-video-record-inner"></view>
      </view>
      <view class="text-24 color-grey-minor">{{ isRecording ? '点击停止' : '点击开始录制' }}</view>
      <!-- #endif -->
      <!-- #ifdef H5 -->
      <view class="contract-video-btn-upload" @click="chooseH5Video">上传视频</view>
      <view class="text-24 color-grey-minor">实时视频录制请在小程序完成</view>
      <!-- #endif -->
    </view>

    <view class="contract-video-btn-area" v-else>
      <view class="contract-video-btn-secondary" @click="reRecord">{{ isH5UploadMode ? '重新上传' : '重新录制' }}</view>
      <view class="contract-video-btn-primary" @click="submitVideo" :class="{ disabled: uploading }">
        {{ uploading ? '上传中...' : '确认提交' }}
      </view>
    </view>
  </view>
</template>

<script>
var that;
import videoApi from '@/api/video.js';

export default {
  data() {
    return {
      contractId: '',
      question: '',
      durationLimit: 15,
      videoUrl: '',
      tempVideoPath: '',
      tempVideoFile: null,
      isRecording: false,
      recordingTime: 0,
      recordingTimer: null,
      uploading: false,
      cameraHeight: 400,
      cameraReady: false,

      // TTS audio
      audioUrl: '',
      audioDuration: 0,
      suggestedDuration: 0,
      ruleId: '',
      rules: [],
      audioPlaying: false,
      audioLoaded: false,
      audioProgress: 0,
      currentAudioTime: 0,
      audioSeeking: false,
      audioContext: null,
      audioUpdateTimer: null,
      questionLines: [],
      currentQuestionLine: -1,
      questionScrollTop: 0,
    };
  },
  computed: {
    cameraAudioProgressPercent() {
      const progress = Math.max(0, Math.min(1000, this.audioProgress || 0));
      return Math.round(progress / 10);
    },
    currentQuestionText() {
      if (!this.questionLines || !this.questionLines.length) {
        return this.question || '';
      }
      if (this.currentQuestionLine >= 0 && this.currentQuestionLine < this.questionLines.length) {
        return this.questionLines[this.currentQuestionLine];
      }
      return this.questionLines[0] || '';
    },
    isH5UploadMode() {
      // #ifdef H5
      return true;
      // #endif
      // #ifndef H5
      return false;
      // #endif
    },
  },
  onLoad(options) {
    that = this;
    uni.setNavigationBarTitle({
      title: this.isH5UploadMode ? '签署视频上传' : '签署视频录制',
    });
    if (options.contractId) {
      this.contractId = options.contractId;
    }
    if (options.question) {
      this.question = decodeURIComponent(options.question);
    }
    if (options.durationLimit) {
      this.durationLimit = parseInt(options.durationLimit) || 15;
    }
    if (options.audioUrl) {
      this.audioUrl = decodeURIComponent(options.audioUrl);
    }
    if (options.suggestedDuration) {
      this.suggestedDuration = parseInt(options.suggestedDuration) || 0;
    }
    if (options.ruleId) {
      this.ruleId = decodeURIComponent(options.ruleId);
    }
    // 按换行分割问题文本
    if (this.question) {
      this.questionLines = this.buildQuestionLines(this.question);
    }
    const sysInfo = uni.getSystemInfoSync();
    this.cameraHeight = sysInfo.windowWidth * 0.75;

    // 初始化音频播放器
    if (this.audioUrl) {
      this.initAudio();
    }
    this.loadPromptConfig();
  },
  onUnload() {
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
    }
    if (this.audioUpdateTimer) {
      clearInterval(this.audioUpdateTimer);
    }
    if (this.audioContext) {
      this.audioContext.destroy();
      this.audioContext = null;
    }
  },
  methods: {
    toggleRecord() {
      if (this.isH5UploadMode) {
        this.chooseH5Video();
        return;
      }
      if (this.isRecording) {
        this.stopRecord();
      } else {
        this.startRecord();
      }
    },
    startRecord() {
      this.ensureRecordPermissions()
        .then(() => {
          this.doStartRecord();
        })
        .catch(() => {
          this.promptOpenCameraSetting();
        });
    },
    ensureRecordPermissions() {
      return new Promise((resolve, reject) => {
        uni.getSetting({
          success: res => {
            const setting = (res && res.authSetting) || {};
            if (setting['scope.camera'] === false || setting['scope.record'] === false) {
              reject();
              return;
            }
            this.authorizeIfNeeded('scope.camera')
              .then(() => this.authorizeIfNeeded('scope.record'))
              .then(resolve)
              .catch(reject);
          },
          fail: reject,
        });
      });
    },
    chooseH5Video() {
      const timeout = Math.min(parseInt(this.durationLimit) || 15, 300);
      uni.chooseVideo({
        sourceType: ['album'],
        maxDuration: timeout,
        compressed: false,
        success: res => {
          const filePath = res.tempFilePath || res.path;
          if (!filePath) {
            uni.showToast({ title: '视频文件无效', icon: 'none' });
            return;
          }
          const duration = Math.max(1, Math.ceil(Number(res.duration) || this.durationLimit || 1));
          if (duration > (Number(this.durationLimit) || 15) + 5) {
            uni.showToast({ title: '视频时长超过限制', icon: 'none' });
            return;
          }
          const fileName = res.name || res.tempFile && res.tempFile.name || filePath.split('/').pop() || 'sign-video.mp4';
          this.applyRecordedVideo(filePath, duration, {
            path: filePath,
            tempFilePath: filePath,
            name: fileName,
            size: res.size || (res.tempFile && res.tempFile.size) || 0,
            type: res.type || (res.tempFile && res.tempFile.type) || 'video/mp4',
          });
        },
        fail: () => {
          uni.showToast({ title: '未选择视频', icon: 'none' });
        },
      });
    },
    authorizeIfNeeded(scope) {
      return new Promise((resolve, reject) => {
        uni.authorize({
          scope,
          success: resolve,
          fail: reject,
        });
      });
    },
    doStartRecord() {
      const ctx = uni.createCameraContext('contractVideoCamera', this);
      const timeout = Math.min(parseInt(this.durationLimit) || 15, 300);
      ctx.startRecord({
        // timeout 是 cameraContext 原生录制上限；JS 计时保留为页面倒计时和兜底停止。
        timeout,
        success: () => {
          that.isRecording = true;
          that.recordingTime = 0;
          that.startPromptAudioForRecording();
          that.recordingTimer = setInterval(() => {
            that.recordingTime++;
            if (that.recordingTime >= that.durationLimit) {
              that.stopRecord();
            }
          }, 1000);
        },
        fail: err => {
          this.handleStartRecordFail(err);
        },
      });
    },
    handleStartRecordFail(err) {
      this.handleCameraRecordFail(err);
    },
    handleCameraRecordFail(err) {
      console.warn('startRecord failed', err);
      uni.getSetting({
        success: res => {
          const setting = (res && res.authSetting) || {};
          if (setting['scope.camera'] === false || setting['scope.record'] === false) {
            this.promptOpenCameraSetting();
            return;
          }
          this.promptUseNativeRecorder();
        },
        fail: () => {
          this.promptUseNativeRecorder();
        },
      });
    },
    promptUseNativeRecorder() {
      uni.showModal({
        title: '录制失败',
        content: '当前设备暂不能在页面内录制视频，是否使用系统相机录制？',
        confirmText: '去录制',
        cancelText: '取消',
        confirmColor: '#317CFF',
        success: res => {
          if (res.confirm) {
            this.tryChooseMediaRecord();
          }
        },
      });
    },
    tryChooseMediaRecord() {
      const timeout = Math.min(parseInt(this.durationLimit) || 15, 60);
      if (typeof uni.chooseMedia === 'function') {
        uni.chooseMedia({
          count: 1,
          mediaType: ['video'],
          sourceType: ['camera'],
          maxDuration: timeout,
          camera: 'front',
          success: res => {
            const file = res.tempFiles && res.tempFiles[0];
            if (file && file.tempFilePath) {
              this.applyRecordedVideo(file.tempFilePath, file.duration);
            }
          },
          fail: () => {
            uni.showToast({ title: '录制取消或失败', icon: 'none' });
          },
        });
        return;
      }
      uni.chooseVideo({
        sourceType: ['camera'],
        maxDuration: timeout,
        camera: 'front',
        success: res => {
          if (res.tempFilePath) {
            this.applyRecordedVideo(res.tempFilePath, res.duration);
          }
        },
        fail: () => {
          uni.showToast({ title: '录制取消或失败', icon: 'none' });
        },
      });
    },
    applyRecordedVideo(filePath, duration, fileMeta) {
      this.isRecording = false;
      this.stopPromptAudioForRecording();
      this.tempVideoPath = filePath;
      this.tempVideoFile = fileMeta || null;
      this.videoUrl = filePath;
      this.recordingTime = Math.max(1, Math.ceil(duration || this.durationLimit || 1));
    },
    handleCameraError(err) {
      this.cameraReady = false;
      console.warn('camera error', err);
    },
    promptOpenCameraSetting() {
      uni.showModal({
        title: '需要摄像头和麦克风权限',
        content: '请在设置中打开摄像头和麦克风权限后再录制视频',
        confirmText: '去设置',
        confirmColor: '#317CFF',
        success: res => {
          if (res.confirm) {
            uni.openSetting();
          }
        },
      });
    },
    stopRecord() {
      if (that.recordingTimer) {
        clearInterval(that.recordingTimer);
        that.recordingTimer = null;
      }
      const ctx = uni.createCameraContext('contractVideoCamera', this);
      ctx.stopRecord({
        success: (res) => {
          that.isRecording = false;
          that.stopPromptAudioForRecording();
          that.tempVideoPath = res.tempVideoPath;
          that.videoUrl = res.tempVideoPath;
        },
        fail: () => {
          that.isRecording = false;
          that.stopPromptAudioForRecording();
          uni.showToast({ title: '停止录制失败', icon: 'none' });
        },
      });
    },
    reRecord() {
      this.videoUrl = '';
      this.tempVideoPath = '';
      this.tempVideoFile = null;
      this.recordingTime = 0;
      this.resetPromptAudioState();
    },
    initAudio() {
      if (!this.audioUrl) return;
      if (this.audioContext) {
        this.audioContext.destroy();
        this.audioContext = null;
      }
      this.audioContext = uni.createInnerAudioContext();
      this.audioContext.src = this.audioUrl;
      this.audioContext.autoplay = false;
      this.audioContext.obeyMuteSwitch = false;
      this.audioContext.onCanplay(() => {
        that.audioLoaded = true;
        that.refreshAudioDuration();
      });
      this.audioContext.onPlay(() => {
        that.audioPlaying = true;
      });
      this.audioContext.onPause(() => {
        that.audioPlaying = false;
      });
      this.audioContext.onStop(() => {
        that.audioPlaying = false;
      });
      this.audioContext.onTimeUpdate(() => {
        if (!that.audioSeeking && that.audioContext) {
          that.currentAudioTime = that.audioContext.currentTime;
          const dur = that.audioContext.duration || 1;
          that.audioProgress = Math.round((that.audioContext.currentTime / dur) * 1000);
          that.syncQuestionScroll(that.audioContext.currentTime, dur);
        }
      });
      this.audioContext.onEnded(() => {
        that.audioPlaying = false;
        that.audioProgress = 1000;
        if (that.audioUpdateTimer) {
          clearInterval(that.audioUpdateTimer);
          that.audioUpdateTimer = null;
        }
      });
      this.audioContext.onError((err) => {
        console.warn('audio error', err);
        that.audioLoaded = false;
        that.audioPlaying = false;
      });
    },
    loadPromptConfig() {
      if (!this.contractId) return;
      if (this.audioUrl && this.question) return;
      videoApi.check(this.contractId).then(res => {
        if (!res || (!res.required && !res.allowReRecord && !(Array.isArray(res.rules) && res.rules.length))) return;
        this.rules = Array.isArray(res.rules) ? res.rules : [];
        const selected = this.resolveSelectedRule(res);
        this.applyVideoRule(selected || res);
      }).catch(() => {});
    },
    resolveSelectedRule(res) {
      if (!Array.isArray(res.rules) || !res.rules.length) {
        return null;
      }
      if (!this.ruleId && res.selectedRuleId) {
        this.ruleId = String(res.selectedRuleId);
      }
      const selected = res.rules.find(item => String(item.id) === String(this.ruleId)) || res.rules[0];
      this.ruleId = selected && selected.id ? String(selected.id) : '';
      return selected;
    },
    selectVideoRule(rule) {
      this.applyVideoRule(rule);
    },
    applyVideoRule(rule) {
      if (!rule) return;
      if (rule.id) {
        this.ruleId = String(rule.id);
      }
      if (rule.question) {
        this.question = rule.question;
        this.questionLines = this.buildQuestionLines(this.question);
      }
      if (rule.durationLimit) {
        this.durationLimit = parseInt(rule.durationLimit) || this.durationLimit;
      }
      if (rule.suggestedDuration) {
        this.suggestedDuration = parseInt(rule.suggestedDuration) || 0;
      }
      if (rule.audioUrl) {
        const changed = this.audioUrl !== rule.audioUrl;
        this.audioUrl = rule.audioUrl;
        if (changed) {
          this.initAudio();
        }
      }
    },
    refreshAudioDuration() {
      if (!this.audioContext) return;
      const duration = this.audioContext.duration || 0;
      if (duration > 0) {
        this.audioDuration = duration;
        return;
      }
      setTimeout(() => {
        if (this.audioContext && this.audioContext.duration > 0) {
          this.audioDuration = this.audioContext.duration;
        }
      }, 500);
    },
    toggleAudioPlay() {
      if (!this.audioContext) return;
      if (this.audioPlaying) {
        this.audioContext.pause();
        this.audioPlaying = false;
        if (this.audioUpdateTimer) {
          clearInterval(this.audioUpdateTimer);
          this.audioUpdateTimer = null;
        }
      } else {
        this.audioContext.play();
        this.audioPlaying = true;
        this.audioUpdateTimer = setInterval(() => {
          if (that.audioContext && !that.audioSeeking) {
            that.currentAudioTime = that.audioContext.currentTime;
            const dur = that.audioContext.duration || 1;
            that.audioProgress = Math.round((that.audioContext.currentTime / dur) * 1000);
            that.syncQuestionScroll(that.audioContext.currentTime, dur);
          }
        }, 200);
      }
    },
    startPromptAudioForRecording() {
      if (!this.audioUrl) {
        this.currentQuestionLine = this.questionLines && this.questionLines.length ? 0 : -1;
        this.questionScrollTop = 0;
        return;
      }
      if (!this.audioContext && this.audioUrl) {
        this.initAudio();
      }
      if (!this.audioContext) {
        return;
      }
      this.resetPromptAudioState();
      try {
        this.audioContext.seek(0);
      } catch (e) {
        console.warn('audio seek reset failed', e);
      }
      this.audioContext.play();
      this.audioPlaying = true;
      setTimeout(() => {
        if (that.isRecording && that.audioContext && that.audioPlaying && that.currentAudioTime <= 0.1) {
          that.audioContext.play();
          that.refreshAudioDuration();
        }
      }, 600);
      if (this.audioUpdateTimer) {
        clearInterval(this.audioUpdateTimer);
      }
      this.audioUpdateTimer = setInterval(() => {
        if (that.audioContext && !that.audioSeeking) {
          that.currentAudioTime = that.audioContext.currentTime;
          const dur = that.audioContext.duration || 1;
          that.audioProgress = Math.round((that.audioContext.currentTime / dur) * 1000);
          that.syncQuestionScroll(that.audioContext.currentTime, dur);
        }
      }, 200);
    },
    stopPromptAudioForRecording() {
      if (this.audioContext && this.audioPlaying) {
        this.audioContext.pause();
      }
      this.audioPlaying = false;
      if (this.audioUpdateTimer) {
        clearInterval(this.audioUpdateTimer);
        this.audioUpdateTimer = null;
      }
    },
    resetPromptAudioState() {
      this.currentAudioTime = 0;
      this.audioProgress = 0;
      this.audioSeeking = false;
      this.currentQuestionLine = this.questionLines && this.questionLines.length ? 0 : -1;
      this.questionScrollTop = 0;
    },
    onAudioSeek(e) {
      this.audioSeeking = false;
      if (this.audioContext) {
        const dur = this.audioContext.duration || 1;
        const seekTime = (e.detail.value / 1000) * dur;
        this.audioContext.seek(seekTime);
        this.currentAudioTime = seekTime;
      }
    },
    onAudioSeeking(e) {
      this.audioSeeking = true;
      if (this.audioContext) {
        const dur = this.audioContext.duration || 1;
        this.currentAudioTime = (e.detail.value / 1000) * dur;
      }
    },
    buildQuestionLines(text) {
      const lines = [];
      String(text || '').split(/\n+/).forEach(rawLine => {
        let buffer = '';
        const line = rawLine.trim();
        for (let i = 0; i < line.length; i++) {
          const ch = line.charAt(i);
          buffer += ch;
          if (/[\u3002\uff01\uff1f!?\uff1b;]/.test(ch) || buffer.length >= 28) {
            if (buffer.trim()) {
              lines.push(buffer.trim());
            }
            buffer = '';
          }
        }
        if (buffer.trim()) {
          lines.push(buffer.trim());
        }
      });
      return lines;
    },
    syncQuestionScroll(currentTime, totalDuration) {
      if (!this.questionLines || this.questionLines.length === 0) return;
      const lineIndex = Math.min(
        Math.floor((currentTime / totalDuration) * this.questionLines.length),
        this.questionLines.length - 1
      );
      if (lineIndex !== this.currentQuestionLine) {
        this.currentQuestionLine = lineIndex;
        this.questionScrollTop = Math.max(0, lineIndex * 60 - 120);
      }
    },
    formatAudioTime(seconds) {
      if (!seconds || seconds <= 0) return '00:00';
      const m = Math.floor(seconds / 60);
      const s = Math.floor(seconds % 60);
      return (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
    },
    submitVideo() {
      if (this.uploading) return;
      if (!this.tempVideoPath || !this.recordingTime) {
        uni.showToast({ title: this.isH5UploadMode ? '请先上传视频' : '请先完成视频录制', icon: 'none' });
        return;
      }
      this.uploading = true;
      uni.showLoading({ title: '上传视频中...' });
      // 必须先完成 OSS 上传，再登记后端视频记录；任一步失败都不返回签署流程。
      videoApi.uploadVideoToOss(this.tempVideoFile || this.tempVideoPath)
        .then(ossUrl => {
          return videoApi.upload({
            contractId: this.contractId,
            videoUrl: ossUrl,
            duration: this.recordingTime,
            ruleId: this.ruleId || undefined,
          });
        })
        .then(() => {
          uni.hideLoading();
          uni.showToast({ title: '提交成功', icon: 'success' });
          setTimeout(() => {
            const pages = getCurrentPages();
            if (pages.length > 1) {
              const prevPage = pages[pages.length - 2];
              if (prevPage && typeof prevPage.onVideoRecorded === 'function') {
                prevPage.onVideoRecorded();
              }
            }
            uni.navigateBack();
          }, 800);
        })
        .catch(() => {
          uni.hideLoading();
          uni.showToast({ title: '视频上传失败，请重试', icon: 'none' });
        })
        .finally(() => {
          this.uploading = false;
        });
    },
  },
};
</script>

<style lang="scss" scoped>
.contract-video-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 32rpx;
  padding-bottom: calc(200rpx + env(safe-area-inset-bottom));
}

.contract-video-page-h5 {
  padding-bottom: calc(320rpx + env(safe-area-inset-bottom));
}

.contract-video-tip-card {
  background-color: #fff;
  border-radius: 20rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
}

.contract-video-audio-bar {
  display: flex;
  align-items: center;
  background: #f5f7fa;
  border-radius: 16rpx;
  padding: 16rpx 20rpx;
  margin-top: 20rpx;
  gap: 12rpx;
}

.contract-video-audio-control {
  flex-shrink: 0;
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.contract-video-audio-text {
  font-size: 24rpx;
  color: #317CFF;
  font-weight: 600;
}

.contract-video-audio-slider {
  flex: 1;
}

.contract-video-audio-time {
  flex-shrink: 0;
  min-width: 100rpx;
  text-align: right;
}

.contract-video-question {
  max-height: 360rpx;
  margin-top: 20rpx;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}

.contract-video-question-inner {
  display: flex;
  flex-direction: column;
}

.contract-video-question-line {
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
  transition: background 0.3s;
  line-height: 1.6;
}

.question-line-active {
  background: #e8f0ff;
  color: #317CFF;
  font-weight: bold;
}

.contract-video-duration-info {
  margin-top: 12rpx;
  text-align: right;
}

.contract-video-rule-list {
  margin-top: 20rpx;
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.contract-video-rule-item {
  padding: 18rpx 20rpx;
  border: 2rpx solid #e5e6eb;
  border-radius: 14rpx;
  background-color: #f7f8fa;

  &.active {
    border-color: #317cff;
    background-color: #eef5ff;
  }
}

.contract-video-rule-title {
  font-size: 24rpx;
  color: #1d2129;
  font-weight: 600;
  margin-bottom: 8rpx;
}

.contract-video-rule-desc {
  font-size: 22rpx;
  color: #4e5969;
  line-height: 1.45;
  max-height: 96rpx;
  overflow: hidden;
}

.contract-video-area {
  border-radius: 20rpx;
  overflow: hidden;
  background-color: #000;
}

.contract-video-h5-area {
  background-color: #fff;
}

.contract-video-h5-upload {
  min-height: 420rpx;
  padding: 48rpx 40rpx;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.contract-video-h5-title {
  font-size: 34rpx;
  color: #222b45;
  font-weight: 600;
}

.contract-video-h5-desc {
  margin-top: 18rpx;
  font-size: 26rpx;
  line-height: 1.6;
  color: #6e7c93;
}

.contract-video-h5-action {
  margin-top: 32rpx;
  min-width: 220rpx;
  height: 72rpx;
  padding: 0 32rpx;
  border-radius: 18rpx;
  background-color: #317CFF;
  color: #fff;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.contract-video-camera {
  width: 100%;
  position: relative;
}

.contract-video-camera-tip,
.contract-video-recording-tip {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  gap: 12rpx;
  color: #fff;
}

.contract-video-recording-dot {
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
  background-color: #ff4444;
  animation: blink 1s infinite;
}

.contract-video-evidence-overlay {
  position: absolute;
  left: 24rpx;
  right: 24rpx;
  bottom: 24rpx;
  padding: 18rpx;
  border-radius: 16rpx;
  background-color: rgba(0, 0, 0, 0.58);
  color: #fff;
}

.contract-video-evidence-title {
  font-size: 24rpx;
  font-weight: 600;
  margin-bottom: 10rpx;
}

.contract-video-evidence-audio {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.contract-video-evidence-label {
  width: 120rpx;
  font-size: 22rpx;
  color: #dfe9ff;
}

.contract-video-evidence-track {
  flex: 1;
  height: 10rpx;
  border-radius: 10rpx;
  background-color: rgba(255, 255, 255, 0.35);
  overflow: hidden;
}

.contract-video-evidence-track-inner {
  height: 10rpx;
  border-radius: 10rpx;
  background-color: #66a3ff;
}

.contract-video-evidence-time {
  width: 118rpx;
  text-align: right;
  font-size: 22rpx;
  color: #dfe9ff;
}

.contract-video-evidence-question {
  margin-top: 12rpx;
  font-size: 24rpx;
  line-height: 1.5;
  color: #fff;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.contract-video-preview {
  width: 100%;
  height: 400px;
}

.contract-video-preview-area-h5 {
  max-height: 420rpx;
}

.contract-video-preview-h5 {
  height: 360rpx;
  max-height: 240px;
  background-color: #000;
}

.contract-video-btn-area {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 40rpx 32rpx;
  padding-bottom: calc(40rpx + env(safe-area-inset-bottom));
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24rpx;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
  flex-direction: column;
}

.contract-video-btn-record {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  border: 6rpx solid #317CFF;
  display: flex;
  align-items: center;
  justify-content: center;
  &.recording {
    border-color: #ff4444;
    .contract-video-record-inner {
      width: 40rpx;
      height: 40rpx;
      border-radius: 8rpx;
      background-color: #ff4444;
    }
  }
}

.contract-video-btn-upload {
  width: 100%;
  height: 88rpx;
  border-radius: 24rpx;
  background-color: #317CFF;
  color: #fff;
  font-size: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.contract-video-record-inner {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background-color: #317CFF;
}

.contract-video-btn-primary {
  width: 100%;
  height: 88rpx;
  border-radius: 30rpx;
  background-color: #317CFF;
  color: #fff;
  font-size: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  &.disabled {
    opacity: 0.6;
  }
}

.contract-video-btn-secondary {
  width: 100%;
  height: 88rpx;
  border-radius: 30rpx;
  border: 2rpx solid #317CFF;
  background-color: #fff;
  color: #317CFF;
  font-size: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
