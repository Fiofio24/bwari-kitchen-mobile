/*
  Warnings:

  - You are about to drop the `menu_item_option_choices` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `menu_item_options` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `order_package_item_choices` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "menu_item_option_choices" DROP CONSTRAINT "menu_item_option_choices_optionId_fkey";

-- DropForeignKey
ALTER TABLE "menu_item_options" DROP CONSTRAINT "menu_item_options_menuItemId_fkey";

-- DropForeignKey
ALTER TABLE "order_package_item_choices" DROP CONSTRAINT "order_package_item_choices_optionChoiceId_fkey";

-- DropForeignKey
ALTER TABLE "order_package_item_choices" DROP CONSTRAINT "order_package_item_choices_orderPackageItemId_fkey";

-- DropTable
DROP TABLE "menu_item_option_choices";

-- DropTable
DROP TABLE "menu_item_options";

-- DropTable
DROP TABLE "order_package_item_choices";
