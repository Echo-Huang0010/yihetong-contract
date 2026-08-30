<!--
 * @Description:
 * @LastEditTime: 2023-12-14 19:51:10
 * @LastEditors: 何俊峰
 * @Author: 何俊峰
 * @Date: 2023-02-24 17:57:39
-->
<template>
  <div class="container">
    <Breadcrumb v-if="useType != 'detail'" :items="config.list?.path" />
    <topTab
      :tab-list="tabList"
      @search="search"
      @val-change="tabChange"
    ></topTab>
    <a-card class="general-card">
      <template v-if="searchConfig">
        <searchForm
          :form-model="formModel"
          :field-list="fieldList"
          :right-config="searchConfig"
          @reset="reset"
          @search="search"
          @val-change="valChange"
        ></searchForm>
      </template>
    <a-card style="background: white;margin-top: 20px; border: 1px solid transparent;border-radius: 4px;">
      <a-row style="margin-bottom: 16px;">
        <a-row v-if="config.list?.title">
        <div style="background: #3277FF;width: 3px;height: 15px;border-radius: 60px;margin-right: 6px;"></div>
        <span style="font-size: 16px;font-weight: 500;color: #2D3036;">{{config.list?.title}}</span>
      </a-row>
         <!-- 添加弹性空间，将按钮推到右侧 -->
         <div style="flex: 1;"></div>
          <a-space>
            <operateBatch
              :operate-batch-list="operateBatchList"
              @opt-batch-click="optBatchClick"
            ></operateBatch>
          </a-space>
        <!-- <a-col
          :span="12"
          style="display: flex; align-items: center; justify-content: end"
        >
          <a-button>
            <template #icon>
              <icon-download />
            </template>
            下载
          </a-button>
          <a-tooltip content="刷新">
            <div class="action-icon" @click="search"
              ><icon-refresh size="18"
            /></div>
          </a-tooltip>
          <a-dropdown @select="handleSelectDensity">
            <a-tooltip content="密度">
              <div class="action-icon"><icon-line-height size="18" /></div>
            </a-tooltip>
            <template #content>
              <a-doption
                v-for="item in densityList"
                :key="item.value"
                :value="item.value"
                :class="{ active: item.value === size }"
              >
                <span>{{ item.name }}</span>
              </a-doption>
            </template>
          </a-dropdown>
        </a-col> -->
      </a-row>
      <div class="tableBox" style="margin-top: 20px">
        <slot name="table-left"></slot>
        <div style="flex: 1">
          <a-table
            v-if="!config.list?.custTable"
            v-model:selectedKeys="selectedKeys"
            :row-key="config.list.rowKey || (showIndex ? 'id' : '')"
            :loading="loading"
            :pagination="pagination"
            :columns="(cloneColumns as TableColumnData[])"
            :data="renderData"
            :bordered="false"
            :size="size"
            :row-selection="rowSelection"
            @page-change="onPageChange"
          >
            <template v-if="showIndex" #index="{ rowIndex }">
              {{
                rowIndex + 1 + (pagination.current - 1) * pagination.pageSize
              }}
            </template>
            <template #common="{ record, column }">
              {{ record[column?.fieldName] || '-' }}
            </template>
            <template #multistage="{ record, column }">
              {{ getMultistageName(record, column?.fieldName) }}
            </template>
            <template #a-input="{ record, column }">
              {{ record[column?.fieldName] || '-' }}
            </template>
            <template #a-upload="{ record, column }">
              <a-space>
                <a-image
                  v-if="record[column?.fieldName]"
                  class="avater"
                  :src="record[column?.fieldName]"
                  width="50px"
                  height="50px"
                  fit="cover"
                />
              </a-space>
            </template>
            <template #a-select="{ record, column }">
              <span
                :style="getStyle(record[column?.fieldName], column.options)"
              >
                {{ getName(record[column?.fieldName], column.options) }}
              </span>
            </template>
            <template #a-trans="{ record, column }">
              <span>
                {{ getTrans(record[column?.fieldName], column) }}
              </span>
            </template>
            <template v-if="operateList.length" #operations="{ record }">
              <operate
                :record="record"
                :operate-list="operateList"
                @opt-click="optClick"
              ></operate>
            </template>
          </a-table>
        </div>
      </div>
      <slot name="table"></slot>
    </a-card>
    </a-card>
    <operation-pop
      ref="operationPopComp"
      :field-list="config?.fieldList"
      @get-data="search"
    ></operation-pop>
  </div>
</template>

