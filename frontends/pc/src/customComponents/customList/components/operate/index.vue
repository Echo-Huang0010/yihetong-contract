<!--
 * @Description:
 * @LastEditTime: 2023-08-02 14:47:29
 * @LastEditors: 何俊峰
 * @Author: 何俊峰
 * @Date: 2023-03-01 15:52:13
-->
<template>
  <template v-for="(item, index) in operateList">
    <a-button
      v-if="showItem(item)"
      :key="index"
      v-permission="item.permission || []"
      :type="item.type || 'text'"
      :size="item.size || 'small'"
      :status="item.status"
      :class="!item.type || item.type == 'text' ? 'padNone noMargin' : ''"
      class="marginRight"
      @click="click(item)"
    >
      {{ item.name }}
    </a-button>
  </template>
</template>

<script lang="ts" setup>
  import { PropType } from 'vue';
  import { showBut } from '@/customComponents/utils/index';

  interface formModelType {
    [x: string]: any;
  }
  const props = defineProps({
    operateList: {
      type: Array as PropType<formModelType[]>,
      default: () => {
        return [];
      },
    },
    record: {
      type: Object,
      default: () => {
        return {};
      },
    },
  });
  const emit = defineEmits(['optClick']);

  const click = (operate: any) => {
    emit('optClick', {
      operate,
      record: props.record,
    });
  };
  const showItem = (item: any) => {
    return showBut(item, props.record);
  };
</script>

<style lang="less" scoped>
  .padNone {
    padding-left: 0;
  }
  .marginRight {
    margin-right: 10px;
  }
  .noMargin {
    margin-right: 0;
  }
</style>
