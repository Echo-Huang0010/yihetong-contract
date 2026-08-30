<!--
 * @Description:
 * @LastEditTime: 2023-12-15 14:03:04
 * @LastEditors: 何俊峰
 * @Author: 何俊峰
 * @Date: 2023-03-06 19:19:20
-->
<template>
  <a-modal
    v-model:visible="visible"
    :title="content.name"
    :on-before-ok="onSubmitClick"
    :ok-loading="okLoading"
    draggable
  >
    <a-form
      v-if="visible"
      ref="formComt"
      :model="formData"
      auto-label-width
      layout="horizontal"
    >
      <a-form-item v-if="content.customModal?.msg">
        {{ msgText }}
      </a-form-item>
      <template v-for="(item, index) in newFieldList" :key="index">
        <a-form-item
          v-if="!item.hidden && !item[type].hidden"
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
            <myRadioCom
              v-else-if="item.useName === 'a-radio'"
              :field-data="item"
              :type="type"
              :default-value="formData[item.fieldName]"
              @val-change="valChange"
            ></myRadioCom>
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
            <myTextareaCom
              v-else-if="item.useName === 'my-textarea'"
              :field-data="item"
              :type="type"
              :default-value="formData[item.fieldName]"
              @val-change="valChange"
            ></myTextareaCom>
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
      </template>
    </a-form>
    <a-modal
      v-model:visible="visibleTow"
      @ok="handleOk"
      @cancel="visibleTow = false"
    >
      <template #title> 提示 </template>
      <div>请再次确认提交</div>
    </a-modal>
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
  import { ValidatedError, Message } from '@arco-design/web-vue';
  // import myQuillEditor from '@/customComponents/edit/my-quill-editor.vue';
  import myRadioCom from '@/customComponents/edit/my-radio.vue';
  import myTextareaCom from '@/customComponents/edit/my-textarea.vue';

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
  const visibleTow = ref(false);

  const content = ref<formModelType>({});
  const record = ref<formModelType>({});
  const request = ref<formModelType>({});
  const formData = ref<formModelType>({});
  const newFieldList = ref<formModelType[]>([]);
  const formComt = ref();
  const okLoading = ref<boolean>(false);
  const msgText = ref('');
  const emit = defineEmits(['getData', 'updateForm']);

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
    }
    console.log(data.operate);
    console.log(form);
    const formItem = form.selectedKeys ? undefined : form;
    formData.value = generateFormModel(
      props?.fieldList,
      data.operate,
      formItem
    );
    let msg = data.customModal.msg || '';
    if (data.customModal.msgParams) {
      data.customModal.msgParams.forEach((element: any) => {
        msg = msg.replace(`{${element}}`, form[element]);
      });
    }
    msgText.value = msg;
    newFieldList.value = generateFieldList(
      props.fieldList,
      data.operate,
      !!formItem
    );
    formComt.value.resetFields();
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
    console.log(formData.value);
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
                Message.success(`${content.value.name}成功`);
              })
              .catch(() => {
                okLoading.value = false;
              });
          }
        }
      );
      return false;
    }
    formComt.value.validate(
      (errors: undefined | Record<string, ValidatedError>) => {
        if (!errors) {
          emit('updateForm', formData.value);
        } else {
          okLoading.value = false;
        }
      }
    );

    hide();
    return false;
  };
  const onSubmitClick = async () => {
    const res = await formComt.value?.validate();
    if (!res) {
      if (request.value.againConfirm) {
        visibleTow.value = true;
      } else {
        submit();
      }
    }
    return false;
  };
  const handleOk = async () => {
    submit();
    visibleTow.value = false;
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
