<!--
 * @Description:
 * @LastEditTime: 2023-03-02 16:44:03
 * @LastEditors: 何俊峰
 * @Author: 何俊峰
 * @Date: 2023-03-01 15:52:13
-->
<template>
  <template v-for="(item, index) in operateBatchList" :key="index">
    <a-upload v-if="item.operate == 'import'" class="batchItem" action="/">
      <template #upload-button>
        <a-button>批量导入</a-button>
      </template>
    </a-upload>
    <a-button v-else class="batchItem" :type="item.type" @click="click(item)">
      <template v-if="item.icon" #icon>
        <showCom
          :field-data="{
            useName: item.icon,
          }"
        ></showCom>
      </template>
      {{ item.name }}
    </a-button>
  </template>
</template>

<script lang="ts" setup>
  import showCom from '@/customComponents/show/index.vue';
  import { PropType } from 'vue';

  interface formModelType {
    [x: string]: any;
  }
  defineProps({
    operateBatchList: {
      type: Array as PropType<formModelType[]>,
      default: () => {
        return [];
      },
    },
  });

  const emit = defineEmits(['optBatchClick']);

  const click = (item: any) => {
    emit('optBatchClick', {
      operate: item,
    });
  };
</script>

<style lang="less" scoped>
  .batchItem {
    margin-right: 8px;
  }
</style>
