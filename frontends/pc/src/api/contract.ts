/*
 * @Description: 合同管理相关接口
 * @Author: Claude AI
 * @Date: 2024-06-02
 */
import axios from 'axios';
import { getToken } from '@/utils/auth';
import defaultSettings from '@/config/settings.json';

// 合同API路径常量
const CONTRACT_PATHS = {
  ATTACHMENT: '/mgt/v2/attachment',
  CONTRACT_LIST: '/mgt/v4/contract',
  CONTRACT: '/mgt/v5/contract',
  AI_CHAT: '/mgt/ai/chat',
  GENERATE_PDF: '/mgt/ai/generate-contract',
  GENERATE_WORD: '/mgt/ai/generate-word-contract',
  CONTRACT_COMPARE: '/mgt/ai/contract-compare',
  CONTRACT_TEMPLATE: '/api/v1/contract/template',
  CONTRACT_TEMPLATE_CATEGORY: '/api/v1/contract/template/category',
  DOCUMENT: '/api/v1/document',
  USER_DOCUMENT: '/api/v1/document/user',
};

// 签署方类型常量
export const SIGNER_TYPE = {
  PERSONAL: 0, // 个人
  ENTERPRISE: 1, // 企业
};

/**
 * 获取请求头配置
 * @returns 包含认证信息的请求头配置
 */
function getAuthHeaders() {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers[defaultSettings.business.tokenName] = `${token}`;
  }

  return headers;
}

/**
 * 个人签署方信息
 */
export interface PersonSigner {
  name: string; // 姓名
  mobile: string; // 手机号
}

/**
 * 企业签署方信息
 */
export interface CompanySigner {
  name: string; // 企业名称
  agentName: string; // 经办人姓名
  agentMobile: string; // 经办人手机号
}

/**
 * 签署方信息
 */
export interface Signer {
  requireVideo?: boolean;
  type: number; // 签署方类型：0-个人，1-企业
  person?: PersonSigner; // 个人签署方信息
  company?: CompanySigner; // 企业签署方信息
}

/**
 * 创建合同请求参数
 */
export interface CreateContractRequest {
  requireVideo?: boolean;
  name: string; // 合同名称
  signers: Signer[]; // 签署方信息
  endTime: string; // 签署截止日期
  url: string; // 合同文件URL
  fileSize: number; // 文件大小
}

/**
 * 创建合同响应数据
 */
export interface CreateContractResponse {
  code: number; // 状态码，0表示成功
  flag: boolean; // 标志
  message: string; // 提示信息
  data: {
    id: number; // 合同ID
    isSigner: boolean; // 是否为签署人
    signUrl: string; // 签署URL
  };
}

/**
 * 上传文件请求参数
 */
export interface UploadFileRequest {
  url: string; // 文件URL
  name: string; // 文件名称
}

/**
 * 上传文件接口响应数据
 */
export interface UploadFileResponse {
  code: number; // 状态码，0表示成功
  flag: boolean; // 标志
  message: string; // 提示信息
  data: {
    id: number; // 附件ID
    url: string; // 文件URL
    name: string; // 文件名称
    createBy: number; // 创建人ID
    createTime: string; // 创建时间
    updateBy: number; // 更新人ID
    updateTime: string; // 更新时间
    deleted: boolean; // 是否删除
    size: string; // 文件大小
  };
}

/**
 * 上传合同文件
 * @param file 文件对象
 * @param config 可选配置，包含上传进度回调
 * @returns 上传结果
 */
