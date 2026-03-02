/**
 * Test script for audit log API endpoint
 * Tests GET /api/admin/audit with pagination and filtering
 */

const BASE_URL = 'http://localhost:3000';

// Test credentials (admin user from seed)
const ADMIN_EMAIL = 'admin@cultofpsyche.com';
const ADMIN_PASSWORD = 'admin123';

let adminSessionCookie = null;

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
 * Test: Fetch audit logs without filters
 */
async function testFetchAuditLogs() {
  console.log('\n📋 Test: Fetch audit logs (no filters)...');
  const response = await makeRequest('/api/admin/audit');

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to fetch audit logs: ${error.message}`);
  }

  const data = await response.json();
  console.log('✅ Fetched audit logs');
  console.log(`   Total logs: ${data.pagination.total}`);
  console.log(`   Page: ${data.pagination.page}/${data.pagination.totalPages}`);
  console.log(`   Logs returned: ${data.logs.length}`);

  if (data.logs.length > 0) {
    console.log('\n   Sample log entry:');
    const log = data.logs[0];
    console.log(`   - ID: ${log.id}`);
    console.log(`   - Admin: ${log.adminEmail}`);
    console.log(`   - Action: ${log.actionType}`);
    console.log(`   - Resource: ${log.resourceType} (${log.resourceId})`);
    console.log(`   - Created: ${log.createdAt}`);
    if (log.metadata) {
      console.log(`   - Metadata: ${JSON.stringify(log.metadata, null, 2)}`);
    }
  }

  return data;
}

/**
 * Test: Fetch audit logs with pagination
 */
async function testPagination() {
  console.log('\n📄 Test: Pagination (page 1, limit 5)...');
  const response = await makeRequest('/api/admin/audit?page=1&limit=5');

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to fetch paginated logs: ${error.message}`);
  }

  const data = await response.json();
  console.log('✅ Fetched paginated logs');
  console.log(`   Logs returned: ${data.logs.length} (max 5)`);
  console.log(`   Total: ${data.pagination.total}`);
  console.log(`   Total pages: ${data.pagination.totalPages}`);

  return data;
}

/**
 * Test: Filter by action type
 */
async function testFilterByActionType() {
  console.log('\n🔍 Test: Filter by actionType=entitlement.grant...');
  const response = await makeRequest('/api/admin/audit?actionType=entitlement.grant');

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to filter logs: ${error.message}`);
  }

  const data = await response.json();
  console.log('✅ Filtered logs by action type');
  console.log(`   Matching logs: ${data.logs.length}`);

  if (data.logs.length > 0) {
    const allMatch = data.logs.every(log => log.actionType === 'entitlement.grant');
    console.log(`   All logs match filter: ${allMatch ? '✅' : '❌'}`);
  }

  return data;
}

/**
 * Test: Filter by resource type
 */
async function testFilterByResourceType() {
  console.log('\n🔍 Test: Filter by resourceType=Entitlement...');
  const response = await makeRequest('/api/admin/audit?resourceType=Entitlement');

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to filter logs: ${error.message}`);
  }

  const data = await response.json();
  console.log('✅ Filtered logs by resource type');
  console.log(`   Matching logs: ${data.logs.length}`);

  if (data.logs.length > 0) {
    const allMatch = data.logs.every(log => log.resourceType === 'Entitlement');
    console.log(`   All logs match filter: ${allMatch ? '✅' : '❌'}`);
  }

  return data;
}

/**
 * Test: Filter by date range
 */
async function testFilterByDateRange() {
  console.log('\n📅 Test: Filter by date range (last 7 days)...');
  const dateTo = new Date().toISOString();
  const dateFrom = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const response = await makeRequest(
    `/api/admin/audit?dateFrom=${encodeURIComponent(dateFrom)}&dateTo=${encodeURIComponent(dateTo)}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to filter logs by date: ${error.message}`);
  }

  const data = await response.json();
  console.log('✅ Filtered logs by date range');
  console.log(`   Matching logs: ${data.logs.length}`);
  console.log(`   Date range: ${dateFrom.split('T')[0]} to ${dateTo.split('T')[0]}`);

  return data;
}

/**
 * Test: Unauthorized access (no session)
 */
async function testUnauthorizedAccess() {
  console.log('\n🚫 Test: Unauthorized access (no session)...');
  const savedCookie = adminSessionCookie;
  adminSessionCookie = null;

  const response = await makeRequest('/api/admin/audit');

  adminSessionCookie = savedCookie;

  if (response.status === 401) {
    console.log('✅ Correctly rejected unauthorized request');
    return;
  }

  throw new Error('Expected 401 Unauthorized but got: ' + response.status);
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🧪 Testing Audit Log API Endpoint');
  console.log('='.repeat(50));

  try {
    // Login
    await loginAsAdmin();

    // Run tests
    await testFetchAuditLogs();
    await testPagination();
    await testFilterByActionType();
    await testFilterByResourceType();
    await testFilterByDateRange();
    await testUnauthorizedAccess();

    console.log('\n' + '='.repeat(50));
    console.log('✅ All tests passed!');
    console.log('='.repeat(50));
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
runTests();
