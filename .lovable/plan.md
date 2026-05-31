# SaaS Restructure Plan — Customer / Shopkeeper / Super Admin

Goal: Convert the current shopkeeper-first CRM into a proper multi-tenant SaaS with three clearly separated experiences, sharing one auth + DB but with distinct routes, layouts, sidebars, dashboards, and permissions.

---

## 1. Roles & Landing

| Role | Trigger | Landing route | Layout |
|---|---|---|---|
| Super Admin | email = krs715665@gmail.com | `/admin` | Admin layout |
| Shopkeeper | `account_type=shopkeeper` + approved application | `/shop` | Shop CRM layout |
| Customer | default on signup | `/customer` | Customer layout |
| Pending shopkeeper | applied but not approved | `/become-shopkeeper` (status view) | Customer layout |

`homePathFor()` and `ProtectedRoute` rewritten around these three roles only. Wholesaler/staff kept as sub-variants of shopkeeper for now.

---

## 2. Route Map (new)

```text
PUBLIC
  /                       Landing (marketing, "Shop now" + "Become a Seller" + "Login")
  /auth                   Login / Signup (tabs: Customer | Shopkeeper)
  /auth/callback          OAuth
  /reset-password
  /track                  Public order tracking
  /book/:slug             Public booking
  /shop/:slug             Public shop page
  /marketplace            Public browse
  /listing/:id            Public listing
  /privacy /terms

CUSTOMER  (role = customer)
  /customer               Dashboard (orders summary, recent jobs, recommendations)
  /customer/marketplace   Browse all shops/products
  /customer/shop/:slug    Shop view
  /customer/cart
  /customer/checkout
  /customer/orders        My orders (marketplace + service)
  /customer/orders/:id
  /customer/bookings      My repair bookings
  /customer/book          Book a repair (pick shop)
  /customer/ai-diagnostic
  /customer/wallet        Loyalty points + referral
  /customer/settings      Profile, addresses
  /become-shopkeeper      Upgrade form / pending status

SHOPKEEPER  (role = shopkeeper, approved)
  /shop                   Dashboard (KPIs)
  /shop/jobs              Repair jobs CRM
  /shop/bookings          Incoming customer bookings
  /shop/customers
  /shop/inventory
  /shop/listings          Marketplace listings (publish from inventory)
  /shop/orders            Marketplace orders received
  /shop/sells
  /shop/payments
  /shop/settlements
  /shop/expenses
  /shop/loyalty
  /shop/branches
  /shop/staff
  /shop/wallet
  /shop/subscription
  /shop/analytics /shop/financials /shop/reports
  /shop/settings          Shop profile, QR receivers, booking slug
  /shop/trash

SUPER ADMIN  (krs715665@gmail.com)
  /admin                  Platform KPIs
  /admin/shops            All shopkeepers
  /admin/users            All users (ban / promote / plan)
  /admin/applications     Shopkeeper approvals
  /admin/orders           All marketplace orders
  /admin/payments         Manual UPI verification
  /admin/promos           Promo codes
  /admin/ads              Ad management
  /admin/broadcast
  /admin/settings         Maintenance mode, system config
```

Old `/dashboard`, `/wholesale`, `/staff-dashboard` redirect to the matching new path.

---

## 3. Layout / Sidebar

Three distinct sidebars driven by `role` in `SharedLayout.tsx`:

- **CustomerSidebar** — Dashboard, Browse Shop, Cart, My Orders, Bookings, AI Diagnostic, Wallet, Settings, "Become a Shopkeeper" CTA.
- **ShopkeeperSidebar** — current shop nav, cleaned up (Jobs, Bookings, Inventory, Listings, Orders, Sells, Payments, Settlements, Expenses, Loyalty, Branches, Staff, Wallet, Subscription, Analytics, Reports, Settings, Trash).
- **AdminSidebar** — Dashboard, Shops, Users, Applications, Orders, Payments, Promos, Ads, Broadcast, Settings.

Header shows role badge + quick "Switch view" only for super admin.

---

## 4. Auth Flow Changes

`/auth` page gets two tabs:
1. **Customer** — quick signup (name, email, mobile, password) → role `customer` → `/customer`.
2. **Shopkeeper** — same fields + "Continue" → creates customer account first, then forwards to `/become-shopkeeper` to fill business details.

