#!/usr/bin/env node

/**
 * Verify audit log entries for admin.user.view action
 */

import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function main() {
  console.log('Checking audit log for admin.user.view entries...\n');

  const auditLogs = await prisma.auditLog.findMany({
    where: {
      actionType: 'admin.user.view',
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 5,
    include: {
      admin: {
        select: {
          email: true,
        },
      },
    },
  });

  if (auditLogs.length === 0) {
    console.log('❌ No audit log entries found for admin.user.view');
    process.exit(1);
  }

  console.log(`✅ Found ${auditLogs.length} audit log entries:\n`);

  auditLogs.forEach((log, index) => {
    console.log(`${index + 1}. Action: ${log.actionType}`);
    console.log(`   Admin: ${log.admin.email}`);
    console.log(`   Resource: ${log.resourceType} (${log.resourceId})`);
    console.log(`   Timestamp: ${log.createdAt}`);
    console.log(`   Metadata: ${JSON.stringify(log.metadata, null, 2)}`);
    console.log('');
  });

  console.log('✅ Audit logging is working correctly!');
}

main()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
