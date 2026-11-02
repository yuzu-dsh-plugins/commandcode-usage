# dsh-commandcode-plan-usage

Command Code（[commandcode.ai](https://commandcode.ai)）套餐用量，常驻在 DSH 侧边栏底部、设置入口旁。

A Command Code plan-usage row for DeepSeek Harness, pinned in the sidebar foot beside Settings.

## 显示内容 · What it shows

侧边栏底部一行（`sidebar.footer.action` 槽位，设置行旁）：

```
[Command Code 标志]   5h 5%   周 8%   月 40%
```

- 图标是 Command Code 官方标志（见下方「第三方素材」），不显示「Command Code」文案，品牌名只留在 `title` 与 `aria-label`；
- 行高 42px、`margin:0 -2px` + `padding:0 10px 0 8px`、圆角 12px、字号 14px —— 与同一槽位的官方行（`@deepseek-ai/dsh-client-ui-cordis` 的 CordisPanel）逐项一致，标志与数字因此和相邻行的图标/文字列对齐；
- hover 与展开（`aria-expanded="true"`）共用底色 `--dsw-alias-interactive-bg-hover`；
- 三个占比按阈值着色（<60% 绿 / ≥60% 黄 / ≥85% 红）；
- **首次取数**期间行内显示「加载中…」（次要色）；拿到数据后显示数字。**之后的每 5 分钟后台刷新不显示任何 loading**，始终保留上一份数字；只有「取数失败且没有旧数据」时才显示「不可用」（导轨形态则是红色状态点）；
- 侧栏收起成 56px 导轨时变成 36×36 圆形按钮，只留标志，占比取三者最大值画成右上角 6px 状态点，精确数字进 `title` 与 `aria-label`；
- 单击展开详情面板（贴合该行左缘向上弹出，跟随窗口 resize；面板用宿主的菜单表面 `--dsw-specific-menu` + `--dsw-elevation-prominent` + 12px 圆角）：三个窗口的金额、进度条、重置时间，套餐 ID / 订阅状态 / 计费周期结束时间，账号、请求数、成功率、更新时间；Esc 或点击别处关闭；
- 每 5 分钟自动刷新（`config.refreshMinutes`），面板打开与窗口重新可见时立即刷新。

## 安装 · Install

**方式一：把本目录装进当前 profile（推荐）**

用 DSH 的插件管理安装本目录：让 agent 执行「把 `<本目录绝对路径>` 装进当前 profile」，或在「设置 → 插件」页用安装入口选择本目录。
安装会做两件事：把 `dsh-commandcode-plan-usage` 写进 profile 的 `dsh.profile.bundles`，并让 profile 的 `node_modules` 以**软链**指向本目录——所以源码即安装产物，改完刷新页面即可生效，不需要构建。

**方式二：发布到 npm 之后**

用插件页/插件市场的安装入口按包名 `dsh-commandcode-plan-usage` 安装。

**方式三：手动（仅开发调试）**

```bash
ln -sfn /绝对路径/dsh-commandcode-plan-usage ~/.dsh/profiles/<profile>/node_modules/dsh-commandcode-plan-usage
```

并在 `~/.dsh/profiles/<profile>/package.json` 的 `dsh.profile.bundles` 里加上 `dsh-commandcode-plan-usage`。

安装后如需自定义，按下面「配置」在 profile 的 `cordis.patch.yml` 覆盖该行。

## 数据来源 · Data

Host 半每次请求时解析凭据并调用 Command Code 账号接口：

| 端点 | 用途 |
|---|---|
| `/alpha/whoami` | 账号 |
| `/alpha/usage/summary` | 本计费周期花费、请求数、成功率、Token |
| `/alpha/billing/credits` | 5 小时 / 每周窗口、剩余月额度 |
| `/alpha/billing/subscriptions` | 套餐、订阅状态、计费周期 |

月额度分母按官网口径推算：`本期已用 + 剩余月额度`（不写死套餐表，套餐变更后自动跟随）。

凭据解析顺序：

1. 插件 `config.apiKey`
2. `ctx.credentials` 解析 `config.apiKeyEnv`（默认 `COMMANDCODE_API_KEY`，即 `$DSH_HOME/.credentials.yaml` → 进程环境 → `.env`）
3. `~/.commandcode/auth.json`（Command Code CLI 登录态）

API Key 只留在 Host 进程里；浏览器半通过 `GET /api/commandcode-plan/usage` 取已归一化的数据，响应带 `cache-control: no-store`。

## 配置 · Configuration

在 profile 的 `cordis.patch.yml` 覆盖该行即可：

```yaml
- id: commandcode-plan-usage
  name: 'dsh-commandcode-plan-usage'
  config:
    apiBase: 'https://api.commandcode.ai'
    apiKeyEnv: 'COMMANDCODE_API_KEY'
    timeoutMs: 12000
    refreshMinutes: 5
```

## Agent 工具 · Agent tool

同一份读取也注册为模型工具，让对话里可以直接问用量：

```
查一下我的 Command Code 用量
```

## 兼容性与已知风险 · Compatibility and caveats

- 用的是 Command Code **未公开**的 `/alpha/*` 账号端点（CLI 自身同款）。官方一旦改动，插件会失效：此时行内显示「不可用」，面板给出具体原因（缺凭据 / 请求失败 / 传输失败），不会崩。
- 请求头 `x-command-code-version`、`x-cli-environment` 是账号 API 认的客户端标识，不是本插件的版本。
- 已在 DSH `0.2.1-rc.2`（desktop profile、macOS）上验证。
- 刻意不声明 `engines.dsh`：DSH 目前是预发布版本号（如 `0.2.1-rc.2`），semver 区间会把预发布版判为不满足，反而挡住安装。
- 用量来自你的账号：面板会显示账号名/邮箱，`commandcode_usage` 工具也会把同一份数据交给模型；如需换成别的 key，改 `config.apiKeyEnv`。

## 第三方素材 · Third-party artwork

- `client.js` 中的 Command Code 标志取自 Command Code 官方 VS Code 扩展的 `icons/icon-dark.svg`（144×144 图形），仅用于标识所测量的服务。该标志的版权与商标归 Command Code 所有，**不在本项目的 MIT 许可范围内**。
- `icon.svg`（插件列表里的图标）是本项目的原创图形，随 MIT 发布。

## 目录结构 · Layout

```
index.js          Host 半：/api 路由、commandcode_usage 工具、四端点归一化
client.js         浏览器半：sidebar.footer.action 行 + 详情面板
cordis.patch.yml  bundle patch（一行 Host 插件）
locale/en.json    插件标题/描述（插件页与设置页读取）
locale/zh.json
icon.svg          插件列表图标（原创）
```

## 开发 · Development

源码即安装目录（profile 以软链引用），改完在插件页重载插件树或刷新页面即可，无需构建步骤：

- `index.js` — Host 半：认证路由 + agent 工具 + 数据归一化，不缓存，每次调用重新解析凭据；
- `client.js` — 浏览器半：`sidebar.footer.action` 行与详情面板；只依赖 `react` 与宿主的 `--dsw-*` 主题 token，不 import 任何 Harness Client 包；
- 两半的失败码通过 `ERROR_KEYS` 映射到词典 key，新增失败码时两边一起改。

## License

MIT，见 [LICENSE](./LICENSE)。Command Code 标志除外（见「第三方素材」）。
