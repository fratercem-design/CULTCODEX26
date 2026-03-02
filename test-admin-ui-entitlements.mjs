/**
 * Test script for Admin Console UI Entitlement Management (Task 13.6)
 * 
 * This script verifies:
 * 1. Grant entitlement functionality
 * 2. Revoke entitlement functionality
 * 3. Audit log entries are created
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

async function findTestUser(cookies) {
  console.log('\n🔍 Finding a test user...');
  const response = await fetch(`${BASE_URL}/api/admin/users`, {
    headers: {
      Cookie: cookies,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch users: ${response.status}`);
  }

  const data = await response.json();
  
  // Find a user without admin entitlement
  const testUser = data.users.find(
    (user) => !user.entitlements.some((e) => e.entitlementType === 'admin')
  );

  if (!testUser) {
    throw new Error('No suitable test user found');
  }

  console.log(`✅ Found test user: ${testUser.email}`);
  return testUser;
}

async function grantEntitlement(cookies, userId, entitlementType) {
  console.log(`\n➕ Granting ${entitlementType} to user...`);
  const response = await fetch(`${BASE_URL}/api/admin/users/${userId}/entitlements`, {
    method: 'POST',
    headers: {
      Cookie: cookies,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type: entitlementType }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(`Failed to grant entitlement: ${data.message || response.status}`);
  }

  const data = await response.json();
  console.log(`✅ Entitlement granted successfully`);
  return data;
}

async function revokeEntitlement(cookies, userId, entitlementType) {
  console.log(`\n➖ Revoking ${entitlementType} from user...`);
  const response = await fetch(`${BASE_URL}/api/admin/users/${userId}/entitlements/${entitlementType}`, {
    method: 'DELETE',
    headers: {
      Cookie: cookies,
    },
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(`Failed to revoke entitlement: ${data.message || response.status}`);
  }

  const data = await response.json();
  console.log(`✅ Entitlement revoked successfully`);
  return data;
}

async function verifyUserEntitlements(cookies, userId, expectedEntitlements) {
  console.log('\n🔍 Verifying user entitlements...');
  const response = await fetch(`${BASE_URL}/api/admin/users/${userId}`, {
    headers: {
      Cookie: cookies,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user details: ${response.status}`);
  }

  const data = await response.json();
  const actualEntitlements = data.user.entitlements.map((e) => e.type);

  console.log(`   Expected: ${expectedEntitlements.join(', ') || 'none'}`);
  console.log(`   Actual: ${actualEntitlements.join(', ') || 'none'}`);

  const matches = expectedEntitlements.every((e) => actualEntitlements.includes(e)) &&
                  actualEntitlements.every((e) => expectedEntitlements.includes(e));

  if (!matches) {
    throw new Error('Entitlements do not match expected values');
  }

  console.log('✅ Entitlements verified');
}

async function checkAuditLog(cookies, actionType) {
  console.log(`\n📜 Checking audit log for ${actionType}...`);
  const response = await fetch(`${BASE_URL}/api/admin/audit?actionType=${actionType}&limit=1`, {
    headers: {
      Cookie: cookies,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch audit log: ${response.status}`);
  }

  const data = await response.json();
  
  if (data.logs.length === 0) {
    throw new Error(`No audit log entry found for ${actionType}`);
  }

  console.log(`✅ Audit log entry found`);
  console.log(`   Action: ${data.logs[0].actionType}`);
  console.log(`   Admin: ${data.logs[0].adminEmail}`);
  console.log(`   Resource: ${data.logs[0].resourceType}`);
}

async function main() {
  try {
    console.log('🧪 Testing Admin Console UI Entitlement Management\n');
    console.log('=' .repeat(60));

    // Login
    const cookies = await login();

    // Find a test user
    const testUser = await findTestUser(cookies);
    const initialEntitlements = testUser.entitlements.map((e) => e.entitlementType);

    console.log(`\n📋 Initial entitlements: ${initialEntitlements.join(', ') || 'none'}`);

    // Choose an entitlement to test that the user doesn't have
    const testEntitlement = initialEntitlements.includes('vault_access') 
      ? 'grimoire_access' 
      : 'vault_access';

    console.log(`   Testing with: ${testEntitlement}`);

    // Test granting entitlement
    await grantEntitlement(cookies, testUser.id, testEntitlement);
    await verifyUserEntitlements(cookies, testUser.id, [...initialEntitlements, testEntitlement]);
    await checkAuditLog(cookies, 'entitlement.grant');

    // Test revoking entitlement
    await revokeEntitlement(cookies, testUser.id, testEntitlement);
    await verifyUserEntitlements(cookies, testUser.id, initialEntitlements);
    await checkAuditLog(cookies, 'entitlement.revoke');

    console.log('\n' + '='.repeat(60));
    console.log('✅ All entitlement management tests passed!');
    console.log('\n📝 Summary:');
    console.log('   ✓ Grant entitlement works correctly');
    console.log('   ✓ Revoke entitlement works correctly');
    console.log('   ✓ User entitlements are updated properly');
    console.log('   ✓ Audit log entries are created');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

main();
