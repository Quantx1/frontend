/**
 * export — dependency-free CSV (Excel) + PDF (print) helpers (Phase 5D).
 *
 * CSV opens natively in Excel/Sheets. PDF is produced by the browser's own
 * "Save as PDF" via a clean, isolated print window (no jsPDF dependency, no
 * app chrome in the output). Both run entirely client-side.
 */

type Cell = string | number | null | undefined

function cellText(v: Cell): string {
  if (v === null || v === undefined) return ''
  return String(v)
}

function csvEscape(v: Cell): string {
  const s = cellText(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

const stamp = () => new Date().toISOString().slice(0, 10)

/** Download rows as a CSV file (opens in Excel). */
export function downloadCsv(filename: string, headers: string[], rows: Cell[][]): void {
  const lines = [headers.map(csvEscape).join(','), ...rows.map((r) => r.map(csvEscape).join(','))]
  const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}_${stamp()}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

const escHtml = (s: Cell) =>
  cellText(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/**
 * Open a clean, print-optimized report in a new window and trigger the browser
 * print dialog (→ "Save as PDF"). Rendered from a self-contained Blob HTML
 * document (isolated origin, no app chrome, no document.write).
 */
export function printReport(opts: {
  title: string
  subtitle?: string
  columns: string[]
  rows: Cell[][]
  note?: string
}): void {
  const { title, subtitle, columns, rows, note } = opts
  const head = columns.map((c, i) => `<th class="${i === 0 ? 'l' : 'r'}">${escHtml(c)}</th>`).join('')
  const bodyRows = rows
    .map(
      (r) =>
        `<tr>${r.map((c, i) => `<td class="${i === 0 ? 'l' : 'r'}">${escHtml(c)}</td>`).join('')}</tr>`,
    )
    .join('')
  const when = new Date().toLocaleString('en-IN')
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escHtml(title)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Inter, Segoe UI, sans-serif; color: #111; margin: 32px; }
  .brand { font-weight: 700; font-size: 18px; letter-spacing: -0.02em; }
  .brand span { color: #16a34a; }
  h1 { font-size: 20px; margin: 14px 0 2px; }
  .sub { color: #666; font-size: 12px; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { padding: 6px 10px; border-bottom: 1px solid #e5e7eb; }
  th { text-align: left; color: #666; font-weight: 600; border-bottom: 1.5px solid #d1d5db; }
  .r { text-align: right; font-variant-numeric: tabular-nums; }
  .l { text-align: left; }
  tr:nth-child(even) td { background: #fafafa; }
  .foot { margin-top: 18px; color: #999; font-size: 10px; }
  @media print { body { margin: 12mm; } }
</style></head><body>
  <div class="brand">Quant <span>X</span></div>
  <h1>${escHtml(title)}</h1>
  <div class="sub">${subtitle ? escHtml(subtitle) + ' · ' : ''}Generated ${escHtml(when)}</div>
  <table><thead><tr>${head}</tr></thead><tbody>${bodyRows}</tbody></table>
  ${note ? `<div class="foot">${escHtml(note)}</div>` : ''}
  <div class="foot">For educational purposes. Not investment advice. Markets carry risk.</div>
  <script>window.addEventListener('load', function () { setTimeout(function () { window.print() }, 300) })<\/script>
</body></html>`

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const w = window.open(url, '_blank', 'width=900,height=700')
  if (!w) {
    // Popup blocked — fall back to a same-tab navigation the user can print.
    URL.revokeObjectURL(url)
    return
  }
  // Revoke once the print window has had time to load the blob.
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
