import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import * as dotenv from 'dotenv'
import bcrypt from 'bcryptjs'

dotenv.config()

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  // ─────────────────────────────────────────
  // APP SETTINGS
  // ─────────────────────────────────────────
  const settings = [
    { key: 'restaurant_name', value: 'Bwari Kitchen' },
    { key: 'support_phone', value: '+2348000000000' },
    { key: 'min_order_amount', value: '1000' },
    { key: 'delivery_fee_per_km', value: '100' },
    { key: 'opening_time', value: '08:00' },
    { key: 'closing_time', value: '21:00' },
  ]

  for (const setting of settings) {
    await prisma.appSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    })
  }

  console.log('✅ App settings seeded')

  // ─────────────────────────────────────────
  // MAIN BRANCH
  // ─────────────────────────────────────────
  await prisma.branch.upsert({
    where: { id: 'main-branch' },
    update: {},
    create: {
      id: 'main-branch',
      name: 'Bwari Main Branch',
      address: 'No 1 Kitchen Avenue',
      landmark: 'Near Bwari Market',
      area: 'Bwari',
      latitude: 9.2833,
      longitude: 7.3833,
      openingTime: '08:00',
      closingTime: '21:00',
      acceptsPickup: true,
      acceptsDelivery: true,
      deliveryRadiusKm: 25,
      isOpen: true,
    },
  })

  console.log('✅ Branch seeded')

  // ─────────────────────────────────────────
  // CATEGORIES
  // ─────────────────────────────────────────
  await prisma.category.deleteMany({})

  const categoryData = [
    { name: 'Rice', sortOrder: 1 },
    { name: 'Soups', sortOrder: 2 },
    { name: 'Swallows', sortOrder: 3 },
    { name: 'Protein', sortOrder: 4 },
    { name: 'Sides', sortOrder: 5 },
    { name: 'Drinks', sortOrder: 6 },
    { name: 'Snacks', sortOrder: 7 },
  ]

  await prisma.category.createMany({ data: categoryData })
  const categories = await prisma.category.findMany()
  const catId = (name: string) => categories.find(c => c.name === name)!.id

  console.log('✅ Categories seeded')

  // ─────────────────────────────────────────
  // MENU ITEMS (with a couple having variants)
  // ─────────────────────────────────────────
  await prisma.menuItem.deleteMany({})

  const jollof = await prisma.menuItem.create({
    data: {
      categoryId: catId('Rice'),
      branchId: 'main-branch',
      name: 'Party Jollof Rice',
      description: 'Smoky party-style jollof rice, Bwari Kitchen signature recipe.',
      basePrice: 2000,
      isFeatured: true,
      sortOrder: 1,
      variants: {
        create: [
          { label: 'Full Portion', price: 2000, sortOrder: 1 },
          { label: 'Half Portion', price: 1200, sortOrder: 2 },
          { label: '2 Scoops', price: 1500, sortOrder: 3 },
        ]
      }
    }
  })

  const friedRice = await prisma.menuItem.create({
    data: {
      categoryId: catId('Rice'),
      branchId: 'main-branch',
      name: 'Fried Rice',
      basePrice: 2000,
      isFeatured: false,
      sortOrder: 2,
    }
  })

  const egusi = await prisma.menuItem.create({
    data: {
      categoryId: catId('Soups'),
      branchId: 'main-branch',
      name: 'Egusi Soup',
      basePrice: 2000,
      isFeatured: true,
      sortOrder: 1,
      variants: {
        create: [
          { label: 'Full Plate', price: 2500, sortOrder: 1 },
          { label: 'Half Plate', price: 1400, sortOrder: 2 },
        ]
      }
    }
  })

  const eba = await prisma.menuItem.create({
    data: {
      categoryId: catId('Swallows'),
      branchId: 'main-branch',
      name: 'Eba',
      basePrice: 500,
      sortOrder: 1,
    }
  })

  const poundedYam = await prisma.menuItem.create({
    data: {
      categoryId: catId('Swallows'),
      branchId: 'main-branch',
      name: 'Pounded Yam',
      basePrice: 700,
      sortOrder: 2,
    }
  })

  const chicken = await prisma.menuItem.create({
    data: {
      categoryId: catId('Protein'),
      branchId: 'main-branch',
      name: 'Grilled Chicken',
      basePrice: 3500,
      isFeatured: true,
      sortOrder: 1,
    }
  })

  const beef = await prisma.menuItem.create({
    data: {
      categoryId: catId('Protein'),
      branchId: 'main-branch',
      name: 'Beef',
      basePrice: 1000,
      sortOrder: 2,
    }
  })

  const plantain = await prisma.menuItem.create({
    data: {
      categoryId: catId('Sides'),
      branchId: 'main-branch',
      name: 'Fried Plantain',
      basePrice: 500,
      sortOrder: 1,
    }
  })

  await prisma.menuItem.create({
    data: {
      categoryId: catId('Drinks'),
      branchId: 'main-branch',
      name: 'Bottled Water',
      basePrice: 200,
      sortOrder: 1,
    }
  })

  await prisma.menuItem.create({
    data: {
      categoryId: catId('Drinks'),
      branchId: 'main-branch',
      name: 'Zobo',
      basePrice: 1000,
      sortOrder: 2,
    }
  })

  await prisma.menuItem.create({
    data: {
      categoryId: catId('Snacks'),
      branchId: 'main-branch',
      name: 'Meat Pie',
      basePrice: 1500,
      sortOrder: 1,
    }
  })

  console.log('✅ Menu items seeded (with variants on Jollof Rice and Egusi Soup)')

  // ─────────────────────────────────────────
  // PACKAGES
  // ─────────────────────────────────────────
  await prisma.package.deleteMany({})

  await prisma.package.create({
    data: {
      name: 'Jollof & Chicken Combo',
      description: 'Party jollof rice with grilled chicken and fried plantain.',
      totalPrice: 5500,
      isFeatured: true,
      sortOrder: 1,
      items: {
        create: [
          { menuItemId: jollof.id, quantity: 1 },
          { menuItemId: chicken.id, quantity: 1 },
          { menuItemId: plantain.id, quantity: 1 },
        ]
      }
    }
  })

  await prisma.package.create({
    data: {
      name: 'Swallow & Soup Combo',
      description: 'Pounded yam with egusi soup and beef.',
      totalPrice: 4200,
      isFeatured: true,
      sortOrder: 2,
      items: {
        create: [
          { menuItemId: poundedYam.id, quantity: 1 },
          { menuItemId: egusi.id, quantity: 1 },
          { menuItemId: beef.id, quantity: 1 },
        ]
      }
    }
  })

  await prisma.package.create({
    data: {
      name: 'Eba & Egusi Combo',
      description: 'Eba with egusi soup and beef.',
      totalPrice: 3600,
      isFeatured: false,
      sortOrder: 3,
      items: {
        create: [
          { menuItemId: eba.id, quantity: 1 },
          { menuItemId: egusi.id, quantity: 1 },
          { menuItemId: beef.id, quantity: 1 },
        ]
      }
    }
  })

  console.log('✅ Packages seeded')

  // ─────────────────────────────────────────
  // TEST PROMO CODE
  // ─────────────────────────────────────────
  await prisma.promotion.upsert({
    where: { code: 'TESTFOOD20' },
    update: {},
    create: {
      code: 'TESTFOOD20',
      description: 'Test promo — 20% off, min order ₦2,000',
      type: 'percentage',
      value: 20,
      minOrderAmount: 2000,
      perUserLimit: 5,
      isActive: true,
    }
  })

  console.log('✅ Test promo code seeded — TESTFOOD20 (20% off, min ₦2,000)')

  // ─────────────────────────────────────────
  // SUPER ADMIN
  // ─────────────────────────────────────────
  const adminPasswordHash = await bcrypt.hash('admin123', 12)

  await prisma.adminUser.upsert({
    where: { email: 'admin@bwarikitchen.com' },
    update: {},
    create: {
      fullName: 'Bwari Kitchen Admin',
      email: 'admin@bwarikitchen.com',
      passwordHash: adminPasswordHash,
      isSuperAdmin: true,
    }
  })

  console.log('✅ Super admin created — email: admin@bwarikitchen.com, password: admin123')

  // ─────────────────────────────────────────
  // RIDER ACCOUNT (for testing)
  // ─────────────────────────────────────────
  const riderPasswordHash = await bcrypt.hash('rider123', 12)

  await prisma.user.upsert({
    where: { phoneNumber: '08011111111' },
    update: {},
    create: {
      fullName: 'Test Rider',
      phoneNumber: '08011111111',
      passwordHash: riderPasswordHash,
      role: 'rider',
      isVerified: true,
      isActive: true,
    }
  })

  console.log('✅ Test rider created — phone: 08011111111, password: rider123')

  // ─────────────────────────────────────────
  // TEST CUSTOMER (for testing)
  // ─────────────────────────────────────────
  const customerPasswordHash = await bcrypt.hash('customer123', 12)

  await prisma.user.upsert({
    where: { phoneNumber: '08022222222' },
    update: {},
    create: {
      fullName: 'Test Customer',
      phoneNumber: '08022222222',
      email: 'testcustomer@bwarikitchen.com',
      passwordHash: customerPasswordHash,
      role: 'customer',
      isVerified: true,
      isActive: true,
    }
  })

  console.log('✅ Test customer created — phone: 08022222222 / email: testcustomer@bwarikitchen.com, password: customer123')

  console.log('\n🍽️  Bwari Kitchen seed complete')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())