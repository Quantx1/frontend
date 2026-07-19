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
  Loader2: "solar:refresh-bold",
  Sparkles: "solar:magic-stick-3-bold",
  TrendingUp: "solar:graph-up-bold",
  RefreshCw: "solar:refresh-bold",
  AlertTriangle: "solar:danger-triangle-bold",
  Activity: "solar:pulse-bold",
  TrendingDown: "solar:graph-down-bold",
  ArrowUpRight: "solar:arrow-right-up-bold",
  ArrowRight: "solar:arrow-right-bold",
  Layers: "solar:layers-minimalistic-bold",
  AlertCircle: "solar:danger-circle-bold",
  CheckCircle: "solar:check-circle-bold",
  Zap: "solar:bolt-bold",
  X: "solar:close-circle-bold",
  Target: "solar:target-bold",
  Check: "solar:check-circle-bold",
  ChevronDown: "solar:alt-arrow-down-bold",
  Search: "solar:magnifer-bold",
  Play: "solar:play-bold",
  Bell: "solar:bell-bold",
  CheckCircle2: "solar:check-circle-bold",
  Brain: "lucide:brain-circuit",
  Plus: "solar:add-square-bold",
  ArrowLeft: "solar:arrow-left-bold",
  Shield: "solar:shield-bold",
  Eye: "solar:eye-bold",
  Clock: "solar:clock-circle-bold",
  ChevronLeft: "solar:alt-arrow-left-bold",
  ChevronRight: "solar:alt-arrow-right-bold",
  BarChart3: "solar:chart-2-bold",
  ArrowDownRight: "solar:arrow-right-down-bold",
  Newspaper: "solar:feed-bold",
  Trash2: "solar:trash-bin-trash-bold",
  XCircle: "solar:close-circle-bold",
  Calendar: "solar:calendar-bold",
  Mail: "solar:letter-bold",
  Users: "solar:users-group-rounded-bold",
  Info: "solar:info-circle-bold",
  Bot: "solar:cpu-bolt-bold",
  Minus: "solar:minus-circle-bold",
  ArrowUp: "solar:arrow-up-bold",
  ScanLine: "solar:object-scan-bold",
  ShieldCheck: "solar:shield-check-bold",
  User: "solar:user-bold",
  Lock: "solar:lock-bold",
  Inbox: "solar:inbox-bold",
  LineChart: "solar:chart-2-bold",
  ExternalLink: "solar:square-arrow-right-up-bold",
  Settings: "solar:settings-bold",
  Download: "solar:download-bold",
  CreditCard: "solar:card-bold",
  Cpu: "solar:cpu-bold",
  Stethoscope: "solar:stethoscope-bold",
  Briefcase: "solar:case-bold",
  RotateCcw: "solar:refresh-bold",
  ShieldAlert: "solar:shield-warning-bold",
  Send: "solar:plain-bold",
  Gauge: "solar:spedometer-middle-bold",
  Crown: "solar:crown-bold",
  Scale: "solar:scale-bold",
  HelpCircle: "solar:question-circle-bold",
  ArrowDown: "solar:arrow-down-bold",
  Wallet: "solar:wallet-bold",
  Save: "solar:diskette-bold",
  EyeOff: "solar:eye-closed-bold",
  Menu: "solar:hamburger-menu-bold",
  DollarSign: "solar:dollar-minimalistic-bold",
  Server: "solar:server-bold",
  Globe: "solar:global-bold",
  FileText: "solar:document-text-bold",
  History: "solar:history-bold",
  Power: "solar:power-bold",
  PlayCircle: "solar:play-circle-bold",
  Calculator: "solar:calculator-bold",
  Pause: "solar:pause-bold",
  Percent: "solar:sale-bold",
  MessageSquare: "solar:chat-square-2-bold",
  LayoutDashboard: "solar:widget-bold",
  MessageCircle: "solar:chat-round-bold",
  LogOut: "solar:logout-2-bold",
  Home: "solar:home-2-bold",
  Wifi: "solar:wi-fi-router-round-bold",
  Database: "solar:database-bold",
  TableProperties: "solar:checklist-bold",
  Star: "solar:star-bold",
  Filter: "solar:filter-bold",
  Ban: "solar:forbidden-circle-bold",
  UserX: "solar:user-cross-rounded-bold",
  UserCheck: "solar:user-check-rounded-bold",
  BellOff: "solar:bell-off-bold",
  CheckCheck: "solar:check-read-bold",
  Copy: "solar:copy-bold",
  Wand2: "solar:magic-stick-3-bold",
  Layers3: "solar:layers-bold",
  Sigma: "lucide:sigma",
  Radio: "solar:radio-bold",
  Wrench: "solar:settings-bold",
  RotateCw: "solar:refresh-bold",
  PauseCircle: "solar:pause-circle-bold",
  ClipboardList: "solar:clipboard-list-bold",
  Bookmark: "solar:bookmark-bold",
  Flame: "solar:fire-bold",
  Trophy: "solar:cup-star-bold",
  FlaskConical: "solar:test-tube-bold",
  Monitor: "solar:monitor-bold",
  Moon: "solar:moon-bold",
  Sun: "solar:sun-2-bold",
  ArrowLeftRight: "solar:transfer-horizontal-bold",
  ScrollText: "solar:document-text-bold",
  Palette: "solar:palette-bold",
  Receipt: "solar:bill-list-bold",
  BellPlus: "solar:bell-bing-bold",
  Grid3x3: "solar:widget-bold",
  LayoutGrid: "solar:widget-bold",
  Hash: "solar:hashtag-bold",
  MoreVertical: "solar:menu-dots-bold",
  CircleDollarSign: "solar:dollar-bold",
  Phone: "solar:phone-rounded-bold",
  HeartPulse: "solar:heart-pulse-bold",
  Gift: "solar:gift-bold",
  Share2: "solar:share-bold",
  Compass: "solar:compass-bold",
  Settings2: "solar:settings-bold",
  PlusCircle: "solar:add-circle-bold",
  BookmarkCheck: "solar:bookmark-bold",
  CalendarDays: "solar:calendar-bold",
  Pencil: "solar:pen-2-bold",
  ClipboardCheck: "solar:clipboard-check-bold",
  CalendarRange: "solar:calendar-minimalistic-bold",
  Medal: "solar:medal-star-bold",
  Award: "solar:cup-star-bold",
  GitBranch: "solar:branching-paths-up-bold",
  UserPlus: "solar:user-plus-bold",
  Store: "solar:shop-bold",
  ScanSearch: "solar:magnifer-zoom-in-bold",
  Plug: "solar:plug-circle-bold",
  Unlink: "solar:link-broken-bold",
  SlidersHorizontal: "solar:slider-horizontal-bold",
  PanelLeftClose: "solar:sidebar-minimalistic-bold",
  GitCompare: "solar:scale-bold",
  Code2: "solar:code-2-bold",
  Gavel: "solar:scale-bold",
  ArrowDownLeft: "solar:arrow-left-down-bold",
  ArrowUpLeft: "solar:arrow-left-up-bold",
  AlertOctagon: "solar:danger-triangle-bold",
  ChevronsUpDown: "solar:sort-vertical-bold",
  BookOpen: "solar:book-bold",
  Building2: "solar:buildings-2-bold",
  Scissors: "solar:scissors-bold",
  Banknote: "solar:banknote-bold",
  Coins: "solar:money-bag-bold",
  Landmark: "solar:buildings-2-bold",
  AlignLeft: "solar:align-left-bold",
  Crosshair: "solar:target-bold",
  CornerDownRight: "solar:arrow-right-down-bold",
  Repeat: "solar:repeat-bold",
  Volume2: "solar:volume-loud-bold",
  Mountain: "solar:graph-up-bold",
  Instagram: "fa6-brands:instagram",
  Linkedin: "fa6-brands:linkedin",
  Twitter: "fa6-brands:x-twitter",
  Youtube: "fa6-brands:youtube",
}

