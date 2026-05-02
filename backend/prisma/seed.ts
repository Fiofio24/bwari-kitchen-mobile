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
    { key: 'min_order_amount', value: '2000' },
    { key: 'delivery_fee_per_km', value: '150' },
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
      address: 'Your address here',
      landmark: 'Your landmark here',
      area: 'Bwari',
      openingTime: '08:00',
      closingTime: '21:00',
      acceptsPickup: true,
      acceptsDelivery: true,
      isOpen: true,
    },
  })

  console.log('✅ Branch seeded')

  // ─────────────────────────────────────────
  // CATEGORIES
  // ─────────────────────────────────────────

  // Delete all existing categories first
  await prisma.category.deleteMany({})

  // Create fresh categories
  await prisma.category.createMany({
    data: [
      { name: 'Dishes', sortOrder: 1 },
      { name: 'Soups', sortOrder: 2 },
      { name: 'Swallows', sortOrder: 3 },
      { name: 'Protein', sortOrder: 4 },
      { name: 'Add-ons', sortOrder: 5 },
      { name: 'Drinks', sortOrder: 6 },
      { name: 'Organic Drinks', sortOrder: 7 },
      { name: 'Snacks', sortOrder: 8 },
    ],
  })

  console.log('✅ Categories seeded')

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
      passwordHash: customerPasswordHash,
      role: 'customer',
      isVerified: true,
      isActive: true,
    }
  })

  console.log('✅ Test customer created — phone: 08022222222, password: customer123')

  console.log('\n🍽️  Bwari Kitchen seed complete')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())