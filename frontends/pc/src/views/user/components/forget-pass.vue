<!--
 * @Description:
 * @LastEditTime: 2023-06-14 15:38:59
 * @LastEditors: 何俊峰
 * @Author: 何俊峰
 * @Date: 2023-02-24 17:34:15
-->
<template>
  <div class="form">
    <a-card class="general-card">
      <template #title>修改密码</template>
      <a-form
        ref="loginForm"
        :model="userInfo"
        class="login-form"
        auto-label-width
        @submit="handleSubmit"
      >
        <a-form-item label="手机号">
          {{ userStore.phone }}
          <!-- <template #extra> 填写账号由数字、字母组合 </template> -->
        </a-form-item>
        <a-form-item
          label="验证码"
          field="code"
          :rules="[{ required: true, message: '请输入验证码' }]"
          :validate-trigger="['change', 'blur']"
        >
          <a-input-search
            v-model="userInfo.code"
            placeholder="请输入验证码"
            search-button
            size="medium"
            :max-length="6"
            @search="getCode"
          >
            <template #button-default> {{ getCodeText }} </template>
          </a-input-search>
        </a-form-item>
        <a-form-item
          label="账号新密码"
          field="password"
          :rules="[{ required: true, message: '请输入新密码' }]"
          :validate-trigger="['change', 'blur']"
        >
          <a-input
            v-model="userInfo.password"
            :max-length="11"
            placeholder="请输入新密码"
          ></a-input>
        </a-form-item>
        <a-form-item
          label="新密码确认"
          field="confirmPassword"
          :rules="[{ required: true, message: '请再次输入新密码' }]"
          :validate-trigger="['change', 'blur']"
        >
          <a-input
            v-model="userInfo.confirmPassword"
            :max-length="11"
            placeholder="请再次输入新密码"
          ></a-input>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" html-type="submit" :loading="loading"
            >确认</a-button
          >
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script lang="ts" setup>
  import { ref, reactive } from 'vue';
  import { Message } from '@arco-design/web-vue';
  import { ValidatedError } from '@arco-design/web-vue/es/form/interface';
  import useLoading from '@/hooks/loading';
  import { customRequest } from '@/customComponents/api/index';
  import { useUserStore } from '@/store';
  import { useRouter } from 'vue-router';

  const router = useRouter();
  const { loading, setLoading } = useLoading();

  const userInfo = reactive({
    password: '',
    confirmPassword: '',
    code: '',
  });
  const getCodeText = ref<string>('发送验证码');

  const userStore = useUserStore();

  const handleSubmit = async ({
    errors,
  }: {
    errors: Record<string, ValidatedError> | undefined;
  }) => {
    if (loading.value) return;
    if (!errors) {
      setLoading(true);
      try {
        customRequest(
          {
            requestUrl: `/mgt/v1/u/resetPwd`,
            requestType: 'put',
          },
          {},
          userInfo
        ).then(() => {
          Message.success('修改成功！');
          router.back();
        });
      } finally {
        setLoading(false);
      }
    }
  };
  const codeTime = ref(0);
  const setCodeTime = async () => {
    codeTime.value = 60;
    getCodeText.value = `${codeTime.value}s`;
    const time = setInterval(() => {
      codeTime.value -= 1;
      if (codeTime.value === 0) {
        getCodeText.value = '发送验证码';
        clearInterval(time);
      } else {
        getCodeText.value = `${codeTime.value}s`;
      }
    }, 1000);
  };
  const getCode = async () => {
    if (codeTime.value === 0) {
      if (userStore.phone) {
        setCodeTime();
        const { data } = await customRequest({
          requestUrl: `/mgt/v1/sms/${userStore.phone}/2`,
          requestType: 'get',
        });
        Message.success('发送成功');
      } else {
        Message.error('请先输入手机号');
      }
    }
  };
</script>

<style lang="less" scoped>
  .form {
    padding: 20px 0;
  }
  .bottomTool {
    font-size: 14px;
    line-height: 30px;
    margin-bottom: 30px;
    .colorBlue {
      cursor: pointer;
      color: rgb(var(--link-6));
    }
  }
  .login-form {
    width: 400px;
  }
</style>
