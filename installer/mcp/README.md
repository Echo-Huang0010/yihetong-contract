# 一合通安装器 MCP

本 MCP 是 `yhtctl` 安装会话的可选适配器，不是第二套部署引擎。Codex、Claude、WorkBuddy 等支持标准输入输出 MCP 的宿主可启动：

```text
node <公开仓>/installer/mcp/server.mjs
```

暴露的工具只接受非秘密配置、会话 ID 和有限动作。秘密输入工具仅返回 `127.0.0.1` 本地表单地址，工具参数、响应、日志与会话回执中都不会包含秘密值。

社区模式不要求 License 或 Lease，正式签署保持关闭。商业模式仍要求与安装包、配置指纹和实例匹配的正式 Instance / License / Lease；MCP 不会创建、签发或绕过授权。

从源码运行本地秘密输入页前，先在 `installer/yhtctl/wizard` 执行 `npm ci` 和 `npm run build`。公开源码与 2.0.1 社区安装包使用同一套会话模块；发行 ZIP 已包含构建后的向导，无需重复构建。

MCP 继续只驱动同一 `yhtctl` 会话。安装/更新后的验证应读取真实包版本与 Manifest，并确认品牌配置即时读回；部署启动覆盖则由包内固定 systemd/容器监督器只恢复后端进程，健康、新实例标识和目标值读回均通过后才可报告已应用。MCP 不接受或执行 Shell 命令，不重启服务器，也不代替数据库、DNS/TLS、Nginx、微信平台或前端构建动作。
