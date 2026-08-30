<!--
 * @Description:
 * @LastEditTime: 2023-08-30 16:30:47
 * @LastEditors: 何俊峰
 * @Author: 何俊峰
 * @Date: 2023-03-01 15:52:13
-->
<template>
  <div>
    <template v-if="formData.cat_id">
      <template v-if="list.length">
        <a-form-item label="SKU 关键属性范围">
          <a-select
            v-model="showList"
            multiple
            style="width: 300px"
            @change="resetColumns()"
          >
            <a-option
              v-for="(item, index) in list"
              :key="index"
              :value="item?.attr_id"
              >{{ item.name }}</a-option
            >
          </a-select>
        </a-form-item>
        <div v-if="showList.length" class="keyBox">
          <div class="label">SKU 关键属性</div>
          <div v-for="(item, index) in list" :key="index">
            <div v-if="showList.indexOf(item.attr_id) !== -1" class="keyList">
              <div class="formItemBox">
                <div class="keyLabel">{{ item?.name }}</div>
                <div class="leftBox">
                  <a-select v-model="item.value">
                    <a-option
                      v-for="(items, indexs) in item.options"
                      :key="indexs"
                      :value="items.value"
                      >{{ items.label }}</a-option
                    >
                    <a-option value="custom">自定义属性</a-option>
                  </a-select>
                  <a-input
                    v-if="item.value == 'custom'"
                    v-model="item.customValue"
                    style="margin-top: 10px"
                    :max-length="item.limit || 0"
                  ></a-input>
                  <div class="tagBox">
                    <a-tag
                      v-for="(items, indexs) in item.list"
                      :key="indexs"
                      class="tagItem"
                      closable
                      @close="handleRemove(item, indexs)"
                      >{{ items.attr_value }}</a-tag
                    >
                  </div>
                </div>
                <div class="rightBox">
                  <a-button type="text" @click="addField(item)"
                    >确认添加</a-button
                  >
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
      <div v-else class="nocat"> 此分类没有设置有效的 SKU 关键属性 </div>
      <div v-if="unitList.length == 0" class="nocat">
        当前分类未配置有效的计量单位
      </div>
    </template>
    <div v-else class="nocat"> 请选商品分类 </div>
    <a-table :columns="useColumns" :data="value" scroll-x>
      <template #image="{ rowIndex }">
        <upload
          :field-data="imgFieldData"
          type="add"
          @val-change="imgChange($event, rowIndex)"
        ></upload>
      </template>
      <template #supplier_code="{ rowIndex }">
        <div class="inputBox">
          <div style="width: 130px; line-height: 32px">{{
            value[rowIndex].sku_code
          }}</div>
          <a-input
            v-model="value[rowIndex].supplier_code"
            style="width: 100px"
            @change="change"
          />
        </div>
      </template>
      <template #selling_price="{ rowIndex }">
        <div class="inputBox">
          <a-input-number
            v-model="value[rowIndex].selling_price"
            style="width: 140px"
            placeholder="送货价"
            @change="change"
          />
          <a-select
            v-model="value[rowIndex].currency"
            style="width: 140px; margin-left: 10px"
            placeholder="货币单位"
            @change="change"
          >
            <a-option value="CNY">CNY(人民币)</a-option>
            <a-option value="USD">USD(美元)</a-option>
          </a-select>
        </div>
      </template>
      <template #unit_detail_id="{ rowIndex }">
        <div class="inputBox">
          <a-select
            v-model="value[rowIndex].unit_detail_id"
            style="width: 140px; margin-left: 10px"
            placeholder="货币单位"
            @change="change"
          >
            <a-option
              v-for="(item, index) in unitList"
              :key="index"
              :value="item.unit_detail_id"
              >{{ item.unit_value }}</a-option
            >
          </a-select>
        </div>
      </template>
      <template #lead_time="{ rowIndex }">
        <div class="inputBox">
          <a-input-number
            v-model="value[rowIndex].lead_time"
            style="width: 140px"
            placeholder="备货期"
            @change="change"
          />
          <a-select
            v-model="value[rowIndex].lead_time_unit"
            style="width: 140px; margin-left: 10px"
            placeholder="单位"
            @change="change"
          >
            <a-option value="天">天</a-option>
            <a-option value="周">周</a-option>
          </a-select>
        </div>
      </template>

      <template #attrs="{ record, column }">
        <div style="width: 120px">
          {{ getValue(record, column) }}
        </div>
      </template>
      <template #selectText="{ record, column }">
        <div style="width: 120px">
          {{ getText(record[column.dataIndex], column.options) }}
        </div>
      </template>
      <template #input="{ rowIndex, column }">
        <a-input v-model="value[rowIndex][column.dataIndex]" />
      </template>
      <template #select="{ rowIndex, column }">
        <a-select
          v-model="value[rowIndex][column.dataIndex]"
          style="width: 120px"
          :options="column.options"
          :multiple="column.multiple"
        >
        </a-select>
      </template>
      <template #number="{ rowIndex, column }">
        <a-input-number
          v-model="value[rowIndex][column.dataIndex]"
          :max-length="column.limit || 0"
          style="width: 100px"
          @change="change"
        />
      </template>
    </a-table>
  </div>
