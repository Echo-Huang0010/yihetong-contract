# Contract.Pro PC 用户端

Vue 3、TypeScript、Vite 与 Arco Design 构建的 PC 用户前端。该目录不包含管理后台或服务端源码。

## 本地开发

```bash
npm ci
npm run dev
```

默认 API、品牌和入口配置位于 `src/config`；部署时应通过自己的公开端点和非秘密配置覆盖，不要在源码中写入凭据。

## 生产构建

```bash
npm ci
npm run build:prod
```

其他可用命令：`npm run build:dev`、`npm run build:test` 和 `npm run type:check`。

公开体验地址：<https://esign-pc-admin.yi-types.com/>