Google OAuth callback uses `localStorage rx_pending_account_type` (already in place) to route accordingly. Super admin email always lands on `/admin`.

Pending application: customer dashboard shows a banner "Your shopkeeper application is under review". On approval (existing `approve_shopkeeper_application` RPC) next login routes to `/shop`.

---

## 5. Customer Experience (new/wired)

- **Customer Dashboard**: tiles for Active Orders, Bookings, Wallet/Loyalty, Recommended shops near you.
- **Browse Shop / Marketplace**: existing `Marketplace.tsx` reused under `/customer/marketplace`.
- **Cart + Checkout**: existing components, hardened (no double-submit already done).
- **My Orders**: combines `marketplace_orders` (buyer_id = me) + `repair_jobs` booked via `booking_requests`.
- **Bookings**: list of my `booking_requests` with status + tracking link.
- **Book a Repair**: pick shop (list of shops with `booking_enabled=true`) → reuses PublicBooking form but pre-fills logged-in user.
- **Wallet**: loyalty points across shops + referrals + ad rewards.
- **Become a Shopkeeper**: existing form, shows pending/rejected status with reapply.

---

## 6. Shopkeeper Experience

Existing CRM stays, but:
- Default landing `/shop` (alias for old `/dashboard`).
- Add `/shop/bookings` page listing `booking_requests` with one-click "Convert to Job" (RPC already exists).
- Add `/shop/orders` page listing `marketplace_orders` where `seller_id=me` with status updates (RPC exists).
- Sidebar reorganized into groups: Operations, Sales, Finance, Growth, Settings.

---

## 7. Super Admin Experience

`AdminPanel.tsx` split into proper pages under `/admin/*`:
- Dashboard: total shops, customers, GMV, active subs, pending applications.
- Applications: approve/reject (already wired).
- Users: search, ban/unban, set plan, set role (RPCs exist).
- Shops: list `shop_settings` joined with profile, plan, GMV.
- Orders: read-only across all `marketplace_orders`.
- Payments: pending `payment_submissions` with screenshot + approve.
- Promos, Ads, Broadcast: existing components moved here.
- Settings: maintenance mode toggle.

---

## 8. Landing Page

`Landing.tsx` updated CTAs:
- "Shop Now" → `/marketplace`
- "Book a Repair" → `/auth?tab=customer&next=/customer/book`
- "Become a Seller" → `/auth?tab=shopkeeper`
- "Login" → `/auth`

---

## 9. Files to touch (no DB schema changes needed — all tables already exist)

- `src/App.tsx` — full route restructure with role-based nesting.
- `src/components/ProtectedRoute.tsx` — keep, add `requireApprovedShopkeeper` flag.
- `src/components/layout/SharedLayout.tsx` + `Sidebar.tsx` + `MobileBottomNav.tsx` — three sidebars + groups.
- `src/lib/accountType.ts` — `homePathFor` updated to new routes.
- `src/context/AuthContext.tsx` — minor: expose `isApprovedShopkeeper`.
- `src/features/auth/Auth.tsx` — Customer/Shopkeeper tabs.
- `src/features/dashboard/Landing.tsx` — new CTAs.
- `src/features/customer/CustomerDashboard.tsx` — rebuilt.
- New: `src/pages/Customer/Bookings.tsx`, `Book.tsx`, `Wallet.tsx`, `OrderDetail.tsx`.
- New: `src/pages/Shopkeeper/Bookings.tsx` (list + convert), `Orders.tsx` (marketplace orders).
- New under `src/pages/SuperAdmin/`: `Applications.tsx`, `Users.tsx`, `Shops.tsx`, `Orders.tsx`, `Payments.tsx`, `Settings.tsx` (re-using existing admin components).
- Redirects for old paths in `App.tsx`.

No migrations. No business-logic rewrites of existing CRM features — they keep working, just moved under `/shop/*`.

---

## 10. Out of scope (ask later if needed)

- New payment gateway integration.
- Multi-language expansion beyond current EN/HI/BN.
- Mobile native (Capacitor) re-skin.

---

Confirm and I'll switch to build mode and implement in this order: routes + layouts → customer pages → shopkeeper additions → super admin split → landing/auth polish.
