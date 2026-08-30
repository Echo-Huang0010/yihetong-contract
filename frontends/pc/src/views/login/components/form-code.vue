<template>
  <div class="login-form">
    <div class="form-item">
      <div class="form-label">平台账号</div>
      <input
        v-model="userInfo.phone"
        class="form-input"
        placeholder="请输入手机号"
        maxlength="11"
      />
    </div>

    <div class="form-item">
      <div class="form-label">手机验证码</div>
      <div class="human-check-group">
        <button class="human-question" type="button" @click="refreshHumanCheck">
          {{ humanCheck.question || '获取安全校验' }}
        </button>
        <input
          v-model="humanCheck.answer"
          class="form-input human-answer"
          placeholder="答案"
          maxlength="3"
        />
      </div>
      <div class="code-input-group">
        <input
          v-model="userInfo.verificationCode"
          class="form-input"
          placeholder="请输入验证码"
          maxlength="6"
        />
        <button class="code-btn" :disabled="isCountingDown" @click="getCode">
          {{ getCodeText }}
        </button>
      </div>
    </div>

    <div v-if="errorMsg" class="error-message">{{ errorMsg }}</div>

    <button class="login-btn" :disabled="loading" @click="handleSubmit">
      立即登录
    </button>

    <a-modal v-model:visible="visible" :footer="false" @cancel="visible = false">
      <template #title>
        您的账号未实名认证，请扫码实名认证后登录用户端签署合同
      </template>
      <div class="qr-box">
        <img class="qr-code" :src="appStore.business.qrCode" />
      </div>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
  import { reactive, ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { Message } from '@arco-design/web-vue';
  import type { LoginData } from '@/api/user';
  import { customRequest } from '@/customComponents/api/index';
  import useLoading from '@/hooks/loading';
  import { useAppStore, useUserStore } from '@/store';

  const router = useRouter();
  const { loading, setLoading } = useLoading();
  const visible = ref(false);
  const errorMsg = ref('');
  const isCountingDown = ref(false);

  const userInfo = reactive({
    phone: '',
    verificationCode: '',
  });
  const humanCheck = reactive({
    phone: '',
    question: '',
    token: '',
    answer: '',
  });
  const getCodeText = ref<string>('获取验证码');

  const appStore = useAppStore();
  const userStore = useUserStore();

  async function refreshHumanCheck() {
    if (!/^1\d{10}$/.test(userInfo.phone)) {
      errorMsg.value = '请先输入正确的手机号';
      return;
    }
    const result = await customRequest({
      requestUrl: `/mgt/v1/sms/login-challenge/${userInfo.phone}`,
      requestType: 'get',
    });
    const data = result?.data || result;
    humanCheck.phone = userInfo.phone;
    humanCheck.question = data?.question || '';
    humanCheck.token = data?.challengeToken || '';
    humanCheck.answer = '';
    errorMsg.value = '';
  }

  const getCode = async () => {
    if (isCountingDown.value) return;

    if (!userInfo.phone) {
      errorMsg.value = '请输入手机号';
      return;
    }

    if (!/^1\d{10}$/.test(userInfo.phone)) {
      errorMsg.value = '请输入正确的手机号';
      return;
    }

    if (!humanCheck.token || humanCheck.phone !== userInfo.phone) {
      await refreshHumanCheck();
      errorMsg.value = '请先完成安全校验';
      return;
    }

    if (!humanCheck.answer.trim()) {
      errorMsg.value = '请输入安全校验答案';
      return;
    }

    try {
      await customRequest({
        requestUrl: `/mgt/v1/sms/${userInfo.phone}/1`,
        requestType: 'get',
      }, undefined, {
        challengeToken: humanCheck.token,
        challengeAnswer: humanCheck.answer,
      });

      isCountingDown.value = true;
      humanCheck.token = '';
      humanCheck.answer = '';
      let count = 60;
      getCodeText.value = `${count}s`;

      const timer = window.setInterval(() => {
        count -= 1;
        getCodeText.value = `${count}s`;

        if (count === 0) {
          window.clearInterval(timer);
          getCodeText.value = '获取验证码';
          isCountingDown.value = false;
        }
      }, 1000);

      Message.success('验证码发送成功');
      errorMsg.value = '';
    } catch (error) {
      console.error('发送验证码失败', error);
      errorMsg.value = '验证码发送失败，请稍后重试';
      await refreshHumanCheck();
    }
  };

  const handleSubmit = async () => {
    if (loading.value) return;

    errorMsg.value = '';

    if (!userInfo.phone) {
      errorMsg.value = '请输入手机号';
      return;
    }

    if (!userInfo.verificationCode) {
      errorMsg.value = '请输入验证码';
      return;
    }

    setLoading(true);

    try {
      const data = await userStore.login(userInfo as LoginData);

      if (!data.data?.authentication) {
        visible.value = true;
        return;
      }

      window.setTimeout(() => {
        const { redirect, ...othersQuery } = router.currentRoute.value.query;
        router.push({
          name: (redirect as string) || 'handling',
          query: {
            ...othersQuery,
          },
        });
      }, 300);

      Message.success('登录成功');
    } catch (error) {
      console.error('登录失败', error);
      errorMsg.value = '登录失败，请检查账号和验证码';
    } finally {
      setLoading(false);
    }
  };
</script>

<style lang="less" scoped>
.login-form {
  width: 100%;
}

.form-item {
  margin-bottom: 25px;
}

.form-label {
  font-size: 14px;
  color: #353D4B;
  margin-bottom: 15px;
}

.form-input {
  width: 100%;
  height: 46px;
  background-color: #F4F4F4;
  border: 1px solid #D5D5D5;
  border-radius: 5px;
  padding: 0 15px;
  font-size: 14px;
  color: #353D4B;
  box-sizing: border-box;

  &::placeholder {
    color: #888888;
  }

  &:focus {
    outline: none;
    border-color: #3277FF;
  }
}

.code-input-group {
  display: flex;
  gap: 15px;

  .form-input {
    flex: 1;
    border-radius: 5px;
  }
}

.human-check-group {
  display: flex;
  gap: 15px;
  margin-bottom: 12px;
}

.human-question {
  flex: 1;
  height: 46px;
  background: #F4F4F4;
  border: 1px solid #D5D5D5;
  border-radius: 5px;
  color: #353D4B;
  font-size: 14px;
  cursor: pointer;
  text-align: left;
  padding: 0 15px;
}

.human-answer {
  width: 96px;
  flex: none;
  text-align: center;
}

.code-btn {
  width: 125px;
  height: 46px;
  background-color: #3277FF;
  border: none;
  border-radius: 5px;
  color: white;
  font-size: 14px;
  cursor: pointer;

  &:disabled {
    background-color: #aac6ff;
    cursor: not-allowed;
  }
}

.error-message {
  min-height: 20px;
  line-height: 20px;
  color: #FF7D7D;
  font-size: 14px;
  text-align: center;
  margin-bottom: 15px;
}

.login-btn {
  width: 100%;
  height: 46px;
  background-color: #3277FF;
  border: none;
  border-radius: 5px;
  color: white;
  font-size: 14px;
  cursor: pointer;
  margin-top: 15px;

  &:disabled {
    background-color: #aac6ff;
    cursor: not-allowed;
  }
}

.qr-box {
  display: flex;
  align-items: center;
  justify-content: center;

  .qr-code {
    width: 350px;
    height: 350px;
  }
}
</style>
