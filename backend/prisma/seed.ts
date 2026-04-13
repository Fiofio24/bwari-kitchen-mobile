import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import * as dotenv from 'dotenv'

dotenv.config()

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  // App settings
  await prisma.appSetting.createMany({
    data: [
      { key: 'restaurant_name', value: 'Bwari Kitchen' },
      { key: 'support_phone', value: '+2348000000000' },
      { key: 'min_order_amount', value: '2000' },
      { key: 'delivery_fee_per_km', value: '150' },
      { key: 'opening_time', value: '08:00' },
      { key: 'closing_time', value: '22:00' },
    ],
  })

  // Main branch
  await prisma.branch.create({
    data: {
      name: 'Bwari Main Branch',
      address: 'Your address here',
      landmark: 'Your landmark here',
      area: 'Bwari',
      openingTime: '08:00',
      closingTime: '22:00',
    },
  })

  // Categories
  await prisma.category.createMany({
    data: [
      { name: 'Rice Dishes', sortOrder: 1 },
      { name: 'Dishes', sortOrder: 2 },
      { name: 'Swallows & Soups', sortOrder: 3 },
      { name: 'Grills & Suya', sortOrder: 4 },
      { name: 'Snacks', sortOrder: 5 },
      { name: 'Small Chops', sortOrder: 6 },
      { name: 'Drinks', sortOrder: 7 },
    ],
  })

  console.log('✅ Seed complete')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())