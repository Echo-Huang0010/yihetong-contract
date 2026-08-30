<!--
 * @Description:
 * @LastEditTime: 2023-08-28 14:44:14
 * @LastEditors: 何俊峰
 * @Author: 何俊峰
 * @Date: 2023-03-06 11:01:48
-->
<template>
  <div class="item-container">
    <a-space :size="16" direction="vertical" fill>
      <a-descriptions
        v-for="(item, idx) in fieldList"
        :key="idx"
        style="margin-top: 20px"
        :label-style="{
          textAlign: 'right',
          width: '100px',
          paddingRight: '10px',
          color: 'rgb(var(--gray-8))',
        }"
        :value-style="{ width: item.width || '400px' }"
        :title="item.title"
        :data="item.data"
        :column="item.column || 1"
        size="large"
      >
        <template #label="{ label, data }">
          <span>{{ data.detail.label || label }}：</span>
        </template>
        <template #value="{ value, data }">
          <a-skeleton v-if="loading" :animation="true">
            <a-skeleton-line :widths="['100px']" :rows="1" />
          </a-skeleton>
          <span v-else>
            <template v-if="data.useName == 'a-upload'">
              <template v-if="value">
                <a-image
                  v-if="!!data.detail.isString"
                  style="min-width: 200px; min-height: 200px"
                  :src="value"
                  show-loader
                />
                <div v-else class="imgBox">
                  <a-image
                    v-for="(item, index) in value"
                    :key="index"
                    show-loader
                    class="imgItem"
                    style="min-width: 200px; min-height: 200px"
                    :src="item"
                  />
                </div>
              </template>
              <template v-else>-</template>
            </template>
            <template v-else-if="data.useName === 'a-tree'">
              <treeCom
                :field-data="data"
                type="detail"
                :default-value="value"
              ></treeCom>
            </template>
            <div v-else-if="data.useName == 'my-quill-editor'">
              <div class="editorBox" v-html="value"></div>
            </div>
            <span
              v-else-if="
                data.useName == 'a-select' || data.useName == 'a-radio-group'
              "
              :style="getStyle(value, data.options)"
            >
              {{ getName(value, data.options) }}
            </span>
            <template v-else-if="data.detail.show">
              <template v-if="data.detail.show.type == 'Array'">
                {{
                  value && value.length
                    ? value
                        ?.map((items: any) => {
                          return items[data.detail.show.showField] || '-';
                        })
                        .join(',')
                    : '-'
                }}
              </template>
            </template>
            <template v-else>
              {{ value || '-' }}
            </template>
          </span>
        </template>
      </a-descriptions>
    </a-space>
  </div>
</template>

<script lang="ts" setup>
  import treeCom from '@/customComponents/edit/tree.vue';
  import { PropType } from 'vue';

  interface formModelType {
    [x: string]: any;
  }

  defineProps({
    fieldList: {
      type: Array as PropType<formModelType>,
      required: true,
    },
    loading: {
      type: Boolean,
      default: false,
    },
  });
  const getName = (value: any, options: any[]) => {
    console.log('value', value);
    console.log('options', options);
    const items =
      options?.find(
        (item: any) => item.value === value || item.value.toString() === value
      ) || {};
    return items.label || '-';
  };
  const getStyle = (value: any, options: any[]) => {
    const items = options?.find((item: any) => item.value === value) || {};
    return items.style || {};
  };
</script>

<style scoped lang="less">
  .item-container {
    padding-top: 20px;
    :deep(.arco-descriptions-item-label) {
      font-weight: normal;
      vertical-align: baseline;
    }
    :deep(.arco-descriptions-title) {
      background: var(--color-neutral-2);
      padding: 10px 16px;
    }
    :deep(.arco-descriptions-body) {
      padding: 0 16px;
    }
    .imgBox {
      .imgItem {
        margin-right: 10px;
        margin-bottom: 10px;
      }
    }
    .editorBox {
      border-radius: 4px;
      background: var(--color-neutral-1);
      padding: 10px;
    }
  }
</style>
