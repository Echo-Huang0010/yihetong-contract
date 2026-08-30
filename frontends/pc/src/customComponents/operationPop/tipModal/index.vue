<!--
 * @Description:
 * @LastEditTime: 2023-06-27 17:50:14
 * @LastEditors: 何俊峰
 * @Author: 何俊峰
 * @Date: 2023-03-06 17:17:37
-->
<template>
  <a-modal
    v-model:visible="visible"
    draggable
    width="280px"
    @ok="handleOk"
    @cancel="hide"
  >
    <template #title> 提示 </template>
    <div style="text-align: center">{{ content }}</div>
  </a-modal>
</template>

<script lang="ts" setup>
  import { ref } from 'vue';
  import { customRequest } from '@/customComponents/api/index';
  import { Message } from '@arco-design/web-vue';

  const emit = defineEmits(['getData']);

  const visible = ref(false);
  const content = ref('');
  interface formModelType {
    [x: string]: any;
  }
  const record = ref<formModelType>({});
  const request = ref<formModelType>({});

  // eslint-disable-next-line no-shadow
  const show = (
    data: {
      [x: string]: any;
      msg: string;
    },
    formData: formModelType
  ) => {
    visible.value = true;

    content.value = data.msg;
    record.value = formData;
    if (data.requestUrl) {
      request.value = data;
    }
  };
  const handleOk = () => {
    if (request.value.requestUrl) {
      customRequest(request.value, record.value).then((res) => {
        visible.value = false;
        Message.success('操作成功');
        emit('getData');
      });
    } else {
      visible.value = false;
    }
  };
  const hide = () => {
    visible.value = false;
  };
  defineExpose({
    show,
    hide,
  });
</script>
