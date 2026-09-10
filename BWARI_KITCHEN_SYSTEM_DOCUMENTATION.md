# Bwari Kitchen — Full System Documentation

**Purpose of this document:** This is a complete technical handoff describing a food-ordering platform called Bwari Kitchen. It covers the backend API, the customer-facing mobile app, and the admin web dashboard — what exists, how it was built, every significant decision made along the way, every bug found and fixed, and every piece of scope that was explicitly deferred. This document assumes no prior context. Read it fully before making changes to any part of the system.

---

## 1. Project Overview

Bwari Kitchen is a restaurant food-ordering platform for a single restaurant (currently one branch, in Bwari, Abuja, Nigeria), consisting of three separate applications sharing one backend:

1. **Backend API** — Node.js/Express/Prisma/PostgreSQL REST API
2. **Mobile app** — React Native (Expo) customer-facing ordering app, for Android and iOS
3. **Admin dashboard** — React (Vite) web app for restaurant staff to manage orders, menu, riders, customers, promotions, and view analytics

A separate **rider-facing app** is referenced in the backend's data model and API (riders can be assigned to deliveries, have their own auth role) but **no rider frontend currently exists** — this is a known gap.

### Who built what
- The **backend** and the **admin dashboard** were built collaboratively in this conversation, largely from scratch or by fixing/completing existing scaffolding.
- The **mobile app frontend** (screens, UI components, navigation) was originally built by a separate frontend developer/team using **mock/hardcoded data** (a file called `constants/menuData.ts` simulating a menu, and various other screens using fake data or `setTimeout` to simulate API calls). A large portion of this conversation's work was **migrating every mobile screen off mock data and onto the real backend**, screen by screen.
- The person driving this conversation is **not the original frontend developer** — they are the backend/infrastructure owner, collaborating with a separate frontend teammate via a shared GitHub repository. Care was taken throughout to avoid destructive git operations that would lose the frontend teammate's work, though one incident did involve resolving leftover git merge-conflict markers that had been accidentally committed into `signup.tsx`.

### Current deployment state
- **Backend**: Originally deployed to **Railway** (free tier). Railway's free tier subsequently expired, and the project was **migrated to Render** (`https://bwari-kitchen-api.onrender.com`). Render has its own free-tier cold-start behavior (services spin down after inactivity, causing slow first-response times) — no keep-alive solution has been confirmed set up for Render specifically (one was discussed for the earlier Railway/Supabase setup but should be re-verified for Render).
- **Database**: **Supabase** (PostgreSQL), used throughout regardless of which backend host was active — both Railway and Render pointed at the same Supabase instance, meaning migrations only ever needed to be run once regardless of which host was live.
- **Admin dashboard**: Deployed to **Vercel**.
- **Mobile app**: Not published to app stores. Tested via **Expo Go** during development, and later built as a **standalone Android APK** using **EAS Build** for testing outside of Expo Go. No iOS build has been produced (see §11 for why).

---

## 2. Backend — Architecture and Stack

