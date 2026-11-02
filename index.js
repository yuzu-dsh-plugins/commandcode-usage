/**
 * Host half of the Command Code plan-usage bundle.
 *
 * One operation — read this machine's Command Code (commandcode.ai) plan usage —
 * serves two callers: the frame-wide capsule in the Web client, through the
 * authenticated Fetch route below, and the `commandcode_usage` agent tool. Both
 * call {@link readReport}, so the UI and the model never diverge.
 *
 * The credential is resolved per request through `ctx.credentials` (the managed
 * store, then the ambient layers), so a rotated key reaches the next refresh
 * without a plugin restart. Nothing here is cached: each caller asks, the Host
 * answers.
 *
 * @module dsh-commandcode-plan-usage
 */

import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

/** Row-configuration defaults; every field is overridable in `cordis.patch.yml`. */
const DEFAULT_CONFIG = {
  apiBase: 'https://api.commandcode.ai',
  apiKeyEnv: 'COMMANDCODE_API_KEY',
  timeoutMs: 12000,
  refreshMinutes: 5,
}

/** Command Code account endpoints, one report section each. */
const ENDPOINTS = [
  { section: 'account', path: '/alpha/whoami' },
  { section: 'usage', path: '/alpha/usage/summary' },
  { section: 'credits', path: '/alpha/billing/credits' },
  { section: 'subscription', path: '/alpha/billing/subscriptions' },
]

/** Authenticated Fetch route the Web capsule reads. */
const ROUTE_PATH = '/api/commandcode-plan/usage'

/** Agent tool sharing this host operation. */
const TOOL_NAME = 'commandcode_usage'

export const name = 'dsh-commandcode-plan-usage'

/** The route needs the Connection fetch registry; every other service is optional. */
export const inject = ['connection']

/**
 * Register the usage route and the agent tool.
 * @param ctx - Host plugin context carrying `connection`.
 * @param rawConfig - the bundle row's config, merged over {@link DEFAULT_CONFIG}.
 */
export function apply(ctx, rawConfig) {
  const config = { ...DEFAULT_CONFIG, ...(rawConfig ?? {}) }

  ctx.effect(() => ctx.connection.fetch.register({
    path: ROUTE_PATH,
    methods: ['GET'],
    requestBody: 'buffered',
    fetch: async (request) => {
      if (request.method !== 'GET') return new Response(null, { status: 405, headers: { allow: 'GET' } })
      return jsonResponse(await readReport(ctx, config, request.signal))
    },
  }), 'commandcode-plan-usage: usage route')

  const tools = ctx.get('tools')
  if (tools !== undefined && typeof tools.register === 'function') {
    ctx.effect(() => tools.register(agentTool(ctx, config)), 'commandcode-plan-usage: agent tool')
  }
}

/**
 * One report read: resolve the credential, call every endpoint, normalize.
 * @param ctx - Host plugin context.
 * @param config - resolved plugin config.
 * @param signal - caller cancellation.
 * @returns `{ ok: true, value }` with the normalized report, or `{ ok: false, error }`.
 */
async function readReport(ctx, config, signal) {
  const envName = text(config.apiKeyEnv) ?? DEFAULT_CONFIG.apiKeyEnv
  const credential = await resolveApiKey(ctx, config, envName)
  if (credential.key === '') {
    return failure('commandcode-usage/no-credential',
      `No Command Code API key is configured: the "${envName}" reference is unset and no Command Code CLI login was found.`,
      { envName })
  }

  const base = (text(config.apiBase) ?? DEFAULT_CONFIG.apiBase).replace(/\/+$/, '')
  const timeoutMs = finite(config.timeoutMs) ?? DEFAULT_CONFIG.timeoutMs
  const settled = await Promise.all(ENDPOINTS.map(async ({ section, path }) => {
    try {
      return { section, payload: await fetchJson(base + path, credential.key, timeoutMs, signal) }
    } catch (error) {
      return { section, failure: error instanceof Error ? error.message : String(error) }
    }
  }))

  if (settled.every((entry) => entry.failure !== undefined)) {
    return failure('commandcode-usage/request-failed',
      settled.map((entry) => `${entry.section}: ${entry.failure}`).join('; '),
      { envName })
  }
  return { ok: true, value: buildReport(settled, config, credential.source) }
}

