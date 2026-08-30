<template>
  <div class="contract-compare-page">
    <div class="page-toolbar">
      <div>
        <div class="breadcrumb">{{ t.breadcrumb }}</div>
        <h1>{{ t.pageTitle }}</h1>
        <p>{{ t.pageDesc }}</p>
      </div>
      <a-space>
        <a-button @click="resetForm">{{ t.reset }}</a-button>
        <a-button type="primary" :loading="comparing" @click="startCompare">
          {{ t.compareAction }}
        </a-button>
      </a-space>
    </div>

    <a-row :gutter="18" class="main-grid">
      <a-col :span="16">
        <a-card class="work-card" :bordered="false">
          <div class="step-strip">
            <span class="step active">{{ t.stepSource }}</span>
            <span class="step-line"></span>
            <span class="step active">{{ t.stepTarget }}</span>
            <span class="step-line"></span>
            <span class="step">{{ t.stepResult }}</span>
          </div>

          <div class="scenario-list">
            <button
              v-for="scenario in compareScenarios"
              :key="scenario.value"
              type="button"
              class="scenario-card"
              :class="{ active: activeScenario === scenario.value }"
              @click="activeScenario = scenario.value"
            >
              <strong>{{ scenario.title }}</strong>
              <span>{{ scenario.desc }}</span>
            </button>
          </div>

          <a-row :gutter="16">
            <a-col :span="12">
              <section class="compare-column">
                <header>
                  <span class="column-kicker">{{ t.sourceKicker }}</span>
                  <h2>{{ t.sourceTitle }}</h2>
                  <p>{{ t.sourceDesc }}</p>
                </header>
                <a-select
                  v-model="form.sourceContractId"
                  allow-clear
                  allow-search
                  :placeholder="t.sourcePlaceholder"
                  @change="handleContractChange('source', $event)"
                >
                  <a-option
                    v-for="item in contractOptions"
                    :key="item.id"
                    :value="String(item.id)"
                    :disabled="!isReadableContract(item)"
                  >
                    {{ contractName(item) }}
                    <span v-if="!isReadableContract(item)" class="option-muted">{{ t.unreadableContract }}</span>
                  </a-option>
                </a-select>
                <div v-if="form.sourceFileName" class="selected-contract">
                  <strong>{{ form.sourceFileName }}</strong>
                  <span>{{ form.sourceFileUrl ? t.linkedFile : t.linkedRecord }}</span>
                </div>
                <a-upload
                  class="compare-upload"
                  :custom-request="(options) => customUpload('source', options)"
                  :show-file-list="false"
                  :limit="1"
                  accept=".pdf,.docx,.txt"
                >
                  <template #upload-button>
                    <button class="upload-trigger" type="button">
                      <span>{{ form.sourceFileUrl && !form.sourceContractId ? t.replaceSourceFile : t.uploadSourceFile }}</span>
                      <small>{{ t.uploadHint }}</small>
                    </button>
                  </template>
                </a-upload>
                <div class="text-toggle">
                  <span>{{ form.sourceContractId ? t.sourceTextFallback : t.directPaste }}</span>
                  <a-switch v-model="sourceTextExpanded" size="small" />
                </div>
                <a-textarea
                  v-if="showSourceTextInput"
                  v-model="form.sourceText"
                  :auto-size="{ minRows: 8, maxRows: 14 }"
                  :placeholder="t.sourceTextPlaceholder"
                />
              </section>
            </a-col>

            <a-col :span="12">
              <section class="compare-column target">
                <header>
                  <span class="column-kicker">{{ t.targetKicker }}</span>
                  <h2>{{ t.targetTitle }}</h2>
                  <p>{{ t.targetDesc }}</p>
                </header>
                <a-select
                  v-model="form.targetContractId"
                  allow-clear
                  allow-search
                  :placeholder="t.targetPlaceholder"
                  @change="handleContractChange('target', $event)"
                >
                  <a-option
                    v-for="item in contractOptions"
                    :key="item.id"
                    :value="String(item.id)"
                    :disabled="!isReadableContract(item)"
                  >
                    {{ contractName(item) }}
                    <span v-if="!isReadableContract(item)" class="option-muted">{{ t.unreadableContract }}</span>
                  </a-option>
                </a-select>
                <div v-if="form.targetFileName" class="selected-contract">
                  <strong>{{ form.targetFileName }}</strong>
                  <span>{{ form.targetFileUrl ? t.linkedFile : t.linkedRecord }}</span>
                </div>
                <a-upload
                  class="compare-upload"
                  :custom-request="(options) => customUpload('target', options)"
                  :show-file-list="false"
                  :limit="1"
                  accept=".pdf,.docx,.txt"
                >
                  <template #upload-button>
                    <button class="upload-trigger" type="button">
                      <span>{{ form.targetFileUrl && !form.targetContractId ? t.replaceTargetFile : t.uploadTargetFile }}</span>
                      <small>{{ t.uploadHint }}</small>
                    </button>
                  </template>
                </a-upload>
                <div class="text-toggle">
                  <span>{{ form.targetContractId ? t.targetTextFallback : t.directPaste }}</span>
                  <a-switch v-model="targetTextExpanded" size="small" />
                </div>
                <a-textarea
                  v-if="showTargetTextInput"
                  v-model="form.targetText"
                  :auto-size="{ minRows: 8, maxRows: 14 }"
                  :placeholder="t.targetTextPlaceholder"
                />
              </section>
            </a-col>
          </a-row>

          <section v-if="compareResult" class="result-card">
            <div class="result-header">
              <div>
                <span class="column-kicker">{{ t.resultKicker }}</span>
                <h2>{{ compareResult.summary || t.resultDefault }}</h2>
              </div>
              <a-tag :color="riskColor" size="large">{{ riskLabel }}</a-tag>
            </div>

            <a-alert
              v-if="compareResult.errorMessage"
              class="result-error"
              type="error"
              :content="compareResult.errorMessage"
            />

            <div class="result-grid">
              <section
                v-for="section in resultSections"
                :key="section.title"
                class="result-section"
                :class="section.type"
              >
                <h3>{{ section.title }}</h3>
                <div v-if="section.items.length" class="result-items">
                  <p v-for="(item, index) in section.items" :key="index">{{ item }}</p>
                </div>
                <a-empty v-else :description="section.empty" />
              </section>
            </div>
          </section>
        </a-card>
      </a-col>

      <a-col :span="8">
        <a-card class="side-card" :bordered="false">
          <div class="side-head">
            <div>
              <h2>{{ t.historyTitle }}</h2>
              <p>{{ t.historyDesc }}</p>
            </div>
            <a-button size="mini" @click="reloadHistory">{{ t.refresh }}</a-button>
          </div>

          <a-spin :loading="historyLoading">
            <div v-if="historyList.length" class="history-list">
              <article
                v-for="item in historyList"
                :key="item.id || item.createTime"
                class="history-item"
                :class="{ active: compareResult && String(compareResult.id) === String(item.id) }"
                @click="loadHistoryDetail(item)"
              >
                <div class="history-top">
                  <a-tag size="small" :color="Number(item.status) === 2 ? 'red' : 'green'">
                    {{ Number(item.status) === 2 ? t.failed : t.completed }}
                  </a-tag>
                  <span>{{ formatRisk(item.riskLevel) }}</span>
                </div>
                <strong>{{ item.summary || t.historyDefault }}</strong>
                <div class="history-files">
                  <span>{{ item.sourceFileName || t.sourceShort }}</span>
                  <span>{{ item.targetFileName || t.targetShort }}</span>
                </div>
                <p v-if="item.errorMessage" class="history-error">{{ item.errorMessage }}</p>
                <div class="history-footer">
                  <span>{{ item.createTime || '' }}</span>
                  <a-popconfirm :content="t.deleteConfirm" @ok="deleteHistory(item)">
                    <a-button size="mini" type="text" status="danger" @click.stop>{{ t.delete }}</a-button>
                  </a-popconfirm>
                </div>
              </article>
            </div>
            <a-empty v-else :description="t.historyEmpty" />
            <a-button
              v-if="historyList.length && historyHasMore"
              class="history-more"
              long
              :loading="historyLoading"
              @click="loadMoreHistory"
            >
              {{ t.loadMore }}
            </a-button>
          </a-spin>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script>
  import { Message } from '@arco-design/web-vue';
  import {
    compareContracts,
    deleteContractCompareRecord,
    getContractCompareList,
    getContractCompareRecord,
    getContractList,
    uploadContractFile,
  } from '@/api/contract';

  const text = {
    breadcrumb: '\u5408\u540c\u7b7e\u7f72 / \u5408\u540c\u6bd4\u5bf9',
    pageTitle: '\u5408\u540c\u6bd4\u5bf9',
    pageDesc:
      '\u9009\u62e9\u57fa\u51c6\u5408\u540c\u548c\u76ee\u6807\u5408\u540c\uff0c\u751f\u6210\u5dee\u5f02\u3001\u98ce\u9669\u548c\u7f3a\u5931\u6761\u6b3e\u7ed3\u8bba\u3002',
    reset: '\u91cd\u7f6e',
    compareAction: '\u751f\u6210\u6bd4\u5bf9\u7ed3\u679c',
    stepSource: '1 \u9009\u62e9\u57fa\u51c6\u5408\u540c',
    stepTarget: '2 \u9009\u62e9\u5f85\u6bd4\u5bf9\u5408\u540c',
    stepResult: '3 \u8f93\u51fa\u5dee\u5f02\u548c\u98ce\u9669',
    sourceKicker: '\u57fa\u51c6\u7248\u672c',
    sourceTitle: '\u5386\u53f2\u5408\u540c\u6216\u6807\u51c6\u6a21\u677f',
    sourceDesc: '\u5efa\u8bae\u9009\u62e9\u5df2\u7b7e\u7f72\u3001\u5df2\u5ba1\u6838\u6216\u4f01\u4e1a\u6807\u51c6\u6a21\u677f\u4f5c\u4e3a\u57fa\u51c6\u3002',
    targetKicker: '\u76ee\u6807\u7248\u672c',
    targetTitle: '\u5f85\u7b7e\u7f72\u6216\u65b0\u7248\u672c\u5408\u540c',
    targetDesc: '\u9009\u62e9\u672c\u6b21\u51c6\u5907\u7b7e\u7f72\u3001\u7eed\u7b7e\u6216\u4fee\u8ba2\u540e\u7684\u5408\u540c\u3002',
    sourcePlaceholder: '\u4ece\u5408\u540c\u7ba1\u7406\u4e2d\u9009\u62e9\u57fa\u51c6\u5408\u540c',
    targetPlaceholder: '\u4ece\u5408\u540c\u7ba1\u7406\u4e2d\u9009\u62e9\u5f85\u6bd4\u5bf9\u5408\u540c',
    linkedFile: '\u5df2\u5173\u8054\u5408\u540c\u6587\u4ef6',
    linkedRecord: '\u5df2\u5173\u8054\u5408\u540c\u8bb0\u5f55',
    sourceTextFallback: '\u5408\u540c\u6587\u4ef6\u65e0\u6cd5\u63d0\u53d6\u65f6\u53ef\u8865\u5145\u6587\u672c',
    targetTextFallback: '\u5408\u540c\u6587\u4ef6\u65e0\u6cd5\u63d0\u53d6\u65f6\u53ef\u8865\u5145\u6587\u672c',
    directPaste: '\u4e5f\u53ef\u4ee5\u76f4\u63a5\u7c98\u8d34\u5408\u540c\u6587\u672c',
    unreadableContract: '\uff08\u65e0\u53ef\u8bfb\u6587\u4ef6\uff09',
    uploadSourceFile: '\u4e0a\u4f20\u57fa\u51c6\u5408\u540c\u6587\u4ef6',
    uploadTargetFile: '\u4e0a\u4f20\u5f85\u6bd4\u5bf9\u5408\u540c\u6587\u4ef6',
    replaceSourceFile: '\u66ff\u6362\u57fa\u51c6\u5408\u540c\u6587\u4ef6',
    replaceTargetFile: '\u66ff\u6362\u5f85\u6bd4\u5bf9\u5408\u540c\u6587\u4ef6',
    uploadHint: 'PDF / DOCX / TXT',
    sourceTextPlaceholder: '\u7c98\u8d34\u57fa\u51c6\u5408\u540c\u6587\u672c',
    targetTextPlaceholder: '\u7c98\u8d34\u5f85\u6bd4\u5bf9\u5408\u540c\u6587\u672c',
    scopeTitle: '\u5904\u7406\u8303\u56f4',
    scopeDesc:
      '\u652f\u6301\u53ef\u63d0\u53d6\u6587\u672c\u7684 PDF\u3001Word\u3001\u5df2\u5f52\u6863\u5408\u540c\u6587\u4ef6\u548c\u624b\u52a8\u6587\u672c\u3002\u626b\u63cf\u4ef6\u6216\u56fe\u7247\u5408\u540c\u5efa\u8bae\u5148 OCR \u540e\u518d\u6bd4\u5bf9\u3002',
    resultKicker: '\u6bd4\u5bf9\u7ed3\u679c',
    resultDefault: '\u5df2\u751f\u6210\u5408\u540c\u6bd4\u5bf9\u7ed3\u679c',
    historyTitle: '\u6bd4\u5bf9\u5386\u53f2',
    historyDesc: '\u6309\u5f53\u524d\u7528\u6237\u548c\u4f01\u4e1a\u8303\u56f4\u4fdd\u5b58\uff0c\u4fbf\u4e8e\u7248\u672c\u8ffd\u8e2a\u548c\u590d\u6838\u3002',
    refresh: '\u5237\u65b0',
    failed: '\u5931\u8d25',
    completed: '\u5b8c\u6210',
    historyDefault: '\u5408\u540c\u6bd4\u5bf9\u8bb0\u5f55',
    sourceShort: '\u57fa\u51c6\u5408\u540c',
    targetShort: '\u5f85\u6bd4\u5bf9\u5408\u540c',
    deleteConfirm: '\u786e\u5b9a\u5220\u9664\u8fd9\u6761\u6bd4\u5bf9\u8bb0\u5f55\uff1f',
    delete: '\u5220\u9664',
    historyEmpty: '\u6682\u65e0\u6bd4\u5bf9\u8bb0\u5f55',
    loadMore: '\u52a0\u8f7d\u66f4\u591a',
    historyLoadFailed: '\u6bd4\u5bf9\u8bb0\u5f55\u52a0\u8f7d\u5931\u8d25',
    contractLoadFailed: '\u5386\u53f2\u5408\u540c\u52a0\u8f7d\u5931\u8d25\uff0c\u53ef\u5148\u7c98\u8d34\u5408\u540c\u6587\u672c\u8fdb\u884c\u6bd4\u5bf9',
    uploadFailed: '\u5408\u540c\u6587\u4ef6\u4e0a\u4f20\u5931\u8d25',
    deleteSuccess: '\u8bb0\u5f55\u5df2\u5220\u9664',
    deleteFailed: '\u5220\u9664\u5931\u8d25',
    sourceRequired: '\u8bf7\u9009\u62e9\u6216\u586b\u5199\u57fa\u51c6\u5408\u540c',
    targetRequired: '\u8bf7\u9009\u62e9\u6216\u586b\u5199\u5f85\u6bd4\u5bf9\u5408\u540c',
    sourceUnreadable: '\u57fa\u51c6\u5408\u540c\u7f3a\u5c11\u53ef\u63d0\u53d6\u6587\u672c\u7684\u6587\u4ef6\uff0c\u8bf7\u4e0a\u4f20 PDF/DOCX/TXT \u6216\u7c98\u8d34\u6587\u672c',
    targetUnreadable: '\u5f85\u6bd4\u5bf9\u5408\u540c\u7f3a\u5c11\u53ef\u63d0\u53d6\u6587\u672c\u7684\u6587\u4ef6\uff0c\u8bf7\u4e0a\u4f20 PDF/DOCX/TXT \u6216\u7c98\u8d34\u6587\u672c',
    compareSuccess: '\u6bd4\u5bf9\u5b8c\u6210',
    compareFailed: '\u6bd4\u5bf9\u5931\u8d25',
    riskHigh: '\u9ad8\u98ce\u9669',
    riskMedium: '\u4e2d\u98ce\u9669',
    riskLow: '\u4f4e\u98ce\u9669',
    riskUnknown: '\u672a\u5206\u7ea7',
    contractPrefix: '\u5408\u540c',
    diffTitle: '\u4e3b\u8981\u5dee\u5f02',
    diffEmpty: '\u6682\u65e0\u660e\u663e\u5dee\u5f02',
    riskTitle: '\u98ce\u9669\u70b9',
    riskEmpty: '\u6682\u65e0\u98ce\u9669\u70b9',
    missingTitle: '\u7f3a\u5931\u6761\u6b3e',
    missingEmpty: '\u6682\u65e0\u7f3a\u5931\u6761\u6b3e',
    suggestionTitle: '\u4fee\u6539\u5efa\u8bae',
    suggestionEmpty: '\u6682\u65e0\u4fee\u6539\u5efa\u8bae',
  };

  const compareScenarios = [
    {
      value: 'general',
      title: '通用比对',
      desc: '适合常规合同版本差异和条款变化复核',
    },
    {
      value: 'renewal',
      title: '续签复核',
      desc: '关注价格、期限、责任边界和服务范围变化',
    },
    {
      value: 'risk',
      title: '风险审查',
      desc: '优先输出高风险差异、缺失条款和修改建议',
    },
  ];

  export default {
    name: 'ContractCompare',
    data() {
      return {
        t: text,
        comparing: false,
        historyLoading: false,
        sourceTextExpanded: false,
        targetTextExpanded: false,
        contractOptions: [],
        historyList: [],
        historyPage: 1,
        historyPageSize: 8,
        historyHasMore: false,
        compareResult: null,
        activeScenario: 'general',
        compareScenarios,
        form: {
          sourceContractId: '',
          sourceFileUrl: '',
          sourceFileName: '',
          sourceText: '',
          targetContractId: '',
          targetFileUrl: '',
          targetFileName: '',
          targetText: '',
        },
      };
    },
    computed: {
      showSourceTextInput() {
        return !this.form.sourceContractId || this.sourceTextExpanded || Boolean(String(this.form.sourceText || '').trim());
      },
      showTargetTextInput() {
        return !this.form.targetContractId || this.targetTextExpanded || Boolean(String(this.form.targetText || '').trim());
      },
      riskLabel() {
        return this.formatRisk(this.compareResult && this.compareResult.riskLevel);
      },
      riskColor() {
        const risk = String((this.compareResult && this.compareResult.riskLevel) || '').toLowerCase();
        if (risk.includes('high') || risk.includes('\u9ad8')) return 'red';
        if (risk.includes('medium') || risk.includes('\u4e2d')) return 'orange';
        return 'green';
      },
      resultSections() {
        const result = this.compareResult || {};
        return [
          {
            title: this.t.diffTitle,
            items: result.differenceSummary || [],
            empty: this.t.diffEmpty,
            type: '',
          },
          {
            title: this.t.riskTitle,
            items: result.riskPoints || [],
            empty: this.t.riskEmpty,
            type: 'danger',
          },
          {
            title: this.t.missingTitle,
            items: result.missingClauses || [],
            empty: this.t.missingEmpty,
            type: 'warning',
          },
          {
            title: this.t.suggestionTitle,
            items: result.suggestions || [],
            empty: this.t.suggestionEmpty,
            type: '',
          },
        ];
      },
    },
    mounted() {
      this.loadContracts();
      this.loadHistory(true);
    },
    methods: {
      async loadContracts() {
        try {
          const res = await getContractList({ pageNum: 1, pageSize: 80 });
          this.contractOptions = this.normalizeRows(res);
        } catch (error) {
          this.contractOptions = [];
          Message.warning(this.t.contractLoadFailed);
        }
      },
      async loadHistory(silent, append = false) {
        this.historyLoading = true;
        try {
          const pageNum = append ? this.historyPage + 1 : 1;
          const res = await getContractCompareList({
            pageNum,
            pageSize: this.historyPageSize,
          });
          const rows = this.normalizeRows(res).map(this.normalizeResult);
          this.historyPage = pageNum;
          this.historyHasMore = rows.length >= this.historyPageSize;
          this.historyList = append ? this.historyList.concat(rows) : rows;
        } catch (error) {
          if (!append) {
            this.historyList = [];
            this.historyHasMore = false;
          }
          if (!silent) {
            Message.error(this.t.historyLoadFailed);
          }
        } finally {
          this.historyLoading = false;
        }
      },
      reloadHistory() {
        this.loadHistory(false, false);
      },
      loadMoreHistory() {
        this.loadHistory(false, true);
      },
      async loadHistoryDetail(item) {
        if (!item || !item.id) {
          this.compareResult = this.normalizeResult(item);
          return;
        }
        try {
          const res = await getContractCompareRecord(item.id);
          this.compareResult = this.normalizeResult(res);
        } catch (error) {
          this.compareResult = this.normalizeResult(item);
        }
      },
      async deleteHistory(item) {
        if (!item || !item.id) return;
        try {
          await deleteContractCompareRecord(item.id);
          Message.success(this.t.deleteSuccess);
          this.historyList = this.historyList.filter((record) => String(record.id) !== String(item.id));
          if (this.compareResult && String(this.compareResult.id) === String(item.id)) {
            this.compareResult = null;
          }
          if (!this.historyList.length) {
            this.loadHistory(true, false);
          }
        } catch (error) {
          Message.error(error.message || this.t.deleteFailed);
        }
      },
      handleContractChange(role, value) {
        const item = this.contractOptions.find((contract) => String(contract.id) === String(value));
        const prefix = role === 'source' ? 'source' : 'target';
        if (item && !this.isReadableContract(item)) {
          Message.warning(role === 'source' ? this.t.sourceUnreadable : this.t.targetUnreadable);
          this.form[`${prefix}ContractId`] = '';
          this.form[`${prefix}FileUrl`] = '';
          this.form[`${prefix}FileName`] = '';
          return;
        }
        this.form[`${prefix}FileUrl`] = item ? this.resolveContractFileUrl(item) : '';
        this.form[`${prefix}FileName`] = item ? this.contractName(item) : '';
        if (role === 'source' && !this.form.sourceText) {
          this.sourceTextExpanded = false;
        }
        if (role === 'target' && !this.form.targetText) {
          this.targetTextExpanded = false;
        }
      },
      customUpload(role, options) {
        const { fileItem, onProgress, onSuccess, onError } = options;
        if (!fileItem || !fileItem.file) {
          const error = new Error(this.t.uploadFailed);
          onError(error);
          return { abort() {} };
        }
        const prefix = role === 'source' ? 'source' : 'target';
        uploadContractFile(fileItem.file, {
          onUploadProgress: (progressEvent) => {
            if (!progressEvent.total) return;
            onProgress({
              percent: Math.floor((progressEvent.loaded / progressEvent.total) * 100),
            });
          },
        })
          .then((res) => {
            if (res.code === 0 && res.data) {
              this.form[`${prefix}ContractId`] = '';
              this.form[`${prefix}FileUrl`] = res.data.url;
              this.form[`${prefix}FileName`] = res.data.name || fileItem.name;
              Message.success(`${res.data.name || fileItem.name} \u5df2\u4e0a\u4f20`);
              onSuccess(res.data);
              return;
            }
            const message = res.message || this.t.uploadFailed;
            Message.error(message);
            onError(new Error(message));
          })
          .catch((error) => {
            Message.error(error.message || this.t.uploadFailed);
            onError(error);
          });
        return { abort() {} };
      },
      async startCompare() {
        if (this.comparing) return;
        if (!this.hasSource()) {
          Message.warning(this.t.sourceRequired);
          return;
        }
        if (!this.hasTarget()) {
          Message.warning(this.t.targetRequired);
          return;
        }
        if (this.form.sourceContractId && !this.form.sourceFileUrl && !String(this.form.sourceText || '').trim()) {
          Message.warning(this.t.sourceUnreadable);
          return;
        }
        if (this.form.targetContractId && !this.form.targetFileUrl && !String(this.form.targetText || '').trim()) {
          Message.warning(this.t.targetUnreadable);
          return;
        }

        this.comparing = true;
        try {
          const res = await compareContracts({
            sourceContractId: this.form.sourceContractId || undefined,
            sourceFileUrl: this.form.sourceFileUrl || undefined,
            sourceFileName: this.form.sourceFileName || undefined,
            sourceText: this.form.sourceText || undefined,
            targetContractId: this.form.targetContractId || undefined,
            targetFileUrl: this.form.targetFileUrl || undefined,
            targetFileName: this.form.targetFileName || undefined,
            targetText: this.form.targetText || undefined,
          });
          this.compareResult = this.normalizeResult(res);
          Message.success(this.t.compareSuccess);
          this.loadHistory(true);
        } catch (error) {
          Message.error(error.message || this.t.compareFailed);
        } finally {
          this.comparing = false;
        }
      },
      resetForm() {
        this.form = {
          sourceContractId: '',
          sourceFileUrl: '',
          sourceFileName: '',
          sourceText: '',
          targetContractId: '',
          targetFileUrl: '',
          targetFileName: '',
          targetText: '',
        };
        this.sourceTextExpanded = false;
        this.targetTextExpanded = false;
        this.compareResult = null;
      },
      hasSource() {
        return Boolean(this.form.sourceFileUrl || String(this.form.sourceText || '').trim());
      },
      hasTarget() {
        return Boolean(this.form.targetFileUrl || String(this.form.targetText || '').trim());
      },
      contractName(item) {
        return item.name || item.fileName || `${this.t.contractPrefix} ${item.id || ''}`;
      },
      resolveContractFileUrl(item) {
        return (item && (item.url || item.sourceFileUrl || item.fileUrl || item.voucherUrl)) || '';
      },
      isReadableContract(item) {
        const url = this.resolveContractFileUrl(item);
        if (!url) return false;
        return /\.(pdf|docx|txt)(\?|#|$)/i.test(url);
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
      ensureArray(value) {
        if (Array.isArray(value)) return value.filter(Boolean);
        if (!value) return [];
        return String(value)
          .split(/\n|;|\uff1b/)
          .map((item) => item.trim())
          .filter(Boolean);
      },
      formatRisk(value) {
        const risk = String(value || '').toLowerCase();
        if (risk.includes('high') || risk.includes('\u9ad8')) return this.t.riskHigh;
        if (risk.includes('medium') || risk.includes('\u4e2d')) return this.t.riskMedium;
        if (risk.includes('low') || risk.includes('\u4f4e')) return this.t.riskLow;
        return this.t.riskUnknown;
      },
    },
  };
</script>

<style lang="less" scoped>
  .contract-compare-page {
    padding: 20px;
    background: #f5f7fb;
    min-height: calc(100vh - 64px);
  }

  .page-toolbar {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 24px;
    margin-bottom: 16px;

    h1 {
      margin: 4px 0 8px;
      color: #1d2533;
      font-size: 24px;
      line-height: 32px;
      font-weight: 650;
    }

    p {
      max-width: 820px;
      margin: 0;
      color: #667085;
      font-size: 14px;
      line-height: 22px;
    }
  }

  .breadcrumb {
    color: #8a94a6;
    font-size: 13px;
    line-height: 20px;
  }

  .work-card,
  .side-card {
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(28, 41, 61, 0.06);
  }

  .main-grid {
    align-items: stretch;
  }

  .step-strip {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 18px;
    padding: 12px 16px;
    border-radius: 8px;
    background: #f7faff;
  }

  .step {
    color: #667085;
    font-size: 13px;
    white-space: nowrap;

    &.active {
      color: #317cff;
      font-weight: 650;
    }
  }

  .step-line {
    flex: 1;
    height: 1px;
    background: #dce6f5;
  }

  .scenario-list {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 18px;
  }

  .scenario-card {
    min-height: 76px;
    padding: 12px 14px;
    border: 1px solid #e1e8f5;
    border-radius: 8px;
    background: #ffffff;
    text-align: left;
    cursor: pointer;
    transition: border-color 0.2s ease, background 0.2s ease;

    strong {
      display: block;
      color: #1f2937;
      font-size: 14px;
      line-height: 22px;
      font-weight: 650;
    }

    span {
      display: block;
      margin-top: 4px;
      color: #667085;
      font-size: 12px;
      line-height: 18px;
    }

    &.active,
    &:hover {
      border-color: #317cff;
      background: #f7faff;
    }
  }

  .compare-column {
    min-height: 388px;
    padding: 18px;
    border: 1px solid #e6ecf5;
    border-radius: 8px;
    background: #fbfdff;

    &.target {
      background: #fbfffc;
    }

    header {
      margin-bottom: 14px;
    }

    h2 {
      margin: 4px 0 6px;
      color: #1f2937;
      font-size: 18px;
      line-height: 26px;
      font-weight: 650;
    }

    p {
      margin: 0;
      color: #667085;
      font-size: 13px;
      line-height: 20px;
    }
  }

  .column-kicker {
    display: inline-flex;
    color: #317cff;
    font-size: 12px;
    line-height: 18px;
    font-weight: 650;
  }

  .selected-contract {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-top: 12px;
    padding: 10px 12px;
    border-radius: 8px;
    background: #eef5ff;

    strong {
      color: #1f2937;
      font-size: 14px;
      line-height: 20px;
      word-break: break-all;
    }

    span {
      color: #667085;
      font-size: 12px;
      line-height: 18px;
    }
  }

  .option-muted {
    margin-left: 6px;
    color: #a0a8b6;
    font-size: 12px;
  }

  .compare-upload {
    display: block;
    margin-top: 12px;
  }

  .upload-trigger {
    width: 100%;
    min-height: 64px;
    padding: 10px 14px;
    border: 1px dashed #b7c8e6;
    border-radius: 8px;
    background: #ffffff;
    color: #317cff;
    text-align: center;
    cursor: pointer;
    transition: border-color 0.2s ease, background 0.2s ease;

    span {
      display: block;
      font-size: 14px;
      line-height: 22px;
      font-weight: 650;
    }

    small {
      display: block;
      margin-top: 2px;
      color: #667085;
      font-size: 12px;
      line-height: 18px;
    }

    &:hover {
      border-color: #317cff;
      background: #f5f9ff;
    }
  }

  .text-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin: 14px 0 10px;
    color: #667085;
    font-size: 13px;
    line-height: 20px;
  }

  .result-card {
    margin-top: 18px;
    padding: 18px;
    border: 1px solid #e6ecf5;
    border-radius: 8px;
    background: #ffffff;
  }

  .result-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 16px;

    h2 {
      margin: 4px 0 0;
      color: #1f2937;
      font-size: 18px;
      line-height: 28px;
      font-weight: 650;
    }
  }

  .result-error {
    margin-bottom: 16px;
  }

  .result-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  .result-section {
    min-height: 156px;
    padding: 15px;
    border-radius: 8px;
    background: #f7faff;

    h3 {
      margin: 0 0 10px;
      color: #1f2937;
      font-size: 15px;
      line-height: 22px;
      font-weight: 650;
    }

    p {
      margin: 8px 0 0;
      padding-left: 10px;
      border-left: 3px solid #317cff;
      color: #4e5969;
      font-size: 13px;
      line-height: 22px;
    }

    &.danger p {
      border-left-color: #f53f3f;
    }

    &.warning p {
      border-left-color: #ff7d00;
    }
  }

  .side-card {
    min-height: 560px;
  }

  .side-head {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 12px;

    h2 {
      margin: 0 0 6px;
      color: #1f2937;
      font-size: 18px;
      line-height: 26px;
      font-weight: 650;
    }

    p {
      margin: 0;
      color: #667085;
      font-size: 13px;
      line-height: 20px;
    }
  }

  .history-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .history-item {
    padding: 14px;
    border: 1px solid #edf1f7;
    border-radius: 8px;
    background: #ffffff;
    cursor: pointer;
    transition: border-color 0.2s ease, background 0.2s ease;

    &.active,
    &:hover {
      border-color: #317cff;
      background: #f7faff;
    }

    strong {
      display: block;
      margin-top: 8px;
      color: #1f2937;
      font-size: 14px;
      line-height: 22px;
    }
  }

  .history-top,
  .history-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    color: #8a94a6;
    font-size: 12px;
    line-height: 18px;
  }

  .history-files {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-top: 10px;
    padding: 8px 10px;
    border-radius: 6px;
    background: #f3f6fb;
    color: #4e5969;
    font-size: 12px;
    line-height: 18px;
  }

  .history-error {
    margin: 8px 0 0;
    color: #c93535;
    font-size: 12px;
    line-height: 18px;
  }

  .history-footer {
    margin-top: 10px;
  }

  .history-more {
    margin-top: 12px;
  }
</style>
