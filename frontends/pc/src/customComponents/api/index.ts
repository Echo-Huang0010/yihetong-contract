/*
 * @Description:
 * @LastEditTime: 2023-12-15 14:58:12
 * @LastEditors: 何俊峰
 * @Author: 何俊峰
 * @Date: 2023-03-06 14:15:06
 */
import axios, { AxiosRequestConfig } from 'axios';
import { getUseData, transJoggleRules } from '@/customComponents/utils/index';

interface commonList {
  [index: number]: any;
}
interface commonRecord {
  [x: string]: any | commonList;
}
interface RequestParam {
  transName?: string | number;
  fieldName?: string | number;
  [x: string]: any;
}

export function customGet(url: string, params: commonRecord) {
  return axios.get<commonRecord>(url, { params });
}
export function customPost(url: string, data: commonRecord) {
  return axios.post<commonRecord>(url, data);
}
export function customPut(url: string, data: commonRecord) {
  console.log(data);
  return axios.put<commonRecord>(url, data);
}
export function customPatch(url: string, data: commonRecord) {
  console.log(data);
  return axios.patch<commonRecord>(url, data);
}
export function customDetele(url: string, data: commonRecord) {
  return axios.delete<commonRecord>(url, { data });
}
export async function customRequest(
  request: commonRecord,
  data?: commonRecord,
  otherData?: commonRecord
) {
  const {
    requestUrl,
    requestType,
    requestParams,
    paramsType,
    bodyParams,
    requestResult,
    recombinationData,
  } = request;
  let form: commonRecord = {};
  let requestUrl1 = requestUrl;
  requestParams?.forEach((item: string | number | RequestParam) => {
    const isObjectParam = typeof item === 'object' && item !== null;
    const transName = isObjectParam ? item.transName || item.fieldName : item;
    const fieldName = isObjectParam ? item.fieldName || item.transName : item;
    console.log(transName);
    console.log(fieldName);
    const dataFieldName = fieldName ?? transName;
    const value =
      data && dataFieldName !== undefined ? data[String(dataFieldName)] : '';
    if (paramsType && paramsType === 'link') {
      if (requestUrl1.indexOf('{') !== -1) {
        requestUrl1 = requestUrl1.replace(`{${transName}}`, String(value ?? ''));
      } else {
        // eslint-disable-next-line no-const-assign
        requestUrl1 += `/${value}`;
      }
    } else {
      form[String(transName)] = value;
    }
  });
  form = {
    ...form,
    ...otherData,
  };
  if (bodyParams) {
    form = {
      ...form,
      ...bodyParams,
    };
  }
  let res: any = {};
  if (requestType === 'get') {
    res = await customGet(requestUrl1, form);
  } else if (requestType === 'post') {
    res = await customPost(requestUrl1, form);
  } else if (requestType === 'put') {
    res = await customPut(requestUrl1, form);
  } else if (requestType === 'delete') {
    res = await customDetele(requestUrl1, form);
  } else if (requestType === 'patch') {
    res = await customPatch(requestUrl1, form);
  }
  if (requestResult) {
    // eslint-disable-next-line no-shadow
    const { data, transRules } = requestResult;
    console.log(1222222);
    console.log(requestResult);
    if (data) {
      res = getUseData(data, res);
    }
    if (transRules) {
      res = transJoggleRules(res, transRules);
    }
  }
  if (recombinationData) {
    const { newData, dataToField } = recombinationData;
    if (newData) {
      if (dataToField) {
        // eslint-disable-next-line no-shadow
        const data: any = JSON.parse(JSON.stringify(res));
        let newData1 = JSON.parse(JSON.stringify(newData));
        if (Array.isArray(newData)) {
          newData.forEach((item: any) => {
            item[dataToField] = data;
          });
          newData1 = JSON.parse(JSON.stringify(newData));
        } else if (data.constructor === Object) {
          newData[dataToField] = data;
          newData1 = newData;
        }
        res = newData1;
      }
    }
  }
  return res;
}

export function getList(params: AxiosRequestConfig<any> | undefined) {
  return axios.get('/api/customList/getList', params);
}
