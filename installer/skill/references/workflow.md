# 一合通安装操作流程

## 0. 首选入口与统一会话

- Windows：双击安装包根目录的 `YihetongInstaller.exe`。
- Ubuntu：在安装包根目录执行 `./deploy/installer/linux/install.sh`。
- 自动化：执行 `./deploy/installer/linux/install.sh --non-interactive --mode quick --yes`，或自定义模式增加只含非秘密内容的 `--answers` 文件。
- 智能助手：使用安装器 MCP 的 `create_install_session`、`get_install_session`、`run_install_action` 和 `open_secret_input`。

以上入口都落到 `yhtctl session`。如需直接排障，可使用：

```bash
./yhtctl session create --mode quick --package-root .
./yhtctl session show --id <会话ID>
./yhtctl session action --id <会话ID> --action check
./yhtctl session action --id <会话ID> --action install
./yhtctl session action --id <会话ID> --action verify
```

不得把秘密写进 answers JSON 或命令参数。自定义自动化只从生成的 `secrets.refs.yaml` 所声明环境变量导入秘密；交互场景只使用本机 Web 受保护表单。

## 1. 准备材料

- 已解压的安装包及交付通知中的 SHA-256；
- 安装包外的客户配置目录；
- 仅包含非秘密信息的 `customer-profile.yaml`；
- 仅包含秘密来源和键名的 `secrets.refs.yaml`；
- 安装目标、备份目录和回退负责人；
- 商业客户使用的受保护授权目录。

## 2. 校验安装包与依赖

```bash
./yhtctl manifest --package-root . --verify --json
./yhtctl prepare --package-root . --json
```

确认允许安装系统软件后执行：

```bash
./yhtctl prepare --package-root . --yes --json
```

Ubuntu 22.04/24.04 使用系统软件源。Rocky Linux 9 等受支持的 RPM 系统使用安装包规定的固定来源和 SHA-256。完成后应能找到 LibreOffice Writer/Calc、Noto CJK 字体和 Fontconfig。

## 3. 生成客户配置

交互方式：

```bash
./yhtctl config init \
  --output <受保护的配置目录> \
  --install-profile community \
  --interactive
```

也可以使用仅含非秘密信息的 answers JSON：

```bash
./yhtctl config init \
  --output <受保护的配置目录> \
  --install-profile community \
  --answers <非秘密答案文件>
```

生成结果包括：

- `customer-profile.yaml`：客户非秘密配置；
- `secrets.refs.yaml`：秘密来源和键名；
- `REQUIRED_CONFIGURATION_CHECKLIST.md`：必要配置、当前状态、提供人、保存位置和验证方法；
- `REQUIRED_CONFIGURATION_CHECKLIST.json`：安装程序可读取的同一份清单；
- `assets/`：已确认的品牌素材；
- `external-actions/THIRD_PARTY_ACTIONS.md`：第三方平台操作清单；
- `CONFIGURATION_ORDER.md`：配置生效顺序；
- `CONFIG_WORKSPACE.json`：安装程序使用的配置工作区状态。

## 4. 校验配置

```bash
PROFILE=<受保护的配置目录>/customer-profile.yaml
SECRETS=<受保护的配置目录>/secrets.refs.yaml

./yhtctl config checklist --profile "$PROFILE" --secrets "$SECRETS" --out <受保护的配置目录>/必要配置清单-最新.md --json
./yhtctl doctor --profile "$PROFILE" --json
./yhtctl config validate --profile "$PROFILE" --secrets "$SECRETS" --json
./yhtctl config plan --profile "$PROFILE" --secrets "$SECRETS" --json
./yhtctl config render --profile "$PROFILE" --secrets "$SECRETS" --output <临时渲染目录>
```

本地体验和社区安装使用 `installProfile: community`。商业客户按交付支持提供的授权资料配置。

## 5. 安装与检查

```bash
./yhtctl install \
  --profile "$PROFILE" \
  --secrets "$SECRETS" \
  --package-root . \
  --yes

./yhtctl status --profile "$PROFILE" --secrets "$SECRETS" --json
./yhtctl verify --profile "$PROFILE" --secrets "$SECRETS" --json
```

请检查 API、管理后台、PC 用户端、H5、官网、配置读回和 Word 转 PDF。品牌配置保存后应即时读回；部署启动覆盖保存后，只由安装包配置的 systemd/容器监督器恢复后端进程，并以健康、新实例标识和目标值读回确认。该过程不执行任意 Shell 命令、不重启服务器，也不代替数据库、DNS/TLS、Nginx、微信平台或前端重建。相同版本和相同配置可以再次执行安装命令，以确认服务和配置已经收敛。

## 6. 配置更新

```bash
./yhtctl config validate --profile "$PROFILE" --secrets "$SECRETS" --json
./yhtctl config plan --profile "$PROFILE" --secrets "$SECRETS" --json
./yhtctl config update \
  --profile "$PROFILE" \
  --secrets "$SECRETS" \
  --package-root . \
  --yes
./yhtctl verify --profile "$PROFILE" --secrets "$SECRETS" --json
```

更新后请核对配置读回、服务状态和受影响入口，并确认生成的后端服务单元包含 `YHT_DEPLOY_CONFIG_AUTO_APPLY_ENABLED=true` 及正确监督模式。DNS、TLS、Nginx、客户端重建、白名单和第三方平台审核由对应负责人同步完成。

## 7. 备份与回退

```bash
./yhtctl backup \
  --profile "$PROFILE" \
  --secrets "$SECRETS" \
  --reason "before-change" \
  --json
```

保存命令返回的备份记录路径和 SHA-256。需要回退时执行：

```bash
./yhtctl rollback \
  --profile "$PROFILE" \
  --secrets "$SECRETS" \
  --receipt <回退记录文件> \
  --yes
./yhtctl verify --profile "$PROFILE" --secrets "$SECRETS" --json
```

回退完成后，请等待 API 恢复监听，再检查各端入口和 Word 转 PDF。

## 8. 问题反馈

向交付支持提供安装包版本、SHA-256、操作系统、执行命令、错误码、发生时间和脱敏日志。请勿发送密码、Token、私钥、证书私钥、验证码或业务正文。
