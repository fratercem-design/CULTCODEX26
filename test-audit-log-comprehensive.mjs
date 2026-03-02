/**
 * Comprehensive test script for audit log API endpoint
 * Creates audit log entries by performing admin actions, then tests filtering
 */

const BASE_URL = 'http://localhost:3000';

// Test credentials
const ADMIN_EMAIL = 'admin@cultofpsyche.com';
const ADMIN_PASSWORD = 'admin123';

let adminSessionCookie = null;
let testUserId = null;

/**
 * Helper function to make authenticated requests
 */
async function makeRequest(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (adminSessionCookie) {
    headers['Cookie'] = adminSessionCookie;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Capture session cookie from response
  const setCookie = response.headers.get('set-cookie');
  if (setCookie && setCookie.includes('session=')) {
    adminSessionCookie = setCookie.split(';')[0];
  }

  return response;
}

/**
 * Login as admin
 */
async function loginAsAdmin() {
  console.log('\n🔐 Logging in as admin...');
  const response = await makeRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Login failed: ${error.message}`);
  }

  const data = await response.json();
  console.log('✅ Logged in as:', data.user.email);
  return data.user;
}

/**
 * Get list of users to find a test user
 */
async function getTestUser() {
  console.log('\n👤 Finding test user...');
  const response = await makeRequest('/api/admin/users');

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to fetch users: ${error.message}`);
  }

  const data = await response.json();
  // Find a non-admin user or use the first user
  const testUser = data.users.find(u => u.email !== ADMIN_EMAIL) || data.users[0];
  
  if (!testUser) {
    throw new Error('No test user found');
  }

  console.log('✅ Found test user:', testUser.email);
  testUserId = testUser.id;
  return testUser;
}

/**
 * Grant an entitlement to create audit log entry
 */
