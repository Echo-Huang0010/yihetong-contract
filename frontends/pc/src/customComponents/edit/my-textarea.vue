<!--
 * @Description:
 * @LastEditTime: 2023-12-14 14:36:02
 * @LastEditors: 何俊峰
 * @Author: 何俊峰
 * @Date: 2023-03-01 15:52:13
-->
<template>
  <div class="textarea">
    <div class="textareaBox">
      <textarea
        v-model="value"
        :placeholder="fieldData[type]?.placeholder || fieldData.placeholder"
        :maxlength="fieldData.maxlength || 0"
        @change="change"
      ></textarea>
    </div>
    <div
      v-if="fieldData.showWordLimit && fieldData.maxlength"
      class="wordLimit"
    >
      {{ value.length }}/{{ fieldData.maxlength }}
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { ref } from 'vue';

  const props = defineProps({
    defaultValue: {
      type: String,
      default: '',
    },
    fieldData: {
      type: Object,
      default: () => {
        return {};
      },
    },
    type: {
      type: String,
      default: 'add',
    },
  });
  interface formModelType {
    [x: string]: any;
  }
  const unitValue = () => {
    return '';
  };
  const value = ref('');
  value.value = props.defaultValue || unitValue();
  const emit = defineEmits(['valChange']);
  const change = () => {
    emit('valChange', {
      fieldName: props.fieldData.fieldName,
      parentField: props.fieldData.parentField,
      val: value.value,
    });
  };
  const clear = () => {
    value.value = '';
    change();
  };
  defineExpose({
    clear,
  });
</script>

<style lang="less" scoped>
  .textareaBox {
    width: 100%;
    display: flex;
    textarea {
      width: 100%;
      border: 0;
      padding: 5px 12px;
      background: var(--color-fill-2);
      line-height: 1.5715;
      outline: none;
      border: 1px solid transparent;
      border-radius: 2px;
      &:focus {
        border: 1px solid rgb(var(--primary-6));
      }
      &::-webkit-input-placeholder {
        color: #86909c;
        font-size: 14px;
      }
      &:-moz-placeholder {
        color: #86909c;
        font-size: 14px;
      }
      &::-moz-placeholder {
        color: #86909c;
        font-size: 14px;
      }
      &:-ms-input-placeholder {
        color: #86909c;
        font-size: 14px;
      }
    }
  }
  .wordLimit {
    text-align: right;
    color: var(--color-text-3);
    font-size: 12px;
  }
</style>
