/*
 * @Description:
 * @LastEditTime: 2023-06-01 10:23:14
 * @LastEditors: 何俊峰
 * @Author: 何俊峰
 * @Date: 2023-05-26 10:27:31
 */
export interface TagProps {
  title: string;
  name: string;
  fullPath: string;
  query?: any;
  ignoreCache?: boolean;
  roles?: string[] | undefined;
}

export interface TabBarState {
  tagList: TagProps[];
  cacheTabList: Set<string>;
}
