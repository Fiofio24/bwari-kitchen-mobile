// backend/src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import dotenv from 'dotenv'

dotenv.config()

// Prevent multiple instances of Prisma Client in development (Hot-Reload Shield)
declare global {
  var prisma: PrismaClient | undefined
}

let prisma: PrismaClient

if (process.env.NODE_ENV === 'production') {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
    ssl: { rejectUnauthorized: false },
  } as any)
  prisma = new PrismaClient({ adapter })
} else {
  if (!global.prisma) {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL!,
      ssl: { rejectUnauthorized: false },
    } as any)
    global.prisma = new PrismaClient({ adapter })
  }
  prisma = global.prisma
}

export default prisma