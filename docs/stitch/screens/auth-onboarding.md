# Auth, onboarding & callbacks

> Part of the Quant X as-built screen inventory — see [`../03-SCREEN-INVENTORY.md`](../03-SCREEN-INVENTORY.md)
> for the full index and [`../01-DESIGN-SYSTEM.md`](../01-DESIGN-SYSTEM.md) for every token used below.

**13 surfaces.**

## Family notes

SHELL: none of these 13 screens use the authed AppShell. There is NO sidebar, NO 72px right icon rail, NO ComplianceFooter, NO command palette anywhere in this scope. There is no route-group layout under app/login, app/signup, app/forgot-password, app/verify-email, app/auth, app/broker or app/onboarding — only app/layout.tsx (html + body.font-sans.bg-main.antialiased.noise-overlay, Geist Sans + Geist Mono vars, min-h-screen wrapper) and app/providers.tsx.

THEME FORK — CRITICAL: components/auth/AuthLayout.tsx puts `light-landing` + `bg-hero-sky` on its root. `.light-landing` re-declares the entire LIGHT token block (identical to html.light), so /login, /signup step 1, /forgot-password and /verify-email are ALWAYS LIGHT regardless of next-themes state. Their page canvas is the sky gradient `linear-gradient(180deg,#bfe0f8 0%,#e8f4fd 100%)`, not #EDF1F4. Every other screen in this scope (signup steps 2-3, /auth/callback, /broker/callback, all three /onboarding routes) follows the app theme (next-themes defaultTheme="system", dark is :root default).

AS-BUILT INCONSISTENCIES worth preserving or fixing deliberately: (1) login's Google button is `glass-control` + `rounded-full`; signup's is `rounded-xs` (6px) + `border-line bg-white/[0.03] shadow-glass` — two different treatments of the same control. (2) login's primary is `glass-control-accent` (flat #406AE4) + rounded-full; signup's is `bg-gradient-cta` + rounded-xs; forgot-password's is `bg-primary` + rounded-md. Three primary-button recipes across four auth screens. (3) The "or" divider chip uses `bg-main`, which under light-landing is #EDF1F4 — a grey chip on the white card, visibly not matching. (4) login/signup inputs use `bg-main` (#EDF1F4 well); forgot-password's input uses `bg-wrap` (#FFFFFF). (5) login/signup inputs are wrapped in `.input-animated-wrapper` (rotating conic-gradient border on focus, 4s linear, radius 8px); forgot-password's is not. (6) Signup steps 2-3 abandon AuthLayout entirely and switch to the dark app theme mid-flow at max-w-4xl.

GLOBAL OVERLAYS ON THESE ROUTES: sonner <Toaster theme="system" position="top-right"> with background var(--color-wrap), 1px solid var(--color-line), 8px radius. OfflineBanner renders nothing while online; when offline it is a fixed top strip (z-60, border-b line, bg-wrap, 12.5px) reading "You're offline — showing the last loaded data. We'll reconnect automatically." GlobalCopilot is regex-excluded on /login|/signup|/forgot-password|/verify-email|/auth/*|/onboarding/* — but /broker/callback is NOT excluded, so an authed user sees the Copilot dock/mobile FAB floating over the broker callback card.

ROUTING/GATING: middleware.ts publicPaths includes /login, /signup, /forgot-password, /verify-email, /auth/callback, /broker/callback. /onboarding/* is NOT public — production requires an sb-*-auth-token cookie or it 302s to /login?redirect=<path>. ClientAuthGate's PROTECTED_PREFIXES does NOT list /onboarding, so the client gate leaves onboarding alone. Entry into onboarding is app/(platform)/layout.tsx: on mount it reads getOnboardingStatus() and `router.replace('/onboarding/broker-connect')` when !completed. Flow order is broker-connect (Step 1) → risk-quiz (Step 2, un-numbered in its own header) → /onboarding/complete (Step 3). /onboarding/telegram 301s to /onboarding/risk-quiz.

TOKENS ACTUALLY IN USE HERE: `.glass-control` = bg var(--color-surface-2) (#F4F7F9 light / #1E1E21 dark) + 1px var(--color-line); `.glass-control-accent` = solid #406AE4 fill, white ink, 1px #406AE4, elev-1, hover #3055C2; `.trading-surface` = bg-wrap + 1px line + radius 12px + elev-1 + 20px padding; `.lg-surface` = bg-wrap + 1px line + elev-1 (no radius of its own); `.bg-gradient-cta` = linear-gradient(110deg,#3B82F6 0%,#406AE4 100%) with `.text-on-signature` = #FFFFFF. `.numeric` / `.num-display` = Geist Mono tabular-nums. `animate-fade-in-up` = opacity 0→1 + translateY(20px)→0 over 400ms ease-out. Radius classes map: xs 6px, sm 8px, md 12px, lg 16px, full 9999px. Foundation Button sizes: sm h-28px, md h-32px, lg h-40px, all radius 8px, active:scale-.98. Foundation Card: radius 12px, bg-wrap, 1px line, flush (no shadow) by default; CardHeader min-h 44px with a bottom hairline and a 16px/600/-0.01em title; CardBody/Header/Footer padding 20px x 16px at default density.

BROKER COMPONENT NOTE: components/broker/BrokerConnectTile.tsx is NOT rendered by /onboarding/broker-connect — the onboarding page hand-rolls its own compact list rows. BrokerConnectTile is the Settings → Broker tab tile (trading-surface card, 40px white logo chip with ring-line, StatusPill with four tones — Connected up/CheckCircle2, Expired warning/AlertCircle, Error down/AlertCircle, Not connected muted — a green "1-click" Zap pill on OAuth brokers, a muted "Beta" pill on fyers/dhan/kotakneo/aliceblue, an Account + Last-sync hairline row when connected, and a Disconnect/Connect pair). Its exported ordering constants are OAUTH_BROKERS = ['zerodha','upstox','fyers'] and TOKEN_BROKERS = ['angelone','dhan','kotakneo','aliceblue'] — the onboarding page renders in exactly that order.

ICON SET: all glyphs come from '@/lib/icons' (lucide re-export). GoogleLogo is a hand-inlined 48x48 four-path Google "G" (#FFC107, #FF3D00, #4CAF50, #1976D2), NOT lucide's Chrome. QuantXMark is a 40x40 SVG: rounded-square tile (rx 11.5) filled with linear-gradient #5B8DEF→#3457C9, a white top sheen, three white rotated ellipse orbits (rx 13.5 ry 5.6 at 30/90/150 deg) and a glowing nucleus.

---

## `/login` — Sign In

**File** `app/login/page.tsx` · **201 LOC** · **Access** public (middleware publicPaths). No tier or broker gate.

**Shell** — components/auth/AuthLayout.tsx — two-pane split, forced LIGHT theme (.light-landing) on a sky gradient. No AppShell, no sidebar, no footer.

**Purpose.** Returning trader signs in with Google or email + password. The left pane sells the product with three honest coverage stats; the right card is the only interactive region. On success the user is dropped straight into /copilot, never a dashboard.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Page canvas** | div.light-landing.flex.min-h-screen.bg-hero-sky — background linear-gradient(180deg,#bfe0f8 0%,#e8f4fd 100%). .light-landing pins the LIGHT token set (canvas #EDF1F4, cards #FFFFFF, hairline #DDE5ED, ink #1D1D1D/#4D585F/#5F6B75, accent fill #406AE4, accent ink #3459C9) even when the app theme is dark. |
| 2 | **Left brand pane (lg+ only)** | hidden lg:flex lg:w-[45%], relative overflow-hidden, inner flex column justify-between with p-10 (40px) xl:p-14 (56px). Three stacked blocks: logo, pitch, copyright. |
| 3 | **Brand lockup** | Link to / — QuantXMark SVG at h-10 w-10 (40px) with drop-shadow 0 2px 8px rgba(58,119,229,0.35); to its right a two-line stack: 'Quant X' at 18px/700 tracking-tight #1D1D1D, and 'Trading Intelligence' at 9px/500 uppercase, letter-spacing 0.15em, #5F6B75. |
| 4 | **Pitch headline** | h1.font-display, text-3xl (30px) → xl:text-4xl (36px), font-semibold, leading-tight, tracking-tight, #1D1D1D, mb-5. Login passes no title prop so the AuthLayout defaults render: 'AI-Powered Trading Intelligence'. |
| 5 | **Pitch subline** | p max-w-sm (384px), 16px/relaxed, #4D585F — default subtitle 'Advanced stock screening and swing trading signals for the Indian market.' |
| 6 | **Security illustration tile** | mt-8, max-w-[340px], rounded-lg (16px), bg-main (#EDF1F4), p-2.5 (10px); inside a next/image of /v4/illus/security.png at 1024x1024 source, rendered w-full rounded-lg, priority, sizes '(min-width:1024px) 320px, 0px', alt='' aria-hidden. |
| 7 | **Proof stat row** | mt-10 flex gap-8 — exactly 3 stats, no dividers. Value uses .num-display (Geist Mono, tabular, -0.02em) at text-xl (20px)/700 #1D1D1D; label mt-0.5 at 10px/500 uppercase tracking-wider #5F6B75. Values: '5 / AI engines', '1,800+ / NSE stocks', '₹10L / Paper, free'. |
| 8 | **Copyright** | p text-xs (12px) #5F6B75 pinned to the bottom of the pane: '© {current year} Quant X Technologies. All rights reserved.' |
| 9 | **Right form pane** | flex-1, items-center justify-center, p-6 (24px) sm:p-8 (32px). Card = .lg-surface w-full max-w-md (448px) rounded-lg (16px) p-6 sm:p-8 → #FFFFFF fill, 1px #DDE5ED border, elev-1 shadow (0 1px 2px rgba(29,29,29,.04), 0 4px 12px -6px rgba(29,29,29,.10)). |
| 10 | **Mobile logo (below lg)** | Inside the card, mb-8, centered, lg:hidden — QuantXMark 40px + 'Quant X' at text-xl (20px)/700 tracking-tight. |
| 11 | **Card heading block** | Wrapped in .animate-fade-in-up (opacity 0→1, translateY 20px→0, 400ms ease-out). mb-8: h1 'Welcome back' text-2xl (24px)/700 tracking-tight #1D1D1D; p mt-2 text-sm (14px) #4D585F 'Sign in to your trading workspace'. |
| 12 | **Google button** | .glass-control (bg #F4F7F9, 1px #DDE5ED), mb-6, w-full, rounded-full, px-6 py-3, 14px/500 #1D1D1D, gap-3, centered. Content: 20px multicolour Google G (GoogleLogo) + 'Continue with Google'. Loading swaps to a 20px spinning Loader2. active:scale-[0.99], 150ms transform/filter transition, disabled:opacity-50. |
| 13 | **Divider** | mb-6 relative: absolute full-width 1px top border #DDE5ED, and a centered chip span with bg-main (#EDF1F4) px-4, 14px, #5F6B75, reading 'or'. |
| 14 | **Email field** | label mb-2 14px/500 #1D1D1D 'Email Address'. Field sits in .input-animated-wrapper (8px radius; a 1px conic-gradient ring of --color-primary at 65%/12% alternating fades in on focus-within and rotates over 4s linear). Mail icon 16px absolute left-3.5 (14px) vertically centred #5F6B75. input w-full rounded-md (12px), 1px #DDE5ED, bg-main #EDF1F4, py-3 pl-11 pr-4, 14px, placeholder 'you@example.com' in #5F6B75; focus:border #406AE4 + ring-2 ring-primary/20. Error line mt-1 12px #B81C22. |
| 15 | **Password field** | Same recipe with a Lock icon and pr-12; placeholder 'Enter your password'. A ghost toggle button at right-3.5 swaps Eye ↔ EyeOff (16px, #5F6B75 → #1D1D1D on hover) and flips input type between password and text. Error line mt-1 12px #B81C22. |
| 16 | **Remember / forgot row** | flex justify-between items-center. Left: a 16px checkbox (rounded, border-line, accent-color #406AE4) + 'Remember me' 14px #4D585F, whole row is a cursor-pointer label. Right: Link to /forgot-password, 14px/500, accent ink #3459C9 — 'Forgot password?'. |
| 17 | **Submit button** | .glass-control-accent — solid #406AE4 fill, 1px #406AE4, white ink, elev-1, hover #3055C2. w-full, rounded-full, px-6 py-3, 14px/700, gap-2, active:scale-[0.99]. Content 'Sign In' + ArrowRight 16px; loading swaps to a 20px spinning Loader2; disabled:opacity-50 + not-allowed cursor. |
| 18 | **Sign-up footer** | p mt-8 centered 14px #4D585F: “Don't have an account? ” followed by Link /signup at 500 weight accent ink #3459C9 — 'Create one now'. |

**Components** — `components/auth/AuthLayout.tsx` · `components/brand/QuantXMark.tsx` · `components/icons/GoogleLogo.tsx` · `lib/icons (Mail, Lock, Eye, EyeOff, ArrowRight, Loader2)` · `react-hook-form + zodResolver (inline schema)` · `sonner toast (via app/providers.tsx ThemedToaster)`

**States & data.** No data fetch, no skeleton, no empty state — the form renders immediately. Two independent busy states: isGoogleLoading (Google button → spinner) and isLoading (submit → spinner); each only disables its own control. Zod validation runs on submit: email 'Please enter a valid email address', password 'Password must be at least 6 characters', rendered as 12px #B81C22 lines under the field. Success path: signIn() → toast.success('Welcome back!') → router.push('/copilot'). Failure: toast.error(error.message || 'Failed to sign in'). Google path: signInWithGoogle() performs a full-window redirect to Supabase; on throw, toast.error(error.message || 'Failed to sign in with Google') and the button re-enables. Arriving with ?error=auth_failed or ?error=auth_not_configured or ?redirect=<path> is NOT rendered anywhere — the query param is ignored by this page. Toasts are sonner, top-right, bg var(--color-wrap) 1px var(--color-line) 8px radius.

**Interactions.** Password visibility toggle (Eye/EyeOff). Remember-me checkbox (registered but never read after submit). Two navigational links (/forgot-password, /signup) plus the brand logo → /. No tabs, no modals, no sheets, no keyboard shortcuts. Entire form submits on Enter.

**Responsive.** Single breakpoint that matters: lg (1024px). Below lg the whole 45% brand pane is display:none and the form card centres alone on the sky gradient, with the mobile QuantXMark + wordmark row appearing inside the card. Card padding steps 24px → 32px at sm (640px). Brand pane padding steps 40px → 56px at xl (1280px). Card never exceeds 448px. No horizontal scroll anywhere.

**Key copy.** • h1: 'Welcome back'
• sub: 'Sign in to your trading workspace'
• 'Continue with Google'
• divider: 'or'
• labels: 'Email Address', 'Password'
• placeholders: 'you@example.com', 'Enter your password'
• 'Remember me' / 'Forgot password?'
• CTA: 'Sign In'
• footer: “Don't have an account? Create one now”
• left pane h1: 'AI-Powered Trading Intelligence'
• left pane sub: 'Advanced stock screening and swing trading signals for the Indian market.'
• stats: '5 AI engines', '1,800+ NSE stocks', '₹10L Paper, free'
• '© 2026 Quant X Technologies. All rights reserved.'
• errors: 'Please enter a valid email address', 'Password must be at least 6 characters'
• toasts: 'Welcome back!', 'Failed to sign in', 'Failed to sign in with Google'

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a light-theme web sign-in page for an Indian AI stock-trading platform called Quant X. Full-height two-column split. Background is a vertical sky gradient from #bfe0f8 at top to #e8f4fd at bottom. Left column takes 45% width and is hidden on screens under 1024px; it has 40px padding and three stacked blocks. Top: a 40px rounded-square blue app icon (gradient #5B8DEF to #3457C9, white orbital-atom glyph) beside 'Quant X' in 18px semibold #1D1D1D with a 9px uppercase wide-tracked '#5F6B75' caption 'Trading Intelligence'. Middle: a 36px semibold headline 'AI-Powered Trading Intelligence' in #1D1D1D, a 16px #4D585F paragraph 'Advanced stock screening and swing trading signals for the Indian market.', a 340px-wide 16px-radius #EDF1F4 tile holding a security-shield illustration, then a row of three stats spaced 32px apart in monospace tabular figures — '5 / AI engines', '1,800+ / NSE stocks', '₹10L / Paper, free' with 10px uppercase #5F6B75 labels. Bottom: 12px copyright. Right column centres a 448px white card, 16px radius, 1px #DDE5ED border, soft shadow, 32px padding: heading 'Welcome back' 24px bold, 14px #4D585F sub 'Sign in to your trading workspace', a full-width pill outlined button 'Continue with Google' with the multicolour Google G, an 'or' divider, two icon-prefixed inputs (Email Address, Password with eye toggle) with 12px radius and #EDF1F4 fills, a remember-me checkbox with a #3459C9 'Forgot password?' link, and a solid #406AE4 pill CTA 'Sign In' with a right arrow in white.
```
</details>

---

## `/signup` — Sign Up — Step 1 (Account details)

**File** `app/signup/page.tsx` · **528 LOC** · **Access** public. Accepts ?ref=<CODE> for referral attribution (captured to localStorage, never rendered).

**Shell** — components/auth/AuthLayout.tsx with custom title/subtitle — forced LIGHT, sky gradient, two-pane.

**Purpose.** A prospect creates the account credentials before choosing a plan. This is step 1 of a 3-step self-contained wizard that lives inside one page component; the progress rail only appears from step 2 onward, so step 1 gives no visual step count. Password strength is coached live.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Shell + theme** | Identical AuthLayout to /login: .light-landing forced-light tokens, .bg-hero-sky gradient #bfe0f8→#e8f4fd, 45% left pane hidden below lg, 448px white .lg-surface card at 16px radius with elev-1 on the right. |
| 2 | **Left pane copy (overridden)** | title='The AI trading desk for India' at 30px→36px semibold; subtitle='Five engines. One gated signal. Every call explained. Built for serious NSE traders.' at 16px #4D585F. Same security.png tile and the same 5 / 1,800+ / ₹10L stat trio. |
| 3 | **Card heading** | Inside .animate-fade-in-up, mb-8: h1 'Create your account' 24px/700 tracking-tight #1D1D1D; p mt-2 14px #4D585F 'Paper-trade the full stack, free. No card.' |
| 4 | **Google button (different from login)** | mb-6 w-full, rounded-xs (6px, NOT the pill used on /login), 1px #DDE5ED border, bg-white/[0.03], shadow-glass (elev-1) → hover shadow-glass-hover, px-6 py-3, 14px/500, gap-3. GoogleLogo 20px + 'Continue with Google'; loading → 20px Loader2 spin; disabled:opacity-50. |
| 5 | **Divider** | Same as login: full-width 1px #DDE5ED rule with a centred bg-main (#EDF1F4) 'or' chip at 14px #5F6B75. |
| 6 | **Form rhythm** | form with space-y-4 (16px) — tighter than login's space-y-5. Five stacked blocks: Full Name, Email Address, Password (+strength), Confirm Password, Terms. |
| 7 | **Full Name field** | label mb-2 14px/500 'Full Name'; .input-animated-wrapper; User icon 16px at left-3.5 #5F6B75; input rounded-md (12px) 1px #DDE5ED bg-main #EDF1F4 py-3 pl-11 pr-4 14px, placeholder 'Your full name'. Error 12px #B81C22 'Name must be at least 2 characters'. |
| 8 | **Email field** | Mail icon, placeholder 'you@example.com'. Error 'Please enter a valid email address'. |
| 9 | **Password field** | Lock icon, placeholder 'Min 8 characters', forced !pr-12, Eye/EyeOff toggle at right-3.5 (16px). Error 'Password must be at least 8 characters'. |
| 10 | **Password strength meter** | Renders ONLY when the field is non-empty. mt-2: a row of exactly 5 bars, each h-1 (4px) flex-1 rounded-full with 4px gaps. Score = +1 if length≥8, +1 if it has both lower and upper case, +1 if it has a digit, +1 if it has a symbol, +1 if length≥12. Filled bars ALL take one colour, colors[strength-1] from [bg-down, bg-down, bg-warning, bg-primary, bg-up]; unfilled bars are bg-line. Caption mt-1 12px from ['Very Weak','Weak','Fair','Strong','Very Strong'], falling back to 'Too short' at score 0; caption colour is text-down at ≤2, text-warning at 3, text-up above. |
| 11 | **Confirm Password field** | Lock icon, placeholder 'Re-enter password', its own independent Eye/EyeOff toggle. Cross-field error 12px #B81C22: “Passwords don't match”. |
| 12 | **Terms checkbox** | A cursor-pointer label with items-start gap-2: 16px checkbox (mt-0.5, rounded, border-line, accent #406AE4) + 14px #4D585F sentence 'I agree to the Terms of Service and Privacy Policy' where both phrases are 500-weight accent-ink #3459C9 links to /terms and /privacy with hover:underline. Error 'You must accept the terms and conditions'. |
| 13 | **Submit button** | w-full, rounded-xs (6px), .bg-gradient-cta = linear-gradient(110deg,#3B82F6 0%,#406AE4 100%), white ink (.text-on-signature), px-6 py-3, 14px/700, gap-2, hover:opacity-90 + hover:shadow-glow-primary. Label 'Continue' + ArrowRight 16px. Note: no loading state on this button — it only advances local step state. |
| 14 | **Sign-in footer** | p mt-8 centred 14px #4D585F: 'Already have an account? ' + Link /login at 500 weight accent ink — 'Sign in'. |
| 15 | **Suspense fallback** | Because the page reads useSearchParams for ?ref, the whole content is inside <Suspense>. Fallback renders the same AuthLayout with title='Create account', subtitle='Loading…' and a py-8 centred 20px Loader2 spinning in #3459C9. |
| 16 | **Referral capture (invisible)** | ?ref=CODE is uppercased, written to localStorage['pending_ref'], and validated against api.referrals.resolve — but refCode/refValid drive NO rendered UI. There is no referral banner, chip, or confirmation on this screen. |

**Components** — `components/auth/AuthLayout.tsx` · `components/icons/GoogleLogo.tsx` · `PasswordStrength (local, defined in app/signup/page.tsx)` · `lib/icons (Mail, Lock, Eye, EyeOff, User, ArrowRight, ArrowLeft, Loader2, Check, Zap, Shield, Sparkles)` · `react-hook-form + zodResolver with a cross-field refine` · `lib/api (referrals.resolve / referrals.attribute)` · `lib/supabase`

**States & data.** No server data on step 1. One side effect on mount: if ?ref is present it is stored and resolved via api.referrals.resolve(ref) — result is stored in state and never displayed. Validation is a zod object with a top-level refine comparing password to confirm_password; all six messages render as 12px #B81C22 lines. Submitting step 1 does NOT call the network — it just stashes the form data and sets step=2. Suspense fallback is a spinner inside the same AuthLayout, and the middleware CSP nonce path is load-bearing here (without it the page SSRs but never hydrates past this fallback).

**Interactions.** Two independent password-visibility toggles. Live-recomputing 5-bar strength meter tied to a watched password value. Terms links open /terms and /privacy. 'Continue' advances the in-page wizard to step 2 (no route change, no URL change). Google button performs a full-window OAuth redirect.

**Responsive.** Same as /login: left 45% pane disappears below lg (1024px), mobile logo row appears inside the card, card padding 24px→32px at sm. Form is single-column at every width; card capped at 448px.

**Key copy.** • left h1: 'The AI trading desk for India'
• left sub: 'Five engines. One gated signal. Every call explained. Built for serious NSE traders.'
• h1: 'Create your account'
• sub: 'Paper-trade the full stack, free. No card.'
• 'Continue with Google' / 'or'
• labels: 'Full Name', 'Email Address', 'Password', 'Confirm Password'
• placeholders: 'Your full name', 'you@example.com', 'Min 8 characters', 'Re-enter password'
• strength labels: 'Too short', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'
• 'I agree to the Terms of Service and Privacy Policy'
• CTA: 'Continue'
• footer: 'Already have an account? Sign in'
• errors: 'Name must be at least 2 characters', 'Password must be at least 8 characters', “Passwords don't match”, 'You must accept the terms and conditions'
• Suspense: 'Create account' / 'Loading…'

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a light-theme web sign-up page for Quant X, an Indian AI stock-trading platform. Full-height two-pane split on a vertical sky gradient from #bfe0f8 to #e8f4fd. Left pane 45% wide, hidden below 1024px, 40px padding: a 40px blue rounded-square app icon with a white orbital-atom glyph beside 'Quant X' and a 9px uppercase caption 'Trading Intelligence'; then a 36px semibold #1D1D1D headline 'The AI trading desk for India' and a 16px #4D585F paragraph 'Five engines. One gated signal. Every call explained. Built for serious NSE traders.'; a 340px security-shield illustration on a 16px-radius #EDF1F4 tile; three monospace stats '5 AI engines', '1,800+ NSE stocks', '₹10L Paper, free'; a 12px copyright. Right pane centres a 448px white card with 16px radius, 1px #DDE5ED border and a soft shadow, 32px padding. Card contents in order: 24px bold 'Create your account'; 14px #4D585F 'Paper-trade the full stack, free. No card.'; a full-width 6px-radius outlined 'Continue with Google' button with the multicolour Google G; an 'or' hairline divider; four 12px-radius inputs with #EDF1F4 fills and 16px leading icons — Full Name, Email Address, Password (eye toggle), Confirm Password (eye toggle); directly under Password a five-segment 4px strength meter with a 12px caption reading 'Strong' in green; a checkbox line 'I agree to the Terms of Service and Privacy Policy' with #3459C9 links; and a full-width 6px-radius CTA filled with a 110-degree gradient from #3B82F6 to #406AE4, white bold label 'Continue' plus a right arrow. Footer line: 'Already have an account? Sign in'.
```
</details>

---

## `/signup (step 2)` — Sign Up — Step 2 (Pick your plan)

**File** `app/signup/page.tsx` · **528 LOC** · **Access** public, pre-account. selectedPlan defaults to 'pro'.

**Shell** — Standalone full-bleed — AuthLayout is abandoned. Follows the APP theme (dark by default), so the flow flips from light to dark mid-wizard.

**Purpose.** The prospect compares three tiers and picks one before the account is actually created. Selection is purely local state — no payment, no API call — it only decorates the confirmation screen that follows.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Page canvas** | div.flex.min-h-screen.items-center.justify-center.bg-main.p-4 — bg-main is #0D0D0E in dark, #EDF1F4 in light. Content column is w-full max-w-4xl (896px) with .animate-fade-in-up. |
| 2 | **Progress rail** | mb-8, flex, centred, gap-4. Three 36x36 circles (h-9 w-9) with 14px semibold labels. A circle at or below the current step is filled with .bg-gradient-cta (110deg #3B82F6→#406AE4) and white ink; a future circle is 1px border-line over bg-white/[0.06] with muted ink. A completed circle swaps its number for a 16px Check. Between circles 1-2 and 2-3 sits a 48x2px rounded connector: bg-primary (#406AE4) once passed, otherwise bg-line. |
| 3 | **Panel** | rounded-lg (16px), 1px border-line, bg-wrap (#151517 dark / #FFFFFF light), p-8 (32px), shadow-glass (elev-1). |
| 4 | **Panel header** | mb-8, centred: h1 'Pick your plan' 24px/700 primary ink; p mt-2 14px secondary ink 'Start free. Upgrade the day you need more.' |
| 5 | **Plan grid** | mb-6, grid-cols-1 → md:grid-cols-3, gap-4 (16px). Exactly 3 selectable cards, each a full button: rounded-md (12px), border-2, p-5 (20px), text-left, hover:shadow-glass-hover. Selected = border #406AE4 + bg-primary/5; unselected = border-line + bg-white/[0.06] with hover:border-wrap-line. |
| 6 | **Popular badge (Pro only)** | Absolutely positioned -top-3 and centred on the card edge: rounded-xs (6px), .bg-gradient-cta, px-3 py-0.5, 12px/600, white ink — 'Most Popular'. |
| 7 | **Plan card head** | mb-3 flex gap-2: a 20px accent-ink icon (Free→Sparkles, Pro→Zap, Elite→Shield) then h3 at text-lg (18px)/700 primary ink with the plan name. |
| 8 | **Plan price** | mb-3: '₹0' / '₹999' / '₹1999' rendered at text-2xl (24px)/700 primary ink (rupee via &#8377;), immediately followed by '/month' at 12px muted. |
| 9 | **Plan description** | mb-3, 12px secondary ink. Free: 'Trade the desk, on us'. Pro: 'Built for active traders'. Elite: 'The full trading desk'. |
| 10 | **Free feature list** | ul space-y-1.5, 4 items, each flex gap-2 at 12px secondary ink with a 14px accent-ink Check: '1 paper signal a day', 'Core technical analysis', 'Email alerts', '7-day trade history'. |
| 11 | **Pro feature list** | 6 items: 'Unlimited signals', 'All 50+ scanners', 'Pattern detection', 'Copilot, explains every call', 'Push notifications', 'Portfolio analytics'. |
| 12 | **Elite feature list** | 6 items: 'Everything in Pro', 'AutoPilot executes for you', 'F&O strategies', 'Unlimited Copilot', 'Priority support', 'Custom alerts'. |
| 13 | **Footer actions** | flex gap-4. Left: 'Back' — rounded-xs (6px), 1px border-line, bg-white/[0.03], px-5 py-3, 14px/500, ArrowLeft 16px, returns to step 1. Right: 'Continue' — flex-1, rounded-xs, .bg-gradient-cta, px-6 py-3, 14px/700 white ink, ArrowRight 16px, hover:opacity-90, advances to step 3. |

**Components** — `Inline plan array in app/signup/page.tsx` · `lib/icons (Sparkles, Zap, Shield, Check, ArrowLeft, ArrowRight)`

**States & data.** Entirely local state — no fetch, no skeleton, no empty or error state on this step. selectedPlan is a string initialised to 'pro', so the Pro card is pre-selected and already carries the 'Most Popular' badge on first paint. Nothing here is persisted; the plan is not sent with signUp() and only decorates step 3.

**Interactions.** Clicking any of the three plan cards sets selection (border + tinted fill move to it). 'Back' returns to the step-1 form with all entered values preserved in component state. 'Continue' advances to step 3. No modals, no tooltips, no hover cards.

**Responsive.** The plan grid is a single column below md (768px) — three full-width stacked cards, with the Pro card's 'Most Popular' badge overlapping the card above it. At md+ it becomes 3 equal columns inside the 896px container. Page padding is a flat 16px at every width; the panel keeps 32px internal padding.

**Key copy.** • h1: 'Pick your plan'
• sub: 'Start free. Upgrade the day you need more.'
• badge: 'Most Popular'
• plan names: 'Free' / 'Pro' / 'Elite'
• prices: '₹0/month', '₹999/month', '₹1999/month'
• taglines: 'Trade the desk, on us', 'Built for active traders', 'The full trading desk'
• CTAs: 'Back', 'Continue'

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a dark-theme plan-selection step for a trading-app signup wizard. Page background #0D0D0E, content centred in an 896px column. At the top, a horizontal 3-step progress rail: three 36px circles connected by 48x2px bars; steps 1 and 2 are filled with a 110-degree gradient from #3B82F6 to #406AE4 with white numerals (step 1 shows a white check), step 3 is a hollow circle with a #29292D border and #96969E numeral; the bar between 1 and 2 is #406AE4, the next is #29292D. Below sits a 16px-radius card with #151517 fill, 1px #29292D border and a soft shadow, 32px padding. Centred heading 'Pick your plan' at 24px bold #F7F7F8 and a 14px #D3D3D7 line 'Start free. Upgrade the day you need more.'. Then three equal pricing cards in a row, 12px radius, 20px padding, 2px borders, 16px gaps. Card one 'Free' with a sparkle icon, ₹0/month, 'Trade the desk, on us' and four checkmarked features. Card two 'Pro' is selected — its border is #406AE4 with a faint blue tint fill and a gradient pill badge 'Most Popular' straddling the top edge — with a lightning icon, ₹999/month, 'Built for active traders' and six checkmarked features. Card three 'Elite' with a shield icon, ₹1999/month, 'The full trading desk' and six features. Prices are 24px bold with a 12px '/month' suffix; features are 12px #D3D3D7 with 14px blue checks. Footer row: a 6px-radius outlined 'Back' button with a left arrow, and a wide gradient 'Continue' button with a right arrow in white bold. Stack the three plans vertically below 768px.
```
</details>

---

## `/signup (step 3)` — Sign Up — Step 3 (Confirm & create account)

**File** `app/signup/page.tsx` · **528 LOC** · **Access** public, pre-account. This is the step that actually calls signUp().

**Shell** — Standalone full-bleed, app theme (dark default). Same 896px container and progress rail as step 2.

**Purpose.** A short reassurance screen that echoes the chosen plan and price, then performs the real account creation. It also silently fires referral attribution and branches on whether Supabase requires email confirmation.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Page canvas** | Identical to step 2: flex min-h-screen centred, bg-main, p-4, inner w-full max-w-4xl (896px) with .animate-fade-in-up. |
| 2 | **Progress rail** | Same 3-circle rail; now all three circles are gradient-filled, circles 1 and 2 show 16px Checks instead of numerals, circle 3 shows '3', and both 48x2px connectors are #406AE4. |
| 3 | **Panel** | rounded-lg (16px), 1px border-line, bg-wrap, p-8 (32px), shadow-glass (elev-1), text-center — note this panel is centred where step 2's was left-aligned. |
| 4 | **Success medallion** | mx-auto mb-6, 64x64 (h-16 w-16) rounded-full with bg-primary/10, containing a 32px Check in accent ink. |
| 5 | **Headline** | h1 “You're in.” at 24px/700 primary ink. |
| 6 | **Sub-headline** | p mt-2 14px secondary ink: 'Create your account and put the five engines to work.' |
| 7 | **Order summary card** | mx-auto mt-8, max-w-sm (384px), rounded-md (12px), 1px border-line, bg-hover (L2 — #1E1E21 dark / #F4F7F9 light), p-5 (20px). Two label/value rows: first mb-3 'Selected Plan:' (14px secondary) → plan name (600 weight primary ink); second 'Price:' → '₹999/month' style string built from the chosen plan (600 weight primary ink). Both rows flex justify-between. |
| 8 | **Footer actions** | mt-8 flex gap-4. Left 'Back' — rounded-xs (6px), 1px border-line, bg-white/[0.03], px-5 py-3, 14px/500, ArrowLeft 16px → returns to step 2. Right 'Create Account' — flex-1, rounded-xs, .bg-gradient-cta, px-6 py-3, 14px/700 white ink, trailing Check 16px; while submitting the whole label is replaced by a 20px spinning Loader2 and the button drops to opacity-50. |

**Components** — `Inline plan array in app/signup/page.tsx` · `lib/icons (Check, ArrowLeft, Loader2)` · `contexts/AuthContext signUp()` · `lib/supabase auth.getUser()` · `lib/api referrals.attribute()` · `sonner toast`

**States & data.** One async action. handleFinalSignup() calls signUp(email, password, full_name); on resolve it best-effort attributes any pending referral code (reads refCode or localStorage['pending_ref'], resolves the Supabase user id, POSTs api.referrals.attribute, clears the key) — all of it silent, with no UI. Then it branches: if needsConfirmation, toast.success('Account created! Please check your email to verify.') and router.push('/verify-email?email=<encoded>'); otherwise toast.success('Welcome to Quant X!') and router.push('/copilot'). On throw: toast.error(error.message || 'Failed to create account') and the button re-enables. There is no inline error region on this screen — failures surface only as a top-right sonner toast.

**Interactions.** 'Back' returns to the plan grid with the selection intact. 'Create Account' is the only network action in the wizard; it disables itself and shows an inline spinner. No modals or confirmations.

**Responsive.** Content is centred and capped at 896px, but the visible panel content (medallion, headings, 384px summary card) is much narrower, so it reads as a centred column at every width. Below 768px the footer's two buttons stay side-by-side (Back is auto-width, Create Account flexes). Flat 16px page padding.

**Key copy.** • h1: “You're in.”
• sub: 'Create your account and put the five engines to work.'
• summary labels: 'Selected Plan:' / 'Price:'
• CTAs: 'Back', 'Create Account'
• toasts: 'Account created! Please check your email to verify.', 'Welcome to Quant X!', 'Failed to create account'

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a dark-theme final confirmation step for a trading-app signup wizard. Background #0D0D0E, content centred in an 896px column, 16px page padding. Top: a 3-step progress rail of 36px circles joined by 48x2px bars — circles one and two are filled with a 110-degree gradient from #3B82F6 to #406AE4 and show white checkmarks, circle three is gradient-filled with a white '3', and both connector bars are #406AE4. Below, a centred card with 16px radius, #151517 fill, 1px #29292D border, soft shadow and 32px padding. Inside, centred and in order: a 64px circle with a 10%-opacity blue fill containing a 32px #8FB0FF check; a 24px bold #F7F7F8 headline reading 'You're in.'; a 14px #D3D3D7 line 'Create your account and put the five engines to work.'; then a narrow 384px summary box with 12px radius, #1E1E21 fill and a #29292D border, 20px padding, holding two justified rows — 'Selected Plan:' in 14px #D3D3D7 against 'Pro' in semibold #F7F7F8, and 'Price:' against '₹999/month' in semibold #F7F7F8. At the bottom, a two-button row 32px below: a compact 6px-radius outlined button 'Back' with a left arrow, and a wide 6px-radius button filled with the blue gradient reading 'Create Account' in white bold with a trailing checkmark. Show a variant where the wide button's label is replaced by a white spinner at 50% opacity.
```
</details>

---

## `/forgot-password` — Forgot Password

**File** `app/forgot-password/page.tsx` · **91 LOC** · **Access** public.

**Shell** — components/auth/AuthLayout.tsx with custom title/subtitle — forced LIGHT, sky gradient, two-pane.

**Purpose.** Collect an email and trigger a Supabase password-reset link. The screen deliberately shows the same success panel whether or not the account exists, so it never leaks which emails are registered.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Shell + theme** | AuthLayout: .light-landing forced-light tokens on .bg-hero-sky (#bfe0f8→#e8f4fd), 45% left pane hidden below lg, right card .lg-surface max-w-md (448px) rounded-lg (16px) p-6 sm:p-8 — #FFFFFF, 1px #DDE5ED, elev-1. |
| 2 | **Left pane copy (overridden)** | title='Reset Your Password' at 30px→36px semibold #1D1D1D; subtitle=“Don't worry, it happens to the best of us. We'll help you get back in.” at 16px #4D585F. Same security illustration tile and the same three stats. |
| 3 | **Back link** | First element in the card, inside .animate-fade-in-up: mb-8 inline-flex gap-2, 14px #4D585F → hover accent ink, with ArrowLeft 16px — 'Back to Login', navigating to /login. |
| 4 | **Heading** | h2 (not h1) 'Reset Password' at text-2xl (24px)/700 tracking-tight #1D1D1D, mb-2. |
| 5 | **Explainer** | p mb-6 14px #4D585F: “Enter your email address and we'll send you a link to reset your password.” |
| 6 | **Email field (form state)** | form space-y-4. label mb-2 14px/500 #1D1D1D 'Email Address'. NOTE: plain relative wrapper — no .input-animated-wrapper, so no conic focus ring here. Mail icon 16px absolute left-3.5 #5F6B75. input required, type=email, w-full rounded-md (12px), 1px #DDE5ED, bg-wrap #FFFFFF (white, unlike login's grey well), py-3 pl-11 pr-4, 14px, placeholder 'you@example.com'; focus:border #406AE4 + ring-2 ring-primary/20. |
| 7 | **Submit button** | w-full, rounded-md (12px — a third radius for the same action across auth), bg-primary #406AE4, py-3, 14px/600, white ink, hover:bg #3055C2 + hover:shadow-glow-primary, disabled:opacity-50. Label 'Send Reset Link'; while loading the label is replaced by a 20px spinning Loader2. |
| 8 | **Success panel (replaces the form)** | rounded-md (12px), 1px border of up/20, bg up/5, p-6 (24px), text-center. Contains a 56x56 (h-14 w-14) rounded-full up/10 circle with a 28px CheckCircle in the up colour (#0A6B50 on this forced-light screen), then 'Check your inbox!' at 500 weight in the up colour, then p mt-2 14px #4D585F: 'If an account exists for {email}, you will receive a password reset link shortly.' — the typed email is interpolated verbatim. |
| 9 | **Absent affordances** | There is no resend control, no countdown, no way back to the form once submitted, and no error state — the catch branch also sets submitted=true. |

**Components** — `components/auth/AuthLayout.tsx` · `lib/icons (Mail, ArrowLeft, CheckCircle, Loader2)` · `@supabase/auth-helpers-nextjs createClientComponentClient`

**States & data.** Three states: idle form, loading (button spinner, button disabled), and submitted. On submit it calls supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?type=recovery` }). The catch block deliberately ALSO sets submitted=true with the comment 'Always show success to avoid email enumeration', so the failure path is visually identical to success. No toast fires on this page at all. No data fetch on mount, no skeleton.

**Interactions.** Single text input, single submit (Enter works), one back link to /login. No visibility toggles, no modals. Once submitted the form unmounts and the success panel is terminal — the only way onward is the browser back button or the (now unmounted) back link.

**Responsive.** Left 45% pane hidden below lg (1024px); mobile QuantXMark + wordmark row appears inside the card. Card padding 24px → 32px at sm (640px), capped at 448px. Single column throughout.

**Key copy.** • left h1: 'Reset Your Password'
• left sub: “Don't worry, it happens to the best of us. We'll help you get back in.”
• 'Back to Login'
• h2: 'Reset Password'
• “Enter your email address and we'll send you a link to reset your password.”
• label 'Email Address', placeholder 'you@example.com'
• CTA: 'Send Reset Link'
• success: 'Check your inbox!'
• success body: 'If an account exists for {email}, you will receive a password reset link shortly.'

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a light-theme password-reset page for Quant X, an Indian AI trading platform. Full-height two-pane split on a vertical sky gradient from #bfe0f8 to #e8f4fd. The 45% left pane (hidden below 1024px) shows a 40px blue rounded-square app icon with a white orbital-atom glyph next to 'Quant X' and a 9px uppercase 'Trading Intelligence' caption; a 36px semibold #1D1D1D headline 'Reset Your Password'; a 16px #4D585F paragraph 'Don't worry, it happens to the best of us. We'll help you get back in.'; a 340px security-shield illustration on a 16px-radius #EDF1F4 tile; three monospace stats reading '5 AI engines', '1,800+ NSE stocks', '₹10L Paper, free'; and a 12px copyright pinned to the bottom. The right pane centres a 448px white card with 16px radius, a 1px #DDE5ED border, soft shadow and 32px padding. Inside, top to bottom: a small 14px #4D585F back link with a left arrow reading 'Back to Login'; a 24px bold heading 'Reset Password'; a 14px #4D585F paragraph 'Enter your email address and we'll send you a link to reset your password.'; a labelled 'Email Address' input with 12px radius, a white fill, a 1px #DDE5ED border and a 16px grey envelope icon inset on the left, placeholder 'you@example.com'; and a full-width 12px-radius solid #406AE4 button with white 14px semibold label 'Send Reset Link'. Also produce the submitted variant where the form is replaced by a green-tinted panel: 12px radius, faint #0A6B50 fill and border, a 56px circle holding a 28px green check, the line 'Check your inbox!' in green, and a 14px grey line 'If an account exists for priya@example.com, you will receive a password reset link shortly.'
```
</details>

---

## `/verify-email` — Verify Email

**File** `app/verify-email/page.tsx` · **108 LOC** · **Access** public. Reads ?email=<address> from the query string (set by the signup redirect).

**Shell** — components/auth/AuthLayout.tsx with custom title/subtitle — forced LIGHT, sky gradient, two-pane.

**Purpose.** A holding screen after account creation: it confirms which inbox the verification link went to, routes back to sign-in, and offers exactly one resend attempt inline.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Shell + theme** | AuthLayout: .light-landing forced-light, .bg-hero-sky gradient, 45% left pane hidden below lg, right card .lg-surface 448px rounded-lg (16px) p-6 sm:p-8 white with 1px #DDE5ED and elev-1. |
| 2 | **Left pane copy (overridden)** | title='Almost There!' at 30px→36px semibold; subtitle='Just one more step to unlock your AI-powered trading intelligence.' at 16px #4D585F. Same security tile and 5 / 1,800+ / ₹10L stats. |
| 3 | **Card alignment** | Whole card body is .animate-fade-in-up.text-center — this is the only AuthLayout screen that centres its content. |
| 4 | **Envelope tile** | mx-auto mb-6, 64x64 (h-16 w-16), rounded-lg (16px), 1px border-line #DDE5ED, bg-primary/5, grid-centred, holding a 32px Mail icon in accent ink #3459C9. |
| 5 | **Headline** | h1 'Verify your email' at text-2xl (24px)/700 tracking-tight #1D1D1D, mb-2. |
| 6 | **Body copy with email** | p mx-auto mb-8 max-w-sm (384px) 14px #4D585F: 'We sent a verification link to ' + the email rendered inline at 500 weight in #1D1D1D, or the literal fallback word 'your inbox' when no ?email param is present, + '. Click it to activate your account and start trading.' |
| 7 | **Primary CTA** | Link to /login: inline-flex, rounded-md (12px), bg-primary #406AE4, px-8 py-3, 14px/600, white ink, gap-2, hover #3055C2 + hover:shadow-glow-primary. Label 'Back to Sign In' + ArrowRight 16px. |
| 8 | **Resend line** | p mt-6 12px #5F6B75: “Didn't receive the email? Check your spam folder or ” followed by an inline button at 500 weight accent ink #3459C9. Idle label 'resend verification'; while sending a 12px spinning Loader2 is prefixed; after success the label becomes 'Verification sent!' prefixed by a 12px CheckCircle in the up colour and the button stays disabled at opacity-50. |
| 9 | **Error line** | p mt-2 12px in the down colour (#B81C22 on this forced-light screen), rendered only when the resend throws. With no ?email param the message is the literal 'Email address not available. Please sign up again.'; otherwise it is the Supabase error message or the fallback 'Failed to resend verification email'. |
| 10 | **Suspense fallback** | The page reads useSearchParams, so the content is wrapped in <Suspense> with a fallback that renders the same AuthLayout using title='Verify email', subtitle='Loading…' plus a py-8 centred 20px Loader2 spinning in accent ink. |

**Components** — `components/auth/AuthLayout.tsx` · `lib/icons (Mail, ArrowRight, Loader2, CheckCircle)` · `lib/supabase (auth.resend type:'signup')`

**States & data.** No fetch on mount — the screen is driven entirely by the ?email query param. The single async action is supabase.auth.resend({ type: 'signup', email }); it is guarded so an absent email short-circuits into the inline error. Three resend states — idle / resending (spinner, disabled) / resent (green check, 'Verification sent!', permanently disabled). There is no polling for verification status and no auto-redirect: the user must come back through /login. No toasts on this screen.

**Interactions.** One link (/login) and one inline resend button. That's it — no visibility toggles, no forms, no modals, no keyboard shortcuts.

**Responsive.** Left 45% pane hidden below lg (1024px); mobile logo row appears inside the card. Card padding 24px → 32px at sm; card capped at 448px; body paragraph capped at 384px and centred at every width.

**Key copy.** • left h1: 'Almost There!'
• left sub: 'Just one more step to unlock your AI-powered trading intelligence.'
• h1: 'Verify your email'
• 'We sent a verification link to {email}. Click it to activate your account and start trading.' (fallback subject: 'your inbox')
• CTA: 'Back to Sign In'
• “Didn't receive the email? Check your spam folder or resend verification”
• after resend: 'Verification sent!'
• errors: 'Email address not available. Please sign up again.', 'Failed to resend verification email'
• Suspense: 'Verify email' / 'Loading…'

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a light-theme 'check your email' confirmation screen for Quant X, an Indian AI trading platform. Full-height two-pane split on a vertical sky gradient from #bfe0f8 to #e8f4fd. The 45% left pane (hidden below 1024px) has a 40px blue rounded-square app icon with a white orbital-atom glyph beside 'Quant X' and a 9px uppercase caption 'Trading Intelligence'; a 36px semibold #1D1D1D headline 'Almost There!'; a 16px #4D585F line 'Just one more step to unlock your AI-powered trading intelligence.'; a 340px security-shield illustration on a 16px-radius #EDF1F4 tile; three monospace stats '5 AI engines', '1,800+ NSE stocks', '₹10L Paper, free'; and a 12px copyright at the bottom. The right pane centres a 448px white card, 16px radius, 1px #DDE5ED border, soft shadow, 32px padding, with everything inside centre-aligned. Card contents top to bottom: a 64px square tile with 16px radius, a very faint blue fill and a 1px #DDE5ED border, holding a 32px #3459C9 envelope icon; a 24px bold #1D1D1D heading 'Verify your email'; a 384px-wide 14px #4D585F paragraph reading 'We sent a verification link to priya.sharma@gmail.com. Click it to activate your account and start trading.' with the address itself in medium-weight #1D1D1D; a solid #406AE4 button with 12px radius, 32px horizontal padding, white 14px semibold label 'Back to Sign In' and a trailing right arrow; and finally a 12px #5F6B75 line 'Didn't receive the email? Check your spam folder or resend verification' where the last two words are a #3459C9 medium-weight inline link. Include a variant where that link reads 'Verification sent!' with a small green check and appears dimmed.
```
</details>

---

## `/auth/callback` — OAuth Callback (Supabase)

**File** `app/auth/callback/page.tsx` · **42 LOC** · **Access** transitional — the Supabase client is picking the session out of the URL hash via detectSessionInUrl.

**Shell** — Standalone full-bleed. No AuthLayout, no AppShell. Follows the app theme (dark default).

**Purpose.** A pure interstitial that holds the user for the moment it takes Supabase to materialise a session from the Google OAuth redirect, then forwards to /copilot. It is also the redirect target for password-recovery links (?type=recovery).

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Page canvas** | div.min-h-screen.bg-background.flex.items-center.justify-center — bg-background resolves to the shadcn channel var (13 13 14 → #0D0D0E dark, 237 241 244 → #EDF1F4 light). Nothing else on the page: no logo, no card, no border. |
| 2 | **Centred stack** | A single text-center block, vertically and horizontally centred in the viewport. |
| 3 | **Ring spinner** | 48x48 (w-12 h-12) div: border-4, border-accent (#406AE4), border-t-transparent, rounded-full, animate-spin, mx-auto, mb-4. This is a hand-rolled CSS ring, not the lucide Loader2 used elsewhere in the flow. |
| 4 | **Status line** | p with text-text-secondary (#D3D3D7 dark / #4D585F light) at the browser default paragraph size — copy is exactly 'Completing sign-in...' with three ASCII periods (not the ellipsis character used on the broker callback). |
| 5 | **No success state** | There is no rendered success or error variant. When the session appears the component immediately router.replace()s away; the spinner is the only thing a user ever sees. |
| 6 | **No branding** | Unlike every other screen in this flow, the QuantX mark is absent, so the interstitial is unbranded. |

**Components** — `contexts/AuthContext useAuth()` · `next/navigation useRouter`

**States & data.** Two effects, no fetch of its own. Effect 1: when !loading && user, router.replace('/copilot'). Effect 2: a 10,000ms timeout that, if there is still no user, does router.replace('/login?error=auth_failed') — that error param is not rendered by the login page, so a failed OAuth lands silently on a plain sign-in form. The spinner is the sole loading affordance; there is no skeleton, no empty state, and no visible error state. GlobalCopilot is excluded on /auth/*, so nothing else mounts over it.

**Interactions.** None — the screen has zero interactive elements. It is entirely automatic: either a redirect to /copilot, or a redirect to /login after 10 seconds.

**Responsive.** Fully fluid; the spinner and one line of text stay centred at any viewport size. Nothing collapses, nothing scrolls.

**Key copy.** • 'Completing sign-in...' (three periods, no ellipsis glyph)
• implicit failure route: /login?error=auth_failed (param not surfaced in UI)

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a minimal dark-theme full-screen OAuth interstitial for a trading app. The entire viewport is a flat #0D0D0E canvas with no header, no card, no logo, and no border of any kind — the screen must feel like a momentary pause, not a page. Perfectly centred both vertically and horizontally, stack two elements. First, a 48px circular loading ring drawn as a 4px-thick stroke in #406AE4 with the top quarter of the ring fully transparent, spinning continuously clockwise at about one rotation per second. Second, 16px below the ring, a single line of body text in #D3D3D7 at roughly 16px regular weight reading exactly 'Completing sign-in...' with three plain periods. Do not add a progress bar, a percentage, a brand mark, a cancel link, a support link, or any secondary copy — this screen deliberately contains nothing else. Provide a matching light-theme variant where the canvas becomes #EDF1F4, the ring stays #406AE4, and the text becomes #4D585F. Keep the composition identical at mobile and desktop widths: the pair of elements simply stays centred, with no layout change, no scrolling and no responsive reflow. The visual weight should be very light — a large field of empty background with a small blue ring and one short grey sentence at the optical centre.
```
</details>

---

## `/broker/callback` — Broker OAuth Callback

**File** `app/broker/callback/page.tsx` · **169 LOC** · **Access** authed in practice (the callback POSTs with the Supabase bearer token), but the route is in middleware publicPaths so it is reachable without a gate. No tier gate. This IS the broker gate's completion step.

**Shell** — Standalone full-bleed on bg-main; a single centred .trading-surface card. App theme (dark default).

**Purpose.** Exchanges the broker's OAuth code for a live connection and tells the user whether it worked, then bounces them onward — to /onboarding/risk-quiz if the flow started in onboarding, otherwise to /settings. It is the only screen in the flow that renders three mutually exclusive states in one card.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Page canvas** | div.min-h-screen.flex.items-center.justify-center.bg-main.p-4 — #0D0D0E dark / #EDF1F4 light, 16px page padding. |
| 2 | **Status card** | div.trading-surface.max-w-md.w-full.text-center with !p-8 — bg-wrap (#151517 / #FFFFFF), 1px border #29292D / #DDE5ED, rounded-md (12px), elev-1 shadow, padding forced to 32px, max width 448px. Hovering lifts the border to L4 and the shadow to elev-2 (inherited from .trading-surface, unintentional here). |
| 3 | **PROCESSING — spinner** | Loader2 at h-10 w-10 (40px) in accent ink, animate-spin, mx-auto mb-4. |
| 4 | **PROCESSING — heading** | h2 at an explicit text-[18px] font-semibold in primary ink, mb-1: 'Connecting broker…' (true ellipsis character). |
| 5 | **PROCESSING — subline** | p text-[12px] muted ink: 'Exchanging tokens with your broker'. A second 11px muted line renders below it only if the internal message state has diverged from its initial value. |
| 6 | **SUCCESS — pinging halo** | A relative 56x56 box, mx-auto mb-4: an absolutely-positioned inset-0 rounded-full bg-up/10 with animate-ping expanding behind a 56px CheckCircle2 in the up colour (#10B981 dark / #0A6B50 light). |
| 7 | **SUCCESS — heading + subline** | h2 text-[20px] font-semibold primary ink, mb-1: 'Connected'. p text-[12px] muted: 'Redirecting…'. |
| 8 | **ERROR — icon** | XCircle at h-12 w-12 (48px) in the down colour (#F5808C dark / #B81C22 light), mx-auto mb-4. |
| 9 | **ERROR — heading** | h2 text-[18px] font-semibold primary ink, mb-1: 'Connection failed'. |
| 10 | **ERROR — message** | p text-[12px] muted, mt-2 — the resolved message string (see the copy list; backend snake_case codes are mapped to friendly sentences by an ERROR_COPY table). |
| 11 | **ERROR — recovery button** | mt-6, px-5 py-2, bg-primary #406AE4, white ink, rounded-xs (6px), text-[13px] font-medium, hover #3055C2 — 'Back to settings' → router.push('/settings'). This is the ONLY interactive element on the whole page, and it exists only in the error state. |
| 12 | **Suspense fallback** | useSearchParams forces a <Suspense> boundary: the fallback is a bare min-h-screen bg-main flex-centred Loader2 at h-12 w-12 (48px) in accent ink — no card, no copy. |
| 13 | **Uninvited overlay** | GlobalCopilot's exclusion regex does not cover /broker, so for a signed-in user the Copilot dock (desktop) or floating action button (mobile) mounts on top of this card. |

**Components** — `lib/icons (Loader2, CheckCircle2, XCircle)` · `lib/supabase (auth.getSession)` · `.trading-surface global class` · `ERROR_COPY map (local to the page)`

**States & data.** Single mount effect drives everything. It reconstructs the OAuth state from searchParams.state or sessionStorage['broker_oauth_state'], and the broker from searchParams.broker or sessionStorage['broker_oauth_broker'], then clears both keys plus sessionStorage['broker_oauth_return'] (which decides whether success lands on /onboarding/risk-quiz or /settings). Angel One and Dhan short-circuit into the error state with a credential-vs-OAuth explanation and auto-redirect after 3000ms. Token param handling: Zerodha sends request_token, Fyers v3 sends auth_code, Upstox sends code; the broker is inferred as 'zerodha' when a request_token is present, else 'upstox'. It then POSTs to `${NEXT_PUBLIC_API_URL}/api/broker/{broker}/auth/callback?…` with a Bearer token from supabase.auth.getSession() and credentials:'include'. Success sets the success state and router.push()es after 2000ms, preferring the backend's return_to hint. There is no skeleton, no polling and no retry — only the terminal 'Back to settings' button.

**Interactions.** Zero interactions in the processing and success states — both are timed auto-redirects (2s success, 3s for the credential-broker bounce). The error state exposes exactly one button, 'Back to settings'.

**Responsive.** The card is w-full up to a 448px cap with a flat 16px page gutter, so it goes edge-to-edge-minus-16px on a phone and centres as a fixed card on desktop. Internal padding stays 32px at all widths; nothing collapses or scrolls.

**Key copy.** • processing: 'Connecting broker…' / 'Exchanging tokens with your broker'
• success: 'Connected' / 'Redirecting…'
• error heading: 'Connection failed'
• error CTA: 'Back to settings'
• mapped errors: 'This connection link expired. Please start the broker connection again.' (invalid_or_expired_state), "This broker isn't available yet. Try another broker or check back soon." (broker_not_configured), 'Your broker session expired. Please reconnect.' (broker_token_expired)
• literal errors: 'No authorization code received from broker.', 'OAuth state missing. Please try connecting again from Settings.', 'Failed to connect broker. Please try again.'
• credential-broker bounce: 'Angel One connects via credentials, not OAuth. Please use the Angel One tile in Settings.' (and the Dhan equivalent)

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a dark-theme full-screen broker-connection status screen for an Indian trading app, showing three states of the same card. Canvas is flat #0D0D0E with 16px padding; a single card is centred: 448px max width, 12px radius, #151517 fill, 1px #29292D border, soft shadow, 32px padding, all content centre-aligned. State one, connecting: a 40px blue #406AE4 spinner ring above an 18px semibold #F7F7F8 heading 'Connecting broker…' and a 12px #96969E line 'Exchanging tokens with your broker'. State two, connected: a 56px green #10B981 circled checkmark with a soft expanding ping halo behind it at 10% opacity, a 20px semibold #F7F7F8 heading 'Connected', and a 12px #96969E line 'Redirecting…'. State three, failed: a 48px #F5808C circled X, an 18px semibold #F7F7F8 heading 'Connection failed', a 12px #96969E message reading 'This connection link expired. Please start the broker connection again.', and 24px below it a compact solid #406AE4 button with 6px radius, 20px horizontal padding and a 13px medium white label 'Back to settings'. Keep the icon-heading-message rhythm identical across all three so the card feels like one object changing state, with 16px under the icon and 4px between heading and message. Do not add a logo, progress bar, broker name badge, or step counter. Provide the light variant: #EDF1F4 canvas, #FFFFFF card, #DDE5ED border, #1D1D1D headings, #5F6B75 body, #0A6B50 success, #B81C22 failure.
```
</details>

---

## `/onboarding/broker-connect` — Onboarding Step 1 — Connect a broker

**File** `app/onboarding/broker-connect/page.tsx` · **743 LOC** · **Access** authed — /onboarding/* is outside middleware publicPaths, so production requires a Supabase session cookie. ClientAuthGate does NOT list /onboarding, so only middleware gates it. Entered automatically by app/(platform)/layout.tsx when onboarding status is not completed.

**Shell** — Standalone full-bleed centred column (no layout file under app/onboarding). App theme, dark default. No sidebar, no rail, no footer.

**Purpose.** The first real step of activation: link a live broker so AutoPilot and the agents can act on real positions. Seven brokers are offered in two explicitly-labelled groups — three one-click OAuth brokers and four credential/token brokers whose forms expand inline — and the whole step is skippable onto a virtual ₹10L paper account.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Page frame** | div.mx-auto.flex.min-h-screen.max-w-2xl.flex-col.justify-center.gap-6 with px-6 (24px) py-12 (48px). Max width 672px, vertically centred, 24px gap between header, card and footer. |
| 2 | **Eyebrow** | p text-[11px] uppercase tracking-wider in accent ink (#8FB0FF dark / #3459C9 light): 'Step 1 of 3'. |
| 3 | **Title** | h1 text-2xl (24px) font-semibold primary ink: 'Let the agents run live'. |
| 4 | **Deck** | p text-sm (14px) muted ink, centred with the header: 'Connect your broker so AutoPilot and the trading agents can act on real positions. Read-only at first. Place trades later from Settings → Broker. Free users can skip and run on the ₹10L paper account.' |
| 5 | **Broker card** | Foundation <Card>: rounded-md (12px), bg-wrap, 1px border-line, flush (no shadow). CardHeader is a min-h-44px row with a bottom hairline and 20px/16px padding, holding a 16px ShieldCheck in accent ink plus the 16px/600/-0.01em title 'Link a broker for live execution'. CardBody has 20px/16px padding and space-y-2 (8px) between rows. |
| 6 | **Group label 1** | Rendered immediately above the Zerodha row: p text-[11px] font-medium uppercase tracking-wider muted — 'Instant · one-click login'. |
| 7 | **OAuth broker rows (3)** | Order is fixed: Zerodha, Upstox, Fyers. Each is a full-width button with .glass-control (surface-2 fill + 1px hairline), rounded-xs (6px), p-3 (12px), flex justify-between, text-left. Left column: name at 14px/500 primary ink (Fyers also carries a rounded-full 1px-border 9px uppercase 'Beta' pill in muted ink) over an 11px muted blurb. Right column: a 16px muted ArrowRight, replaced by a spinning accent Loader2 while that broker is pending. Blurbs: Zerodha 'Kite Connect · OAuth · India's largest discount broker'; Upstox 'API v2 · OAuth · Tier-1 NSE access'; Fyers 'OAuth · API v3'. |
| 8 | **OAuth reassurance lines** | Under each OAuth row only: p px-1 text-[10px] leading-snug muted — “You'll log in securely on Zerodha (Kite). We never see your password.”, “You'll log in securely on Upstox. We never see your password.”, “You'll log in securely on Fyers. We never see your password.” |
| 9 | **Group label 2** | Rendered above the Angel One row with pt-2: p text-[11px] font-medium uppercase tracking-wider muted — 'Connect with a token'. |
| 10 | **Credential broker rows (4)** | Angel One ('SmartAPI · API key + TOTP · Pan-India retail', no Beta pill), Dhan ('Access token', Beta), Kotak Neo ('Neo API · Session token', Beta), Alice Blue ('ANT API · API session', Beta). Same .glass-control row chrome, but they toggle an inline form instead of redirecting; their ArrowRight rotates 90° when expanded, and each carries aria-expanded plus aria-label 'Connect {name}'. Every row on the page is disabled (opacity-50, not-allowed) while ANY broker is pending. |
| 11 | **Angel One inline form** | space-y-3, rounded-xs (6px), 1px border-line, bg-main, p-3. Three numbered 11px muted help lines, the first linking smartapi.angelbroking.com in underlined accent ink: '1) Go to smartapi.angelbroking.com and create an app → get your API key.', '2) Your Client ID is your Angel login ID.', '3) In the SmartAPI app, enable TOTP and copy the TOTP secret (base32). Paste all three below.' Then a grid-cols-1 sm:grid-cols-2 gap-3 of FOUR fields — API key (placeholder 'SmartAPI key'), Client ID (placeholder 'e.g. D12345', force-uppercased both in state and via CSS), PIN / Password (type=password, placeholder 'Login password or MPIN'), TOTP secret (font-mono tracking-wider, whitespace stripped and uppercased, placeholder 'TOTP secret key'). Labels are 11px/500 secondary ink with mb-1; inputs are rounded-sm (8px), 1px border-line, bg-main, px-3 py-2, 13px, focus:border-primary/50, autoComplete off, spellCheck false. Footer is a full-width foundation Button (primary, h-32px, 8px radius) reading 'Connect Angel One', or a spinner + 'Connecting…' while pending; disabled until all four fields are non-empty. |
| 12 | **Dhan inline form** | Same panel chrome. Two help lines, first linking web.dhan.co: '1) Open web.dhan.co → Profile → DhanHQ Trading API.', '2) Copy your Client ID and generate an Access Token (valid ~30 days). Paste both below.' Single-column grid of two fields — Client ID ('Dhan Client ID') and Access Token (font-mono tracking-wide, pr-9, placeholder 'DhanHQ access token') with a 14px Eye/EyeOff toggle at right-3 carrying aria-label 'Show access token'/'Hide access token'. Button 'Connect Dhan'. |
| 13 | **Kotak Neo inline form** | Three help lines, first linking napi.kotaksecurities.com: '1) Log in to the Kotak Neo API portal (napi.kotaksecurities.com) and create an app.', '2) Generate your access token + session id (sid).', '3) Paste your Client ID (UCC), Access Token and Session Token below.' Single-column grid of THREE fields — Client ID (UCC) ('Kotak Neo UCC'), Access Token ('Neo API access token', masked with toggle), Session Token (sid) ('Neo API session id (sid)', masked with its own toggle). Button 'Connect Kotak Neo'. |
| 14 | **Alice Blue inline form** | Three help lines, first linking aliceblueonline.com: '1) Log in to Alice Blue → Apps → API.', '2) Get your API key and generate a session/access token.', '3) Paste your User ID and Access Token below.' Single-column grid of two fields — User ID ('Alice Blue User ID') and Access Token ('Alice Blue access token', masked with toggle). Button 'Connect Alice Blue'. |
| 15 | **Footer row** | flex items-center justify-between at text-xs (12px) muted. Left, plain text: 'Connect later anytime in Settings → Broker'. Right, a foundation Button variant='ghost' size='sm' (h-28px, transparent, secondary ink, hover surface-2): 'Skip — explore with a virtual ₹10L portfolio' → router.push('/onboarding/risk-quiz'). Disabled while any connect is pending. |
| 16 | **Not used here** | components/broker/BrokerConnectTile.tsx — the richer Settings tile with brand logos, 1-click pills and status chips — is NOT rendered on this screen. Onboarding uses its own compact list rows with no logos and no connection-status pills. |

**Components** — `components/foundation Card / CardHeader / CardBody` · `components/foundation Button (primary + ghost)` · `components/foundation toast (sonner)` · `lib/icons (ArrowRight, Eye, EyeOff, Loader2, ShieldCheck)` · `lib/api (broker.initiateOAuth, broker.connect, handleApiError)`

**States & data.** No fetch on mount and therefore no skeleton, empty state or error region — the broker list is a hardcoded 7-entry array in the page. A single `pending` string tracks which broker is mid-flight and disables every row. OAuth path: api.broker.initiateOAuth(slug, 'onboarding') → writes sessionStorage broker_oauth_state, broker_oauth_broker and broker_oauth_return='onboarding' (wrapped in try/catch for private-mode) → full-window window.location.href = auth_url. Failure: toast.error('Could not start {slug} OAuth', { description: handleApiError(e) }) and pending clears. Credential path: api.broker.connect({...}) → toast.success('Angel One connected' | 'Dhan connected' | 'Kotak Neo connected' | 'Alice Blue connected') → router.push('/onboarding/risk-quiz'). Failure: toast.error('{Broker} connect failed', { description: handleApiError(e) }). Note the slug/broker_name mismatch: the card slug is 'angel' but the API payload broker_name is 'angelone'.

**Interactions.** Three OAuth rows perform a full-page redirect out to the broker's consent screen. Four credential rows toggle an inline expanding panel (arrow rotates 90°, aria-expanded flips); multiple panels can be open at once since each has its own boolean. Five independent password/token visibility toggles across the four forms (Dhan 1, Kotak 2, Alice 1; Angel's PIN field has no toggle). Four external links open in new tabs with rel=noreferrer. One ghost skip button. No modals, no sheets, no tabs.

**Responsive.** The column is capped at 672px with fixed 24px gutters, so it is effectively identical from tablet up and simply narrows on phones. The only breakpoint inside the page is sm (640px): the Angel One form's four fields go from a single column to a 2x2 grid. Every other form stays one column at all widths. The footer row does not wrap, so on very narrow screens the left sentence and the skip button compress side by side.

**Key copy.** • eyebrow: 'Step 1 of 3'
• h1: 'Let the agents run live'
• deck: 'Connect your broker so AutoPilot and the trading agents can act on real positions. Read-only at first. Place trades later from Settings → Broker. Free users can skip and run on the ₹10L paper account.'
• card header: 'Link a broker for live execution'
• group labels: 'Instant · one-click login' / 'Connect with a token'
• blurbs: "Kite Connect · OAuth · India's largest discount broker", 'API v2 · OAuth · Tier-1 NSE access', 'OAuth · API v3', 'SmartAPI · API key + TOTP · Pan-India retail', 'Access token', 'Neo API · Session token', 'ANT API · API session'
• reassurance: “You'll log in securely on Zerodha (Kite). We never see your password.”
• buttons: 'Connect Angel One', 'Connect Dhan', 'Connect Kotak Neo', 'Connect Alice Blue', 'Connecting…'
• badges: 'Beta'
• footer: 'Connect later anytime in Settings → Broker'
• skip: 'Skip — explore with a virtual ₹10L portfolio'

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a dark-theme onboarding step for an Indian AI trading app where the user links a stockbroker. Canvas #0D0D0E, a single 672px centred column with 24px side gutters, vertically centred, 24px between blocks. Header centred: an 11px uppercase wide-tracked #8FB0FF eyebrow 'Step 1 of 3'; a 24px semibold #F7F7F8 title 'Let the agents run live'; a 14px #96969E paragraph explaining that connecting a broker lets AutoPilot act on real positions, is read-only at first, and that free users can skip onto a ₹10L paper account. Below, one card with 12px radius, #151517 fill and a 1px #29292D border. Its header row is 44px tall with a bottom hairline, a 16px blue shield-check icon and a 16px semibold title 'Link a broker for live execution'. The card body is a stack of seven full-width rows with 8px gaps, each 6px radius, #1E1E21 fill and a 1px #29292D border, 12px padding, with the broker name at 14px medium #F7F7F8 above an 11px #96969E descriptor, and a 16px grey right-chevron on the far right. Above row one put an 11px uppercase #96969E label 'Instant · one-click login' and list Zerodha ('Kite Connect · OAuth · India's largest discount broker'), Upstox ('API v2 · OAuth · Tier-1 NSE access') and Fyers ('OAuth · API v3', with a small pill-shaped outlined 'Beta' tag); under each add a 10px #96969E reassurance line about logging in securely. Then an 11px uppercase label 'Connect with a token' above Angel One, Dhan, Kotak Neo and Alice Blue. Show one expanded state: under Angel One, an inset 6px-radius panel with #0D0D0E fill holding three numbered 11px grey help lines with blue underlined links, then a two-column grid of four 8px-radius inputs labelled API key, Client ID, PIN / Password and TOTP secret, and a full-width solid #406AE4 button 'Connect Angel One'. Footer: 12px grey text 'Connect later anytime in Settings → Broker' on the left and a borderless grey button 'Skip — explore with a virtual ₹10L portfolio' on the right.
```
</details>

---

## `/onboarding/risk-quiz` — Onboarding Step 2 — Risk calibration quiz

**File** `app/onboarding/risk-quiz/page.tsx` · **508 LOC** · **Access** authed (middleware-gated /onboarding/*). GET /api/onboarding/quiz is itself public (auth:false); POST and status are authed. If api.onboarding.status() reports completed, the page immediately router.replace()s to /copilot.

**Shell** — Standalone full-bleed page on bg-main with its own <main> column. App theme, dark default. No AppShell.

**Purpose.** Five questions that calibrate the risk engine. The answers set position sizing, daily loss caps, concurrency, signal-confidence filters and the recommended tier. One question is on screen at a time with auto-advance, so the whole thing is framed as a 60-second task.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Loading state** | Before the quiz resolves: div.min-h-screen.bg-main flex-centred with a single Loader2 at w-6 h-6 (24px) in accent ink, animate-spin. No skeleton of the eventual layout. |
| 2 | **Page frame** | div.min-h-screen.bg-main.text-d-text-primary wrapping main.max-w-2xl.mx-auto with px-4 md:px-6 and py-10 md:py-16 — 672px column, 16→24px gutters, 40→64px vertical padding. |
| 3 | **Header top row** | flex justify-between mb-6. Left: an inline-flex eyebrow at text-[10px] font-semibold tracking-wider uppercase in accent ink with a 12px Sparkles — 'Calibrate the AI · 60 seconds'. Right: a bare text button at text-[11px] muted → hover primary ink — 'Skip for now'. |
| 4 | **Headline** | h1 at text-[28px] md:text-[32px] font-semibold leading-tight: 'Teach AutoPilot how you trade.' |
| 5 | **Deck** | p mt-2 text-[13px] muted: '5 quick questions set how the risk engine sizes positions for you, plus your tier, signal filters, and hands-free defaults.' |
| 6 | **Progress bar** | mt-5, a 4px-tall (h-1) bg-wrap track with rounded-full and overflow-hidden, filled by an absolutely-positioned bg-primary (#406AE4) bar whose width is the percentage of ANSWERED questions (not the current index), transitioning on change. |
| 7 | **Progress caption** | p mt-1 text-[10px] muted with the .numeric class (Geist Mono, tabular): 'Question {idx+1} of {questions.length}' — reads 'Question 1 of 5' through 'Question 5 of 5'. |
| 8 | **Error banner** | Only when the quiz fetch or submit throws: mb-5, rounded-xs (6px), 1px border of down/40, bg down/10, px-3 py-2, text-[12px] in the down colour, carrying handleApiError()'s message. |
| 9 | **Question card** | section rounded-md (12px), 1px border-d-border, bg-wrap, p-5 md:p-6. Heading h2 at text-[15px] md:text-[17px] font-semibold primary ink. |
| 10 | **Option list** | mt-4 space-y-2. Each option is a full-width left-aligned button, px-4 py-3, rounded-xs (6px). Selected = .glass-control-accent (solid #406AE4 fill, 1px #406AE4, white ink, elev-1). Unselected = .glass-control (surface-2 fill + hairline) with secondary ink that lifts to primary ink on hover. |
| 11 | **Option radio + label** | Inside each option, flex gap-3: a 20x20 rounded-full 2px-border marker — border #406AE4 with a #406AE4 fill and a 12px white Check when picked, otherwise a bare border-d-border ring — followed by the option label at text-[13px]. |
| 12 | **Question 1 (key: experience)** | 'How long have you actively traded Indian equities?' → 'First year — still learning' / '1–3 years' / '3–7 years' / '7+ years'. |
| 13 | **Question 2 (key: risk_tol)** | 'If your portfolio dropped 15% in a single month, you would:' → 'Sell everything — stop the pain' / 'Trim positions, raise cash' / 'Hold and wait it out' / 'Buy more at lower prices'. |
| 14 | **Question 3 (key: horizon)** | 'How long do you typically hold a winning trade?' → 'Intraday — square off same day' / '3–10 days (swing)' / '1–3 months' / '1+ year — build a portfolio'. |
| 15 | **Question 4 (key: loss_cap)** | 'Largest loss you will accept on a single trade:' → '≤ 1% of capital' / '1–3%' / '3–5%' / '> 5% — I swing for the fences'. |
| 16 | **Question 5 (key: goal)** | 'Primary goal for trading with us:' → 'Preserve capital, beat FDs' / 'Generate steady income' / 'Grow capital over 3–5 years' / 'Aggressive compounding'. |
| 17 | **Footer nav** | mt-6 flex justify-between. Left: an inline-flex 'Back' at text-[12px] muted with a 14px ArrowLeft, disabled (opacity-40) on question 1. Right on questions 1–4: 'Next' at text-[12px] in accent ink with a trailing 14px ArrowRight, disabled until the current question is answered. |
| 18 | **Submit pill (last question only)** | Replaces 'Next' on question 5: .glass-control-accent inline-flex gap-2, px-6 py-2.5, rounded-full, text-[13px] font-semibold, active:scale-[0.98], disabled at opacity-40 until all five are answered. Idle content is a 14px Sparkles + 'Calibrate AutoPilot'; submitting swaps to a spinning 14px Loader2 + 'Calibrating…'. |
| 19 | **Reassurance footnote** | p mt-10 centred text-[10px] muted: 'You can always change your risk profile in Settings.' with Settings as an accent-ink hover:underline link to /settings. |

**Components** — `lib/api (onboarding.quiz, onboarding.status, onboarding.submit, onboarding.skip, handleApiError)` · `lib/onboardingStatusCache (invalidateOnboardingStatus, dynamically imported)` · `contexts/UiModeContext useUiMode` · `lib/icons (ArrowLeft, ArrowRight, Bot, Check, Crown, LineChart, Loader2, ShieldCheck, Sparkles, Target)`

**States & data.** On mount it fires api.onboarding.quiz() and api.onboarding.status() in parallel; a completed status triggers router.replace('/copilot') before anything renders. Loading is a bare centred 24px spinner. Fetch failure renders the red-tinted error banner and leaves the question region empty (no questions → no card, and the progress caption reads 'Question 1 of 0'). Picking an option writes into an answers map keyed by question key and, unless it is the last question, auto-advances after a 200ms timeout. Submit POSTs the answers map, stores the result and then dynamically imports invalidateOnboardingStatus() so /pricing and /settings see the new recommended tier without waiting out the 5-minute TTL. 'Skip for now' POSTs /api/onboarding/skip, invalidates the same cache and router.replace()s to /copilot. No toasts on this screen — all failure surfaces inline.

**Interactions.** Click-to-select with a 200ms auto-advance (the last question does not auto-submit; submission is an explicit click). Back/Next manual navigation that never loses answers. Skip-for-now escape hatch in the header. No keyboard shortcuts beyond native button focus, no modals, no tooltips.

**Responsive.** One column at all widths inside a 672px cap. Gutters step 16px → 24px at md (768px) and vertical padding 40px → 64px. The h1 steps 28px → 32px, the question heading 15px → 17px, and the question card padding 20px → 24px, all at md. The footer nav row does not wrap.

**Key copy.** • eyebrow: 'Calibrate the AI · 60 seconds'
• 'Skip for now'
• h1: 'Teach AutoPilot how you trade.'
• deck: '5 quick questions set how the risk engine sizes positions for you, plus your tier, signal filters, and hands-free defaults.'
• progress: 'Question 3 of 5'
• nav: 'Back' / 'Next'
• submit: 'Calibrate AutoPilot' → 'Calibrating…'
• footnote: 'You can always change your risk profile in Settings.'
• all five questions and twenty option labels are listed verbatim in the anatomy rows above

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a dark-theme one-question-at-a-time onboarding quiz for an Indian AI trading platform. Canvas #0D0D0E, content in a 672px centred column with 24px gutters and 64px top padding. Header: a row with a small 10px uppercase wide-tracked #8FB0FF eyebrow 'Calibrate the AI · 60 seconds' preceded by a 12px sparkle icon on the left, and an 11px #96969E text link 'Skip for now' on the right. Under it a 32px semibold #F7F7F8 headline 'Teach AutoPilot how you trade.' and a 13px #96969E paragraph '5 quick questions set how the risk engine sizes positions for you, plus your tier, signal filters, and hands-free defaults.' Then a 4px-tall full-width progress track in #151517 with a #406AE4 fill at 60%, and beneath it a 10px monospace #96969E caption 'Question 3 of 5'. Below the header, a question card with 12px radius, #151517 fill, a 1px #29292D border and 24px padding: a 17px semibold #F7F7F8 question 'How long do you typically hold a winning trade?' followed by four stacked full-width answer buttons with 8px gaps, each 6px radius with 16px horizontal and 12px vertical padding. Three are unselected — #1E1E21 fill, 1px #29292D border, 13px #D3D3D7 label, and a 20px hollow circle with a 2px #29292D ring. One is selected — solid #406AE4 fill, white 13px label, and a 20px filled circle with a white checkmark. Answer labels: 'Intraday — square off same day', '3–10 days (swing)', '1–3 months', '1+ year — build a portfolio'. Footer row: a dim 12px 'Back' with a left arrow, and on the right a solid #406AE4 pill button with white 13px semibold 'Calibrate AutoPilot' and a leading sparkle. Close with a centred 10px #96969E line 'You can always change your risk profile in Settings.'
```
</details>

---

## `/onboarding/risk-quiz (result)` — Onboarding Step 2 — Risk profile result

**File** `app/onboarding/risk-quiz/page.tsx` · **508 LOC** · **Access** authed. The screen renders the server-computed profile, so it depends on a successful POST /api/onboarding/quiz.

**Shell** — Same standalone page shell — bg-main, main.max-w-2xl, px-4 md:px-6, py-10 md:py-16. Replaces the quiz in-place after submit; no route change.

**Purpose.** Delivers the verdict: a named risk profile with its score out of 15, a plain-English rationale, the tier the engine recommends, and the exact numeric presets that were just applied to signal filtering and AutoPilot sizing.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Verdict hero block** | rounded-lg (16px) with an inline-styled 4px LEFT border. borderColor = color-mix(in srgb, {profileColor} 33%, transparent) and background = color-mix(in srgb, {profileColor} 3%, transparent), where profileColor is var(--color-primary) #406AE4 for 'conservative' and var(--color-warning) (#F0A94F dark / #9A4D00 light) for both 'moderate' and 'aggressive'. Padding p-6 md:p-8. |
| 2 | **Hero eyebrow** | p text-[10px] uppercase tracking-wider muted: 'Your risk-engine profile'. |
| 3 | **Hero profile word** | h1 at text-[36px] md:text-[44px] font-semibold, capitalize, mt-1 — renders the raw profile string as 'Conservative' / 'Moderate' / 'Aggressive'. Colour is .text-signature (#8FB0FF dark / #3459C9 light) for conservative and .text-warning for moderate and aggressive. |
| 4 | **Score line** | p .numeric (Geist Mono tabular) text-[12px] muted mt-1: 'Score 8/15'. The scale is fixed at 15 (5 questions x 0–3). |
| 5 | **Rationale** | p mt-4 text-[13px] secondary ink leading-relaxed — the backend sentence, e.g. 'Balanced — full signal access with regime-aware sizing (score 8/15). Pro tier matches — unlimited signals + AutoPilot Lite (live auto-trading up to ₹2L) + Portfolio Doctor.' Conservative and aggressive variants read 'Capital-preservation first — tight SLs, larger cash buffer, long horizons' and 'High-conviction, concentrated bets — shorter horizons welcome'. |
| 6 | **Recommended tier card** | mt-4, rounded-md (12px), 1px border-d-border, bg-wrap, p-5. flex justify-between gap-3. |
| 7 | **Tier card left** | p text-[10px] uppercase tracking-wider muted 'Recommended tier'; below it a text-[20px] font-semibold row with a 20px icon and the label — Free → ShieldCheck in .text-signature, Pro → Target in .text-signature, Elite → Crown in .text-warning. |
| 8 | **Tier card right** | A Link to /pricing styled .glass-control inline-flex gap-1.5 px-4 py-2 rounded-full at text-[12px] primary ink — 'See plans'. |
| 9 | **Presets card** | mt-4, rounded-md (12px), 1px border-d-border, bg-wrap, p-5. Eyebrow p text-[10px] uppercase tracking-wider muted mb-3: 'How the engines are sized for you'. |
| 10 | **Preset item 1 — signal filter** | li at text-[12px] secondary ink: bold-ish primary-ink lead 'Signal filter:' then 'min confidence ' and the number in .numeric accent ink with a % — 80% conservative / 70% moderate / 60% aggressive. Two optional suffixes append conditionally: ' · intraday on' and ' · F&O on'. |
| 11 | **Preset item 2 — AutoPilot sizing** | 'AutoPilot sizing: max {n}% per position · daily loss cap {n}%' with both numbers in .numeric accent ink. Backend values: conservative 5% / 1.5%, moderate 7% / 2%, aggressive 10% / 3%. |
| 12 | **Preset item 3 — concurrency** | 'Concurrent positions: up to {n}' with the number in .numeric accent ink — 8 conservative, 12 moderate, 15 aggressive. |
| 13 | **Presets footnote** | p mt-3 text-[10px] muted: 'You can tune any of these from Settings.' with Settings as an accent-ink hover:underline link. |
| 14 | **Footer actions** | mt-6 flex flex-wrap justify-between gap-3. Left: a Link to /settings at text-[12px] muted → hover primary ink, 'Adjust defaults'. Right: the primary pill .glass-control-accent inline-flex gap-2 px-6 py-2.5 rounded-full text-[13px] font-semibold active:scale-[0.98] — 'Continue' + 14px ArrowRight, which advances to the in-page mode-choice screen (no route change). |
| 15 | **Absent** | There is no chart, gauge or meter on this screen — the profile is communicated with the tinted hero block, a big word, and three text lines. No WinRateGauge, no Sparkline, no Verdict component. |

**Components** — `PROFILE_COLOR / PROFILE_TEXT / TIER_COPY maps (local to the page)` · `lib/icons (ShieldCheck, Target, Crown, Sparkles, ArrowRight)` · `next/link → /pricing and /settings`

**States & data.** Purely a render of the POST /api/onboarding/quiz response: { risk_profile, recommended_tier, score, rationale, suggested_filters, auto_trader_defaults }. No fetch of its own, no loading or empty state — it only mounts once a result exists. It has already invalidated the onboarding-status cache by the time it paints. No live/polling behaviour. Tier mapping from the backend: intraday horizon or an aggressive profile → 'pro'; conservative + preservation goal → 'free'; aggressive profile + aggressive goal + 3+ years experience → 'elite'.

**Interactions.** Two outbound links (/pricing 'See plans', /settings 'Adjust defaults') and one 'Continue' that swaps the in-page screen to the mode chooser. No tabs, filters, modals or charts.

**Responsive.** 672px cap; gutters 16px → 24px and vertical padding 40px → 64px at md (768px). Hero type steps 36px → 44px and hero padding 24px → 32px at md. The two info cards are always full-width single-column. The footer action row uses flex-wrap, so on narrow phones 'Adjust defaults' and the Continue pill stack.

**Key copy.** • eyebrow: 'Your risk-engine profile'
• score: 'Score 8/15'
• 'Recommended tier' / 'See plans'
• 'How the engines are sized for you'
• 'Signal filter: min confidence 70%' (+ ' · intraday on', ' · F&O on')
• 'AutoPilot sizing: max 7% per position · daily loss cap 2%'
• 'Concurrent positions: up to 12'
• 'You can tune any of these from Settings.'
• 'Adjust defaults' / 'Continue'
• rationales: 'Capital-preservation first — tight SLs, larger cash buffer, long horizons', 'Balanced — full signal access with regime-aware sizing', 'High-conviction, concentrated bets — shorter horizons welcome'
• tier sentences: 'Free tier is enough to start — watch AutoPilot trade virtual money, upgrade when ready.', 'Pro tier matches — unlimited signals + AutoPilot Lite (live auto-trading up to ₹2L) + Portfolio Doctor.', 'Elite matches — AutoPilot without capital caps, F&O strategies, Counterpoint debate, unlimited everything.'

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a dark-theme results screen that reveals a trader's calibrated risk profile in an Indian AI trading app. Canvas #0D0D0E, 672px centred column, 24px gutters, 64px top padding, 16px between blocks. Hero block first: a 16px-radius panel with a 4px-thick left edge in a warm amber, a barely-there amber tint fill at about 3% opacity and a 33%-opacity amber hairline border, 32px padding. Inside it a 10px uppercase wide-tracked #96969E eyebrow 'Your risk-engine profile'; a 44px semibold amber (#F0A94F) word 'Moderate'; a 12px monospace #96969E line 'Score 8/15'; and a 13px #D3D3D7 relaxed paragraph 'Balanced — full signal access with regime-aware sizing (score 8/15). Pro tier matches — unlimited signals + AutoPilot Lite (live auto-trading up to ₹2L) + Portfolio Doctor.' Next, a 12px-radius #151517 card with a 1px #29292D border and 20px padding, laid out as a justified row: on the left a 10px uppercase #96969E label 'Recommended tier' above a 20px semibold #8FB0FF row with a target icon reading 'Pro'; on the right a small outlined pill button 'See plans' with a #1E1E21 fill. Then a second identical card containing a 10px uppercase label 'How the engines are sized for you' and three 12px #D3D3D7 bullet lines where the leading phrase is white and every number is monospace #8FB0FF: 'Signal filter: min confidence 70%', 'AutoPilot sizing: max 7% per position · daily loss cap 2%', 'Concurrent positions: up to 12', closing with a 10px grey line 'You can tune any of these from Settings.' Footer: a dim 12px link 'Adjust defaults' on the left and a solid #406AE4 pill 'Continue' with a right arrow on the right. Use no charts or gauges.
```
</details>

---

## `/onboarding/risk-quiz (mode choice)` — Onboarding Step 2b — Managed vs Pro mode

**File** `app/onboarding/risk-quiz/page.tsx` · **508 LOC** · **Access** authed. The choice writes a UI mode ('managed' | 'pro') through UiModeContext.setMode, which permanently changes the app shell the user gets afterwards.

**Shell** — Same standalone page shell — bg-main, main.max-w-2xl, px-4 md:px-6, py-10 md:py-16. Third in-page screen of the quiz route.

**Purpose.** The fork that decides which product the user actually sees: 'managed' gives a plain-language Simple view where AutoPilot runs the book on the user's own broker account, 'pro' gives the full terminal. It is presented as a two-card choice with one card marked Suggested based on their quiz answers.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Page frame** | Same wrapper as the quiz and result screens: min-h-screen bg-main, main max-w-2xl mx-auto, px-4 md:px-6, py-10 md:py-16. |
| 2 | **Header** | mb-8, text-center. h1 at text-[28px] md:text-[34px] font-semibold: 'Hand the AI the wheel, or grip it yourself?'. p mt-2 text-[13px] muted: 'Same engines underneath. Switch modes any time in Settings.' |
| 3 | **Choice grid** | grid gap-4 (16px), single column below md then md:grid-cols-2 — exactly two cards, no third option and no 'decide later' escape. |
| 4 | **Card chrome** | Each option is a full-width button styled .glass-control (surface-2 fill + 1px hairline), relative, rounded-lg (16px), p-6 (24px), text-left, transition-colors, and disabled:opacity-60 while a choice is being written. |
| 5 | **Suggested badge** | Absolutely positioned right-4 top-4 on the recommended card only: rounded (4px) bg-primary/15, px-2 py-0.5, text-[10px] font-semibold uppercase tracking-wide in accent ink — 'Suggested'. The recommendation is 'managed' when the experience answer was 'new', otherwise 'pro'. |
| 6 | **Card icon** | A 28px (h-7 w-7) icon in accent ink at the top of the card — Bot for managed, LineChart for pro. |
| 7 | **Card title** | h2 mt-3 at text-[18px] font-semibold — 'Manage it for me' and “I'll trade myself”. |
| 8 | **Managed body copy** | p mt-2 text-[12px] leading-relaxed secondary ink: 'AutoPilot runs the book on your own broker account: ML-ranked picks, risk-gated sizing, and exits, all inside your limits with a kill switch always in your hands.' |
| 9 | **Managed bullets** | ul mt-3 space-y-1.5, three items, each flex items-start gap-1.5 at text-[12px] muted with a 12px accent-ink Check offset mt-0.5: 'Plain-language Simple view: money, risk, activity', 'No charts or jargon', 'You stay in control: pause any time'. |
| 10 | **Pro body copy** | p mt-2 text-[12px] leading-relaxed secondary ink: 'The full terminal: ML signals, strategy builder, scanners, walk-forward backtesting and bot execution. Every tool, full control.' |
| 11 | **Pro bullets** | Three items in the same style: 'ML signals with entry / stop / target', 'Build + walk-forward backtest strategies', 'AI agents on every page'. |
| 12 | **Card action affordance** | A span (not a nested button) at mt-4, inline-flex gap-1.5, text-[13px] font-semibold accent ink, containing a 14px ArrowRight — or a 14px spinning Loader2 while that card is busy — followed by the word 'Choose'. |
| 13 | **Busy behaviour** | Clicking either card sets a busy flag; both cards then render at opacity-60 and reject further clicks, and only the clicked card swaps its arrow for a spinner. |

**Components** — `contexts/UiModeContext useUiMode / setMode` · `lib/icons (Bot, LineChart, Check, ArrowRight, Loader2)`

**States & data.** No fetch. The recommendation is derived locally from the quiz answers map (answers.experience === 'new' → 'managed', else 'pro'). Choosing awaits setMode(mode) — which persists the UI mode — then router.replace('/onboarding/complete'). There is no error state rendered here: a setMode failure would leave the cards stuck in the busy/opacity-60 state with no message. No skeleton, no empty state, no polling.

**Interactions.** Two whole-card buttons; clicking either is terminal for this screen. No back affordance to the result screen, no skip, no modal, no tooltip.

**Responsive.** Below md (768px) the two cards stack full-width in one column, so the 'Suggested' badge sits at the top-right of whichever card is first; at md+ they sit side by side inside the 672px cap (roughly 328px each). Headline steps 28px → 34px at md; gutters 16px → 24px; vertical padding 40px → 64px.

**Key copy.** • h1: 'Hand the AI the wheel, or grip it yourself?'
• sub: 'Same engines underneath. Switch modes any time in Settings.'
• badge: 'Suggested'
• titles: 'Manage it for me' / “I'll trade myself”
• managed body: 'AutoPilot runs the book on your own broker account: ML-ranked picks, risk-gated sizing, and exits, all inside your limits with a kill switch always in your hands.'
• managed bullets: 'Plain-language Simple view: money, risk, activity', 'No charts or jargon', 'You stay in control: pause any time'
• pro body: 'The full terminal: ML signals, strategy builder, scanners, walk-forward backtesting and bot execution. Every tool, full control.'
• pro bullets: 'ML signals with entry / stop / target', 'Build + walk-forward backtest strategies', 'AI agents on every page'
• action: 'Choose'

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a dark-theme two-option mode chooser for an Indian AI trading app, the moment where a new user decides whether the AI trades for them or they trade themselves. Canvas #0D0D0E, content in a 672px centred column with 24px gutters and 64px top padding. Centred header: a 34px semibold #F7F7F8 headline 'Hand the AI the wheel, or grip it yourself?' and a 13px #96969E line 'Same engines underneath. Switch modes any time in Settings.' Below, two equal side-by-side cards with a 16px gap, each 16px radius, #1E1E21 fill, 1px #29292D border and 24px padding, left-aligned content, and each behaving as one large clickable target. Left card: a 28px #8FB0FF robot icon, an 18px semibold #F7F7F8 title 'Manage it for me', a 12px #D3D3D7 paragraph 'AutoPilot runs the book on your own broker account: ML-ranked picks, risk-gated sizing, and exits, all inside your limits with a kill switch always in your hands.', then three 12px #96969E bullet lines each prefixed by a 12px blue check — 'Plain-language Simple view: money, risk, activity', 'No charts or jargon', 'You stay in control: pause any time' — and finally a 13px semibold #8FB0FF row with a right arrow reading 'Choose'. In this card's top-right corner place a small 4px-radius badge with a 15%-opacity blue fill and 10px uppercase #8FB0FF text reading 'Suggested'. Right card is identical in structure with a line-chart icon, the title 'I'll trade myself', the paragraph 'The full terminal: ML signals, strategy builder, scanners, walk-forward backtesting and bot execution. Every tool, full control.', bullets 'ML signals with entry / stop / target', 'Build + walk-forward backtest strategies', 'AI agents on every page', and the same 'Choose' row, with no badge. Stack the two cards vertically below 768px.
```
</details>

---

## `/onboarding/complete` — Onboarding Step 3 — You're set up

**File** `app/onboarding/complete/page.tsx` · **109 LOC** · **Access** authed (middleware-gated). Reads live broker state via SWR, so the confirmation line is broker-gated: connected vs virtual paper account.

**Shell** — Standalone full-bleed centred column (no layout under app/onboarding). App theme, dark default. No AppShell, no sidebar, no footer.

**Purpose.** Celebrates activation and immediately converts it into a first action. Rather than a generic 'done' screen it offers four concrete destinations plus one large CTA, and it tells the user in one line whether they are running on live broker data or the ₹10L paper account.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Page frame** | div.mx-auto.flex.min-h-screen.max-w-2xl.flex-col.justify-center.gap-6.px-6.py-12.text-center — 672px cap, 24px gutters, 48px vertical padding, 24px between blocks, everything centre-aligned, vertically centred in the viewport. |
| 2 | **Success medallion** | mx-auto, 56x56 (h-14 w-14) inline-flex, rounded-full, bg-primary/10 with ring-1 ring-primary/30, containing a 28px CheckCircle2 in accent ink. |
| 3 | **Eyebrow** | p text-[11px] uppercase tracking-wider in accent ink: 'Step 3 of 3'. |
| 4 | **Headline** | h1 text-2xl (24px) font-semibold primary ink: “You're set up.” |
| 5 | **Deck** | p text-sm (14px) muted: 'Quant X is calibrated to your risk profile and ready to publish signals. Try one of these to start.' |
| 6 | **Broker status line — connected** | When useBrokerStatus reports a connection: an inline-flex centred p at text-[13px] font-medium in the UP colour (#10B981 dark / #0A6B50 light) with a 14px CheckCircle2 — '{brokerName} connected — live data is on.' The broker name is the raw broker_name string from the API (e.g. 'zerodha'). |
| 7 | **Broker status line — not connected** | Otherwise a p at text-[13px] muted: “No broker yet — you're on the virtual ₹10L portfolio. Connect anytime in Settings.” There is no third loading variant — while SWR is in flight this branch renders. |
| 8 | **Action grid** | grid grid-cols-1 sm:grid-cols-2 gap-3 (12px) — exactly 4 cards. Each is a foundation <Card variant="clickable"> (12px radius, bg-wrap, 1px border-line, no shadow at rest; hover raises to border-wrap-line + elev-2 and lifts by 1px; active drops back) wrapped in a next/link with className='contents' so the anchor contributes no box. CardBody keeps 20px/16px padding and is text-left despite the page being text-center. |
| 9 | **Card 1 — Command Center** | Link → /copilot. Title p at text-sm font-medium primary ink 'Open Command Center'; sub p at text-[11px] muted “Live regime, today's top signals, your watchlist.” |
| 10 | **Card 2 — Copilot** | Link → /copilot (same destination as card 1). Title is a flex row with a 14px Sparkles in accent ink + 'Ask Copilot'; sub is the quoted prompt '"Show me my top swing setup today."' at 11px muted. |
| 11 | **Card 3 — Paper trade** | Link → /paper-trading. Title 'Place a paper trade'; sub '₹10L paper account seeded; equity-curve from day 1.' |
| 12 | **Card 4 — Strategies** | Link → /strategies. Title 'Browse strategies'; sub 'Deploy a template or build one in plain English.' |
| 13 | **Primary CTA** | A final Link → /copilot styled .glass-control-accent inline-flex h-11 (44px) items-center justify-center rounded-full px-6 at text-base (16px) font-medium with active:scale-[0.98] — solid #406AE4, white ink, elev-1, hover #3055C2. Label 'Go to Command Center'. |
| 14 | **Note on completion** | The file's header comment describes marking onboarding_completed on arrival, but this component renders no completion side effect itself — it only reads broker status. Nothing on the screen indicates persistence. |

**Components** — `components/foundation Card / CardBody (variant='clickable')` · `lib/hooks/useBrokerStatus (SWR '/api/broker/connections')` · `lib/icons (CheckCircle2, Sparkles)` · `next/link`

**States & data.** One data dependency: useBrokerStatus() → SWR on '/api/broker/connections' with revalidateOnFocus false and a 30-second dedupe. It returns isConnected/brokerName by finding the first connection whose status === 'connected'. There is NO skeleton and no explicit loading or error state — while loading or on failure the component simply renders the 'No broker yet' variant, so a connected user can briefly see the paper-account line before it flips. No toasts, no polling beyond SWR's defaults, no empty state (the four action cards are hardcoded).

**Interactions.** Five navigation targets and nothing else: four whole-card links (two of which point at /copilot) plus the pill CTA to /copilot. Cards lift 1px on hover and settle on active. No modals, tabs, filters or keyboard shortcuts.

**Responsive.** The action grid is one column below sm (640px) and two columns at sm+, inside a 672px cap with fixed 24px gutters — so on desktop it is a 2x2 of roughly 312px cards, and on a phone it is four stacked full-width cards. All typography is fixed-size; nothing else changes. The pill CTA stays inline-sized and centred at every width.

**Key copy.** • eyebrow: 'Step 3 of 3'
• h1: “You're set up.”
• deck: 'Quant X is calibrated to your risk profile and ready to publish signals. Try one of these to start.'
• connected: '{broker} connected — live data is on.'
• not connected: “No broker yet — you're on the virtual ₹10L portfolio. Connect anytime in Settings.”
• card 1: 'Open Command Center' / “Live regime, today's top signals, your watchlist.”
• card 2: 'Ask Copilot' / '"Show me my top swing setup today."'
• card 3: 'Place a paper trade' / '₹10L paper account seeded; equity-curve from day 1.'
• card 4: 'Browse strategies' / 'Deploy a template or build one in plain English.'
• CTA: 'Go to Command Center'

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a dark-theme onboarding completion screen for an Indian AI trading app. Canvas #0D0D0E, a 672px centred column with 24px gutters, everything vertically centred and centre-aligned, 24px between blocks. Top: a 56px circle with a 10%-opacity blue fill and a 30%-opacity #406AE4 ring, holding a 28px #8FB0FF circled checkmark. Under it an 11px uppercase wide-tracked #8FB0FF eyebrow 'Step 3 of 3'; a 24px semibold #F7F7F8 headline 'You're set up.'; a 14px #96969E line 'Quant X is calibrated to your risk profile and ready to publish signals. Try one of these to start.'; then a 13px medium #10B981 line with a small green check reading 'zerodha connected — live data is on.' (also show an alternate grey variant reading 'No broker yet — you're on the virtual ₹10L portfolio. Connect anytime in Settings.'). Below, a two-by-two grid of four clickable cards with 12px gaps, each 12px radius, #151517 fill, a 1px #29292D border, no shadow at rest and 20px horizontal by 16px vertical padding, with left-aligned text inside even though the page is centred. Card one: 14px medium #F7F7F8 'Open Command Center' over an 11px #96969E line 'Live regime, today's top signals, your watchlist.' Card two: a 14px blue sparkle icon beside 'Ask Copilot' over the quoted line '"Show me my top swing setup today."' Card three: 'Place a paper trade' over '₹10L paper account seeded; equity-curve from day 1.' Card four: 'Browse strategies' over 'Deploy a template or build one in plain English.' Show the hover state of one card lifted 1px with a lighter #3B3B40 border and a soft shadow. Finish with a centred 44px-tall solid #406AE4 pill button, white 16px medium label 'Go to Command Center'. Stack the four cards in one column below 640px.
```
</details>

---