- **Runtime**: Node.js, TypeScript
- **Framework**: Express 5 (a mid-project downgrade to **Express 4** types was required — see §2.4)
- **ORM**: Prisma 7, using the `PrismaPg` driver adapter (not Prisma's older built-in connection handling)
- **Database**: PostgreSQL via Supabase, using **connection pooling** for the app runtime and a **direct connection** for migrations (see §2.2)
- **Authentication**: JWT-based, two entirely separate systems:
  - Customer/rider auth (`User` model, phone-number or email + password login)
  - Admin auth (`AdminUser` model, email + password login) — a deliberately separate table and JWT secret space from regular users
- **File storage**: Supabase Storage (for menu item images, package images, category images), accessed via `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`
- **Payments**: Paystack (test mode), no other payment processor integrated
- **Password hashing**: bcryptjs

### 2.1 Prisma schema — full model list

The schema lives at `backend/prisma/schema.prisma`. Models, as of the end of this conversation:

- `AppSetting` — key/value store for configurable values (e.g. `delivery_fee_per_km`, `min_order_amount`, `opening_time`, `closing_time`)
- `Branch` — the single restaurant branch record (id is hardcoded as the literal string `'main-branch'` throughout the codebase, not a real UUID — this is intentional, since there is currently only one branch)
- `User` — customers and riders share this table, differentiated by a `role` enum (`customer` | `rider`). Includes:
  - `notifyOrderUpdates`, `notifyDeliveryAlerts`, `notifyPromotions`, `notifyNewMenu`, `notifyEmail` (Boolean, added for notification preferences — see §8)
  - `deviceToken` (String, nullable — actively used for Expo FCM V1 push notifications, routing order status updates and rider assignments directly to customer devices).
- `UserAddress` — customer delivery addresses, includes `latitude`/`longitude` (populated via device GPS, not a geocoding API — see §7)
- `Category` — menu categories (e.g. "Rice", "Soups")
- `MenuItem` — individual menu items, with `basePrice`, optional `discountPrice`, `isAvailable`, `isFeatured`, and a relation to `MenuItemVariant`
- `MenuItemVariant` — **added mid-project** to support portion/size pricing (e.g. "Full Portion" ₦2000, "Half Portion" ₦1200) — see §5.2 for full detail on why and how this was built
- `Package` — restaurant-curated combo meals (fixed set of menu items at a fixed total price)
- `PackageItem` — join table between `Package` and `MenuItem` with a `quantity`
- `Order` — customer orders. Central fields: `orderNumber` (human-readable, sequential), `status` (enum — see §6.3), `orderType` (`delivery` | `pickup`), `subtotal`, `deliveryFee`, `discountAmount`, `totalAmount`
- `OrderPackage` — **every line item in an order is modeled as a "package"**, even a single plain menu item (wrapped as a one-item package). This was an existing design decision in the schema, not something changed in this conversation — see §6.1 for how the frontend adapts to this.
- `OrderPackageItem` — individual items within an `OrderPackage`. Includes `variantId` and `variantLabel` (String, nullable — **added mid-project** alongside `MenuItemVariant` to snapshot which variant was ordered and at what price, since variant prices could theoretically change after an order is placed)
- `OrderStatusHistory` — audit trail of status changes on an order, including who changed it (`changedByType`: `customer` | `rider` | `admin` | `system`)
- `Payment` — one-to-one with `Order`. `paymentMethod` enum was **simplified mid-project** from `card | bank_transfer | ussd | cash_on_delivery | wallet` down to just `paystack | wallet` (see §6.5 for why)
- `Wallet` / `WalletTransaction` — exist in the schema but **are not implemented anywhere in the application logic**. No wallet top-up, no wallet payment flow. Present as schema-only scaffolding for possible future use.
- `DeliveryTracking` — one-to-one with `Order`, holds `currentLatitude`/`currentLongitude`/`estimatedArrival` for a rider's live location. **No mechanism currently writes to this table** — no rider app exists to report location, so this data is never populated in practice (see §11.4).
- `Review` — customer reviews of completed orders (`foodRating`, `deliveryRating`, `comment`)
- `Promotion` — discount codes, with `type` enum (`percentage | fixed | free_delivery | bogo`), `minOrderAmount`, `maxUses`, `perUserLimit`, `validFrom`/`validUntil`
- `PromoUsage` — tracks which user used which promo on which order
- `Notification` — in-app notification records (`type`: `order_update | promotion | system | review_request`)
- `AdminUser` — separate table from `User`, for staff/admin accounts, with `isSuperAdmin` flag
- `AdminActivityLog` — audit log of admin actions (who did what, when) — written to via a shared `logActivity()` helper function called from most admin controller actions
- `Favorite` — **added mid-project** (see §9). Links a `User` to either a `MenuItem` or a `Package` (mutually exclusive per row, enforced by two separate unique constraints, not a single polymorphic relation)

### 2.2 Database connection configuration — Prisma 7 specifics

This project uses **Prisma 7**, which moved connection configuration **out of `schema.prisma`** entirely and into a separate `prisma.config.js` file (this was a source of real confusion mid-project, since most Prisma documentation/tutorials assume Prisma 5/6's `datasource { url = ... }` pattern, which **no longer works** in v7 and produces a validation error).

Current correct setup:

**`backend/prisma/schema.prisma`** — the `datasource` block has **no `url` or `directUrl` fields at all**:
```prisma
datasource db {
  provider = "postgresql"
}
```

**`backend/prisma.config.js`** — this is where connection strings actually live:
```js
const { defineConfig } = require('prisma/config')
require('dotenv').config()

module.exports = defineConfig({
  earlyAccess: true,
  schema: './prisma/schema.prisma',
  datasource: {
    url: process.env.DIRECT_URL, // NOTE: direct URL, not pooled — see explanation below
  },
  migrate: {
    seed: 'ts-node prisma/seed.ts',
    adapter: async () => {
      const { PrismaPg } = await import('@prisma/adapter-pg')
      return new PrismaPg({
        connectionString: process.env.DIRECT_URL,
        connectionTimeoutMillis: 30000,
        idleTimeoutMillis: 30000,
        ssl: { rejectUnauthorized: false },
      })
    },
  },
})
```

**Critical detail**: `datasource.url` and the `migrate.adapter`'s `connectionString` **must both point at `DIRECT_URL`** (the non-pooled, port-5432 Supabase connection), **not** `DATABASE_URL` (the pooled, port-6543 connection). Using the pooled URL for the CLI/migration engine causes a `prepared statement "s1" already exists` error, because PgBouncer transaction-mode pooling does not support the prepared statements Prisma's schema/migration engine relies on.

**`backend/src/lib/prisma.ts`** — this is the **runtime** Prisma Client used by the actual Express app (not the CLI), and it correctly uses the **pooled** connection:
```ts
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import dotenv from 'dotenv'

dotenv.config()

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!, // pooled — correct for app runtime
  ssl: { rejectUnauthorized: false },
})

const prisma = new PrismaClient({ adapter })

export default prisma
```

**Summary of the two-URL split:**
| Purpose | Env var | Port | Used by |
|---|---|---|---|
| App runtime queries | `DATABASE_URL` | 6543 (pooled, `?pgbouncer=true`) | `src/lib/prisma.ts` |
| CLI / migrations | `DIRECT_URL` | 5432 (direct) | `prisma.config.js` |

Both SSL configs use `ssl: { rejectUnauthorized: false }` — this was required to fix an initial SSL handshake failure; Supabase's connection string should **not** include `sslmode=disable` in the query string, as that overrides this code-level setting.

### 2.3 Migration history note

At one point, `npx prisma migrate dev` reported schema drift (differences between the actual database and the migration history — specifically around `admin_activity_logs`, `order_status_history`, and `orders` tables). Since the database only contained placeholder/test data at the time, this was resolved with a full `npx prisma migrate reset` (destructive — drops and rebuilds all tables from migration history, then reseeds). **This is not something to run against a database with real customer/order data.** After the reset, all 5 pre-existing migrations plus the newly-added `add_menu_item_variants` migration applied cleanly.

Full list of migrations created during this conversation (in addition to whatever existed before):
- `add_menu_item_variants` — added the `MenuItemVariant` table
- `simplify_payment_method_enum` — collapsed `PaymentMethod` enum to `paystack | wallet`
- `add_variant_to_order_items` — added `variantId`/`variantLabel` to `OrderPackageItem`
- `add_notification_preferences` — added the five `notify*` boolean fields to `User`
- `add_favorites` — added the `Favorite` table

### 2.4 Express version note

The backend was originally on **Express 5**. Under TypeScript's `strict: true` mode, Express 5's type definitions changed `req.params` and `req.query` values from plain `string` to `string | string[]`, which broke **over 100 call sites** across the codebase where these values were passed directly into Prisma `where` clauses or other functions expecting a plain string. Rather than manually casting every call site, the fix applied was to **downgrade to Express 4** (`npm install express@^4.21.0 @types/express@^4.17.21`), which restored the original, more permissive typing that matched how the codebase was actually written. This resolved the vast majority of the TypeScript build errors in one change.

TypeScript's `strict` mode itself was ultimately **left disabled** (`"strict": false` in `tsconfig.json`) after fixing a handful of genuine bugs strict mode surfaced (see §2.5) — the remaining noise was deemed not worth the effort of full strict-mode compliance at this stage.

### 2.5 Real bugs found and fixed via the TypeScript strict-mode pass

These were genuine bugs, not just type-safety noise, discovered while investigating strict-mode errors:

1. **`logActivity` was called but never imported** in `admin.order.controller.ts`, `admin.user.controller.ts`, and `review.controller.ts` — meaning admin activity logging was silently crashing (or simply undefined-erroring) on order status changes, rider assignment, user actions, and review deletion. Fixed by adding the missing import in each file.
2. **`payment.controller.ts` accessed `payment.order.X`** in several places without including the `order` relation in the Prisma query (`select`/`include`) that fetched `payment` — meaning `payment.order` was `undefined` at runtime. Fixed by adding `include: { order: { select: {...} } }` to the relevant queries.
3. **`admin.menu.controller.ts`'s `deleteCategory`** and **`promotion.controller.ts`'s `deletePromo`** referenced `category._count.menuItems` / `promo._count.usages` without including `_count` in the query. Fixed by adding `include: { _count: { select: {...} } }`.
4. **`admin.settings.controller.ts`'s `updateMultipleSettings`** had a copy-paste bug: its final `logActivity` call referenced `key`/`value`, undefined variables in that function's scope (that function loops over multiple settings via `item.key`/`item.value`, no single `key`/`value` exists). Fixed by rewriting the log description to summarize the array of updated settings instead.
5. **`auth.controller.ts`'s `deactivateUser`** checked `user.deletedAt` but the Prisma query's `select` only fetched `id, role, isActive` — `deletedAt` was never selected, so the check was comparing against `undefined`. Fixed by adding `deletedAt: true` to the select.
6. **`upload.controller.ts`** referenced `req.file` (from Multer) without `@types/multer` installed, causing a genuine type error (not just noise) since the Express `Request` type had no `file` property augmented onto it. Fixed with `npm install --save-dev @types/multer`.
7. **`order.controller.ts` had a missing closing brace** introduced during the variant-pricing edit (see §5.2) — the inner `for (const item of pkg.items)` loop was missing its closing `}`, causing a `TS1005: '}' expected` compile error that took down the entire backend (`ts-node-dev` refused to start). This was caught when running the backend locally for the first time after a long stretch of untested changes — see §12 for the broader lesson here about testing cadence.

---

## 3. Backend — API Surface

All routes are mounted under `/api/*`. Full route file list and their purpose:

- `POST/GET /api/auth/*` — registration, login (accepts either `phoneNumber` or `email` + `password` — see §4.2), `/me`, profile update, password change
- `GET/POST/PATCH/DELETE /api/addresses/*` — customer address CRUD, plus `POST /api/addresses/delivery-fee` (calculates delivery fee from lat/lng or a saved address id, using Haversine distance × a configurable per-km rate)
- `GET /api/menu/*` — public menu browsing: categories, items (with variants), packages, a combined `/api/menu` "full menu" endpoint, and branch info
- `POST /api/orders`, `GET /api/orders` (list, **not** `/api/orders/me` — see §6.2 for a bug this caused), `GET /api/orders/:id`, `PATCH /api/orders/:id/cancel`
- `POST /api/payments/initialize`, `GET /api/payments/verify/:reference`, `GET /api/payments/verify` (a **new** route added to handle Paystack's browser redirect gracefully — see §6.4), `POST /api/payments/webhook`, `GET /api/payments/order/:orderId`
- `GET/PATCH/DELETE /api/notifications/*` — includes `GET/PATCH /api/notifications/preferences` (**added mid-project**, see §8)
- `POST /api/reviews`, `GET /api/reviews`, `GET /api/reviews/check/:orderId`
- `GET /api/promotions`, `POST /api/promotions/validate`
- `POST /api/upload/menu-item/:id`, `POST /api/upload/package/:id`, etc. — image uploads to Supabase Storage
- `GET/POST/DELETE /api/favorites` — **added mid-project**, see §9
- `/api/admin/*` — a fully parallel set of routes for the admin dashboard, all behind `authenticate` middleware checking for a valid **admin** JWT (separate from the customer/rider JWT): `admin/auth`, `admin/menu` (categories/items/packages CRUD), `admin/orders`, `admin/users` (customers + riders), `admin/settings`, `admin/analytics`, `admin/reviews`, `admin/promotions`, `admin/activity-log`
- `GET /health` — public health check, used for deploy verification and as a keep-alive ping target. Was upgraded mid-project to actually run `SELECT 1` against the database (`await prisma.$queryRaw`) rather than just returning a static JSON response, so it genuinely verifies DB connectivity and (when Supabase free tier was in play) counts as real activity to prevent auto-pausing.

### 3.1 Availability filtering — a real bug found late in the project

`menu.controller.ts`'s public-facing `getMenuItems`, `getMenuItem`, and `getFullMenu` originally had `isAvailable: true` hardcoded into their Prisma `where` clauses. This meant that **any menu item toggled "unavailable" by an admin was completely excluded from the API response**, not merely flagged as unavailable. This silently broke every piece of "sold out" UI logic built throughout the mobile app (cart, item details, package availability checks, "For You" carousels) — code like `findItem(id)?.isAvailable === false` could never evaluate `true`, because `findItem(id)` would return `undefined` for any genuinely unavailable item (it wasn't in the fetched list at all), and `undefined?.isAvailable === false` evaluates to `false`.

**Fix**: removed `isAvailable: true` from the `where` clauses in `getMenuItems`, `getMenuItem`, and the `menuItems` sub-query in `getFullMenu`, and instead added `isAvailable: true` to each query's `select`, so the field is returned in the payload and the frontend can react to it correctly. The `featuredItems` query inside `getFullMenu` was deliberately left filtering out unavailable items (showing an unavailable item in a "featured" carousel makes less sense than in a general browse list).

---

## 4. Authentication

### 4.1 Two entirely separate auth systems
- **Customer/rider auth**: `User` model, JWT signed with `JWT_SECRET`, includes `role` claim
- **Admin auth**: `AdminUser` model, entirely separate table, own login endpoint, own JWT signing (uses a separate secret space — verify exact env var name in `.env` if extending this)

### 4.2 Login supports both phone and email
The original backend only supported phone-number login. The mobile app's login screen (built by the frontend developer, pre-existing) collected **email**, not phone. Rather than force a redesign of the login screen, the backend's `login` function was extended to accept **either** `email` or `phoneNumber` in the request body, looking up the user by whichever was provided:
```ts
const user = await prisma.user.findUnique({
  where: email ? { email } : { phoneNumber },
  ...
})
```
Signup still requires `phoneNumber` (it's the unique, mandatory identifier on the `User` model); `email` remains optional at signup. A user who signs up without an email can only log in via phone.

### 4.3 OTP verification — explicitly NOT implemented
The original frontend integration guide (provided by the frontend developer) assumed a signup flow with **OTP verification** (send a code via SMS/Termii, user enters it, account gets verified) before granting access. **This was explicitly decided against for now** — the actual implemented signup flow registers the user immediately and logs them in, with `isVerified` defaulting to `false` and never being set to `true` by any current code path. A conflicting implementation of this OTP flow existed in a git-merge-conflicted version of `signup.tsx` (written by the frontend developer, routing to a `/verify-otp` screen) — this was explicitly discarded in favor of keeping the direct-registration flow when resolving the merge conflict. **If OTP is implemented later**, it needs: Termii (or similar SMS provider) integration, an OTP code storage/expiry mechanism (new field or table), and a `/verify-otp` endpoint.

### 4.4 Session storage on the mobile app
- JWT token stored via `expo-secure-store` under the key `authToken` (not `AsyncStorage`, not any other key name used earlier in development — this was standardized partway through; if you find code referencing `user_token` or similar, it is stale/inconsistent and should be corrected to `authToken`)
- `app/_layout.tsx` checks for this token on app launch to decide whether to route to `/welcome` (no token) or `/unlock` (token present)

### 4.5 The `/unlock` screen — biometric/session-revalidation, not a PIN
The frontend developer's original `unlock.tsx` implemented a **fake 6-digit PIN** (`const VALID_PIN = '123456'`, hardcoded) as a "quick unlock" mechanism for returning users, plus a biometric option. **The PIN concept was dropped entirely** per an explicit decision in this conversation. The rebuilt `unlock.tsx`:
1. On mount, checks for a stored `authToken`; if absent, redirects to `/login`
2. If present, calls `GET /api/auth/me` to confirm the token is still genuinely valid server-side (not just "a token exists locally, therefore trust it")
3. If the device supports biometrics (`expo-local-authentication`), offers a biometric prompt as a convenience gate before entering the app
4. If the device does not support biometrics, shows a plain "Continue" button
5. "Sign Out" clears the `authToken` from SecureStore and returns to `/welcome`

Biometric authentication was confirmed to work correctly even inside **Expo Go** (it's one of the modules Expo Go supports natively without a custom dev build).

### 4.6 Auth-dependent context refresh timing bug
Several React Contexts (`NotificationContext`, `AddressContext`, `FavoriteContext`) fetch their data once on mount. Since the app mounts **before** the user is logged in (during the `/welcome` → `/login` flow, or during `/unlock`'s async validation), these initial fetches correctly receive `401 Unauthorized` — this is expected, not a bug, when it happens *before* login. However, nothing was originally triggering these contexts to **refetch** once login/signup/unlock-validation actually succeeded, meaning a user could land inside the app with empty notifications/addresses/favorites until they manually navigated to a screen that happened to trigger a refetch (e.g., adding a new address).

**Fix**: `login.tsx`, `signup.tsx`, and `unlock.tsx` were all updated to call `Promise.all([refreshNotifications(), refreshAddresses(), refreshFavorites()])` immediately after successful authentication, using each context's exposed `refresh()` function, before navigating into the main app.

---

## 5. Menu System

### 5.1 Original state
The mobile app's menu screens were built entirely against a hardcoded file, `constants/menuData.ts`, containing:
- `MENU_ITEMS` — an array of fake items with `id`, `name`, `price`, `category` (a plain string), `image` (a Pinterest URL), and sometimes a `variants` array
- `COMBO_PACKAGES` — computed from `MENU_ITEMS` by ID reference
- A "composite key" system (`parseCompositeKey`) encoding `itemId::variantLabel::variantPrice` as a single string, used as a cart line-item identifier so that "Rice (Full Portion)" and "Rice (Half Portion)" could coexist as distinct cart entries

This mock data included a fully-designed **variant/portion pricing system** — e.g. "Full Portion" ₦2000, "Half Portion" ₦1200, "2 Scoops" ₦1500 — with its own UI component (`ItemVariantModal.tsx`) and its own "build a custom plate" flow (`menu.tsx`'s bottom-sheet builder, and a near-identical duplicate implementation inside `QuickEditPackage.tsx` used when editing a cart item).

### 5.2 Variant pricing — built as a real backend feature
Since portion/variant pricing had no equivalent in the Prisma schema, and was confirmed as a **launch requirement** (not deferrable), it was built as real, new backend functionality:

1. Added `MenuItemVariant` model (id, `menuItemId`, `label`, `price`, `sortOrder`), related to `MenuItem` via a one-to-many relation with `onDelete: Cascade`.
2. Extended `admin.menu.controller.ts`'s `createMenuItem`/`updateMenuItem` to accept a `variants` array in the request body, using Prisma's nested `create` (on create) and `deleteMany` + `create` (on update — a full replace-all pattern, matching how `Package`'s nested `items` were already handled elsewhere in the same file).
3. Extended the admin dashboard's `Menu.tsx` item form with a repeatable "Portion Variants (optional)" UI section — add/remove rows, each with a label and price input.
4. Extended the **public-facing** `menu.controller.ts`'s `getMenuItems`/`getMenuItem`/`getFullMenu` to `select` and return the `variants` relation, so the mobile app actually receives this data.
5. On the **order-placement** side, `order.controller.ts`'s `placeOrder` was extended to authoritatively re-price variant selections server-side — the client sends an optional `variantLabel` string per line item; the backend looks up the matching `MenuItemVariant` by label, uses **its** price (never trusting a client-sent price), and snapshots both `variantId` and `variantLabel` onto the created `OrderPackageItem` row. If a client sends a `variantLabel` that doesn't match any real variant for that item, the order is rejected with a 400.

### 5.3 The mock-to-real migration — shared `MenuContext`
To avoid every screen independently importing and filtering `MENU_ITEMS`/`COMBO_PACKAGES`, a new shared context was built: `context/MenuContext.tsx`. On mount, it fetches `GET /api/menu/items` (with a generous `limit=200`, since screens filter client-side by category and need the full list), `GET /api/menu/categories`, and `GET /api/menu/packages` in parallel, and exposes:
- `items`, `categories`, `packages` (typed arrays matching the real API response shapes)
- `loading`, `error`
- `refresh()` — re-triggers the fetch (used for pull-to-refresh)
- `findItem(id)` / `findPackage(id)` — replaces every scattered `MENU_ITEMS.find(...)` call across the codebase

`app/_layout.tsx` was updated to wrap the app in `<MenuProvider>`, nested **outside** `<CartProvider>` and `<FavoriteProvider>` (both of which internally call `useMenu()`, so `MenuProvider` must be an ancestor of both).

**Every mobile screen and component that previously imported from `menuData.ts` was individually migrated** to use `useMenu()` instead. The full list, each requiring its own careful review since field shapes differ between the mock data and the real API (e.g. mock `image` → real `imageUrl`; mock `category` as a string → real `category` as an object `{id, name}`; mock `price` → real `basePrice`/`discountPrice`):
- `app/(tabs)/menu.tsx`
- `app/(tabs)/index.tsx` (home screen)
- `app/(tabs)/favorite.tsx`
- `app/details.tsx`
- `app/cart.tsx`
- `app/search.tsx`
- `components/ItemVariantModal.tsx` (needed no data-source change — it's generic, receives whatever `item` object it's given as a prop — but was the site of a real crash, see §5.4)
- `components/QuickEditPackage.tsx`
- `components/ForYouCard.tsx`

`constants/menuData.ts` itself is now **safe to delete** (confirmed via testing that no consumer remains), but as of the end of this conversation it had not yet been explicitly deleted — this is a trivial cleanup step remaining.

### 5.4 Real crash found during testing: object rendered as React child
`ItemVariantModal.tsx` rendered `{item.category}` directly as JSX text. This worked fine against mock data (`category` was a plain string), but crashed with `Objects are not valid as a React child (found: object with keys {id, name})` against real data, since real `MenuItem.category` is an object. This specifically manifested as: tapping a menu item **with variants** (which opens this modal) would crash the app; items without variants appeared unaffected initially, but subsequent taps also seemed to trigger the same crash due to stale component state — once the object-render bug itself was fixed, this resolved fully. Fix: `{typeof item.category === 'string' ? item.category : item.category?.name}`.

### 5.5 Real pricing bug found during testing: ₦1 instead of real price
In both `menu.tsx` and `QuickEditPackage.tsx`, the code path for adding a **non-variant** item to a custom plate built its composite key as:
```ts
const compositeKey = `${item.id}::Base::1`
```
The literal `1` here was intended as a placeholder/multiplier from the original mock-data design, but `parseCompositeKey` parses the third segment as the **variant price** — so every non-variant item added to a custom plate displayed and priced at ₦1 (not the real item price), while the real, correct total was still sent to Paystack (since the actual order-creation payload independently referenced real item IDs, not this display-layer composite key math) — meaning the **customer-visible price was wrong but the actual charge was correct**, a confusing but non-fraudulent bug. Fix: `` `${item.id}::Base::${item.basePrice}` `` — using the item's real base price instead of a hardcoded `1`.

---

## 6. Orders and Checkout

### 6.1 Order payload shape — "everything is a package"
The backend's `Order` model has no direct "order items" — every line item, whether a real restaurant-defined `Package`, a customer-built custom plate, or a single plain menu item, is submitted and stored as an `OrderPackage` (with nested `OrderPackageItem` rows). The mobile app's `checkout.tsx` contains a `buildOrderPackagesPayload()` function that maps whatever is in the cart into this shape:
- Cart entries with a `subItems` array (real packages, custom plates) → become an `OrderPackage` with `packageId` set (if it's a real, unedited restaurant package) or left `undefined` (if it's a custom-built plate, indicated by the cart item's `id` starting with the string `custom_`), plus a `wasEdited` flag (indicated by `id` starting with `custom_edit_`, set when a customer modifies an existing package via `QuickEditPackage.tsx`)
- Cart entries with no `subItems` (a single plain menu item, no variant, no package) → wrapped as a one-item `OrderPackage`

Each individual item within a package entry includes an optional `variantLabel`, propagated through so the backend can re-price it correctly (see §5.2).

### 6.2 Real bug: wrong API path caused "My Orders" to always be empty
`my-orders.tsx` was originally written to call `GET /api/orders/me`. The actual backend route (`backend/src/routes/order.ts`) mounts the "list my orders" handler (`getMyOrders`) at the **bare root path**, `GET /api/orders/`. Since `GET /:id` is also registered on that router, `GET /api/orders/me` was being matched by the **single-order-detail** route with `id` literally equal to the string `"me"` — which correctly 404'd, since no order has that id. This made the "Active Orders" tab appear completely empty even when orders genuinely existed (confirmed via the admin dashboard showing them correctly, and via being able to reach an individual order's detail through the notifications screen, which uses the correct `GET /api/orders/:id` path). Fix: changed the mobile app's fetch call from `/api/orders/me` to plain `/api/orders`.

### 6.3 Order status model
The `OrderStatus` enum: `pending → confirmed → preparing → ready → picked_up → on_the_way → delivered`, with `cancelled` and `refunded` as terminal alternate states. Pickup orders skip `picked_up`/`on_the_way` (their flow goes `ready → delivered` directly, decided in the admin's "next status" logic based on `order.orderType`).

**Status label display**: rather than maintaining a hand-written mapping dictionary between the raw enum values and display labels (which the original frontend integration guide proposed, using different casing/wording like "Accepted" instead of "confirmed"), the decision was made to **derive display labels programmatically** from the real enum values:
```ts
const formatStatusLabel = (status: string) =>
  status.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')
```
This guarantees the UI always exactly reflects the real backend value (no drift risk from a hand-maintained mapping going stale), at the cost of the labels being slightly more literal (`"On The Way"` rather than a custom "Delivering" wording).

### 6.4 Paystack payment flow — evolution and final state

**Attempt 1 (buggy)**: Used `expo-web-browser`'s `openBrowserAsync(paymentUrl)`, and only called the backend's verify endpoint if the browser session resolved with `{type: 'dismiss' | 'cancel'}`. On Android, `openBrowserAsync` can resolve immediately with `{type: 'opened'}` without waiting for the user to actually complete or close the flow — meaning `verify` frequently never fired at all. This caused two visible symptoms: (a) the cart never cleared even after a **genuinely completed** payment, and (b) tapping "Place Order" again (because the UI appeared stuck/unresponsive) created a **second, duplicate order + Paystack transaction** for the same intended purchase.

**Attempt 2 (still had a race condition)**: Switched to `openAuthSessionAsync(paymentUrl, redirectUrl)` with a custom URL scheme redirect (`bwarikitchen://payment-complete`), and always called `verify` regardless of how the browser session resolved. This is more reliable for detecting session completion, but a **single** verify call immediately after the redirect could still race ahead of Paystack's own asynchronous webhook confirming the payment server-side — resulting in `verify` reporting a non-successful status even for a payment that had, in fact, succeeded moments later.

**Final state**: `verify` is now called in a **retry loop** — up to 4 attempts, 2 seconds apart (~6 seconds total), stopping as soon as any attempt reports `status: 'successful'`. If all attempts are exhausted without success, the app no longer shows a hard failure message; instead it says "Your payment is being confirmed. Check My Orders shortly for the latest status." and still navigates to `/my-orders`, since the order is real regardless of the app's ability to confirm it in real time (the webhook and admin dashboard remain the actual source of truth).

**Backend-side Paystack callback URL**: `PAYSTACK_CALLBACK_URL` must be set to the custom scheme, `bwarikitchen://payment-complete`, **not** an HTTPS URL — this must be set correctly in whichever backend host's environment variables are currently live (Render, as of the end of this conversation), and this only functions correctly in a **standalone/EAS build**, not in Expo Go (Expo Go cannot register a custom URL scheme for another app — i.e. Paystack's in-app browser — to redirect into). When testing in Expo Go, the redirect simply does not complete automatically; a static "Payment Received, you can close this window" HTML page (served by a new backend route, `GET /api/payments/verify` with no path param, added specifically to avoid Paystack's default redirect landing on a raw Express "Cannot GET" error page) is what the user sees instead.

### 6.5 Payment method scope reduction
The original schema's `PaymentMethod` enum included `card | bank_transfer | ussd | cash_on_delivery | wallet`. Two explicit decisions simplified this:
1. **Cash on delivery was dropped** entirely (no code path supports it).
2. **A separate, custom-built "manual bank transfer" flow** (originally present in the mobile app's `checkout.tsx` as a fully-designed UI — a countdown timer, a fake bank account number, a "confirm transfer" button with simulated verification) **was deleted entirely**. The decision made was that Paystack's own hosted checkout page **already offers card, bank transfer, and USSD as selectable channels within a single Paystack session** — there is no need to build a separate, custom bank-transfer UI or backend flow. The enum was collapsed to just `paystack | wallet` (the latter retained only because the unused `Wallet`/`WalletTransaction` schema-only models already existed; `wallet` as a `paymentMethod` value is not currently reachable from any UI).

### 6.6 Delivery fee estimation
Shown live in `checkout.tsx` before order placement, calling `POST /api/addresses/delivery-fee` (Haversine distance from the branch's stored lat/lng to the selected address's lat/lng, multiplied by a configurable `delivery_fee_per_km` `AppSetting`). This is explicitly labeled in code comments as an **estimate** — the authoritative delivery fee calculation happens again, server-side, inside `placeOrder` itself, using the same underlying logic but as the actual source of truth for what gets charged.

### 6.7 Promo codes in checkout
`checkout.tsx` has a "PROMO CODE" input section: typing a code and tapping "Apply" calls `POST /api/promotions/validate` with the code and the current subtotal, displaying the returned discount amount and updating the visible total. On order placement, if a promo was successfully applied, `promoCode` is included in the `POST /api/orders` payload — `placeOrder` re-validates and re-applies it server-side (never trusting the client-calculated discount amount).

### 6.8 Order tracking screen
A new screen, `app/track-order.tsx`, was built (there was no pre-existing equivalent) as a **deliberately simple, non-map-based** tracking UI — an earlier discussion weighed a live map (using `react-native-maps` + the `DeliveryTracking` table) against a simpler status-timeline approach, and the simple approach was chosen given that `DeliveryTracking` is never actually populated (no rider app writes to it — see §11.4), making a live map premature regardless. The screen shows: a vertical step timeline (adapting its step sequence for `pickup` vs `delivery` order types) with per-step timestamps pulled from `OrderStatusHistory`, the assigned rider's name with a tap-to-call button (`Linking.openURL('tel:...')`) once one is assigned, and the delivery address for delivery orders. It does not auto-poll for live updates — pull-to-refresh only.

---

## 7. Addresses

### 7.1 Original state
`context/AddressContext.tsx` was entirely mock/local — `AsyncStorage`-backed, three hardcoded fake addresses, fake IDs (`'1'`, `'2'`, `'3'`), and a `setTemporaryActiveAddress(text: string)` function that just stored a raw string with no coordinates at all. `AddressSelectorModal.tsx`'s "Use Current Location" button set the address to the literal string `'Current GPS Location'` — no actual device location was ever read.

### 7.2 Geocoding decision — a multi-step, cost-driven pivot
The original plan was to let customers type a free-text address and geocode it server-side into coordinates. Three options were seriously evaluated:
1. **Google Geocoding API** — most accurate for Nigerian/landmark-based addresses, but Google's billing setup unexpectedly demanded a **non-optional $30 upfront prepayment** before the advertised $200/month free credit would even activate (this appears to be account/region-dependent, not universal, but was encountered directly during setup).
2. **Mapbox Geocoding** — genuinely free tier (100,000 requests/month, no card required), but weaker accuracy for informal/landmark-based Nigerian addressing, and signup friction was encountered in practice.
3. **Device GPS + no geocoding API at all** — the option ultimately chosen.

**Final decision**: skip server-side geocoding entirely. The customer's own device GPS coordinates (via `expo-location`) are captured directly and saved as the address's `latitude`/`longitude`, alongside free-text fields (`label`, `streetAddress`, `landmark`, `area`) that exist purely for human-readable display and for the rider to read — **these text fields are never geocoded or parsed into coordinates**. This was reasoned to be a reasonable fit for Nigerian addressing patterns generally (informal, landmark-based addressing often geocodes poorly regardless of provider), not just a budget compromise.

Architecturally, the geocoding provider question was deliberately isolated behind a single backend endpoint concept from the start, so that if a future geocoding provider is added, only one function would need to change — this ended up moot since geocoding was dropped entirely, but the addressing system's backend routes (`address.controller.ts`) were already fully built and required **no changes** to support the GPS-only approach, since they already accepted `latitude`/`longitude` directly in the request body.

### 7.3 Real implementation
`context/AddressContext.tsx` was fully rewritten:
- `refresh()` — fetches real addresses via `GET /api/addresses`
- `addAddress(...)` — `POST /api/addresses` with real lat/lng
- `addCurrentLocationAddress(details)` — a convenience wrapper that internally requests location permission (`Location.requestForegroundPermissionsAsync`), reads the device's current position (`Location.getCurrentPositionAsync`), and calls `addAddress` with the resulting coordinates plus whatever text details were provided. Returns `{success, error?}` rather than throwing, so calling UI code doesn't need its own try/catch for location-specific failures.
- `updateAddress(id, updates)` — text-field-only updates (label/street/landmark/area); **coordinates are never re-captured on edit**, only on initial creation via GPS
- `removeAddress(id)`, `setDefaultAddress(id)`

`app/saved-addresses.tsx` and `components/AddressSelectorModal.tsx` were both fully rewritten to use this real context — the add/edit flow is a bottom-sheet form (built using React Native's built-in `Modal` component, **not** a custom shared `Modal` component, since no such component exists in the mobile app's `components/` folder — that name is only used by the **admin dashboard**'s shared `Modal.tsx`, a completely separate codebase; this distinction caused one real bundling error during development that had to be corrected).

### 7.4 Future map-based tracking consideration
Since the eventual production Google Cloud project (if the $30 prepayment path is taken later) would also unlock the **Maps SDK** and **Directions API** (same billing account, no separate signup), a live order-tracking map remains a plausible future enhancement without re-doing the geocoding-provider decision — this was noted but not acted on.

---

## 8. Notifications

### 8.1 Original state
`context/NotificationContext.tsx` was `AsyncStorage`-backed with 5 hardcoded fake notifications, including fields with no backend equivalent at all (`image` for rich media, `action: {label, route}` for a call-to-action button).

### 8.2 Real implementation
The backend's `notification.controller.ts`/`routes/notification.ts` were already substantially built (list, mark-as-read, mark-all-as-read, delete, delete-all, unread-count) before this part of the conversation began. Two new endpoints were added:
- `GET /api/notifications/preferences`
- `PATCH /api/notifications/preferences`

`context/NotificationContext.tsx` was fully rewritten to fetch real data and perform **optimistic updates** (UI updates immediately on mark-as-read/delete, with the real API call firing in the background and a full re-sync only triggered on failure).

`app/notifications.tsx` was rewritten: the fake `image`/`action` fields were replaced with a generic "View Order" button that appears whenever a notification has a non-null `relatedOrderId`, navigating to `/track-order`. Time-ago formatting and "NEW vs EARLIER" grouping were rebuilt to work off real `createdAt` timestamps rather than the mock data's pre-formatted strings like `"2 hours ago"`.

### 8.3 Notification preferences — new schema, new UI, NOT YET ENFORCED
Five boolean fields were added to `User` (`notifyOrderUpdates`, `notifyDeliveryAlerts`, `notifyPromotions`, `notifyNewMenu`, `notifyEmail`). `app/notification-preferences.tsx` was rewritten to read/write these via the two new endpoints above. Two additional toggles from the original mock UI (`sound`, `vibration`) were deliberately **kept device-local only** (`AsyncStorage`, no backend field) — these are genuinely device-level settings (whether the phone itself plays a sound), not something a server needs to know in order to decide whether to send a notification.

**Preference Enforcement (Implemented)**: The backend successfully enforces these preferences before pushing alerts to customer devices. Controllers like `updateOrderStatus`, `assignRider`, and `adminCancelOrder` actively verify that `user.deviceToken` exists AND the corresponding preference (e.g., `user.notifyOrderUpdates` or `user.notifyDeliveryAlerts`) is `true` before triggering the Expo Push API.

### 8.4 Real push notifications — IMPLEMENTED
Native push notifications are fully functional using Expo's FCM V1 integration. 

- **Backend Logic:** The backend explicitly tags outgoing messages with `priority: 'high'` and `channelId: 'default'`. This bypasses default Android silent delivery, forcing Heads-Up drop-down banners to physically appear on the user's screen.
- **Frontend OS Integration:** The React Native app defines a high-priority channel on boot, overriding aggressive battery-saving features (like TECNO's HiOS) by setting `lockscreenVisibility: PUBLIC`. The app uses a custom monochrome logo (`BK_logo_monochrome.png`) dynamically tinted to the brand color for the status bar.
- **User Experience:** React Native `AppState` listeners automatically clear application badge counts when the user brings the app to the foreground.
- **Smart Deep-Linking:** The app uses `useLastNotificationResponse` to capture background taps. It parses the notification payload (`data.route`) and title keywords (e.g., "Cancelled", "Delivered") to instantly navigate the user to `my-orders.tsx`, auto-switch to the correct tab (Active vs. Past), and auto-expand the specific order card.

---

## 9. Favorites

### 9.1 Original state
`context/FavoriteContext.tsx` was `AsyncStorage`-backed, storing whatever object was passed to `toggleFavorite(item)` directly, with no backend persistence at all (favorites disappeared on app reinstall, and — this was reported as an observed bug during testing — appeared to disappear on a full app force-quit-and-relaunch too, which traced back to the same context-refresh-timing issue described in §4.6, not a separate favorites-specific bug).

### 9.2 Real implementation — new backend feature built from scratch
No `Favorite` model existed prior to this conversation. Built:
- **Schema**: `Favorite` model — `userId`, and **exactly one of** `menuItemId` or `packageId` (both nullable foreign keys, with two separate `@@unique([userId, menuItemId])` / `@@unique([userId, packageId])` constraints rather than a single polymorphic "favoritable" relation — this was a deliberate simplicity choice given only two favoritable types exist)
- **Backend**: new `backend/src/controllers/favorite.controller.ts` and `backend/src/routes/favorite.ts` — `GET /api/favorites` (returns favorited items with their full `menuItem`/`package` data nested), `POST /api/favorites` (body: `{menuItemId}` or `{packageId}`, exactly one), `DELETE /api/favorites` (query params: `?menuItemId=` or `?packageId=`)
- Registered in `backend/src/index.ts` alongside the other route mounts

`context/FavoriteContext.tsx` was rewritten to preserve its **exact existing external API** (`toggleFavorite(item)`, `isFavorite(id)`) so that no calling screen (`menu.tsx`, `(tabs)/index.tsx`, `details.tsx`, `ForYouCard.tsx`, `favorite.tsx`) needed to change how it invokes the context — internally, `toggleFavorite` now determines whether the given `id` belongs to a menu item or a package (using `useMenu()`'s `findItem`/`findPackage`, meaning `FavoriteProvider` must be nested inside `MenuProvider` in `_layout.tsx`, which it already correctly is), performs an optimistic local update, and syncs to the real backend in the background with rollback-on-failure.

`app/(tabs)/favorite.tsx` needed only minor changes: swap the `MENU_ITEMS` import for `useMenu()`'s `findItem`, and wire pull-to-refresh to the context's real `refresh()`/`loading` state.

---

## 10. Search

`app/search.tsx` was originally a UI shell only — it captured and stored "recent searches" (genuinely functional, `AsyncStorage`-backed) and displayed a hardcoded "trending searches" list, but had **no actual search results logic at all** — typing a query did not search anything. Rewritten to filter `useMenu()`'s real `items` and `packages` client-side by name (case-insensitive substring match), displaying results grouped into "Menu Items" and "Packages" sections, each tappable through to `/details`. `components/SearchBar.tsx` needed a small addition (an `onChangeText` prop, threaded through alongside its existing `onSubmit`) to support live-as-you-type filtering rather than only searching on explicit submit.

"Trending searches" remains a **static hardcoded list** — no backend analytics/popularity tracking exists to compute genuine trending terms; this was flagged as a possible future feature, not addressed.

---

## 11. Explicitly Deferred / Out-of-Scope Items

These were identified during the project and **deliberately not built**, per explicit decisions:

1. **OTP / email verification at signup** (§4.3)
## Done
  2. **Real push notifications** (§8.4) — in-app list only
  3. **Notification preference enforcement** (§8.3) — fields exist, nothing checks them
##
4. **Promo targeting/eligibility rules** (e.g. "only new customers," "only for specific menu items") and **auto-applying promos** to specific items/packages shown on the home/menu screens without a code. The current `Promotion` model has no targeting fields, no item/package relation — every active promo is generically available to any customer who enters the code, subject only to `minOrderAmount`/`maxUses`/`perUserLimit`/date-range rules. This was scoped as a significant future feature (needs new schema for eligibility rules and a many-to-many relation to specific menu items/packages for auto-apply).
5. **iOS build/testing** — the codebase is cross-platform (Expo/React Native), nothing platform-specific has been introduced, but no iOS build has been produced or tested. This requires either a **paid Apple Developer Program account ($99/year)** for real-device testing/distribution, or a Mac for free iOS Simulator-only testing (not available in the development environment used, which was Windows).
6. **Manual bank transfer payment flow** — was actually built (frontend UI) then explicitly **removed** in favor of relying on Paystack's own multi-channel hosted checkout (§6.5).
7. **Saved payment cards** — explicitly decided against; no card storage, no PCI-scope consideration needed, since Paystack's hosted flow handles card entry fresh each time. The pre-existing `payment-methods.tsx` screen (a fully mock "saved cards" UI, including a since-inaccurate "PCI DSS compliant" security claim) was **deleted entirely**, along with any navigation links to it.
8. **Rider-facing frontend app** — the backend has full rider endpoints (`rider.controller.ts`, referenced throughout `Order`/`DeliveryTracking` logic — a rider can be assigned to an order, has their own `role: rider` on the shared `User` table), but **no rider mobile app or web interface exists anywhere in the codebase**. This means `DeliveryTracking.currentLatitude`/`currentLongitude` (§2.1) can never be populated in practice, since nothing writes to it.
9. **WebSocket / real-time push to the admin dashboard** — discussed as a way to make new orders appear live on the admin's Orders screen without a manual refresh, using Socket.IO. Explicitly deferred ("let's hold off on WebSockets for now") in favor of finishing the optimistic-update pass across the admin UI first (§13.6).
10. **Live map-based order tracking** — deferred in favor of the simpler status-timeline `track-order.tsx` screen (§6.8), partly because `DeliveryTracking` is never populated (see item 8 above) and partly to avoid the added complexity of `react-native-maps` for a first version.
11. **Dark mode for the admin dashboard** — was scoped in detail (Tailwind `darkMode: 'class'`, a new admin-side `ThemeContext`, a toggle in `Layout.tsx`, then a per-page `dark:` variant pass) but explicitly deferred as "a bigger fix" in favor of the visual/animation redesign work (§13) instead.
12. **Terms of Service / Privacy Policy real content** — `help.tsx`'s legal links are currently placeholder taps showing a "Coming Soon" alert; no actual policy documents exist yet to link to.

---

## 12. Testing Approach and Lessons

A significant portion of this project involved writing a large volume of interdependent code (roughly 25+ files touched across backend and mobile) **before running the application even once**. This was explicitly flagged multiple times as a growing risk, and the person driving the conversation twice chose to continue building rather than pause to test — which is a reasonable prioritization call to make explicitly, but it did mean that when testing finally began, several real bugs had accumulated silently (the missing brace in `order.controller.ts` breaking the entire backend being the most severe example — §2.5, item 7). **Recommendation for continuing this project**: after any batch of related changes (roughly 3-5 files), run the affected part of the system before moving to the next batch, rather than deferring all testing to the end of a long work session.

Testing was conducted using:
- **Backend**: `npm run dev` (via `ts-node-dev`, auto-restarts on file change) locally, with `curl http://localhost:3000/health` as a quick liveness check
- **Mobile app**: primarily **Expo Go** (`npx expo start`, sometimes requiring `--tunnel` or `--lan` flags depending on network conditions — connectivity issues were encountered and resolved by forcing LAN mode, and separately by fixing ngrok's global-install permission failure on Windows by running the install command in an elevated/administrator terminal)
- A **standalone Android APK** was later built via `eas build --platform android --profile preview` specifically to test the Paystack deep-link redirect flow, which cannot function correctly inside Expo Go (§6.4). Building this required resolving an EAS project-ownership mismatch (`eas init` after clearing the stale `projectId` from `app.json`, since the existing id belonged to a different Expo account than the one being used)
- **Real device debugging**: `adb logcat *:S ReactNative:V ReactNativeJS:V` was used once to retrieve a JS crash stack trace that wasn't visible through Expo Go's own error overlay

---

## 13. Admin Dashboard — UI/UX Overhaul

This was a distinct, later phase of the project, focused entirely on the admin dashboard's usability and visual design (not the mobile app).

### 13.1 "Click anywhere" pattern
Originally, every list page (Orders, Customers, Riders, Promotions, Menu's three tabs) required clicking a dedicated "View" text/button to open a detail modal, even though the entire table row or card was otherwise inert. This was changed so that **clicking anywhere on the row/card opens the detail view**, while any nested interactive control (a `Toggle` switch, a "Delete" button) calls `e.stopPropagation()` in its own `onClick`/wrapper `onClick` to prevent the row-level click handler from also firing. The redundant "View" text/button was subsequently **removed entirely** (once every row was clickable, the label served no function) and replaced with a purely decorative `ChevronRight` icon as a visual affordance that the row is actionable. This pattern was applied to: `Orders.tsx`, `Customers.tsx`, `Riders.tsx`, `Promotions.tsx`, and all three tabs of `Menu.tsx`. `Reviews.tsx` was deliberately **excluded** from this pattern — its cards already show full review content inline with no further detail to reveal on click, so adding a click handler there would have been meaningless.

### 13.2 Optimistic updates — eliminating the refresh-flicker
Every toggle action (category/item/package availability, customer/rider active status, promotion active status, review visibility) originally followed the pattern: call the API, then call the corresponding `fetchX()` function to reload the entire list from the server, causing a brief "Loading..." flicker on every single click. This was misdiagnosed by the person driving the conversation as possibly needing WebSockets to fix — it was clarified that this is a **client-side data-fetching pattern issue**, unrelated to real-time push. The fix applied everywhere: update local React state **immediately and optimistically** with the expected new value, fire the API call in the background, and only revert to the previous state (rolling back the optimistic update) if the API call actually fails. This was applied to every toggle handler across `Orders.tsx` (via the shared `OrderDetailModal.tsx`, see §13.5), `Customers.tsx`, `Riders.tsx`, `Promotions.tsx`, `Reviews.tsx`, and all three `Menu.tsx` tabs. **A secondary benefit of this pass**: several success-toast messages were found to be using the **stale** pre-toggle value to decide whether to say "activated" or "deactivated" (e.g. `showSuccess(`${x} ${item.isActive ? 'deactivated' : 'activated'}`)` — using `item.isActive`, the value *before* the toggle, rather than the actual new value) — these were corrected to use the real new state value in every instance found.

### 13.3 Design system foundation
Since this project uses **Tailwind v4** (confirmed via the presence of `postcss.config.js` with `@tailwindcss/postcss` and no `tailwind.config.js` file — Tailwind v4 moved configuration into CSS via `@theme` blocks), the new design tokens were added directly to `admin/src/index.css`:

- **`primary-*`** (new) — an indigo/violet scale (`#6366f1` base), used for primary actions, active nav states, links — this is the **new** main brand color
- **`brand-*`** (kept, redefined as the secondary/accent color) — the original orange/coral scale was **preserved rather than removed**, since dozens of existing files already reference `bg-brand-600` etc. throughout the codebase; ripping it out would have required touching every file simultaneously. It now serves as a warm accent color (featured badges, etc.) rather than the primary action color.
- **`surface-*`** (new) — a cool-toned slate/gray scale, used in place of Tailwind's default `gray-*` for a less generic neutral palette
- **Semantic tokens** (new): `--color-success`, `--color-warning`, `--color-danger`, `--color-info` — single values (not full 9-step scales), used for status indication

**`framer-motion`** was installed (`npm install framer-motion`) as the animation library for the entire redesign — used for entrance animations, layout transitions, hover/tap feedback, and the sidebar's active-nav-item sliding-pill effect (via `layoutId`).

### 13.4 Shared component redesign (completed in full)
Every shared component was rewritten before any page-level redesign work began, specifically so that page redesigns afterward would be mechanical (applying already-established patterns) rather than requiring new design decisions mid-page:

- **`Layout.tsx`** — restructured from a mobile-only slide-in drawer (always closed by default, even on desktop) into a **persistent, collapsible sidebar** on desktop (toggles between a 260px full-width state and a 76px icon-only state, animated via `framer-motion` spring physics) with a mobile-only overlay drawer fallback. Both the sidebar and the top bar received a **glassmorphism treatment** (`backdrop-blur-xl` over a semi-transparent background) per an explicit aesthetic preference. The active nav item's indigo highlight uses `framer-motion`'s `layoutId="active-nav-pill"` so it **visually slides** between menu items on navigation rather than snapping instantly. **Known limitation**: the content area's left-margin offset (to account for the sidebar's current width) is calculated once via `window.innerWidth` at render time and does **not** reactively update if the browser window is resized after initial load — this was explicitly flagged as an acceptable simplification for now, not fixed with a resize listener.
- **`Modal.tsx`** — added `AnimatePresence`-driven enter/exit animation (backdrop fade + card scale-and-slide-up spring), `backdrop-blur-sm` on the overlay, larger `rounded-2xl` corners, deeper tinted shadow
- **`Toggle.tsx`** — switched from a CSS-transition slide to a `framer-motion` spring-physics slide (with visible overshoot/bounce), added `whileTap` press-scale feedback, slightly enlarged
- **`LoadingButton.tsx`** — `primary` variant now uses a gradient fill (`primary-500` → `primary-600`) with a tinted glow shadow rather than a flat color fill; added `whileTap` scale feedback. Note: required a `{...(props as any)}` type-cast when spreading native button props onto `motion.button`, since `framer-motion`'s prop types don't perfectly align with `ButtonHTMLAttributes` — this is a standard, safe pattern for this specific library combination, not a type-safety compromise elsewhere.
- **`StatusBadge.tsx`** — added a small colored status dot before the label, with a **pulsing animation** (`framer-motion` looping scale/opacity) specifically on "in-progress" states (`pending`, `preparing`, `on_the_way`) to visually distinguish active/ongoing states from settled ones (`delivered`, `cancelled`) at a glance
- **`Pagination.tsx`** — added directional chevron icons, `whileTap` feedback, highlighted current page number
- **`ConfirmDialog.tsx`** — same entrance/exit animation treatment as `Modal.tsx`; added a warning-triangle icon badge specifically for `danger`-flagged confirmations
- **`ReasonDialog.tsx`** — same treatment; added a visible focus ring on the textarea (previously had none at all)
- **`StatCard.tsx`** — numeric values now **animate with a count-up effect** on mount/update, using `framer-motion`'s `useSpring`/`useTransform` hooks manually wired to a small `AnimatedNumber` sub-component (string values, like pre-formatted currency, are not counted up — they simply render as-is, since animating a string numerically is unreliable). Cards fade/slide in on mount and lift slightly on hover. Icons now sit inside a colored rounded badge (`accent` prop: `primary | success | warning | danger`) rather than plain gray.

### 13.5 New shared component: `OrderDetailModal.tsx`
When restructuring the Orders page into a tabbed layout (§13.6), the order-detail modal's logic (view details, advance status, assign rider, cancel) was **extracted into its own reusable component**, `admin/src/components/OrderDetailModal.tsx`, exporting both the component and the `Order` TypeScript interface. This avoids duplicating roughly 200 lines of modal JSX and handler logic between the Active and Settled order views.

### 13.6 Orders page — restructured into tabs, twice
This went through two design iterations based on evolving requirements:
1. **First attempt**: split into two separate pages/routes (`/orders` "Active Orders" and a new `/settled-orders` "Settled Orders"), each with its own nav entry in `Layout.tsx`.
2. **Final version (superseding the first)**: restructured instead as a **single page with two tabs**, following the same `Menu.tsx` tabbed-page pattern already established elsewhere in the dashboard, rather than as separate routes. `Orders.tsx` now has an `OrdersTable` sub-component parameterized by a `statuses: string[]` array (either `ACTIVE_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'on_the_way']` or `SETTLED_STATUSES = ['delivered', 'cancelled', 'refunded']`), and both tabs share the same `OrderDetailModal`.

**Important backend limitation discovered and worked around**: `adminGetOrders`'s `status` query parameter only accepts a **single** status value (`status: status as any` in the Prisma `where` clause — no support for filtering by multiple statuses at once). Since a tab needs to show *multiple* statuses simultaneously (e.g. "Active" spans six different status values), the actual filtering by status-set happens **client-side**: the frontend fetches a generously-sized page (`limit=100`) from the existing single-status-or-no-filter endpoint, then filters the results in the browser to the current tab's status set, then paginates that filtered array client-side (15 per page). This was explicitly flagged as **not scalable indefinitely** — if order volume grows significantly, the backend's `status` filter should be upgraded to accept a comma-separated list (`status: { in: statusArray }`) so real server-side pagination can be restored per tab. This upgrade was **not implemented**, only identified as a known future need.

### 13.7 Analytics page — chart visual upgrade
Using the `recharts` library (already in use, not newly introduced): the revenue chart was changed from a plain `LineChart` to an `AreaChart` with a gradient fill beneath the line (`<linearGradient>` fading from ~35% opacity to fully transparent). The payment-method breakdown pie chart was changed to a **donut** (via `innerRadius`). All chart colors were remapped to the new `primary`/`brand` palette. Axis lines and tick lines were removed for a cleaner look, and chart tooltips received custom rounded/shadowed styling (Recharts' `contentStyle` prop) instead of the library's plain default box. Every chart card was wrapped in a shared local `ChartCard` component with a staggered fade-up entrance animation (increasing `delay` per card).

### 13.8 Pages fully redesigned (visual pass complete)
`Layout.tsx`, `Modal.tsx`, `Toggle.tsx`, `LoadingButton.tsx`, `StatusBadge.tsx`, `Pagination.tsx`, `ConfirmDialog.tsx`, `ReasonDialog.tsx`, `StatCard.tsx`, `Dashboard.tsx`, `Analytics.tsx`, `Orders.tsx` (+ new `OrderDetailModal.tsx`), `Menu.tsx` (all three tabs), `Promotions.tsx`, `Reviews.tsx`, `Customers.tsx`, `Riders.tsx`.

### 13.9 Pages NOT yet redesigned (visual pass incomplete)
As of the end of this conversation, the following admin pages **still use the old visual styling** (plain `gray-*`/`brand-*` colors, no `framer-motion` animation, old `rounded-xl` corners, no glass effects) and have **not** been touched during the UI/UX overhaul phase:
- `Settings.tsx`
- `ActivityLog.tsx`
- `Login.tsx`

These three pages remain functionally correct (no bugs were introduced or found in them during this project) but are visually inconsistent with the rest of the now-redesigned dashboard.

---

## 14. Environment Variables Reference

**Backend** (`backend/.env`, and mirrored in whichever host — Render, currently — is live):
```
DATABASE_URL=          # Supabase pooled connection, port 6543, ?pgbouncer=true
DIRECT_URL=            # Supabase direct connection, port 5432 — used for migrations only
PORT=3000
JWT_SECRET=            # ⚠️ STILL SET TO THE LITERAL PLACEHOLDER "your-long-random-secret" — must be replaced with a real generated secret before any real launch. This was flagged repeatedly and never actually fixed.
NODE_ENV=
PAYSTACK_SECRET_KEY=
PAYSTACK_PUBLIC_KEY=
PAYSTACK_CALLBACK_URL= # Must be the custom scheme: bwarikitchen://payment-complete
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

**Mobile app** (project root `.env`, NOT `backend/.env`):
```
EXPO_PUBLIC_API_URL=   # Currently should point at the live Render backend URL for any real device/APK testing. Can be swapped to a local LAN IP (e.g. http://192.168.x.x:3000) for local dev with `npm run dev` running.
```

**Admin dashboard** (`admin/.env`, and mirrored as a Vercel project environment variable):
```
VITE_API_URL=          # Should point at the live Render backend URL
```

### 14.1 Known outstanding security items (never resolved)
- `JWT_SECRET` remains the literal placeholder string, not a real secret — this is a genuine, unresolved security gap.
- The Supabase database password and service-role key were pasted in plaintext into this conversation on more than one occasion — rotating the database password was recommended repeatedly but never confirmed as actually done.
- No confirmation exists that a Supabase-pause or Render-cold-start keep-alive cron job is currently active — this was set up conceptually for an earlier Railway+Supabase configuration but should be re-verified now that Render is the live backend host.

---

## 15. Quick Reference — "Where do I find X?"

| Concern | Location |
|---|---|
| Prisma schema | `backend/prisma/schema.prisma` |
| DB connection config | `backend/prisma.config.js` (CLI) + `backend/src/lib/prisma.ts` (runtime) |
| Public menu API | `backend/src/controllers/menu.controller.ts` |
| Admin menu API | `backend/src/controllers/admin.menu.controller.ts` |
| Order placement logic | `backend/src/controllers/order.controller.ts` (`placeOrder`) |
| Paystack integration | `backend/src/controllers/payment.controller.ts`, `backend/src/lib/paystack.ts` |
| Mobile shared menu data | `context/MenuContext.tsx` |
| Mobile cart state | `context/CartContext.tsx` (not significantly changed — data-source-agnostic by original design) |
| Mobile checkout + payment flow | `app/checkout.tsx` |
| Mobile order tracking | `app/track-order.tsx` (new) |
| Admin shared components | `admin/src/components/*.tsx` |
| Admin design tokens | `admin/src/index.css` (`@theme` block) |
| Admin order detail modal | `admin/src/components/OrderDetailModal.tsx` (new, shared between Active/Settled tabs) |

---

*End of documentation. This reflects the state of the system as of the end of this conversation. Anything not explicitly described here should be assumed unbuilt or unverified, not assumed to exist or work correctly.*
