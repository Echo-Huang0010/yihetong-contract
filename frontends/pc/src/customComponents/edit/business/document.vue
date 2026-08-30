<!--
 * @Description:
 * @LastEditTime: 2023-12-14 17:33:58
 * @LastEditors: 何俊峰
 * @Author: 何俊峰
 * @Date: 2023-03-01 15:52:13
-->
<template>
  <a-form-item :label="fieldData?.label" :field="fieldData?.fieldName">
    <div style="width: 100%">
      <div class="addBox">
        <a-button type="primary" @click="handleEdit({}, '新建文档')"
          >上传文档</a-button
        >
      </div>
      <div>
        <a-table :columns="columns" :data="value">
          <template #operations="{ record, rowIndex }">
            <a-button type="text" @click="handleDownload(record)"
              >下载</a-button
            >
            <a-button
              type="text"
              @click="handleEdit(record, '编辑文档', rowIndex)"
              >编辑</a-button
            >
            <a-button type="text" @click="handleDelete(rowIndex)"
              >删除</a-button
            >
          </template>
        </a-table>
      </div>
    </div>
  </a-form-item>
  <customModal
    ref="customModalCom"
    :field-list="fieldList"
    @update-form="updateForm"
  ></customModal>
</template>

<script lang="ts" setup>
  import { ref, watch } from 'vue';
  import customModal from '@/customComponents/operationPop/customModal/index.vue';

  const customModalCom = ref();
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
  const columns = [
    {
      title: '文档类型',
      dataIndex: 'doc_type',
    },
    {
      title: '文档标题',
      dataIndex: 'doc_title',
    },
    {
      title: '文档描述',
      dataIndex: 'doc_desc',
    },
    {
      title: '文件',
      dataIndex: 'doc_name',
    },
    {
      title: '文件大小',
      dataIndex: 'doc_size',
    },
    {
      title: '上传时间',
      dataIndex: 'created_at',
    },
    {
      title: '操作',
      dataIndex: 'operations',
      slotName: 'operations',
    },
  ];
  const fieldList = [
    {
      label: '文档类型',
      fieldName: 'doc_type',
      placeholder: '请选择文档类型',
      useName: 'a-select',
      upDoc: {
        sort: 1,
      },
      options: [
        {
          label: 'COA-质量检测报告',
          value: 'COA-质量检测报告',
        },
        {
          label: 'MSDS',
          value: 'MSDS',
        },
        {
          label: '工艺流程',
          value: '工艺流程',
        },
        {
          label: '证书及说明',
          value: '证书及说明',
        },
        {
          label: '其他',
          value: '其他',
        },
      ],
    },
    {
      label: '文档标题',
      fieldName: 'doc_title',
      placeholder: '请输入文档标题',
      useName: 'a-input',
      upDoc: {
        sort: 1,
      },
    },
    {
      label: '文档描述',
      fieldName: 'doc_desc',
      placeholder: '请输入文档描述',
      useName: 'a-input',
      upDoc: {
        sort: 1,
      },
    },
    {
      label: '附件',
      fieldName: 'doc_url',
      useName: 'a-upload',
      limit: 1,
      action: '/manage/common/v1/image/goods/upload',
      otherField: [
        {
          fieldName: 'doc_size',
          oldFieldName: 'size',
        },
        {
          fieldName: 'doc_name',
          oldFieldName: 'name',
        },
      ],
      upDoc: {
        isString: true,
        sort: 1,
      },
    },
    {
      label: '文档大小',
      fieldName: 'doc_size',
      useName: 'a-input',
      hidden: true,
      upDoc: {
        sort: 1,
      },
    },
    {
      label: '文档名称',
      fieldName: 'doc_name',
      useName: 'a-input',
      hidden: true,
      upDoc: {
        sort: 1,
      },
    },
    {
      label: '文档id',
      fieldName: 'goods_doc_id',
      useName: 'a-input',
      hidden: true,
      upDoc: {
        sort: 1,
      },
    },
  ];
  const unitValue = () => {
    return [];
  };
  const value = ref();
  const indexId = ref();

  value.value = (props.defaultValue as string) || unitValue();
  watch(
    () => props.defaultValue,
    (val) => {
      value.value = val;
      console.log(value.value);
    }
  );
  const emit = defineEmits(['valChange']);
  const change = () => {
    emit('valChange', {
      fieldName: props.fieldData.fieldName,
      parentField: props.fieldData[props.type].parentField,
      val: value.value,
    });
  };

  const handleDownload = (item: any) => {
    window.open(item.doc_url);
  };
  const handleEdit = (
    item: any,
    title: string,
    dataIndex?: number | undefined
  ) => {
    indexId.value = dataIndex;
    customModalCom.value.show(
      {
        name: title,
        operate: 'upDoc',
        customModal: {},
      },
      item
    );
  };
  const handleDelete = (index: any) => {
    value.value.splice(index, 1);
    change();
  };
  const updateForm = (form: any) => {
    if (indexId.value || indexId.value === 0) {
      value.value[indexId.value] = JSON.parse(JSON.stringify(form));
    } else {
      value.value.push(JSON.parse(JSON.stringify(form)));
    }
  };
</script>

<style lang="less" scoped>
  .addBox {
    text-align: right;
    line-height: 60px;
  }
</style>