// The full set of names the app imports (from the enumeration pass).
const NAMES = "Loader2,Sparkles,TrendingUp,RefreshCw,AlertTriangle,Activity,TrendingDown,ArrowUpRight,ArrowRight,Layers,AlertCircle,CheckCircle,Zap,X,Target,Check,ChevronDown,Search,Play,Bell,CheckCircle2,Brain,Plus,ArrowLeft,Shield,Eye,Clock,ChevronLeft,ChevronRight,BarChart3,ArrowDownRight,Newspaper,Trash2,XCircle,Calendar,Mail,Users,Info,Bot,Minus,ArrowUp,ScanLine,ShieldCheck,User,Lock,Inbox,LineChart,ExternalLink,Settings,Download,CreditCard,Cpu,Stethoscope,Briefcase,RotateCcw,ShieldAlert,Send,Gauge,Crown,Scale,HelpCircle,ArrowDown,Wallet,Save,EyeOff,Menu,DollarSign,Server,Globe,FileText,History,Power,PlayCircle,Calculator,Pause,Percent,MessageSquare,LayoutDashboard,MessageCircle,LogOut,Home,Wifi,Database,TableProperties,Star,Filter,Ban,UserX,UserCheck,BellOff,CheckCheck,Copy,Wand2,Layers3,Sigma,Radio,Wrench,RotateCw,PauseCircle,ClipboardList,Bookmark,Flame,Trophy,FlaskConical,Instagram,Linkedin,Twitter,Youtube,Monitor,Moon,Sun,ArrowLeftRight,ScrollText,Palette,Receipt,BellPlus,Grid3x3,LayoutGrid,Hash,MoreVertical,CircleDollarSign,Phone,HeartPulse,Gift,Share2,Compass,Settings2,PlusCircle,BookmarkCheck,CalendarDays,Pencil,ClipboardCheck,CalendarRange,Medal,Award,GitBranch,UserPlus,Store,ScanSearch,Plug,Unlink,SlidersHorizontal,PanelLeftClose,GitCompare,Code2,Gavel,ArrowDownLeft,ArrowUpLeft,AlertOctagon,ChevronsUpDown,BookOpen,Building2,Scissors,Banknote,Coins,Landmark,AlignLeft,Crosshair,CornerDownRight,Repeat,Volume2,Mountain".split(',')

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
