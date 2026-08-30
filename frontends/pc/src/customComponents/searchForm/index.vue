<!--
 * @Description:
 * @LastEditTime: 2023-08-14 17:28:13
 * @LastEditors: 何俊峰
 * @Author: 何俊峰
 * @Date: 2023-03-01 15:52:13
-->
<template>
  <a-row class="searchForm">
    <a-col :flex="1">
      <a-form
        :model="formModel"
        :label-col-props="{ span: 6 }"
        :wrapper-col-props="{ span: 18 }"
        :auto-label-width="true"
        @submit.prevent
      >
        <div style="display: flex">
          <div class="leftBox">
            <div
              v-for="(item, index) in fieldList"
              :key="index"
              class="formItem"
              :span="8"
            >
              <a-form-item
                :field="item.fieldName"
                :label="item.label"
                :label-width="item.label ? '100px' : ''"
              >
                <div
                  :style="{
                    width: item.search.width || '200px',
                  }"
                >
                  <template v-if="item.useOtherName == 'timeRange'">
                    <timeRange
                      ref="timeRangeCom"
                      :field-data="item"
                      type="search"
                      @val-change="valChange"
                    ></timeRange>
                  </template>
                  <treeSelectCom
                    v-else-if="item.useName === 'a-tree-select'"
                    :field-data="item"
                    type="search"
                    @val-change="valChange"
                  ></treeSelectCom>
                  <editCom
                    v-else
                    :field-data="item"
                    type="search"
                    :default-value="formModel[item.fieldName]"
                    @val-change="valChange"
                    @keyup.enter="search"
                  ></editCom>
                </div>
              </a-form-item>
            </div>
          </div>
          <!-- 添加弹性空间，将按钮推到右侧 -->
          <div style="flex: 1;"></div>
          <a-space
            v-if="rightConfig.type && rightConfig.type == 1"
            direction="horizontal"
            :size="18"
            :flex="'176px'"
            align="start"
          >
            <a-button type="primary" @click="search">
              <template #icon>
                <icon-search />
              </template>
              搜索
            </a-button>
            <a-button @click="reset">
              重置条件
            </a-button>
          </a-space>
        </div>
      </a-form>
    </a-col>
    <template v-if="!rightConfig.type">
      <a-divider style="height: 84px" direction="vertical" />
      <a-col :flex="'86px'" style="text-align: right">
        <a-space direction="vertical" :size="18">
          <a-button type="primary" @click="search">
            <template #icon>
              <icon-search />
            </template>
            搜索
          </a-button>
          <a-button @click="reset">
            <template #icon>
              <icon-refresh />
            </template>
            重置
          </a-button>
        </a-space>
      </a-col>
    </template>
  </a-row>
</template>

<script lang="ts" setup name="searchForm">
  import { useI18n } from 'vue-i18n';
  import editCom from '@/customComponents/edit/index.vue';
  import timeRange from '@/customComponents/edit/timeRange.vue';
  import treeSelectCom from '@/customComponents/edit/tree-select.vue';
  import { PropType, ref } from 'vue';

  interface formModelType {
    [x: string]: any;
  }

  useI18n();

  defineProps({
    fieldList: {
      type: Array as PropType<formModelType[]>,
      default: () => {
        return [];
      },
    },
    formModel: {
      type: Object,
      default: () => {
        return {};
      },
    },
    rightConfig: {
      type: Object,
      default: () => {
        return {};
      },
    },
  });

  interface InjectData {
    fieldName: string;
    val: string;
  }
  const emit = defineEmits(['valChange', 'reset', 'search']);

  const search = () => {
    emit('search');
  };
  const timeRangeCom = ref();
  const reset = () => {
    emit('reset');
    console.log(timeRangeCom.value[0]);
    timeRangeCom?.value[0]?.clear();
  };
  const valChange = (data: InjectData) => {
    emit('valChange', data);
  };
</script>

<style lang="less" scoped>
  .leftBox {
    display: flex;
    flex-wrap: wrap;
    .formItem {
      margin-right: 20px;
    }
  }
  .searchForm {
    background: white;
    border-radius: 4px;
    padding: 24px;
  }
  :deep {
    .arco-form-item {
      margin-bottom: 0;
    }
    .arco-input-wrapper {
      background: white;
      border-color: #D4D6D9;
      border-radius: 4px;
    }
    .arco-btn{
      border-radius: 4px;
    width: 100px;
    background: white;
    }
    .arco-btn-primary {
    background: #3277FF;
     }
     .arco-btn-secondary{
      border: 1px solid #D4D6D9;
     }
  }
  
</style>
