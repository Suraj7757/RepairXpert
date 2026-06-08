
# RepairXpert — Full Professional Rebuild Plan

Goal: Ek aisa platform jisme **customer ecom + repair booking + shopkeeper CRM + wholesaler B2B + super admin** sab ek hi RepairXpert brand ke andar professional grade par chale. Existing data safe rahega — sirf naya design system, naye flows, missing pieces add honge.

---

## Phase 0 — Design System & Branding (foundation)

Bina ise pehle kiye baaki sab time waste hoga.

- **Brand tokens** (`index.css` + `tailwind.config.ts`):
  - Primary `#4f46e5` (indigo), Accent `#22d3ee` (cyan), BG `#0a0a1a`, Surface `#141432`
  - Gradients: `--gradient-hero`, `--gradient-card`, `--gradient-accent`
  - Shadows: `--shadow-glow`, `--shadow-card`, `--shadow-elevated`
  - Radius scale, spacing scale, motion timings
- **Typography**: Space Grotesk (display) + Inter (body) — load via `<link>`, set Tailwind font families
- **Component variants**: Button (premium/glow/ghost-glass), Card (glass/elevated/gradient-border), Badge (status colors), Input (focus-glow)
- **Logo & favicon**: RepairXpert wordmark + tool/spark icon, generated SVG
- **3 role-specific layout shells**:
  - `CustomerLayout` — top nav (logo, search, cart, profile), no sidebar (mobile-first ecom feel)
  - `ShopLayout` — collapsible sidebar (current style refined) + topbar with shop name, plan badge, notifications
  - `AdminLayout` — dense sidebar, command palette, dark accent

---

## Phase 1 — Customer Ecom + Repair Booking (revenue priority)

### Public/Customer routes
```text
/                          Landing (Shop / Book Repair / AI Diagnose / Become Seller)
/marketplace               Browse all products (filters: category, price, location, rating)
/shops                     Browse shops near me (map + list)
/shop/:slug                Public shop page (products, services, reviews, book)
/listing/:id               Product detail (gallery, specs, seller card, related)
/track                     Public order/job tracking
/auth                      Login/Signup (Customer | Shopkeeper tabs)

/customer                  Dashboard (active orders, bookings, recommendations)
/customer/cart
/customer/checkout         Address → payment method → confirm
/customer/orders           Marketplace orders + repair bookings combined
/customer/orders/:id       Status timeline, invoice download, chat with shop
/customer/book             AI-first booking: device → problem → photo → AI quote → pick shop
/customer/ai-diagnostic    Standalone AI diagnosis chat
/customer/wishlist
/customer/wallet           Loyalty points + referrals + ad rewards
/customer/addresses
/customer/settings
```

### Unique features (the differentiators)
1. **AI-first repair booking** (`/customer/book`):
   - Step 1: Pick device category (phone/laptop/AC/bike etc.)
   - Step 2: Describe problem OR upload photo
   - Edge function `ai-repair-quote` → Lovable AI (Gemini 3 Flash) returns: likely issue, parts needed, estimated cost range, urgency
   - Step 3: Show 3 nearest shops sorted by rating + distance + AI confidence
   - Step 4: One-click book → creates `booking_request` row, notifies shop
2. **Hyperlocal shop discovery** (`/shops`):
   - Browser geolocation → filter `shop_settings` by `map_lat/map_lng` distance
   - Map view (Leaflet, no API key) + list view toggle
   - Live availability badge (shop online/offline based on last activity)
3. **Unified cart & checkout**: single seller per order (already enforced in `place_marketplace_order` RPC). Cash on delivery + UPI manual payment.
4. **Order timeline**: real-time status from `order_status_history`, with WhatsApp share + invoice PDF.

### Backend additions
- New edge function: `ai-repair-quote` (input: device, problem, optional image base64 → output: structured quote)
- New RPC: `nearby_shops(_lat, _lng, _radius_km)` returns shops sorted by distance
- New table: `customer_addresses` (id, user_id, label, line1, city, pincode, lat, lng, is_default)
- Extend `marketplace_orders` with `address_id` FK
- Reviews on delivery: trigger prompt after `delivered` status

---

## Phase 2 — Shopkeeper CRM Polish + White-Label

### Routes (all under `/shop/*`)
```text
/shop                      Dashboard (KPIs, today's jobs, low-stock, revenue chart)
/shop/jobs                 Repair jobs (kanban + list)
/shop/bookings             Incoming customer bookings → 1-click convert to job
/shop/customers            CRM with notes, history, loyalty
/shop/inventory            Stock + barcode scanner + auto-publish to marketplace
/shop/listings             Marketplace listings (publish/unpublish/edit)
/shop/orders               Marketplace orders received (kanban by status)
/shop/sells                In-store sales
/shop/payments             Payment log + QR receivers
/shop/settlements          Admin/staff revenue split cycles
/shop/expenses
/shop/loyalty
/shop/staff                Staff management + earnings
/shop/branches             Multi-location
/shop/analytics            Charts: revenue trend, top devices, conversion
/shop/reports              Exportable PDFs
/shop/wallet
/shop/subscription         Plan, renewal, promo codes
/shop/settings             Shop profile, hours, services, booking slug, QR codes, white-label
/shop/trash
```

### White-label feature (NEW)
- Each shop gets `repairxpert.com/shop/<slug>` public page (already exists, will be redesigned)
- Settings → "Branding" tab: upload logo, pick accent color, custom welcome message, social links
- Shop public page renders with their branding (not RepairXpert default)
- Custom domain support deferred (Phase 6)