/**
 * Resolve the API key, most explicit source first.
 * @param ctx - Host plugin context.
 * @param config - resolved plugin config.
 * @param envName - the environment-variable name to resolve as a credential reference.
 * @returns the key and a human-readable source label; an empty key means unconfigured.
 */
async function resolveApiKey(ctx, config, envName) {
  const configured = text(config.apiKey)
  if (configured !== undefined) return { key: configured, source: 'plugin config' }

  const credentials = ctx.get('credentials')
  if (credentials !== undefined && typeof credentials.resolve === 'function') {
    try {
      const resolved = await credentials.resolve(envName)
      const value = resolved === undefined ? undefined : text(resolved.value)
      if (value !== undefined) return { key: value, source: text(resolved.source) ?? `credential ${envName}` }
    } catch {
      // An unreadable store or an unusable reference falls through to the ambient sources.
    }
  }

  const ambient = text(process.env[envName])
  if (ambient !== undefined) return { key: ambient, source: `environment ${envName}` }

  const cliKey = readCommandCodeCliKey()
  if (cliKey !== undefined) return { key: cliKey, source: 'Command Code CLI login' }
  return { key: '', source: 'none' }
}

/**
 * Read the API key the Command Code CLI stored at login.
 * @returns the key, or undefined when that login file is absent or malformed.
 */
function readCommandCodeCliKey() {
  try {
    return text(JSON.parse(readFileSync(join(homedir(), '.commandcode', 'auth.json'), 'utf8'))?.apiKey)
  } catch {
    return undefined
  }
}

/**
 * One authenticated JSON request with a bounded deadline.
 * @param url - absolute endpoint URL.
 * @param apiKey - bearer credential.
 * @param timeoutMs - deadline in milliseconds.
 * @param parentSignal - caller cancellation, combined with the deadline.
 * @returns the decoded JSON body.
 */
