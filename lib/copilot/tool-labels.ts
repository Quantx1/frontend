/**
 * Brand-safe tool labels — the client half of the backend's firewall.
 *
 * ── Why this file exists ───────────────────────────────────────────────────
 * `meta.tools_used` carries RAW tool names (`get_verdict`, `get_stock_snapshot`)
 * because the agent needs them internally. Everything the user sees is supposed
 * to go through a public label — the backend enforces this for step labels and
 * references via `_TOOL_PUBLIC_LABEL`, and its docblock calls the raw-name leak
 * the "highest-frequency failure".
 *
 * It leaked anyway, within an hour of `TurnDisclosure` being written, because
 * the transform lived at the CALL SITES: one of three passed `tools` straight
 * through and a chip reading `get_verdict` shipped to the browser. A firewall
 * that depends on every caller remembering is not a firewall.
 *
 * So `TurnDisclosure` applies this itself and takes raw names by contract.
 * There is nothing for a call site to forget.
 *
 * ── The old map matched almost nothing ─────────────────────────────────────
 * The previous version keyed on words like `signals` / `portfolio` / `scanner`
 * and reached them by stripping everything after the first `_`. Every backend
 * tool is named `get_*` or `run_*`, so that strip produced `get` or `run` for
 * all of them, missed the map entirely, and fell through to title-casing the
 * raw name — `get_verdict` → "Get Verdict". Presentable, and still a raw tool
 * name with a capital letter on it.
 *
 * These keys are the real tool names, mirroring `_TOOL_PUBLIC_LABEL` in
 * `backend/ai/agents/copilot.py`. Keep the two in step when adding a tool.
 */

const TOOL_LABEL: Record<string, string> = {
  get_portfolio: 'Your book',
  get_watchlist: 'Watchlist',
  get_signal: 'Signal detail',
  get_todays_signals: "Today's signals",
  get_stock_snapshot: 'Price data',
  explain_move: 'Move drivers',
  get_current_regime: 'Market regime',
  suggest_options_strategy: 'Options structure',
  get_fundamentals: 'Fundamentals',
  get_technicals: 'Technicals',
  get_verdict: 'Indicator read',
  get_news_sentiment: 'News mood',
  get_fno_snapshot: 'Option chain',
  get_sector_performance: 'Sector rotation',
  get_fii_dii_flow: 'FII/DII flow',
  run_screen: 'Screener',
  run_fundamental_screen: 'Fundamentals',
  compile_strategy: 'Strategy Studio',
  get_my_strategies: 'Your strategies',
}

/**
 * One raw tool name → its public label.
 *
 * An unknown tool falls back to a GENERIC string, never to a prettified
 * version of the raw name. A new backend tool that nobody added here should
 * read as "Market data" — vague — rather than "Get Verdict", which is the
 * internal name wearing title case and is exactly what the firewall exists to
 * stop. Vague is a missing label; prettified is a leaked one.
 */
export function toolLabel(name: string): string {
  return TOOL_LABEL[name.toLowerCase()] ?? 'Market data'
}

/** Deduped public labels, capped at six. Order is the agent's plan order. */
export function prettyTools(tools: readonly string[]): string[] {
  return Array.from(new Set(tools.map(toolLabel))).slice(0, 6)
}
