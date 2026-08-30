/*
 * @Description:
 * @LastEditTime: 2023-05-26 16:35:47
 * @LastEditors: 何俊峰
 * @Author: 何俊峰
 * @Date: 2023-03-03 14:00:00
 */
import Mock from 'mockjs';
import qs from 'query-string';
import setupMock, { successResponseWrap } from '@/utils/setup-mock';
import { GetParams } from '@/types/global';

const { Random } = Mock;

const data = Mock.mock({
  'list|55': [
    {
      'id|8': /[A-Z][a-z][-][0-9]/,
      'number|2-3': /[0-9]/,
      'name|4-8': /[A-Z]/,
      'count|2-3': /[0-9]/,
      'status|1': ['1', '0'],
      'createdTime': Random.datetime(),
      'avatar':
        '//lf1-xgcdn-tos.pstatp.com/obj/vcloud/vadmin/start.8e0e4855ee346a46ccff8ff3e24db27b.png',
    },
  ],
});
const detailData = Mock.mock({
  'id|8': /[A-Z][a-z][-][0-9]/,
  'number|2-3': /[0-9]/,
  'name|4-8': /[A-Z]/,
  'count|2-3': /[0-9]/,
  'status|1': ['1', '0'],
  'createdTime': Random.datetime(),
  'avatar':
    '//lf1-xgcdn-tos.pstatp.com/obj/vcloud/vadmin/start.8e0e4855ee346a46ccff8ff3e24db27b.png',
});

setupMock({
  setup() {
    Mock.mock(new RegExp('/api/customList/getList'), (params: GetParams) => {
      console.log(2222);
      const { current = 1, pageSize = 10 } = qs.parseUrl(params.url).query;
      const p = current as number;
      const ps = pageSize as number;
      return successResponseWrap({
        list: data.list.slice((p - 1) * ps, p * ps),
        total: 55,
      });
    });
    Mock.mock(new RegExp('/api/customList/getDetail'), (params: GetParams) => {
      console.log(2222);
      const { current = 1, pageSize = 10 } = qs.parseUrl(params.url).query;
      const p = current as number;
      const ps = pageSize as number;
      return successResponseWrap(detailData);
    });
  },
});
