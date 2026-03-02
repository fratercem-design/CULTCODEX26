import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Get DATABASE_URL - required for Prisma 7
const connectionString = process.env.DATABASE_URL || '';

// Create connection pool
const pool = new Pool({ connectionString });

// Create Prisma adapter
const adapter = new PrismaPg(pool);

// Create Prisma client with adapter (required for Prisma 7)
export const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
