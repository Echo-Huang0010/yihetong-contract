import axios from 'axios';
import { getToken } from '@/utils/auth';
import defaultSettings from '@/config/settings.json';

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

export interface ContractApprovalTask {
  id: string | number;
  approvalInstanceId?: string | number;
  nodeId?: string | number;
  nodeName?: string;
  approverUserId?: string | number;
  approverRoleId?: string | number;
  approverName?: string;
  approverPhone?: string;
  approverRoleName?: string;
  approverLabel?: string;
  taskStatus?: number;
  comment?: string;
  approveTime?: string;
  createTime?: string;
}

export interface ContractApprovalTreeNode {
  nodeId?: string | number;
  nodeName?: string;
  nodeOrder?: number;
  nodeStatus?: number;
  nodeStatusText?: string;
  approverType?: number;
  approverUserId?: string | number;
  approverUserName?: string;
  approverUserPhone?: string;
  approverRoleId?: string | number;
  approverRoleName?: string;
  taskId?: string | number;
  taskStatus?: number;
  comment?: string;
  approveTime?: string;
  current?: boolean;
}

export interface ContractApprovalRecord {
  id: string | number;
  templateId?: string | number;
  templateName?: string;
  contractName?: string;
  flowName?: string;
  approvalStatus?: number;
  currentNodeName?: string;
  pdfUrl?: string;
  videoUrl?: string;
  requireVideo?: boolean;
  componentsJson?: string;
  signersJson?: string;
  templateSignersJson?: string;
  formalContractId?: string | number;
  submitTime?: string;
  approvedTime?: string;
  rejectedTime?: string;
  tasks?: ContractApprovalTask[];
  approvalTree?: ContractApprovalTreeNode[];
}

export interface ContractCreateResponse {
  id?: string | number;
  isSigner?: boolean;
  signUrl?: string;
}

export function getMyApprovalRecords() {
  return axios.get<ContractApprovalRecord[]>('/api/v1/contract-approval/mine', {
    headers: getAuthHeaders(),
  });
}

export function getApprovalDetail(id: string | number) {
  return axios.get<ContractApprovalRecord>(`/api/v1/contract-approval/${id}`, {
    headers: getAuthHeaders(),
  });
}

export function continueApprovalContract(id: string | number) {
  return axios.post<ContractCreateResponse>(
    `/api/v1/contract-approval/${id}/continue`,
    {},
    { headers: getAuthHeaders() }
  );
}
