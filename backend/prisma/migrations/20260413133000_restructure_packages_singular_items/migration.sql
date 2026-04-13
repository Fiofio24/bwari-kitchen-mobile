/*
  Warnings:

  - You are about to drop the column `isSpicy` on the `menu_items` table. All the data in the column will be lost.
  - You are about to drop the column `isVegetarian` on the `menu_items` table. All the data in the column will be lost.
  - You are about to drop the `order_item_choices` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `order_items` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "order_item_choices" DROP CONSTRAINT "order_item_choices_optionChoiceId_fkey";

-- DropForeignKey
ALTER TABLE "order_item_choices" DROP CONSTRAINT "order_item_choices_orderItemId_fkey";

-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_menuItemId_fkey";

-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_orderId_fkey";

-- AlterTable
ALTER TABLE "menu_items" DROP COLUMN "isSpicy",
DROP COLUMN "isVegetarian";

-- DropTable
DROP TABLE "order_item_choices";

-- DropTable
DROP TABLE "order_items";

-- CreateTable
CREATE TABLE "packages" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "totalPrice" DECIMAL(10,2) NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[],
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_items" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "package_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_packages" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "packageId" TEXT,
    "originalPackageId" TEXT,
    "packageName" TEXT NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "wasEdited" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "order_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_package_items" (
    "id" TEXT NOT NULL,
    "orderPackageId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "order_package_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_package_item_choices" (
    "id" TEXT NOT NULL,
    "orderPackageItemId" TEXT NOT NULL,
    "optionChoiceId" TEXT NOT NULL,
    "choiceName" TEXT NOT NULL,
    "additionalPrice" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "order_package_item_choices_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "package_items" ADD CONSTRAINT "package_items_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_items" ADD CONSTRAINT "package_items_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_packages" ADD CONSTRAINT "order_packages_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_packages" ADD CONSTRAINT "order_packages_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_package_items" ADD CONSTRAINT "order_package_items_orderPackageId_fkey" FOREIGN KEY ("orderPackageId") REFERENCES "order_packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_package_items" ADD CONSTRAINT "order_package_items_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_package_item_choices" ADD CONSTRAINT "order_package_item_choices_orderPackageItemId_fkey" FOREIGN KEY ("orderPackageItemId") REFERENCES "order_package_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_package_item_choices" ADD CONSTRAINT "order_package_item_choices_optionChoiceId_fkey" FOREIGN KEY ("optionChoiceId") REFERENCES "menu_item_option_choices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
