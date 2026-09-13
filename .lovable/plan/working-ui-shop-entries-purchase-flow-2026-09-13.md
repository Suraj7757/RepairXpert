# Working UI, Shop Entries & Purchase Flow

## Goal
Make every visible option and tab usable on mobile and desktop, ensure shop products/services load correctly, remove misleading copied/demo content, and improve response speed without breaking existing CRM data.

## Changes

1. **Navigation and tabs**
   - Fix mismatched customer/shop routes so sidebar, bottom navigation, headers, and account menus always open the correct page.
   - Make active states work for nested routes and admin hash tabs.
   - Repair dead buttons and missing destinations; hide actions that are not valid for the current account type.
   - Make wide tab groups horizontally scrollable on phones instead of compressing or overflowing.

2. **Shop entries and e-commerce flow**
   - Standardize product data on public marketplace listings across browse, product detail, cart, checkout, shop pages, and order creation.
   - Fix cart and checkout joins currently using private inventory fields, including seller grouping, pricing, stock images, and totals.
   - Make Add to Cart and Buy Now prevent duplicate items, respect stock limits, show errors, and navigate only after successful saves.
   - Ensure service booking forms submit once, validate mobile/date fields, and show the selected shop/service correctly.

3. **Responsive interface**
   - Fix mobile headers, cards, quantity controls, checkout fields, modal actions, product grids, and bottom navigation safe-area spacing.
   - Keep important actions visible without overlaps and use the existing RepairXpert design system consistently.

4. **Speed and clean content**
   - Debounce marketplace search, cancel stale requests, avoid duplicate initial shop searches, reduce repeated reloads after cart changes, and limit large queries.
   - Remove invented ratings, copied marketplace/bank wording, fake variants/colors, and generic merchant labels; display only real stored values.
   - Add lightweight loading, empty, retry, and disabled states where data or actions can fail.

5. **Verification**
   - Check all changed routes and buttons against the route map.
   - Test guest browsing, signed-in cart → checkout → order, shop service booking, and responsive layouts at mobile and desktop widths.
   - Resolve build/runtime errors found during this pass.

## Technical details
- Keep existing tables and current data intact.
- Use `marketplace_listings` for customer-facing product reads and existing safe public shop functions for shop metadata.
- Preserve role separation: customers buy/book, shopkeepers run CRM, super admin retains platform access.
