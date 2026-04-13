# Bwari Kitchen — Backend Documentation

**Version:** 1.0.0
**Last Updated:** April 2026
**Author:** Austine Victor
**Stack:** Node.js · TypeScript · Express · Prisma ORM · PostgreSQL (Supabase)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Repository Structure](#3-repository-structure)
4. [Environment Setup](#4-environment-setup)
5. [Database Overview](#5-database-overview)
6. [Database Schema — Full Reference](#6-database-schema--full-reference)
7. [Key Business Logic](#7-key-business-logic)
8. [Order Flow](#8-order-flow)
9. [Package System](#9-package-system)
10. [Prisma & Migration Reference](#10-prisma--migration-reference)
11. [API Entry Point](#11-api-entry-point)
12. [Important Notes for the Frontend Team](#12-important-notes-for-the-frontend-team)

---

## 1. Project Overview

Bwari Kitchen is a food ordering mobile application built with React Native and Expo Go, serving customers within Abuja, Nigeria. This document covers the backend architecture, database design, and setup instructions for developers joining the project.

The backend is a RESTful API built with Node.js and TypeScript, backed by a PostgreSQL database hosted on Supabase. It is designed as a **single-restaurant system** — all data, orders, menus, and configurations belong exclusively to Bwari Kitchen.

---

## 2. Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Runtime | Node.js | Server-side JavaScript execution |
| Language | TypeScript | Type safety across the codebase |
| Framework | Express.js | HTTP routing and middleware |
| ORM | Prisma 7 | Database access, migrations, and type generation |
| Database | PostgreSQL | Relational data storage |
| Hosting | Supabase | Managed PostgreSQL with dashboard, auth, and storage |
| Authentication | JWT + bcryptjs | Token-based auth with hashed passwords |
| Validation | Zod | Request schema validation |
| Payments | Paystack | Nigerian payment gateway (card, USSD, bank transfer) |
| Push Notifications | Expo Push API | Order status alerts to customer devices |

---

## 3. Repository Structure

The project is a **monorepo** — the backend lives inside the same repository as the React Native frontend, in a dedicated `/backend` folder. The two are completely independent and do not share dependencies.

```
bwari-kitchen-mobile/              ← root repository
├── app/                           ← React Native frontend (Expo)
├── assets/                        ← Frontend assets
├── package.json                   ← Frontend dependencies (Expo/RN)
├── app.json                       ← Expo configuration
│
└── backend/                       ← Backend (Node.js/Express/Prisma)
    ├── prisma/
    │   ├── schema.prisma          ← Full database schema
    │   ├── seed.ts                ← Initial seed data
    │   └── migrations/            ← Auto-generated migration history
    ├── src/
    │   ├── index.ts               ← Express app entry point
    │   └── lib/
    │       └── prisma.ts          ← Prisma client singleton
    ├── prisma.config.js           ← Prisma 7 configuration
    ├── package.json               ← Backend-only dependencies
    ├── tsconfig.json              ← TypeScript configuration
    └── .env                       ← Environment variables (gitignored)
```

---

## 4. Environment Setup

### Prerequisites

- Node.js v18 or higher
- npm v9 or higher
- Access to the Supabase project (request an invite from the project owner)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd bwari-kitchen-mobile/backend

# Install dependencies
npm install

# Copy the environment template and fill in your values
cp .env.example .env
```

### Environment Variables

```bash
# .env

# Session mode pooler — used for Prisma migrations
DATABASE_URL="postgresql://postgres.xxxx:[PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:5432/postgres"

# Transaction mode pooler — used for runtime queries
TRANSACTION_URL="postgresql://postgres.xxxx:[PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres"

PORT=3000
JWT_SECRET="your-long-random-secret"
NODE_ENV="development"
```

> Contact the backend engineer for the actual Supabase credentials. Never commit `.env` to version control.

### Running the Development Server

```bash
cd backend
npm run dev
```

The API will be available at `http://localhost:3000`. Verify with the health check endpoint:

```
GET http://localhost:3000/health
```

Expected response:

```json
{
  "status": "ok",
  "app": "Bwari Kitchen API",
  "timestamp": "2026-..."
}
```

---

## 5. Database Overview

The database is a **PostgreSQL** instance hosted on Supabase. It is managed entirely through **Prisma ORM** — the schema is defined in `prisma/schema.prisma`, and all structural changes are made via Prisma migrations.

The database contains **20 tables** organised across the following domains:

| Domain | Tables |
|---|---|
| Configuration | `app_settings` |
| Locations | `branches` |
| Users | `users`, `user_addresses` |
| Menu | `categories`, `menu_items`, `menu_item_options`, `menu_item_option_choices` |
| Packages | `packages`, `package_items` |
| Orders | `orders`, `order_packages`, `order_package_items`, `order_package_item_choices`, `order_status_history` |
| Payments | `payments`, `wallets`, `wallet_transactions` |
| Delivery | `delivery_tracking` |
| Feedback | `reviews` |
| Promotions | `promotions`, `promo_usages` |
| Notifications | `notifications` |

### Entity Relationship Overview

```
app_settings          (standalone configuration)

branches
    └──> menu_items
              └──> categories
              └──> menu_item_options
                        └──> menu_item_option_choices

users
    └──> user_addresses
    └──> wallets ──> wallet_transactions

orders
    └──> order_packages
              └──> order_package_items
                        └──> order_package_item_choices
    └──> payments
    └──> delivery_tracking
    └──> reviews
    └──> order_status_history
    └──> promo_usages ──> promotions

packages
    └──> package_items ──> menu_items
```

---

## 6. Database Schema — Full Reference

### `app_settings`

Stores Bwari Kitchen's global configuration as key-value pairs. Allows business settings to be updated without code changes.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `key` | String (unique) | Setting identifier e.g. `restaurant_name`, `delivery_fee_per_km` |
| `value` | String | Setting value e.g. `Bwari Kitchen`, `150` |
| `description` | String? | Optional note explaining the setting |
| `updatedAt` | Timestamp | Auto-updated on change |

**Seeded values:**

| Key | Value |
|---|---|
| `restaurant_name` | Bwari Kitchen |
| `support_phone` | +2348000000000 |
| `min_order_amount` | 2000 |
| `delivery_fee_per_km` | 150 |
| `opening_time` | 08:00 |
| `closing_time` | 22:00 |

---

### `branches`

Represents Bwari Kitchen's physical location(s). The schema supports multiple branches to allow future expansion without migration.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `name` | String | Branch name e.g. "Bwari Main Branch" |
| `address` | String | Full street address |
| `landmark` | String? | Nearby landmark — critical for Nigerian addressing |
| `area` | String? | District e.g. "Bwari", "Kubwa" |
| `latitude` | Decimal? | GPS latitude |
| `longitude` | Decimal? | GPS longitude |
| `phoneNumber` | String? | Branch contact number |
| `openingTime` | String? | Opening time e.g. "08:00" |
| `closingTime` | String? | Closing time e.g. "22:00" |
| `isOpen` | Boolean | Admin-controlled toggle for accepting orders |
| `acceptsPickup` | Boolean | Whether pickup orders are accepted |
| `acceptsDelivery` | Boolean | Whether delivery orders are accepted |
| `deliveryRadiusKm` | Decimal? | Maximum delivery distance in kilometres |
| `createdAt` | Timestamp | Record creation time |
| `updatedAt` | Timestamp | Last modification time |

---

### `users`

All app users — customers, admins, and riders — are stored in a single table, differentiated by the `role` field.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `fullName` | String | User's full name |
| `email` | String? | Optional — phone is the primary identifier in Nigeria |
| `phoneNumber` | String (unique) | Primary contact and login identifier |
| `passwordHash` | String? | Bcrypt-hashed password |
| `role` | Enum | `customer`, `admin`, or `rider` |
| `profilePhotoUrl` | String? | URL to profile photo |
| `isVerified` | Boolean | Whether phone number has been OTP-verified |
| `isActive` | Boolean | Account active state — used mainly for rider suspension |
| `deviceToken` | String? | Expo push notification token for order alerts |
| `createdAt` | Timestamp | Registration time |
| `updatedAt` | Timestamp | Last modification time |
| `deletedAt` | Timestamp? | Soft delete timestamp — null means active |

---

### `user_addresses`

Saved delivery addresses for customers. Separated from `users` because a single customer may have multiple saved addresses.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `userId` | UUID (FK) | Owning user |
| `label` | String? | Friendly label e.g. "Home", "Office" |
| `streetAddress` | String | Full street address |
| `landmark` | String? | Nearby landmark for the rider |
| `area` | String? | Area or district |
| `city` | String | Defaults to "Abuja" |
| `latitude` | Decimal? | GPS latitude |
| `longitude` | Decimal? | GPS longitude |
| `isDefault` | Boolean | Whether this is the default delivery address |
| `createdAt` | Timestamp | When the address was saved |
| `deletedAt` | Timestamp? | Soft delete |

---

### `categories`

Groups menu items into browsable sections e.g. Rice Dishes, Soups & Stews, Swallows, Grills & Suya, Small Chops, Drinks.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `name` | String | Category name |
| `description` | String? | Optional description |
| `imageUrl` | String? | Category image or icon |
| `sortOrder` | Int | Display order — lower values appear first |
| `isActive` | Boolean | Visibility toggle — see Category Availability Logic below |
| `createdAt` | Timestamp | Creation time |
| `updatedAt` | Timestamp | Last modification time |

---

### `menu_items`

Individual food and drink items available for ordering. Each item is standalone — customers combine items into packages.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `branchId` | UUID? (FK) | If set, item is exclusive to that branch. NULL = available at all branches |
| `categoryId` | UUID (FK) | Parent category |
| `name` | String | Item name e.g. "Egusi Soup", "Eba", "Jollof Rice" |
| `description` | String? | Item description |
| `basePrice` | Decimal | Base price in NGN |
| `discountPrice` | Decimal? | Sale price when discounted |
| `imageUrl` | String? | Food photo URL |
| `isAvailable` | Boolean | Individual availability toggle |
| `isFeatured` | Boolean | Appears in featured/special section if true |
| `preparationTime` | Int? | Estimated prep time in minutes |
| `tags` | String[] | Labels e.g. `["bestseller", "new"]` |
| `sortOrder` | Int | Display order within category |
| `createdAt` | Timestamp | Creation time |
| `updatedAt` | Timestamp | Last modification time |
| `deletedAt` | Timestamp? | Soft delete — preserves order history integrity |

---

### `menu_item_options`

Defines a customisation group for a menu item e.g. "Choose Protein", "Extra Wraps", "Add-ons". One item can have multiple option groups.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `menuItemId` | UUID (FK) | Parent menu item |
| `name` | String | Option group label |
| `isRequired` | Boolean | Whether customer must make a selection |
| `minSelections` | Int | Minimum number of choices required |
| `maxSelections` | Int | Maximum number of choices allowed |
| `sortOrder` | Int | Display order |

---

### `menu_item_option_choices`

Individual choices within an option group e.g. "Beef +₦500", "Extra Wrap +₦300", "Coke +₦300".

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `optionId` | UUID (FK) | Parent option group |
| `name` | String | Choice label |
| `additionalPrice` | Decimal | Extra cost added to the item base price |
| `isAvailable` | Boolean | Whether this choice is currently available |
| `sortOrder` | Int | Display order |

---

### `packages`

Restaurant-created combo deals e.g. "Family Pack", "Lunch Deal". Combos can carry a total price lower than the sum of their items, effectively providing a discount.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `name` | String | Package name |
| `description` | String? | Description of the combo |
| `imageUrl` | String? | Package image |
| `totalPrice` | Decimal | Combo price — may be less than the sum of items |
| `isAvailable` | Boolean | Visibility toggle |
| `isFeatured` | Boolean | Featured placement toggle |
| `tags` | String[] | Labels e.g. `["popular", "value"]` |
| `sortOrder` | Int | Display order |
| `createdAt` | Timestamp | Creation time |
| `updatedAt` | Timestamp | Last modification time |
| `deletedAt` | Timestamp? | Soft delete |

---

### `package_items`

The menu items that make up a restaurant-defined combo package.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `packageId` | UUID (FK) | Parent package |
| `menuItemId` | UUID (FK) | Included menu item |
| `quantity` | Int | How many of this item are included |

---

### `orders`

The central table of the system. Every order placed by a customer is recorded here from creation through to delivery or cancellation.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `orderNumber` | String (unique) | Human-readable ID e.g. "BWK-00481" |
| `customerId` | UUID (FK) | Customer who placed the order |
| `branchId` | UUID (FK) | Fulfilling branch |
| `deliveryAddressId` | UUID? (FK) | Delivery destination — NULL for pickup orders |
| `riderId` | UUID? (FK) | Assigned rider — NULL until assigned |
| `orderType` | Enum | `delivery` or `pickup` |
| `status` | Enum | Current status — see Order Flow section |
| `subtotal` | Decimal | Item costs before fees and discounts |
| `deliveryFee` | Decimal | Delivery charge — 0 for pickup |
| `discountAmount` | Decimal | Amount deducted by promo code |
| `totalAmount` | Decimal | Final charge: subtotal + deliveryFee - discountAmount |
| `specialInstructions` | String? | Kitchen notes from the customer |
| `estimatedDeliveryTime` | Timestamp? | Expected delivery time |
| `actualDeliveryTime` | Timestamp? | Actual delivery time — used for performance tracking |
| `cancelledBy` | UUID? (FK) | Who cancelled — customer, admin, or rider |
| `cancellationReason` | String? | Cancellation reason |
| `createdAt` | Timestamp | Order placement time |
| `updatedAt` | Timestamp | Last update time |

---

### `order_packages`

Every order contains one or more packages. This table records each package within an order, whether it is a restaurant combo or a customer-built bundle.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `orderId` | UUID (FK) | Parent order |
| `packageId` | UUID? (FK) | Source combo — NULL if custom or edited |
| `originalPackageId` | String? | ID of the original combo if the customer edited it |
| `packageName` | String | Snapshot of package name at order time |
| `totalPrice` | Decimal | Snapshot of package price at order time |
| `isCustom` | Boolean | `true` if customer built or modified the package |
| `wasEdited` | Boolean | `true` if this started as a restaurant combo but was modified |

---

### `order_package_items`

The individual menu items within each ordered package, with price snapshots captured at order time.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `orderPackageId` | UUID (FK) | Parent order package |
| `menuItemId` | UUID (FK) | Ordered menu item |
| `itemName` | String | **Snapshot** of item name at order time |
| `quantity` | Int | Quantity ordered |
| `unitPrice` | Decimal | **Snapshot** of unit price at order time |
| `totalPrice` | Decimal | unitPrice × quantity |

> Price and name snapshots are critical. They ensure order history remains accurate even if menu prices or names change after the order was placed.

---

### `order_package_item_choices`

The customisation choices made for each item within a package e.g. "Beef +₦500", "Extra Wrap +₦300".

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `orderPackageItemId` | UUID (FK) | Parent order package item |
| `optionChoiceId` | UUID (FK) | Selected option choice |
| `choiceName` | String | **Snapshot** of choice name at order time |
| `additionalPrice` | Decimal | **Snapshot** of additional price at order time |

---

### `order_status_history`

An immutable log of every status transition an order goes through. Used for dispute resolution, performance analysis, and customer support.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `orderId` | UUID (FK) | Parent order |
| `status` | String | The status that was set |
| `changedById` | UUID? (FK) | Who triggered the change — NULL for system-automated transitions |
| `note` | String? | Optional explanation |
| `createdAt` | Timestamp | Exact time of the status change |

---

### `payments`

Payment transaction records linked to orders. Stores the full Paystack response payload for debugging and dispute resolution.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `orderId` | UUID (FK, unique) | One payment per order |
| `userId` | UUID (FK) | Paying customer |
| `amount` | Decimal | Amount in NGN |
| `currency` | String | Always "NGN" |
| `paymentMethod` | Enum | `card`, `bank_transfer`, `ussd`, `cash_on_delivery`, `wallet` |
| `paymentStatus` | Enum | `pending`, `processing`, `successful`, `failed`, `refunded` |
| `provider` | String? | Payment provider name e.g. "Paystack" |
| `providerRef` | String? (unique) | Paystack transaction reference |
| `providerResponse` | JSON? | Full raw response from Paystack |
| `paidAt` | Timestamp? | Confirmed payment time |
| `createdAt` | Timestamp | Record creation time |

---

### `wallets`

Each customer has one in-app wallet, used for refunds, loyalty credits, and direct payment.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `userId` | UUID (FK, unique) | One wallet per user |
| `balance` | Decimal | Current balance in NGN |
| `currency` | String | Always "NGN" |
| `updatedAt` | Timestamp | Last balance update |

---

### `wallet_transactions`

Full transaction history for every wallet — credits (refunds, top-ups) and debits (payments).

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `walletId` | UUID (FK) | Parent wallet |
| `type` | Enum | `credit` or `debit` |
| `amount` | Decimal | Transaction amount in NGN |
| `description` | String? | Human-readable note e.g. "Refund for BWK-00481" |
| `reference` | String (unique) | Unique transaction reference |
| `relatedOrderId` | UUID? | Linked order if applicable |
| `createdAt` | Timestamp | Transaction time |

---

### `delivery_tracking`

Real-time location and timing data for active deliveries. One record per order, updated continuously as the rider moves.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `orderId` | UUID (FK, unique) | One tracking record per order |
| `riderId` | UUID (FK) | Assigned rider |
| `currentLatitude` | Decimal? | Rider's current GPS latitude |
| `currentLongitude` | Decimal? | Rider's current GPS longitude |
| `pickupTime` | Timestamp? | When rider picked up from the kitchen |
| `estimatedArrival` | Timestamp? | ETA at delivery address |
| `lastUpdated` | Timestamp | Last location update — used to detect stale data |

---

### `reviews`

Post-delivery customer feedback covering both food quality and delivery experience.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `orderId` | UUID (FK, unique) | One review per order |
| `customerId` | UUID (FK) | Reviewing customer |
| `riderId` | UUID? (FK) | Reviewed rider — NULL for pickup orders |
| `foodRating` | Decimal | Food quality score: 1.0 to 5.0 |
| `deliveryRating` | Decimal? | Delivery experience score — NULL for pickup orders |
| `comment` | String? | Written feedback |
| `isVisible` | Boolean | Admin can hide reviews without deleting them |
| `createdAt` | Timestamp | Submission time |

---

### `promotions`

Discount codes and campaigns created by Bwari Kitchen — supports percentage discounts, fixed amounts, free delivery, and buy-one-get-one.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `code` | String (unique) | Promo code e.g. "BWARI20" |
| `description` | String? | Promo description |
| `type` | Enum | `percentage`, `fixed`, `free_delivery`, `bogo` |
| `value` | Decimal | Discount value — percentage or NGN amount |
| `minOrderAmount` | Decimal | Minimum order value to qualify |
| `maxUses` | Int? | Total redemption cap — NULL means unlimited |
| `usesCount` | Int | Current redemption count |
| `perUserLimit` | Int | Maximum uses per individual customer |
| `validFrom` | Timestamp? | Promo start date |
| `validUntil` | Timestamp? | Promo expiry date |
| `isActive` | Boolean | Master on/off switch |
| `createdAt` | Timestamp | Creation time |

---

### `promo_usages`

Records every successful promo code redemption, linking the promotion to the user and order.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `promoId` | UUID (FK) | Used promotion |
| `userId` | UUID (FK) | Redeeming customer |
| `orderId` | UUID (FK, unique) | Order it was applied to |
| `discountApplied` | Decimal | Actual NGN discount applied |
| `usedAt` | Timestamp | Redemption time |

---

### `notifications`

In-app notifications sent to users for order updates, promotions, and system messages.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `userId` | UUID (FK) | Recipient |
| `title` | String | Notification heading |
| `body` | String | Full message |
| `type` | Enum | `order_update`, `promotion`, `system`, `review_request` |
| `isRead` | Boolean | Read state — used for unread badge counts |
| `relatedOrderId` | UUID? | Linked order if applicable |
| `createdAt` | Timestamp | Sent time |

---

## 7. Key Business Logic

### Category & Item Availability

Menu item visibility to customers is governed by **two independent flags** — the category's `isActive` and the item's own `isAvailable`.

| Category `isActive` | Item `isAvailable` | Visible to customer? |
|---|---|---|
| ✅ true | ✅ true | ✅ Yes |
| ✅ true | ❌ false | ❌ No |
| ❌ false | ✅ true | ❌ No |
| ❌ false | ❌ false | ❌ No |

**When a category is deactivated**, the backend automatically sets all items under it to `isAvailable: false` in the same database transaction.

**When a category is reactivated**, only the category flag is turned on — individual items are not automatically re-enabled. This is intentional, as some items may have been independently disabled for their own reasons (e.g. out of stock).

The frontend menu query must always filter by both flags:

```
GET /api/menu?categoryActive=true&itemAvailable=true
```

### Price Snapshotting

Order-related tables (`order_package_items`, `order_package_item_choices`) always store a **snapshot** of the item name and price at the moment the order is placed. This means historical orders remain accurate even if menu prices or item names are updated later.

### Soft Deletes

Menu items, packages, and user accounts use **soft deletes** via a `deletedAt` timestamp field. Records are never physically removed from the database — they are simply hidden from queries. This preserves referential integrity in order history.

---

## 8. Order Flow

Every order progresses through the following status lifecycle:

```
pending
   └──> confirmed
             └──> preparing
                      └──> ready
                               └──> picked_up        (delivery orders)
                                        └──> on_the_way
                                                 └──> delivered
                      └──> ready
                               └──> [customer collects]  (pickup orders)

Any status ──> cancelled
delivered  ──> refunded  (if applicable)
```

Every status transition is logged in `order_status_history` with a timestamp and the actor who triggered it.

---

## 9. Package System

All menu items must be placed inside a package before an order can be submitted. There is no concept of a "loose" item order.

There are three types of packages:

### Restaurant Combo
Created and managed by the admin. Has a fixed price that may be lower than the sum of its items. Stored in the `packages` table.

```
isCustom: false | wasEdited: false | packageId: <combo id>
```

### Customer Custom Bundle
Built freely by the customer from individual menu items. Not linked to any restaurant combo.

```
isCustom: true | wasEdited: false | packageId: NULL
```

### Edited Combo
Starts as a restaurant combo but is modified by the customer before checkout. Automatically detaches from the original combo and is treated as a custom bundle. The `originalPackageId` field retains a reference to the source combo for analytics.

```
isCustom: true | wasEdited: true | packageId: NULL | originalPackageId: <original combo id>
```

---

## 10. Prisma & Migration Reference

All database changes must be made through Prisma migrations. Never modify the database directly through the Supabase dashboard.

| Task | Command |
|---|---|
| Apply schema changes and create migration | `npx prisma migrate dev --name <description>` |
| Apply migrations in production | `npx prisma migrate deploy` |
| Regenerate Prisma Client after schema changes | `npx prisma generate` |
| Open visual database browser | `npx prisma studio` |
| Run seed data | `npx ts-node prisma/seed.ts` |
| Reset database (development only) | `npx prisma migrate reset` |

> Always run `npx prisma generate` after any schema change before running the application.

---

## 11. API Entry Point

The Express server is initialised in `src/index.ts`. All API routes are prefixed with `/api`.

```
GET  /health              → Server health check
GET  /api/menu            → Fetch available menu items (coming soon)
POST /api/auth/register   → Customer registration (coming soon)
POST /api/auth/login      → Customer login (coming soon)
POST /api/orders          → Place an order (coming soon)
```

Routes are being built incrementally. The menu and auth routes are the immediate priority.

---

## 12. Important Notes for the Frontend Team

### API Base URL

| Environment | URL |
|---|---|
| Local (emulator/simulator) | `http://localhost:3000` |
| Local (physical device via Expo Go) | `http://<engineer-local-IP>:3000` |
| Production (coming soon) | `https://bwari-kitchen-api.railway.app` |

### Authentication

The API uses **JWT bearer tokens**. After login, include the token in all authenticated requests:

```
Authorization: Bearer <token>
```

### Currency

All monetary values are in **Nigerian Naira (NGN)** and are returned as decimal numbers. Display formatting (e.g. "₦2,500.00") is handled on the frontend.

### Timestamps

All timestamps are returned in **ISO 8601 UTC format**. Convert to local time (WAT, UTC+1) on the frontend.

### Pagination

List endpoints will support cursor-based pagination. Expect responses in this shape:

```json
{
  "data": [...],
  "meta": {
    "nextCursor": "...",
    "hasMore": true
  }
}
```

### Image URLs

Food and category images are stored in Supabase Storage. URLs are absolute and can be used directly in `Image` components.

---

*For questions or clarifications, contact the backend engineer directly.*
