/**
 * Browser half of the Command Code plan-usage bundle.
 *
 * Registers one row into the root-scoped `sidebar.footer.action` seat — the
 * sidebar foot beside Settings. The row is the Command Code mark plus the three
 * window shares; the shortened brand lives in the accessible name and tooltip
 * rather than as visible copy, which is what the seat's width cannot hold. The
 * 56px rail keeps the mark and folds the numbers into its tooltip, with the
 * worst share reported as a corner dot.
 *
 * Row geometry, hover/expanded fill, rail button, and popover chrome are copied
 * from the shipped occupant of this same seat (`@deepseek-ai/dsh-client-ui-cordis`
 * CordisPanel.module.css), so the row matches its neighbours and the popover
 * matches the host's own menus: only `--dsw-*` theme tokens are shared.
 *
 * The numbers come from the authenticated `/api/commandcode-plan/usage` route
 * the Host half registers; this half never holds the API key.
 */
window.__ModuleLoader__.load({
  id: 'dsh-commandcode-plan-usage',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    const NS = 'dsh-commandcode-plan-usage'
    /** Route relative to the document, so a mount prefix keeps working. */
    const ROUTE = 'api/commandcode-plan/usage'
    const FALLBACK_REFRESH_MS = 5 * 60 * 1000
    const MIN_REFRESH_MS = 60 * 1000
    /** The popover's width in CSS pixels; the placement clamp reads the same number. */
    const PANEL_WIDTH = 320
    /**
     * Failure codes — the Host's `commandcode-usage/*` results and this half's own
     * transport outcomes — mapped onto their dictionary keys. An unmapped code falls
     * back to `error.unknown` rather than printing the key itself.
     */
    const ERROR_KEYS = {
      transport: 'error.transport',
      'bad-response': 'error.bad-response',
      http: 'error.bad-response',
      'commandcode-usage/no-credential': 'error.no-credential',
      'commandcode-usage/request-failed': 'error.request-failed',
    }

    const DICTS = {
      en: {
        'cell.brand': 'Command Code',
        'cell.hint': 'Command Code plan usage — click for details',
        'cell.loading': 'loading…',
        'cell.unavailable': 'unavailable',
        'metric.fiveHour': '5h',
        'metric.weekly': 'wk',
        'metric.monthly': 'mo',
        'window.fiveHour': '5-hour window',
        'window.weekly': 'Weekly window',
        'window.monthly': 'Monthly allowance',
        'panel.title': 'Command Code plan usage',
        'panel.refresh': 'Refresh',
        'panel.refreshing': 'Refreshing…',
        'panel.plan': 'Plan',
        'panel.plan.unknown': 'No subscription reported',
        'panel.periodEnd': 'Period ends {time}',
        'panel.used': '{used} of {cap}',
        'panel.spent': 'Spent {spent} of {quota}; {remaining} left',
        'panel.reset': 'Resets {time}',
        'panel.reset.none': 'No reset reported',
        'panel.account': 'Account',
        'panel.requests': '{count} requests',
        'panel.success': '{percent} success',
        'panel.updated': 'Updated {time}',
        'panel.stale': 'last reading kept',
        'panel.partial': 'Some sections failed: {message}',
        'error.no-credential': 'No Command Code API key found. Store one as the {envName} credential, or sign in with the Command Code CLI.',
        'error.request-failed': 'Command Code did not answer: {message}',
        'error.transport': 'Could not reach the Harness host: {message}',
        'error.bad-response': 'The Harness host returned an unexpected answer (HTTP {status}).',
        'error.unknown': 'Usage could not be read: {message}',
        'value.unknown': '—',
      },
      zh: {
        'cell.brand': 'Command Code',
        'cell.hint': 'Command Code 套餐用量 — 点击查看详情',
        'cell.loading': '加载中…',
        'cell.unavailable': '不可用',
        'metric.fiveHour': '5h',
        'metric.weekly': '周',
        'metric.monthly': '月',
        'window.fiveHour': '5 小时窗口',
        'window.weekly': '每周窗口',
        'window.monthly': '月额度',
        'panel.title': 'Command Code 套餐用量',
        'panel.refresh': '刷新',
        'panel.refreshing': '刷新中…',
        'panel.plan': '套餐',
        'panel.plan.unknown': '未获取到订阅信息',
        'panel.periodEnd': '计费周期至 {time}',
        'panel.used': '{used} / {cap}',
        'panel.spent': '本期已用 {spent} / {quota}，剩余 {remaining}',
        'panel.reset': '重置 {time}',
        'panel.reset.none': '未提供重置时间',
        'panel.account': '账号',
        'panel.requests': '{count} 次请求',
        'panel.success': '成功率 {percent}',
        'panel.updated': '更新于 {time}',
        'panel.stale': '沿用上次数据',
        'panel.partial': '部分数据获取失败：{message}',
        'error.no-credential': '未找到 Command Code API Key。请把它保存为 {envName} 凭据，或用 Command Code CLI 登录。',
        'error.request-failed': 'Command Code 未响应：{message}',
        'error.transport': '无法连接 Harness 主机：{message}',
        'error.bad-response': 'Harness 主机返回了意料之外的响应（HTTP {status}）。',
        'error.unknown': '无法读取用量：{message}',
        'value.unknown': '—',
      },
    }

    /**
     * The Command Code mark, from the artwork the vendor ships for its own
     * VS Code activity-bar icon (144×144; the rounded frame and its knot).
     * Painted in `currentColor`, so it follows the row's text color.
     */
    const LOGO_FRAME = 'M73.1399 5.87207H70.4648C53.6901 5.87207 41.6998 5.88454 32.5877 7.10962C23.6446 8.312 18.3583 10.5847 14.4715 14.4715C10.5847 18.3583 8.312 23.6446 7.10962 32.5877C5.88454 41.6998 5.87207 53.6901 5.87207 70.4648V73.1398C5.87207 89.9145 5.88454 101.905 7.10962 111.017C8.312 119.96 10.5847 125.246 14.4715 129.133C18.3583 133.02 23.6446 135.293 32.5877 136.495C41.6998 137.72 53.6901 137.733 70.4648 137.733H73.1398C89.9145 137.733 101.905 137.72 111.017 136.495C119.96 135.293 125.246 133.02 129.133 129.133C133.02 125.246 135.293 119.96 136.495 111.017C137.72 101.905 137.733 89.9146 137.733 73.1399V70.4648C137.733 53.6901 137.72 41.6998 136.495 32.5877C135.293 23.6446 133.02 18.3583 129.133 14.4715C125.246 10.5847 119.96 8.312 111.017 7.10962C101.905 5.88454 89.9146 5.87207 73.1399 5.87207ZM10.3193 10.3193C0 20.6387 0 37.2474 0 70.4648V73.1398C0 106.357 0 122.966 10.3193 133.285C20.6387 143.605 37.2474 143.605 70.4648 143.605H73.1398C106.357 143.605 122.966 143.605 133.285 133.285C143.605 122.966 143.605 106.357 143.605 73.1399V70.4648C143.605 37.2474 143.605 20.6387 133.285 10.3193C122.966 0 106.357 0 73.1399 0H70.4648C37.2474 0 20.6387 0 10.3193 10.3193Z'
    const LOGO_KNOT = 'M98.8049 27.6163C89.3295 27.6163 81.6214 35.3243 81.6214 44.7997V52.1641H61.9832V44.7997C61.9832 35.3243 54.2752 27.6163 44.7997 27.6163C35.3243 27.6163 27.6163 35.3243 27.6163 44.7997C27.6163 54.2752 35.3243 61.9832 44.7997 61.9832H52.1641V81.6214H44.7997C35.3243 81.6214 27.6163 89.3295 27.6163 98.8049C27.6163 108.28 35.3243 115.988 44.7997 115.988C54.2752 115.988 61.9832 108.28 61.9832 98.8049V91.4406H81.6214V98.8049C81.6214 108.28 89.3295 115.988 98.8049 115.988C108.28 115.988 115.988 108.28 115.988 98.8049C115.988 89.3295 108.28 81.6214 98.8049 81.6214H91.4406V61.9832H98.8049C108.28 61.9832 115.988 54.2752 115.988 44.7997C115.988 35.3243 108.28 27.6163 98.8049 27.6163ZM91.4406 52.1641V44.7997C91.4406 40.7248 94.73 37.4354 98.8049 37.4354C102.88 37.4354 106.169 40.7248 106.169 44.7997C106.169 48.8747 102.88 52.1641 98.8049 52.1641H91.4406ZM44.7997 52.1641C40.7248 52.1641 37.4354 48.8747 37.4354 44.7997C37.4354 40.7248 40.7248 37.4354 44.7997 37.4354C48.8747 37.4354 52.1641 40.7248 52.1641 44.7997V52.1641H44.7997ZM61.9832 81.6214V61.9832H81.6214V81.6214H61.9832ZM98.8049 106.169C94.73 106.169 91.4406 102.88 91.4406 98.8049V91.4406H98.8049C102.88 91.4406 106.169 94.73 106.169 98.8049C106.169 102.88 102.88 106.169 98.8049 106.169ZM44.7997 106.169C40.7248 106.169 37.4354 102.88 37.4354 98.8049C37.4354 94.73 40.7248 91.4406 44.7997 91.4406H52.1641V98.8049C52.1641 102.88 48.8747 106.169 44.7997 106.169Z'
    const REFRESH = 'M12 5V2L7 6l5 4V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z'

    /**
     * Whether a value is a non-array object.
     * @param value - candidate.
     * @returns true for plain records.
     */
    const isRecord = (value) => typeof value === 'object' && value !== null && !Array.isArray(value)

    /**
     * Keep a finite number.
     * @param value - candidate.
     * @returns the number, or undefined.
     */
    const finite = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : undefined)

    /**
     * Keep a non-empty string.
     * @param value - candidate.
     * @returns the string, or undefined.
     */
    const text = (value) => (typeof value === 'string' && value !== '' ? value : undefined)

    /**
     * Fill `{name}` placeholders in one dictionary string.
     * @param template - dictionary text.
     * @param params - placeholder values.
     * @returns the rendered text.
     */
    const fill = (template, params) => template.replace(/\{(\w+)\}/g, (whole, name) => (
      params !== undefined && name in params ? String(params[name]) : whole
    ))

    /**
     * The accent for one share: calm below 60%, warning below 85%, error above.
     * @param percent - share of the allowance.
     * @returns a theme token reference.
     */
    const levelColor = (percent) => {
      if (percent === undefined) return 'var(--dsw-alias-label-secondary)'
      if (percent >= 85) return 'var(--dsw-alias-state-error-primary)'
      if (percent >= 60) return 'var(--dsw-alias-state-warn-primary)'
      return 'var(--dsw-alias-state-success-primary)'
    }

    /**
     * Format one share for text output.
     * @param percent - share of the allowance.
     * @returns the rounded percentage, or an em dash.
     */
    const percentText = (percent) => (percent === undefined ? '—' : `${Math.round(percent)}%`)

    /**
     * Format a USD amount the way the Command Code site does.
     * @param value - amount in USD.
     * @returns the formatted amount, or an em dash.
     */
    const money = (value) => (value === undefined ? '—' : `$${value.toFixed(2)}`)

    /**
     * Format one instant in the active locale.
     * @param value - epoch milliseconds or ISO text.
     * @param locale - active locale id.
     * @returns the formatted instant, or undefined when it cannot be read.
     */
    const instant = (value, locale) => {
      const ms = typeof value === 'number' ? value : Date.parse(String(value ?? ''))
      if (!Number.isFinite(ms)) return undefined
      try {
        return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
          .format(new Date(ms))
      } catch {
        return new Date(ms).toLocaleString()
      }
    }

    /**
     * Read the active locale, re-rendering this component on every locale change.
     * @param localeFace - the Locale service face handed in through the inject slot.
     * @returns the active locale id.
     */
    function useActiveLocale(localeFace) {
      const usable = localeFace !== undefined
        && typeof localeFace.subscribe === 'function'
        && typeof localeFace.getSnapshot === 'function'
      React.useSyncExternalStore(
        React.useCallback((onChange) => (usable ? localeFace.subscribe(onChange) : () => {}), [localeFace, usable]),
        React.useCallback(() => (usable ? localeFace.getSnapshot().revision : 0), [localeFace, usable]),
        () => 0,
      )
      return usable ? localeFace.getSnapshot().active : undefined
    }

    /**
     * The sidebar-foot row: the mark plus the window shares, with the popover.
     * @param props - slot props: the bound translate function, the inject face, and the column state.
     * @returns the rendered React tree.
     */
    function CommandCodePlanUsage(props) {
      const t = typeof props.t === 'function'
        ? props.t
        : (typeof props.translate === 'function' ? props.translate : (key) => key)
      // The seat renders the collapsed 56px rail as `wide: false`; the numbers then
      // move into the tooltip and the accessible name behind the mark alone.
      const wide = props.wide !== false
      const locale = useActiveLocale(props.localeFace)
      const tr = React.useCallback((key, params) => fill(t(key), params), [t])

      const [snapshot, setSnapshot] = React.useState({ phase: 'loading', data: undefined, error: undefined })
      const [open, setOpen] = React.useState(false)
      const [anchor, setAnchor] = React.useState(undefined)
      const epochRef = React.useRef(0)
      const rootRef = React.useRef(null)

      const load = React.useCallback(async () => {
        const epoch = ++epochRef.current
        setSnapshot((previous) => ({
          phase: previous.data === undefined ? 'loading' : 'refreshing',
          data: previous.data,
          error: previous.error,
        }))
        try {
          const response = await fetch(new URL(ROUTE, document.baseURI).href, {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store',
            headers: { accept: 'application/json' },
          })
          const payload = await response.json().catch(() => undefined)
          if (epoch !== epochRef.current) return
          if (response.ok && isRecord(payload) && payload.ok === true) {
            setSnapshot({ phase: 'ready', data: payload.value, error: undefined })
            return
          }
          const failure = isRecord(payload) && isRecord(payload.error) ? payload.error : undefined
          console.warn(`[${NS}] usage route answered HTTP ${response.status}:`, text(failure?.code) ?? 'unexpected payload', text(failure?.message) ?? '')
          setSnapshot((previous) => ({
            phase: 'error',
            data: previous.data,
            error: {
              code: text(failure?.code) ?? (response.ok ? 'bad-response' : 'http'),
              message: text(failure?.message),
              status: response.status,
              details: isRecord(failure?.details) ? failure.details : undefined,
            },
          }))
        } catch (cause) {
          if (epoch !== epochRef.current) return
          console.warn(`[${NS}] usage request failed:`, cause instanceof Error ? cause.message : String(cause))
          setSnapshot((previous) => ({
            phase: 'error',
            data: previous.data,
            error: {
              code: 'transport',
              message: cause instanceof Error ? cause.message : String(cause),
            },
          }))
        }
      }, [])

      React.useEffect(() => { void load() }, [load])

      const data = isRecord(snapshot.data) ? snapshot.data : undefined
      const refreshMs = Math.max(MIN_REFRESH_MS, finite(data?.refreshMs) ?? FALLBACK_REFRESH_MS)
      React.useEffect(() => {
        const timer = setInterval(() => { void load() }, refreshMs)
        return () => clearInterval(timer)
      }, [load, refreshMs])

      React.useEffect(() => {
        const onVisible = () => { if (document.visibilityState === 'visible') void load() }
        document.addEventListener('visibilitychange', onVisible)
        return () => document.removeEventListener('visibilitychange', onVisible)
      }, [load])

      // The popover opens above the row and follows it while the sidebar moves;
      // placement is measured from the row box, exactly as the shipped occupant of
      // this seat does, so the column's own animations cannot strand it.
      React.useLayoutEffect(() => {
        if (!open) {
          setAnchor(undefined)
          return undefined
        }
        void load()
        const place = () => {
          const rect = rootRef.current?.getBoundingClientRect()
          if (rect === undefined) return
          setAnchor({
            left: Math.max(8, Math.min(rect.left, window.innerWidth - PANEL_WIDTH)),
            bottom: window.innerHeight - rect.top + 8,
          })
        }
        place()
        window.addEventListener('resize', place)
        const onPointerDown = (event) => {
          const node = rootRef.current
          if (node !== null && !node.contains(event.target)) setOpen(false)
        }
        const onKeyDown = (event) => {
          if (event.key !== 'Escape') return
          setOpen(false)
          event.stopPropagation()
        }
        document.addEventListener('pointerdown', onPointerDown, true)
        document.addEventListener('keydown', onKeyDown, true)
        return () => {
          window.removeEventListener('resize', place)
          document.removeEventListener('pointerdown', onPointerDown, true)
          document.removeEventListener('keydown', onKeyDown, true)
        }
      }, [open, load])

      const windows = isRecord(data?.windows) ? data.windows : undefined
      const fiveHour = isRecord(windows?.fiveHour) ? windows.fiveHour : undefined
      const weekly = isRecord(windows?.weekly) ? windows.weekly : undefined
      const month = isRecord(data?.month) ? data.month : undefined
      const shares = [
        { key: 'fiveHour', label: tr('metric.fiveHour'), percent: finite(fiveHour?.percent) },
        { key: 'weekly', label: tr('metric.weekly'), percent: finite(weekly?.percent) },
        { key: 'monthly', label: tr('metric.monthly'), percent: finite(month?.percent) },
      ]
      const failed = snapshot.phase === 'error'
      // The first read and every refresh spin the refresh glyph, so the popover
      // reports work in progress without a second status line.
      const busy = snapshot.phase === 'loading' || snapshot.phase === 'refreshing'
      // The row carries numbers only: while the first read is in flight it says so,
      // and a later background refresh keeps the previous numbers on screen instead
      // of flashing a loading label into the sidebar foot. A failed read with no
      // earlier value reports itself.
      const rowText = data === undefined
        ? (failed ? tr('cell.unavailable') : tr('cell.loading'))
        : shares.map((share) => `${share.label} ${percentText(share.percent)}`).join(' · ')
      const known = shares.map((share) => share.percent).filter((percent) => percent !== undefined)
      const worst = known.length === 0 ? undefined : Math.max(...known)
      const dotColor = data === undefined
        ? (failed ? 'var(--dsw-alias-state-error-primary)' : undefined)
        : levelColor(worst)

      /**
       * One detail row: label, share, bar, amounts and reset instant.
       * @param options - row inputs.
       * @returns the rendered row.
       */
      const row = ({ label, percent, amounts, resetAt }) => h('div', { className: 'ccpu-row', key: label },
        h('div', { className: 'ccpu-row-head' },
          h('span', { className: 'ccpu-row-label' }, label),
          h('span', { className: 'ccpu-row-value', style: { color: levelColor(percent) } }, percentText(percent)),
        ),
        h('div', { className: CC.BAR },
          h('div', {
            className: 'ccpu-bar-fill',
            style: { width: `${percent === undefined ? 0 : Math.min(100, Math.max(0, percent))}%`, background: levelColor(percent) },
          }),
        ),
        h('div', { className: 'ccpu-row-meta' },
          h('span', null, amounts),
          h('span', null, resetAt === undefined ? tr('panel.reset.none') : tr('panel.reset', { time: resetAt })),
        ),
      )

      const account = isRecord(data?.account) ? data.account : undefined
      const plan = isRecord(data?.plan) ? data.plan : undefined
      const totals = isRecord(data?.totals) ? data.totals : undefined
      const failures = Array.isArray(data?.failures) ? data.failures : []
      const planLabel = text(plan?.id) === undefined
        ? tr('panel.plan.unknown')
        : [text(plan?.id), text(plan?.status)].filter(Boolean).join(' · ')
      const periodEnd = instant(plan?.currentPeriodEnd, locale)
      const updated = instant(data?.fetchedAt, locale)
      const monthQuota = finite(month?.quota)
      const monthSpent = finite(month?.spent)
      const monthRemaining = finite(month?.remaining)
      const monthAmounts = monthSpent === undefined || monthQuota === undefined
        ? money(monthSpent)
        : monthRemaining === undefined
          ? tr('panel.used', { used: money(monthSpent), cap: money(monthQuota) })
          : tr('panel.spent', { spent: money(monthSpent), quota: money(monthQuota), remaining: money(monthRemaining) })

      const errorText = snapshot.error === undefined
        ? undefined
        : tr(ERROR_KEYS[snapshot.error.code] ?? 'error.unknown', {
          message: snapshot.error.message ?? '',
          envName: text(snapshot.error.details?.envName) ?? 'COMMANDCODE_API_KEY',
          status: snapshot.error.status ?? 0,
        })

      return h('div', { className: wide ? CC.LAYER : `${CC.LAYER} ${CC.RAIL}`, ref: rootRef },
        h('style', { key: 'styles' }, CSS),
        h('button', {
          type: 'button',
          className: CC.CELL,
          onClick: () => setOpen((value) => !value),
          title: rowText === undefined ? tr('cell.hint') : `${tr('cell.hint')} — ${rowText}`,
          'aria-label': rowText === undefined ? tr('cell.brand') : `${tr('cell.brand')} ${rowText}`,
          'aria-expanded': open ? 'true' : 'false',
        },
        h('span', { className: CC.MARK },
          h('svg', {
            viewBox: '0 0 144 144',
            width: wide ? 16 : 18,
            height: wide ? 16 : 18,
            'aria-hidden': true,
          },
          h('path', { d: LOGO_FRAME, fill: 'currentColor', fillRule: 'evenodd', clipRule: 'evenodd' }),
          h('path', { d: LOGO_KNOT, fill: 'currentColor' }))),
        wide
          ? h('span', { className: CC.METRICS },
            data !== undefined
              ? shares.map((share) => h('span', { className: CC.METRIC, key: share.key },
                h('span', { className: CC.METRIC_LABEL }, share.label),
                h('span', { className: CC.METRIC_VALUE, style: { color: levelColor(share.percent) } }, percentText(share.percent)),
              ))
              : h('span', {
                className: failed ? `${CC.STATE} ${CC.STATE_ERROR}` : `${CC.STATE} ${CC.STATE_MUTED}`,
              }, rowText))
          : (dotColor === undefined ? null : h('span', { className: CC.DOT, style: { background: dotColor } })),
        ),
        open && anchor !== undefined ? h('section', {
          className: CC.PANEL,
          'aria-label': tr('panel.title'),
          style: { left: `${anchor.left}px`, bottom: `${anchor.bottom}px` },
        },
        h('header', { className: CC.HEADER },
          h('span', { className: CC.TITLE }, tr('panel.title')),
          h('button', {
            type: 'button',
            className: CC.REFRESH,
            onClick: () => { void load() },
            disabled: busy,
            'aria-busy': busy ? 'true' : undefined,
            title: tr(busy ? 'panel.refreshing' : 'panel.refresh'),
            'aria-label': tr(busy ? 'panel.refreshing' : 'panel.refresh'),
          }, h('svg', {
            className: busy ? `${CC.REFRESH_ICON} ${CC.SPIN}` : CC.REFRESH_ICON,
            viewBox: '0 0 24 24',
            width: 16,
            height: 16,
            'aria-hidden': true,
          },
          h('path', { d: REFRESH, fill: 'currentColor' }))),
        ),
        h('div', { className: CC.BODY },
          h('div', { className: CC.SUB },
            h('span', null, planLabel),
            periodEnd === undefined ? null : h('span', null, tr('panel.periodEnd', { time: periodEnd })),
          ),
          errorText === undefined ? null : h('div', { className: CC.ERROR }, errorText),
          row({
            label: tr('window.fiveHour'),
            percent: finite(fiveHour?.percent),
            amounts: tr('panel.used', { used: money(finite(fiveHour?.used)), cap: money(finite(fiveHour?.cap)) }),
            resetAt: instant(fiveHour?.resetAt, locale),
          }),
          row({
            label: tr('window.weekly'),
            percent: finite(weekly?.percent),
            amounts: tr('panel.used', { used: money(finite(weekly?.used)), cap: money(finite(weekly?.cap)) }),
            resetAt: instant(weekly?.resetAt, locale),
          }),
          row({
            label: tr('window.monthly'),
            percent: finite(month?.percent),
            amounts: monthAmounts,
            resetAt: periodEnd,
          }),
          failures.length === 0 ? null : h('div', { className: CC.WARN }, tr('panel.partial', {
            message: failures.map((entry) => `${text(entry?.section) ?? '?'}: ${text(entry?.message) ?? '?'}`).join('; '),
          })),
          h('div', { className: CC.FOOT },
            h('span', null, [
              tr('panel.account'),
              text(account?.userName) ?? text(account?.email) ?? tr('value.unknown'),
              finite(totals?.requests) === undefined ? undefined : tr('panel.requests', { count: finite(totals?.requests).toLocaleString(locale) }),
              finite(totals?.successRate) === undefined ? undefined : tr('panel.success', { percent: `${finite(totals?.successRate).toFixed(1)}%` }),
            ].filter(Boolean).join(' · ')),
            h('span', null, updated === undefined
              ? tr('value.unknown')
              : `${tr('panel.updated', { time: updated })}${failed ? ` (${tr('panel.stale')})` : ''}`),
          ),
        ),
      ) : null,
      )
    }

    /** Class names this component owns; `ccpu` keeps them out of the host's namespace. */
    const CC = {
      LAYER: 'ccpu-layer',
      RAIL: 'ccpu-rail',
      CELL: 'ccpu-cell',
      MARK: 'ccpu-mark',
      METRICS: 'ccpu-metrics',
      METRIC: 'ccpu-metric',
      METRIC_LABEL: 'ccpu-metric-label',
      METRIC_VALUE: 'ccpu-metric-value',
      STATE: 'ccpu-state',
      STATE_ERROR: 'ccpu-state-error',
      STATE_MUTED: 'ccpu-state-muted',
      DOT: 'ccpu-dot',
      PANEL: 'ccpu-panel',
      HEADER: 'ccpu-header',
      TITLE: 'ccpu-title',
      REFRESH: 'ccpu-refresh',
      REFRESH_ICON: 'ccpu-refresh-icon',
      SPIN: 'ccpu-spin',
      BODY: 'ccpu-body',
      BAR: 'ccpu-bar',
      SUB: 'ccpu-sub',
      ERROR: 'ccpu-error',
      WARN: 'ccpu-warn',
      FOOT: 'ccpu-foot',
    }

    // Row geometry, the hover/expanded fill, and the rail button come from the
    // shipped occupant of this same seat (ui-cordis CordisPanel.module.css); the
    // popover chrome follows the host's menu surface in the same module.
    const CSS = [
      '.ccpu-layer{flex:none;align-items:center;width:100%;height:42px;margin:8px 0 0;display:flex;position:relative}',
      '.ccpu-rail{width:36px;height:36px;margin:0}',
      '.ccpu-cell{width:calc(100% + 4px);height:42px;color:var(--dsw-alias-label-primary);cursor:pointer;',
      'background:0 0;border:none;border-radius:12px;align-items:center;gap:8px;margin:0 -2px;padding:0 10px 0 8px;',
      'font-family:inherit;font-size:14px;line-height:22px;display:inline-flex;overflow:hidden}',
      '.ccpu-cell:hover,.ccpu-cell[aria-expanded=true]{background:var(--dsw-alias-interactive-bg-hover)}',
      '.ccpu-cell:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}',
      '.ccpu-rail .ccpu-cell{corner-shape:round;border-radius:50%;justify-content:center;gap:0;width:36px;height:36px;padding:0}',
      '.ccpu-mark{flex:none;display:inline-flex}',
      '.ccpu-metrics{display:flex;align-items:center;gap:8px;min-width:0;overflow:hidden;font-size:14px;line-height:22px}',
      '.ccpu-metric{display:inline-flex;align-items:center;gap:3px;white-space:nowrap;font-variant-numeric:tabular-nums}',
      '.ccpu-metric-label{color:var(--dsw-alias-label-secondary)}',
      '.ccpu-metric-value{font-weight:600}',
      '.ccpu-state{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.ccpu-state-muted{color:var(--dsw-alias-label-secondary)}',
      '.ccpu-state-error{color:var(--dsw-alias-state-error-primary)}',
      '.ccpu-dot{position:absolute;top:4px;right:4px;width:6px;height:6px;border-radius:999px;',
      'box-shadow:0 0 0 1px var(--dsw-specific-sidebar-fill,var(--dsw-alias-bg-base))}',
      `.ccpu-panel{isolation:isolate;z-index:30;width:${PANEL_WIDTH}px;max-width:calc(100vw - 24px);max-height:60vh;`,
      '--dsw-elevation-stroke-color:var(--dsw-alias-border-l1);box-shadow:var(--dsw-elevation-prominent);border:0;',
      'border-radius:12px;display:flex;flex-direction:column;position:fixed;overflow:hidden}',
      '.ccpu-panel:before{z-index:-1;border-radius:inherit;background:var(--dsw-specific-menu,var(--dsw-alias-bg-overlay));',
      'backdrop-filter:var(--dsw-menu-backdrop-filter);content:"";pointer-events:none;position:absolute;inset:0}',
      '.ccpu-header{box-sizing:border-box;flex:none;justify-content:space-between;align-items:center;min-height:44px;',
      'padding:6px 8px 6px 12px;display:flex}',
      '.ccpu-title{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:500;line-height:20px}',
      '.ccpu-refresh{width:32px;height:32px;color:var(--dsw-alias-label-tertiary);cursor:pointer;background:0 0;border:none;',
      'border-radius:999px;justify-content:center;align-items:center;padding:0;display:inline-flex}',
      '.ccpu-refresh:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}',
      '.ccpu-refresh:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}',
      '.ccpu-refresh:disabled{cursor:default;opacity:.6}',
      '.ccpu-refresh-icon{display:block}',
      '.ccpu-spin{animation:ccpu-spin .9s linear infinite;transform-origin:50% 50%}',
      '@keyframes ccpu-spin{to{transform:rotate(360deg)}}',
      '@media (prefers-reduced-motion:reduce){.ccpu-spin{animation:none}}',
      '.ccpu-body{flex:1;min-height:0;padding:0 12px 12px;overflow-y:auto}',
      '.ccpu-sub{display:flex;flex-wrap:wrap;gap:4px 10px;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}',
      '.ccpu-error{margin-top:8px;color:var(--dsw-alias-state-error-primary);font-size:12px;line-height:18px}',
      '.ccpu-warn{margin-top:8px;color:var(--dsw-alias-state-warn-primary);font-size:12px;line-height:18px}',
      '.ccpu-row{margin-top:12px}',
      '.ccpu-row-head{display:flex;align-items:baseline;justify-content:space-between;gap:8px;font-size:13px;line-height:20px}',
      '.ccpu-row-label{color:var(--dsw-alias-label-secondary)}',
      '.ccpu-row-value{font-variant-numeric:tabular-nums;font-weight:600}',
      '.ccpu-bar{height:4px;margin:6px 0;border-radius:999px;background:var(--dsw-alias-bg-layer-2);overflow:hidden}',
      '.ccpu-bar-fill{height:100%;border-radius:inherit;transition:width .3s ease}',
      '.ccpu-row-meta{display:flex;align-items:baseline;justify-content:space-between;gap:8px;',
      'color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;font-variant-numeric:tabular-nums}',
      '.ccpu-foot{display:flex;flex-direction:column;gap:2px;margin-top:12px;padding-top:8px;',
      'border-top:.5px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}',
    ].join('')

    return {
      inject: ['slots', 'locale'],
      /**
       * Register the dictionaries first (the row resolves text on its first render)
       * and then the sidebar-foot row.
       * @param ctx - client plugin context.
       */
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, DICTS), 'commandcode-plan-usage: dictionaries')
        ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
          name: 'sidebar.footer.action',
          id: NS,
          order: 5,
          locale: NS,
          inject: () => ({ localeFace: ctx.locale, translate: ctx.locale.bind(NS) }),
        }, CommandCodePlanUsage))
      },
    }
  },
})
