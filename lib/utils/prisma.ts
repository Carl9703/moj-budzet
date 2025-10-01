import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

// Wybierz bazę na podstawie brancha Vercel
function getDatabaseUrl() {
  const branch = process.env.VERCEL_GIT_COMMIT_REF || 'main'
  
  if (branch === 'main') {
    return process.env.DATABASE_URL_MAIN || process.env.DATABASE_URL
  } else if (branch === 'test-version') {
    return process.env.DATABASE_URL_TEST || process.env.DATABASE_URL
  } else {
    return process.env.DATABASE_URL_DEV || process.env.DATABASE_URL
  }
}

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        log: ['query'],
        datasources: {
            db: {
                url: getDatabaseUrl()
            }
        }
    })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma