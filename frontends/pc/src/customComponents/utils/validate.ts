/*
 * @Description:
 * @LastEditTime: 2023-03-08 16:35:15
 * @LastEditors: 何俊峰
 * @Author: 何俊峰
 * @Date: 2022-10-10 11:17:45
 */
/**
 * @description 判读是否为外链
 * @param path
 * @returns {boolean}
 */
function isExternal(path: string): boolean {
  return /^(https?:|mailto:|tel:|\/\/)/.test(path);
}

/**
 * @description 校验密码是否小于6位
 * @param value
 * @returns {boolean}
 */
function isPassword(value: string | any[]): boolean {
  return value.length >= 6;
}

/**
 * @description 判断是否为数字
 * @param value
 * @returns {boolean}
 */
function isNumber(value: string): boolean {
  const reg = /^[0-9]*$/;
  return reg.test(value);
}

/**
 * @description 判断是否是名称
 * @param value
 * @returns {boolean}
 */
function isName(value: string): boolean {
  const reg = /^[\u4e00-\u9fa5a-zA-Z0-9]+$/;
  return reg.test(value);
}

/**
 * @description 判断是否为IP
 * @param ip
 * @returns {boolean}
 */
function isIP(ip: string): boolean {
  const reg =
    /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/;
  return reg.test(ip);
}

/**
 * @description 判断是否是传统网站
 * @param url
 * @returns {boolean}
 */
function isUrl(url: string): boolean {
  const reg =
    /^(https?|ftp):\/\/([a-zA-Z0-9.-]+(:[a-zA-Z0-9.&%$-]+)*@)*((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3}|([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\.(com|edu|gov|int|mil|net|org|biz|arpa|info|name|pro|aero|coop|museum|[a-zA-Z]{2}))(:[0-9]+)*(\/($|[a-zA-Z0-9.,?'\\+&%$#=~_-]+))*$/;
  return reg.test(url);
}

/**
 * @description 判断是否是小写字母
 * @param value
 * @returns {boolean}
 */
function isLowerCase(value: string): boolean {
  const reg = /^[a-z]+$/;
  return reg.test(value);
}

/**
 * @description 判断是否是大写字母
 * @param value
 * @returns {boolean}
 */
function isUpperCase(value: string): boolean {
  const reg = /^[A-Z]+$/;
  return reg.test(value);
}

/**
 * @description 判断是否是大写字母开头
 * @param value
 * @returns {boolean}
 */
function isAlphabets(value: string): boolean {
  const reg = /^[A-Za-z]+$/;
  return reg.test(value);
}

/**
 * @description 判断是否是字符串
 * @param value
 * @returns {boolean}
 */
function isString(value: any): boolean {
  return typeof value === 'string' || value instanceof String;
}

/**
 * @description 判断是否是数组
 * @param arg
 */
function isArray(arg: any) {
  if (typeof Array.isArray === 'undefined') {
    return Object.prototype.toString.call(arg) === '[object Array]';
  }
  return Array.isArray(arg);
}

/**
 * @description 判断是否是端口号
 * @param value
 * @returns {boolean}
 */
function isPort(value: string): boolean {
  const reg =
    /^([0-9]|[1-9]\d|[1-9]\d{2}|[1-9]\d{3}|[1-5]\d{4}|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5])$/;
  return reg.test(value);
}

/**
 * @description 判断是否是手机号
 * @param value
 * @returns {boolean}
 */
function isPhone(value: string): boolean {
  const reg = /^1[3-9]{1}[0-9]{9}$/;
  return reg.test(value);
}

/**
 * @description 判断是否是身份证号(第二代)
 * @param value
 * @returns {boolean}
 */
function isIdCard(value: string): boolean {
  const reg =
    /^[1-9]\d{5}(18|19|([23]\d))\d{2}((0[1-9])|(10|11|12))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/;
  return reg.test(value);
}

/**
 * @description 判断是否是邮箱
 * @param value
 * @returns {boolean}
 */
function isEmail(value: string): boolean {
  const reg = /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
  return reg.test(value);
}

/**
 * @description 判断是否中文
 * @param value
 * @returns {boolean}
 */
function isChina(value: string): boolean {
  const reg = /^[\u4E00-\u9FA5]{2,4}$/;
  return reg.test(value);
}

function isHaveChina(value: string) {
  const reg = new RegExp('[\\u4E00-\\u9FFF]+', 'g');
  return reg.test(value);
}
/**
 * @description 判断是否英文
 * @param value
 * @returns {boolean}
 */
function isEnglish(value: string): boolean {
  const reg = /^[\u4e00-\u9fa5]+$/;
  return reg.test(value);
}

/**
 * @description 判断是否为空
 * @param value
 * @returns {boolean}
 */
function isBlank(value: string | null): boolean {
  return (
    value === null ||
    false ||
    value === '' ||
    value.trim() === '' ||
    value.toLocaleLowerCase().trim() === 'null'
  );
}

/**
 * @description 判断是否为固话
 * @param value
 * @returns {boolean}
 */
function isTel(value: string): boolean {
  const reg =
    /^(400|800)([0-9\\-]{7,10})|(([0-9]{4}|[0-9]{3})([- ])?)?([0-9]{7,8})(([- 转])*([0-9]{1,4}))?$/;
  return reg.test(value);
}

/**
 * @description 判断是否为数字且最多两位小数
 * @param value
 * @returns {boolean}
 */
function isNum(value: string): boolean {
  const reg = /^\d+(\.\d{1,2})?$/;
  return reg.test(value);
}
/**
 * @description 判断是否为数字且最多两位小数
 * @param value
 * @returns {boolean}
 */
function isNum1(value: string): boolean {
  const reg = /^\d+(\.\d{1,1})?$/;
  return reg.test(value);
}

/**
 * @description 判断是否为json
 * @param value
 * @returns {boolean}
 */
function isJson(value: string): boolean {
  if (typeof value === 'string') {
    const obj = JSON.parse(value);
    return !!(typeof obj === 'object' && obj);
  }
  return false;
}

/**
 * @description 判断是否为特殊字符
 * @param value
 * @returns {boolean}
 */
function checkSpecificKey(str: string) {
  const specialKey =
    "[`~!@#$^&*%=|{}':;',\\[\\].<>/?~！#￥……&*|{}【】‘；：”“'。，、？]‘'";
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < str.length; i++) {
    if (specialKey.indexOf(str.substr(i, 1)) !== -1) {
      return false;
    }
  }
  if (str === ' ') {
    return false;
  }
  return true;
}

/**
 * @description 判断是否为英文名称
 * @param value
 * @returns {boolean}
 */
function checkEnglishName(str: string): boolean {
  return /^[a-zA-Z \d+]+$/.test(str);
}

export default {
  isExternal,
  isPassword,
  isNumber,
  isName,
  isNum,
  isNum1,
  isJson,
  checkSpecificKey,
  checkEnglishName,
  isIP,
  isEmail,
  isPhone,
  isUrl,
  isLowerCase,
  isUpperCase,
  isAlphabets,
  isString,
  isArray,
  isPort,
  isIdCard,
  isChina,
  isHaveChina,
  isEnglish,
  isBlank,
  isTel,
};
