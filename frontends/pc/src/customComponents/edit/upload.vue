<!--
 * @Description:
 * @LastEditTime: 2023-12-15 16:48:28
 * @LastEditors: 何俊峰
 * @Author: 何俊峰
 * @Date: 2023-03-01 15:52:13
-->
<template>
  <div v-if="fieldData.useName === 'a-upload'" style="min-height: 88px">
    <component
      :is="fieldData.useName"
      v-if="showItem"
      :default-file-list="value"
      :action="fieldData.action ? baseUrl + fieldData.action : ''"
      :auto-upload="!!fieldData.action"
      :list-type="fieldData.listType"
      :limit="fieldData.limit || 9"
      :multiple="true"
      :show-retry-button="!!fieldData.action"
      :show-preview-button="false"
      @change="change"
      @before-upload="beforeUpload"
    ></component>
  </div>
</template>

<script lang="ts" setup>
  import { ref, watch } from 'vue';
  import { uploadFileOss } from '@/customComponents/utils/upload';
  import { Message } from '@arco-design/web-vue';

  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const props = defineProps({
    defaultValue: {
      type: [Array, String],
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
  const value = ref();
  const isString = ref(false);
  const showItem = ref(true);

  const unit = () => {
    const list = [];
    isString.value = !!props.fieldData[props.type].isString;
    if (Array.isArray(props.defaultValue)) {
      props.defaultValue?.forEach((v: any) => list.push(v));
    } else if (props.defaultValue) {
      list.push(props.defaultValue);
    }
    value.value = list.map((v: any) => {
      return {
        url: v,
      };
    });
  };
  unit();
  const emit = defineEmits(['valChange']);

  const beforeUpload = (file: any) => {
    return new Promise((resolve, reject) => {
      console.log(file);
      console.log(file.size);
      console.log((props.fieldData.fileSize || 20) * 1024 * 1024);
      if (file.size > (props.fieldData.fileSize || 20) * 1024 * 1024) {
        Message.error(`上传文件大小不能超过${props.fieldData.fileSize || 20}M`);
        reject();
      } else {
        resolve(true);
      }
    });
  };
  const change = async (fileList: any) => {
    console.log(fileList);
    if (props.fieldData.ossUpload) {
      const fileLists = fileList.map((fileItem: any) => {
        return fileItem.url;
      });
      emit('valChange', {
        fieldName: props.fieldData.fieldName,
        parentField: props.fieldData[props.type].parentField,
        val: fileLists,
      });
      const newList = [];
      // eslint-disable-next-line no-plusplus
      for (let i = 0; i < fileList.length; i++) {
        const fileItem = fileList[i];
        let path = '';
        console.log('fileItem');
        console.log(fileItem);
        if (fileItem.url?.indexOf('blob') !== -1) {
          // eslint-disable-next-line no-await-in-loop
          path = await uploadFileOss(
            `/${new Date().getTime()}_${fileItem.name}`,
            fileItem.file
          );
          console.log('path');
          console.log(path);
        } else {
          path = fileItem.url;
        }
        if (path) {
          newList.push({
            url: path,
            size: fileItem.file.size,
            name: fileItem.file.name,
            type: fileItem.file.type,
          });
        }
      }
      console.log('newList');
      console.log(newList);
      value.value = newList;
    } else {
      value.value = fileList.map((fileItem: any) => {
        if (fileItem.response?.data?.url) {
          return {
            url: fileItem.response?.data?.url,
            size: fileItem.file.size,
            name: fileItem.response?.data?.file_name,
            type: fileItem.file.type,
          };
        }
        return {
          url: fileItem.url,
          size: fileItem.file.size,
          name: fileItem.file.name,
          type: fileItem.file.type,
        };
      });
    }
    const newObj = value.value.filter(
      (v: any) => v.url?.indexOf('blob') === -1
    );

    let newValue = newObj.map((v: any) => {
      return v.url;
    });
    let newSize = newObj.map((v: any) => {
      return v.size;
    });
    let newType = newObj.map((v: any) => {
      return v.type;
    });
    let newName = newObj.map((v: any) => {
      return v.name;
    });
    if (isString.value) {
      const item = value.value[0] || {};
      newValue = item.url || '';
      newSize = item.size || '';
      newType = item.type || '';
      newName = item.name || '';
    }
    emit('valChange', {
      fieldName: props.fieldData.fieldName,
      parentField: props.fieldData[props.type].parentField,
      val: newValue,
    });
    console.log(props.fieldData);
    console.log(newSize);
    console.log(newType);
    console.log(newName);
    if (props.fieldData.otherField) {
      console.log(1111111111);
      props.fieldData.otherField.forEach((item: any) => {
        let val = newValue;
        if (item.oldFieldName === 'size') {
          val = newSize;
        }
        if (item.oldFieldName === 'type') {
          val = newType;
        }
        if (item.oldFieldName === 'name') {
          val = newName;
        }
        emit('valChange', {
          fieldName: item.fieldName,
          parentField: props.fieldData[props.type].parentField,
          val,
        });
      });
    }
    showItem.value = false;
    setTimeout(() => {
      showItem.value = true;
    }, 100);
  };
</script>

<style lang="less" scoped></style>
