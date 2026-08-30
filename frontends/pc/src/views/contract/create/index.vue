<template>
  <div class="container">
    <!-- 修改面包屑导航，设置为不可点击 -->
    <div class="static-breadcrumb">
      <span class="breadcrumb-item">合同签署</span>
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-item current">文件合同发起签署</span>
    </div>
    <a-card class="general-card">
      <div class="create-card-header">
        <span class="create-card-marker"></span>
        <span class="create-card-title">创建合同</span>
      </div>
      <a-form
        class="create-form"
        ref="form"
        :model="formData"
        layout="vertical"
        @submit="handleSubmit"
      >
        <!-- 合同上传区域 -->
        <section class="form-section upload-section">
          <div class="section-title">合同文件</div>
          <a-form-item
            field="url"
            validate-trigger="input"
            :rules="[{ required: true, message: '请上传合同文件' }]"
          >
            <div class="upload-area">
              <a-upload
                ref="uploadRef"
                :custom-request="customUpload"
                :limit="1"
                :show-file-list="false"
                :file-list="fileList"
                accept=".pdf,.doc,.docx"
                @click="uploadRef = $event"
              >
                <template #upload-button>
                  <div v-if="!formData.url && !uploadError" class="custom-upload-btn">
                    <img src="/images/ic_file_up.svg" class="upload-icon" alt="上传图标" />
                    <div class="upload-text-content">
                      <div class="primary-text">
                        将文件拖拽到此区域，或 <span class="highlight-text">点击上传</span>
                      </div>
                      <div class="secondary-text">
                        支持 PDF、Word 等格式
                      </div>
                    </div>
                  </div>
                </template>
              </a-upload>

              <!-- 自定义文件列表显示 -->
              <div v-if="formData.url && !uploadError" class="custom-file-item">
                <img src="/images/ic_file_pdf.svg" class="file-icon" alt="文件图标" />
                <div class="file-info">
                  <div class="file-name">{{ getFileName || '未命名文件' }}</div>
                  <div class="file-size">{{ formatFileSize(formData.fileSize) }}</div>
                </div>
                <!-- 文件操作区域，放在内部下方 -->
                <div class="file-actions">
                  <a-upload
                    :custom-request="customUpload"
                    :show-file-list="false"
                    :limit="1"
                    accept=".pdf,.doc,.docx"
                  >
                    <template #upload-button>
                      <img
                        src="/images/ic_reload.svg"
                        class="action-icon reload-icon"
                        alt="重新上传"
                      />
                    </template>
                  </a-upload>
                  <img
                    src="/images/ic_delete.svg"
                    class="action-icon delete-icon"
                    alt="删除"
                    @click="handleDeleteFile"
                  />
                </div>
              </div>

              <!-- 接口报错显示 -->
              <div v-if="uploadError" class="custom-file-item error-file-item">
                <img src="/images/ic_file_pdf.svg" class="file-icon" alt="文件图标" />
                <div class="file-info">
                  <div class="file-name error-text">{{ errorMessage }}</div>
                  <div class="file-size">上传失败，请重新上传</div>
                </div>
                <!-- 错误状态下的文件操作区域 -->
                <div class="file-actions">
                  <a-upload
                    :custom-request="customUpload"
                    :show-file-list="false"
                    :limit="1"
                    accept=".pdf,.doc,.docx"
                  >
                    <template #upload-button>
                      <img
                        src="/images/ic_reload.svg"
                        class="action-icon reload-icon"
                        alt="重新上传"
                      />
                    </template>
                  </a-upload>
                  <img
                    src="/images/ic_delete.svg"
                    class="action-icon delete-icon"
                    alt="删除"
                    @click="handleDeleteFile"
                  />
                </div>
              </div>

              <div class="action-buttons">
                <a-button class="history-btn" @click="showHistoryFiles">
                  历史文件
                </a-button>
                <a-button
                  class="ai-btn"
                  type="primary"
                  status="success"
                  @click="showAiGenerateModal"
                >
                  AI生成合同
                </a-button>
              </div>
            </div>
          </a-form-item>
        </section>

        <!-- AI生成合同弹窗 -->
        <transition name="fade">
          <div v-if="aiGenerateModalVisible" class="custom-modal-overlay">
            <transition name="zoom">
              <div v-if="aiGenerateModalVisible" class="custom-modal-content">
                <div class="custom-modal-header">
                  <h3>AI生成合同</h3>
                  <button
                    class="close-btn"
                    @click="aiGenerateModalVisible = false"
                    >&times;</button
                  >
                </div>
                <div class="custom-modal-body">
                  <div class="ai-prompt-input">
                    <a-form-item
                      label="请输入合同需求描述:"
                      :feedback="aiGenerateFeedback"
                    >
                      <a-textarea
                        v-model="aiPrompt"
                        placeholder="例如：生成一份租房合同"
                        :auto-size="{ minRows: 4, maxRows: 8 }"
                      />
                    </a-form-item>
                  </div>
                </div>
                <div class="custom-modal-footer">
                  <a-button @click="aiGenerateModalVisible = false"
                    >取消</a-button
                  >
                  <a-button
                    type="primary"
                    :loading="aiGenerateLoading"
                    style="margin-left: 8px; background-color: #3277FF;"
                    @click="generateContract"
                    >生成合同</a-button
                  >
                </div>
              </div>
            </transition>
          </div>
        </transition>

        <!-- AI生成合同结果弹窗 -->
        <transition name="fade">
          <div v-if="aiResultModalVisible" class="custom-modal-overlay">
            <transition name="zoom">
              <div
                v-if="aiResultModalVisible"
                class="custom-modal-content ai-result-modal"
              >
                <div class="custom-modal-header">
                  <h3>生成的合同</h3>
                  <button
                    class="close-btn"
                    @click="aiResultModalVisible = false"
                    >&times;</button
                  >
                </div>
                <div class="custom-modal-body">
                  <div class="ai-result-content">
                    <a-spin :loading="aiResultLoading">
                      <div v-if="isEditing" class="a4-editor-container">
                        <a-textarea
                          v-model="aiGeneratedContent"
                          class="a4-editor"
                          :auto-size="false"
                        />
                      </div>
                      <div
                        v-else
                        class="preview-content a4-preview"
                        v-html="formattedAiContent"
                      ></div>
                    </a-spin>
                  </div>
                </div>
                <div class="custom-modal-footer">
                  <a-button @click="aiResultModalVisible = false"
                    >取消</a-button
                  >
                  <a-button
                    v-if="!isEditing"
                    style="margin-left: 8px"
                    @click="toggleEdit"
                    >编辑</a-button
                  >
                  <a-button v-else style="margin-left: 8px" @click="toggleEdit"
                    >预览</a-button
                  >
                  <a-button
                    type="primary"
                    status="success"
                    :loading="savingPdf"
                    style="margin-left: 8px"
                    @click="saveAsPdf"
                    >保存为PDF</a-button
                  >
                  <a-button
                    type="primary"
                    status="warning"
                    :loading="savingWord"
                    style="margin-left: 8px"
                    @click="saveAsWord"
                    >保存为Word</a-button
                  >
                </div>
              </div>
            </transition>
          </div>
        </transition>

        <!-- 历史文件弹窗 -->
        <transition name="fade">
          <div
            v-if="historyModalVisible"
            class="custom-modal-overlay"
            @click.self="historyModalVisible = false"
          >
            <transition name="zoom">
              <div v-if="historyModalVisible" class="custom-modal-content">
                <div class="custom-modal-header">
                  <h3>选择历史文件</h3>
                  <button class="close-btn" @click="historyModalVisible = false"
                    >&times;</button
                  >
                </div>
                <div class="custom-modal-body">
                  <div class="history-search">
                    <a-input-search
                      v-model="historyFileSearch"
                      placeholder="搜索文件名称"
                      allow-clear
                      @search="searchHistoryFiles"
                    />
                  </div>
                  <a-table
                    :data="historyFiles"
                    :pagination="historyPagination"
                    :loading="historyLoading"
                    @page-change="onHistoryPageChange"
                  >
                    <template #columns>
                      <a-table-column title="文件名" data-index="name" />
                      <a-table-column title="大小" data-index="size">
                        <template #cell="{ record }">
                          {{ formatFileSize(record.size) }}
                        </template>
                      </a-table-column>
                      <a-table-column title="操作">
                        <template #cell="{ record }">
                          <a-button
                            type="text"
                            size="small"
                            @click="selectHistoryFile(record)"
                          >
                            选择
                          </a-button>
                        </template>
                      </a-table-column>
                    </template>
                  </a-table>
                </div>
                <div class="custom-modal-footer">
                  <a-button @click="historyModalVisible = false">取消</a-button>
                  <a-button
                    type="primary"
                    style="margin-left: 8px"
                    @click="historyModalVisible = false"
                    >确定</a-button
                  >
                </div>
              </div>
            </transition>
          </div>
        </transition>

        <!-- 合同基本信息 -->
        <section class="form-section">
          <div class="section-title">合同信息</div>
          <div class="basic-info-grid">
            <a-form-item
              field="name"
              label="合同名称"
              :rules="[{ required: true, message: '请输入合同名称' }]"
            >
              <a-input
                v-model="formData.name"
                placeholder="请输入合同名称"
                allow-clear
              />
            </a-form-item>
            <a-form-item
              field="endTime"
              label="签署截止日期"
              :rules="[{ required: true, message: '请选择签署截止日期' }]"
            >
              <a-date-picker
                v-model="formData.endTime"
                style="width: 100%"
                show-time
                format="YYYY-MM-DD HH:mm:ss"
                placeholder="请选择签署截止日期"
              />
            </a-form-item>
          </div>
        </section>


        <!-- 签署方管理 -->
        <section class="form-section signers-section">
          <div class="signers-header">
            <span class="signers-title">签署方</span>
            <a-button type="primary" size="small" @click="showSignerModal">
              <template #icon>
                <icon-plus />
              </template>
              添加签署方
            </a-button>
          </div>

          <div class="signers-container">
            <div v-if="formData.signers.length === 0" class="empty-signers">
              <a-empty description="暂无签署方，请添加" />
            </div>
            <a-row :gutter="[16, 16]">
              <a-col
                v-for="(signer, index) in formData.signers"
                :key="index"
                :xs="24"
                :sm="12"
                :md="8"
                :lg="6"
              >
                <a-card class="signer-card" :bordered="true">
                  <template #title>
                    <div class="card-title">
                      签署方 {{ index + 1 }}
                      <a-tag
                        :color="signer.type === 0 ? '#D2FFF4' : '#D2EBFF'"
                        :style="{ color: signer.type === 0 ? '#00A67F' : '#536AFF' }"
                      >
                        {{ signer.type === 0 ? '个人' : '企业' }}
                      </a-tag>
                    </div>
                  </template>
                  <template #extra>
                    <a-button
                      type="text"
                      status="danger"
                      size="mini"
                      @click="removeSigner(index)"
                    >
                      <icon-delete style="width: 16px;height: 16px;color: #3277FF;" />
                    </a-button>
                  </template>

                  <div v-if="signer.type === 0" class="signer-info">
                    <p><strong>姓名：</strong>{{ signer.person.name }}</p>
                    <p><strong>手机号：</strong>{{ signer.person.mobile }}</p>
                  </div>

                  <div v-else class="signer-info">
                    <p><strong>企业名称：</strong>{{ signer.company.name }}</p>
                    <p
                      ><strong>经办人：</strong
                      >{{ signer.company.agentName }}</p
                    >
                    <p
                      ><strong>经办人手机号：</strong
                      >{{ signer.company.agentMobile }}</p
                    >
                  </div>

                  <template #actions>
                    <a-button
                      type="text"
                      size="small"
                      @click="editSigner(index)"
                      class="edit-button"
                    >
                      <template #icon>
                        <img src="/images/ic_edit.svg" class="edit-icon" alt="编辑" />
                      </template>
                      编辑
                    </a-button>
                  </template>
                </a-card>
              </a-col>
            </a-row>
          </div>
        </section>

        <div class="contract-video-section">
          <div class="contract-video-header">
            <div>
              <div class="contract-video-title">签署前视频录制</div>
              <div class="contract-video-desc">
                开启后只要求已勾选签署方录制视频，未勾选签署方保持原签署流程。
              </div>
            </div>
            <a-switch v-model="formData.requireVideo" />
          </div>
          <div v-if="formData.requireVideo" class="contract-video-signer-list">
            <a-empty
              v-if="formData.signers.length === 0"
              description="请先添加签署方"
            />
            <div
              v-for="(signer, index) in formData.signers"
              :key="index"
              class="contract-video-signer-item"
            >
              <div class="contract-video-signer-info">
                <div class="contract-video-signer-name">
                  {{ getSignerDisplayName(signer) }}
                </div>
                <div class="contract-video-signer-mobile">
                  {{ getSignerDisplayMobile(signer) }}
                </div>
              </div>
              <a-switch
                :model-value="signer.requireVideo"
                @change="value => setSignerRequireVideo(index, value)"
              />
            </div>
          </div>
        </div>

        <a-divider />

        <div class="form-actions">
          <a-button type="primary" html-type="submit" :loading="submitting" style="width: 200px;">
            发起签署
          </a-button>
        </div>

        <!-- 签署链接区域 -->
        <div v-if="signUrl" class="sign-url-section">
          <a-card class="sign-url-card">
            <template #title>
              <div class="sign-card-title">
                <icon-check-circle-fill class="success-icon" />
                <span>合同创建成功！</span>
              </div>
            </template>
            <template #extra>
              <a-button type="text" @click="signUrl = ''">
                <icon-close />
              </a-button>
            </template>

            <div class="sign-card-content">
              <p class="sign-card-desc"
                >您的合同已创建并发送给签署方，您可以通过以下方式操作：</p
              >

              <!-- 合同名称显示 -->
              <div class="contract-name-box">
                <div class="contract-name-title">合同名称</div>
                <div class="contract-name-content">{{
                  formData.name || '未命名合同'
                }}</div>
              </div>

              <div class="sign-card-actions">
                <a-button
                  type="primary"
                  status="success"
                  size="large"
                  long
                  style="background-color: #28B76B;"
                  @click="openSignUrl"
                >
                  <template #icon><icon-link /></template>
                  立即前往签署页面
                </a-button>
                <a-button size="large" long @click="copySignUrl">
                  <template #icon><icon-copy /></template>
                  复制签署链接
                </a-button>
              </div>
            </div>
          </a-card>
        </div>
      </a-form>
    </a-card>

    <!-- 签署方弹窗 -->
    <transition name="fade">
      <div
        v-if="signerModalVisible"
        class="custom-modal-overlay"
        @click.self="signerModalVisible = false"
      >
        <transition name="zoom">
          <div v-if="signerModalVisible" class="custom-modal-content">
            <div class="custom-modal-header">
              <h3>{{ isEditSigner ? '编辑签署方' : '添加签署方' }}</h3>
              <button class="close-btn" @click="signerModalVisible = false"
                >&times;</button
              >
            </div>
            <div class="custom-modal-body">
              <a-form ref="signerForm" :model="currentSigner" layout="vertical">
                <a-form-item
                  field="type"
                  label="签署方类型"
                  :rules="[{ required: true, message: '请选择签署方类型' }]"
                >
                  <a-radio-group
                    v-model="currentSigner.type"
                    type="button"
                    @change="handleModalTypeChange"
                  >
                    <a-radio :value="0">个人</a-radio>
                    <a-radio :value="1">企业</a-radio>
                  </a-radio-group>
                </a-form-item>

                <!-- 个人签署方表单 -->
                <div v-if="currentSigner.type === 0">
                  <a-form-item
                    field="person.name"
                    label="姓名"
                    :rules="[{ required: true, message: '请输入姓名' }]"
                  >
                    <a-input
                      v-model="currentSigner.person.name"
                      placeholder="请输入姓名"
                      allow-clear
                    />
                  </a-form-item>

                  <a-form-item
                    field="person.mobile"
                    label="手机号"
                    :rules="[
                      { required: true, message: '请输入手机号' },
                      {
                        match: /^1[3-9]\d{9}$/,
                        message: '请输入正确的手机号',
                      },
                    ]"
                    :validate-trigger="['change', 'blur']"
                  >
                    <a-input
                      v-model="currentSigner.person.mobile"
                      placeholder="请输入手机号"
                      allow-clear
                    />
                  </a-form-item>
                </div>

                <!-- 企业签署方表单 -->
                <div v-if="currentSigner.type === 1">
                  <a-form-item
                    field="company.name"
                    label="企业名称"
                    :rules="[{ required: true, message: '请输入企业名称' }]"
                  >
                    <a-input
                      v-model="currentSigner.company.name"
                      placeholder="请输入企业名称"
                      allow-clear
                    />
                  </a-form-item>

                  <a-form-item
                    field="company.agentName"
                    label="经办人姓名"
                    :rules="[{ required: true, message: '请输入经办人姓名' }]"
                  >
                    <a-input
                      v-model="currentSigner.company.agentName"
                      placeholder="请输入经办人姓名"
                      allow-clear
                    />
                  </a-form-item>

                  <a-form-item
                    field="company.agentMobile"
                    label="经办人手机号"
                    :rules="[
                      { required: true, message: '请输入经办人手机号' },
                      {
                        match: /^1[3-9]\d{9}$/,
                        message: '请输入正确的手机号',
                      },
                    ]"
                    :validate-trigger="['change', 'blur']"
                  >
                    <a-input
                      v-model="currentSigner.company.agentMobile"
                      placeholder="请输入经办人手机号"
                      allow-clear
                    />
                  </a-form-item>
                </div>
              </a-form>
            </div>
            <div class="custom-modal-footer">
              <a-button @click="signerModalVisible = false">取消</a-button>
              <a-button
                type="primary"
                style="margin-left: 8px"
                @click="confirmSigner"
                >确定</a-button
              >
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </div>
</template>