async function grantEntitlement() {
  console.log('\n➕ Granting vault_access entitlement to test user...');
  const response = await makeRequest(`/api/admin/users/${testUserId}/entitlements`, {
    method: 'POST',
    body: JSON.stringify({
      type: 'vault_access',
      reason: 'Test audit log entry',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    // If already exists, that's okay
    if (error.message && error.message.includes('already has')) {
      console.log('ℹ️  User already has entitlement');
      return;
    }
    throw new Error(`Failed to grant entitlement: ${error.message}`);
  }

  const data = await response.json();
  console.log('✅ Entitlement granted');
  return data;
}

/**
 * Revoke an entitlement to create audit log entry
 */
async function revokeEntitlement() {
  console.log('\n➖ Revoking vault_access entitlement from test user...');
  const response = await makeRequest(
    `/api/admin/users/${testUserId}/entitlements/vault_access`,
    {
      method: 'DELETE',
    }
  );

  if (!response.ok) {
    const error = await response.json();
    // If doesn't exist, that's okay
    if (error.message && error.message.includes('does not have')) {
      console.log('ℹ️  User does not have entitlement');
      return;
    }
    throw new Error(`Failed to revoke entitlement: ${error.message}`);
  }

  const data = await response.json();
  console.log('✅ Entitlement revoked');
  return data;
}

/**
 * Test: Fetch all audit logs
 */
async function testFetchAllLogs() {
  console.log('\n📋 Test: Fetch all audit logs...');
  const response = await makeRequest('/api/admin/audit');

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to fetch audit logs: ${error.message}`);
  }

  const data = await response.json();
  console.log('✅ Fetched audit logs');
  console.log(`   Total logs: ${data.pagination.total}`);
  console.log(`   Logs returned: ${data.logs.length}`);

  // Show action type distribution
  const actionTypes = {};
  data.logs.forEach(log => {
    actionTypes[log.actionType] = (actionTypes[log.actionType] || 0) + 1;
  });
  console.log('\n   Action type distribution:');
  Object.entries(actionTypes).forEach(([type, count]) => {
    console.log(`   - ${type}: ${count}`);
  });

  return data;
}

/**
 * Test: Filter by entitlement.grant action
 */
async function testFilterGrantActions() {
  console.log('\n🔍 Test: Filter by actionType=entitlement.grant...');
  const response = await makeRequest('/api/admin/audit?actionType=entitlement.grant');

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to filter logs: ${error.message}`);
  }

  const data = await response.json();
  console.log('✅ Filtered logs by grant action');
  console.log(`   Matching logs: ${data.logs.length}`);

  if (data.logs.length > 0) {
    console.log('\n   Sample grant entry:');
    const log = data.logs[0];
    console.log(`   - Admin: ${log.adminEmail}`);
    console.log(`   - Target User: ${log.metadata?.targetUserId}`);
    console.log(`   - Entitlement: ${log.metadata?.entitlementType}`);
    console.log(`   - Reason: ${log.metadata?.reason || 'N/A'}`);
  }

  return data;
}

/**
 * Test: Filter by entitlement.revoke action
 */
async function testFilterRevokeActions() {
  console.log('\n🔍 Test: Filter by actionType=entitlement.revoke...');
  const response = await makeRequest('/api/admin/audit?actionType=entitlement.revoke');

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to filter logs: ${error.message}`);
  }

  const data = await response.json();
  console.log('✅ Filtered logs by revoke action');
  console.log(`   Matching logs: ${data.logs.length}`);

  if (data.logs.length > 0) {
    console.log('\n   Sample revoke entry:');
    const log = data.logs[0];
    console.log(`   - Admin: ${log.adminEmail}`);
    console.log(`   - Target User: ${log.metadata?.targetUserId}`);
    console.log(`   - Entitlement: ${log.metadata?.entitlementType}`);
  }

  return data;
}

/**
 * Test: Filter by admin ID
 */
async function testFilterByAdminId(adminUser) {
  console.log('\n🔍 Test: Filter by adminId...');
  const response = await makeRequest(`/api/admin/audit?adminId=${adminUser.id}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to filter logs: ${error.message}`);
  }

  const data = await response.json();
  console.log('✅ Filtered logs by admin ID');
  console.log(`   Matching logs: ${data.logs.length}`);
  
  const allMatch = data.logs.every(log => log.adminId === adminUser.id);
  console.log(`   All logs from admin: ${allMatch ? '✅' : '❌'}`);

  return data;
}

/**
 * Test: Combined filters
 */
async function testCombinedFilters() {
  console.log('\n🔍 Test: Combined filters (Entitlement resource + pagination)...');
  const response = await makeRequest('/api/admin/audit?resourceType=Entitlement&limit=3');

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to filter logs: ${error.message}`);
  }

  const data = await response.json();
  console.log('✅ Applied combined filters');
  console.log(`   Logs returned: ${data.logs.length} (max 3)`);
  console.log(`   Total matching: ${data.pagination.total}`);
  console.log(`   Total pages: ${data.pagination.totalPages}`);

  return data;
}

/**
 * Test: Verify audit log is read-only
 */
async function testReadOnlyAuditLog() {
  console.log('\n🔒 Test: Verify audit log is read-only...');
  
  // Try POST (should fail - no route)
  const postResponse = await makeRequest('/api/admin/audit', {
    method: 'POST',
    body: JSON.stringify({ test: 'data' }),
  });

  if (postResponse.status === 405 || postResponse.status === 404) {
    console.log('✅ POST correctly rejected (405 or 404)');
  } else {
    console.log(`⚠️  POST returned unexpected status: ${postResponse.status}`);
  }

  // Try DELETE (should fail - no route)
  const deleteResponse = await makeRequest('/api/admin/audit/test-id', {
    method: 'DELETE',
  });

  if (deleteResponse.status === 405 || deleteResponse.status === 404) {
    console.log('✅ DELETE correctly rejected (405 or 404)');
  } else {
    console.log(`⚠️  DELETE returned unexpected status: ${deleteResponse.status}`);
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🧪 Comprehensive Audit Log API Test');
  console.log('='.repeat(50));

  try {
    // Setup
    const adminUser = await loginAsAdmin();
    await getTestUser();

    // Create audit log entries
    console.log('\n📝 Creating audit log entries...');
    await grantEntitlement();
    await revokeEntitlement();
    await grantEntitlement(); // Grant again for next test

    // Run tests
    await testFetchAllLogs();
    await testFilterGrantActions();
    await testFilterRevokeActions();
    await testFilterByAdminId(adminUser);
    await testCombinedFilters();
    await testReadOnlyAuditLog();

    console.log('\n' + '='.repeat(50));
    console.log('✅ All comprehensive tests passed!');
    console.log('='.repeat(50));
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
runTests();
