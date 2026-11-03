# Command Code Usage

**English** · [简体中文](./README.zh-CN.md)

A [Command Code](https://commandcode.ai) plan usage indicator for DeepSeek
Harness. It sits beside Settings at the bottom of the sidebar and shows usage
for the 5-hour, weekly, and monthly billing windows.

## What it shows

```text
[Command Code logo]   5h 5%   Wk 8%   Mo 40%
```

- The row uses the `sidebar.footer.action` slot and matches the host's sidebar
  styling. It shows the Command Code logo. The brand name appears in the
  tooltip and accessible label.
- Usage below 60% is green, 60% up to but excluding 85% is yellow, and 85%
  or more is red.
- The first request shows a loading indicator. Later refreshes keep the most
  recent reading visible. The row shows “Unavailable” if a request fails and
  no previous reading is available.
- In the collapsed sidebar, the button shows the logo and a status dot colored
  by the highest usage percentage. The exact values remain in the tooltip and
  accessible label.
- Click the row to see amounts, progress bars, reset times, plan and
  subscription status, billing period end, account, request count, success
  rate, and last update. Press `Esc` or click outside to close the panel.
- Usage refreshes every five minutes by default, when you open the panel, and
  when the window becomes visible again.

## Installation

### Install from GitHub

Open **Plugins → Add plugin** in the DeepSeek Harness sidebar and paste this
address into the install field.

```text
git+https://github.com/yuzu-dsh-plugins/commandcode-usage.git
```

Select **Install**, then **Enable now** when installation finishes. Restart
DeepSeek Harness if the installer asks you to.

The usage row appears beside Settings. To load usage, sign in with the Command Code CLI on the same machine or set up `COMMANDCODE_API_KEY`. See [credentials](#data-sources-and-credentials).

### Install from a local directory

On GitHub, choose **Code → Download ZIP** and extract it, or clone the repository.

```sh
git clone https://github.com/yuzu-dsh-plugins/commandcode-usage.git
```

Open **Add plugin** and enter the absolute path of the extracted or cloned
directory. If your session exposes the `plugin_manager` tool, run
`install_bundle` with the directory's absolute path. The bundle is registered as
`dsh-commandcode-plan-usage`.

The profile adds that name to `dsh.profile.bundles` and links to the local
directory. The browser client runs directly from `client.js`.

For manual development setup, link the clone into the active profile. Replace
the example paths with your actual checkout path and profile name.

```sh
ln -sfn "/absolute/path/to/commandcode-usage" "$HOME/.dsh/profiles/desktop/node_modules/dsh-commandcode-plan-usage"
```

Then add `dsh-commandcode-plan-usage` to `dsh.profile.bundles` in the profile's
`package.json`.

## Data sources and credentials

The host resolves a credential on each request and reads the following Command
Code account endpoints.

| Endpoint | Data |
|---|---|
| `/alpha/whoami` | Account identity |
| `/alpha/usage/summary` | Billing period spend, requests, success rate, and tokens |
| `/alpha/billing/credits` | 5-hour and weekly windows, and remaining monthly allowance |
| `/alpha/billing/subscriptions` | Plan, subscription status, and billing period |

The monthly allowance is calculated as current period spend plus the remaining
monthly allowance reported by the API.

The host looks for a key in this order.

1. The plugin's `config.apiKey`.
2. The DSH credential resolver for `config.apiKeyEnv`, which defaults to
   `COMMANDCODE_API_KEY`.
3. The process environment variable named by `config.apiKeyEnv`.
4. The Command Code CLI sign-in file at `~/.commandcode/auth.json`.

The API key stays in the host process. The browser reads normalized usage from
the authenticated `GET /api/commandcode-plan/usage` route. The response uses
`Cache-Control: no-store`.

## Configuration

Override the bundle row in your profile's `cordis.patch.yml`. The values below
are the defaults.

```yaml
- id: commandcode-plan-usage
  name: 'dsh-commandcode-plan-usage'
  config:
    apiBase: 'https://api.commandcode.ai'
    apiKeyEnv: 'COMMANDCODE_API_KEY'
    timeoutMs: 12000
    refreshMinutes: 5
```

## Agent tool

When DSH exposes its tool registry, the plugin registers
`commandcode_usage`. The tool can return the same usage report, including
account information, to the model. For example, ask:

```text
Check my Command Code usage.
```

## Compatibility

- The plugin uses undocumented Command Code `/alpha/*` endpoints. Changes to
  those endpoints may affect availability or the reported values. The panel
  displays errors for missing credentials or failed requests.
- The request headers `x-command-code-version` and `x-cli-environment`
  identify the client to the Command Code API.
- The original plugin was tested on macOS with the DSH `0.2.1-rc.2` desktop
  profile. The manifest omits `engines.dsh` so that a version range does not
  exclude prerelease builds.

## Development

The profile links to the checkout. After an edit, reload the plugin tree or
refresh the page to load the changed code. There is no build step.

| File | Role |
|---|---|
| `index.js` | Host route, agent tool, credential resolution, and normalization for the four endpoints |
| `client.js` | Sidebar row and detail panel using host React and `--dsw-*` theme tokens |
| `cordis.patch.yml` | Bundle patch registering the host plugin |
| `locale/en.json`, `locale/zh.json` | Plugin name and description in the DSH interface |
| `icon.svg` | Original icon for the plugin list |

When adding error codes, update the client mapping in `ERROR_KEYS` alongside
the host.

## Artwork and license

The project is released under the [MIT License](./LICENSE). The original
`icon.svg` is covered by that license. The Command Code mark in `client.js`
comes from `icons/icon-dark.svg` in the official Command Code VS Code extension
and identifies the service. The mark remains the property of Command Code and
is excluded from the project's MIT license.
