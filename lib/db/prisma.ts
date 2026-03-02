import { PrismaClient } from '@prisma/client';

// Simple singleton pattern with datasourceUrl
let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  // In production (Vercel), create a new client with explicit datasourceUrl
  prisma = new PrismaClient({
    // @ts-ignore - Prisma 7 datasourceUrl option
    datasourceUrl: process.env.DATABASE_URL,
    log: ['error'],
  });
} else {
  // In development, use global to avoid creating multiple clients
  const globalWithPrisma = global as typeof globalThis & {
    prisma: PrismaClient;
  };
  
  if (!globalWithPrisma.prisma) {
    globalWithPrisma.prisma = new PrismaClient({
      // @ts-ignore - Prisma 7 datasourceUrl option
      datasourceUrl: process.env.DATABASE_URL,
      log: ['query', 'error', 'warn'],
    });
  }
  
  prisma = globalWithPrisma.prisma;
}

export { prisma };