### CRM polish
- Kanban view for jobs (drag between Received → In Progress → Ready → Delivered)
- Bulk actions (mark paid, send WhatsApp reminder, export)
- Search across customers/jobs/orders from topbar (Cmd+K command palette)
- Real-time notification bell using Supabase Realtime on `booking_requests` + `marketplace_orders`

---

## Phase 3 — Wholesaler B2B Module

```text
/wholesale                 Wholesale dashboard
/wholesale/catalog         Manage bulk catalog (MOQ, tier pricing)
/wholesale/orders          Orders from shopkeepers
/wholesale/buyers          Approved shopkeeper buyers
```

- Shopkeepers see "Wholesale" tab in marketplace → `wholesale_catalog` listings with MOQ enforcement
- New RPC: `place_wholesale_order` (validates MOQ, buyer must be approved shopkeeper)
- Wholesaler approves new buyer requests

---

## Phase 4 — Super Admin Control Center

Split current `AdminPanel.tsx` into proper pages:
```text
/admin                     Platform KPIs (GMV, active shops, customers, AI quotes today)
/admin/applications        Shopkeeper signup approvals
/admin/users               All users (ban, set role, set plan, adjust wallet)
/admin/shops               All shops (revenue, plan, last active)
/admin/orders              All marketplace orders (read-only)
/admin/payments            UPI payment submissions → verify with screenshot
/admin/withdrawals         Wallet withdraw requests
/admin/promos              Promo codes
/admin/ads                 Watch-and-earn ads management
/admin/broadcast           Send announcement to all users
/admin/reviews             Moderate shop reviews
/admin/refunds
/admin/settings            Maintenance mode, AI toggle, fee config
```

All RPCs already exist (`admin_set_user_plan`, `admin_set_role`, `admin_adjust_wallet`, `approve_shopkeeper_application`). Just need clean UI.

---

## Phase 5 — Auth, Onboarding, Subscription

- **Signup**: tabs Customer | Shopkeeper (Shopkeeper → fills business form → goes to `pending` state → admin approves → role flips)
- **Login**: email/password + Google OAuth (already configured)
- **Password reset**: existing `/reset-password` page
- **7-day auto trial** on shopkeeper signup (existing trigger handles this)
- **Subscription lock**: when trial expires, shop CRM shows upgrade modal blocking writes; reads still work; customer + admin unaffected
- **Plans**: Free Trial (7d) → Starter ₹299/mo → Pro ₹799/mo → Business ₹1999/mo. Differentiation: listings count, staff seats, analytics depth, white-label
- **Manual UPI**: pay to patna14@ptyes → upload screenshot + UTR → admin verifies → plan activated

---

## Phase 6 — Polish, PWA, SEO, Performance

- PWA: existing manifest + service worker, add install prompt on customer side
- SEO: per-page `<title>`, meta description, OG tags, JSON-LD for shops (LocalBusiness) and products (Product)
- Sitemap auto-generated from active shops + listings
- Mobile bottom nav for customer (Home / Browse / Cart / Orders / Account)
- Loading skeletons everywhere (no blank flashes)
- Error boundaries + toast on every failed mutation
- Image optimization (lazy loading, WebP)
- Lighthouse pass: target 90+ on all metrics

---

## Technical details

**Stack** (unchanged): React 18 + Vite + TS + Tailwind + shadcn + Supabase + Lovable AI Gateway

**New tables**:
- `customer_addresses` (id, user_id, label, line1, city, pincode, lat, lng, is_default)
- `ai_quotes` (id, user_id, device, problem, image_url, ai_response jsonb, suggested_shops, created_at) — for analytics + caching
- `shop_branding` (user_id PK, logo_url, accent_color, tagline, social_links jsonb) — for white-label

**New edge functions**:
- `ai-repair-quote` — Gemini 3 Flash, structured output, optional image
- `notify-shop` — sends WhatsApp + creates notification row when booking placed
- `purge-expired-trash` — cron-style daily cleanup (deferred)

**New RPCs**:
- `nearby_shops(_lat, _lng, _radius_km)`
- `place_wholesale_order(_seller_id, _items, _buyer_address)`
- `get_customer_dashboard()` — single round trip for dashboard KPIs

**Routing**: full `App.tsx` rewrite with role-based redirects via `homePathFor()`. Old `/dashboard` → `/shop`, old `/staff-dashboard` stays.

---

## Delivery order (what gets built in which message)

| # | Scope | What you see |
|---|---|---|
| 1 | Phase 0 — design tokens, layouts, logo, landing redesign | New look across whole app |
| 2 | Phase 1a — customer marketplace, shop discovery, cart, checkout | Customers can buy |
| 3 | Phase 1b — AI repair booking + customer dashboard + orders | Customers can book repairs with AI quote |
| 4 | Phase 2 — shopkeeper CRM polish + bookings inbox + white-label | Shopkeepers get pro CRM |
| 5 | Phase 3 — wholesaler B2B module | B2B flow live |
| 6 | Phase 4 — super admin split + analytics | Admin full control |
| 7 | Phase 5+6 — subscription enforcement, PWA, SEO, polish | Production-ready |

Each step is independent — preview stays working after each one, nothing breaks.

---

## What I need confirmed before building

1. Plan pricing (₹299 / ₹799 / ₹1999) — OK or change?
2. AI quote: free for customers, ya credit-based (e.g. 5 free/day)?
3. White-label: custom subdomain (`myshop.repairxpert.com`) Phase 6 mein OK, ya abhi chahiye?
4. Wholesale orders ke liye payment: COD only ya UPI bhi?

"Implement plan" press karne ke baad **Phase 0 + Phase 1a** ek hi message mein deliver kar dunga (design system + customer marketplace). Phir aap test karke next phase trigger karenge.
