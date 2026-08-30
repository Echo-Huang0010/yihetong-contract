<!--
 * @Description:
 * @LastEditTime: 2023-08-30 16:36:59
 * @LastEditors: 何俊峰
 * @Author: 何俊峰
 * @Date: 2023-03-01 15:52:13
-->
<template>
  <a-radio-group v-model="value" @change="change">
    <a-radio
      v-for="(item, index) in options"
      :key="index"
      :value="item.value"
      >{{ item.label }}</a-radio
    >
  </a-radio-group>
</template>

<script lang="ts" setup>
  import { ref } from 'vue';
  import { customRequest } from '@/customComponents/api/index';

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
  const options = ref<formModelType[]>([]);
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
  const getOptions = () => {
    customRequest(props.fieldData.optionsRequest, {}).then((res) => {
      // eslint-disable-next-line no-shadow
      const itemOptions: any = props.fieldData?.options || [];
      options.value = itemOptions.concat(res || []);
    });
  };
  if (props.fieldData.optionsRequest) {
    getOptions();
  } else {
    options.value = props.fieldData?.options || [];
  }
  defineExpose({
    clear,
  });
</script>

<style lang="less" scoped></style>
