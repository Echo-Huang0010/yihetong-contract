/*
 * @Description:
 * @LastEditTime: 2023-05-30 18:04:57
 * @LastEditors: 何俊峰
 * @Author: 何俊峰
 * @Date: 2023-05-26 10:27:31
 */
import Mock from 'mockjs';
import setupMock, {
  successResponseWrap,
  failResponseWrap,
} from '@/utils/setup-mock';

import { MockParams } from '@/types/mock';
import { isLogin } from '@/utils/auth';

setupMock({
  setup() {
    // Mock.XHR.prototype.withCredentials = true;

    // 用户信息
    Mock.mock(new RegExp('/mgt/v1/u/info'), () => {
      if (isLogin()) {
        const role = window.localStorage.getItem('userRole') || 'admin';
        return successResponseWrap({
          name: '王立群',
          avatar:
            '//lf1-xgcdn-tos.pstatp.com/obj/vcloud/vadmin/start.8e0e4855ee346a46ccff8ff3e24db27b.png',
          email: 'wangliqun@email.com',
          job: 'frontend',
          jobName: '前端艺术家',
          organization: 'Frontend',
          organizationName: '前端',
          location: 'beijing',
          locationName: '北京',
          introduction: '人潇洒，性温存',
          personalWebsite: 'https://www.arco.design',
          phone: '150****0000',
          registrationDate: '2013-05-10 12:10:00',
          accountId: '15012312300',
          certification: 1,
          role,
        });
      }
      return failResponseWrap(null, '未登录', 50008);
    });

    // 登录
    Mock.mock(new RegExp('/mgt/v1/u/sms/login'), (params: MockParams) => {
      const { phone, verificationCode } = JSON.parse(params.body);
      if (!phone) {
        return failResponseWrap(null, '手机号不能为空', 50000);
      }
      if (!verificationCode) {
        return failResponseWrap(null, '验证码不能为空', 50000);
      }
      if (phone === 'admin' && verificationCode === 'admin') {
        window.localStorage.setItem('userRole', 'admin');
        return successResponseWrap({
          token: 'mock-access-token',
        });
      }
      if (phone === 'user' && verificationCode === 'user') {
        window.localStorage.setItem('userRole', 'user');
        return successResponseWrap({
          token: 'mock-access-token',
        });
      }
      return failResponseWrap(null, '手机号或者验证码错误', 50000);
    });

    // 登出
    Mock.mock(new RegExp('/api/user/logout'), () => {
      return successResponseWrap(null);
    });
  },
});
