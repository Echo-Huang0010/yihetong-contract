<!--
 * @Description:
 * @LastEditTime: 2023-12-08 15:19:50
 * @LastEditors: 何俊峰
 * @Author: 何俊峰
 * @Date: 2023-03-06 11:01:48
-->
<template>
  <div class="container">
    <Breadcrumb :items="config.detail?.path" />
    <a-space direction="vertical" :size="16" fill>
      <a-card class="general-card" :title="name" :body-style="{ padding: 0 }">
        <template #extra>
          <a-space>
            <a-button type="primary" @click="back">返回</a-button>
          </a-space>
        </template>
      </a-card>
      <a-card class="general-card">
        <ProfileItem :loading="loading" :field-list="groupList" />
        <slot name="otherInfo"></slot>
      </a-card>
      <a-card v-if="tabList.length" class="general-card">
        <a-tabs default-active-key="0">
          <a-tab-pane
            v-for="(item, index) in tabList"
            :key="index"
            :title="item.title"
            :style="{ height: item.height || '500px' }"
          >
            <subTable :json-name="item.jsonName"></subTable>
          </a-tab-pane>
        </a-tabs>
      </a-card>
    </a-space>

    <div
      v-if="operateList.length"
      class="actions"
      :style="{
        'padding-left': menuWidth + 40 + 'px',
        'text-align': butTextAlign,
      }"
    >
      <a-space>
        <operate
          :record="currentData"
          :operate-list="operateList"
          @opt-click="optClick"
        ></operate>
      </a-space>
    </div>
    <operation-pop
      ref="operationPopComp"
      :field-list="config?.fieldList"
      @get-data="fetchCurrentData"
    ></operation-pop>
  </div>
</template>

<script lang="ts" setup>
  import { ref, computed } from 'vue';
  import useLoading from '@/hooks/loading';
  import { customRequest } from '@/customComponents/api/index';
  import { useRouter, useRoute } from 'vue-router';
  import {
    generateFieldList,
    generateGroupList,
    getUseData,
  } from '@/customComponents/utils/index';
  import { useAppStore } from '@/store';
  import operate from '@/customComponents/customList/components/operate/index.vue';
  import operationPop from '@/customComponents/operationPop/index.vue';
  import ProfileItem from './components/profile-item.vue';
  import subTable from './components/subTable.vue';

  const { loading, setLoading } = useLoading(true);

  interface formModelType {
    [x: string]: any;
  }
  const currentData = ref<formModelType>({} as formModelType);
  // 初始化数据

  const props = defineProps({
    config: {
      type: Object,
      default: () => {
        return {};
      },
    },
  });
  const name = ref(props.config.detail?.title || '');
  const groupList = ref<formModelType[]>(
    generateGroupList(
      generateFieldList(props.config?.fieldList, 'detail'),
      'detail',
      props.config?.detail.group
    )
  );
  const tabList = ref<formModelType[]>(props.config?.detail?.tabList || []);
  const butTextAlign: any = props.config.detail.butTextAlign || 'left';
  const appStore = useAppStore();
  const menuWidth = computed(() => {
    return appStore.menuCollapse ? 48 : appStore.menuWidth;
  });

  // 初始化数据
  const generateOperateList = () => {
    return props.config.detailOperates || [];
  };
  const operateList = ref<formModelType[]>(generateOperateList());
  console.log('22222222222');
  console.log(operateList.value);

  const { query } = useRoute();
  const fetchCurrentData = async () => {
    try {
      if (props.config.detail?.getDetail?.noRequest) {
        currentData.value = query;
      } else {
        const { data } = await customRequest(
          props.config.detail?.getDetail,
          query
        );
        currentData.value = data;
      }
      groupList.value.forEach((element) => {
        element.data?.forEach((item: formModelType) => {
          const data = currentData.value;
          if (item.fieldName) {
            const value = getUseData(item.fieldName, data);
            item.value = value || value === 0 || value === '0' ? value : '-';
            if (item.detail.transRules) {
              item.detail.transRules.forEach((rule: any) => {
                if (rule.type === 'array-attr') {
                  let dataArr = data?.[rule.oldFieldName] || [];
                  dataArr = dataArr.map((item: any) => {
                    return item[rule.fieldName];
                  });
                  item.value = dataArr || [];
                }
              });
              console.log(item.value);
            }
          } else {
            item.value = '-';
          }
        });
      });
    } catch (err) {
      console.log(err);
      // you can report use errorHandler or other
    } finally {
      setLoading(false);
    }
  };
  const operationPopComp = ref();
  // 列表操作
  const optClick = (e: any) => {
    operationPopComp?.value?.optClick(e);
  };
  const router = useRouter();
  const back = async () => {
    router.back();
  };
  fetchCurrentData();
</script>

<script lang="ts">
  export default {
    name: 'Basic',
  };
</script>

<style scoped lang="less">
  .container {
    padding: 0 20px 20px 20px;
  }
  .actions {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    height: 60px;
    padding: 14px 20px 14px 0;
    background: var(--color-bg-2);
    // text-align: right;
    padding-left: 260px;
  }
</style>