async function fetchJson(url, apiKey, timeoutMs, parentSignal) {
  const controller = new AbortController()
  const onAbort = () => controller.abort(parentSignal?.reason)
  const timer = setTimeout(() => controller.abort(new Error(`timed out after ${timeoutMs} ms`)), timeoutMs)
  if (parentSignal !== undefined) {
    if (parentSignal.aborted) onAbort()
    else parentSignal.addEventListener('abort', onAbort, { once: true })
  }
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${apiKey}`,
        // The account API expects a client identity, not this plugin's version:
        // these are the headers the Command Code CLI sends for the same endpoints.
        'x-command-code-version': '1.0.0',
        'x-cli-environment': 'production',
      },
    })
    if (!response.ok) throw new Error(`${url} answered HTTP ${response.status}`)
    return await response.json()
  } finally {
    clearTimeout(timer)
    parentSignal?.removeEventListener('abort', onAbort)
  }
}

/**
 * Normalize the four endpoint payloads into the one shape the UI and the tool read.
 * @param settled - per-endpoint payload or failure.
 * @param config - resolved plugin config.
 * @param credentialSource - where the API key came from.
 * @returns the report value.
 */
function buildReport(settled, config, credentialSource) {
  const payloadOf = (section) => settled.find((entry) => entry.section === section)?.payload
  const user = record(payloadOf('account')?.user)
  const summary = record(payloadOf('usage'))
  const billing = record(payloadOf('credits'))
  const credits = record(billing?.credits)
  const limits = record(billing?.windowLimits)
  const sandbox = record(billing?.sandboxMinutes)
  const subscription = record(payloadOf('subscription')?.data) ?? record(payloadOf('subscription'))

  // The plan quota is not reported directly: this billing period's spend plus the
  // remaining monthly credits is the allowance the account started the period with.
  const spent = finite(summary?.totalMonthlyCredits) ?? finite(summary?.totalCredits)
  const remaining = finite(credits?.monthlyCredits)
  const quota = spent !== undefined && remaining !== undefined ? spent + remaining : undefined

  return {
    fetchedAt: new Date().toISOString(),
    refreshMs: Math.max(60_000, Math.round((finite(config.refreshMinutes) ?? DEFAULT_CONFIG.refreshMinutes) * 60_000)),
    credentialSource,
    account: {
      userName: text(user?.userName) ?? text(user?.name),
      email: text(user?.email),
    },
    plan: {
      id: text(subscription?.planId),
      status: text(subscription?.status),
      currentPeriodStart: text(subscription?.currentPeriodStart),
      currentPeriodEnd: text(subscription?.currentPeriodEnd),
      cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd === true,
    },
    windows: {
      fiveHour: windowOf(record(limits?.fiveHour)),
      weekly: windowOf(record(limits?.weekly)),
    },
    month: {
      spent,
      remaining,
      quota,
      percent: percentOf(spent, quota),
      periodStart: text(summary?.periodStart),
    },
    totals: {
      requests: finite(summary?.totalCount),
      successRate: finite(summary?.successRate),
      tokens: finite(summary?.totalTokens),
    },
    credits: {
      purchased: finite(credits?.purchasedCredits),
      free: finite(credits?.freeCredits),
      belowThreshold: credits?.belowThreshold === true,
      threshold: finite(credits?.creditThreshold),
    },
    sandbox: {
      access: billing?.sandboxAccess === true,
      usedMinutes: finite(sandbox?.usedMinutes),
      limitMinutes: finite(sandbox?.limitMinutes),
    },
    failures: settled
      .filter((entry) => entry.failure !== undefined)
      .map(({ section, failure }) => ({ section, message: failure })),
  }
}

/**
 * Normalize one window limit.
 * @param window - the endpoint's window object, when present.
 * @returns the window's used amount, cap, share, reset instant, and exceeded flag.
 */
function windowOf(window) {
  const used = finite(window?.used)
  const cap = finite(window?.cap)
  return {
    used,
    cap,
    percent: percentOf(used, cap),
    resetAt: finite(window?.resetAt),
    exceeded: window?.exceeded === true,
  }
}

/**
 * The agent tool over the same read.
 * @param ctx - Host plugin context.
 * @param config - resolved plugin config.
 * @returns the tool definition.
 */
function agentTool(ctx, config) {
  return {
    name: TOOL_NAME,
    description: 'Read the Command Code (commandcode.ai) plan usage for this machine: the 5-hour and weekly window consumption, this billing period\'s spend against the plan allowance, remaining credits, and the subscription state. Takes no arguments.',
    parameters: { type: 'object', properties: {}, additionalProperties: false },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value) }],
    },
    async execute(_args, exec) {
      const result = await readReport(ctx, config, exec?.signal)
      if (!result.ok) return `Command Code usage is unavailable: ${result.error.message}`
      return JSON.stringify(result.value, null, 2)
    },
  }
}

/**
 * Build one JSON response with the shared result envelope.
 * @param payload - `{ ok: true, value }` or `{ ok: false, error }`.
 * @returns the HTTP response.
 */
function jsonResponse(payload) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
}

/**
 * Build one failure result.
 * @param code - stable failure code the client localizes.
 * @param message - human diagnostic.
 * @param details - structured context.
 * @returns the failure envelope.
 */
function failure(code, message, details) {
  return { ok: false, error: { code, message, details } }
}

/**
 * Whether a value is a non-array object.
 * @param value - candidate.
 * @returns true for plain records.
 */
function record(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value : undefined
}

/**
 * Keep a non-empty string.
 * @param value - candidate.
 * @returns the string, or undefined.
 */
function text(value) {
  return typeof value === 'string' && value !== '' ? value : undefined
}

/**
 * Keep a finite number.
 * @param value - candidate.
 * @returns the number, or undefined.
 */
function finite(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

/**
 * Share of a cap, clamped to a percentage.
 * @param used - consumed amount.
 * @param cap - allowance.
 * @returns the clamped percentage, or undefined when either side is unusable.
 */
function percentOf(used, cap) {
  if (used === undefined || cap === undefined || cap <= 0) return undefined
  return Math.min(100, Math.max(0, (used / cap) * 100))
}
