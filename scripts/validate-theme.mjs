// WCAG contrast validator for the Quant X from-scratch palette.
// Usage: node validate-theme.mjs  → prints PASS/FAIL per pair, exits 1 on any FAIL.

const hex2rgb = (h) => {
  h = h.replace('#', '')
  if (h.length === 3) h = [...h].map((c) => c + c).join('')
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
}
const lum = ([r, g, b]) => {
  const f = (v) => {
    v /= 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
const contrast = (a, b) => {
  const [l1, l2] = [lum(hex2rgb(a)), lum(hex2rgb(b))].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}
// alpha-composite fg over bg (for tint chips like primary/10)
const comp = (fgHex, alpha, bgHex) => {
  const f = hex2rgb(fgHex), b = hex2rgb(bgHex)
  const m = f.map((v, i) => Math.round(v * alpha + b[i] * (1 - alpha)))
  return '#' + m.map((v) => v.toString(16).padStart(2, '0')).join('')
}

// ─── CANDIDATE PALETTE (FintechX v4) ─────────────────────────────
const D = { // dark — near-black terminal + glossy fintech blue accent
  main: '#0D0D0E', wrap: '#151517', hover: '#1E1E21', line: '#29292D', wrapLine: '#3B3B40',
  ink: '#F7F7F8', desc: '#D3D3D7', muted: '#96969E',
  primary: '#406AE4', primaryHover: '#3055C2', primaryText: '#8FB0FF',
  up: '#10B981', down: '#F5808C', warning: '#F0A94F',
}
const L = { // light — FintechX-native cool blue-grey + white cards
  main: '#EDF1F4', wrap: '#FFFFFF', hover: '#F4F7F9', line: '#DDE5ED', wrapLine: '#C8D4DE',
  ink: '#1D1D1D', desc: '#4D585F', muted: '#5F6B75',
  primary: '#406AE4', primaryHover: '#3055C2', primaryText: '#3459C9',
  up: '#0A6B50', down: '#B81C22', warning: '#9A4D00',
}

const checks = []
const add = (label, fg, bg, min) => checks.push({ label, fg, bg, min })

// DARK
add('D ink/main', D.ink, D.main, 12)
add('D desc/main', D.desc, D.main, 7)
add('D muted/main', D.muted, D.main, 4.5)
add('D muted/wrap', D.muted, D.wrap, 4.5)
add('D muted/hover(chip)', D.muted, D.hover, 4.0)
add('D primaryText/main', D.primaryText, D.main, 6)
add('D primaryText on primary/10 tint', D.primaryText, comp(D.primary, 0.10, D.main), 4.5)
add('D white ON primary (button)', '#FFFFFF', D.primary, 4.5)
add('D white ON primaryHover', '#FFFFFF', D.primaryHover, 4.5)
add('D up/main', D.up, D.main, 4.5)
add('D up/wrap', D.up, D.wrap, 4.5)
add('D up on up/10 chip', D.up, comp(D.up, 0.10, D.main), 4.2)
add('D down/main', D.down, D.main, 4.5)
add('D down/wrap', D.down, D.wrap, 4.5)
add('D down on down/10 chip', D.down, comp(D.down, 0.10, D.main), 4.2)
add('D warning/main', D.warning, D.main, 4.5)
add('D primary vs main (UI 1.4.11)', D.primary, D.main, 3)
add('D line vs main (visibility)', D.line, D.main, 1.25)
add('D line vs wrap (visibility)', D.line, D.wrap, 1.2)

// LIGHT
add('L ink/main', L.ink, L.main, 12)
add('L ink/wrap', L.ink, L.wrap, 12)
add('L desc/wrap', L.desc, L.wrap, 7)
add('L muted/wrap', L.muted, L.wrap, 4.5)
add('L muted/main', L.muted, L.main, 4.5)
add('L muted/hover(chip)', L.muted, L.hover, 4.2)
add('L primaryText/wrap', L.primaryText, L.wrap, 4.5)
add('L primaryText on primary/10 tint', L.primaryText, comp(L.primary, 0.10, L.wrap), 4.2)
add('L white ON primary (button)', '#FFFFFF', L.primary, 4.5)
add('L white ON primaryHover', '#FFFFFF', L.primaryHover, 4.5)
add('L up/wrap', L.up, L.wrap, 4.5)
add('L up on up/10 chip', L.up, comp(L.up, 0.10, L.wrap), 4.2)
add('L down/wrap', L.down, L.wrap, 4.5)
add('L down on down/10 chip', L.down, comp(L.down, 0.10, L.wrap), 4.2)
add('L up on up/20 chip', L.up, comp(L.up, 0.20, L.wrap), 4.5)
add('L down on down/20 chip', L.down, comp(L.down, 0.20, L.wrap), 4.5)
add('L warning/wrap', L.warning, L.wrap, 4.5)
add('L primary vs wrap (UI 1.4.11)', L.primary, L.wrap, 3)
add('L line vs wrap (visibility)', L.line, L.wrap, 1.2)
add('L wrap vs main (surface sep)', L.wrap, L.main, 1.02)

// gradient stops (white text sits on CTA gradient — 180deg glossy blue)
add('white on CTA mid stop #406AE4', '#FFFFFF', '#406AE4', 4.5)
add('white on CTA deep stop #3055C2', '#FFFFFF', '#3055C2', 4.5)
add('white on CTA sheen stop #5290F4 (UI)', '#FFFFFF', '#5290F4', 3)
add('D gradient-text tail on canvas', '#7FA3FF', D.main, 6)
add('L gradient-text tail on white', '#406AE4', L.wrap, 4.5)

let fail = 0
for (const c of checks) {
  const r = contrast(c.fg, c.bg)
  const ok = r >= c.min
  if (!ok) fail++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${c.label.padEnd(38)} ${r.toFixed(2)}:1  (min ${c.min})  ${c.fg} on ${c.bg}`)
}
console.log(fail ? `\n${fail} FAILURES` : '\nALL PASS')
process.exit(fail ? 1 : 0)
