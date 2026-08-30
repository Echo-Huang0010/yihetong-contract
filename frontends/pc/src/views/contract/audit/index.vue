<template>
  <div class="container">
    <!-- 修改面包屑导航，设置为不可点击 -->
    <div class="static-breadcrumb">
      <span class="breadcrumb-item">合同签署</span>
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-item current">合同审查</span>
    </div>
    <a-card class="general-card" style="padding: 24px;">
      <a-row >
        <div style="background: #3277FF;width: 3px;height: 15px;border-radius: 60px;margin-right: 6px;"></div>
        <span style="font-size: 16px;font-weight: 500;color: #2D3036;">合同审查</span>
      </a-row>
      <div style="font-size: 14px;font-weight: 400;color: #2D3036;margin-top: 24px;">请上传合同文件，进行审计</div>
      <a-divider style="margin: 24px 0;" />
      <a-form ref="form" :model="formData" layout="horizontal" style="margin-top: 24px;">
        <!-- 合同文件上传区域 -->
        <a-form-item
          field="url"
          label="合同文件"
          validate-trigger="input"
          :rules="[{ required: true, message: '请上传合同文件' }]"
          :label-col-props="{ span: 1.2 }"
          :wrapper-col-props="{ span: 22 }"
        >
          <div class="upload-area">
            <a-upload
              ref="uploadRef"
              :custom-request="customUpload"
              :limit="1"
              :show-file-list="false"
              :file-list="fileList"
              accept=".pdf,.docx,.txt"
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
                      支持 PDF、DOCX、TXT 格式
                    </div>
                  </div>
                </div>
              </template>
            </a-upload>

            <!-- 自定义文件列表显示 -->
            <div v-if="formData.url && !uploadError" class="custom-file-item">
              <img src="/images/ic_file_pdf.svg" class="file-icon" alt="文件图标" />
              <div class="file-info">
                <div class="file-name">{{ fileInfo.name || '未命名文件' }}</div>
                <div class="file-size">{{ formatFileSize(fileInfo.size) }}</div>
              </div>
              <!-- 文件操作区域，放在内部下方 -->
              <div class="file-actions">
                <a-upload
                  :custom-request="customUpload"
                  :show-file-list="false"
                  :limit="1"
                  accept=".pdf,.docx,.txt"
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
                  @click="handleDelete"
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
                  accept=".pdf,.docx,.txt"
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
                  @click="handleDelete"
                />
              </div>
            </div>
          </div>
        </a-form-item>

        <!-- 发起审计按钮 -->
        <a-button
          style="width: 200px;"
          v-if="formData.url"
          type="primary"
          :loading="auditLoading"
          @click="startAudit"
        >
          发起审计
        </a-button>

        <!-- 审计结果展示 -->
        <div v-if="auditResult" class="audit-result">
          <div class="audit-result-header">
            <h3>审计结果</h3>
            <a-button type="text" @click="copyAuditResult">
              <template #icon><icon-copy /></template>
              复制结果
            </a-button>
          </div>
          <div class="markdown-content" v-html="renderedContent"></div>
        </div>
      </a-form>
    </a-card>
  </div>
</template>

