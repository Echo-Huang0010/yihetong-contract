/*
 * @Description:
 * @LastEditTime: 2023-06-01 14:29:21
 * @LastEditors: 何俊峰
 * @Author: 何俊峰
 * @Date: 2023-05-26 10:27:31
 */
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

const getTableSize = () => {
  const size = localStorage.getItem(TABLESIZE) || TABLESIZE;

  return sizeArr[size];
};

const setTableSize = (size: string) => {
  localStorage.setItem(sizeArr[TABLESIZE], size);
};
export { getTableSize, setTableSize };
