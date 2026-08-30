<!--
 * @Description: 会员充值页面
 * @Author:
 * @Date: 2023-12-15
-->
<template>
  <div class="container">
    <!-- 面包屑导航 -->
    <Breadcrumb />

    <!-- 充值内容区域 -->
    <div class="recharge-container">
      <!-- 头部 -->
      <div class="recharge-header">
        <div class="header-icon"></div>
        <div class="header-title">会员充值</div>
      </div>
      <div class="recharge-divider"></div>

      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-container">
        <a-spin tip="加载中..."></a-spin>
      </div>

      <!-- 支付内容 -->
      <div v-else class="recharge-content">
        <!-- 左侧布局 -->
        <div class="left-content">
          <!-- Tip View -->
          <div
            class="tip-view"
            :style="{ backgroundImage: 'url(/images/bg_recharge.svg)' }"
          >
            <img
              class="white-logo"
              :src="
                appStore.business.logoWhite || '/images/flagship-logo-white.svg'
              "
              alt="logo"
            />
            <div class="tip-service">
              <img
                :src="
                  userStore.roles === 'admin'
                    ? '/images/ic_company.svg'
                    : '/images/ic_personl.svg'
                "
                alt="service"
              />
              <span>{{ mealName }}</span>
              <div class="validity-period">有效期{{ validityPeriod }}个月</div>
            </div>
          </div>

          <!-- 购买企业 - 仅对管理员显示 -->
          <div v-if="userStore.roles === 'admin'" class="purchase-company">
            <span>购买企业：{{ userStore.companyName || '未命名企业' }}</span>
          </div>

          <!-- 购买数量区域 -->
          <div class="purchase-quantity">
            <span>购买份数：</span>
            <a-input
              v-model="quantity"
              class="quantity-input"
              placeholder="请输入购买份数"
              :max-length="5"
              @input="handleQuantityInput"
            />
            <a-button
              type="primary"
              class="confirm-btn"
              @click="confirmQuantity"
              >确认份数</a-button
            >
          </div>

          <!-- 购买套餐 -->
          <div class="purchase-package">
            <div>购买套餐：</div>
            <div class="package-list">
              <div
                v-for="count in packageCounts"
                :key="count"
                class="package-item"
                :class="{ 'package-item-selected': selectedPackage === count }"
                @click="selectPackage(count)"
              >
                <div class="package-item-content">
                  <span class="package-count">{{ count }}</span>
                  <span class="package-unit">份</span>
                </div>
                <img
                  v-if="selectedPackage === count"
                  class="package-selected-icon"
                  src="/images/ic_recharge_checked.svg"
                  alt="selected"
                />
              </div>
            </div>
          </div>

          <!-- 购买须知 -->
          <div class="purchase-notice">
            <div class="notice-title">购买须知：</div>
            <div class="notice-content">
              <div>1.套餐购买完成后立即生效，且不可退款。</div>
              <div
                >2.购买完成的套餐仅限本人使用，不支持转让、赠送或其他交易。</div
              >
              <div
                >3.套餐应在有效期内使用，到期自动失效，不退不补，请尽早使用。</div
              >
              <div>4.发起者是个人购买个体套餐，发起者是企业购买企业套餐。</div>
              <div>5.发起签署合同即会消耗套餐份数。</div>
            </div>
          </div>
        </div>

        <!-- 右侧布局 -->
        <div class="right-content">
          <div class="qrcode-area">
            <div class="qrcode">
              <a-spin :loading="qrcodeLoading" tip="二维码生成中...">
                <qrcode-vue
                  v-if="qrcodeUrl"
                  :value="qrcodeUrl"
                  :size="qrcodeSize"
                  level="H"
                  render-as="canvas"
                />
                <div v-else class="qrcode-placeholder">
                  {{ h5ConfigMissing ? 'H5 公网地址未配置' : '二维码加载中' }}
                </div>
              </a-spin>
            </div>
          </div>
          <div class="payment-info">
            <div class="price-area">
              <span>同意并支付：</span>
              <span class="price"
                ><span class="currency">¥</span>{{ totalPrice }}</span
              >
            </div>
            <div class="payment-method">
              <img src="/images/ic_wechat.svg" alt="wechat" />
              <span>扫码支付</span>
            </div>
            <div v-if="qrcodeRefreshed" class="qrcode-refresh">
              <a-button type="text" @click="refreshQrcode">
                <template #icon><icon-refresh /></template>
                刷新二维码
              </a-button>
            </div>
            <div class="more-packages">更多优惠套餐请联系平台</div>
            <div v-if="commercialPortalEnabled" class="commercial-portal-entry">
              <a-button :loading="commercialPortalLoading" long @click="openCommercialPortal">
                使用商业平台兑换码
              </a-button>
              <span>将在独立平台选择个人或已认证企业，当前页面不处理兑换。</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { ref, computed, onMounted, watch } from 'vue';
  import { useAppStore, useUserStore } from '@/store';
  import { Message } from '@arco-design/web-vue';
  import { IconRefresh } from '@arco-design/web-vue/es/icon';
  import Breadcrumb from '@/components/breadcrumb/index.vue';
  import axios from 'axios';
  import QrcodeVue from 'qrcode.vue';
  import { issueOfficialCommercialSsoCode } from '@/api/brand-config';

  // 全局声明以解决TS错误
  const userStore = useUserStore();
  const appStore = useAppStore();

  // 接口返回的套餐类型定义
  interface MealOption {
    id: string;
    name: string;
    type: number; // -1:免费赠送, 0:个人套餐, 1:企业套餐
    price: number; // 单位为分
    validityPeriod: number; // 有效期，单位为月
    expireTime: string | null;
  }

  // 套餐固定份数选项
  const packageCounts = [5, 50, 100, 500];

  const isLoading = ref<boolean>(false);
  // 选中的套餐类型（个人或企业）
  const mealInfo = ref<MealOption | null>(null);
  // 选中的套餐份数
  const selectedPackage = ref<number>(5);
  // 手动输入的数量
  const quantity = ref<string>('5');
  // 套餐有效期
  const validityPeriod = ref<number>(12);
  // 二维码链接
  const qrcodeUrl = ref<string>('');
  // 二维码是否需要刷新
  const qrcodeRefreshed = ref<boolean>(false);
  // 二维码尺寸
  const qrcodeSize = ref<number>(280);
  // 二维码是否加载中
  const qrcodeLoading = ref<boolean>(false);
  const h5ConfigMissing = ref<boolean>(false);
  const commercialPortalLoading = ref<boolean>(false);
  const commercialPortalEnabled = computed(() => Boolean(
    (appStore.runtimeConfig as any)?.officialCommercialPortal?.enabled
  ));

  const openCommercialPortal = async () => {
    commercialPortalLoading.value = true;
    try {
      const { data } = await issueOfficialCommercialSsoCode();
      if (!data?.launchUrl) throw new Error('商业平台入口未返回');
      window.location.assign(data.launchUrl);
    } catch (error) {
      Message.error('当前实例未开放商业平台联动，或安全入口已失效');
    } finally {
      commercialPortalLoading.value = false;
    }
  };

  // 根据用户角色获取当前默认套餐类型
  const currentMealType = computed(() => {
    return userStore.roles === 'admin' ? 1 : 0; // admin为企业用户, 否则为个人用户
  });

  // 套餐单价（元）
  const unitPrice = computed(() => {
    if (mealInfo.value) {
      return mealInfo.value.price / 100; // 将分转换为元
    }
    return 4; // 默认单价
  });

  // 计算总价（元）
  const totalPrice = computed(() => {
    const num = parseInt(quantity.value || '5', 10);
    const result = unitPrice.value * num;
    return result.toFixed(2);
  });

  // 套餐名称
  const mealName = computed(() => {
    return currentMealType.value === 1 ? '企业电子签服务' : '个人电子签服务';
  });

  // 获取套餐信息
  const fetchMealOptions = async () => {
    try {
      isLoading.value = true;
      const response = await axios.get('/mgt/v1/meal');
      if (response.data && response.data.code === 0 && response.data.data) {
        const meals: MealOption[] = response.data.data;

        // 根据用户角色筛选对应的套餐
        const currentMeal = meals.find(
          (meal: MealOption) => meal.type === currentMealType.value
        );
        if (currentMeal) {
          mealInfo.value = currentMeal;
          validityPeriod.value = currentMeal.validityPeriod;
        }
      }
    } catch (error) {
      console.error('获取套餐信息失败', error);
      Message.error('获取套餐信息失败，请刷新重试');
    } finally {
      isLoading.value = false;
    }
  };

  // 生成二维码链接
  const generateQrcodeUrl = () => {
    // 添加时间戳防止缓存
    const timestamp = new Date().getTime();
    const qty = parseInt(quantity.value || '5', 10);
    const runtimeValues = (appStore.runtimeConfig?.values || {}) as Record<
      string,
      string
    >;
    const configuredH5Base =
      (appStore.runtimeConfig?.h5BaseUrl as string | undefined) ||
      runtimeValues['client.h5-base-url'] ||
      import.meta.env.VITE_H5_BASE_URL ||
      (import.meta.env.DEV ? 'http://127.0.0.1:8097' : '');
    if (!configuredH5Base) {
      h5ConfigMissing.value = true;
      return '';
    }
    h5ConfigMissing.value = false;
    const h5BaseUrl = String(configuredH5Base).replace(/\/$/, '');
    const payRoute = `/#/pages/user/package/buy?from=yiqipc&type=${currentMealType.value}&quantity=${qty}&t=${timestamp}`;
    return `${h5BaseUrl}${payRoute}`;
  };

  // 刷新二维码
  const refreshQrcode = () => {
    qrcodeLoading.value = true;
    setTimeout(() => {
      qrcodeUrl.value = generateQrcodeUrl();
      qrcodeRefreshed.value = false;
      qrcodeLoading.value = false;
    }, 300); // 添加短暂延迟，让用户感知刷新过程
  };

  // 选择套餐份数
  const selectPackage = (value: number) => {
    selectedPackage.value = value;
    quantity.value = value.toString();
  };

  // 确认份数
  const confirmQuantity = () => {
    if (!quantity.value) {
      Message.warning('请输入购买份数');
      return;
    }

    const num = parseInt(quantity.value, 10);
    if (num <= 0) {
      Message.warning('购买份数必须大于0');
      return;
    }

    if (!generateQrcodeUrl()) {
      Message.error('H5 公网地址未配置，请联系管理员在部署配置中维护');
      return;
    }

    // 刷新二维码
    refreshQrcode();

    Message.success(
      `已确认购买${mealName.value} ${num}份，有效期${validityPeriod.value}个月，请扫描二维码支付`
    );
  };

  // 限制只能输入数字
  const handleQuantityInput = (value: string) => {
    quantity.value = value.replace(/[^\d]/g, '');
    // 如果手动输入的数量不在预设的份数中，取消选中状态
    if (!packageCounts.includes(parseInt(quantity.value, 10))) {
      selectedPackage.value = 0;
    } else {
      selectedPackage.value = parseInt(quantity.value, 10);
    }
    // 标记二维码需要刷新
    qrcodeRefreshed.value = true;
  };

  // 当数量变化时，标记二维码需要刷新
  const handleQuantityChange = () => {
    qrcodeRefreshed.value = true;
  };

  // 监听数量变化
  watch(quantity, () => {
    handleQuantityChange();
  });

  // 监听类型变化
  watch(currentMealType, () => {
    refreshQrcode();
  });

  onMounted(() => {
    fetchMealOptions();
    refreshQrcode();
  });
