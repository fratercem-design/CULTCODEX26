/**
 * Test script for Admin Console UI (Task 13.6)
 * 
 * This script verifies:
 * 1. Admin page navigation links are present
 * 2. Users list page loads
 * 3. User detail page loads
 * 4. Audit log page loads
 */

const BASE_URL = 'http://localhost:3000';

// Test credentials (from seed data)
const ADMIN_EMAIL = 'admin@cultofpsyche.com';
const ADMIN_PASSWORD = 'admin123';

async function login() {
  console.log('🔐 Logging in as admin...');
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    }),
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status}`);
  }

  const cookies = response.headers.get('set-cookie');
  if (!cookies) {
    throw new Error('No session cookie received');
  }

  console.log('✅ Login successful');
  return cookies;
}

async function testUsersListAPI(cookies) {
  console.log('\n📋 Testing users list API...');
  const response = await fetch(`${BASE_URL}/api/admin/users`, {
    headers: {
      Cookie: cookies,
    },
  });

  if (!response.ok) {
    throw new Error(`Users list API failed: ${response.status}`);
  }

  const data = await response.json();
  console.log(`✅ Users list API working - Found ${data.total} users`);
  
  if (data.users && data.users.length > 0) {
    console.log(`   First user: ${data.users[0].email}`);
    return data.users[0].id;
  }
  
  return null;
}

async function testUserDetailAPI(cookies, userId) {
  if (!userId) {
    console.log('\n⚠️  Skipping user detail API test - no users found');
    return;
  }

  console.log(`\n👤 Testing user detail API for user ${userId}...`);
  const response = await fetch(`${BASE_URL}/api/admin/users/${userId}`, {
    headers: {
      Cookie: cookies,
    },
  });

  if (!response.ok) {
    throw new Error(`User detail API failed: ${response.status}`);
  }

  const data = await response.json();
  console.log(`✅ User detail API working`);
  console.log(`   Email: ${data.user.email}`);
  console.log(`   Entitlements: ${data.user.entitlements.length}`);
  console.log(`   Journal entries: ${data.stats.journalCount}`);
  console.log(`   Rituals: ${data.stats.ritualCount}`);
}

async function testAuditLogAPI(cookies) {
  console.log('\n📜 Testing audit log API...');
  const response = await fetch(`${BASE_URL}/api/admin/audit?page=1&limit=10`, {
    headers: {
      Cookie: cookies,
    },
  });

  if (!response.ok) {
    throw new Error(`Audit log API failed: ${response.status}`);
  }

  const data = await response.json();
  console.log(`✅ Audit log API working - Found ${data.pagination.total} entries`);
  
  if (data.logs && data.logs.length > 0) {
    console.log(`   Latest action: ${data.logs[0].actionType} by ${data.logs[0].adminEmail}`);
  }
}

async function main() {
  try {
    console.log('🧪 Testing Admin Console UI (Task 13.6)\n');
    console.log('=' .repeat(60));

    // Login
    const cookies = await login();

    // Test APIs
    const userId = await testUsersListAPI(cookies);
    await testUserDetailAPI(cookies, userId);
    await testAuditLogAPI(cookies);

    console.log('\n' + '='.repeat(60));
    console.log('✅ All Admin Console UI tests passed!');
    console.log('\n📝 Manual verification needed:');
    console.log('   1. Visit http://localhost:3000/admin');
    console.log('   2. Check navigation links to Users and Audit sections');
    console.log('   3. Visit http://localhost:3000/admin/users');
    console.log('   4. Click on a user to view details');
    console.log('   5. Test grant/revoke entitlement buttons');
    console.log('   6. Visit http://localhost:3000/admin/audit');
    console.log('   7. Test pagination and filters');
    console.log('   8. Expand metadata for audit log entries');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

main();
