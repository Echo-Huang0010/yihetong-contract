/* eslint-disable no-shadow */
/*
 * @Description:
 * @LastEditTime: 2023-12-13 16:06:30
 * @LastEditors: 何俊峰
 * @Author: 何俊峰
 * @Date: 2023-03-03 18:55:11
 */

import commonData from '@/customJson/common/options.json';
import { ref } from 'vue';
import validate from './validate';

const commonDataRef = ref(commonData);

interface commonList {
  [index: number]: any;
}
interface formModelType {
  [x: string]: any | commonList;
}
// 获取动态字段列表
const generateFieldList = (
  fieldListOld: formModelType[],
  key: string,
  noOpt?: boolean
) => {
  let fieldList = JSON.parse(JSON.stringify(fieldListOld));

  fieldList = fieldList.filter((item: formModelType) => {
    return item[key];
  });
  fieldList = fieldList.sort((a: formModelType, b: formModelType) => {
    return a[key].sort - b[key].sort;
  });
  // 列表特殊处理
  if (key === 'list') {
    fieldList.forEach((item: formModelType) => {
      item.title = item.list.label || item.label;
      item.dataIndex = item.fieldName;
      if (item[key].slotName) {
        item.slotName = item[key].slotName;
      } else if (item.fieldName.indexOf('.') !== -1) {
        item.slotName = 'multistage';
      } else if (item[key].slot) {
        item.slotName = item.useName;
      } else {
        item.slotName = 'common';
      }
    });
    // fieldList.unshift({
    //   title: '#',
    //   dataIndex: 'index',
    //   slotName: 'index',
    // });
    if (!noOpt) {
      fieldList.push({
        title: '操作',
        dataIndex: 'operations',
        slotName: 'operations',
      });
    }
  }
  // 自定义表单校验处理
  fieldList.forEach((item: formModelType) => {
    if (item.rules) {
      // eslint-disable-next-line @typescript-eslint/ban-types
      item.rules.forEach((items: formModelType) => {
        if (items.validator) {
          const validatorText = items.validator;
          const validatorFun = validate[validatorText];
          const validator = (value: string, cb: (arg0: string) => void) => {
            return new Promise<void>((resolve) => {
              if (!validatorFun(value)) {
                cb(items.message);
              }
              resolve();
            });
          };
          items.validator = validator;
        }
      });
    }
    if (item.optionsName) {
      item.options = commonDataRef.value[item.optionsName];
    }
  });

  return fieldList;
};

const getUseData = (useData: string, data: any) => {
  const useDataList = useData.split('.') || [];
  if (useData !== '' && useDataList.length) {
    useDataList.forEach((use: string) => {
      if (use !== 'none') {
        if (data[use] || data[use] === '0' || data[use] === 0) {
          data = data[use];
        } else {
          data = '';
        }
      }
    });
  }
  return data;
};

// 获取动态form字段列表
const generateFormModel = (
  fieldList: formModelType[],
  key: string,
  params?: formModelType
) => {
  let form: { [index: string]: any } = {};
  fieldList.forEach((item: formModelType) => {
    if (item[key]) {
      const newForm = {};
      if (item.fieldNames && item.fieldNames.length > 0) {
        item.fieldNames.forEach((fieldName: string) => {
          newForm[fieldName] =
            // eslint-disable-next-line no-nested-ternary
            params && params[fieldName]
              ? getUseData(fieldName, params)
              : // eslint-disable-next-line eqeqeq
              item[key].defaultValue == '0'
              ? item[key].defaultValue
              : '';
        });
      } else if (item.fieldName) {
        // eslint-disable-next-line no-nested-ternary
        newForm[item.fieldName] = params
          ? getUseData(item.oldFieldName || item.fieldName, params)
          : // eslint-disable-next-line eqeqeq
          item[key].defaultValue == '0'
          ? item[key].defaultValue
          : '';
      }
      if (item[key].transRules) {
        item[key].transRules.forEach((rule: any) => {
          if (rule.type === 'array-attr') {
            let dataArr = params?.[rule.oldFieldName] || [];
            dataArr = dataArr.map((item: any) => {
              return item[rule.fieldName];
            });
            newForm[rule.newFieldName || item.fieldName] = dataArr || [];
          }
        });
      }
      if (item[key].parentField) {
        if (form[item[key].parentField]) {
          form[item[key].parentField] = {
            ...form[item[key].parentField],
            ...newForm,
          };
        } else {
          form[item[key].parentField] = newForm;
        }
      } else {
        form = {
          ...newForm,
          ...form,
        };
      }
    }
  });
  return form;
};

// 获取动态详情字段列表
const generateGroupList = (
  fieldList: formModelType[],
  type: string,
  group?: formModelType[]
) => {
  let newGroup = group ? JSON.parse(JSON.stringify(group)) : [];
  if (!newGroup || newGroup.length === 0) {
    newGroup = [
      {
        title: '',
        id: 1,
        data: [],
      },
    ];
  }
  fieldList.forEach((item: formModelType) => {
    if (item?.[type]) {
      newGroup.forEach(
        (items: { id: any; data: formModelType[] }, index: number) => {
          if (
            (!item?.[type].groupId && index === 0) ||
            item?.[type].groupId === items.id
          ) {
            items.data?.push({
              ...item,
              span: item?.[type].span || 1,
            });
          }
        }
      );
    }
  });
  console.log(newGroup);
  return newGroup;
};

// 转换接口返回数据
const transJoggleRules = (data: any, rules: formModelType[]) => {
  let fieldList: any = null;
  if (rules) {
    if (data instanceof Array) {
      fieldList = [];
      data.forEach((items: formModelType) => {
        const form: { [index: string]: string } = {};
        rules.forEach((item: formModelType) => {
          form[item.new] = items[item.old];
        });
        fieldList.push(form);
      });
    } else {
      fieldList = {
        ...data,
      };
      rules.forEach((item: formModelType) => {
        fieldList[item.new] = data[item.old];
      });
    }
  }

  return fieldList;
};

const showBut = (item: any, data: any) => {
  let show = true;
  if (item.show) {
    item.show.forEach((items: { fieldName: string | number; value: any }) => {
      const values = data[items.fieldName];
      // 判断是否为数组
      if (Array.isArray(items.value)) {
        if (items.value.indexOf(values) === -1) {
          show = false;
        }
      } else if (values !== items.value) {
        show = false;
      }
    });
  }
  return show;
};

export {
  generateFieldList,
  generateFormModel,
  generateGroupList,
  transJoggleRules,
  getUseData,
  showBut,
};
