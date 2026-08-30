/*
 * @Description:
 * @LastEditTime: 2023-06-01 11:20:49
 * @LastEditors: 何俊峰
 * @Author: 何俊峰
 * @Date: 2023-05-26 10:27:31
 */
const TOKEN_KEY = 'token';
const ROLE_KEY = 'role';
type SizeProps = 'mini' | 'small' | 'medium' | 'large';
const TABLESIZE: SizeProps = 'medium';
const mini: SizeProps = 'mini';
const small: SizeProps = 'small';
const medium: SizeProps = 'medium';
const large: SizeProps = 'large';
const sizeArr = {
  mini,
  small,
  medium,
  large,
};

const isLogin = () => {
  return !!localStorage.getItem(TOKEN_KEY);
};

const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

const setToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token);
};

const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

const getRole = () => {
  return localStorage.getItem(ROLE_KEY);
};

const setRole = (role: string) => {
  localStorage.setItem(ROLE_KEY, role);
};

const clearRole = () => {
  localStorage.removeItem(ROLE_KEY);
};

const getTableSize = () => {
  const size = localStorage.getItem(TABLESIZE) || TABLESIZE;

  return sizeArr[size];
};

const setTableSize = (size: string) => {
  localStorage.setItem(sizeArr[TABLESIZE], size);
};
export {
  isLogin,
  getToken,
  setToken,
  clearToken,
  getRole,
  setRole,
  clearRole,
  getTableSize,
  setTableSize,
};
