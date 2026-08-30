<!--
 * @Description:
 * @LastEditTime: 2023-08-16 15:39:29
 * @LastEditors: 何俊峰
 * @Author: 何俊峰
 * @Date: 2023-08-09 15:46:36
-->
<template>
  <a-tree
    ref="aTreeCom"
    v-model:checked-keys="value"
    :expand-all="true"
    :checkable="fieldData.checkable"
    :check-strictly="fieldData.checkStrictly"
    :field-names="fieldData[type]['field-names'] || fieldData['field-names']"
    :checked-strategy="fieldData['checked-strategy']"
    :data="options"
    :multiple="fieldData.multiple"
    @check="change"
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
  const aTreeCom = ref();
  value.value = props.defaultValue || [];
  console.log('props.defaultValue', props.defaultValue);

  watch(
    () => props.defaultValue,
    (val) => {
      value.value = props.defaultValue || [];
    }
  );
  const getOptions = () => {
    customRequest(props.fieldData.optionsRequest, {}).then((res) => {
      // eslint-disable-next-line no-shadow
      const itemOptions: any = props.fieldData?.options || [];
      options.value = itemOptions.concat(res || []);
      console.log('aTreeCom.value?.expandAll');
      console.log(aTreeCom.value?.expandAll);
      setTimeout(() => {
        aTreeCom.value?.expandAll(true);
      }, 100);
    });
  };
  if (props.fieldData.optionsRequest) {
    getOptions();
  } else {
    options.value = props.fieldData?.options || [];
  }
  const emit = defineEmits(['valChange']);
  // 普通组件
  const change = (fileList: any) => {
    if (props.fieldData.useName === 'a-upload') {
      console.log(fileList);
    }
    emit('valChange', {
      fieldName: props.fieldData.fieldName,
      parentField: props.fieldData[props.type].parentField,
      val: value.value,
    });
  };
</script>
