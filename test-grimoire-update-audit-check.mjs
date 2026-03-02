#!/usr/bin/env node

/**
 * Test script to verify audit logs are created for grimoire updates
 */

const BASE_URL = 'http://localhost:3000';

// Admin credentials from seed
const ADMIN_EMAIL = 'admin@cultofpsyche.com';
const ADMIN_PASSWORD = 'admin123';

async function login(email, password) {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status} ${await response.text()}`);
  }

  const cookies = response.headers.get('set-cookie');
  if (!cookies) {
    throw new Error('No session cookie received');
  }

  return cookies;
}

async function getAuditLogs(sessionCookie) {
  const response = await fetch(`${BASE_URL}/api/admin/audit`, {
    method: 'GET',
    headers: {
      'Cookie': sessionCookie,
    },
  });

  const responseData = await response.json();
  return { status: response.status, data: responseData };
}

async function runCheck() {
  console.log('🔍 Checking Grimoire Update Audit Logs\n');

  try {
    // Login as admin
    console.log('1️⃣ Logging in as admin...');
    const sessionCookie = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log('✅ Admin login successful\n');

    // Get audit logs
    console.log('2️⃣ Fetching audit logs...');
    const result = await getAuditLogs(sessionCookie);
    
    if (result.status !== 200) {
      console.log('❌ Failed to fetch audit logs');
      console.log('Response:', JSON.stringify(result.data, null, 2));
      return;
    }

    const auditLogs = result.data.logs || [];
    console.log(`✅ Retrieved ${auditLogs.length} audit log entries\n`);

    // Filter for GrimoireEntry logs
    const grimoireLogs = auditLogs.filter(log => log.resourceType === 'GrimoireEntry');
    console.log(`📖 GrimoireEntry logs: ${grimoireLogs.length}`);

    const createLogs = grimoireLogs.filter(log => log.actionType === 'create');
    const updateLogs = grimoireLogs.filter(log => log.actionType === 'update');

    console.log(`   - Create actions: ${createLogs.length}`);
    console.log(`   - Update actions: ${updateLogs.length}\n`);

    if (updateLogs.length > 0) {
      console.log('📋 Recent Update Logs:');
      updateLogs.slice(0, 5).forEach((log, index) => {
        console.log(`\n${index + 1}. Update Log`);
        console.log(`   - Resource ID: ${log.resourceId}`);
        console.log(`   - Admin ID: ${log.adminId}`);
        console.log(`   - Timestamp: ${log.createdAt}`);
        console.log(`   - Metadata:`, JSON.stringify(log.metadata, null, 2));
      });

      // Verify metadata structure
      console.log('\n✅ Verification:');
      const hasRevisionInfo = updateLogs.every(log => 
        log.metadata && 
        log.metadata.revisionNumber && 
        log.metadata.previousRevisionNumber
      );

      if (hasRevisionInfo) {
        console.log('   ✅ All update logs contain revision metadata');
      } else {
        console.log('   ❌ Some update logs missing revision metadata');
      }

      const hasTitleInfo = updateLogs.every(log => 
        log.metadata && log.metadata.title
      );

      if (hasTitleInfo) {
        console.log('   ✅ All update logs contain title metadata');
      } else {
        console.log('   ❌ Some update logs missing title metadata');
      }

      const hasSlugInfo = updateLogs.every(log => 
        log.metadata && log.metadata.slug
      );

      if (hasSlugInfo) {
        console.log('   ✅ All update logs contain slug metadata');
      } else {
        console.log('   ❌ Some update logs missing slug metadata');
      }
    } else {
      console.log('⚠️  No update logs found. Run test-grimoire-admin-update.mjs first.');
    }

  } catch (error) {
    console.error('❌ Check failed with error:', error.message);
    process.exit(1);
  }
}

runCheck();
