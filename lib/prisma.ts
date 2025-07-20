import { PrismaClient } from '@prisma/client'

declare global {
  var __prisma: PrismaClient | undefined
}

// Prevent multiple instances of Prisma Client in serverless environments
export const prisma =
  globalThis.__prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

// Ensure proper cleanup in serverless environments
if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma
} else {
  // In production, ensure connections are managed properly
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}
