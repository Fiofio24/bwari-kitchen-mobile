-- AlterTable
ALTER TABLE "app_settings" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "delivery_tracking" ALTER COLUMN "lastUpdated" DROP DEFAULT;
