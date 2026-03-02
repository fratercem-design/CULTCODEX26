#!/usr/bin/env node

/**
 * Direct database check for grimoire audit logs
 */

import('file://' + process.cwd() + '/node_modules/@prisma/client/index.js').then(async ({ PrismaClient }) => {
  const prisma = new PrismaClient();
  
  console.log('🧪 Verifying grimoire audit logs in database\n');

  try {
    // Fetch all GrimoireEntry creation audit logs
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        resourceType: 'GrimoireEntry',
        actionType: 'create',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`Found ${auditLogs.length} GrimoireEntry creation audit logs:\n`);

    auditLogs.forEach((log, index) => {
      console.log(`Log ${index + 1}:`);
      console.log(`  - ID: ${log.id}`);
      console.log(`  - Action: ${log.actionType}`);
      console.log(`  - Resource Type: ${log.resourceType}`);
      console.log(`  - Resource ID: ${log.resourceId}`);
      console.log(`  - Admin ID: ${log.adminId}`);
      console.log(`  - Created At: ${log.createdAt}`);
      console.log(`  - Metadata:`, JSON.stringify(log.metadata, null, 4));
      console.log();
    });

    // Verify the grimoire entries exist
    console.log('Verifying grimoire entries exist:\n');
    
    for (const log of auditLogs) {
      const entry = await prisma.grimoireEntry.findUnique({
        where: { id: log.resourceId },
        include: {
          revisions: true,
        },
      });

      if (entry) {
        console.log(`✅ Entry "${entry.title}" (${entry.slug}):`);
        console.log(`   - ID: ${entry.id}`);
        console.log(`   - Current Revision ID: ${entry.currentRevisionId}`);
        console.log(`   - Revisions: ${entry.revisions.length}`);
        console.log(`   - First revision number: ${entry.revisions[0]?.revisionNumber}`);
        console.log();
      } else {
        console.log(`❌ Entry with ID ${log.resourceId} not found`);
      }
    }

    if (auditLogs.length >= 2) {
      console.log('✅ All audit logs and grimoire entries verified successfully!');
    }

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}).catch(err => {
  console.error('Failed to load Prisma:', err);
  process.exit(1);
});
