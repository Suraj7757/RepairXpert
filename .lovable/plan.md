# RepairXpert — Master Implementation Plan v3

> Aim: site ko phone + PC dono pe blazing fast, offline-capable, error-free, sundar animation aur smart AI ke saath chalana. Vercel + Supabase ke saath full sync.

---

## 🩹 Phase 0 — Critical Fixes (RUNNING NOW)

| # | Issue | Fix |
|---|-------|-----|
| 0.1 | Google OAuth Vercel pe blank/redirect-loop | `redirectTo` ko `/auth/callback` dedicated route → URL hash parse → home pe push. Site URL + Redirect URLs Lovable Cloud me whitelist. |
| 0.2 | Auth context me `TOKEN_REFRESHED` event ko logout treat karta hai | Sirf `SIGNED_OUT` pe redirect, `TOKEN_REFRESHED` skip. |
| 0.3 | AI assistant 2x round-trip (tool-call + stream) → slow | Single-pass smart routing: tool-detection regex → skip if not needed. Default `gemini-3-flash-preview` (fastest). |
| 0.4 | Sidebar/Header lazy import → flicker | Route-level `lazy()` + Suspense skeleton |
| 0.5 | Console errors / 404 routes audit | Add `/auth/callback`, fix marketplace nav |
| 0.6 | Wallet RLS self-update (already done in earlier phase) | Verified |

## 🧠 Phase 1 — Multi-AI Smart Gateway

Edge function `ai-assistant` ko upgrade:
- **Auto-routing**: short Q → `gemini-2.5-flash-lite` (fastest, cheap), code/repair → `gemini-3-flash-preview`, complex reasoning → `openai/gpt-5-mini`, image → `gemini-3.1-flash-image-preview`.
- **Skip tool-call hop** when message has no tracking-ID/help keyword → 50% latency cut.
- **Streaming-first** response.
- New edge function `ai-vision` for photo-based diagnosis (AC/phone screen photo upload → fault).

## 📴 Phase 2 — Offline-First Sync (PWA + IndexedDB)

- `idb-keyval` ya custom Dexie wrapper se local cache: jobs, customers, inventory, sells, settings.
- **Outbox pattern**: offline create/edit → write queue → online aate hi auto-flush.
- Service worker: stale-while-revalidate for API GETs, network-first for mutations.
- "Saved locally — syncing…" toast + green tick on success.
- Conflict resolution: last-write-wins with `updated_at` compare.

## ⚡ Phase 3 — Daily-Use Power Features

- **FAB (Floating Action Button)**: 1-tap → New Job / Sell / Payment / Expense
- **Cmd/Ctrl + K** global command palette (kbar) — search jobs/customers/inventory + quick actions
- **Voice input** (Web Speech API) — Hindi/English customer name + problem dictate
- **Daily summary** push (PWA) — subah pending jobs, shaam earnings recap
- **WhatsApp 1-click receipt** every job/sell/payment

## 🎨 Phase 4 — UI Polish + Animations

- Page transitions via framer-motion (already), add card stagger
- Skeleton loaders on every list
- Mobile bottom-nav improved (5 icons + active glow)
- Dark/Light auto-theme by OS preference
- Hero gradient animations on Landing
- Reduce bundle: route-level code-split + image lazy

## 🛣️ Phase 5 — Routing Audit & Hardening

- Add `<NotFound>` catch + log to Sentry-lite
- All `<Link>` instead of `window.location`
- Vercel `vercel.json` rewrite verified ✓
- 404 page CTA → `/dashboard` or `/`

---

## Order of execution (auto)
Phase 0 → 1 → 2 → 3 → 4 → 5. Aap "next" bolein to agla phase chalu.

Aaj Phase 0 + Phase 1 deliver ho rahe hain.
