#!/usr/bin/env node

/**
 * Test script to verify audit log entries for grimoire creation
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

  if (!response.ok) {
    throw new Error(`Failed to fetch audit logs: ${response.status}`);
  }

  return await response.json();
}

async function runTest() {
  console.log('🧪 Verifying audit log entries for grimoire creation\n');

  try {
    // Login as admin
    console.log('1️⃣ Logging in as admin...');
    const sessionCookie = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log('✅ Admin login successful\n');

    // Fetch audit logs
    console.log('2️⃣ Fetching audit logs...');
    const auditLogs = await getAuditLogs(sessionCookie);
    console.log(`✅ Retrieved ${auditLogs.logs.length} audit log entries\n`);

    // Filter for GrimoireEntry creation logs
    const grimoireCreationLogs = auditLogs.logs.filter(
      log => log.resourceType === 'GrimoireEntry' && log.actionType === 'create'
    );

    console.log(`3️⃣ Found ${grimoireCreationLogs.length} GrimoireEntry creation logs:\n`);

    grimoireCreationLogs.forEach((log, index) => {
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

    if (grimoireCreationLogs.length >= 2) {
      console.log('✅ Audit logs correctly recorded grimoire entry creations');
      
      // Verify metadata structure
      const hasCorrectMetadata = grimoireCreationLogs.every(log => 
        log.metadata && 
        log.metadata.title && 
        log.metadata.slug && 
        log.metadata.revisionNumber === 1
      );

      if (hasCorrectMetadata) {
        console.log('✅ All audit logs have correct metadata structure');
      } else {
        console.log('❌ Some audit logs have incorrect metadata structure');
      }
    } else {
      console.log('❌ Expected at least 2 grimoire creation audit logs');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    process.exit(1);
  }
}

runTest();
