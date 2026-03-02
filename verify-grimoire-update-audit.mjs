#!/usr/bin/env node

/**
 * Verification script to check audit log entries for grimoire updates
 */

import('file://' + process.cwd() + '/node_modules/@prisma/client/index.js').then(async ({ PrismaClient }) => {
  const prisma = new PrismaClient();

  console.log('🔍 Verifying Grimoire Update Audit Logs\n');

  try {
    // Get the most recent grimoire entry
    const recentEntry = await prisma.grimoireEntry.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        revisions: {
          orderBy: { revisionNumber: 'asc' },
        },
      },
    });

    if (!recentEntry) {
      console.log('❌ No grimoire entries found');
      return;
    }

    console.log(`📖 Most Recent Entry: ${recentEntry.title}`);
    console.log(`   - ID: ${recentEntry.id}`);
    console.log(`   - Slug: ${recentEntry.slug}`);
    console.log(`   - Total Revisions: ${recentEntry.revisions.length}`);
    console.log();

    // Get audit logs for this entry
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        resourceType: 'GrimoireEntry',
        resourceId: recentEntry.id,
      },
      orderBy: { createdAt: 'asc' },
      include: {
        admin: {
          select: {
            email: true,
          },
        },
      },
    });

    console.log(`📋 Audit Log Entries: ${auditLogs.length}`);
    console.log();

    auditLogs.forEach((log, index) => {
      console.log(`${index + 1}. ${log.actionType.toUpperCase()}`);
      console.log(`   - Admin: ${log.admin.email}`);
      console.log(`   - Timestamp: ${log.createdAt.toISOString()}`);
      console.log(`   - Metadata:`, JSON.stringify(log.metadata, null, 2));
      console.log();
    });

    // Verify expectations
    const createLogs = auditLogs.filter(log => log.actionType === 'create');
    const updateLogs = auditLogs.filter(log => log.actionType === 'update');

    console.log('✅ Verification Results:');
    console.log(`   - Create logs: ${createLogs.length} (expected: 1)`);
    console.log(`   - Update logs: ${updateLogs.length} (expected: ${recentEntry.revisions.length - 1})`);

    if (createLogs.length === 1) {
      console.log('   ✅ Correct number of create logs');
    } else {
      console.log('   ❌ Incorrect number of create logs');
    }

    if (updateLogs.length === recentEntry.revisions.length - 1) {
      console.log('   ✅ Correct number of update logs (one per update)');
    } else {
      console.log('   ❌ Incorrect number of update logs');
    }

    // Verify update logs have revision metadata
    let allUpdateLogsHaveRevisionInfo = true;
    updateLogs.forEach(log => {
      if (!log.metadata || !log.metadata.revisionNumber || !log.metadata.previousRevisionNumber) {
        allUpdateLogsHaveRevisionInfo = false;
      }
    });

    if (allUpdateLogsHaveRevisionInfo && updateLogs.length > 0) {
      console.log('   ✅ All update logs contain revision metadata');
    } else if (updateLogs.length > 0) {
      console.log('   ❌ Some update logs missing revision metadata');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}).catch(err => {
  console.error('Failed to load Prisma:', err);
  process.exit(1);
});
