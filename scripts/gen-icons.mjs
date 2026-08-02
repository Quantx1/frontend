// One-shot generator: build lib/icons.tsx — a lucide-compatible shim backed by
// Iconify, primarily Remix Icon (ri, our reference set), with Lucide
// (lucide) as the guaranteed fallback so no glyph can break.
//
//   node scripts/gen-icons.mjs
//
// Output: lib/icons.tsx (offline: icon bodies are bundled, no runtime API).
import fs from 'node:fs'
import path from 'node:path'

const ri = JSON.parse(fs.readFileSync('node_modules/@iconify-json/ri/icons.json', 'utf8'))
const lu = JSON.parse(fs.readFileSync('node_modules/@iconify-json/lucide/icons.json', 'utf8'))
const fab = JSON.parse(fs.readFileSync('node_modules/@iconify-json/fa6-brands/icons.json', 'utf8'))
const solar = JSON.parse(fs.readFileSync('node_modules/@iconify-json/solar/icons.json', 'utf8'))
// Multi-set: map values are FULL "prefix:name" ids (2026-07-13 → Solar primary,
// the modern AI-SaaS set; Lucide fallback; fa6-brands for social logos; ri kept
// available for the odd legacy glyph).
const SETS = { ri, lucide: lu, 'fa6-brands': fab, solar }