</template>

<script lang="ts" setup>
  import { ref, watch, computed, Ref } from 'vue';
  import { customRequest } from '@/customComponents/api/index';
  import upload from '@/customComponents/edit/upload.vue';

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

  const columns = [
    {
      title: '图片',
      dataIndex: 'image',
      fixed: 'left',
      slotName: 'image',
    },
    {
      title: 'sku-Id',
      dataIndex: 'sku_id',
      fixed: 'left',
    },
    {
      title: '货号（平台）与供应商货号',
      dataIndex: 'supplier_code',
      slotName: 'supplier_code',
    },
    {
      title: '送货价与货币单位',
      dataIndex: 'selling_price',
      slotName: 'selling_price',
    },
    {
      title: '计量单位',
      dataIndex: 'unit_detail_id',
      slotName: 'unit_detail_id',
    },
    {
      title: '库存',
      dataIndex: 'stock',
      slotName: 'number',
    },
    {
      title: '起订量',
      dataIndex: 'minimum',
      slotName: 'number',
    },
    {
      title: '备货期',
      dataIndex: 'lead_time',
      slotName: 'lead_time',
    },
    {
      title: '交易方式',
      dataIndex: 'sell_type',
      slotName: 'select',
      options: [
        {
          label: '仅支持询价',
          value: '1',
        },
        {
          label: '支持询价和购买',
          value: '2',
        },
      ],
    },
    {
      title: 'SKU状态',
      dataIndex: 'status',
      slotName: 'selectText',
      options: [
        {
          label: '待发布',
          value: '0',
        },
      ],
    },
  ];

  let useColumns = JSON.parse(JSON.stringify(columns));
  interface formModelType {
    [x: string]: any;
  }
  const unitValue = () => {
    return [];
  };
  const value = ref();
  const showList = ref<any[]>([]);

  const list = ref<formModelType[]>([]);
  const unitList = ref<formModelType[]>([]);

  const emit = defineEmits(['valChange']);
  const change = () => {
    const val = value.value;
    emit('valChange', {
      fieldName: props.fieldData.fieldName,
      parentField: props.fieldData[props.type].parentField,
      val,
    });
  };
  const randomString = (len: number) => {
    len = len || 32;
    const $chars =
      'ABCDEFGHJKMNPQRSTWXYZ12345678'; /** **默认去掉了容易混淆的字符oOLl,9gq,Vv,Uu,I1*** */
    const maxPos = $chars.length;
    let pwd = '';
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < len; i++) {
      pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
    }
    return pwd;
  };
  const imgFieldData = {
    label: '商品图片',
    fieldName: 'image',
    listType: 'picture-card',
    useName: 'a-upload',
    limit: 1,
    action: '/manage/common/v1/image/goods/upload',
    add: {
      isString: true,
    },
  };
  const baseDataItem = ref<formModelType>({
    sort_order: '',
    sku_code: '',
    supplier_code: '',
    cost_price: '',
    selling_price: '',
    currency: '',
    unit_detail_id: '',
    lead_time: '',
    lead_time_unit: '',
    minimum: '',
    origin_country: '',
    shipping_place: '',
    stock: '',
    sell_type: '',
    attrs: [],
    image: '',
    status: 0,
  });
  value.value = props.defaultValue || unitValue();
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
          with_parent_cat_id: props.formData.cat_id,
          type: 'sku_key_type',
        },
      }).then((res) => {
        list.value = res.map((item: any) => {
          item.value = item.default_value || '';
          item.customValue = '';
          item.list = [];
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
      customRequest({
        requestUrl: '/manage/pms/v1/unit',
        requestParams: ['cat_id'],
        requestType: 'get',
        requestResult: {
          data: 'data.data',
        },
        bodyParams: {
          with_parent_cat_id: props.formData.cat_id,
          status: 1,
          page: 1,
          page_size: 100,
        },
      }).then((res) => {
        unitList.value = res[0]?.detail || [];
        console.log('unitList.value111111111111111');
        console.log(unitList.value);
      });
    }
  };
  watch(
    () => props.formData.cat_id,
    (_val) => {
      getList();
    }
  );
  const imgChange = (e: any, index: any) => {
    console.log('imgChange');
    console.log(e);
    console.log(index);
    value.value[index][e.fieldName] = e.val;
    change();
  };
  const getValue = (record: { attrs: any[] }, column: { attr_id: any }) => {
    // eslint-disable-next-line array-callback-return, consistent-return
    const items = record.attrs.find((item: any) => {
      if (item.attr_id === column.attr_id) {
        return item.attr_id === column.attr_id;
      }
    });
    return items.attr_value;
  };
  const getText = (val: any, options: any[]) => {
    let items: any = {};
    if ((val || val === 0) && options) {
      items =
        options?.find(
          (item: any) =>
            item.value === val ||
            item.value === val.toString() ||
            item.value.toString() === val
        ) || {};
    }
    return items?.label || '-';
  };
  // eslint-disable-next-line no-shadow
  const getOrg = (list: any[], num: number) => {
    let newList = [];
    let itemNum = num;
    if (list[num]) {
      newList = list[num].list;
    }
    // eslint-disable-next-line no-plusplus
    itemNum++;
    if (list[itemNum]) {
      const childList = getOrg(list, itemNum);
      newList.forEach((item: any) => {
        item.children = JSON.parse(JSON.stringify(childList));
      });
    }
    return newList;
  };
  // eslint-disable-next-line no-shadow
  const getOrgList = (list: any[], parentList: any[]) => {
    list.forEach((item: any) => {
      const newItem = parentList.concat([
        {
          attr_id: item.attr_id,
          attr_value: item.attr_value,
        },
      ]);
      if (item.children) {
        getOrgList(item.children, newItem);
      } else {
        const obj = JSON.parse(JSON.stringify(baseDataItem.value));
        obj.sku_code = `SC_0_${randomString(8)}`;
        obj.attrs = JSON.parse(JSON.stringify(newItem));
        value.value.push(obj);
      }
    });
  };
  const resetData = () => {
    value.value = [];
    const newList = list.value.filter((item: any) => {
      return showList.value.indexOf(item.attr_id) !== -1;
    });
    const newList1 = newList.filter((item: any) => {
      return item.list.length;
    });
    if (newList1.length === newList.length) {
      let org: any[] = [];
      org = getOrg(newList1, 0);
      getOrgList(org, []);
    }
    change();
  };
  const resetColumns = () => {
    resetData();
    const newList = list.value.filter((item: any) => {
      return showList.value.indexOf(item.attr_id) !== -1;
    });
    useColumns = JSON.parse(JSON.stringify(columns));
    newList.forEach((item) => {
      useColumns.splice(-7, 0, {
        title: item.name,
        attr_id: item.attr_id,
        slotName: `attrs`,
        dataIndex: `attrs_${item.attr_id}`,
      });
    });
    console.log(useColumns);
  };
  const handleRemove = (item: any, indexs: any) => {
    item.list.splice(indexs, 1);
    resetData();
  };
  const addField = (item: any) => {
    const itemValue = item.value === 'custom' ? item.customValue : item.value;
    if (itemValue) {
      const obj = item.list.find((items: any) => {
        return itemValue === items.attr_value;
      });
      if (!obj) {
        item.list.push({
          attr_value: itemValue,
          attr_id: item.attr_id,
          data_type: item.data_type,
        });
      }
    }
    resetData();
  };
</script>

<style lang="less" scoped>
  .nocat {
    color: red;
    border: 1px solid red;
    line-height: 46px;
    text-align: center;
    font-size: 16px;
  }
  .tagBox {
    margin-top: 10px;
    margin-bottom: 10px;
    .tagItem {
      margin-right: 10px;
    }
  }
  .keyBox {
    .label {
      line-height: 46px;
    }
    .keyList {
      .formItemBox {
        display: flex;
        .keyLabel {
          width: 160px;
          margin-right: 20px;
          text-align: right;
          line-height: 32px;
        }
        .leftBox {
          width: 200px;
          margin-right: 10px;
        }
      }
    }
  }
  .inputBox {
    display: flex;
  }
</style>
