<!--
 * @Description:
 * @LastEditTime: 2023-12-14 16:26:40
 * @LastEditors: 何俊峰
 * @Author: 何俊峰
 * @Date: 2023-03-10 18:17:13
-->
<template>
    <div class="navbar">
      <div class="left-side">
        <a-space>
          <div class="logo">
            <img alt="logo" class="logo-image" :src="appStore.business.logo" />
            <div class="logo-text">
              <div class="logo-title">{{ appStore.business.projectName }}</div>
              <div class="logo-subtitle">{{ appStore.business.subtitle }}</div>
            </div>
          </div>
          <icon-menu-fold
            v-if="!topMenu && appStore.device === 'mobile'"
            style="font-size: 22px; cursor: pointer"
            @click="toggleDrawerMenu"
          />
        </a-space>
      </div>
      <div class="center-side">
        <Menu v-if="topMenu" />
      </div>
      <ul class="right-side">
        <li v-if="companyList.length">
          <!-- <li> -->
          <a-dropdown trigger="click">
            <div class="avatarBox roleName">
              <div class="companyName" :title="roleName">{{ roleName }} </div>
              <icon-swap style="margin-left: 10px"
            /></div>
            <template #content>
              <a-doption @click="switchRoles('user')">
                <a-space>
                  <icon-user />
                  <span> {{ userStore.nickname + '的个人空间' }} </span>
                </a-space>
              </a-doption>
              <a-doption
                v-for="(item, index) in companyList"
                :key="index"
                @click="switchRoles('admin', item.companyId)"
              >
                <a-space>
                  <icon-book />
                  <span class="companyName" :title="item.alias">
                    {{ item.alias }}
                  </span>
                </a-space>
              </a-doption>
            </template>
          </a-dropdown>
        </li>
        <li
          ><span>当前合同数：</span
          ><span style="color: #3277FF">{{ contractCount }}</span></li
        >
        <li>
          <a-button type="primary" class="recharge-btn" @click="handleRecharge">
            充值
          </a-button>
        </li>
        <!-- <li>
          <a-tooltip
              :content="
              theme === 'light'
                ? $t('settings.navbar.theme.toDark')
                : $t('settings.navbar.theme.toLight')
            "
          >
            <a-button
                class="nav-btn"
                type="outline"
                :shape="'circle'"
                @click="handleToggleTheme"
            >
              <template #icon>
                <icon-moon-fill v-if="theme === 'dark'" />
                <icon-sun-fill v-else />
              </template>
            </a-button>
          </a-tooltip>
        </li> -->
        <li>
          <a-tooltip
            :content="
              isFullscreen
                ? $t('settings.navbar.screen.toExit')
                : $t('settings.navbar.screen.toFull')
            "
          >
            <a-button
              class="nav-btn"
              type="outline"
              :shape="'circle'"
              @click="toggleFullScreen"
            >
              <template #icon>
                <icon-fullscreen-exit v-if="isFullscreen" />
                <icon-fullscreen v-else />
              </template>
            </a-button>
          </a-tooltip>
        </li>
        <!-- <li>
          <a-tooltip content="页面配置">
            <a-button
              class="nav-btn"
              type="outline"
              :shape="'circle'"
              @click="setVisible"
            >
              <template #icon>
                <icon-settings />
              </template>
            </a-button>
          </a-tooltip>
        </li> -->
        <li>
          <a-dropdown trigger="click">
            <!-- <a-avatar
              :size="32"
              :style="{ marginRight: '8px', cursor: 'pointer' }"
            >
              <img v-if="avatar" alt="avatar" :src="avatar" />
              <img v-else alt="avatar" :src="avatarImg" />
              Hi ,{{ nickname }}
            </a-avatar> -->
            <div class="avatarBox">
              <a-image
                v-if="avatar"
                width="40"
                height="40"
                class="avatar"
                :src="avatar"
                show-loader
                :preview-visible="false"
              />
              <a-image
                v-else
                class="avatar"
                width="40"
                height="40"
                :src="avatarImg"
                :preview-visible="false"
              />
              <a-space class="nickName">
                <span> Hi ,{{ nickname || '未知昵称' }} </span>
              </a-space>
            </div>
            <template #content>
              <a-doption>
                <a-space @click="$router.push({ name: 'editPass' })">
                  <icon-settings />
                  <span> 修改密码 </span>
                </a-space>
              </a-doption>
              <a-doption>
                <a-space @click="handleLogout">
                  <icon-export />
                  <span> 退出登录 </span>
                </a-space>
              </a-doption>
            </template>
          </a-dropdown>
        </li>
      </ul>
    </div>
  </template>

  <script lang="ts" setup>
    import { computed, inject, ref } from 'vue';
    import { Message } from '@arco-design/web-vue';
    import { useDark, useToggle, useFullscreen } from '@vueuse/core';
    import { useAppStore, useUserStore } from '@/store';
    import useUser from '@/hooks/user';
    import Menu from '@/components/menu/index.vue';
    import logotext from '@/assets/images/login/logotext.png';
    import avatarImg from '@/assets/images/avatar.png';
    import { useRouter, useRoute } from 'vue-router';
    import { customRequest } from '@/customComponents/api/index';

    const appStore = useAppStore();
    const userStore = useUserStore();
    const router = useRouter();
    const { logout } = useUser();
    const { isFullscreen, toggle: toggleFullScreen } = useFullscreen();
    const avatar = computed(() => {
      return userStore.avatar;
    });
    const nickname = computed(() => {
      return userStore.nickname || userStore.phone;
    });
    const roleName = computed(() => {
      return userStore.roles === 'admin'
        ? userStore.companyName
        : `${userStore.nickname || userStore.phone}的个人空间`;
    });
    const contractCount = computed(() => {
      return userStore.roles === 'admin'
        ? userStore.companyMealCount || 0
        : userStore.individualMealCount || 0;
    });
    const theme = computed(() => {
      return appStore.theme;
    });
    const topMenu = computed(() => appStore.topMenu && appStore.menu);
    const isDark = useDark({
      selector: 'body',
      attribute: 'arco-theme',
      valueDark: 'dark',
      valueLight: 'light',
      storageKey: 'arco-theme',
      onChanged(dark: boolean) {
        // overridden default behavior
        appStore.toggleTheme(dark);
      },
    });
    const toggleTheme = useToggle(isDark);
    const handleToggleTheme = () => {
      toggleTheme();
    };
    const setVisible = () => {
      appStore.updateSettings({ globalSettings: true });
    };
    const handleLogout = () => {
      logout();
    };
    const handleRecharge = () => {
      router.push('/user/recharge');
    };
    const toggleDrawerMenu = inject('toggleDrawerMenu') as () => void;
    const activeId = ref(null);
    const switchRoles = async (role: any, companyId?: any) => {
      activeId.value = companyId || null;
      const res = await userStore.switchRoles(role, {
        companyId,
        identityType: companyId ? 1 : 0,
      });
      Message.success(res as string);
      if (role === 'user') {
        router.push('/handling/List');
      } else if (role === 'admin') {
        router.push('/member/List');
      }
    };
    interface CompanyItem {
      companyId: string | number;
      alias: string;
    }
    const companyList = ref<CompanyItem[]>([]);
    const getList = async () => {
      const res = await customRequest(
        {
          requestUrl: `/mgt/v1/company`,
          requestType: 'get',
        },
        {},
        {
          pageSize: 999,
        }
      );
      companyList.value = res.data.rows || [];
    };
    getList();
  </script>

  <style lang="less" scoped>
    .navbar {
      display: flex;
      justify-content: space-between;
      height: 50px;
      background-color: var(--color-bg-2);
      border-bottom: 1px solid var(--color-border);
      box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
    }

    .left-side {
      display: flex;
      align-items: center;
      padding-left: 40px;
    }

    .logo {
      display: flex;
      align-items: center;

      .logo-image {
        width: 37px;
        height: 37px;
      }

      .logo-text {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        margin-left: 10px;
        color: var(--color-text-1);
      }

      .logo-title {
        font-size: 16px;
        font-weight: bold;
      }

      .logo-subtitle {
        font-size: 10px;
      }
    }

    .center-side {
      flex: 1;
    }

    .right-side {
      display: flex;
      padding-right: 20px;
      list-style: none;

      li {
        display: flex;
        align-items: center;
        padding: 0 10px;
      }

      a {
        color: var(--color-text-1);
        text-decoration: none;
      }

      .nav-btn {
        color: rgb(var(--gray-8));
        font-size: 16px;
        border-color: rgb(var(--gray-2));
      }

      .trigger-btn,
      .ref-btn {
        position: absolute;
        bottom: 14px;
      }

      .trigger-btn {
        margin-left: 14px;
      }
    }

    .avatarBox {
      display: flex;
      align-items: center;
      cursor: pointer;

      .avatar {
        margin-right: 8px;
        border-radius: 50%;
      }
    }

    .roleName {
      height: 32px;
      padding: 17px;
      color: var(--color-text-1);
      font-size: 14px;
      background: #f7f9fc;
      border-radius: 60px;
      cursor: pointer;
      .companyName {
        display: inline-block;
        max-width: 270px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
    }

    .recharge-btn {
      width: 81px;
      height: 32px;
      background: #3277FF;
      border-radius: 5px;
      color: #fff;
      font-size: 14px;
      border: none;
    }
  </style>

  <style lang="less">
    .message-popover {
      .arco-popover-content {
        margin-top: 0;
      }
    }
  </style>

