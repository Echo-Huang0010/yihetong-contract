<!--
 * @Description:
 * @LastEditTime: 2023-12-19 17:10:30
 * @LastEditors: 何俊峰
 * @Author: 何俊峰
 * @Date: 2023-05-11 17:57:40
-->

# Yeeco + 一合通后台管理

基于弈联之家基础框架开发。


## 项目说明
#### 开发环境

- 语言：Vue3.0,typeScript

- IDE(前端)： Vscode、HBuilder

- 依赖管理：npm



#### 前端框架

| 说明       | 框架       | 说明       | 框架      |
| ---------- | ---------- | ---------- | --------- |
| 基础框架   | Arco Design UI | JS版本     | ES6       |
| 基础JS框架 | Vue.js     | 状态管理   | Vuex       | 网络请求   | axios      |
| css预处理  | scss      |

#### 预览地址
[https://esign-pc-admin.yi-types.com](https://esign-pc-admin.yi-types.com)


## 运行说明
npm run dev

## 打包说明
npm run build:dev

npm run build:test

npm run build:prod

## 项目结构
```txt
├── README.md
├── package.json
├── index.html
├── env.development	  # 开发环境配置
├── env.production    # 生产环境配置
├── env.test          # 测试环境配置
├── src
│   ├── api  # 请求接口
│   ├── assets  # 静态资源
│          └── style 全局样式
│   ├── components  # 通用业务组件
│   ├── customComponents  # 自定义模块业务组件
│   │    ├── api # 自定义模块请求
│   │    ├── customDetail # 自定义模块-详情页组件
│   │    ├── customForm # 自定义模块-表单组件
│   │    ├── customList # 自定义模块-列表组件
│   │    ├── edit # 自定义模块-字段值编辑组件
│   │    ├── operationPop # 自定义模块-列表操作按钮对应方法组件
│   │    ├── searchForm # 自定义模块-列表搜索组件
│   │    ├── show # 自定义模块-字段值展示组件
│   │    ├── topTab # 自定义模块-tab切换搜索组件
│   │    └── utils # 自定义模块-通用方法集
│   ├── customJson  # 自定义模块业务json数据
│   ├── config  # 全局配置(包含echarts主题)
│          └── settings.json  # 配置文件
│   ├── directives # 指令集（如需，可自行补充）
│   ├── filters # 过滤器（如需，可自行补充）
│   ├── hooks # 全局hooks
│   ├── layout  # 布局
│   ├── locale  # 国际化语言包
│   ├── mock  # 模拟数据
│   ├── views  # 页面模板
│   │     ├── customList # 自定义模块页面
│   │     ├── visualization # 数据概况
│   │     ├── user # 个人中心
│   │     └── login # 登录页
│   ├── router # 路由配置
│   ├── store  # 状态管理中心
│   ├── types  # Typescript 类型
│   └── utils  # 工具库
│   └── App.vue  # 视图入口
│   └── main.ts  # 入口文件
└── tsconfig.json
```

## Git提交规范

`feat`：新功能（feature）

`fix`: 修补bug

`docs`: 文档（documentation）

`style`: 格式（不影响代码运行的变动）

`refactor`: 重构（即不是新增功能，也不是修改bug的代码变动）

`chore`: 构建过程或辅助工具的变动

`revert`: 撤销，版本回退

`perf`: 性能优化

`test`：测试

`improvement`: 改进

`build`: 打包

`ci`: 持续集成

## 运行项目
1. 安装node14
2. npm install
3. npm run dev
