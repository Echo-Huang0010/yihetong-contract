/*
 * @Description:
 * @LastEditTime: 2023-05-29 10:39:30
 * @LastEditors: 何俊峰
 * @Author: 何俊峰
 * @Date: 2023-02-24 17:34:15
 */
import Mock from 'mockjs';

import './user';
import './message-box';
import '@/views/customList/search-table/mock';

import '@/views/user/info/mock';
import '@/views/user/setting/mock';

Mock.setup({
  timeout: '600-1000',
});
