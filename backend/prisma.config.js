const { defineConfig } = require('prisma/config')
require('dotenv').config()

module.exports = defineConfig({
  earlyAccess: true,
  schema: './prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrate: {
    seed: 'ts-node prisma/seed.ts',
    adapter: async () => {
      const { PrismaPg } = await import('@prisma/adapter-pg')
      return new PrismaPg({
        connectionString: process.env.DATABASE_URL,
        connectionTimeoutMillis: 30000,   // ← 30 seconds instead of default 5
        idleTimeoutMillis: 30000,
      })
    },
  },
})