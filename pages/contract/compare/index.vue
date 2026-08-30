<template>
  <view class="compare-page">
    <!-- #ifdef H5 -->
      <custom-nav title="合同比对" :showBack="true" class="compare-nav"></custom-nav>
      <!-- #endif -->

    <scroll-view v-if="token" class="compare-scroll" scroll-y>
      <view class="intro">
        <view class="intro-main">
          <view class="intro-kicker">AI 合同工具</view>
          <view class="intro-title">合同比对</view>
          <view class="intro-desc">选择基准合同和目标合同后，直接生成差异、风险和缺失条款结论。</view>
        </view>
        <view class="intro-badge">用户功能</view>
      </view>

      <view v-if="compareResult" class="result-panel">
        <view class="result-head">
          <view>
            <view class="section-label">比对结论</view>
            <view class="result-summary">{{ compareResult.summary || '已生成合同比对结果。' }}</view>
          </view>
          <view class="risk-tag" :class="riskClass">{{ riskText }}</view>
        </view>

        <view v-if="compareResult.errorMessage" class="error-message">
          {{ compareResult.errorMessage }}
        </view>

        <view
          v-for="section in resultSections"
          :key="section.title"
          class="result-block"
          :class="section.type"
        >
          <view class="block-title">{{ section.title }}</view>
          <view v-if="section.items.length">
            <view v-for="(item, index) in section.items" :key="index" class="result-item">
              {{ item }}
            </view>
          </view>
          <view v-else class="empty-line">{{ section.empty }}</view>
        </view>
      </view>

      <view class="history-summary">
        <view>
          <view class="section-label">比对历史</view>
          <view class="section-desc">
            {{ historyList.length ? '已保留 ' + historyList.length + ' 条最近记录，可在弹窗中回看结论。' : '暂无比对历史，可先完成一次比对。' }}
          </view>
        </view>
        <view class="history-summary-actions">
          <button class="mini-action ghost" @click="loadHistory(false)">刷新</button>
          <button class="mini-action" @click="openHistoryPopup">查看历史</button>
        </view>
      </view>

      <view class="compare-steps">
        <view class="step-item active">
          <text>1</text>
          <view>选基准</view>
        </view>
        <view class="step-line"></view>
        <view class="step-item" :class="{ active: hasContent(source) }">
          <text>2</text>
          <view>选目标</view>
        </view>
        <view class="step-line"></view>
        <view class="step-item" :class="{ active: compareResult }">
          <text>3</text>
          <view>看结论</view>
        </view>
      </view>

      <view class="compare-workbench">
      <view class="compare-panel side-panel">
        <view class="panel-head">
          <view>
            <view class="section-label">基准合同</view>
            <view class="section-desc">{{ sourceStatus }}</view>
          </view>
        </view>
        <view class="input-mode-tabs">
          <view
            v-for="item in modeOptions"
            :key="item.sourceKey"
            class="input-mode-tab"
            :class="{ active: sourceMode === item.key }"
            @click="setMode('source', item.key)"
          >
            {{ item.title }}
          </view>
        </view>
        <view v-if="source.contractId || source.fileUrl" class="selected-row">
          <text>{{ source.fileName || '已选择历史合同' }}</text>
          <text @click="clearSide('source')">清除</text>
        </view>
        <view v-if="sourceMode === 'history'" class="pick-box history" @click="openContractPicker('source')">
          <view class="upload-main">{{ source.contractId ? '重新选择历史合同' : '从历史合同中选择' }}</view>
          <view class="upload-sub">适合用已签署合同、旧版本或标准模板作为基准。</view>
        </view>
        <view v-if="sourceMode === 'upload'" class="upload-box" @click="chooseFile('source')">
          <view class="upload-main">{{ source.fileName || '上传 PDF / DOCX / TXT' }}</view>
          <view class="upload-sub">扫描件或图片合同建议先 OCR 后再比对。</view>
        </view>
        <textarea
          v-if="sourceMode === 'text'"
          v-model="source.text"
          class="text-input"
          maxlength="-1"
          placeholder="也可以直接粘贴基准合同文本"
          auto-height
        />
      </view>

      <view class="compare-panel side-panel">
        <view class="panel-head">
          <view>
            <view class="section-label">目标合同</view>
            <view class="section-desc">{{ targetStatus }}</view>
          </view>
        </view>
        <view class="input-mode-tabs target">
          <view
            v-for="item in modeOptions"
            :key="item.targetKey"
            class="input-mode-tab"
            :class="{ active: targetMode === item.key }"
            @click="setMode('target', item.key)"
          >
            {{ item.title }}
          </view>
        </view>
        <view v-if="target.contractId || target.fileUrl" class="selected-row target">
          <text>{{ target.fileName || '已选择历史合同' }}</text>
          <text @click="clearSide('target')">清除</text>
        </view>
        <view v-if="targetMode === 'history'" class="pick-box history target" @click="openContractPicker('target')">
          <view class="upload-main">{{ target.contractId ? '重新选择历史合同' : '从历史合同中选择' }}</view>
          <view class="upload-sub">适合选择待签署、续签或修订后的合同版本。</view>
        </view>
        <view v-if="targetMode === 'upload'" class="upload-box target" @click="chooseFile('target')">
          <view class="upload-main">{{ target.fileName || '上传 PDF / DOCX / TXT' }}</view>
          <view class="upload-sub">用于和基准合同识别差异、风险和缺失条款。</view>
        </view>
        <textarea
          v-if="targetMode === 'text'"
          v-model="target.text"
          class="text-input"
          maxlength="-1"
          placeholder="也可以直接粘贴目标合同文本"
          auto-height
        />
      </view>
      </view>

      <button class="compare-button" :disabled="!canCompare || comparing" @click="startCompare">
        {{ comparing ? '正在生成比对结果...' : '生成比对结果' }}
      </button>
    </scroll-view>

    <uni-popup v-if="token" ref="contractPicker" type="bottom">
      <view class="picker-sheet">
        <view class="picker-head">
          <text>{{ pickerRole === 'source' ? '选择基准合同' : '选择目标合同' }}</text>
          <text @click="$refs.contractPicker.close()">关闭</text>
        </view>
        <scroll-view scroll-y class="picker-list">
          <view
            v-for="item in contractOptions"
            :key="item.id"
            class="picker-item"
            :class="{ disabled: !isReadableContract(item) }"
            @click="selectContract(item)"
          >
            <view>{{ contractName(item) }}</view>
            <text>{{ isReadableContract(item) ? '可用于比对' : '缺少可提取文本的文件' }}</text>
          </view>
          <view v-if="!contractOptions.length" class="history-empty">暂无可选合同，可直接上传或粘贴文本。</view>
        </scroll-view>
      </view>
    </uni-popup>
    <uni-popup v-if="token" ref="historyPopup" type="bottom">
      <view class="history-sheet">
        <view class="history-sheet-head">
          <view>
            <text>比对历史</text>
            <view>选择记录后会把结论带回当前页面。</view>
          </view>
          <view class="history-sheet-actions">
            <text @click="loadHistory(false)">刷新</text>
            <text @click="closeHistoryPopup">关闭</text>
          </view>
        </view>
        <scroll-view scroll-y class="history-list popup">
          <view
            v-for="item in historyList"
            :key="item.historyKey"
            class="history-item"
            @click="selectHistory(item)"
          >
            <view class="history-top">
              <text>{{ item.summary || '合同比对记录' }}</text>
              <text :class="item.riskTextClass">{{ formatRisk(item.riskLevel) }}</text>
            </view>
            <view class="history-files">
              {{ item.sourceFileName || '基准合同' }} / {{ item.targetFileName || '目标合同' }}
            </view>
            <view class="history-time">{{ item.createTime || '' }}</view>
          </view>
          <view v-if="!historyList.length" class="history-empty">暂无比对历史，可先完成一次比对。</view>
        </scroll-view>
      </view>
    </uni-popup>
    <view v-else class="login-required">
      <view class="login-required-title">登录后使用合同比对</view>
      <view class="login-required-desc">选择历史合同、上传文件或粘贴文本后，可生成合同差异和风险结论。</view>
      <view class="login-required-btn" @click="goLogin">立即登录</view>
    </view>
  </view>