// Component name -> full Iconify id (Solar primary; lucide/fa6-brands where
// Solar lacks the concept). VERIFIED to resolve by scripts/gen-icons.mjs +
// a workflow grep-pass against the real sets.
const RI = {
  Loader2: "solar:refresh-linear",
  Sparkles: "solar:magic-stick-3-linear",
  TrendingUp: "solar:graph-up-linear",
  RefreshCw: "solar:refresh-linear",
  AlertTriangle: "solar:danger-triangle-linear",
  Activity: "solar:pulse-linear",
  TrendingDown: "solar:graph-down-linear",
  ArrowUpRight: "solar:arrow-right-up-linear",
  ArrowRight: "solar:arrow-right-linear",
  Layers: "solar:layers-minimalistic-linear",
  AlertCircle: "solar:danger-circle-linear",
  CheckCircle: "solar:check-circle-linear",
  Zap: "solar:bolt-linear",
  X: "solar:close-circle-linear",
  Target: "solar:target-linear",
  Check: "solar:check-circle-linear",
  ChevronDown: "solar:alt-arrow-down-linear",
  Search: "solar:magnifer-linear",
  Play: "solar:play-linear",
  Bell: "solar:bell-linear",
  CheckCircle2: "solar:check-circle-linear",
  Brain: "lucide:brain-circuit",
  BrainCircuit: "lucide:brain-circuit",
  Radar: "lucide:radar",
  Plus: "solar:add-square-linear",
  ArrowLeft: "solar:arrow-left-linear",
  Shield: "solar:shield-linear",
  Eye: "solar:eye-linear",
  Clock: "solar:clock-circle-linear",
  ChevronLeft: "solar:alt-arrow-left-linear",
  ChevronRight: "solar:alt-arrow-right-linear",
  BarChart3: "solar:chart-2-linear",
  ArrowDownRight: "solar:arrow-right-down-linear",
  Newspaper: "solar:feed-linear",
  Trash2: "solar:trash-bin-trash-linear",
  XCircle: "solar:close-circle-linear",
  Calendar: "solar:calendar-linear",
  Mail: "solar:letter-linear",
  Users: "solar:users-group-rounded-linear",
  Info: "solar:info-circle-linear",
  Bot: "solar:cpu-bolt-linear",
  Minus: "solar:minus-circle-linear",
  ArrowUp: "solar:arrow-up-linear",
  ScanLine: "solar:object-scan-linear",
  ShieldCheck: "solar:shield-check-linear",
  User: "solar:user-linear",
  Lock: "solar:lock-linear",
  Inbox: "solar:inbox-linear",
  LineChart: "solar:chart-2-linear",
  ExternalLink: "solar:square-arrow-right-up-linear",
  Settings: "solar:settings-linear",
  Download: "solar:download-linear",
  CreditCard: "solar:card-linear",
  Cpu: "solar:cpu-linear",
  Stethoscope: "solar:stethoscope-linear",
  Briefcase: "solar:case-linear",
  RotateCcw: "solar:refresh-linear",
  ShieldAlert: "solar:shield-warning-linear",
  Send: "solar:plain-linear",
  Gauge: "solar:spedometer-middle-linear",
  Crown: "solar:crown-linear",
  Scale: "solar:scale-linear",
  HelpCircle: "solar:question-circle-linear",
  ArrowDown: "solar:arrow-down-linear",
  Wallet: "solar:wallet-linear",
  Save: "solar:diskette-linear",
  EyeOff: "solar:eye-closed-linear",
  Menu: "solar:hamburger-menu-linear",
  DollarSign: "solar:dollar-minimalistic-linear",
  Server: "solar:server-linear",
  Globe: "solar:global-linear",
  FileText: "solar:document-text-linear",
  History: "solar:history-linear",
  Power: "solar:power-linear",
  PlayCircle: "solar:play-circle-linear",
  Calculator: "solar:calculator-linear",
  Pause: "solar:pause-linear",
  Percent: "solar:sale-linear",
  MessageSquare: "solar:chat-square-2-linear",
  LayoutDashboard: "solar:widget-linear",
  MessageCircle: "solar:chat-round-linear",
  LogOut: "solar:logout-2-linear",
  Home: "solar:home-2-linear",
  Wifi: "solar:wi-fi-router-round-linear",
  Database: "solar:database-linear",
  TableProperties: "solar:checklist-linear",
  Star: "solar:star-linear",
  Filter: "solar:filter-linear",
  Ban: "solar:forbidden-circle-linear",
  UserX: "solar:user-cross-rounded-linear",
  UserCheck: "solar:user-check-rounded-linear",
  BellOff: "solar:bell-off-linear",
  CheckCheck: "solar:check-read-linear",
  Copy: "solar:copy-linear",
  Wand2: "solar:magic-stick-3-linear",
  Layers3: "solar:layers-linear",
  Sigma: "lucide:sigma",
  Radio: "solar:radio-linear",
  Wrench: "solar:settings-linear",
  RotateCw: "solar:refresh-linear",
  PauseCircle: "solar:pause-circle-linear",
  ClipboardList: "solar:clipboard-list-linear",
  Bookmark: "solar:bookmark-linear",
  Flame: "solar:fire-linear",
  Trophy: "solar:cup-star-linear",
  FlaskConical: "solar:test-tube-linear",
  Monitor: "solar:monitor-linear",
  Moon: "solar:moon-linear",
  Sun: "solar:sun-2-linear",
  ArrowLeftRight: "solar:transfer-horizontal-linear",
  ScrollText: "solar:document-text-linear",
  Palette: "solar:palette-linear",
  Receipt: "solar:bill-list-linear",
  BellPlus: "solar:bell-bing-linear",
  Grid3x3: "solar:widget-linear",
  LayoutGrid: "solar:widget-linear",
  Hash: "solar:hashtag-linear",
  MoreVertical: "solar:menu-dots-linear",
  CircleDollarSign: "solar:dollar-linear",
  Phone: "solar:phone-rounded-linear",
  HeartPulse: "solar:heart-pulse-linear",
  Gift: "solar:gift-linear",
  Share2: "solar:share-linear",
  Compass: "solar:compass-linear",
  Settings2: "solar:settings-linear",
  PlusCircle: "solar:add-circle-linear",
  BookmarkCheck: "solar:bookmark-linear",
  CalendarDays: "solar:calendar-linear",
  Pencil: "solar:pen-2-linear",
  ClipboardCheck: "solar:clipboard-check-linear",
  CalendarRange: "solar:calendar-minimalistic-linear",
  Medal: "solar:medal-star-linear",
  Award: "solar:cup-star-linear",
  GitBranch: "solar:branching-paths-up-linear",
  UserPlus: "solar:user-plus-linear",
  Store: "solar:shop-linear",
  ScanSearch: "solar:magnifer-zoom-in-linear",
  Plug: "solar:plug-circle-linear",
  Unlink: "solar:link-broken-linear",
  SlidersHorizontal: "solar:slider-horizontal-linear",
  PanelLeftClose: "solar:sidebar-minimalistic-linear",
  GitCompare: "solar:scale-linear",
  Code2: "solar:code-2-linear",
  Gavel: "solar:scale-linear",
  ArrowDownLeft: "solar:arrow-left-down-linear",
  ArrowUpLeft: "solar:arrow-left-up-linear",
  AlertOctagon: "solar:danger-triangle-linear",
  ChevronsUpDown: "solar:sort-vertical-linear",
  BookOpen: "solar:book-linear",
  Building2: "solar:buildings-2-linear",
  Scissors: "solar:scissors-linear",
  Banknote: "solar:banknote-linear",
  Coins: "solar:money-bag-linear",
  Landmark: "solar:buildings-2-linear",
  AlignLeft: "solar:align-left-linear",
  Crosshair: "solar:target-linear",
  CornerDownRight: "solar:arrow-right-down-linear",
  Repeat: "solar:repeat-linear",
  Volume2: "solar:volume-loud-linear",
  Mountain: "solar:graph-up-linear",
  Instagram: "fa6-brands:instagram",
  Linkedin: "fa6-brands:linkedin",
  Twitter: "fa6-brands:x-twitter",
  Youtube: "fa6-brands:youtube",
}

