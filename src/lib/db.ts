import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

declare global {
  var prismaGlobal: undefined | PrismaClient;
  var pgPool: undefined | Pool;
}

const connectionString = process.env.DATABASE_URL;

if (!globalThis.pgPool && connectionString) {
  globalThis.pgPool = new Pool({ connectionString });
}

const prismaClientSingleton = () => {
  if (!globalThis.pgPool) return new PrismaClient();
  const adapter = new PrismaPg(globalThis.pgPool);
  return new PrismaClient({ adapter });
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export const db = prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;