</template>

<script>
import customNav from '@/components/custom-nav/custom-nav.vue';
import userInfoApi from '@/api/api.js';
import { compareContracts, contractCompareHistory } from '@/api/file.js';
import { upload } from '@/api/oss.js';
import { mapState } from 'vuex';

const allowedExtensions = ['pdf', 'docx', 'txt'];

export default {
  components: {
    customNav,
  },
  data() {
    return {
      modeOptions: [
        { key: 'history', sourceKey: 'source-history', targetKey: 'target-history', title: '历史' },
        { key: 'upload', sourceKey: 'source-upload', targetKey: 'target-upload', title: '上传' },
        { key: 'text', sourceKey: 'source-text', targetKey: 'target-text', title: '文本' },
      ],
      sourceMode: 'history',
      targetMode: 'history',
      source: this.emptySide(),
      target: this.emptySide(),
      pickerRole: 'source',
      contractOptions: [],
      historyList: [],
      comparing: false,
      compareResult: null,
    };
  },
  computed: {
    ...mapState(['token']),
    canCompare() {
      return this.hasContent(this.source) && this.hasContent(this.target);
    },
    sourceStatus() {
      return this.sideStatus(this.source, '选择已签署合同、标准模板或旧版本作为比对基准。');
    },
    targetStatus() {
      return this.sideStatus(this.target, '选择待签署、续签或修订后的合同版本。');
    },
    normalizedResult() {
      const result = this.normalizeResult(this.compareResult);
      return {
        differenceSummary: this.ensureArray(result.differenceSummary),
        riskPoints: this.ensureArray(result.riskPoints),
        missingClauses: this.ensureArray(result.missingClauses),
        suggestions: this.ensureArray(result.suggestions),
      };
    },
    resultSections() {
      return [
        { title: '主要差异', items: this.normalizedResult.differenceSummary, empty: '暂无明显差异', type: '' },
        { title: '风险点', items: this.normalizedResult.riskPoints, empty: '暂无风险点', type: 'danger' },
        { title: '缺失条款', items: this.normalizedResult.missingClauses, empty: '暂无缺失条款', type: 'warning' },
        { title: '修改建议', items: this.normalizedResult.suggestions, empty: '暂无修改建议', type: '' },
      ];
    },
    riskText() {
      return this.formatRisk(this.compareResult && this.compareResult.riskLevel);
    },
    riskClass() {
      const risk = String((this.compareResult && this.compareResult.riskLevel) || '').toLowerCase();
      if (risk.includes('high') || risk.includes('高')) return 'risk-high';
      if (risk.includes('medium') || risk.includes('中')) return 'risk-medium';
      if (risk.includes('low') || risk.includes('低')) return 'risk-low';
      return 'risk-unknown';
    },
  },
  onShow() {
    if (this.token) {
      this.loadContracts();
      this.loadHistory(true);
    } else {
      this.contractOptions = [];
      this.historyList = [];
    }
  },
  methods: {
    goLogin() {
      this.common.toLogin();
    },
    emptySide() {
      return {
        contractId: '',
        fileUrl: '',
        fileName: '',
        text: '',
      };
    },
    checkLogin() {
      if (!this.token) {
        if (this.common && this.common.toLogin) {
          this.common.toLogin();
        } else {
          uni.navigateTo({ url: '/pages/login/login' });
        }
        return false;
      }
      return true;
    },
    async loadContracts() {
      try {
        const res = await userInfoApi.contractList({ pageNum: 1, pageSize: 50 }, { silent: true });
        this.contractOptions = this.normalizeRows(res);
      } catch (error) {
        this.contractOptions = [];
      }
    },
    async loadHistory(silent) {
      if (!this.checkLogin()) return;
      try {
        const res = await contractCompareHistory({ pageNum: 1, pageSize: 8 }, { silent: silent === true });
        this.historyList = this.normalizeRows(res).map((item, index) => {
          const record = this.normalizeResult(item);
          record.historyKey = String(record.id || record.createTime || index);
          record.riskTextClass = this.resolveRiskTextClass(record.riskLevel);
          return record;
        });
      } catch (error) {
        if (!silent) {
          uni.showToast({ title: '比对历史加载失败', icon: 'none' });
        }
      }
    },
    normalizeRows(res) {
      const data = res && res.data ? res.data : res;
      if (Array.isArray(data)) return data;
      if (Array.isArray(data && data.rows)) return data.rows;
      if (Array.isArray(data && data.records)) return data.records;
      if (Array.isArray(data && data.list)) return data.list;
      if (data && data.data) return this.normalizeRows(data.data);
      return [];
    },
    normalizeResult(res) {
      const data = res && res.data ? res.data : res || {};
      const parsed = this.safeParseJson(data.resultJson);
      return {
        ...data,
        ...parsed,
        summary: data.summary || parsed.summary || '',
        riskLevel: data.riskLevel || parsed.riskLevel || '',
        errorMessage: data.errorMessage || '',
        differenceSummary: this.ensureArray(data.differenceSummary || parsed.differenceSummary),
        riskPoints: this.ensureArray(data.riskPoints || parsed.riskPoints),
        missingClauses: this.ensureArray(data.missingClauses || parsed.missingClauses),
        suggestions: this.ensureArray(data.suggestions || parsed.suggestions),
      };
    },
    safeParseJson(value) {
      if (!value || typeof value !== 'string') return {};
      try {
        return JSON.parse(value);
      } catch (error) {
        return {};
      }
    },
    hasContent(item) {
      return !!(item.fileUrl || String(item.text || '').trim());
    },
    sideStatus(item, emptyText) {
      if (item.contractId) return `已选择历史合同：${item.fileName || item.contractId}`;
      if (item.fileUrl) return `已上传文件：${item.fileName || '合同文件'}`;
      if (String(item.text || '').trim()) return `已输入文本：${String(item.text || '').trim().length} 字`;
      return emptyText;
    },
    setMode(role, mode) {
      if (role === 'target') {
        this.targetMode = mode;
      } else {
        this.sourceMode = mode;
      }
    },
    ensureArray(value) {
      if (Array.isArray(value)) return value.filter(Boolean);
      if (!value) return [];
      return String(value)
        .split(/\n|;|；/)
        .map((item) => item.trim())
        .filter(Boolean);
    },
    formatRisk(value) {
      const risk = String(value || '').toLowerCase();
      if (risk.includes('high') || risk.includes('高')) return '高风险';
      if (risk.includes('medium') || risk.includes('中')) return '中风险';
      if (risk.includes('low') || risk.includes('低')) return '低风险';
      return '待评估';
    },
    resolveRiskTextClass(value) {
      const risk = String(value || '').toLowerCase();
      if (risk.includes('high') || risk.includes('高')) return 'risk-text-high';
      if (risk.includes('medium') || risk.includes('中')) return 'risk-text-medium';
      return 'risk-text-low';
    },
    openContractPicker(role) {
      if (!this.checkLogin()) return;
      this.pickerRole = role;
      if (!this.contractOptions.length) {
        this.loadContracts();
      }
      this.$refs.contractPicker.open();
    },
    openHistoryPopup() {
      if (!this.checkLogin()) return;
      if (!this.historyList.length) {
        this.loadHistory(true);
      }
      this.$refs.historyPopup.open();
    },
    closeHistoryPopup() {
      if (this.$refs.historyPopup) {
        this.$refs.historyPopup.close();
      }
    },
    selectContract(item) {
      if (!item || !this.isReadableContract(item)) {
        uni.showToast({ title: '该合同缺少可提取文本的文件', icon: 'none' });
        return;
      }
      const side = this.pickerRole === 'target' ? this.target : this.source;
      side.contractId = item.id;
      side.fileUrl = this.resolveContractFileUrl(item);
      side.fileName = this.contractName(item);
      this.$refs.contractPicker.close();
    },
    selectHistory(item) {
      this.compareResult = this.normalizeResult(item);
      this.closeHistoryPopup();
    },
    clearSide(role) {
      this[role] = this.emptySide();
    },
    contractName(item) {
      return (item && (item.name || item.fileName || item.title)) || `合同 ${item && item.id ? item.id : ''}`;
    },
    resolveContractFileUrl(item) {
      return (item && (item.url || item.sourceFileUrl || item.fileUrl || item.voucherUrl)) || '';
    },
    isReadableContract(item) {
      const url = this.resolveContractFileUrl(item);
      return !!url && /\.(pdf|docx|txt)(\?|#|$)/i.test(url);
    },
    isAllowedFile(fileName) {
      const ext = String(fileName || '').split('.').pop().toLowerCase();
      return allowedExtensions.indexOf(ext) !== -1;
    },
    chooseFile(side) {
      if (!this.checkLogin()) return;
      // #ifdef H5
      uni.chooseFile({
        count: 1,
        extension: allowedExtensions.map((ext) => '.' + ext),
        success: (res) => {
          const file = res.tempFiles && res.tempFiles[0];
          if (file) this.handlePickedFile(side, file);
        },
        fail: (err) => {
          if (err && err.errMsg && err.errMsg.indexOf('cancel') !== -1) return;
          uni.showToast({ title: '选择文件失败', icon: 'none' });
        },
      });
      // #endif

      // #ifdef MP-WEIXIN
      wx.chooseMessageFile({
        count: 1,
        type: 'file',
        success: (res) => {
          const file = res.tempFiles && res.tempFiles[0];
          if (file) this.handlePickedFile(side, file);
        },
        fail: (err) => {
          if (err && err.errMsg && err.errMsg.indexOf('cancel') !== -1) return;
          uni.showToast({ title: '选择文件失败', icon: 'none' });
        },
      });
      // #endif
    },
    async handlePickedFile(side, file) {
      const fileName = file.name || file.fileName || '';
      if (!this.isAllowedFile(fileName)) {
        uni.showToast({ title: '仅支持 PDF/DOCX/TXT', icon: 'none' });
        return;
      }
      if (file.size && file.size / 1024 / 1024 > 10) {
        uni.showToast({ title: '文件最大 10M', icon: 'none' });
        return;
      }
      uni.showLoading({ title: '上传中...' });
      try {
        const res = await upload([file]);
        const uploaded = res && res[0];
        if (!uploaded || !uploaded.url) throw new Error('upload failed');
        this[side].contractId = '';
        this[side].fileUrl = uploaded.url;
        this[side].fileName = fileName || '合同文件';
        uni.hideLoading();
        uni.showToast({ title: '上传完成', icon: 'none' });
      } catch (error) {
        uni.hideLoading();
        uni.showToast({ title: '上传失败，请重试', icon: 'none' });
      }
    },
    async startCompare() {
      if (!this.checkLogin() || !this.canCompare || this.comparing) return;
      this.comparing = true;
      this.compareResult = null;
      uni.showLoading({ title: '正在比对...' });
      try {
        const result = await compareContracts({
          sourceContractId: this.source.contractId || undefined,
          sourceFileUrl: this.source.fileUrl || undefined,
          sourceFileName: this.source.fileName || undefined,
          sourceText: String(this.source.text || '').trim() || undefined,
          targetContractId: this.target.contractId || undefined,
          targetFileUrl: this.target.fileUrl || undefined,
          targetFileName: this.target.fileName || undefined,
          targetText: String(this.target.text || '').trim() || undefined,
        });
        this.compareResult = this.normalizeResult(result);
        uni.hideLoading();
        uni.showToast({ title: '比对完成', icon: 'none' });
        this.loadHistory(true);
      } catch (error) {
        const message = (error && error.message) || '比对失败，请检查文件或文本';
        uni.hideLoading();
        uni.showToast({ title: message, icon: 'none' });
      } finally {
        this.comparing = false;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.compare-page {
  height: 100vh;
  background: #f4f7fb;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.compare-scroll {
  flex: 1;
  min-height: 0;
  height: auto;
  box-sizing: border-box;
  padding: 24rpx 28rpx 52rpx;
}

/* #ifdef H5 */
.compare-scroll {
  padding: 22rpx 28rpx 48rpx;
}
/* #endif */

.login-required {
  margin: 24rpx 28rpx 0;
  padding: 56rpx 36rpx;
  background: #ffffff;
  border-radius: 16rpx;
  box-shadow: 0 12rpx 34rpx rgba(38, 91, 160, 0.10);
}

/* #ifdef H5 */
.login-required {
  margin-top: 22rpx;
}
/* #endif */

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

.intro {
  display: flex;
  justify-content: space-between;
  gap: 20rpx;
  padding: 30rpx 26rpx;
  border-radius: 20rpx;
  background: linear-gradient(135deg, #2f7cff 0%, #31b7a6 100%);
  color: #ffffff;
  box-sizing: border-box;
}

.intro-main {
  min-width: 0;
}

.intro-kicker,
.intro-desc {
  color: rgba(255, 255, 255, 0.84);
  font-size: 23rpx;
  line-height: 34rpx;
}

.intro-title {
  margin-top: 6rpx;
  font-size: 42rpx;
  line-height: 54rpx;
  font-weight: 700;
}

.intro-desc {
  margin-top: 8rpx;
}

.intro-badge {
  flex: 0 0 auto;
  align-self: flex-start;
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.16);
  font-size: 22rpx;
}

.compare-steps {
  display: flex;
  align-items: center;
  margin-top: 22rpx;
  padding: 18rpx 22rpx;
  border-radius: 16rpx;
  background: #ffffff;
  box-sizing: border-box;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 10rpx;
  color: #788499;
  font-size: 23rpx;
  line-height: 32rpx;
  white-space: nowrap;
}

.step-item text {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  text-align: center;
  line-height: 36rpx;
  background: #edf1f7;
  color: #667085;
  font-size: 22rpx;
  font-weight: 650;
}

.step-item.active {
  color: #1f5fc8;
}

.step-item.active text {
  background: #317cff;
  color: #ffffff;
}

.step-line {
  flex: 1;
  height: 2rpx;
  margin: 0 14rpx;
  background: #e4eaf3;
}

.compare-panel,
.result-panel,
.history-summary {
  margin-top: 24rpx;
  padding: 28rpx;
  border-radius: 20rpx;
  background: #ffffff;
  box-shadow: 0 10rpx 28rpx rgba(23, 42, 71, 0.06);
  box-sizing: border-box;
}

.history-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.history-summary-actions {
  flex: 0 0 auto;
  display: flex;
  gap: 12rpx;
}

.compare-workbench {
  display: flex;
  gap: 18rpx;
  margin-top: 24rpx;
}

.compare-workbench .compare-panel {
  flex: 1;
  min-width: 0;
  margin-top: 0;
}

.panel-head,
.result-head,
.history-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
}

.section-label,
.block-title {
  color: #1d2c45;
  font-size: 30rpx;
  line-height: 40rpx;
  font-weight: 700;
}

.section-desc {
  margin-top: 4rpx;
  color: #6d7788;
  font-size: 23rpx;
  line-height: 34rpx;
  word-break: break-all;
}

.mini-action {
  flex: 0 0 auto;
  min-width: 136rpx;
  height: 58rpx;
  padding: 0 18rpx;
  border-radius: 29rpx;
  background: #317cff;
  color: #ffffff;
  font-size: 24rpx;
  line-height: 58rpx;
}

.mini-action.target {
  background: #31a891;
}

.mini-action.ghost {
  background: #eef4ff;
  color: #2f6fd6;
}

.input-mode-tabs {
  display: flex;
  gap: 10rpx;
  margin-top: 22rpx;
  padding: 6rpx;
  border-radius: 14rpx;
  background: #f1f5f9;
}

.input-mode-tab {
  flex: 1;
  height: 58rpx;
  border-radius: 10rpx;
  color: #526071;
  font-size: 25rpx;
  line-height: 58rpx;
  text-align: center;
}

.input-mode-tab.active {
  background: #ffffff;
  color: #1f5fc8;
  font-weight: 650;
  box-shadow: 0 4rpx 10rpx rgba(23, 42, 71, 0.06);
}

.input-mode-tabs.target .input-mode-tab.active {
  color: #15806f;
}

.selected-row {
  display: flex;
  justify-content: space-between;
  gap: 18rpx;
  margin-top: 18rpx;
  padding: 16rpx 18rpx;
  border-radius: 14rpx;
  background: #f1f6ff;
  color: #1f2937;
  font-size: 24rpx;
}

.selected-row text:first-child {
  min-width: 0;
  word-break: break-all;
}

.selected-row text:last-child {
  flex: 0 0 auto;
  color: #317cff;
}

.selected-row.target text:last-child {
  color: #15806f;
}

.pick-box,
.upload-box {
  margin-top: 20rpx;
  padding: 26rpx;
  border: 2rpx dashed #317cff;
  border-radius: 18rpx;
  background: #f7faff;
  box-sizing: border-box;
}

.pick-box.history {
  border: 2rpx solid #d8e5ff;
  background: #f7faff;
}

.upload-box.target {
  border-color: #31a891;
  background: #f4fffb;
}

.pick-box.target {
  border-color: #cdece5;
  background: #f4fffb;
}

.upload-main {
  color: #235fc8;
  font-size: 28rpx;
  line-height: 38rpx;
  font-weight: 650;
  word-break: break-all;
}

.target .upload-main,
.upload-box.target .upload-main {
  color: #147f6f;
}

.upload-sub {
  margin-top: 8rpx;
  color: #7c8798;
  font-size: 23rpx;
  line-height: 34rpx;
}

.text-input {
  margin-top: 18rpx;
  width: 100%;
  min-height: 172rpx;
  padding: 22rpx;
  border-radius: 16rpx;
  background: #f7f9fc;
  color: #1f2937;
  font-size: 26rpx;
  line-height: 38rpx;
  box-sizing: border-box;
}

.compare-button {
  margin-top: 26rpx;
  height: 92rpx;
  border-radius: 46rpx;
  background: #317cff;
  color: #ffffff;
  font-size: 30rpx;
  line-height: 92rpx;
  font-weight: 650;
}

.compare-button[disabled] {
  background: #b8c8e8;
  color: rgba(255, 255, 255, 0.78);
}

.result-summary {
  margin-top: 8rpx;
  color: #334155;
  font-size: 26rpx;
  line-height: 40rpx;
}

.risk-tag {
  flex: 0 0 auto;
  padding: 8rpx 18rpx;
  border-radius: 999rpx;
  font-size: 23rpx;
}

.risk-high {
  color: #b42318;
  background: #fff0ed;
}

.risk-medium {
  color: #9a5b00;
  background: #fff6db;
}

.risk-low {
  color: #087443;
  background: #e7f8ef;
}

.risk-unknown {
  color: #5c667a;
  background: #eef2f7;
}

.error-message {
  margin-top: 18rpx;
  color: #c0362c;
  font-size: 25rpx;
  line-height: 38rpx;
}

.result-block {
  margin-top: 24rpx;
}

.result-item,
.empty-line {
  margin-top: 14rpx;
  padding-left: 20rpx;
  border-left: 4rpx solid #d9e6ff;
  color: #4b5565;
  font-size: 25rpx;
  line-height: 38rpx;
}

.result-block.danger .result-item {
  border-left-color: #f04438;
}

.result-block.warning .result-item {
  border-left-color: #f79009;
}

.empty-line {
  color: #98a2b3;
}

.history-list {
  margin-top: 18rpx;
}

.history-list.popup {
  max-height: 58vh;
}

.history-item {
  padding: 18rpx;
  border: 1rpx solid #e7edf6;
  border-radius: 16rpx;
  background: #fbfdff;
}

.history-item + .history-item {
  margin-top: 14rpx;
}

.history-top text:first-child {
  min-width: 0;
  color: #1f2937;
  font-size: 25rpx;
  line-height: 36rpx;
  font-weight: 650;
}

.history-top text:last-child {
  flex: 0 0 auto;
  font-size: 23rpx;
}

.history-files,
.history-time,
.history-empty {
  margin-top: 8rpx;
  color: #667085;
  font-size: 23rpx;
  line-height: 34rpx;
}

.risk-text-high {
  color: #b42318;
}

.risk-text-medium {
  color: #9a5b00;
}

.risk-text-low {
  color: #087443;
}

.picker-sheet {
  max-height: 72vh;
  padding: 26rpx 28rpx calc(26rpx + env(safe-area-inset-bottom));
  border-radius: 24rpx 24rpx 0 0;
  background: #ffffff;
  box-sizing: border-box;
}

.history-sheet {
  max-height: 74vh;
  padding: 26rpx 28rpx calc(26rpx + env(safe-area-inset-bottom));
  border-radius: 24rpx 24rpx 0 0;
  background: #ffffff;
  box-sizing: border-box;
}

.history-sheet-head {
  display: flex;
  justify-content: space-between;
  gap: 20rpx;
  color: #1f2937;
}

.history-sheet-head text:first-child {
  font-size: 30rpx;
  line-height: 42rpx;
  font-weight: 650;
}

.history-sheet-head view view {
  margin-top: 4rpx;
  color: #667085;
  font-size: 23rpx;
  line-height: 34rpx;
}

.history-sheet-actions {
  flex: 0 0 auto;
  display: flex;
  gap: 22rpx;
}

.history-sheet-actions text {
  color: #317cff;
  font-size: 26rpx;
  line-height: 42rpx;
}

.picker-head {
  display: flex;
  justify-content: space-between;
  color: #1f2937;
  font-size: 30rpx;
  line-height: 42rpx;
  font-weight: 650;
}

.picker-head text:last-child {
  color: #317cff;
  font-size: 26rpx;
  font-weight: 500;
}

.picker-list {
  max-height: 58vh;
  margin-top: 18rpx;
}

.picker-item {
  padding: 20rpx 0;
  border-bottom: 1rpx solid #eef2f7;
}

.picker-item view {
  color: #1f2937;
  font-size: 27rpx;
  line-height: 38rpx;
}

.picker-item text {
  display: block;
  margin-top: 4rpx;
  color: #667085;
  font-size: 23rpx;
}

.picker-item.disabled view,
.picker-item.disabled text {
  color: #b4bdca;
}
</style>

