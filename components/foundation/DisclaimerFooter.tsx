// DisclaimerFooter (PR-V1) — SEBI inline disclaimer dropped at the bottom of
// every trading surface. `derivatives` variant carries the stronger F&O wording
// for /fno + the folded F&O Lab. `compact` is the point-of-action caption for
// backtest RESULT surfaces (past-performance caveat, sits directly under the
// result card). (Brand/compliance invariant.)
export function DisclaimerFooter({
  variant = 'standard',
  compact = false,
}: {
  variant?: 'standard' | 'derivatives'
  compact?: boolean
}) {
  if (compact) {
    return (
      <p className="pt-2 text-center text-[10px] leading-relaxed text-d-text-muted">
        Backtested on past data. Hypothetical results — not a guarantee of future returns. Not investment advice.
      </p>
    )
  }
  const text =
    variant === 'derivatives'
      ? 'For educational purposes only. Derivatives carry a high risk of loss and are not suitable for every investor. Not investment advice. Markets carry risk.'
      : 'For educational purposes. Not investment advice. Markets carry risk.'
  return <p className="pb-2 pt-1 text-center text-[10px] text-d-text-muted">{text}</p>
}
