import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Lazy initialization - create client on first access
function getPrismaClient() {
  if (!globalForPrisma.prisma) {
    const databaseUrl = process.env.DATABASE_URL || '';
    
    console.log('[Prisma Init] Creating Prisma client...');
    console.log('[Prisma Init] DATABASE_URL exists:', !!process.env.DATABASE_URL);
    console.log('[Prisma Init] DATABASE_URL length:', databaseUrl.length);
    console.log('[Prisma Init] DATABASE_URL prefix:', databaseUrl.substring(0, 30));
    
    globalForPrisma.prisma = new PrismaClient({
      datasourceUrl: databaseUrl,
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
