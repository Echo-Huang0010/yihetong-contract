<template>
  <div class="login-form">
    <div class="form-item">
      <div class="form-label">平台账号</div>
      <input v-model="userInfo.phone" class="form-input" placeholder="请输入账号" />
    </div>

    <div class="form-item">
      <div class="form-label">平台密码</div>
      <div class="password-input-wrapper">
        <input
          v-model="userInfo.password"
          class="form-input"
          :type="showPassword ? 'text' : 'password'"
          placeholder="请输入密码"
        />
        <span class="password-toggle" @click="showPassword = !showPassword">
          <i class="icon-eye" :class="{ 'icon-eye-closed': !showPassword }"></i>
        </span>
      </div>
    </div>

    <div class="form-actions">
      <label class="remember-password">
        <input
          type="checkbox"
          :checked="loginConfig.rememberPassword"
          @change="setRememberPassword(($event.target as HTMLInputElement).checked)"
        />
        <span>记住密码</span>
      </label>
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
  import { useStorage } from '@vueuse/core';
  import { useRouter } from 'vue-router';
  import { Message } from '@arco-design/web-vue';
  import type { LoginData } from '@/api/user';
  import useLoading from '@/hooks/loading';
  import { useAppStore, useUserStore } from '@/store';

  const router = useRouter();
  const { loading, setLoading } = useLoading();
  const appStore = useAppStore();
  const userStore = useUserStore();
  const visible = ref(false);
  const errorMsg = ref('');
  const showPassword = ref(false);

  const loginConfig = useStorage('login-config', {
    rememberPassword: true,
    phone: '',
    password: '',
  });

  const userInfo = reactive({
    phone: loginConfig.value.phone,
    password: loginConfig.value.password,
  });

  const handleSubmit = async () => {
    if (loading.value) return;

    errorMsg.value = '';

    if (!userInfo.phone) {
      errorMsg.value = '请输入账号';
      return;
    }

    if (!userInfo.password) {
      errorMsg.value = '请输入密码';
      return;
    }

    setLoading(true);

    try {
      const data = await userStore.passLogin(userInfo as LoginData);

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

      const { rememberPassword } = loginConfig.value;
      const { phone, password } = userInfo;
      loginConfig.value.phone = rememberPassword ? phone : '';
      loginConfig.value.password = rememberPassword ? password : '';
    } catch (error) {
      console.error('登录失败', error);
      errorMsg.value = '登录失败，请检查账号和密码';
    } finally {
      setLoading(false);
    }
  };

  const setRememberPassword = (value: boolean) => {
    loginConfig.value.rememberPassword = value;
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

.password-input-wrapper {
  position: relative;

  .form-input {
    padding-right: 40px;
  }

  .password-toggle {
    position: absolute;
    right: 15px;
    top: 50%;
    transform: translateY(-50%);
    cursor: pointer;
    color: #888888;

    .icon-eye {
      display: inline-block;
      width: 20px;
      height: 20px;
      background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23888888"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>');

      &.icon-eye-closed {
        background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23888888"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>');
      }
    }
  }
}

.form-actions {
  display: flex;
  justify-content: space-between;
  margin-bottom: 25px;
}

.remember-password {
  display: flex;
  align-items: center;
  cursor: pointer;

  input[type='checkbox'] {
    margin-right: 8px;
  }

  span {
    font-size: 14px;
    color: #353D4B;
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
