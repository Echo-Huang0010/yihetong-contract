<!--
 * @Description:
 * @LastEditTime: 2023-12-14 14:01:30
 * @LastEditors: 何俊峰
 * @Author: 何俊峰
 * @Date: 2023-03-01 15:52:13
-->
<template>
  <component
    :is="fieldData.useName"
    v-if="fieldData[type]?.readOnly"
    v-model="comValue"
    :disabled="true"
  >
  </component>
  <component
    :is="fieldData.useName"
    v-else
    v-model="value"
    :options="options"
    :multiple="fieldData.multiple"
    :placeholder="fieldData[type]?.placeholder || fieldData.placeholder"
    :max-length="fieldData.maxlength || 0"
    :show-word-limit="fieldData.showWordLimit"
    :precision="fieldData.precision"
    :min="fieldData.min"
    :max="fieldData.max"
    :step="fieldData.step"
    :show-time="fieldData.showTime"
    :checked-value="fieldData.checkedValue"
    :unchecked-value="fieldData.uncheckedValue"
    :list-type="fieldData.listType"
    allow-clear
    allow-search
    @change="change"
    @input="change"
    @clear="clear"
  ></component>
</template>

<script lang="ts" setup>
  import { ref, watch, computed } from 'vue';
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
    formData: {
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
  value.value =
    // eslint-disable-next-line eqeqeq
    props.defaultValue == '0'
      ? props.defaultValue
      : (props.defaultValue as string) || unitValue();
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

  const comValue = ref('');
  watch(
    () => props.defaultValue,
    (val) => {
      value.value = transVal(val, props.fieldData?.transVal, true);
      if (!props.fieldData[props.type]?.sourcesComputed) {
        comValue.value = props.defaultValue;
      }
    }
  );
  // eslint-disable-next-line vue/no-setup-props-destructure
  comValue.value = props.defaultValue;
  if (props.fieldData[props.type]?.sourcesComputed) {
    const sourcesEvent = () => {
      let sourcesComputed = props.fieldData[props.type]?.sourcesComputed;
      props.fieldData[props.type]?.computFieldList.forEach((item: string) => {
        sourcesComputed = sourcesComputed.replace(
          `{${item}}`,
          props.formData[item] || 0
        );
      });
      // eslint-disable-next-line no-eval
      comValue.value = eval(sourcesComputed);
    };
    watch(
      () => props.formData,
      (val) => {
        sourcesEvent();
      },
      { deep: true, immediate: true }
    );
  }
  const emit = defineEmits(['valChange']);
  const change = () => {
    let val = value.value;
    val = transVal(val, props.fieldData?.transVal);
    emit('valChange', {
      fieldName: props.fieldData.fieldName,
      parentField: props.fieldData[props.type].parentField,
      val,
    });
    if (props.fieldData[props.type].upOther) {
      const obj = options.value.find((item: any) => item.value === val);
      props.fieldData[props.type].upOther.forEach((item: any) => {
        emit('valChange', {
          fieldName: item.fieldName,
          parentField: '',
          val: obj?.[item.oldFieldName] || '',
        });
      });
    }
  };
  const clear = () => {
    value.value = '';
    change();
  };
  const getOptions = () => {
    if (props.fieldData.optionsRequest.needForm) {
      let isHave = true;
      props.fieldData.optionsRequest.requestParams?.forEach((item: string) => {
        if (!props.formData[item]) {
          isHave = false;
        }
      });
      if (!isHave) {
        return;
      }
    }
    customRequest(props.fieldData.optionsRequest, props.formData).then(
      (res) => {
        // eslint-disable-next-line no-shadow
        const itemOptions: any = props.fieldData?.options || [];
        options.value = itemOptions.concat(res || []);
      }
    );
  };
  if (props.fieldData.optionsRequest) {
    getOptions();
    console.log(1111111111);
    if (props.fieldData.optionsRequest.needForm) {
      props.fieldData.optionsRequest.requestParams?.forEach((item: string) => {
        watch(
          () => props.formData[item],
          (val) => {
            getOptions();
          },
          { deep: true, immediate: true }
        );
      });
    }
  } else {
    options.value = props.fieldData?.options || [];
  }
</script>
