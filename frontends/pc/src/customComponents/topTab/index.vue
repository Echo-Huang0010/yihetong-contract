<!--
 * @Description:
 * @LastEditTime: 2024-01-04 17:29:04
 * @LastEditors: wudi
 * @Author: 何俊峰
 * @Date: 2023-03-01 15:52:13
-->
<template>
  <div
    v-if="tabList && tabList.length"
    class="tabBox"
    :style="{ background: isDark ? '#202021' : '#fff' }"
  >
    <a-tabs :default-active-tab="0"  @tab-click="tabClick">
      <a-tab-pane
        v-for="(item, index) in tabList"
        :key="index"
        :title="item.label"
      ></a-tab-pane>
    </a-tabs>
  </div>
</template>

<script lang="ts" setup name="searchForm">
  import { PropType } from 'vue';
  import useThemes from '@/hooks/themes';

  interface formModelType {
    [x: string]: any;
  }

  const props = defineProps({
    tabList: {
      type: Array as PropType<formModelType[]>,
      default: () => {
        return [];
      },
    },
  });
  const emit = defineEmits(['valChange']);

  const tabClick = (key: string | number) => {
    console.log(key);
    emit('valChange', props.tabList[key].value);
  };
  const { isDark } = useThemes();
</script>

<style lang="less" scoped>
  .tabBox {
    // background: white;
    padding: 10px 10px 0 10px;
  }
  :deep {
    .arco-tabs-content {
      padding: 0;
    }
    .arco-tabs-nav-ink{
      background: #3277FF;
    }
    .arco-tabs-tab-active{
      font-size: 16px;
      font-weight: 500;
      color: #2D3036;
    }
  }
</style>
