import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Singleton pattern with pg adapter for Prisma 7
let prisma: PrismaClient;
let pool: Pool;

if (process.env.NODE_ENV === 'production') {
  // In production (Vercel), create client with pg adapter
  const connectionString = process.env.DATABASE_URL;
  
  if (connectionString) {
    pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    
    prisma = new PrismaClient({
      adapter,
      log: ['error'],
    });
  } else {
    // Fallback for build time
    prisma = new PrismaClient({ log: ['error'] });
  }
} else {
  // In development, use global to avoid creating multiple clients
  const globalWithPrisma = global as typeof globalThis & {
    prisma: PrismaClient;
    pool: Pool;
  };
  
  if (!globalWithPrisma.prisma) {
    const connectionString = process.env.DATABASE_URL;
    
    if (connectionString) {
      globalWithPrisma.pool = new Pool({ connectionString });
      const adapter = new PrismaPg(globalWithPrisma.pool);
      
      globalWithPrisma.prisma = new PrismaClient({
        adapter,
        log: ['query', 'error', 'warn'],
      });
    } else {
      globalWithPrisma.prisma = new PrismaClient({
        log: ['query', 'error', 'warn'],
      });
    }
  }
  
  prisma = globalWithPrisma.prisma;
  pool = globalWithPrisma.pool;
}

export { prisma };