export function uploadContractFile(
  file: File,
  config?: {
    onUploadProgress?: (progressEvent: any) => void;
  }
) {
  return new Promise((resolve, reject) => {
    console.log('开始上传文件，文件信息:', {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    // 步骤1: 获取OSS上传策略
    console.log('Step1: 获取OSS上传策略');
    axios
      .get('/mgt/upload')
      .then((policyRes) => {
        console.log('获取上传策略响应:', policyRes);

        if (policyRes.code !== 0) {
          console.error('获取上传策略失败:', policyRes);
          reject(new Error(policyRes.message || '获取上传策略失败'));
          return;
        }

        const oss = policyRes.data;
        console.log('OSS配置信息:', {
          host: oss.host,
          dir: oss.dir,
          callback:
            oss.callback?.length > 100
              ? `${oss.callback.substring(0, 100)}...`
              : oss.callback,
          hasBucket: !!oss.bucketName,
        });

        // 步骤2: 构建OSS上传路径
        const date = new Date();
        const dateStr = `${date.getFullYear()}${(date.getMonth() + 1)
          .toString()
          .padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
        const key = `contract/${dateStr}/${Date.now()}_${file.name}`;
        console.log('生成的OSS文件路径:', key);

        // 创建表单数据
        const formData = new FormData();
        formData.append('policy', oss.policy);
        formData.append('key', key);
        formData.append('OSSAccessKeyId', oss.accessKeyId);
        formData.append('signature', oss.signature);
        if (oss.securityToken) {
          formData.append('x-oss-security-token', oss.securityToken);
        }
        formData.append('bucketName', oss.bucketName);
        formData.append('file', file);

        console.log('Step2: 开始上传文件到OSS，目标地址:', oss.host);

        // 步骤2: 上传文件到OSS，使用原生XMLHttpRequest绕过拦截器
        const xhr = new XMLHttpRequest();
        xhr.open('POST', oss.host, true);

        // 绑定进度事件
        xhr.upload.onprogress = (progressEvent) => {
          if (progressEvent.lengthComputable) {
            const percent = Math.floor(
              (progressEvent.loaded / progressEvent.total) * 100
            );
            console.log(`上传进度: ${percent}%`);
            if (config?.onUploadProgress) {
              config.onUploadProgress(progressEvent);
            }
          }
        };

        // 绑定完成事件
        xhr.onload = function () {
          console.log('OSS上传响应状态:', xhr.status);
          console.log('OSS上传响应内容:', xhr.responseText);

          if (xhr.status === 204 || xhr.status === 200) {
            const fileUrl = `${oss.host}/${key}`;
            console.log('文件上传成功，文件URL:', fileUrl);

            // 步骤3: 提交文件信息
            console.log('Step3: 向系统提交文件信息');
            axios
              .post<UploadFileResponse>(
                CONTRACT_PATHS.ATTACHMENT,
                {
                  url: fileUrl,
                  name: file.name,
                },
                {
                  headers: getAuthHeaders(),
                }
              )
              .then((attachmentRes) => {
                console.log('文件信息提交成功:', attachmentRes);
                resolve(attachmentRes);
              })
              .catch((error) => {
                console.error('提交文件信息失败:', error);
                reject(error);
              });
          } else {
            console.error('文件上传到OSS失败，状态码:', xhr.status);
            console.error('响应内容:', xhr.responseText);
            reject(new Error(`文件上传到OSS失败，状态码: ${xhr.status}`));
          }
        };

        // 绑定错误事件
        xhr.onerror = function (e) {
          console.error('OSS上传网络错误:', e);
          reject(new Error('文件上传网络错误'));
        };

        // 发送请求
        xhr.send(formData);
      })
      .catch((error) => {
        console.error('获取上传策略失败，详细信息:', error);
        if (error.response) {
          console.error('错误响应状态:', error.response.status);
          console.error('错误响应数据:', error.response.data);
        }
        reject(error);
      });
  });
}

/**
 * 通过URL添加附件
 * @param params 附件信息
 * @returns 添加结果
 */
export function addAttachmentByUrl(params: UploadFileRequest) {
  return axios.post<UploadFileResponse>(CONTRACT_PATHS.ATTACHMENT, params, {
    headers: getAuthHeaders(),
  });
}

/**
 * 获取历史文件列表
 * @param params 查询参数
 * @returns 历史文件列表
 */
export interface GetHistoryFilesRequest {
  content?: string; // 文件名（可选，用于搜索）
  pageNum: number; // 页码
  pageSize: number; // 每页条数
}

export interface HistoryFile {
  id: string; // 文件ID
  url: string; // 文件URL
  name: string; // 文件名称
  size: string; // 文件大小
}

export interface GetHistoryFilesResponse {
  code: number; // 状态码，0表示成功
  flag: boolean; // 标志
  message: string; // 提示信息
  data: {
    // 返回数据
    total: number; // 总记录数
    pageNum: string; // 当前页码
    pageSize: string; // 每页条数
    rows: HistoryFile[]; // 文件列表
  };
}

export function getHistoryFiles(params: GetHistoryFilesRequest) {
  return axios.get<GetHistoryFilesResponse>(CONTRACT_PATHS.ATTACHMENT, {
    params,
    headers: getAuthHeaders(),
  });
}

/**
 * 创建合同并发起签署
 * @param params 合同信息
 * @returns 创建结果
 */
export function createContract(params: CreateContractRequest) {
  return axios.post<CreateContractResponse>(CONTRACT_PATHS.CONTRACT, params, {
    headers: getAuthHeaders(),
  });
}

export interface ContractListItem {
  id: string | number;
  name?: string;
  fileName?: string;
  url?: string;
  voucherUrl?: string;
  startTime?: string;
  createTime?: string;
  endTime?: string;
  state?: number | string;
}

export interface ContractCompareRequest {
  sourceContractId?: string | number;
  sourceFileUrl?: string;
  sourceFileName?: string;
  sourceText?: string;
  targetContractId?: string | number;
  targetFileUrl?: string;
  targetFileName?: string;
  targetText?: string;
}

export interface ContractCompareResult {
  id?: string | number;
  sourceType?: string;
  sourceContractId?: string | number;
  sourceFileUrl?: string;
  sourceFileName?: string;
  targetContractId?: string | number;
  targetFileUrl?: string;
  targetFileName?: string;
  status?: number;
  summary?: string;
  riskLevel?: string;
  differenceSummary?: string[];
  riskPoints?: string[];
  missingClauses?: string[];
  suggestions?: string[];
  resultJson?: string;
  errorMessage?: string;
  createTime?: string;
}

export function getContractList(params: Record<string, unknown>) {
  return axios.get(CONTRACT_PATHS.CONTRACT_LIST, {
    params,
    headers: getAuthHeaders(),
  });
}

export function compareContracts(params: ContractCompareRequest) {
  return axios.post<ContractCompareResult>(
    CONTRACT_PATHS.CONTRACT_COMPARE,
    params,
    {
      headers: getAuthHeaders(),
    }
  );
}

export function getContractCompareRecord(id: string | number) {
  return axios.get<ContractCompareResult>(
    `${CONTRACT_PATHS.CONTRACT_COMPARE}/${id}`,
    {
      headers: getAuthHeaders(),
    }
  );
}

export function getContractCompareList(params: Record<string, unknown>) {
  return axios.get<ContractCompareResult[]>(CONTRACT_PATHS.CONTRACT_COMPARE, {
    params,
    headers: getAuthHeaders(),
  });
}

export function deleteContractCompareRecord(id: string | number) {
  return axios.delete(`${CONTRACT_PATHS.CONTRACT_COMPARE}/${id}`, {
    headers: getAuthHeaders(),
  });
}

/**
 * AI生成合同请求参数
 */
export interface GenerateContractRequest {
  model?: string; // 模型名称，未传时由后端部署配置控制
  userId: number; // 用户ID
  messages: Array<{
    role: string; // 角色，固定为"user"
    content: string; // 用户输入的描述，例如"生成一份租房合同"
  }>;
  temperature: number; // 温度参数，影响生成的随机性，固定为0.7
  stream: boolean; // 是否流式返回，固定为false
  maxTokens: number; // 最大token数，固定为4096
}

/**
 * AI生成合同响应数据
 */
export interface GenerateContractResponse {
  // 返回数据格式不固定，以下为可能的结构
  choices?: Array<{
    content: string; // 生成的合同内容
  }>;
  conversation?: {
    choices: Array<{
      content: string; // 生成的合同内容
    }>;
  };
}

/**
 * 生成文档请求参数
 */
export interface GenerateDocumentRequest {
  content: string; // 合同内容
  fileName?: string; // 文件名称（可选）
}

/**
 * 生成文档响应数据
 */
export interface GenerateDocumentResponse {
  fileName: string; // 文件名称
  documentUrl: string; // 文档URL
}

/**
 * 调用AI生成合同内容
 * @param params 生成合同的请求参数
 * @returns 生成的合同内容
 */
export function generateContractContent(params: GenerateContractRequest) {
  return axios.post<GenerateContractResponse>(CONTRACT_PATHS.AI_CHAT, params, {
    headers: getAuthHeaders(),
  });
}

/**
 * 生成PDF格式合同文档
 * @param params 包含合同内容和文件名的请求参数
 * @returns 生成的PDF文档信息
 */
export function generatePdfContract(params: GenerateDocumentRequest) {
  return axios.post<GenerateDocumentResponse>(
    CONTRACT_PATHS.GENERATE_PDF,
    params,
    {
      headers: getAuthHeaders(),
    }
  );
}

/**
 * 生成Word格式合同文档
 * @param params 包含合同内容和文件名的请求参数
 * @returns 生成的Word文档信息
 */
export function generateWordContract(params: GenerateDocumentRequest) {
  return axios.post<GenerateDocumentResponse>(
    CONTRACT_PATHS.GENERATE_WORD,
    params,
    {
      headers: getAuthHeaders(),
    }
  );
}

// 合同审查接口
export function auditContract(data: { documentUrl: string; question: string }) {
  return axios.post('/mgt/ai/audit-document', data);
}

export function getContractTemplateCategories() {
  return axios.get(`${CONTRACT_PATHS.CONTRACT_TEMPLATE_CATEGORY}/list`, {
    headers: getAuthHeaders(),
  });
}

export function getContractTemplates(params: {
  pageNum?: number;
  pageSize?: number;
  categoryId?: string | number;
  name?: string;
}) {
  return axios.get(CONTRACT_PATHS.CONTRACT_TEMPLATE, {
    params,
    headers: getAuthHeaders(),
  });
}

export function getContractTemplateDetail(id: string | number) {
  return axios.get(`${CONTRACT_PATHS.CONTRACT_TEMPLATE}/${id}`, {
    headers: getAuthHeaders(),
  });
}

export function getDocumentCategories() {
  return axios.get(`${CONTRACT_PATHS.DOCUMENT}/category/tree`, {
    headers: getAuthHeaders(),
  });
}

export function getDocuments(params: {
  pageNum?: number;
  pageSize?: number;
  categoryId?: string | number;
  title?: string;
}) {
  return axios.get(`${CONTRACT_PATHS.DOCUMENT}/list`, {
    params,
    headers: getAuthHeaders(),
  });
}

export function getDocumentDetail(id: string | number) {
  return axios.get(`${CONTRACT_PATHS.DOCUMENT}/${id}`, {
    headers: getAuthHeaders(),
  });
}

export function recordDocumentDownload(id: string | number) {
  return axios.get(`${CONTRACT_PATHS.DOCUMENT}/${id}/download`, {
    headers: getAuthHeaders(),
  });
}

export function getUserDocuments(params: {
  pageNum?: number;
  pageSize?: number;
  title?: string;
}) {
  return axios.get(`${CONTRACT_PATHS.USER_DOCUMENT}/list`, {
    params,
    headers: getAuthHeaders(),
  });
}

export function getUserDocumentDetail(id: string | number) {
  return axios.get(`${CONTRACT_PATHS.USER_DOCUMENT}/${id}`, {
    headers: getAuthHeaders(),
  });
}

export function deleteUserDocument(id: string | number) {
  return axios.delete(`${CONTRACT_PATHS.USER_DOCUMENT}/${id}`, {
    headers: getAuthHeaders(),
  });
}
