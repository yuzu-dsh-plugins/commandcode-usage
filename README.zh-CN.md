# Command Code 用量

[English](./README.md) · **简体中文**

在 DeepSeek Harness 侧边栏底部、设置入口旁显示 [Command Code](https://commandcode.ai)
套餐用量，涵盖 5 小时、每周和月度额度。

## 显示内容

```text
[Command Code 标志]   5h 5%   周 8%   月 40%
```

- 用量行位于 `sidebar.footer.action` 插槽，样式与宿主侧边栏一致。行内显示
  Command Code 标志，品牌名会出现在悬停提示和无障碍标签中。
- 用量低于 60% 显示绿色，达到 60% 且低于 85% 显示黄色，85% 及以上显示红色。
- 首次请求会显示加载提示，之后刷新时保留最近一次读数。请求失败且没有历史读数时显示「不可用」。
- 侧边栏收起后，按钮保留标志和状态点。状态点颜色取决于三个百分比中的最高值，
  具体数值仍可通过悬停提示和无障碍标签查看。
- 点击用量行可查看已用金额、进度条、重置时间、套餐和订阅状态、计费周期结束时间、
  账号、请求数、成功率和最后更新时间。按 `Esc` 或点击面板外部可关闭。
- 默认每五分钟刷新一次。打开详情面板或窗口重新可见时也会刷新。

## 安装

```sh
git clone https://github.com/yuzu-dsh-plugins/commandcode-usage.git
```

在 DSH 插件管理器中，将克隆下来的目录安装为本地 bundle。如果当前会话提供
`plugin_manager` 工具，可通过 `install_bundle` 指定该目录的绝对路径。
注册的 bundle 名称为 `dsh-commandcode-plan-usage`。

安装后，profile 会将该名称写入 `dsh.profile.bundles`，并以软链接指向本地目录。
浏览器端直接使用目录中的 `client.js`。

如需手动配置开发环境，可将仓库链接到当前 profile。请将示例中的仓库路径和
profile 名称换成你实际使用的值。

```sh
ln -sfn "/absolute/path/to/commandcode-usage" "$HOME/.dsh/profiles/desktop/node_modules/dsh-commandcode-plan-usage"
```

然后在该 profile 的 `package.json` 中，将 `dsh-commandcode-plan-usage`
加入 `dsh.profile.bundles`。

## 数据来源与凭据

宿主每次收到请求时都会解析凭据，并读取以下 Command Code 账号接口。

| 端点 | 数据 |
|---|---|
| `/alpha/whoami` | 账号信息 |
| `/alpha/usage/summary` | 本计费周期的花费、请求数、成功率和 Token 数 |
| `/alpha/billing/credits` | 5 小时及每周用量窗口、剩余月额度 |
| `/alpha/billing/subscriptions` | 套餐、订阅状态和计费周期 |

月度总额度由本期已用金额加上接口返回的剩余月额度得出。

宿主按以下顺序查找 API Key。

1. 插件的 `config.apiKey`。
2. DSH 凭据解析器，查找 `config.apiKeyEnv` 指定的凭据，默认为 `COMMANDCODE_API_KEY`。
3. `config.apiKeyEnv` 指定的进程环境变量。
4. Command Code CLI 登录文件 `~/.commandcode/auth.json`。

API Key 保存在宿主进程中。浏览器通过经过认证的
`GET /api/commandcode-plan/usage` 路由读取归一化后的用量数据，
响应使用 `Cache-Control: no-store`。

## 配置

可以在 profile 的 `cordis.patch.yml` 中覆盖 bundle 配置。以下为默认值。

```yaml
- id: commandcode-plan-usage
  name: 'dsh-commandcode-plan-usage'
  config:
    apiBase: 'https://api.commandcode.ai'
    apiKeyEnv: 'COMMANDCODE_API_KEY'
    timeoutMs: 12000
    refreshMinutes: 5
```

## Agent 工具

如果 DSH 提供工具注册服务，插件会注册 `commandcode_usage`。该工具会将同一份
用量报告（含账号信息）返回给模型。例如，可以直接问：

```text
查一下我的 Command Code 用量。
```

## 兼容性

- 插件使用 Command Code 未公开的 `/alpha/*` 端点。接口变动可能影响可用性
  或用量数据。缺少凭据或请求失败时，详情面板会显示错误。
- 请求头 `x-command-code-version` 和 `x-cli-environment` 用于向 Command Code API
  标识客户端。
- 原插件已在 macOS 的 DSH `0.2.1-rc.2` desktop profile 上验证。
  清单省略 `engines.dsh`，以免版本范围排除预发布版本。

## 开发

profile 通过软链接指向当前仓库。修改后可重载插件树或刷新页面，无需构建。

| 文件 | 用途 |
|---|---|
| `index.js` | 宿主路由、Agent 工具、凭据解析及四个端点的数据归一化 |
| `client.js` | 侧边栏用量行与详情面板，复用宿主 React 和 `--dsw-*` 主题变量 |
| `cordis.patch.yml` | 注册宿主插件的 bundle patch |
| `locale/en.json`、`locale/zh.json` | DSH 界面使用的插件名称和说明 |
| `icon.svg` | 插件列表使用的原创图标 |

添加错误码时，请同步更新宿主端和浏览器端的 `ERROR_KEYS` 映射。

## 素材与许可

项目采用 [MIT 许可证](./LICENSE)，原创图标 `icon.svg` 也适用该许可证。
`client.js` 中的 Command Code 标志取自其官方 VS Code 扩展的
`icons/icon-dark.svg`，用于标识服务。该标志归 Command Code 所有，
不在本项目的 MIT 许可范围内。