<script lang="ts" setup name="customList">
  import defaultSettings from '@/config/settings.json';
  import { computed, ref, reactive, watch } from 'vue';
  import { useRouter, useRoute } from 'vue-router';
  import useLoading from '@/hooks/loading';
  import { customRequest } from '@/customComponents/api/index';
  import type { TableColumnData } from '@arco-design/web-vue/es/table/interface';
  import cloneDeep from 'lodash/cloneDeep';
  import searchForm from '@/customComponents/searchForm/index.vue';
  import topTab from '@/customComponents/topTab/index.vue';
  import operate from '@/customComponents/customList/components/operate/index.vue';
  import operateBatch from '@/customComponents/customList/components/operateBatch/index.vue';
  import operationPop from '@/customComponents/operationPop/index.vue';
  import {
    generateFieldList,
    generateFormModel,
    getUseData,
  } from '@/customComponents/utils/index';
  import { setTableSize, getTableSize } from '../utils/storage';

  const router = useRouter();

  const props = defineProps({
    config: {
      type: Object,
      default: () => {
        return {
          formModel: {},
          fieldList: [],
          search: {},
        };
      },
    },
    otherParams: {
      type: Object,
      default: () => {
        return {};
      },
    },
    useType: {
      type: String,
      default: 'list',
    },
  });
  const emit = defineEmits(['tableData']);

  type SizeProps = 'mini' | 'small' | 'medium' | 'large';
  type Column = TableColumnData & { checked?: true };
  interface TablePagination {
    current: number;
    pageSize: number;
    total?: number;
  }

  interface formModelType {
    [x: string]: any;
  }
  const selectedKeys = ref(props.config.list.selectedKeys || []);

  const rowSelection = reactive(props.config.list.rowSelection || false);
  // 初始化数据
  const generateOperateList = () => {
    return props.config.listOperates || [];
  };
  const generateOperateBatchList = () => {
    return props.config.batchOperates || [];
  };

  const { loading, setLoading } = useLoading(true);
  const renderData = ref<formModelType[]>([]);
  const formModel = ref<formModelType>(
    generateFormModel(props.config?.fieldList, 'search')
  );
  const tabForm = ref<formModelType>({});
  const fieldList = ref<formModelType[]>(
    generateFieldList(props.config?.fieldList, 'search')
  );
  const tabList = ref<formModelType[]>(props.config?.tabList);
  const searchConfig = ref<formModelType[]>(props.config?.search);
  const showIndex = ref(props.config?.list.showIndex || false);

  const operateList = ref<formModelType[]>(generateOperateList());
  console.log('operateList');
  console.log(operateList);
  const operateBatchList = ref<formModelType[]>(generateOperateBatchList());
  const cloneColumns = ref<Column[]>([]);
  const showColumns = ref<Column[]>([]);

  interface InjectData {
    fieldName: string;
    val: string;
  }
  const valChange = (data: InjectData) => {
    formModel.value[data.fieldName] = data.val;
    // eslint-disable-next-line no-console
    console.log(formModel.value);
  };
  const tabChange = (data: InjectData) => {
    tabForm.value = data;
    // eslint-disable-next-line no-console
    console.log(tabForm.value);
    search();
  };

  const size = ref<SizeProps>(getTableSize() || 'medium');

  const basePagination: TablePagination = {
    current: 1,
    pageSize: 10,
  };
  const pagination = ref<TablePagination>({
    ...basePagination,
  });
  const densityList = computed(() => [
    {
      name: '迷你',
      value: 'mini',
    },
    {
      name: '偏小',
      value: 'small',
    },
    {
      name: '中等',
      value: 'medium',
    },
    {
      name: '偏大',
      value: 'large',
    },
  ]);
  const columns = computed<TableColumnData[]>(() =>
    generateFieldList(
      props.config?.fieldList,
      'list',
      !operateList.value?.length
    )
  );
  const { query } = useRoute();
  const fetchData = async (
    params: formModelType = {
      pageNum: pagination.value.current,
      pageSize: pagination.value.pageSize,
    }
  ) => {
    setLoading(true);
    try {
      console.log('params :', params);
      console.log('query :', query);
      // eslint-disable-next-line no-restricted-syntax
      for (const key in params) {
        if (
          params[key] === undefined ||
          params[key] === null ||
          params[key] === ''
        ) {
          delete params[key];
        }
      }
      const requestParams = JSON.parse(JSON.stringify(params));
      const businessSettings = defaultSettings?.business as Record<string, any>;
      const listSize = businessSettings?.listSize;
      const listPageNum = businessSettings?.listPageNum;
      if (listSize) {
        requestParams[listSize] = requestParams.pageSize;
      }
      if (listPageNum) {
        requestParams[listPageNum] = requestParams.pageNum;
      }
      const res: any = await customRequest(props.config.list?.getList, query, {
        ...requestParams,
        ...props.otherParams,
      });
      console.log('res :', res);
      renderData.value = res.list || [];
      pagination.value.total = res.total || 0;
      emit('tableData', {
        data: renderData.value,
        total: res.total || 0,
      });
    } catch (err) {
      // you can report use errorHandler or other
    } finally {
      setLoading(false);
    }
  };

  const search = () => {
    pagination.value.current = 1;
    fetchData({
      ...basePagination,
      ...formModel.value,
      ...tabForm.value,
      pageNum: basePagination.current,
    } as unknown as formModelType);
  };
  const onPageChange = (pageNum: number) => {
    console.log(pageNum);
    pagination.value.current = pageNum;
    fetchData({ ...basePagination, pageNum });
  };

  fetchData();
  const reset = () => {
    pagination.value.current = 1;
    formModel.value = generateFormModel(props.config?.fieldList, 'search');
    fetchData();
  };

  if (props.config?.windowListener) {
    document.addEventListener('visibilitychange', function () {
      console.log(document.visibilityState);
      if (document.visibilityState === 'hidden') {
        // 执行窗口切换后的逻辑
        console.log('窗口已切换');
      } else if (document.visibilityState === 'visible') {
        // 执行窗口切换后的逻辑
        console.log('窗口已显示');
        fetchData();
      }
    });
  }

  const handleSelectDensity = (
    val: string | number | Record<string, any> | undefined,
    e: Event
  ) => {
    size.value = val as SizeProps;
    setTableSize(size.value);
  };
  const operationPopComp = ref();
  // 列表操作
  const optClick = (e: any) => {
    operationPopComp?.value?.optClick(e);
  };
  // 批量操作
  const optBatchClick = (e: any) => {
    operationPopComp?.value?.optClick({
      operate: e.operate,
      record: {
        selectedKeys: selectedKeys.value,
      },
    });
  };
  const getName = (value: any, options: any[]) => {
    let items: any = {};
    if ((value || value === 0) && options) {
      items =
        options?.find(
          (item: any) =>
            item.value === value ||
            item.value === value.toString() ||
            item.value.toString() === value
        ) || {};
    }
    return items?.label || '-';
  };
  const getMultistageName = (data: any, fieldName: any) => {
    const newdata = getUseData(fieldName, data);
    return newdata || '-';
  };
  const getStyle = (value: any, options: any[]) => {
    const items = options?.find((item: any) => item.value === value) || {};
    return items.style || {};
  };
  const getTrans = (value: any, item: any) => {
    let newVal = '';
    if (value || value === '0' || value === 0) {
      newVal = value;
      if (item.list.trans && item.list.trans === 'transPrice') {
        newVal = (value / 100).toFixed(2);
      }
      if (item.list.unit) {
        newVal += item.list.unit || '';
      }
    } else {
      newVal = value;
    }
    return newVal || '-';
  };

  watch(
    () => columns.value,
    (val) => {
      cloneColumns.value = cloneDeep(val);
      cloneColumns.value.forEach((item, index) => {
        item.checked = true;
      });
      showColumns.value = cloneDeep(cloneColumns.value);
    },
    { deep: true, immediate: true }
  );
  defineExpose({
    search,
    onPageChange,
  });
</script>

<script lang="ts">
  export default {
    name: 'CustomList',
  };
</script>

<style scoped lang="less">
  .container {
    padding: 0 20px 20px 20px;
  }
  :deep {
    .arco-pagination-item-active{
      color: #3277FF;
    }
    .arco-btn-text{
      color: #3277FF;
    }
    .arco-table-tr{
      .arco-table-th{
        background: #F6FAFF;
      }
    }
    .arco-btn-primary{
      background: #3277FF;
      border-radius: 4px;
      width: 100px;
    }
    .arco-card {
      background: #F7F9FC;
    }
    .arco-table-th {
      &:last-child {
        .arco-table-th-item-title {
          margin-left: 16px;
        }
      }
    }
    .arco-image-error {
      justify-content: normal;
    }
  }
  .action-icon {
    margin-left: 12px;
    cursor: pointer;
  }
  .active {
    color: #0960bd;
    background-color: #e3f4fc;
  }
  .setting {
    display: flex;
    align-items: center;
    width: 200px;
    .title {
      margin-left: 12px;
      cursor: pointer;
    }
  }
  .tableBox {
    display: flex;
  }
</style>
