<!--
 * @Description:
 * @LastEditTime: 2023-12-15 14:02:58
 * @LastEditors: 何俊峰
 * @Author: 何俊峰
 * @Date: 2023-03-03 17:00:56
-->
<template>
  <div class="container">
    <Breadcrumb :items="config[type]?.path" />
    <a-form
      ref="formRef"
      :layout="config[type]?.layout || 'horizontal'"
      :model="formData"
      class="formBox"
      auto-label-width
    >
      <a-card class="general-card">
        <div v-for="(items, indexs) in groupList" :key="indexs">
          <div v-if="items.title" class="listTitle">{{ items.title }}</div>
          <a-row
            class="listContent"
            :gutter="80"
            :style="{
              width: items?.width || config[type].width || '600px',
            }"
          >
            <template v-for="(item, index) in items.data">
              <a-col
                v-if="!item[type]?.noShow"
                :key="index"
                :span="
                  item[type].aRow || items?.aRow || config[type].aRow || 24
                "
              >
                <businessAttrCom
                  v-if="item.useName === 'business-attr'"
                  :form-data="formData"
                  :field-data="item"
                  :type="type"
                  :default-value="formData[item.fieldName]"
                  @val-change="valChange"
                ></businessAttrCom>
                <businessSkuCom
                  v-if="item.useName === 'business-sku'"
                  :form-data="formData"
                  :field-data="item"
                  :type="type"
                  :default-value="formData[item.fieldName]"
                  @val-change="valChange"
                ></businessSkuCom>
                <businessDocumentCom
                  v-if="item.useName === 'business-document'"
                  :form-data="formData"
                  :field-data="item"
                  :type="type"
                  :default-value="formData[item.fieldName]"
                  @val-change="valChange"
                ></businessDocumentCom>
                <a-form-item
                  v-else-if="!item.hidden && !item[type].hidden"
                  :label="
                    item[type].label || item.label
                      ? (item[type].label || item.label) + ':'
                      : ''
                  "
                  :field="item.fieldName"
                  :rules="item.rules"
                >
                  <div style="width: 100%">
                    <template
                      v-if="
                        item.useOtherName == 'timeRange' && !item[type].readOnly
                      "
                    >
                      <timeRangeCom
                        :field-data="item"
                        :type="type"
                        @val-change="valChange"
                      ></timeRangeCom>
                    </template>
                    <uploadCom
                      v-else-if="
                        item.useName === 'a-upload' && !item[type].readOnly
                      "
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
                        item.useName === 'my-quill-editor' &&
                        !item[type].readOnly
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
              </a-col>
            </template>
          </a-row>
        </div>
      </a-card>
      <div
        class="actions"
        :style="{
          'padding-left': menuWidth + 40 + 'px',
          'text-align': butTextAlign,
        }"
      >
        <a-space>
          <template v-for="(item, index) in submitButList">
            <a-button
              v-if="showBut(item, formData)"
              :key="index"
              :type="item.butType || 'primary'"
              :status="item.butStatus"
              :loading="loading"
              @click="onSubmitClick(item)"
            >
              {{ item.label ? item.label : '提交' }}
            </a-button>
          </template>
          <a-button @click="back"> 返回 </a-button>
        </a-space>
      </div>
    </a-form>
    <a-modal v-model:visible="visible" @ok="handleOk" @cancel="visible = false">
      <template #title> 提示 </template>
      <div>请再次确认提交</div>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
  import { ref, computed } from 'vue';
  import { FormInstance } from '@arco-design/web-vue/es/form';
  import useLoading from '@/hooks/loading';
  import editCom from '@/customComponents/edit/index.vue';
  import uploadCom from '@/customComponents/edit/upload.vue';
  import treeCom from '@/customComponents/edit/tree.vue';
  import treeSelectCom from '@/customComponents/edit/tree-select.vue';
  import timeRangeCom from '@/customComponents/edit/timeRange.vue';
  import businessAttrCom from '@/customComponents/edit/business/attr.vue';
  import businessSkuCom from '@/customComponents/edit/business/sku.vue';
  import businessDocumentCom from '@/customComponents/edit/business/document.vue';

  // import myQuillEditor from '@/customComponents/edit/my-quill-editor.vue';
  import myRadioCom from '@/customComponents/edit/my-radio.vue';
  import myTextareaCom from '@/customComponents/edit/my-textarea.vue';

  import { useAppStore } from '@/store';

  import {
    generateFieldList,
    generateGroupList,
    generateFormModel,
    showBut,
  } from '@/customComponents/utils/index';
  import { customRequest } from '@/customComponents/api/index';
  import { useRouter, useRoute } from 'vue-router';
  import { Message } from '@arco-design/web-vue';

  // 初始化数据
  const props = defineProps({
    config: {
      type: Object,
      default: () => {
        return {
          fieldList: [],
        };
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
  const appStore = useAppStore();
  const menuWidth = computed(() => {
    return appStore.menuCollapse ? 48 : appStore.menuWidth;
  });
  const { query } = useRoute();
  console.log(props.config);
  console.log(props.type);
  const butTextAlign: any = props.config[props.type].butTextAlign || 'left';
  const submitList: any = props.config[props.type].submit || [];
  let submitButList: any = [];
  if (submitList instanceof Array) {
    submitButList = submitList;
  } else {
    submitButList.push(submitList);
  }

  const formData = ref<formModelType>({});
  const visible = ref<boolean>(false);
  const submitData = ref<formModelType>({});
  const groupList = ref<formModelType[]>([]);

  const getDetail = () => {
    if (
      props.type === 'edit' ||
      (props.type === 'detail' && props.config[props.type])
    ) {
      customRequest(props.config[props.type].getDetail, query)
        .then((res) => {
          const { data } = res;
          formData.value = generateFormModel(
            props.config?.fieldList,
            props.type,
            data
          );
          console.log('formData.value', formData.value);

          getGroupList();
        })
        .catch(() => {
          formData.value = generateFormModel(
            props.config?.fieldList,
            props.type
          );
          getGroupList();
        });
    } else {
      getGroupList();
    }
  };
  const getGroupList = () => {
    groupList.value = generateGroupList(
      generateFieldList(props.config?.fieldList, props.type),
      props.type,
      props.config?.[props.type].group
    );
  };
  getDetail();
  const formRef = ref<FormInstance>();

  const { loading, setLoading } = useLoading();

  const onSubmitClick = async (submit: any) => {
    console.log('submit', submit);
    submitData.value = submit;
    const res = await formRef.value?.validate();
    if (!res) {
      if (props.config[props.type].submit.againConfirm) {
        visible.value = true;
      } else {
        onsubmit();
      }
    }
  };
  const onsubmit = async () => {
    setLoading(true);
    console.log(formData.value);
    console.log('submit', submitData.value);
    customRequest(submitData.value, query, formData.value)
      .then((res) => {
        setLoading(false);
        Message.success('提交成功');
        back();
      })
      .catch(() => {
        setLoading(false);
      });
  };

  const handleOk = async () => {
    onsubmit();
    visible.value = false;
  };
  interface InjectData {
    [x: string]: any;
    fieldName: string;
    parentField?: string;
    val: string;
  }
  const valChange = (data: InjectData) => {
    console.log(data);
    const items = props.config?.fieldList.find((item: any) => {
      return item.fieldName === data.fieldName;
    });
    if (data.parentField) {
      formData.value[data.parentField][data.fieldName] = data.val;
    } else {
      formData.value[data.fieldName] = data.val;
    }
    console.log(items);
    if (items[props.type].change && items[props.type].change.length > 0) {
      items[props.type].change.forEach((item: any) => {
        if (item.getData) {
          customRequest(item.getData, {}, formData.value).then((res) => {
            formData.value[item.fieldName] = res;
          });
        }
      });
    }
  };

  const router = useRouter();
  const back = async () => {
    router.back();
  };
</script>

<script lang="ts">
  export default {
    name: 'Group',
  };
</script>

<style scoped lang="less">
  .container {
    padding: 0 20px 40px 20px;
    overflow: hidden;
  }

  .actions {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    height: 60px;
    padding: 14px 20px 14px 0;
    background: var(--color-bg-2);
    // text-align: right;
    padding-left: 260px;
  }
  .formBox {
    background: white;
    padding: 20px 0 0;
    .general-card {
      width: 100%;
      padding: 20px 0;
    }
  }
  .listTitle {
    width: 100%;
    height: 36px;
    color: var(--color-text-1);
    font-size: 16px;
    line-height: 36px;
    background: var(--color-neutral-1);
    padding: 0 16px;
    margin-bottom: 10px;
  }
  .listContent {
    padding: 0 16px;
  }
  .tip {
    color: #999;
    font-size: 12px;
    padding: 10px 0 0;
  }
</style>