<script>
  import { Message } from '@arco-design/web-vue';
  import { uploadContractFile, auditContract } from '@/api/contract';
  import { marked } from 'marked';
  import DOMPurify from 'dompurify';

  export default {
    name: 'ContractAudit',
    data() {
      return {
        fileList: [],
        formData: {
          url: '',
        },
        fileInfo: {
          name: '',
          size: 0,
        },
        auditLoading: false,
        auditResult: null,
        uploadError: false,
        errorMessage: '',
      };
    },
    computed: {
      renderedContent() {
        if (!this.auditResult) return '';

        // 预处理 Markdown 内容，确保特殊字符被正确处理
        const processedContent = this.auditResult
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');

        // 使用 marked 将 Markdown 转换为 HTML
        const htmlContent = marked(processedContent);

        // 使用 DOMPurify 进行安全过滤
        return DOMPurify.sanitize(htmlContent);
      },
    },
    methods: {
      customUpload(options) {
        const { fileItem, onProgress, onSuccess, onError } = options;
        if (!fileItem.file) {
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
            onProgress({ percent });
          },
        })
          .then((res) => {
            if (res.code === 0 && res.data) {
              this.formData.url = res.data.url;
              this.$message.success('文件上传成功');

              // 保存文件信息
              this.fileInfo = {
                name: res.data.name,
                size: res.data.size || 0,
              };

              this.fileList = [
                {
                  uid: res.data.id,
                  name: res.data.name,
                  status: 'done',
                  url: res.data.url,
                },
              ];
              onSuccess(res.data);
            } else {
              this.uploadError = true;
              this.errorMessage = res.message || '文件上传失败';
              this.$message.error(this.errorMessage);
              onError(new Error(this.errorMessage));
            }
          })
          .catch((err) => {
            this.uploadError = true;
            this.errorMessage = err.message || '未知错误';
            this.$message.error(`文件上传失败: ${this.errorMessage}`);
            onError(err);
          });

        return {
          abort() {
            console.log('取消上传');
          },
        };
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

      // 处理删除文件
      handleDelete() {
        this.$modal.confirm({
          title: '确认删除',
          content: '确定要删除已上传的文件吗？',
          onOk: () => {
            this.formData.url = '';
            this.fileInfo = { name: '', size: 0 };
            this.fileList = [];
            this.uploadError = false;
            this.errorMessage = '';
            this.$message.success('文件已删除');
          },
        });
      },

      startAudit() {
        this.auditLoading = true;
        auditContract({
          documentUrl: this.formData.url,
          question:
            '请对合同进行全面法律合规性与内容严谨性审核，输出结构化分析报告。具体要求如下：\n' +
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
        })
          .then((response) => {
            if (response.code === 0) {
              // 处理不同的返回数据结构
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
              // 处理直接返回content的情况
              else if (data.content) {
                content = data.content;
              }

              if (!content) {
                throw new Error('未能获取到审计结果内容');
              }

              this.auditResult = content;
            } else {
              this.$message.error(response.message || '审计失败');
            }
          })
          .catch((error) => {
            console.error('审计出错', error);
            this.$message.error('审计出错');
          })
          .finally(() => {
            this.auditLoading = false;
          });
      },
      copyAuditResult() {
        if (!this.auditResult) return;

        // 创建一个临时textarea元素
        const textarea = document.createElement('textarea');
        textarea.value = this.auditResult;
        textarea.style.position = 'fixed'; // 防止滚动到底部
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);

        // 选择文本并复制
        textarea.select();
        try {
          const successful = document.execCommand('copy');
          if (successful) {
            this.$message.success('审计结果已复制到剪贴板');
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
    },
  };
</script>

<style lang="less" scoped>
  .container {
    padding: 20px;
  }

  .general-card {
    margin-bottom: 20px;
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



  /* 自定义上传按钮样式 */
  .custom-upload-btn {
    display: flex;
    align-items: center;
    width: 342px;
    height: 95px;
    background-color: #EEF5FF;
    border: 1px dashed #A8CCFF;
    border-radius: 8px;
    padding: 0 23px;
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
  :deep{
    .arco-btn-primary{
      background-color: #3277FF;
    }
  }

  /* 自定义文件项样式 */
  .custom-file-item {
    display: flex;
    align-items: center;
    width: 342px;
    height: 95px;
    background-color: #EEF5FF;
    border: 1px dashed #A8CCFF;
    border-radius: 8px;
    padding: 0 23px;
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
        max-width: 180px;
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

  /* 水平表单布局 */
  .horizontal-form-item {
    display: flex;
    align-items: center;

    :deep(.arco-form-item-wrapper) {
      flex: 1;
    }

    :deep(.arco-form-item-label-col) {
      padding-right: 20px;
    }
  }

  .form-label {
    white-space: nowrap;
    font-size: 14px;
    color: var(--color-text-2);
    margin-right: 20px;
    min-width: 100px;
  }

  .audit-result {
    margin-top: 20px;
    padding: 16px;
    background-color: var(--color-fill-2);
    border-radius: 4px;
  }

  .audit-result-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    h3 {
      color: var(--color-text-1);
      margin: 0;
    }
  }

  .markdown-content {
    padding: 16px;
    background-color: var(--color-bg-2);
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    color: var(--color-text-1);

    :deep(h1) {
      font-size: 1.8em;
      margin-top: 0.5em;
      margin-bottom: 0.5em;
      color: var(--color-text-1);
    }

    :deep(h2) {
      font-size: 1.5em;
      margin-top: 0.5em;
      margin-bottom: 0.5em;
      color: var(--color-text-1);
    }

    :deep(h3) {
      font-size: 1.3em;
      margin-top: 0.5em;
      margin-bottom: 0.5em;
      color: var(--color-text-1);
    }

    :deep(p) {
      margin-bottom: 1em;
      line-height: 1.6;
      color: var(--color-text-2);
    }

    :deep(ul),
    :deep(ol) {
      padding-left: 2em;
      margin-bottom: 1em;
      color: var(--color-text-2);
    }

    :deep(li) {
      margin-bottom: 0.5em;
      color: var(--color-text-2);
    }

    :deep(code) {
      background-color: var(--color-fill-2);
      padding: 0.2em 0.4em;
      border-radius: 3px;
      font-family: monospace;
      color: var(--color-text-1);
    }

    :deep(pre) {
      background-color: var(--color-fill-2);
      padding: 1em;
      border-radius: 4px;
      overflow-x: auto;
      margin-bottom: 1em;
      color: var(--color-text-1);
    }

    :deep(blockquote) {
      border-left: 4px solid var(--color-neutral-3);
      padding-left: 1em;
      margin-left: 0;
      color: var(--color-text-3);
    }

    :deep(table) {
      border-collapse: collapse;
      width: 100%;
      margin-bottom: 1em;
    }

    :deep(th),
    :deep(td) {
      border: 1px solid var(--color-neutral-3);
      padding: 8px;
      text-align: left;
      color: var(--color-text-2);
    }

    :deep(th) {
      background-color: var(--color-fill-2);
      color: var(--color-text-1);
    }
  }
</style>
