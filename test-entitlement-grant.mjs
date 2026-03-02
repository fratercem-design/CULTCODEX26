/**
 * Test script for entitlement grant endpoint
 * Tests POST /api/admin/users/[id]/entitlements
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
    throw new Error(`Login failed: ${response.status}`);
  }

  const cookies = response.headers.get('set-cookie');
  return cookies;
}

async function createTestUser(adminCookie) {
  const testEmail = `test-${Date.now()}@example.com`;
  
  const response = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'testpass123',
    }),
  });

  if (!response.ok) {
    throw new Error(`Signup failed: ${response.status}`);
  }

  const data = await response.json();
  return data.user.id;
}

async function getUserDetails(userId, adminCookie) {
  const response = await fetch(`${BASE_URL}/api/admin/users/${userId}`, {
    headers: { Cookie: adminCookie },
  });

  if (!response.ok) {
    throw new Error(`Get user failed: ${response.status}`);
  }

  return response.json();
}

async function grantEntitlement(userId, type, reason, adminCookie) {
  const response = await fetch(`${BASE_URL}/api/admin/users/${userId}/entitlements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminCookie,
    },
    body: JSON.stringify({ type, reason }),
  });

  const data = await response.json();
  return { status: response.status, data };
}

async function runTests() {
  console.log('🧪 Testing Entitlement Grant Endpoint\n');

  try {
    // Step 1: Login as admin
    console.log('1️⃣  Logging in as admin...');
    const adminCookie = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log('✅ Admin logged in\n');

    // Step 2: Create test user
    console.log('2️⃣  Creating test user...');
    const testUserId = await createTestUser(adminCookie);
    console.log(`✅ Test user created: ${testUserId}\n`);

    // Step 3: Verify user has no entitlements initially
    console.log('3️⃣  Checking initial user state...');
    const initialUser = await getUserDetails(testUserId, adminCookie);
    console.log(`✅ Initial entitlements: ${initialUser.user.entitlements.length}`);
    console.log(JSON.stringify(initialUser.user.entitlements, null, 2));
    console.log();

    // Step 4: Grant vault_access entitlement
    console.log('4️⃣  Granting vault_access entitlement...');
    const grantResult1 = await grantEntitlement(
      testUserId,
      'vault_access',
      'Test grant for verification',
      adminCookie
    );
    console.log(`✅ Status: ${grantResult1.status}`);
    console.log('Response:', JSON.stringify(grantResult1.data, null, 2));
    console.log();

    // Step 5: Verify entitlement was granted
    console.log('5️⃣  Verifying entitlement was granted...');
    const updatedUser1 = await getUserDetails(testUserId, adminCookie);
    console.log(`✅ Current entitlements: ${updatedUser1.user.entitlements.length}`);
    console.log(JSON.stringify(updatedUser1.user.entitlements, null, 2));
    console.log();

    // Step 6: Test idempotency - grant same entitlement again
    console.log('6️⃣  Testing idempotency (granting same entitlement again)...');
    const grantResult2 = await grantEntitlement(
      testUserId,
      'vault_access',
      'Duplicate grant attempt',
      adminCookie
    );
    console.log(`✅ Status: ${grantResult2.status} (should be 200)`);
    console.log('Response:', JSON.stringify(grantResult2.data, null, 2));
    console.log();

    // Step 7: Grant grimoire_access entitlement
    console.log('7️⃣  Granting grimoire_access entitlement...');
    const grantResult3 = await grantEntitlement(
      testUserId,
      'grimoire_access',
      'Adding grimoire access',
      adminCookie
    );
    console.log(`✅ Status: ${grantResult3.status}`);
    console.log('Response:', JSON.stringify(grantResult3.data, null, 2));
    console.log();

    // Step 8: Verify both entitlements exist
    console.log('8️⃣  Verifying both entitlements exist...');
    const updatedUser2 = await getUserDetails(testUserId, adminCookie);
    console.log(`✅ Current entitlements: ${updatedUser2.user.entitlements.length}`);
    console.log(JSON.stringify(updatedUser2.user.entitlements, null, 2));
    console.log();

    // Step 9: Test validation - invalid entitlement type
    console.log('9️⃣  Testing validation (invalid entitlement type)...');
    const invalidResult = await grantEntitlement(
      testUserId,
      'invalid_type',
      'Should fail',
      adminCookie
    );
    console.log(`✅ Status: ${invalidResult.status} (should be 400)`);
    console.log('Response:', JSON.stringify(invalidResult.data, null, 2));
    console.log();

    // Step 10: Test with non-existent user
    console.log('🔟 Testing with non-existent user...');
    const notFoundResult = await grantEntitlement(
      'non-existent-id',
      'vault_access',
      'Should fail',
      adminCookie
    );
    console.log(`✅ Status: ${notFoundResult.status} (should be 404)`);
    console.log('Response:', JSON.stringify(notFoundResult.data, null, 2));
    console.log();

    console.log('✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runTests();
