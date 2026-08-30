<!--
 * @Description:
 * @LastEditTime: 2023-08-21 17:21:19
 * @LastEditors: 何俊峰
 * @Author: 何俊峰
 * @Date: 2023-03-01 15:52:13
-->
<template>
  <component
    :is="fieldData.useName"
    v-model="value"
    :mode="fieldData.mode"
    :options="options"
    :placeholder="fieldData[type]?.placeholder || fieldData.placeholder"
    :max-length="fieldData.maxlength || 0"
    :show-word-limit="fieldData.showWordLimit"
    :multiple="fieldData.multiple"
    allow-clear
    @change="change"
    @input="change"
    @clear="clear"
  ></component>
</template>

<script lang="ts" setup>
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
  const unitValue = () => {
    if (props.fieldData.useName === 'a-select' && props.fieldData.multiple) {
      return [];
    }
    return '';
  };
  const value = ref();
  const options = ref<formModelType[]>([]);
  value.value = (props.defaultValue as formModelType[]) || unitValue();
  const transVal = (val: any, type: string, reverse?: boolean) => {
    // eslint-disable-next-line @typescript-eslint/no-loss-of-precision
    if (type === 'String-Array' && val) {
      if (reverse) {
        if (typeof val === 'string') {
          return val === '' ? [] : val.split(',');
        }
      } else if (Array.isArray(val)) {
        return val.join(',');
      }
    }
    return val;
  };

  watch(
    () => props.defaultValue,
    (val) => {
      value.value = transVal(val, props.fieldData?.transVal, true);
    }
  );
  const emit = defineEmits(['valChange']);
  const change = () => {
    let val = value.value;
    val = transVal(val, props.fieldData?.transVal);
    emit('valChange', {
      fieldName: props.fieldData.fieldNames[0],
      parentField: props.fieldData.parentField,
      val: val ? val[0] || '' : '',
    });
    emit('valChange', {
      fieldName: props.fieldData.fieldNames[1],
      parentField: props.fieldData[props.type].parentField,
      val: val ? val[1] || '' : '',
    });
  };
  const clear = () => {
    value.value = [];
    change();
  };
  defineExpose({
    clear,
  });
</script>

<style lang="less" scoped></style>
