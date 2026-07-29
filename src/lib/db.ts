import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Ensure the connection URL has a low connection limit to prevent EMAXCONNSESSION
const dbUrl = process.env.DATABASE_URL || '';
let finalUrl = dbUrl;
try {
  if (dbUrl) {
    const parsedUrl = new URL(dbUrl);
    if (!parsedUrl.searchParams.has('connection_limit')) {
      parsedUrl.searchParams.set('connection_limit', '1');
    }
    if (!parsedUrl.searchParams.has('pool_timeout')) {
      parsedUrl.searchParams.set('pool_timeout', '10');
    }
    finalUrl = parsedUrl.toString();
  }
} catch (err) {
  // Ignore invalid URLs (e.g., during build time without env vars)
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: finalUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
