# Quant X — Frontend (Product App)

Next.js (App Router) product application: signals, stocks, portfolio, strategies, trades, watchlist, copilot, settings, auth, admin.

Part of the [Quantx1](https://github.com/Quantx1) org: [landing](https://github.com/Quantx1/landing) · **frontend** · [backend](https://github.com/Quantx1/backend) · [ml](https://github.com/Quantx1/ml)

> The public marketing/legal pages (`/`, `/pricing`, `/privacy`, `/terms`, `/proof`) live in the separate [landing](https://github.com/Quantx1/landing) repo. This app's root path redirects to `/copilot` (the authenticated home).

## Setup

```bash
npm install
cp .env.example .env.local   # fill in values
```

Required env: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_WS_URL`, `API_URL`.

## Run

```bash
npm run dev        # dev server on :3000
npm run build      # production build (requires NEXT_PUBLIC_API_URL)
npm run test:e2e   # playwright
```

## Deploy

Deploy the repo root directly (Vercel auto-detects Next.js — no `vercel.json` needed). Set the env vars above in project settings. Route the marketing paths (`/`, `/pricing`, `/privacy`, `/terms`, `/proof`) to the landing deployment at the DNS/edge level (e.g. landing on the apex domain, this app on `app.` subdomain).
