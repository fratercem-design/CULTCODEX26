import { PrismaClient } from '@prisma/client';

// Test what constructor options are available
try {
  const prisma = new PrismaClient({
    accelerateUrl: 'test',
  });
  console.log('accelerateUrl is supported');
} catch (error) {
  console.log('Error with accelerateUrl:', error.message);
}

// Check if we can pass it differently
console.log('\nPrismaClient constructor signature:');
console.log(PrismaClient.toString());
