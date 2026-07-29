import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

declare global {
  var prismaGlobal: undefined | PrismaClient;
  var pgPool: undefined | Pool;
}

const connectionString = process.env.DATABASE_URL;

// CRITICAL for Vercel serverless + Supabase free tier:
// - max: 1 ensures each Lambda uses only 1 connection
// - Without this, concurrent Lambdas exhaust Supabase's 15-connection limit
// - idleTimeoutMillis releases connections quickly between requests
if (!globalThis.pgPool && connectionString) {
  globalThis.pgPool = new Pool({
    connectionString,
    max: 1,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 8_000,
  });
}

const prismaClientSingleton = () => {
  if (!globalThis.pgPool) {
    // Last-resort fallback — should not normally happen if DATABASE_URL is set
    console.error('pgPool not initialised — DATABASE_URL may be missing');
    return new PrismaClient();
  }
  const adapter = new PrismaPg(globalThis.pgPool);
  return new PrismaClient({ adapter });
};

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export const db = prisma;

// In development, reuse the singleton across hot reloads.
// In production (Vercel), globalThis is per-Lambda so this only runs once anyway.
if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;
