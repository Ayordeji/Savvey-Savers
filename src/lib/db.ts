import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

declare global {
  var prismaGlobal: undefined | PrismaClient;
  var pgPool: undefined | Pool;
}

const connectionString = process.env.DATABASE_URL;

if (!globalThis.pgPool && connectionString) {
  globalThis.pgPool = new Pool({
    connectionString,
    // CRITICAL for Vercel serverless: each Lambda must use at most 1-2 connections.
    // Without this, concurrent invocations exhaust Supabase's free-tier pool (max 15).
    max: 2,
    idleTimeoutMillis: 10_000,   // release idle connections quickly
    connectionTimeoutMillis: 5_000,
  });
}

const prismaClientSingleton = () => {
  if (!globalThis.pgPool) throw new Error('DATABASE_URL is not set');
  const adapter = new PrismaPg(globalThis.pgPool);
  return new PrismaClient({ adapter });
};

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export const db = prisma;

// In development, re-use the singleton across hot reloads.
// In production (Vercel), globalThis is per-Lambda so this is a no-op.
if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;
