-- DropForeignKey
ALTER TABLE "order_status_history" DROP CONSTRAINT "order_status_history_changedById_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_cancelledBy_fkey";

-- AlterTable
ALTER TABLE "order_status_history" ADD COLUMN     "changedByType" TEXT;

-- CreateTable
CREATE TABLE "menu_item_variants" (
    "id" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "menu_item_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_activity_logs" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "adminName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_activity_logs_adminId_idx" ON "admin_activity_logs"("adminId");

-- CreateIndex
CREATE INDEX "admin_activity_logs_targetType_idx" ON "admin_activity_logs"("targetType");

-- CreateIndex
CREATE INDEX "admin_activity_logs_createdAt_idx" ON "admin_activity_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "menu_item_variants" ADD CONSTRAINT "menu_item_variants_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
