# Full-App Audit & E-commerce Upgrade Plan

Goal: Har feature, button, route, RLS aur RPC ko ek-ek karke verify karna, broken cheezein fix karna, aur public marketplace ko Flipkart/Amazon jaisa professional banana — bina dubara command ke.

## Phase 1 — Deep Audit (read-only)
1. **Routes & navigation** — `App.tsx`, `Sidebar.tsx`, `MobileBottomNav.tsx`: dead links, role-gated routes, 404s.
2. **Auth flows** — signup (shopkeeper/wholesaler/customer), Google OAuth, password reset, role redirect after login, plan expiry lock.
3. **Core CRM modules** — Repair Jobs, Sells, Inventory, Customers, Payments, Expenses, Branches, Loyalty, Staff, Settlements, Bookings, Reviews — CRUD + RLS + soft-delete + undo.
4. **Marketplace stack** — Listings, Cart, Checkout, MyOrders, SellerOrders, ListingDetail, LiveMarketplaceShowcase, inventory→listing sync trigger, `place_marketplace_order` RPC.
5. **Public pages** — `/`, `/marketplace`, `/marketplace/:id`, `/track`, `/book/:slug`, `/shop/:slug/reviews` — no-auth access, SEO tags, map links.
6. **Admin & monetization** — Dev Admin Panel, Trash, Refunds, Broadcast, Ads, Referrals, Wallet, Subscription, Manual UPI verification.
7. **DB sanity** — run linter, check RLS gaps, missing FKs/indexes, listings sync correctness, order number uniqueness.

Output of phase 1: one issue list grouped by Critical / High / Medium / Polish.

## Phase 2 — Fix Pass (all auto-applied)
Apply every Critical + High issue from the audit:
- Broken navigation/role redirects
- RLS holes or missing policies
- Sell/checkout errors after login (validate plan, banned, missing profile)
- Inventory↔marketplace sync edge cases (price 0, deleted item, branch_id)
- Soft-delete + 5-sec undo where missing
- Notifications firing on new marketplace orders for sellers
- Plan-expiry + banned + maintenance guards on every protected route
- Mobile bottom-nav active states, FAB removed (already done) — verify

## Phase 3 — E-commerce Upgrade (Flipkart/Amazon-grade)
Public marketplace polish + new capability:

**Browse & discover**
- Sticky search + category chips + price/rating/location filters + sort (popularity, price asc/desc, newest)
- Featured carousel + "Near you" section using shop `map_lat/lng` + haversine
- Product card: image, title, price, MRP + discount %, rating stars, shop name, distance, free-delivery badge
- Listing detail: image gallery, qty selector, "Buy Now" + "Add to Cart", shop card with map, reviews tab, related items

**Cart & Checkout**
- Per-seller grouping with subtotals
- Delivery vs Pickup (already added) + slot picker for pickup
- Address book for logged-in customers
- Coupon field (reuse `promo_codes`)
- COD / UPI (show seller UPI QR) / online (Stripe placeholder)
- Order success page with tracking ID + WhatsApp confirmation to seller

**Post-order**
- Customer "My Orders" with status timeline (Placed → Confirmed → Packed → Shipped/Ready → Delivered/Picked-up)
- Public order tracking via order_number on `/track`
- Seller dashboard: new-order toast + sound, one-click status updates, print invoice
- Auto WhatsApp on every status change (uses existing template system)

**Trust & SEO**
- Shop public page `/shop/:slug` showing profile, rating, reviews, all listings, map
- Review prompt to customer after "Delivered"
- JSON-LD `Product` + `LocalBusiness` schema on listing & shop pages
- Sitemap auto-includes active listings

## Phase 4 — Verification
- Manual click-through of every sidebar item in each role (shopkeeper, wholesaler, customer, dev admin)
- Public marketplace flow end-to-end as guest → signup → buy → seller fulfils → review
- Supabase linter clean, no console errors, no 404s

## Technical Notes
- Migrations needed: `marketplace_orders.fulfillment_status` enum expansion, `addresses` table for customers, `order_status_history` table, `pickup_slot` text column. Indexes on `marketplace_listings(active, category, price)`, `marketplace_orders(buyer_id, seller_id, created_at)`.
- New RPCs: `update_marketplace_order_status(_order_id, _status)` with seller-only check + history insert + WhatsApp trigger; `nearby_listings(_lat, _lng, _km)` using earthdistance or simple bbox.
- New components: `MarketplaceFilters`, `ProductCard`, `ShopPublicPage`, `OrderTimeline`, `AddressBook`, `CouponInput`.
- Reuse existing: `whatsapp-send` edge function, `place_marketplace_order` RPC, soft-delete pattern, notification bell.

## Scope confirmation
This is a large multi-day-equivalent change set. You said "sab allow", so on approval I will execute phases 1→4 in sequence, asking nothing further unless a destructive choice appears (e.g. dropping a column). Plan-expired users will still be blocked from CRM but can browse marketplace as customers.
