# Bwari Kitchen — Complete Project Context

**Document Purpose:** Full technical context for continuing this project in a new chat session.  
**Last Updated:** September 2026
**Project Stage:** Backend complete, Admin dashboard complete, Frontend (React Native) in progress by separate team.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Repository Structure](#2-repository-structure)
3. [Tech Stack](#3-tech-stack)
4. [Database Schema — Complete Reference](#4-database-schema--complete-reference)
5. [Backend API — Complete Reference](#5-backend-api--complete-reference)
6. [Admin Dashboard — Complete Reference](#6-admin-dashboard--complete-reference)
7. [Key Business Logic & Design Decisions](#7-key-business-logic--design-decisions)
8. [Environment Setup](#8-environment-setup)
9. [Known Issues & Technical Debt](#9-known-issues--technical-debt)
10. [What Has Been Built vs What Remains](#10-what-has-been-built-vs-what-remains)
11. [Important Files Reference](#11-important-files-reference)

---

## 1. Project Overview

**Bwari Kitchen** is a food ordering mobile application for a single Nigerian restaurant located in Abuja, Nigeria. The restaurant solely owns the app — it is not a marketplace (no multiple restaurants). The app targets customers within Abuja ordering food for delivery or pickup.

### System Architecture

The project is a **monorepo** with three distinct parts:

```
bwari-kitchen-mobile/               ← GitHub repo root
├── app/                            ← React Native / Expo frontend (built by separate frontend team)
├── backend/                        ← Node.js REST API (built in this project)
└── admin/                          ← React web admin dashboard (built in this project)
```

### The Three Surfaces

| Surface | Technology | Purpose | Who Uses It |
|---|---|---|---|
| Customer App | React Native + Expo Go | Order food, track delivery, pay | Customers |
| Admin Dashboard | React + Vite + TailwindCSS | Manage everything | Bwari Kitchen staff |
| Rider (within app) | React Native + Expo Go | Handle deliveries | Riders |
| Backend API | Node.js + Express + Prisma | Single API serving all surfaces | All of the above |
| Database | PostgreSQL on Supabase | All persistent data | Backend only |

### Nigerian Market Specifics
- All monetary values in **NGN (Nigerian Naira)**
- Phone number is the primary identifier (not email) — Nigerian users often don't use email
- Nigerian phone format: `+234` or `0` prefix, e.g. `08012345678`
- Addresses use landmark-based system ("beside First Bank") not strict street addresses
- Payment via **Paystack** (Nigerian payment gateway)
- OTP provider would be **Termii** (Nigerian-first, cheaper than Twilio) — not yet implemented

---

## 2. Repository Structure

### Full Directory Tree

```text
bwari-kitchen-app/
│
├── admin/                            ← React admin dashboard
│   ├── src/
│   │   ├── components/
│   │   │   ├── ConfirmDialog.tsx
│   │   │   ├── Layout.tsx
│   │   │   ├── LoadingButton.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── OrderDetailModal.tsx
│   │   │   ├── Pagination.tsx
│   │   │   ├── ReasonDialog.tsx
│   │   │   ├── SidebarBadge.tsx      ← Added for active order counts
│   │   │   ├── StatCard.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   └── Toggle.tsx
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   ├── hooks/
│   │   │   └── useLivePolling.ts     ← Added for silent background refreshing
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   └── toast.ts
│   │   ├── pages/
│   │   │   ├── ActivityLog.tsx
│   │   │   ├── Analytics.tsx
│   │   │   ├── Customers.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Menu.tsx
│   │   │   ├── Orders.tsx
│   │   │   ├── Promotions.tsx
│   │   │   ├── Reviews.tsx
│   │   │   ├── Riders.tsx
│   │   │   └── Settings.tsx
│   │   ├── App.css
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   ├── .env
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
│
├── app/                              ← Expo React Native (customer frontend screens)
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── favorite.tsx
│   │   ├── index.tsx
│   │   ├── menu.tsx
│   │   └── profile.tsx
│   ├── lib/
│   │   └── api.ts
│   ├── _layout.tsx
│   ├── beta-intro.tsx
│   ├── cart.tsx
│   ├── checkout.tsx
│   ├── details.tsx
│   ├── help.tsx
│   ├── index.tsx
│   ├── login.tsx
│   ├── my-orders.tsx
│   ├── notification-preferences.tsx
│   ├── notifications.tsx
│   ├── personal-info.tsx
│   ├── privacy-policy.tsx
│   ├── promo.tsx
│   ├── saved-addresses.tsx
│   ├── search.tsx
│   ├── setup-address.tsx
│   ├── setup-pin.tsx
│   ├── signup.tsx
│   ├── track-order.tsx
│   ├── unlock.tsx
│   ├── user-agreement.tsx
│   ├── verify-otp.tsx
│   └── welcome.tsx
│
├── assets/                           ← Global app assets
│
├── backend/                          ← Node.js backend
│   ├── prisma/
│   │   ├── migrations/               ← Contains history up to add_favorites
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── address.controller.ts
│   │   │   ├── admin.activityLog.controller.ts
│   │   │   ├── admin.analytics.controller.ts
│   │   │   ├── admin.auth.controller.ts
│   │   │   ├── admin.menu.controller.ts
│   │   │   ├── admin.order.controller.ts
│   │   │   ├── admin.settings.controller.ts
│   │   │   ├── admin.user.controller.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── favorite.controller.ts
│   │   │   ├── menu.controller.ts
│   │   │   ├── notification.controller.ts
│   │   │   ├── order.controller.ts
│   │   │   ├── payment.controller.ts
│   │   │   ├── promotion.controller.ts
│   │   │   ├── review.controller.ts
│   │   │   ├── rider.controller.ts
│   │   │   └── upload.controller.ts
│   │   ├── lib/
│   │   │   ├── activityLog.ts
│   │   │   ├── delivery.ts
│   │   │   ├── orderNumber.ts
│   │   │   ├── paystack.ts
│   │   │   ├── paystackReference.ts
│   │   │   ├── prisma.ts
│   │   │   ├── promoCode.ts
│   │   │   ├── supabase.ts
│   │   │   └── upload.ts
│   │   ├── middleware/
│   │   │   ├── adminAuth.ts
│   │   │   └── auth.ts
│   │   ├── routes/
│   │   │   ├── address.ts
│   │   │   ├── admin.activityLog.ts
│   │   │   ├── admin.analytics.ts
│   │   │   ├── admin.auth.ts
│   │   │   ├── admin.menu.ts
│   │   │   ├── admin.order.ts
│   │   │   ├── admin.promotion.ts
│   │   │   ├── admin.review.ts
│   │   │   ├── admin.settings.ts
│   │   │   ├── admin.user.ts
│   │   │   ├── auth.ts
│   │   │   ├── favorite.ts
│   │   │   ├── menu.ts
│   │   │   ├── notification.ts
│   │   │   ├── order.ts
│   │   │   ├── payment.ts
│   │   │   ├── promotion.ts
│   │   │   ├── review.ts
│   │   │   ├── rider.ts
│   │   │   └── upload.ts
│   │   ├── types/
│   │   │   └── express.d.ts
│   │   └── index.ts
│   ├── .env
│   ├── .env.example
│   ├── BACKEND_DOCUMENTATION.md      ← Backend-specific docs
│   ├── package-lock.json
│   ├── package.json
│   ├── prisma.config.js
│   └── tsconfig.json
│
├── components/                       ← Frontend Shared UI elements
│   ├── ActionModal.tsx
│   ├── AddressSelectorModal.tsx
│   ├── BottomNav.tsx
│   ├── CartBadgeIcon.tsx
│   ├── CategoryFilter.tsx
│   ├── DraggableOrderButton.tsx
│   ├── FeedbackExitModal.tsx
│   ├── ForYouCard.tsx
│   ├── GreetingSection.tsx
│   ├── GridDishCard.tsx
│   ├── HeroHeader.tsx
│   ├── HomeIcon.tsx
│   ├── ItemVariantModal.tsx
│   ├── LocationPickerMap.tsx
│   ├── PromoSlider.tsx
│   ├── QuickEditPackage.tsx
│   ├── SafeKeyboardWrapper.tsx
│   ├── SearchBar.tsx
│   ├── Sidebar.tsx
│   ├── SplashDesigner.tsx
│   └── TopNav.tsx
│
├── constants/
│   ├── Colors.ts
│   ├── menuData.ts
│   └── Sizes.tsx
│
├── context/                          ← Frontend State Providers
│   ├── AddressContext.tsx
│   ├── CartContext.tsx
│   ├── FavoriteContext.tsx
│   ├── MenuContext.tsx
│   ├── NotificationContext.tsx
│   ├── ThemeContext.tsx
│   └── UserContext.tsx
│
├── hooks/
│   └── useSafeRouter.ts
│
├── utils/
│   └── NotificationService.ts        ← Native push notification logic
│
├── .env, .gitignore, app.json, eas.json, eslint.config.js, package.json, tsconfig.json
├── Backend & Deployment Sync Guide.txt
├── BWARI_KITCHEN_PROJECT_CONTEXT.md
├── BWARI_KITCHEN_SYSTEM_DOCUMENTATION.md
├── bwari-kitchen-[ID]-firebase-adminsdk.json  ← Firebase Admin Keys (Gitignored)
├── check list.txt
├── google-services.json                       ← Firebase Map (Gitignored)
└── README.md
```

---

## 3. Tech Stack

### Backend

| Tool | Version | Purpose |
|---|---|---|
| Node.js | 18+ | Runtime |
| TypeScript | 6.x | Language |
| Express | 5.x | HTTP framework — note: v5 handles async errors natively, no `express-async-errors` needed |
| Prisma | 7.x | ORM — **breaking changes from v5/v6, see section 9** |
| PostgreSQL | 15 | Database (hosted on Supabase) |
| Supabase | — | Managed Postgres + file storage |
| bcryptjs | — | Password hashing (salt rounds: 12) |
| jsonwebtoken | — | JWT generation and verification |
| axios | — | HTTP client for Paystack API calls |
| multer | — | Multipart file upload handling (memory storage) |
| @supabase/supabase-js | — | Supabase Storage SDK |
| json2csv | — | CSV export for analytics |
| zod | — | Request validation (installed, not yet used) |
| helmet | — | Security headers |
| cors | — | Cross-origin requests |

### Admin Dashboard

| Tool | Version | Purpose |
|---|---|---|
| React | 18 | UI framework |
| Vite | 5 | Build tool |
| TypeScript | 5 | Language |
| TailwindCSS | 4.x | Styling — **v4 uses CSS-first config, no tailwind.config.js** |
| React Router | 6 | Client-side routing |
| Axios | — | API calls |
| Recharts | — | Charts for analytics |
| react-hot-toast | — | Toast notifications |
| lucide-react | — | Icon library (replaced all emoji icons) |

### Database

| Tool | Purpose |
|---|---|
| Supabase | Managed PostgreSQL hosting |
| Supabase Storage | File/image storage (buckets: `menu-images`, `profile-photos`) |
| Prisma | Schema management, migrations, type-safe queries |

---

## 4. Database Schema — Complete Reference

### Critical Prisma 7 Notes

Prisma 7 made **breaking changes** from v5/v6:
- `url` and `directUrl` are **no longer allowed** in `schema.prisma` datasource block
- Connection URLs now live in `prisma.config.js` (a new file at the project root)
- The `prisma.config.js` file uses `defineConfig()` and an async `adapter` function
- `db push` is used instead of `migrate dev` in this project due to migration history drift (see section 9)

### `prisma.config.js` (current working version)

```javascript
const { defineConfig } = require('prisma/config')
require('dotenv').config()

module.exports = defineConfig({
  earlyAccess: true,
  schema: './prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrate: {
    seed: 'ts-node prisma/seed.ts',
    adapter: async () => {
      const { PrismaPg } = await import('@prisma/adapter-pg')
      return new PrismaPg({
        connectionString: process.env.DATABASE_URL,
        connectionTimeoutMillis: 30000,
        idleTimeoutMillis: 30000,
      })
    },
  },
})
```

### `datasource db` in `schema.prisma`

```prisma
datasource db {
  provider = "postgresql"
}
```

No `url` field — it lives in `prisma.config.js` only.

### Prisma Client Instantiation (src/lib/prisma.ts)

```typescript
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import * as dotenv from 'dotenv'

dotenv.config()

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

const prisma = new PrismaClient({ adapter })
export default prisma
```

SSL is disabled on the Supabase project dashboard (not in code). This was done early to avoid SSL cert issues during development.

---

### Database Tables — Full Schema

#### Enums

```prisma
enum UserRole { customer, rider }
// NOTE: 'admin' was intentionally REMOVED from this enum.
// Admins are in a completely separate table (admin_users).

enum OrderType { delivery, pickup }
enum OrderStatus { pending, confirmed, preparing, ready, picked_up, on_the_way, delivered, cancelled, refunded }
enum PaymentMethod { card, bank_transfer, ussd, cash_on_delivery, wallet }
enum PaymentStatus { pending, processing, successful, failed, refunded }
enum TransactionType { credit, debit }
enum NotificationType { order_update, promotion, system, review_request }
enum PromotionType { percentage, fixed, free_delivery, bogo }
```

#### `app_settings`
Key-value store for business configuration. Updated by admin via Settings page.

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| key | String (unique) | e.g. `restaurant_name`, `delivery_fee_per_km`, `min_order_amount`, `opening_time`, `closing_time`, `support_phone` |
| value | String | Always stored as string, parsed by backend |
| description | String? | Optional explanation |
| createdAt | DateTime | |
| updatedAt | DateTime | Auto-updated |

Seeded values: `restaurant_name=Bwari Kitchen`, `support_phone=+2348000000000`, `min_order_amount=2000`, `delivery_fee_per_km=150`, `opening_time=08:00`, `closing_time=22:00`

#### `branches`
Single restaurant location. Designed to support multiple branches in future.

| Column | Type | Notes |
|---|---|---|
| id | String | PK — hardcoded as `'main-branch'` in seed and all controllers |
| name | String | |
| address | String | |
| landmark | String? | |
| area | String? | e.g. "Bwari", "Kubwa" |
| latitude | Decimal(9,6)? | GPS — **required for delivery fee calculation** |
| longitude | Decimal(9,6)? | GPS — **required for delivery fee calculation** |
| phoneNumber | String? | |
| openingTime | String? | Format: "HH:MM" |
| closingTime | String? | Format: "HH:MM" |
| isOpen | Boolean | Admin toggles this to open/close restaurant |
| acceptsPickup | Boolean | |
| acceptsDelivery | Boolean | |
| deliveryRadiusKm | Decimal(4,2)? | Currently set to 50km |
| createdAt | DateTime | |
| updatedAt | DateTime | |

**Important:** Branch coordinates are `9.278154, 7.372769` (Bwari area, Abuja). The delivery radius is `50km`. All delivery fee calculations use `main-branch` as origin.

#### `admin_users`
**Completely separate from `users` table.** Admins log in with email+password, not phone. This was a deliberate architectural decision to separate admin access from customer/rider access.

| Column | Type | Notes |
|---|---|---|
| id | String | PK — UUID via `@default(uuid())` |
| fullName | String | |
| email | String (unique) | Login identifier |
| passwordHash | String | bcrypt, 12 salt rounds |
| isSuperAdmin | Boolean | Super admin can create other admins |
| isActive | Boolean | |
| createdAt | DateTime | |
| updatedAt | DateTime | |
| deletedAt | DateTime? | Soft delete |

**Seeded super admin:** `email: admin@bwarikitchen.com`, `password: admin123` (should be changed in production)

#### `users`
Customers and riders only. Note `UserRole` enum has only `customer` and `rider` — `admin` was removed.

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| fullName | String | |
| email | String? (unique) | Optional — phone is primary |
| phoneNumber | String (unique) | **Primary identifier** — used for login |
| passwordHash | String? | bcrypt |
| role | UserRole | `customer` or `rider` |
| profilePhotoUrl | String? | Supabase Storage URL |
| isVerified | Boolean | Phone OTP verification (not yet implemented) |
| isActive | Boolean | Admin can deactivate |
| deviceToken | String? | Expo FCM V1 push notification token (Actively used for Heads-Up banners) |
| createdAt | DateTime | |
| updatedAt | DateTime | |
| deletedAt | DateTime? | Soft delete |

Seeded test accounts:
- Rider: phone `08011111111`, password `rider123`
- Customer: phone `08022222222`, password `customer123`

#### `user_addresses`
Multiple saved addresses per customer. Landmark field is critical for Nigerian addressing.

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| userId | UUID (FK → users) | |
| label | String? | e.g. "Home", "Office" |
| streetAddress | String | |
| landmark | String? | e.g. "beside First Bank" |
| area | String? | e.g. "Wuse 2" |
| city | String | Default: "Abuja" |
| latitude | Decimal(9,6)? | GPS |
| longitude | Decimal(9,6)? | GPS |
| isDefault | Boolean | |
| createdAt | DateTime | |
| deletedAt | DateTime? | Soft delete |

#### `categories`
Menu groupings. Availability cascades **both ways** (activating a category now also re-enables all items).

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| name | String | |
| description | String? | |
| imageUrl | String? | Supabase Storage URL |
| sortOrder | Int | |
| isActive | Boolean | Toggling cascades to all `menu_items` in category |
| createdAt | DateTime | |
| updatedAt | DateTime | |

Seeded categories: `Dishes`, `Soups`, `Swallows`, `Protein`, `Add-ons`, `Drinks`, `Organic Drinks`, `Snacks`

#### `menu_items`
Individual food items. **No add-on/option system** — items stand alone and are combined in packages.

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| branchId | UUID? (FK → branches) | NULL = available at all branches |
| categoryId | UUID (FK → categories) | |
| name | String | |
| description | String? | |
| basePrice | Decimal(10,2) | In NGN |
| discountPrice | Decimal(10,2)? | If set, used instead of basePrice |
| imageUrl | String? | Supabase Storage URL |
| isAvailable | Boolean | Individual toggle |
| isFeatured | Boolean | |
| preparationTime | Int? | Minutes |
| tags | String[] | e.g. `["bestseller", "new"]` |
| sortOrder | Int | |
| createdAt | DateTime | |
| updatedAt | DateTime | |
| deletedAt | DateTime? | Soft delete — preserves order history |

**Design decision:** No `menu_item_options` or `menu_item_option_choices` tables. These were removed early in development. Customization is handled by the customer choosing individual items (e.g. add "Beef" item separately, not as an add-on to rice).

#### `packages`
Restaurant-created combo deals. Can also be customer-built bundles at order time.

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| name | String | |
| description | String? | |
| imageUrl | String? | Supabase Storage URL |
| totalPrice | Decimal(10,2) | May be less than sum of items (discount) |
| isAvailable | Boolean | |
| isFeatured | Boolean | |
| tags | String[] | |
| sortOrder | Int | |
| createdAt | DateTime | |
| updatedAt | DateTime | |
| deletedAt | DateTime? | Soft delete |

#### `package_items`
Items within a restaurant-defined combo package.

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| packageId | UUID (FK → packages) | |
| menuItemId | UUID (FK → menu_items) | |
| quantity | Int | Default: 1 |

#### `orders`
Central table. Every order regardless of type.

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| orderNumber | String (unique) | Format: `BWK-00001` |
| customerId | UUID (FK → users) | |
| branchId | UUID (FK → branches) | Always `main-branch` currently |
| deliveryAddressId | UUID? (FK → user_addresses) | NULL for pickup orders |
| riderId | UUID? (FK → users) | NULL until assigned by admin |
| orderType | OrderType | `delivery` or `pickup` |
| status | OrderStatus | See status flow below |
| subtotal | Decimal(10,2) | Sum of package prices |
| deliveryFee | Decimal(10,2) | 0 for pickup |
| discountAmount | Decimal(10,2) | From promo code |
| totalAmount | Decimal(10,2) | subtotal + deliveryFee - discountAmount |
| specialInstructions | String? | |
| estimatedDeliveryTime | DateTime? | Used for scheduled orders |
| actualDeliveryTime | DateTime? | Set when delivered |
| cancelledBy | String? | Plain string ID (not FK) — can be customer, rider, or admin UUID |
| cancellationReason | String? | |
| createdAt | DateTime | |
| updatedAt | DateTime | |

**Order status flow:**
```
pending → confirmed → preparing → ready
  → [delivery] picked_up → on_the_way → delivered
  → [pickup] delivered
Any status → cancelled
delivered → refunded
```

**Important:** `cancelledBy` is a plain `String?` field with **no foreign key constraint**. This was deliberately done because admin IDs come from `admin_users` table while customer/rider IDs come from `users` table — a single FK can't point to both.

#### `order_packages`
Every order contains one or more packages. All items must be in a package — there are no loose items on orders.

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| orderId | UUID (FK → orders) | |
| packageId | UUID? (FK → packages) | NULL if custom or edited combo |
| originalPackageId | String? | Remembers source combo if customer edited it |
| packageName | String | **Snapshot** at order time |
| totalPrice | Decimal(10,2) | **Snapshot** at order time |
| isCustom | Boolean | true = customer-built or customer-edited |
| wasEdited | Boolean | true = started as restaurant combo, customer modified it |

#### `order_package_items`
Individual items within an ordered package. Price snapshotted at order time.

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| orderPackageId | UUID (FK → order_packages) | |
| menuItemId | UUID (FK → menu_items) | |
| itemName | String | **Snapshot** |
| quantity | Int | |
| unitPrice | Decimal(10,2) | **Snapshot** |
| totalPrice | Decimal(10,2) | unitPrice × quantity |

#### `order_status_history`
Immutable audit log of every status transition.

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| orderId | UUID (FK → orders) | |
| status | String | |
| changedById | String? | Plain string — can be customer, rider, or admin UUID |
| changedByType | String? | `'customer'`, `'rider'`, `'admin'`, or `'system'` |
| note | String? | |
| createdAt | DateTime | |

**Important:** `changedById` has **no FK constraint** (same reasoning as `orders.cancelledBy`). The `changedByType` field was added later to distinguish which table `changedById` references.

#### `payments`
One payment record per order.

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| orderId | UUID (FK → orders, unique) | |
| userId | UUID (FK → users) | |
| amount | Decimal(10,2) | |
| currency | String | Default: `NGN` |
| paymentMethod | PaymentMethod | |
| paymentStatus | PaymentStatus | |
| provider | String? | e.g. `Paystack` |
| providerRef | String? (unique) | Paystack transaction reference |
| providerResponse | Json? | Full Paystack response payload |
| paidAt | DateTime? | |
| createdAt | DateTime | |

#### `wallets`
In-app wallet per customer. Currently **not wired into ordering flow** — built in schema but wallet top-up and wallet payment are deferred features.

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| userId | UUID (FK → users, unique) | One per user |
| balance | Decimal(10,2) | Default: 0 |
| currency | String | Default: NGN |
| updatedAt | DateTime | |

#### `wallet_transactions`
Wallet credit/debit history. Not yet in use.

#### `delivery_tracking`
Real-time rider location per active delivery.

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| orderId | UUID (FK → orders, unique) | |
| riderId | UUID (FK — no constraint) | |
| currentLatitude | Decimal(9,6)? | Updated by rider app |
| currentLongitude | Decimal(9,6)? | Updated by rider app |
| pickupTime | DateTime? | Set when rider marks picked_up |
| estimatedArrival | DateTime? | |
| lastUpdated | DateTime | @updatedAt |

#### `reviews`
Post-delivery ratings. One per order.

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| orderId | UUID (FK → orders, unique) | |
| customerId | UUID (FK → users) | |
| riderId | UUID? (FK → users) | NULL for pickup orders |
| foodRating | Decimal(2,1) | 1.0–5.0 |
| deliveryRating | Decimal(2,1)? | NULL for pickup orders |
| comment | String? | |
| isVisible | Boolean | Admin can hide |
| createdAt | DateTime | |

#### `promotions`
Promo codes. Codes are now **auto-generated** by the backend (see section 7).

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| code | String (unique) | Auto-generated: `BWKPCT4F2A1B`, `BWKFREEDEL9XQ2`, etc. |
| description | String? | |
| type | PromotionType | `percentage`, `fixed`, `free_delivery`, `bogo` |
| value | Decimal(10,2) | Percentage or NGN amount |
| minOrderAmount | Decimal(10,2) | Default: 0 |
| maxUses | Int? | NULL = unlimited |
| usesCount | Int | Incremented on each use |
| perUserLimit | Int | Default: 1 |
| validFrom | DateTime? | |
| validUntil | DateTime? | |
| isActive | Boolean | |
| createdAt | DateTime | |

#### `promo_usages`
Every promo redemption.

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| promoId | UUID (FK → promotions) | |
| userId | UUID (FK → users) | |
| orderId | UUID (FK → orders, unique) | One promo per order |
| discountApplied | Decimal(10,2) | Actual NGN saved |
| usedAt | DateTime | |

#### `notifications`
In-app alerts. Auto-created on order events.

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| userId | UUID (FK → users) | |
| title | String | |
| body | String | |
| type | NotificationType | |
| isRead | Boolean | Default: false |
| relatedOrderId | UUID? | |
| createdAt | DateTime | |

#### `saved_cards`
Paystack authorization tokens for saved cards. **Schema exists but not yet wired into payment flow.**

#### `admin_activity_logs`
Every significant admin action across the entire system.

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| adminId | String | Admin's UUID |
| adminName | String | **Snapshot** — survives if admin is deleted |
| action | String | `create`, `update`, `delete`, `toggle`, `login`, `update_status`, `assign_rider` |
| targetType | String | `MenuItem`, `Category`, `Package`, `Order`, `Promotion`, `Rider`, `Customer`, `Settings`, `Branch`, `Review`, `AdminUser` |
| targetId | String? | UUID of affected record |
| description | String | Human-readable e.g. "Created menu item 'Jollof Rice'" |
| createdAt | DateTime | |

Indexed on `adminId`, `targetType`, `createdAt` for query performance.

---

## 5. Backend API — Complete Reference

### Base URL
- Development: `http://localhost:3000`
- Production: Not yet deployed (recommended: Railway or Render)

### Authentication System

**Two completely separate JWT systems:**

**System 1 — Customer/Rider Auth**
- Login: phone + password
- Token contains: `{ id, role, phoneNumber }`
- Token expiry: 30 days
- Middleware: `authenticate` (verifies JWT, attaches `req.user`)
- Role guard: `authorize('customer')` or `authorize('rider')`

**System 2 — Admin Auth**
- Login: email + password
- Token contains: `{ id, email, isSuperAdmin, type: 'admin' }`
- Token expiry: 12 hours
- Middleware: `authenticateAdmin` (verifies JWT **and** checks `token.type === 'admin'`)
- Super admin guard: `requireSuperAdmin`

The `type: 'admin'` field in the JWT is critical — it prevents a customer token from ever accessing admin routes even if someone tries.

### All Routes

#### Customer/Rider Auth — `/api/auth`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | None | Register customer (phone + password) |
| POST | `/login` | None | Login customer or rider |
| GET | `/me` | ✓ | Get own profile + wallet + addresses |
| PATCH | `/profile` | ✓ | Update name or email |
| PATCH | `/change-password` | ✓ | Change own password |
| POST | `/logout` | ✓ | Logout (stateless — clears client-side) |

#### Menu (Public) — `/api/menu`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | None | Full menu — categories + items + featured |
| GET | `/categories` | None | Active categories |
| GET | `/items` | None | Available items (filters: `categoryId`, `featured`, `search`, `page`, `limit`) |
| GET | `/items/:id` | None | Single item |
| GET | `/packages` | None | Available packages (filter: `featured`) |
| GET | `/packages/:id` | None | Single package |
| GET | `/branch` | None | Branch info and hours |

#### Addresses — `/api/addresses`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | ✓ | All saved addresses |
| POST | `/` | ✓ | Add address |
| PATCH | `/:id` | ✓ | Update address |
| PATCH | `/:id/default` | ✓ | Set as default |
| DELETE | `/:id` | ✓ | Soft delete |
| POST | `/delivery-fee` | ✓ | Calculate delivery fee by GPS coords or addressId |

#### Orders — `/api/orders`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | ✓ Customer | Place order |
| GET | `/` | ✓ Customer | Order history (filters: `status`, `page`, `limit`) |
| GET | `/:id` | ✓ Customer | Single order full details |
| PATCH | `/:id/cancel` | ✓ Customer | Cancel (only if pending or confirmed) |

**Place order request body:**
```json
{
  "orderType": "delivery | pickup",
  "paymentMethod": "card | bank_transfer | ussd | cash_on_delivery",
  "packages": [
    {
      "name": "My Meal",
      "packageId": "optional-combo-id",
      "wasEdited": false,
      "items": [
        { "menuItemId": "uuid", "quantity": 1 }
      ]
    }
  ],
  "deliveryAddressId": "saved-address-uuid",
  "streetAddress": "or pass new address fields",
  "landmark": "...",
  "area": "...",
  "latitude": 9.278,
  "longitude": 7.372,
  "saveAddress": false,
  "addressLabel": "Home",
  "specialInstructions": "no pepper",
  "scheduledFor": "2026-12-25T14:00:00.000Z",
  "promoCode": "BWKPCT4F2A1B"
}
```

#### Payments — `/api/payments`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/webhook` | None (Paystack) | Paystack webhook — raw body required |
| GET | `/verify/:reference` | None (public) | Verify after Paystack redirect |
| POST | `/initialize` | ✓ Customer | Initialize Paystack payment |
| GET | `/order/:orderId` | ✓ Customer | Get payment status |

**Webhook security:** Uses HMAC SHA-512 signature verification with `PAYSTACK_SECRET_KEY`. Raw body is preserved by registering `express.raw()` **before** `express.json()` in `index.ts`.

#### Notifications — `/api/notifications`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | ✓ | All notifications (filter: `unread=true`) |
| GET | `/unread-count` | ✓ | Badge count only |
| PATCH | `/read-all` | ✓ | Mark all read |
| PATCH | `/:id/read` | ✓ | Mark one read |
| DELETE | `/` | ✓ | Delete all |
| DELETE | `/:id` | ✓ | Delete one |

#### Reviews — `/api/reviews`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | ✓ Customer | Submit review (order must be delivered) |
| GET | `/` | ✓ Customer | My reviews |
| GET | `/check/:orderId` | ✓ Customer | Check if already reviewed |

#### Promotions — `/api/promotions`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | ✓ | Active promos (customer-visible) |
| POST | `/validate` | ✓ | Validate a promo code before checkout |

#### Rider — `/api/rider`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/profile` | ✓ Rider | Rider profile |
| GET | `/stats` | ✓ Rider | Delivery statistics |
| GET | `/deliveries` | ✓ Rider | Assigned deliveries |
| GET | `/deliveries/:id` | ✓ Rider | Single delivery details |
| PATCH | `/deliveries/:id/status` | ✓ Rider | Update status (picked_up → on_the_way → delivered only) |
| PATCH | `/deliveries/:id/location` | ✓ Rider | Update GPS location |

**Rider status flow is strictly enforced:**
```
ready → picked_up → on_the_way → delivered
```
Skipping steps is rejected with a 400 error.

#### Upload — `/api/upload`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/menu-item/:id` | Admin | Upload menu item image |
| POST | `/category/:id` | Admin | Upload category image |
| POST | `/package/:id` | Admin | Upload package image |
| DELETE | `/menu-item/:id` | Admin | Delete menu item image |
| POST | `/profile-photo` | ✓ Customer/Rider | Upload profile photo |
| DELETE | `/profile-photo` | ✓ Customer/Rider | Delete profile photo |

Images go to Supabase Storage. Buckets: `menu-images` (public), `profile-photos` (public). Max file size: 5MB. Accepted types: JPEG, JPG, PNG, WebP.

#### Admin Auth — `/api/admin/auth`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/login` | None | Admin login |
| GET | `/me` | Admin | Admin profile |
| PATCH | `/change-password` | Admin | Change own password |
| POST | `/create` | Super Admin | Create new admin account |

#### Admin Menu — `/api/admin/menu`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/categories` | Admin | All categories including inactive |
| POST | `/categories` | Admin | Create |
| PATCH | `/categories/:id` | Admin | Update |
| PATCH | `/categories/:id/availability` | Admin | Toggle — **cascades both ways to items** |
| DELETE | `/categories/:id` | Admin | Delete (only if no items) |
| GET | `/items` | Admin | All items including unavailable |
| POST | `/items` | Admin | Create |
| PATCH | `/items/:id` | Admin | Update |
| PATCH | `/items/:id/availability` | Admin | Toggle |
| DELETE | `/items/:id` | Admin | Soft delete |
| GET | `/packages` | Admin | All packages |
| POST | `/packages` | Admin | Create |
| PATCH | `/packages/:id` | Admin | Update |
| PATCH | `/packages/:id/availability` | Admin | Toggle |
| DELETE | `/packages/:id` | Admin | Soft delete |

#### Admin Orders — `/api/admin/orders`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/stats` | Admin | Order counts + revenue totals |
| GET | `/` | Admin | All orders (filters: `status`, `orderType`, `search`, `page`) |
| GET | `/:id` | Admin | Full order details |
| PATCH | `/:id/status` | Admin | Update status |
| PATCH | `/:id/assign-rider` | Admin | Assign rider |
| PATCH | `/:id/cancel` | Admin | Cancel order |

#### Admin Users — `/api/admin/users`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/stats` | Admin | User counts |
| GET | `/customers` | Admin | All customers |
| GET | `/customers/:id` | Admin | Customer with address + order history |
| GET | `/riders` | Admin | All riders |
| GET | `/riders/:id` | Admin | Rider with delivery history |
| POST | `/riders` | Admin | Create rider account |
| PATCH | `/riders/:id` | Admin | Update rider |
| PATCH | `/:id/toggle-active` | Admin | Activate/deactivate |
| DELETE | `/:id` | Admin | Soft delete |

**Note:** Admin password reset for users was intentionally removed. Users manage their own passwords via `PATCH /api/auth/change-password`.

#### Admin Analytics — `/api/admin/analytics`
All endpoints accept `?period=today|week|month|3months|year` (default: month).

| Method | Path | Description |
|---|---|---|
| GET | `/overview` | Dashboard overview stats |
| GET | `/revenue` | Revenue grouped by date |
| GET | `/orders-over-time` | Order counts grouped by date |
| GET | `/top-items` | Top selling items by quantity |
| GET | `/peak-hours` | Orders by hour of day |
| GET | `/peak-days` | Orders by day of week |
| GET | `/customer-retention` | New vs returning customers |
| GET | `/rider-performance` | Per-rider delivery stats |
| GET | `/payment-methods` | Breakdown by payment type |
| GET | `/export/orders` | CSV download |
| GET | `/export/revenue` | CSV download |
| GET | `/export/top-items` | CSV download |

#### Admin Settings — `/api/admin/settings`
| Method | Path | Description |
|---|---|---|
| GET | `/branch/info` | Get branch |
| PATCH | `/branch/info` | Update branch |
| PATCH | `/branch/toggle-open` | Toggle restaurant open/closed |
| GET | `/` | All app settings |
| POST | `/` | Create new setting |
| PATCH | `/` | Update multiple settings at once |
| GET | `/:key` | Get one setting |
| PATCH | `/:key` | Update one setting |

#### Admin Reviews — `/api/admin/reviews`
| Method | Path | Description |
|---|---|---|
| GET | `/` | All reviews with averages (filters: `rating`, `visible`) |
| PATCH | `/:id/visibility` | Toggle visible/hidden |
| DELETE | `/:id` | Delete |

#### Admin Promotions — `/api/admin/promotions`
| Method | Path | Description |
|---|---|---|
| GET | `/` | All promos |
| GET | `/:id` | Single promo with usage history |
| POST | `/` | Create (code is **auto-generated**, not supplied) |
| PATCH | `/:id` | Update |
| PATCH | `/:id/toggle` | Toggle active/inactive |
| DELETE | `/:id` | Delete (deactivates if has usage history) |

#### Admin Activity Log — `/api/admin/activity-logs`
| Method | Path | Description |
|---|---|---|
| GET | `/` | All logs (filters: `adminId`, `targetType`, `action`, `startDate`, `endDate`) |
| GET | `/admins` | Distinct admins who have activity |

---

## 6. Admin Dashboard — Complete Reference

### Tech Notes

**TailwindCSS v4:** Uses CSS-first configuration. The `tailwind.config.js` approach from v3 does **not** work. Setup uses:

```css
/* src/index.css */
@import "tailwindcss";

@theme {
  --color-brand-50: #fff7ed;
  --color-brand-500: #f97316;
  --color-brand-600: #ea580c;
  --color-brand-700: #c2410c;
}
```

```javascript
// postcss.config.js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

**API Base URL:** Set in `admin/.env` as `VITE_API_URL=http://localhost:3000`. The Axios instance in `src/lib/api.ts` reads this and automatically attaches the JWT from `localStorage` to every request. On 401, it auto-redirects to `/login`.

### Page Inventory

| Page | Path | Key Features |
|---|---|---|
| Login | `/login` | Email/password, toast on error |
| Dashboard | `/dashboard` | Period filter, 7 stat cards, live from API |
| Orders | `/orders` | List with filters, detail modal, status progression, rider assignment, cancel with reason |
| Menu | `/menu` | 3 tabs: Categories (with toggle cascade), Items (with image upload), Packages (real-time price calc + image) |
| Riders | `/riders` | List, create, detail modal, toggle active |
| Customers | `/customers` | List, detail with addresses + orders, toggle active |
| Promotions | `/promotions` | Card grid, create (auto-generates code), usage history, toggle |
| Settings | `/settings` | Open/close toggle banner, branch form, app settings form |
| Analytics | `/analytics` | Period filter, line/bar/pie charts via Recharts, CSV exports |
| Reviews | `/reviews` | Star ratings, filter, hide/show toggle, delete |
| Activity Log | `/activity-log` | Timeline feed, filter by admin/type/action |

### Reusable Components

| Component | Props | Purpose |
|---|---|---|
| `LoadingButton` | `loading`, `variant` (primary/danger/secondary/ghost), standard button props | Button with spinner. `ghost` variant has no preset colors — use `className` for full control |
| `Modal` | `isOpen`, `onClose`, `title`, `maxWidth` | Overlay modal with scrollable content |
| `ConfirmDialog` | `isOpen`, `title`, `message`, `onConfirm`, `onCancel`, `confirmLabel`, `danger`, `loading` | Destructive action confirmation |
| `ReasonDialog` | `isOpen`, `title`, `onConfirm`, `onCancel`, `loading` | Cancel/reject with optional text reason |
| `StatusBadge` | `status` | Colored pill badge for order/payment statuses |
| `Toggle` | `checked`, `onChange` | Green/gray toggle switch |
| `Pagination` | `page`, `totalPages`, `onPageChange` | Prev/next page navigation |
| `StatCard` | `label`, `value`, `subtext`, `icon` (ReactNode) | Dashboard metric card |

### Navigation
Hamburger-triggered slide-in drawer. Opens on click, closes on overlay click or navigation. Nav items use Lucide React icons (not emoji).

---

## 7. Key Business Logic & Design Decisions

### Delivery Fee Calculation
Uses the **Haversine formula** to calculate straight-line distance between the branch GPS coordinates and the delivery address GPS coordinates. Fee = `distance_km × delivery_fee_per_km` (from `app_settings`), with a minimum of ₦500. Orders outside the delivery radius (currently 50km) are rejected with a 400 error.

Branch coordinates: `latitude: 9.278154, longitude: 7.372769`

### Order Pricing
```
subtotal = sum of all package prices
deliveryFee = calculated by Haversine (0 for pickup)
discountAmount = from promo code (if applied)
totalAmount = subtotal + deliveryFee - discountAmount
```

### Price Snapshotting
`order_package_items.itemName`, `unitPrice`, and `totalPrice` are always snapshots of values at order time. Menu prices can change later without affecting historical orders.

### Package System
All order items **must be in a package**. Three package types:
1. **Restaurant combo** (`isCustom: false, wasEdited: false`) — from `packages` table, uses combo price
2. **Customer custom bundle** (`isCustom: true, wasEdited: false`) — customer-built from scratch
3. **Edited combo** (`isCustom: true, wasEdited: true, originalPackageId: <id>`) — started as combo, customer modified it

### Category Availability Cascade
When admin toggles a category:
- **Deactivating** → sets all items in category to `isAvailable: false`
- **Activating** → sets all items in category to `isAvailable: true`

This is **bidirectional** cascade (it was originally only one-way and was changed).

### Promo Code Generation
Codes are auto-generated by the backend. Admin never types a code manually. Format: `BWK` + type tag + 6-char alphanumeric suffix.

| Type | Prefix | Example |
|---|---|---|
| percentage | `PCT` | `BWKPCT4F2A1B` |
| fixed | `FIX` | `BWKFIX9XQ2KM` |
| free_delivery | `FREEDEL` | `BWKFREEDEL3JZ8` |
| bogo | `BOGO` | `BWKBOGO7TQX2` |

Collision retry: up to 5 attempts before returning 500.

### Admin Activity Logging
`logActivity()` is a fire-and-forget helper — it catches its own errors so a logging failure never breaks the actual admin action. Every mutating admin action (create, update, delete, toggle, status change, rider assignment, login) calls this function.

### Wallet (Deferred)
The `wallets` and `wallet_transactions` tables exist and wallets are created at user registration (this was removed — wallets are NOT created at registration currently). Wallet payment method exists in the enum but no balance deduction logic is implemented. This is explicitly a future feature.

### Soft Deletes
`users`, `user_addresses`, `menu_items`, `packages` use `deletedAt DateTime?`. Records are never physically deleted — they're hidden from queries with `where: { deletedAt: null }`. This preserves order history integrity.

### FK Constraint Design (Critical)
Two fields are intentionally plain strings with **no FK constraints**:
- `orders.cancelledBy` — can be customer UUID (users table) or admin UUID (admin_users table)
- `order_status_history.changedById` — same reason, plus system/automated changes have `null`

The `changedByType` field (`'customer'`, `'rider'`, `'admin'`, `'system'`) tells you which table to look in.

---

## 8. Environment Setup

### Backend `.env`

```bash
# Session mode pooler — for Prisma migrations and runtime
DATABASE_URL="postgresql://postgres.gpufbfwahpjbdtyejvcz:[PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:5432/postgres?connect_timeout=30"

# Transaction mode pooler — alternative for high-concurrency
TRANSACTION_URL="postgresql://postgres.gpufbfwahpjbdtyejvcz:[PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres"

PORT=3000
JWT_SECRET="your-long-random-secret-here"
NODE_ENV="development"

# Paystack
PAYSTACK_SECRET_KEY="sk_test_xxxxxxxxxxxxxxxxxxxx"
PAYSTACK_PUBLIC_KEY="pk_test_xxxxxxxxxxxxxxxxxxxx"
PAYSTACK_CALLBACK_URL="http://localhost:3000/api/payments/verify"

# Supabase Storage
SUPABASE_URL="https://gpufbfwahpjbdtyejvcz.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..."
```

### Admin `.env`

```bash
VITE_API_URL=http://localhost:3000
```

### Running Both

```powershell
# Terminal 1 — backend
cd backend
npm run dev

# Terminal 2 — admin
cd admin
npm run dev
```

Backend runs on port 3000. Admin runs on port 5173 (Vite default).

### CORS Configuration

The backend allows these origins:

```typescript
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:8081'],
  credentials: true,
}))
```

`8081` is the default Expo Go port. `5173` is Vite's default for the admin.

### Supabase Storage Buckets

Two public buckets must exist in the Supabase project:
- `menu-images` — food photos, category images, package images
- `profile-photos` — customer and rider profile photos

Both must be set to **public** in the Supabase dashboard.

---

## 9. Known Issues & Technical Debt

### Migration History Drift
The Supabase database and Prisma's migration history got out of sync early in the project because some tables were created manually via SQL Editor (specifically `admin_users` during connectivity issues). As a result, `npx prisma migrate dev` throws a drift error. The current workaround is to use `npx prisma db push` for all schema changes. This is acceptable for development but before production, a proper baseline migration should be created.

**Recommended fix before production:**
```powershell
npx prisma migrate resolve --applied <migration_name>
# or
npx prisma migrate reset  # WARNING: wipes data — only in dev
```

### Supabase Free Tier Auto-Pause
The Supabase free tier pauses the database after 1 week of inactivity. When paused, all database connections fail with `P1001`. Fix: go to [supabase.com](https://supabase.com) and click "Resume project". This will keep happening until Supabase Pro is purchased ($25/month).

### SSL Disabled
SSL was disabled on the Supabase project dashboard during development to avoid connection issues. Before going to production, SSL should be re-enabled and `ssl: { rejectUnauthorized: false }` added to the PrismaPg adapter config.

### TypeScript Strict Mode Disabled
`tsconfig.json` has `"strict": false` because Prisma 7 generates types that TypeScript 6 considers incompatible in strict mode. This is a known Prisma 7 issue. The code is functionally correct — the strict mode warnings are false positives from Prisma's type generation.

### `rootDir` in tsconfig
`rootDir` is set to `"./"` (project root) rather than `"./src"` because `prisma/seed.ts` is outside `src/` but included in compilation. This causes compiled output to go to `dist/src/` instead of `dist/` directly. Not an issue for development (`ts-node-dev` doesn't compile to disk) but needs attention before building for production deployment.

### Wallet Feature Deferred
`PaymentMethod.wallet` exists in the enum and `wallets`/`wallet_transactions` tables exist in the schema, but no wallet top-up or wallet payment logic is implemented. If a customer selects `paymentMethod: "wallet"` in an order, the order will be created but payment will never be confirmed since there's no wallet deduction logic. Frontend should not offer wallet as a payment option until this is implemented.

### OTP Phone Verification
`users.isVerified` exists but no OTP flow is implemented. Currently it defaults to `false` and is never set to `true` (except manually in the seed for test accounts). Orders can be placed without verification. This is a security gap that should be addressed before launch.

### Admin Can't Directly Reset User Passwords
This was intentionally removed — users must change their own passwords via `PATCH /api/auth/change-password`. For support cases where a user is locked out and can't remember their password, there is currently no self-service password reset (forgot password via SMS/email) and no admin override. This needs to be built as a future feature.

---

## 10. What Has Been Built vs What Remains

### ✅ Fully Complete

**Mobile App**
- Integrated Expo FCM V1 credentials for native Android push notifications.
- Implemented smart background/foreground badge auto-clearing.
- Configured public lock-screen visibility and custom brand-colored status bar icons.
- Built intelligent deep-linking (`useLastNotificationResponse`) to route users directly to the specific "Active" or "Past" order card based on the notification status.

**Backend:**
- Full PostgreSQL schema (21 tables)
- Customer/rider authentication (phone + password, JWT)
- Admin authentication (email + password, separate JWT system)
- Public menu API (categories, items, packages, branch info)
- Admin menu management (full CRUD + availability toggling)
- Address management with GPS-based delivery fee calculation
- Order placement (delivery/pickup, packages, scheduling, promo codes)
- Order management (customer and admin)
- Paystack payment integration (initialize, verify, webhook)
- Rider delivery management (status flow, GPS tracking)
- Notifications (auto-created on order events)
- Reviews (post-delivery ratings)
- Promotions (auto-generated codes, validation, application at checkout)
- Admin user management (customers and riders)
- Admin analytics (9 analytics endpoints + 3 CSV exports)
- Admin settings management (app settings + branch)
- Admin activity logging (all mutating actions logged)
- Image uploads to Supabase Storage
- Configured native push notification payloads with `priority: 'high'` and `channelId: 'default'` for forced banner display.
- Implemented intelligent notification preference enforcement (e.g., checking `notifyOrderUpdates` before triggering alerts).

**Admin Dashboard:**
- Login with JWT auth and auto-logout
- Dashboard overview with period filtering
- Orders page (list, detail modal, status progression, rider assignment, cancellation)
- Menu management (categories, items, packages with real-time pricing)
- Riders page (create, view, toggle active)
- Customers page (view, toggle active)
- Promotions page (create with auto-code, view usage, toggle)
- Settings page (branch info, app settings, restaurant open/close)
- Analytics page (Recharts charts, CSV downloads)
- Reviews page (moderation, ratings display)
- Activity Log page (timeline, filterable)
- Toast notifications (replaced all `alert()`/`confirm()`)
- Loading button states (spinner on all async actions)
- Hamburger navigation (slide-in drawer)
- Lucide React icons (replaced all emoji)
- Horizontal scroll on tables for responsive layouts
- Alphabetical sorting on menu, customers, riders

### ⏳ Not Yet Built / In Progress

**Mobile App (React Native — Frontend Team's Responsibility):**
- All customer-facing UI screens
- Integration with backend APIs
- Rider delivery screens

**Backend — Deferred Features:**
- Wallet top-up and wallet payment flow
- Phone OTP verification (Termii integration)
- Forgot password / self-service password reset
- Rider self-service password change UI (backend route exists: `PATCH /api/auth/change-password`)

**Deployment:**
- Backend not yet deployed (recommended: Railway)
- Admin dashboard not yet deployed (recommended: Vercel)
- Production environment variables not configured
- SSL re-enablement before production

---

## 11. Important Files Reference

### Backend Key Files

**`backend/src/index.ts`** — Express app entry point. Critical ordering: `express.raw()` for webhook must be registered **before** `express.json()` otherwise Paystack signature verification breaks.

**`backend/src/lib/delivery.ts`** — Haversine formula. `calculateDistance(lat1, lon1, lat2, lon2)` returns km. `calculateDeliveryFee(distanceKm, feePerKm, minFee=500)` returns NGN amount.

**`backend/src/lib/activityLog.ts`** — `logActivity(params)` is fire-and-forget. Never throws. Always wrap in the action handler, not in a try/catch.

**`backend/src/lib/promoCode.ts`** — `generatePromoCode(type)` returns strings like `BWKPCT4F2A1B`. Called by `createPromo` controller with retry logic (max 5 attempts on collision).

**`backend/src/controllers/order.controller.ts`** — Most complex controller. Handles delivery address resolution, GPS delivery fee calculation, package pricing, promo validation, and the full `$transaction` for order creation.

**`backend/prisma/seed.ts`** — Safe to re-run (`upsert` and `skipDuplicates` throughout). Run with `npx ts-node prisma/seed.ts`. Creates: app settings, main branch, 8 categories, super admin, test rider, test customer.

### Admin Key Files

**`admin/src/lib/api.ts`** — Axios instance. JWT auto-attached from `localStorage`. Auto-redirects to `/login` on 401.

**`admin/src/lib/toast.ts`** — `showSuccess(msg)`, `showError(msg)`, `getErrorMessage(err)`. All pages use these instead of `alert()`.

**`admin/src/components/LoadingButton.tsx`** — Use `variant="ghost"` when you need custom button colors (e.g. red deactivate, green activate). The `ghost` variant applies no preset colors so `className` fully controls styling.

**`admin/src/context/AuthContext.tsx`** — `useAuth()` hook gives `{ admin, login, logout, loading }`. `ProtectedRoute` in `App.tsx` uses `admin` state to gate routes.

---

## Appendix — Seeded Test Credentials

| Account | Email/Phone | Password | Role |
|---|---|---|---|
| Super Admin | admin@bwarikitchen.com | admin123 | Admin |
| Test Rider | 08011111111 | rider123 | Rider |
| Test Customer | 08022222222 | customer123 | Customer |

**Change the admin password before production deployment.**

---

## Appendix — Supabase Project Details

- **Project ID:** `gpufbfwahpjbdtyejvcz`
- **Region:** EU West (Ireland) — closest to Nigeria
- **Pooler host:** `aws-0-eu-west-1.pooler.supabase.com`
- **Session mode port (migrations):** `5432`
- **Transaction mode port (runtime):** `6543`
- **Direct host (currently unreachable — project may need to be unpaused):** `db.gpufbfwahpjbdtyejvcz.supabase.co:5432`

---

*End of context document. This document covers everything built in the original project chat session.*
