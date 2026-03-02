import { PrismaClient } from '@prisma/client';

// Global singleton for Prisma Accelerate
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create Prisma client for Accelerate
// Accelerate handles connection pooling automatically
function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

// Export singleton
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
