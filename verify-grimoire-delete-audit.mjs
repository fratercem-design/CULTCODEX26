#!/usr/bin/env node

/**
 * Verify audit log entries for grimoire deletion
 */

import('file://' + process.cwd() + '/node_modules/@prisma/client/index.js').then(async ({ PrismaClient }) => {
  const prisma = new PrismaClient();
  
  console.log('🔍 Verifying Grimoire Deletion Audit Logs\n');

  try {
    // Get recent delete audit logs for GrimoireEntry
    const deleteLogs = await prisma.auditLog.findMany({
      where: {
        resourceType: 'GrimoireEntry',
        actionType: 'delete',
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

    console.log(`Found ${deleteLogs.length} delete audit log entries:\n`);

    deleteLogs.forEach((log, index) => {
      console.log(`${index + 1}. Audit Log Entry:`);
      console.log(`   ID: ${log.id}`);
      console.log(`   Admin: ${log.admin.email}`);
      console.log(`   Action: ${log.actionType}`);
      console.log(`   Resource Type: ${log.resourceType}`);
      console.log(`   Resource ID: ${log.resourceId}`);
      console.log(`   Metadata:`, JSON.stringify(log.metadata, null, 2));
      console.log(`   Created At: ${log.createdAt}`);
      console.log('');
    });

    if (deleteLogs.length > 0) {
      console.log('✅ Audit logs are being created correctly for deletions\n');
      
      // Verify metadata structure
      const latestLog = deleteLogs[0];
      if (latestLog.metadata && 
          typeof latestLog.metadata === 'object' &&
          'title' in latestLog.metadata &&
          'slug' in latestLog.metadata) {
        console.log('✅ Audit log metadata contains required fields (title, slug)\n');
      } else {
        console.log('⚠️  Audit log metadata structure may be incomplete\n');
      }
    } else {
      console.log('⚠️  No delete audit logs found\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}).catch(err => {
  console.error('Failed to load Prisma:', err);
  process.exit(1);
});
