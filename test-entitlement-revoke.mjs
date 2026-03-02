/**
 * Test script for entitlement revoke endpoint
 * Tests DELETE /api/admin/users/[id]/entitlements/[entitlementType]
 * 
 * Prerequisites:
 * - Server running on http://localhost:3000
 * - Admin user exists with credentials from .env
 * - Test user exists (will be created if not)
 */

const BASE_URL = 'http://localhost:3000';

// Admin credentials (from seed)
const ADMIN_EMAIL = 'admin@cultofpsyche.com';
const ADMIN_PASSWORD = 'admin123';

// Test user credentials
const TEST_USER_EMAIL = 'testuser@example.com';
const TEST_USER_PASSWORD = 'testpass123';

let adminSessionCookie = '';
let testUserId = '';

/**
 * Helper to make authenticated requests
 */
async function makeRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  return response;
}

/**
 * Step 1: Login as admin
 */
async function loginAsAdmin() {
  console.log('\n=== Step 1: Login as Admin ===');
  
  const response = await makeRequest(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Admin login failed: ${response.status} ${error}`);
  }

  // Extract session cookie
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) {
    adminSessionCookie = setCookie.split(';')[0];
  }

  const data = await response.json();
  console.log('✓ Admin logged in successfully');
  console.log('  Admin ID:', data.user.id);
  
  return data;
}

/**
 * Step 2: Get test user from user list
 */
async function getTestUser() {
  console.log('\n=== Step 2: Get Test User ===');
  
  // Get list of users
  const response = await makeRequest(`${BASE_URL}/api/admin/users`, {
    method: 'GET',
    headers: {
      Cookie: adminSessionCookie,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get user list: ${response.status} ${error}`);
  }

  const data = await response.json();
  
  // Find a non-admin user, or use the first user that's not the admin
  const testUser = data.users.find(u => 
    u.email !== ADMIN_EMAIL && 
    !u.entitlements.some(e => e.type === 'admin')
  ) || data.users.find(u => u.email !== ADMIN_EMAIL);
  
  if (!testUser) {
    throw new Error('No test user found. Please create a non-admin user first.');
  }
  
  testUserId = testUser.id;
  console.log('✓ Found test user');
  console.log('  User ID:', testUserId);
  console.log('  Email:', testUser.email);
  console.log('  Current entitlements:', testUser.entitlements);
  
  return testUser;
}

/**
 * Step 3: Grant entitlement to test user
 */
