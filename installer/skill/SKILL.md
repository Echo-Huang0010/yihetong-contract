---
name: yihetong-installer
description: Use the shared yhtctl installer session to prepare, configure, install, verify, stop, repair, back up, roll back, or uninstall Yihetong through CLI, Web, or MCP without exposing secrets.
---

# 一合通安装辅助

本 Skill 是可选智能安装入口。普通用户优先双击 Windows `YihetongInstaller.exe` 或在 Ubuntu 执行 `./deploy/installer/linux/install.sh`，无需复制命令或编辑 JSON。

CLI、Web、Skill 与 MCP 都使用安装包内同一个 `yhtctl session`、配置工作区、会话指纹和回退记录；不得创建第二套部署逻辑。

## 使用前准备

1. 确认安装包根目录、版本、SHA-256、目标系统和安装负责人。
2. Windows 先确认 WSL2 Ubuntu 22.04/24.04 与 Docker Desktop；Ubuntu 先确认 Docker Engine 与 Compose v2。
3. 让用户选择快速安装或现有 MySQL/Redis 自定义安装，并复述会影响的专用目录、容器与回退边界。
4. 创建一个安装会话，并在后续操作中始终复用其 `sessionId` 与 `sessionFingerprint`。

客户密码、Token、私钥、验证码和证书私钥不得进入提示词、工具参数、命令参数、日志、回执或 Web 响应。需要秘密时，只让用户打开 `open_secret_input` 返回的 `127.0.0.1` 本地表单，或由自动化环境按 `secrets.refs.yaml` 注入环境变量。

## 安装流程

- 会话：用 `create_install_session` 或 `yhtctl session create` 写入非秘密配置，并保存返回的会话 ID。
- 环境：先运行 `check`；失败时返回真实错误码、缺失前置条件和恢复动作，不宣称已安装。
- 配置：自定义模式运行 `configure`，然后让用户在本机表单补齐秘密。商业版还必须验证正式 Instance / License / Lease。
- 安装：用户确认目标和影响范围后运行 `install`。社区模式保持签署能力关闭。
- 检查：运行 `verify`，检查 API、管理端、用户端、H5、官网、配置读回和 Word 转 PDF；品牌保存须即时读回，部署启动项须确认受控监督器恢复后端、新实例标识和目标值读回。只显示真实入口与真实事件。
- 维护：`stop`、`repair`、`backup` 使用同一会话；`rollback` 与 `uninstall` 必须回到本地向导由用户明确确认。

CLI 和自动化示例见 [references/workflow.md](references/workflow.md)。

## 联系交付支持

遇到以下情况时，保留错误码和脱敏日志并联系交付支持：

- 安装包 Manifest 或 SHA-256 校验失败；
- 配置校验无法通过；
- 系统依赖安装失败；
- API、页面或 Word 转 PDF 未就绪；
- 部署配置已保存但后端监督模式、新实例或目标值读回未确认；
- 商业授权资料缺失或与当前实例不匹配；
- 需要修改 DNS、TLS、第三方平台或生产环境配置。

请勿在工单、聊天或截图中发送密码、Token、私钥、证书私钥、验证码或业务正文。
