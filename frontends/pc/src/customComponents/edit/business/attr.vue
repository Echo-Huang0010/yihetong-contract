<!--
 * @Description:
 * @LastEditTime: 2023-09-01 13:58:40
 * @LastEditors: 何俊峰
 * @Author: 何俊峰
 * @Date: 2023-03-01 15:52:13
-->
<template>
  <a-form-item
    v-for="(item, index) in list"
    :key="index"
    :label="item?.name"
    :field="item?.code"
  >
    <div style="width: 100%">
      <a-input
        v-if="item.data_type === 'input' || item.data_type == 'region'"
        v-model="item.value"
        :max-length="item.limit || 0"
        @change="change"
      ></a-input>
      <a-select
        v-else-if="item.data_type == 'select'"
        v-model="item.value"
        :options="item.options"
        @change="change"
      ></a-select>
      <a-select
        v-else-if="item.data_type == 'multi_select'"
        v-model="item.value"
        :options="item.options"
        multiple
        @change="change"
      ></a-select>
      <a-date-picker
        v-else-if="item.data_type == 'date'"
        v-model="item.value"
        @change="change"
      />
      <a-textarea
        v-else-if="item.data_type == 'text'"
        v-model="item.value"
        :max-length="item.limit || 0"
        @change="change"
      />
      <a-input-number
        v-else-if="item.data_type == 'number'"
        v-model="item.value"
        :max-length="item.limit || 0"
        @change="change"
      />
    </div>
  </a-form-item>
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
    return [];
  };
  const value = ref();
  const list = ref<formModelType[]>([]);
  value.value = (props.defaultValue as string) || unitValue();
  watch(
    () => props.defaultValue,
    (val) => {
      value.value = val;
    }
  );
  const getList = () => {
    if (props.formData.cat_id) {
      customRequest({
        requestUrl: '/manage/pms/v1/attr',
        requestParams: ['cat_id'],
        requestType: 'get',
        requestResult: {
          data: 'data.data',
        },
        bodyParams: {
          cat_id: props.formData.cat_id,
          type: 'spu_type',
        },
      }).then((res) => {
        list.value = res.map((item: any) => {
          const itemValue = value.value.find(
            (v: any) => v.attr_id === item.attr_id
          );
          if (itemValue) {
            item.value = itemValue.attr_value;
          } else {
            item.value = item.default_value || '';
          }
          if (
            item.data_type === 'select' ||
            item.data_type === 'multi_select'
          ) {
            const options = item.attr_value ? item.attr_value.split('\n') : [];
            // eslint-disable-next-line no-shadow
            item.options = options.map((item: string) => {
              return {
                label: item,
                value: item,
              };
            });
            console.log('item.options');
            console.log(11111222222);
            console.log(item.options);
          }
          return item;
        });
      });
    }
  };
  watch(
    () => props.formData.cat_id,
    (val) => {
      getList();
    }
  );

  getList();
  const emit = defineEmits(['valChange']);
  const change = () => {
    const val = list.value.map((item: any) => {
      return {
        attr_id: item.attr_id,
        attr_value: item.value,
      };
    });
    emit('valChange', {
      fieldName: props.fieldData.fieldName,
      parentField: props.fieldData[props.type].parentField,
      val,
    });
  };
</script>

<style lang="less" scoped></style>