// The full set of names the app imports (from the enumeration pass).
const NAMES = "Loader2,Sparkles,TrendingUp,RefreshCw,AlertTriangle,Activity,TrendingDown,ArrowUpRight,ArrowRight,Layers,AlertCircle,CheckCircle,Zap,X,Target,Check,ChevronDown,Search,Play,Bell,CheckCircle2,Brain,Plus,ArrowLeft,Shield,Eye,Clock,ChevronLeft,ChevronRight,BarChart3,ArrowDownRight,Newspaper,Trash2,XCircle,Calendar,Mail,Users,Info,Bot,Minus,ArrowUp,ScanLine,ShieldCheck,User,Lock,Inbox,LineChart,ExternalLink,Settings,Download,CreditCard,Cpu,Stethoscope,Briefcase,RotateCcw,ShieldAlert,Send,Gauge,Crown,Scale,HelpCircle,ArrowDown,Wallet,Save,EyeOff,Menu,DollarSign,Server,Globe,FileText,History,Power,PlayCircle,Calculator,Pause,Percent,MessageSquare,LayoutDashboard,MessageCircle,LogOut,Home,Wifi,Database,TableProperties,Star,Filter,Ban,UserX,UserCheck,BellOff,CheckCheck,Copy,Wand2,Layers3,Sigma,Radio,Wrench,RotateCw,PauseCircle,ClipboardList,Bookmark,Flame,Trophy,FlaskConical,Instagram,Linkedin,Twitter,Youtube,Monitor,Moon,Sun,ArrowLeftRight,ScrollText,Palette,Receipt,BellPlus,Grid3x3,LayoutGrid,Hash,MoreVertical,CircleDollarSign,Phone,HeartPulse,Gift,Share2,Compass,Settings2,PlusCircle,BookmarkCheck,CalendarDays,Pencil,ClipboardCheck,CalendarRange,Medal,Award,GitBranch,UserPlus,Store,ScanSearch,Plug,Unlink,SlidersHorizontal,PanelLeftClose,GitCompare,Code2,Gavel,ArrowDownLeft,ArrowUpLeft,AlertOctagon,ChevronsUpDown,BookOpen,Building2,Scissors,Banknote,Coins,Landmark,AlignLeft,Crosshair,CornerDownRight,Repeat,Volume2,Mountain,BrainCircuit,Radar".split(',')

const camelKebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/([A-Z])([A-Z][a-z])/g, '$1-$2').toLowerCase()

function luResolve(kebab) {
  if (lu.icons[kebab]) return kebab
  if (lu.aliases && lu.aliases[kebab]) return lu.aliases[kebab].parent
  return null
}
function iconData(prefix, name) {
  const src = SETS[prefix]
  if (!src) return null
  const ic = src.icons[name]
  if (!ic) return null
  return { body: ic.body, width: ic.width || src.width || 24, height: ic.height || src.height || 24 }
}

const out = []
let riCount = 0, luCount = 0, miss = []
for (const name of NAMES) {
  let chosen = null, id = null
  const cand = RI[name]
  if (cand) {
    const i = cand.indexOf(':')
    const [pfx, nm] = i >= 0 ? [cand.slice(0, i), cand.slice(i + 1)] : ['ri', cand]
    if (SETS[pfx] && SETS[pfx].icons[nm]) { chosen = iconData(pfx, nm); id = pfx + ':' + nm; riCount++ }
  }
  if (!chosen) {
    const k = luResolve(camelKebab(name))
    if (k) { chosen = iconData('lucide', k); id = 'lucide:' + k; luCount++ }
  }
  if (!chosen) { miss.push(name); continue }
  out.push({ name, id, ...chosen, set: id.split(':')[0] })
}

// Emit lib/icons.tsx — registry keyed by id, so dedupe (many lucide names can
// share one Remix glyph, e.g. TrendingUp/TrendingDown/LineChart).
const seenIds = new Set()
const reg = out.filter(o => !seenIds.has(o.id) && seenIds.add(o.id))
  .map(o => `  ${JSON.stringify(o.id)}: { body: ${JSON.stringify(o.body)}, width: ${o.width}, height: ${o.height} },`).join('\n')
const exports = out.map(o => `export const ${o.name} = make(${JSON.stringify(o.id)})`).join('\n')

const file = `'use client'
/* AUTO-GENERATED by scripts/gen-icons.mjs — do not edit by hand.
 * lucide-compatible icon shim backed by Iconify: Solar (the modern AI-SaaS set)
 * as primary, with Lucide as the guaranteed fallback and fa6-brands for social
 * logos. Offline: icon bodies are bundled here, so there is no runtime API/flash.
 * ${out.length} icons (${riCount} Solar/brand · ${luCount} Lucide-fallback). */
import type { ComponentType } from 'react'

const DATA: Record<string, { body: string; width: number; height: number }> = {
${reg}
}

export interface IconProps {
  size?: number | string
  className?: string
  color?: string
  strokeWidth?: number | string
  style?: React.CSSProperties
  'aria-hidden'?: boolean | 'true' | 'false'
  'aria-label'?: string
  onClick?: React.MouseEventHandler
  [key: string]: unknown
}
export type LucideIcon = ComponentType<IconProps>
export type LucideProps = IconProps

function make(id: string): LucideIcon {
  // strokeWidth is a lucide concept; Remix glyphs are fixed-weight, so it is ignored.
  // Rendered as a plain inline <svg> (not @iconify/react's <Icon>) so server and
  // client markup are identical — the iconify component mounts client-side only,
  // which caused hydration mismatches under Next SSR.
  const d = DATA[id]
  function I({ size = 24, className, color, strokeWidth: _sw, style, ...rest }: IconProps) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox={\`0 0 \${d.width} \${d.height}\`}
        className={className}
        style={color ? { color, ...style } : style}
        {...rest}
        dangerouslySetInnerHTML={{ __html: d.body }}
      />
    )
  }
  I.displayName = id
  return I
}

${exports}
`
fs.mkdirSync('lib', { recursive: true })
fs.writeFileSync('lib/icons.tsx', file)
console.log(`wrote lib/icons.tsx — ${out.length} icons (${riCount} Remix, ${luCount} Lucide-fallback)`)
if (miss.length) console.log('MISSING (no ri or lucide match!):', miss.join(', '))
