import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Global singleton
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

// Create Prisma client with pg adapter for Neon serverless
function createPrismaClient(): PrismaClient {
  // Create connection pool for Neon
  const pool = globalForPrisma.pool ?? new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1, // Serverless: use minimal connections
  });

  // Always cache pool to reuse connections across serverless invocations
  globalForPrisma.pool = pool;

  // Create Prisma adapter
  const adapter = new PrismaPg(pool);

  // Create Prisma client with adapter
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

// Export singleton
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Always cache Prisma client to reuse across serverless invocations
globalForPrisma.prisma = prisma;
