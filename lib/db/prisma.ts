import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Lazy initialization - create client on first access
// Prisma 7 reads DATABASE_URL from prisma.config.ts automatically
function getPrismaClient() {
  if (!globalForPrisma.prisma) {
    console.log('[Prisma Init] Creating Prisma client...');
    console.log('[Prisma Init] DATABASE_URL exists:', !!process.env.DATABASE_URL);
    console.log('[Prisma Init] DATABASE_URL length:', process.env.DATABASE_URL?.length || 0);
    
    globalForPrisma.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
    
    console.log('[Prisma Init] Prisma client created');
  }
  
  return globalForPrisma.prisma;
}

// Export a proxy that lazily initializes the client
export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop) {
    const client = getPrismaClient();
    const value = (client as any)[prop];
    
    // Bind methods to the client instance
    if (typeof value === 'function') {
      return value.bind(client);
    }
    
    return value;
  },
});
