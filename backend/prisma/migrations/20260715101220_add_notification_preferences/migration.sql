-- AlterTable
ALTER TABLE "users" ADD COLUMN     "notifyDeliveryAlerts" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyEmail" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyNewMenu" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyOrderUpdates" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyPromotions" BOOLEAN NOT NULL DEFAULT false;
