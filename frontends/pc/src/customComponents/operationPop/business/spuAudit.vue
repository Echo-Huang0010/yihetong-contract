<!--
 * @Description:
 * @LastEditTime: 2023-08-24 18:47:14
 * @LastEditors: 何俊峰
 * @Author: 何俊峰
 * @Date: 2023-03-06 19:19:20
-->
<template>
  <a-modal
    v-model:visible="visible"
    :title="content.name"
    :on-before-ok="submit"
    :ok-loading="okLoading"
  >
    <a-form
      ref="formComt"
      :model="formData"
      auto-label-width
      layout="horizontal"
    >
      <a-form-item v-if="content.customModal?.msg">
        {{ content.customModal.msg }}
      </a-form-item>
      <a-form-item
        v-for="(item, index) in newFieldList"
        :key="index"
        :label="item.label"
        :field="item.fieldName"
        :rules="item.rules"
      >
        <div style="width: 100%">
          <template
            v-if="item.useOtherName == 'timeRange' && !item[type].readOnly"
          >
            <timeRangeCom
              :field-data="item"
              :type="type"
              @val-change="valChange"
            ></timeRangeCom>
          </template>
          <uploadCom
            v-else-if="item.useName === 'a-upload' && !item[type].readOnly"
            :field-data="item"
            :type="type"
            :default-value="formData[item.fieldName]"
            @val-change="valChange"
          ></uploadCom>
          <treeCom
            v-else-if="item.useName === 'a-tree'"
            :field-data="item"
            :type="type"
            :default-value="formData[item.fieldName]"
            @val-change="valChange"
          ></treeCom>
          <treeSelectCom
            v-else-if="item.useName === 'a-tree-select'"
            :field-data="item"
            :type="type"
            :default-value="formData[item.fieldName]"
            @val-change="valChange"
          ></treeSelectCom>
          <myQuillEditor
            v-else-if="
              item.useName === 'my-quill-editor' && !item[type].readOnly
            "
            :field-data="item"
            :type="type"
            :default-value="formData[item.fieldName]"
            @val-change="valChange"
          ></myQuillEditor>
          <editCom
            v-else
            :form-data="formData"
            :field-data="item"
            :type="type"
            :default-value="formData[item.fieldName]"
            @val-change="valChange"
          ></editCom>
          <div v-if="item.tip" class="tip">
            {{ item.tip }}
          </div>
        </div>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script lang="ts" setup>
  import { ref, PropType } from 'vue';
  import { customRequest } from '@/customComponents/api/index';
  import {
    generateFieldList,
    generateFormModel,
  } from '@/customComponents/utils/index';
  import editCom from '@/customComponents/edit/index.vue';
  import uploadCom from '@/customComponents/edit/upload.vue';
  import treeCom from '@/customComponents/edit/tree.vue';
  import treeSelectCom from '@/customComponents/edit/tree-select.vue';
  import timeRangeCom from '@/customComponents/edit/timeRange.vue';
  import { ValidatedError } from '@arco-design/web-vue';

  interface formModelType {
    [x: string]: any;
  }
  const props = defineProps({
    fieldList: {
      type: Array as PropType<formModelType[]>,
      default: () => {
        return [];
      },
    },
  });

  const type = ref('');
  const visible = ref(false);
  const content = ref<formModelType>({});
  const record = ref<formModelType>({});
  const request = ref<formModelType>({});
  const formData = ref<formModelType>({});
  const newFieldList = ref<formModelType[]>([]);
  const formComt = ref();
  const okLoading = ref<boolean>(false);
  const emit = defineEmits(['getData']);

  const show = (
    data: {
      [x: string]: any;
    },
    form: formModelType
  ) => {
    okLoading.value = false;
    visible.value = true;

    content.value = data;
    record.value = form;
    type.value = data.operate;
    if (data.customModal.requestUrl) {
      request.value = data.customModal;
      console.log(data.operate);
      formData.value = generateFormModel(props?.fieldList, data.operate);
      console.log('formData.value');
      console.log(formData.value);
      newFieldList.value = generateFieldList(props.fieldList, data.operate);
      console.log(newFieldList.value);
      formComt.value.resetFields();
    }
  };
  interface InjectData {
    fieldName: string;
    parentField?: string;
    val: string;
  }
  const valChange = (data: InjectData) => {
    console.log(data);
    if (data.parentField) {
      formData.value[data.parentField][data.fieldName] = data.val;
    } else {
      formData.value[data.fieldName] = data.val;
    }
  };
  const hide = () => {
    visible.value = false;
  };
  const submit = () => {
    console.log(request.value.requestUrl);
    if (request.value.requestUrl) {
      formComt.value.validate(
        (errors: undefined | Record<string, ValidatedError>) => {
          if (!errors) {
            okLoading.value = true;
            customRequest(request.value, record.value, formData.value)
              .then((res) => {
                okLoading.value = false;
                hide();
                emit('getData');
              })
              .catch(() => {
                okLoading.value = false;
              });
          } else {
            okLoading.value = false;
          }
        }
      );
      return false;
    }
    hide();
    return false;
  };
  defineExpose({
    show,
    hide,
  });
</script>

<style lang="less" scoped>
  .msgBox {
    height: 40px;
    line-height: 40px;
  }
  .tip {
    color: #999;
    font-size: 12px;
    padding: 10px 0 0;
  }
</style>
