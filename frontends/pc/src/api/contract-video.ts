import axios from 'axios';

export interface SignerVideoRecord {
  id: number;
  contractId: number;
  userId: number;
  userContractId: number;
  videoUrl: string;
  duration: number;
  createTime?: string;
  updateTime?: string;
}

export function getContractVideoRecords(contractId: string | number) {
  return axios.get<SignerVideoRecord[]>(
    `/mgt/v1/contract-video/list/${contractId}`
  );
}