</script>

<style lang="less" scoped>
  .container {
    width: 100%;
    background-color: #f7f9fc;
    padding: 0 20px;
  }

  .recharge-container {
    background-color: #fff;
    padding: 20px;
    width: 100%;
    margin: 0 auto;
  }

  .loading-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 300px;
  }

  .recharge-header {
    height: 60px;
    display: flex;
    align-items: center;
    position: relative;
  }

  .header-icon {
    width: 3px;
    height: 15px;
    background: #317CFF;
    border-radius: 60px;
  }

  .header-title {
    position: absolute;
    margin-left: 6px;
    font-size: 14px;
    color: #2d3036;
  }

  .recharge-divider {
    height: 1px;
    background-color: #eff3f6;
    width: 100%;
    margin-bottom: 20px;
  }

  .recharge-content {
    display: flex;
    width: 100%;
    margin: 0 auto;
  }

  .left-content {
    flex: 1;
    display: flex;
    flex-direction: column;

    .tip-view {
      width: 657px;
      height: 110px;
      background-size: cover;
      background-repeat: no-repeat;
      padding: 20px 25px 20px 20px;
      position: relative;

      .white-logo {
        width: 92px;
        height: 22px;
      }

      .tip-service {
        display: flex;
        align-items: center;
        margin-top: 23px;

        img {
          width: 20px;
          height: 20px;
        }

        span {
          margin-left: 5px;
          color: #fff;
        }

        .validity-period {
          position: absolute;
          right: 25px;
          width: 80px;
          height: 24px;
          background-color: #fff;
          color: #317CFF;
          border-radius: 5px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
        }
      }
    }

    .purchase-company {
      margin-top: 25px;
      font-size: 14px;
      color: #2b2d30;
    }

    .purchase-quantity {
      margin-top: 25px;
      display: flex;
      align-items: center;

      span {
        font-size: 14px;
        color: #2b2d30;
      }

      .quantity-input {
        width: 465px;
        height: 32px;
        margin-left: 5px;
        border-radius: 4px;
        border: 1px solid #d4d6d9;
        background-color: #fff;
      }

      .confirm-btn {
        width: 105px;
        height: 32px;
        background-color: #317CFF;
        border-radius: 4px;
        margin-left: 14px;
        font-size: 13px;
        color: #fff;
        border: none;
      }
    }

    .purchase-package {
      margin-top: 25px;

      div:first-child {
        font-size: 14px;
        color: #2b2d30;
      }

      .package-list {
        display: flex;
        margin-top: 15px;
      }

      .package-item {
        width: 153px;
        height: 71px;
        border: 1px solid #e7e7e7;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 15px;
        position: relative;
        cursor: pointer;

        .package-item-content {
          display: flex;
          flex-direction: row;
          align-items: center;

          .package-count {
            font-size: 24px;
            font-weight: bold;
            color: #353d4b;
          }

          .package-unit {
            font-size: 12px;
            color: #353d4b;
            margin-left: 3px;
          }
        }

        .package-selected-icon {
          position: absolute;
          right: 0;
          bottom: 0;
          width: 32px;
          height: 32px;
        }
      }

      .package-item-selected {
        border: 2px solid #317CFF;
        background-color: #EEF5FF;

        .package-item-content {
          .package-count,
          .package-unit {
            color: #317CFF;
          }
        }
      }
    }

    .purchase-notice {
      margin-top: 25px;

      .notice-title {
        font-size: 15px;
        color: #353d4b;
      }

      .notice-content {
        margin-top: 10px;

        div {
          font-size: 12px;
          color: #353d4b;
          line-height: 1.8;
        }
      }
    }
  }

  .right-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin-left: 20px;

    .qrcode-area {
      width: 330px;
      height: 330px;
      border: 1px solid #e9e9e9;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto;
      position: relative;

      .qrcode {
        width: 300px;
        height: 300px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #fff;

        .qrcode-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          color: #888;
          background-color: #f9f9f9;
        }

        :deep(.arco-spin) {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }
    }

    .payment-info {
      width: 330px;
      margin: 20px auto 0;
      text-align: center;

      .price-area {
        display: flex;
        align-items: baseline;
        justify-content: center;

        span {
          font-size: 15px;
          color: #353d4b;
        }

        .price {
          margin-left: 15px;
          color: #317CFF;
          font-size: 24px;
          font-weight: bold;

          .currency {
            font-size: 14px;
            font-weight: normal;
          }
        }
      }

      .payment-method {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-top: 18px;

        img {
          width: 20px;
          height: 20px;
        }

        span {
          margin-left: 10px;
          font-size: 15px;
          color: #353d4b;
        }
      }

      .qrcode-refresh {
        margin-top: 15px;
        text-align: center;
        color: #165dff;
      }

      .more-packages {
        margin-top: 15px;
        font-size: 13px;
        color: #317CFF;
      }

      .commercial-portal-entry {
        display: grid;
        gap: 8px;
        margin-top: 18px;
        padding-top: 18px;
        border-top: 1px solid #eff3f6;

        span {
          color: #6b7280;
          font-size: 12px;
          line-height: 1.6;
        }
      }
    }
  }

  @media screen and (max-width: 1200px) {
    .left-content {
      .tip-view {
        width: 100%;
        max-width: 657px;
      }
    }
  }

  @media screen and (max-width: 768px) {
    .recharge-content {
      flex-direction: column;
    }

    .right-content {
      width: 100%;
      margin-left: 0;
      margin-top: 20px;
    }

    .left-content {
      .purchase-quantity {
        .quantity-input {
          width: 100%;
          max-width: 465px;
        }
      }
    }
  }
</style>