<script>
  import { Message } from '@arco-design/web-vue';
  import {
    createContract,
    uploadContractFile,
    getHistoryFiles,
    generatePdfContract,
    generateWordContract,
    generateContractContent,
  } from '@/api/contract';

  export default {
    name: 'ContractCreate',
    data() {
      return {
        fileList: [],
        uploadedFile: {
          url: '',
          fileSize: 0,
        },
        submitting: false,
        formData: {
          name: '',
          signers: [],
          endTime: '',
          url: '',
          fileSize: 0,
          requireVideo: false,
          initiateType: 1, // 发起类型，默认为1
        },
        duplicatedMobile: '',
        historyModalVisible: false,
        historyFileSearch: '',
        historyFiles: [],
        historyPagination: {
          current: 1,
          pageSize: 10,
          total: 0,
        },
        historyLoading: false,
        // 新增签署方相关数据
        signerModalVisible: false,
        isEditSigner: false,
        editingSignerIndex: -1,
        currentSigner: {
          requireVideo: false,
          type: 0,
          person: {
            name: '',
            mobile: '',
          },
          company: {
            name: '',
            agentName: '',
            agentMobile: '',
          },
        },
        signUrl: '',
        aiGenerateModalVisible: false,
        aiPrompt: '',
        aiGenerateFeedback: '',
        aiGenerateLoading: false,
        aiResultModalVisible: false,
        aiResultLoading: false,
        aiGeneratedContent: '',
        isEditing: false,
        savingPdf: false,
        savingWord: false,
        formattedAiContent: '',
        uploadError: false,
        errorMessage: '',
      };
    },
    computed: {
      // 获取当前文件名
      getFileName() {
        if (this.fileList && this.fileList.length > 0) {
          return this.fileList[0].name;
        }
        return this.formData.name || '未命名文件';
      }
    },
    watch: {
      'formData.requireVideo': function (value) {
        this.formData.signers.forEach((signer) => {
          signer.requireVideo = value;
        });
      },
    },
    created() {
      // 不再初始化时添加签署方
      // this.addSigner();

      // 设置默认截止日期为30天后
      const now = new Date();
      const defaultDate = new Date();
      defaultDate.setDate(now.getDate() + 30);
      this.formData.endTime = this.formatDate(defaultDate);

      // 调试日志
      console.log(
        '初始化完成，historyModalVisible值为:',
        this.historyModalVisible
      );
    },
    mounted() {
      // 挂载DOM后初始化Modal相关事件
      console.log('组件挂载完成');
    },
    methods: {
      // 格式化日期
      formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day} 23:59:59`;
      },

      // 添加签署方（旧方法，保留兼容性）
      addSigner() {
        // 该方法已不再主动使用，使用showSignerModal代替
        this.formData.signers.push({
          requireVideo: false,
          type: 0, // 默认个人
          person: {
            name: '',
            mobile: '',
          },
          company: {
            name: '',
            agentName: '',
            agentMobile: '',
          },
        });
      },

      // 删除签署方
      removeSigner(index) {
        this.$modal.confirm({
          title: '确认删除',
          content: '确定要删除该签署方吗？',
          okText: '确定',
          cancelText: '取消',
          onOk: () => {
            this.formData.signers.splice(index, 1);
            this.$message.success('签署方删除成功');
          },
        });
      },

      // 添加签署方弹窗
      showSignerModal() {
        this.isEditSigner = false;
        this.editingSignerIndex = -1;
        this.currentSigner = {
          requireVideo: false,
          type: 0,
          person: {
            name: '',
            mobile: '',
          },
          company: {
            name: '',
            agentName: '',
            agentMobile: '',
          },
        };
        this.signerModalVisible = true;
      },

      // 编辑签署方
      editSigner(index) {
        this.isEditSigner = true;
        this.editingSignerIndex = index;
        // 深拷贝当前签署方数据，避免直接修改
        this.currentSigner = JSON.parse(
          JSON.stringify(this.formData.signers[index])
        );
        this.signerModalVisible = true;
      },

      // 确认添加/编辑签署方
      confirmSigner() {
        // 简单验证
        if (this.currentSigner.type === 0) {
          if (
            !this.currentSigner.person.name ||
            !this.currentSigner.person.mobile
          ) {
            this.$message.error('请填写完整的个人签署方信息');
            return;
          }
          if (!/^1[3-9]\d{9}$/.test(this.currentSigner.person.mobile)) {
            this.$message.error('请输入正确的手机号');
            return;
          }
        } else {
          if (
            !this.currentSigner.company.name ||
            !this.currentSigner.company.agentName ||
            !this.currentSigner.company.agentMobile
          ) {
            this.$message.error('请填写完整的企业签署方信息');
            return;
          }
          if (!/^1[3-9]\d{9}$/.test(this.currentSigner.company.agentMobile)) {
            this.$message.error('请输入正确的手机号');
            return;
          }
        }

        // 添加或更新签署方
        const signerData = JSON.parse(JSON.stringify(this.currentSigner));
        if (this.formData.requireVideo) {
          signerData.requireVideo =
            typeof signerData.requireVideo === 'boolean'
              ? signerData.requireVideo
              : true;
        } else {
          signerData.requireVideo = false;
        }

        if (this.isEditSigner) {
          this.formData.signers[this.editingSignerIndex] = signerData;
        } else {
          this.formData.signers.push(signerData);
        }

        this.signerModalVisible = false;
        this.$message.success(
          this.isEditSigner ? '签署方更新成功' : '签署方添加成功'
        );
      },

      // 签署方类型变更（弹窗内）
      getSignerDisplayName(signer) {
        if (!signer) return '-';
        return signer.type === 0
          ? signer.person?.name || '-'
          : signer.company?.name || signer.company?.agentName || '-';
      },

      getSignerDisplayMobile(signer) {
        if (!signer) return '-';
        return signer.type === 0
          ? signer.person?.mobile || '-'
          : signer.company?.agentMobile || '-';
      },

      setSignerRequireVideo(index, value) {
        this.formData.signers[index].requireVideo = value;
      },

      handleModalTypeChange(value) {
        if (value === 0) {
          this.currentSigner.person = {
            name: '',
            mobile: '',
          };
        } else {
          this.currentSigner.company = {
            name: '',
            agentName: '',
            agentMobile: '',
          };
        }
      },

      // 自定义上传处理函数
      customUpload(options) {
        console.log('文件上传参数:', options);

        const { fileItem, onProgress, onSuccess, onError } = options;
        if (!fileItem.file) {
          console.error('文件对象为空');
          this.$message.error('文件对象为空，请重新选择文件');
          this.uploadError = true;
          this.errorMessage = '文件对象为空';
          onError(new Error('文件对象为空'));
          return {
            abort: () => {
              console.log('空文件，取消上传');
            },
          };
        }

        // 重置错误状态
        this.uploadError = false;
        this.errorMessage = '';

        const uploadProcess = uploadContractFile(fileItem.file, {
          onUploadProgress: (progressEvent) => {
            const percent = Math.floor(
              (progressEvent.loaded / progressEvent.total) * 100
            );
            console.log('上传进度:', percent);
            onProgress({ percent });
          },
        })
          .then((res) => {
            console.log('文件上传成功:', res);
            // 根据实际响应结构调整，不再嵌套data.data
            if (res.code === 0 && res.data) {
              // 更新表单数据
              this.formData.url = res.data.url;
              this.formData.fileSize = Number(res.data.size || 0);

              // 使用上传的文件名作为默认合同名称（如果尚未设置）
              if (!this.formData.name && res.data.name) {
                this.formData.name = res.data.name.replace(/\.\w+$/, '');
              }

              this.$message.success('文件上传成功');

              // 更新上传文件列表
              this.fileList = [
                {
                  uid: res.data.id,
                  name: res.data.name,
                  status: 'done',
                  url: res.data.url,
                },
              ];

              // 触发表单验证更新
              if (this.$refs.form) {
                this.$refs.form.validateField('url');
              }

              onSuccess(res.data);
            } else {
              this.uploadError = true;
              this.errorMessage = res.message || '文件上传失败';
              this.$message.error(this.errorMessage);
              onError(new Error(this.errorMessage));
            }
          })
          .catch((err) => {
            console.error('文件上传错误:', err);
            this.uploadError = true;
            this.errorMessage = err.message || '未知错误';
            this.$message.error(`文件上传失败: ${this.errorMessage}`);
            onError(err);
          });

        // 返回中止函数
        return {
          abort() {
            console.log('取消上传');
            // XMLHttpRequest的取消在uploadContractFile中处理
          },
        };
      },

      // 检查手机号唯一性
      checkMobileUnique() {
        const mobiles = {};

        // 使用数组方法代替for循环，避免ESLint错误
        const hasDuplicate = this.formData.signers.some((signer) => {
          const mobile =
            signer.type === 0
              ? signer.person.mobile
              : signer.company.agentMobile;

          if (!mobile) return false;

          if (mobiles[mobile]) {
            // 记录重复的手机号，用于错误提示
            this.duplicatedMobile = mobile;
            return true;
          }

          mobiles[mobile] = true;
          return false;
        });

        if (hasDuplicate) {
          return {
            valid: false,
            message: `手机号 ${this.duplicatedMobile} 重复`,
          };
        }

        return { valid: true, message: '' };
      },

      // 提交表单
      handleSubmit() {
        // 检查是否至少有一个签署方
        if (this.formData.signers.length === 0) {
          this.$message.error('请至少添加一个签署方');
          return;
        }

        // 检查手机号唯一性
        const mobileCheck = this.checkMobileUnique();
        if (!mobileCheck.valid) {
          this.$message.error(mobileCheck.message || '签署方手机号重复');
          return;
        }

        if (
          this.formData.requireVideo &&
          !this.formData.signers.some((signer) => signer.requireVideo)
        ) {
          this.$message.error('开启视频录制后请至少选择一个签署方');
          return;
        }

        const submitData = {
          ...this.formData,
          signers: this.formData.signers.map((signer) => ({
            ...signer,
            requireVideo: Boolean(this.formData.requireVideo && signer.requireVideo),
          })),
        };

        // 确认提交
        this.$modal.confirm({
          title: '确认发起签署',
          content: '确定要发起此合同的签署流程吗？',
          onOk: () => {
            this.submitting = true;

            createContract(submitData)
              .then((response) => {
                if (response.code === 0) {
                  this.$message.success('合同创建成功，已发起签署');
                  // 判断是否有签署URL，如果有则显示签署链接
                  if (response.data && response.data.signUrl) {
                    // 保存签署链接，用于显示
                    this.signUrl = response.data.signUrl;

                    // 自动滚动到页面底部，让用户看到签署链接
                    setTimeout(() => {
                      window.scrollTo({
                        top: document.body.scrollHeight,
                        behavior: 'smooth',
                      });
                    }, 300);
                  } else {
                    this.signUrl = '';
                    this.$message.success(
                      submitData.requireVideo
                        ? '合同已创建，请在合同详情完成视频录制后签署'
                        : '合同已创建，签署链接可在合同详情查看'
                    );
                  }
                } else {
                  this.$message.error(response.message || '创建合同失败');
                }
              })
              .catch((error) => {
                console.error('创建合同出错', error);
                this.$message.error('创建合同出错');
              })
              .finally(() => {
                this.submitting = false;
              });
          },
        });
      },

      // 显示历史文件弹窗
      showHistoryFiles() {
        console.log('显示历史文件弹窗调用 - 之前:', this.historyModalVisible);
        this.historyModalVisible = true;
        console.log('historyModalVisible设置为:', this.historyModalVisible);

        // 检查页面上是否存在modal元素
        setTimeout(() => {
          console.log(
            'Modal元素数量:',
            document.querySelectorAll('.arco-modal').length
          );
          console.log(
            'Modal容器元素:',
            document.querySelectorAll('.arco-modal-container').length
          );
          console.log(
            '当前页面所有modal相关元素:',
            document.querySelectorAll('[class*="modal"]')
          );
        }, 100);

        this.historyPagination.current = 1;
        this.loadHistoryFiles();
      },

      // 加载历史文件列表
      loadHistoryFiles() {
        console.log('开始加载历史文件');
        this.historyLoading = true;
        getHistoryFiles({
          content: this.historyFileSearch,
          pageNum: this.historyPagination.current,
          pageSize: this.historyPagination.pageSize,
        })
          .then((response) => {
            console.log('获取历史文件响应:', response);
            if (response.code === 0 && response.data) {
              this.historyFiles = response.data.rows;
              this.historyPagination = {
                ...this.historyPagination,
                total: response.data.total,
              };
              console.log('历史文件数据:', this.historyFiles);
            } else {
              this.$message.error(response.message || '获取历史文件失败');
            }
          })
          .catch((error) => {
            console.error('获取历史文件出错', error);
            this.$message.error('获取历史文件出错');
          })
          .finally(() => {
            this.historyLoading = false;
          });
      },

      // 搜索历史文件
      searchHistoryFiles() {
        this.historyPagination.current = 1;
        this.loadHistoryFiles();
      },

      // 历史文件分页变化
      onHistoryPageChange(page) {
        this.historyPagination.current = page;
        this.loadHistoryFiles();
      },

      // 选择历史文件
      selectHistoryFile(file) {
        if (!file || !file.url) {
          this.$message.error('文件URL不能为空');
          return;
        }

        // 更新表单数据
        this.formData.url = file.url;
        this.formData.fileSize = Number(file.size || 0);

        // 使用文件名作为默认合同名称（如果尚未设置）
        if (!this.formData.name && file.name) {
          this.formData.name = file.name.replace(/\.\w+$/, '');
        }

        // 更新上传文件列表
        this.fileList = [
          {
            uid: file.id,
            name: file.name,
            status: 'done',
            url: file.url,
          },
        ];

        // 触发表单验证更新
        if (this.$refs.form) {
          this.$refs.form.validateField('url');
        }

        this.$message.success('已选择历史文件');
        this.historyModalVisible = false;
      },

      // 格式化文件大小
      formatFileSize(size) {
        if (!size) return '大小未知';

        const sizeNum = Number(size);
        if (Number.isNaN(sizeNum)) return '大小未知';

        if (sizeNum < 1024) {
          return `${sizeNum} B`;
        }
        if (sizeNum < 1024 * 1024) {
          return `${(sizeNum / 1024).toFixed(2)} KB`;
        }
        if (sizeNum < 1024 * 1024 * 1024) {
          return `${(sizeNum / (1024 * 1024)).toFixed(2)} MB`;
        }
        return `${(sizeNum / (1024 * 1024 * 1024)).toFixed(2)} GB`;
      },

      // 复制签署链接
      copySignUrl() {
        if (!this.signUrl) return;

        // 创建一个临时textarea元素
        const textarea = document.createElement('textarea');
        textarea.value = this.signUrl;
        textarea.style.position = 'fixed'; // 防止滚动到底部
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);

        // 选择文本并复制
        textarea.select();
        try {
          const successful = document.execCommand('copy');
          if (successful) {
            this.$message.success('签署链接已复制到剪贴板');
          } else {
            this.$message.error('复制失败，请手动复制');
          }
        } catch (err) {
          console.error('复制过程中出错:', err);
          this.$message.error('复制出错，请手动复制');
        }

        // 清理临时元素
        document.body.removeChild(textarea);
      },

      // 打开签署链接
      openSignUrl() {
        if (!this.signUrl) return;

        // 尝试自动打开签署页面，但这可能被浏览器阻止
        try {
          const newWindow = window.open(this.signUrl, '_blank');

          // 检查新窗口是否打开成功
          if (
            !newWindow ||
            newWindow.closed ||
            typeof newWindow.closed === 'undefined'
          ) {
            console.log('弹出窗口被阻止，请使用页面上的链接手动打开');
            // 提示用户使用链接，这里不再单独提示，因为已经显示了签署链接区域
          }
        } catch (e) {
          console.error('尝试打开新窗口失败', e);
          // 出错时不处理，因为我们已经显示了签署链接
        }

        // 滚动到页面底部，让用户看到签署链接
        setTimeout(() => {
          window.scrollTo({
            top: document.body.scrollHeight,
            behavior: 'smooth',
          });
        }, 300);
      },

      // 显示AI生成合同弹窗
      showAiGenerateModal() {
        this.aiGenerateModalVisible = true;
      },

      // 生成合同
      generateContract() {
        if (!this.aiPrompt.trim()) {
          this.aiGenerateFeedback = '请输入合同需求描述';
          return;
        }

        this.aiGenerateLoading = true;
        this.aiGenerateFeedback = '';

        // 调用AI生成接口
        const params = {
          messages: [
            {
              role: 'user',
              content: this.aiPrompt.trim(),
            },
          ],
          temperature: 0.7,
          stream: false,
          maxTokens: 4096,
        };

        // 使用新的接口函数生成合同内容
        generateContractContent(params)
          .then((response) => {
            const { data } = response;
            let content = '';

            // 处理新的返回数据结构（带choices数组的情况）
            if (data.choices && data.choices.length > 0) {
              content = data.choices[0].content || '';
            }
            // 处理旧的返回数据结构
            else if (
              data.conversation &&
              data.conversation.choices &&
              data.conversation.choices.length > 0
            ) {
              content = data.conversation.choices[0].content || '';
            }

            if (!content) {
              throw new Error('未能获取到生成的合同内容');
            }

            // 保存生成的内容并显示结果弹窗
            this.aiGeneratedContent = content;
            this.formattedAiContent = content.replace(/\n/g, '<br>');
            this.aiGenerateModalVisible = false;
            this.aiResultModalVisible = true;
          })
          .catch((error) => {
            console.error('生成合同失败:', error);
            Message.error('生成合同失败，请稍后再试');
          })
          .finally(() => {
            this.aiGenerateLoading = false;
          });
      },

      // 切换编辑和预览状态
      toggleEdit() {
        if (this.isEditing) {
          // 从编辑状态切换到预览状态
          this.formattedAiContent = this.aiGeneratedContent.replace(
            /\n/g,
            '<br>'
          );
        }
        this.isEditing = !this.isEditing;
      },

      // 保存为PDF
      saveAsPdf() {
        if (!this.aiGeneratedContent.trim()) {
          Message.error('合同内容为空，无法保存');
          return;
        }

        this.savingPdf = true;

        // 准备文件名，默认为"AI生成合同"
        const fileName = `AI生成合同-${new Date().getTime()}`;

        // 调用保存为PDF的接口
        generatePdfContract({
          content: this.aiGeneratedContent,
          fileName,
        })
          .then((res) => {
            if (res && res.data && res.data.documentUrl) {
              // 创建文件记录
              const fileObj = {
                name: res.data.fileName || fileName,
                url: res.data.documentUrl,
              };

              // 添加到文件列表并设置到表单数据中
              this.fileList = [
                {
                  uid: new Date().getTime(),
                  name: fileObj.name,
                  url: fileObj.url,
                  status: 'done',
                },
              ];

              this.formData.url = fileObj.url;
              this.formData.name = fileObj.name.replace(/\.\w+$/, ''); // 去掉扩展名作为合同名称

              Message.success('PDF文件已生成');
              this.aiResultModalVisible = false;
            } else {
              throw new Error('生成PDF失败');
            }
          })
          .catch((error) => {
            console.error('保存为PDF失败:', error);
            Message.error('保存为PDF失败，请稍后再试');
          })
          .finally(() => {
            this.savingPdf = false;
          });
      },

      // 保存为Word
      saveAsWord() {
        if (!this.aiGeneratedContent.trim()) {
          Message.error('合同内容为空，无法保存');
          return;
        }

        this.savingWord = true;

        // 准备文件名，默认为"AI生成合同"
        const fileName = `AI生成合同-${new Date().getTime()}`;

        // 调用保存为Word的接口
        generateWordContract({
          content: this.aiGeneratedContent,
          fileName,
        })
          .then((res) => {
            if (res && res.data && res.data.documentUrl) {
              // 创建文件记录
              const fileObj = {
                name: res.data.fileName || fileName,
                url: res.data.documentUrl,
              };

              // 添加到文件列表并设置到表单数据中
              this.fileList = [
                {
                  uid: new Date().getTime(),
                  name: fileObj.name,
                  url: fileObj.url,
                  status: 'done',
                },
              ];

              this.formData.url = fileObj.url;
              this.formData.name = fileObj.name.replace(/\.\w+$/, ''); // 去掉扩展名作为合同名称

              Message.success('Word文件已生成');
              this.aiResultModalVisible = false;
            } else {
              throw new Error('生成Word文件失败');
            }
          })
          .catch((error) => {
            console.error('保存为Word失败:', error);
            Message.error('保存为Word失败，请稍后再试');
          })
          .finally(() => {
            this.savingWord = false;
          });
      },

      // 处理删除文件
      handleDeleteFile() {
        this.$modal.confirm({
          title: '确认删除',
          content: '确定要删除已上传的文件吗？',
          onOk: () => {
            this.formData.url = '';
            this.formData.fileSize = 0;
            this.fileList = [];
            this.uploadError = false;
            this.errorMessage = '';
            this.$message.success('文件已删除');
          },
        });
      },
    },
  };
</script>

<style lang="less" scoped>
  .container {
    padding: 20px;
    background: #f6f8fb;
  }

  .general-card {
    margin-bottom: 20px;
  }

  .create-card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-bottom: 18px;
    border-bottom: 1px solid #EFF3F6;
  }

  .create-card-marker {
    width: 3px;
    height: 16px;
    background: #3277FF;
    border-radius: 60px;
  }

  .create-card-title {
    font-size: 16px;
    font-weight: 500;
    color: #2D3036;
  }

  .create-form {
    margin-top: 22px;
  }

  .form-section {
    padding: 20px 0;
    border-bottom: 1px solid #EFF3F6;
  }

  .form-section:first-of-type {
    padding-top: 0;
  }

  .section-title {
    margin-bottom: 14px;
    font-size: 14px;
    font-weight: 500;
    color: #2D3036;
  }

  .basic-info-grid {
    display: grid;
    grid-template-columns: minmax(280px, 1fr) minmax(280px, 1fr);
    gap: 16px 24px;
    max-width: 920px;
  }

  /* 静态面包屑样式 */
  .static-breadcrumb {
    margin: 0 0 16px 0;
    display: flex;
    align-items: center;
    font-size: 14px;
  }

  .breadcrumb-item {
    color: rgb(var(--gray-6));
  }

  .breadcrumb-separator {
    margin: 0 8px;
    color: rgb(var(--gray-6));
  }

  .breadcrumb-item.current {
    color: rgb(var(--gray-8));
    font-weight: 500;
  }

  /* 表单标签样式 */
  :deep(.arco-form-item) {
    margin-bottom: 0;
  }

  :deep(.arco-form-item-label-col) {
    label {
      font-size: 14px;
      font-weight: 500;
      color: #2D3036;
      line-height: 22px;
    }
  }

  :deep{
    .arco-btn-primary{
      background-color: #3277FF;
    }
    .arco-input-wrapper {
      background: white;
      border-color: #D4D6D9;
      border-radius: 4px;
    }
    .arco-picker{
      background: white;
      border-color: #D4D6D9;
      border-radius: 4px;
    }
  }

  /* 自定义上传按钮样式 */
  .custom-upload-btn {
    display: flex;
    align-items: center;
    width: min(100%, 420px);
    min-width: 320px;
    min-height: 104px;
    background-color: #EEF5FF;
    border: 1px dashed #A8CCFF;
    border-radius: 8px;
    padding: 18px 22px;
    cursor: pointer;

    .upload-icon {
      width: 36px;
      height: 33px;
      margin-right: 24px;
    }

    .upload-text-content {
      display: flex;
      flex-direction: column;

      .primary-text {
        font-size: 13px;
        color: #2B2D30;

        .highlight-text {
          color: #3277FF;
        }
      }

      .secondary-text {
        font-size: 12px;
        color: #8D98B0;
        margin-top: 11px;
      }
    }
  }

  /* 自定义文件项样式 */
  .custom-file-item {
    display: flex;
    align-items: center;
    width: min(100%, 420px);
    min-width: 320px;
    min-height: 104px;
    background-color: #EEF5FF;
    border: 1px dashed #A8CCFF;
    border-radius: 8px;
    padding: 18px 22px;
    position: relative;

    .file-icon {
      width: 36px;
      height: 44px;
      margin-right: 24px;
    }

    .file-info {
      flex: 1;
      display: flex;
      flex-direction: column;

      .file-name {
        font-size: 13px;
        color: #2B2D30;
        font-weight: 500;
        max-width: 240px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;

        &.error-text {
          color: #FF5353;
        }
      }

      .file-size {
        font-size: 12px;
        color: #8D98B0;
        margin-top: 11px;
      }
    }

    /* 文件操作按钮样式 */
    .file-actions {
      display: flex;
      align-items: center;
      margin-right: 0;
      position: absolute;
      right: 24px;
      bottom: 15px;

      .action-icon {
        cursor: pointer;

        &.reload-icon {
          width: 20px;
          height: 18px;
          margin-right: 15px;
        }

        &.delete-icon {
          width: 16px;
          height: 18px;
        }
      }
    }
  }

  /* 错误状态的文件项 */
  .error-file-item {
    border-color: #FF5353;
  }

  .signers-section {
    .signers-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      .signers-title {
        font-size: 14px;
        font-weight: 500;
      }
    }

    .signer-item {
      margin-bottom: 24px;
      background-color: var(--color-fill-2);
      padding: 16px;
      border-radius: 4px;
    }
  }

  .form-actions {
    display: flex;
    justify-content: center;
    margin-top: 24px;
  }

  .upload-area {
    display: flex;
    align-items: stretch;
    flex-wrap: wrap;
    gap: 14px;
  }

  .action-buttons {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 10px;
  }

  .history-btn {
    width: 100px;
    height: 32px;
    color: #3277FF;
    font-size: 13px;
    background: white;
    border: 1px solid #3277FF;
    margin-left: 0;
  }

  .ai-btn{
    width: 100px;
    height: 32px;
    color: white;
    font-size: 13px;
    background: #3277FF;
  }
  .history-search {
    margin-bottom: 16px;
  }

  /* 签署方样式 */
  .signers-container {
    margin-top: 14px;
  }

  .empty-signers {
    padding: 40px 0;
    text-align: center;
  }

  .signer-card {
    background-color: #EEF5FF;
    border: 1px dashed #A8CCFF;
    border-radius: 8px;
    padding: 0 16px;
    cursor: pointer;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
    transition: all 0.3s;
    min-height: 210px;

    .edit-button {
      color: #3277FF;

      .edit-icon {
        width: 14px;
        height: 14px;
        margin-right: 4px;
      }
    }
  }

  .signer-card:hover {
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  .card-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;
  }

  .signer-info {
    font-size: 14px;
    line-height: 1.6;
    /* 确保信息区域高度一致 */
    min-height: 90px;
  }

  .signer-info p {
    margin: 6px 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .contract-video-section {
    margin: 20px 0 24px;
    padding: 18px 20px;
    background: #ffffff;
    border: 1px solid #E5E6EB;
    border-radius: 8px;
  }

  .contract-video-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .contract-video-title {
    font-size: 15px;
    font-weight: 500;
    color: #2D3036;
  }

  .contract-video-desc {
    margin-top: 6px;
    font-size: 13px;
    color: #8D98B0;
  }

  .contract-video-signer-list {
    margin-top: 16px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 12px;
  }

  .contract-video-signer-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: 58px;
    padding: 12px 14px;
    background: #F7FAFF;
    border: 1px solid #DCEAFF;
    border-radius: 6px;
  }

  .contract-video-signer-info {
    min-width: 0;
  }

  .contract-video-signer-name {
    font-size: 14px;
    font-weight: 500;
    color: #2D3036;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .contract-video-signer-mobile {
    margin-top: 4px;
    font-size: 12px;
    color: #8D98B0;
  }

  .custom-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  .custom-modal-content {
    background-color: var(--color-bg-2);
    border-radius: 4px;
    max-width: 700px;
    width: 100%;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  }
  .custom-modal-header {
    padding: 16px 20px;
    border-bottom: 1px solid var(--color-neutral-3);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .custom-modal-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 500;
    color: var(--color-text-1);
  }
  .close-btn {
    background: none;
    border: none;
    font-size: 20px;
    line-height: 1;
    cursor: pointer;
    color: var(--color-text-3);
    transition: color 0.2s;
  }
  .close-btn:hover {
    color: var(--color-text-1);
  }
  .custom-modal-body {
    padding: 20px;
    overflow-y: auto;
    flex: 1;
    background-color: var(--color-bg-2);
  }
  .custom-modal-footer {
    padding: 12px 20px;
    border-top: 1px solid var(--color-neutral-3);
    text-align: right;
    background-color: var(--color-bg-2);
  }

  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease;
  }
  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }

  .zoom-enter-active,
  .zoom-leave-active {
    transition: all 0.3s ease;
  }
  .zoom-enter-from,
  .zoom-leave-to {
    opacity: 0;
    transform: scale(0.95);
  }

  .sign-url-section {
    margin-top: 20px;
    margin-bottom: 20px;

    .sign-url-card {
      background-color: var(--color-bg-2);
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
      border: 1px solid var(--color-border-2);
      overflow: hidden;
    }

    .sign-url-card :deep(.arco-card-header) {
      background-color: rgb(var(--success-1));
      border-bottom: 1px solid rgb(var(--success-3));
    }

    .sign-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 500;
      color: rgb(var(--success-6));
    }

    .sign-card-content {
      padding: 24px;
    }

    .sign-card-desc {
      margin-bottom: 24px;
      font-size: 14px;
      color: var(--color-text-2);
    }

    .contract-name-box {
      margin-bottom: 24px;
      padding: 12px 16px;
      background-color: var(--color-fill-2);
      border-radius: 4px;
      border-left: 4px solid rgb(var(--success-6));
    }

    .contract-name-title {
      font-size: 13px;
      color: var(--color-text-3);
      margin-bottom: 8px;
    }

    .contract-name-content {
      font-size: 16px;
      font-weight: 500;
      color: var(--color-text-1);
      word-break: break-all;
    }

    .sign-card-actions {
      display: flex;
      flex-direction: column;
      gap: 16px;
      width: 100%;

      @media screen and (max-width: 768px) {
        flex-direction: column;
        align-items: flex-start;
      }
    }

    .success-icon {
      color: rgb(var(--success-6));
      font-size: 20px;
    }
  }

  // 弹窗里面的编辑器相关样式
  .ai-result-modal {
    max-width: 800px;
  }

  .a4-editor-container {
    width: 100%;
    height: 75vh;
    overflow-y: auto;
    background: #fff;
    padding: 10px;
    border: 1px solid #eee;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  }

  .a4-editor {
    width: 100%;
    height: 100%;
    min-height: 70vh;
    padding: 20px;
    font-size: 14px;
    line-height: 1.6;
    color: #333;
    border: none;
    resize: none;
    background-color: #fff;
  }

  .a4-preview {
    width: 100%;
    min-height: 70vh;
    max-height: 75vh;
    padding: 40px;
    margin: 0 auto;
    background-color: #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow-y: auto;
    font-size: 14px;
    line-height: 1.6;
    color: #333;
    text-align: left;
    white-space: pre-wrap;
  }

  /* 添加 a-spin 的样式 */
  :deep(.arco-spin) {
    width: 100%;
  }

  @media screen and (max-width: 768px) {
    .container {
      padding: 12px;
    }

    .basic-info-grid {
      grid-template-columns: 1fr;
      max-width: none;
    }

    .custom-upload-btn,
    .custom-file-item {
      min-width: 0;
      width: 100%;
    }

    .action-buttons {
      width: 100%;
      flex-direction: row;
      justify-content: flex-start;
    }

    .history-btn,
    .ai-btn {
      flex: 1;
      min-width: 0;
    }
  }
</style>
