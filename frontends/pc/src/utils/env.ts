/*
 * @Description:
 * @LastEditTime: 2023-05-26 14:25:28
 * @LastEditors: 何俊峰
 * @Author: 何俊峰
 * @Date: 2023-02-24 17:34:15
 */
// eslint-disable-next-line import/no-mutable-exports
let debug = process.env.NODE_ENV !== 'production';
console.log(process.env.NODE_ENV);
debug = true;
debug = false;

export default debug;
