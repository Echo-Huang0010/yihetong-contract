<!--
 * @Description:
 * @LastEditTime: 2023-08-25 14:26:11
 * @LastEditors: 何俊峰
 * @Author: 何俊峰
 * @Date: 2023-08-09 15:46:36
-->
<template>
  <a-tree-select
    v-model="value"
    :default-expanded-keys="value"
    :checkable="fieldData.checkable"
    :check-strictly="fieldData.checkStrictly"
    :field-names="fieldData['field-names']"
    :checked-strategy="fieldData['checked-strategy']"
    :data="options"
    :multiple="fieldData.multiple"
    allow-clear
    @change="change"
    @clear="clear"
  />
</template>

<script lang="ts" setup>
  import { customRequest } from '@/customComponents/api/index';
  import { ref, watch } from 'vue';

  const props = defineProps({
    defaultValue: {
      type: Array,
      default: () => {
        return [];
      },
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
  const value = ref();
  const options = ref<formModelType[]>([]);
  value.value = props.defaultValue || [];
  console.log('tree-select：props.defaultValue', props.defaultValue);

  watch(
    () => props.defaultValue,
    (val) => {
      console.log(111111111111111);
      console.log('tree-select：props.defaultValue', props.defaultValue);
      value.value = props.defaultValue || [];
    }
  );
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
  const emit = defineEmits(['valChange']);
  // 普通组件
  const change = () => {
    emit('valChange', {
      fieldName: props.fieldData.fieldName,
      parentField: props.fieldData[props.type].parentField,
      val: value.value,
    });
  };
  const clear = () => {
    value.value = [];
    change();
  };
</script>
