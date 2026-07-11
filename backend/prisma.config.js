const { defineConfig } = require('prisma/config')
require('dotenv').config()

module.exports = defineConfig({
  earlyAccess: true,
  schema: './prisma/schema.prisma',
  datasource: {
    url: process.env.DIRECT_URL,
  },
  migrate: {
    seed: 'ts-node prisma/seed.ts',
    adapter: async () => {
      const { PrismaPg } = await import('@prisma/adapter-pg')
      return new PrismaPg({
        connectionString: process.env.DIRECT_URL,
        connectionTimeoutMillis: 30000,
        idleTimeoutMillis: 30000,
        ssl: { rejectUnauthorized: false },
      })
    },
  },
})