async function grantEntitlement(entitlementType) {
  console.log(`\n=== Step 3: Grant ${entitlementType} Entitlement ===`);
  
  const response = await makeRequest(
    `${BASE_URL}/api/admin/users/${testUserId}/entitlements`,
    {
      method: 'POST',
      headers: {
        Cookie: adminSessionCookie,
      },
      body: JSON.stringify({
        type: entitlementType,
        reason: 'Testing revoke endpoint',
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Grant entitlement failed: ${response.status} ${error}`);
  }

  const data = await response.json();
  console.log('✓ Entitlement granted successfully');
  console.log('  Current entitlements:', data.entitlements);
  
  return data;
}

/**
 * Step 4: Revoke entitlement from test user
 */
async function revokeEntitlement(entitlementType) {
  console.log(`\n=== Step 4: Revoke ${entitlementType} Entitlement ===`);
  
  const response = await makeRequest(
    `${BASE_URL}/api/admin/users/${testUserId}/entitlements/${entitlementType}`,
    {
      method: 'DELETE',
      headers: {
        Cookie: adminSessionCookie,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Revoke entitlement failed: ${response.status} ${error}`);
  }

  const data = await response.json();
  console.log('✓ Entitlement revoked successfully');
  console.log('  Message:', data.message);
  console.log('  Remaining entitlements:', data.entitlements);
  
  return data;
}

/**
 * Step 5: Test revoking non-existent entitlement (should return 404)
 */
async function testRevokeNonExistent() {
  console.log('\n=== Step 5: Test Revoke Non-Existent Entitlement ===');
  
  const response = await makeRequest(
    `${BASE_URL}/api/admin/users/${testUserId}/entitlements/vault_access`,
    {
      method: 'DELETE',
      headers: {
        Cookie: adminSessionCookie,
      },
    }
  );

  if (response.status === 404) {
    const data = await response.json();
    console.log('✓ Correctly returned 404 for non-existent entitlement');
    console.log('  Error message:', data.message);
    return data;
  } else {
    throw new Error(`Expected 404, got ${response.status}`);
  }
}

/**
 * Step 6: Test invalid entitlement type (should return 400)
 */
async function testInvalidEntitlementType() {
  console.log('\n=== Step 6: Test Invalid Entitlement Type ===');
  
  const response = await makeRequest(
    `${BASE_URL}/api/admin/users/${testUserId}/entitlements/invalid_type`,
    {
      method: 'DELETE',
      headers: {
        Cookie: adminSessionCookie,
      },
    }
  );

  if (response.status === 400) {
    const data = await response.json();
    console.log('✓ Correctly returned 400 for invalid entitlement type');
    console.log('  Error message:', data.message);
    return data;
  } else {
    throw new Error(`Expected 400, got ${response.status}`);
  }
}

/**
 * Step 7: Test revoking from non-existent user (should return 404)
 */
async function testRevokeFromNonExistentUser() {
  console.log('\n=== Step 7: Test Revoke From Non-Existent User ===');
  
  const fakeUserId = 'clxxxxxxxxxxxxxxxxxx';
  const response = await makeRequest(
    `${BASE_URL}/api/admin/users/${fakeUserId}/entitlements/vault_access`,
    {
      method: 'DELETE',
      headers: {
        Cookie: adminSessionCookie,
      },
    }
  );

  if (response.status === 404) {
    const data = await response.json();
    console.log('✓ Correctly returned 404 for non-existent user');
    console.log('  Error message:', data.message);
    return data;
  } else {
    throw new Error(`Expected 404, got ${response.status}`);
  }
}

/**
 * Step 8: Test without admin authentication (should return 403)
 */
async function testWithoutAdminAuth() {
  console.log('\n=== Step 8: Test Without Admin Authentication ===');
  
  const response = await makeRequest(
    `${BASE_URL}/api/admin/users/${testUserId}/entitlements/vault_access`,
    {
      method: 'DELETE',
    }
  );

  if (response.status === 401 || response.status === 403) {
    const data = await response.json();
    console.log(`✓ Correctly returned ${response.status} without authentication`);
    console.log('  Error message:', data.message);
    return data;
  } else {
    throw new Error(`Expected 401 or 403, got ${response.status}`);
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('='.repeat(60));
  console.log('ENTITLEMENT REVOKE ENDPOINT TEST');
  console.log('='.repeat(60));

  try {
    // Setup
    await loginAsAdmin();
    await getTestUser();
    
    // Test successful revoke
    await grantEntitlement('vault_access');
    await revokeEntitlement('vault_access');
    
    // Test error cases
    await testRevokeNonExistent();
    await testInvalidEntitlementType();
    await testRevokeFromNonExistentUser();
    await testWithoutAdminAuth();
    
    // Test multiple entitlements
    console.log('\n=== Step 9: Test Multiple Entitlements ===');
    await grantEntitlement('vault_access');
    await grantEntitlement('grimoire_access');
    console.log('  Granted both vault_access and grimoire_access');
    
    await revokeEntitlement('vault_access');
    console.log('  Revoked vault_access, grimoire_access should remain');
    
    await revokeEntitlement('grimoire_access');
    console.log('  Revoked grimoire_access, no entitlements should remain');
    
    console.log('\n' + '='.repeat(60));
    console.log('✓ ALL TESTS PASSED');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('✗ TEST FAILED');
    console.error('='.repeat(60));
    console.error('Error:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run tests
runTests();
