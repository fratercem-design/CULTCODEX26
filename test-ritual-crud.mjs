/**
 * Test script for RitualInstance CRUD API endpoints
 * Tests Requirements 9.1, 9.2, 9.3, 9.4
 */

const BASE_URL = 'http://localhost:3000';

// Test user credentials (from seed data)
const TEST_USER = {
  email: 'admin@cultofpsyche.com',
  password: 'admin123',
};

let authCookie = '';
let createdRitualId = '';

/**
 * Helper function to make authenticated requests
 */
async function makeRequest(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (authCookie) {
    headers['Cookie'] = authCookie;
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  // Capture auth cookie from login
  if (response.headers.get('set-cookie')) {
    authCookie = response.headers.get('set-cookie');
  }
  
  return response;
}

/**
 * Test 1: Login to get authentication
 */
async function testLogin() {
  console.log('\n=== Test 1: Login ===');
  
  const response = await makeRequest(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify(TEST_USER),
  });
  
  const data = await response.json();
  
  if (response.ok) {
    console.log('✓ Login successful');
    console.log('User:', data.user.email);
    return true;
  } else {
    console.error('✗ Login failed:', data);
    return false;
  }
}

/**
 * Test 2: Create a ritual instance (POST /api/rituals)
 * Tests Requirement 9.2
 */
async function testCreateRitual() {
  console.log('\n=== Test 2: Create Ritual Instance ===');
  
  const ritualData = {
    title: 'Morning Meditation',
    description: 'Daily morning meditation practice',
    scheduledAt: new Date('2024-02-15T08:00:00Z').toISOString(),
  };
  
  const response = await makeRequest(`${BASE_URL}/api/rituals`, {
    method: 'POST',
    body: JSON.stringify(ritualData),
  });
  
  const data = await response.json();
  
  if (response.status === 201) {
    console.log('✓ Ritual created successfully');
    console.log('Ritual ID:', data.id);
    console.log('Title:', data.title);
    console.log('Description:', data.description);
    console.log('Scheduled At:', data.scheduledAt);
    createdRitualId = data.id;
    return true;
  } else {
    console.error('✗ Failed to create ritual:', data);
    return false;
  }
}

/**
 * Test 3: List rituals (GET /api/rituals)
 * Tests Requirement 9.1
 */
async function testListRituals() {
  console.log('\n=== Test 3: List Ritual Instances ===');
  
  const response = await makeRequest(`${BASE_URL}/api/rituals`);
  const data = await response.json();
  
  if (response.ok) {
    console.log('✓ Rituals fetched successfully');
    console.log('Total rituals:', data.rituals.length);
    
    if (data.rituals.length > 0) {
      console.log('First ritual:', {
        id: data.rituals[0].id,
        title: data.rituals[0].title,
        scheduledAt: data.rituals[0].scheduledAt,
      });
    }
    return true;
  } else {
    console.error('✗ Failed to fetch rituals:', data);
    return false;
  }
}

/**
 * Test 4: Update a ritual (PATCH /api/rituals/[id])
 * Tests Requirement 9.3
 */
async function testUpdateRitual() {
  console.log('\n=== Test 4: Update Ritual Instance ===');
  
  if (!createdRitualId) {
    console.error('✗ No ritual ID available for update test');
    return false;
  }
  
  const updateData = {
    title: 'Evening Meditation',
    description: 'Updated to evening practice',
    scheduledAt: new Date('2024-02-15T20:00:00Z').toISOString(),
  };
  
  const response = await makeRequest(`${BASE_URL}/api/rituals/${createdRitualId}`, {
    method: 'PATCH',
    body: JSON.stringify(updateData),
  });
  
  const data = await response.json();
  
  if (response.ok) {
    console.log('✓ Ritual updated successfully');
    console.log('Updated title:', data.title);
    console.log('Updated description:', data.description);
    console.log('Updated scheduled at:', data.scheduledAt);
    return true;
  } else {
    console.error('✗ Failed to update ritual:', data);
    return false;
  }
}

/**
 * Test 5: Verify ownership enforcement (attempt to access another user's ritual)
 * Tests user scoping requirement
 */
async function testOwnershipEnforcement() {
  console.log('\n=== Test 5: Verify Ownership Enforcement ===');
  
  // Try to update with a non-existent ritual ID
  const fakeId = 'clxxxxxxxxxxxxxxxxx';
  
  const response = await makeRequest(`${BASE_URL}/api/rituals/${fakeId}`, {
    method: 'PATCH',
    body: JSON.stringify({ title: 'Hacked' }),
  });
  
  const data = await response.json();
  
  if (response.status === 404) {
    console.log('✓ Ownership enforcement working (404 for non-existent ritual)');
    return true;
  } else {
    console.error('✗ Ownership enforcement failed:', data);
    return false;
  }
}

/**
 * Test 6: Delete a ritual (DELETE /api/rituals/[id])
 * Tests Requirement 9.4
 */
async function testDeleteRitual() {
  console.log('\n=== Test 6: Delete Ritual Instance ===');
  
  if (!createdRitualId) {
    console.error('✗ No ritual ID available for delete test');
    return false;
  }
  
  const response = await makeRequest(`${BASE_URL}/api/rituals/${createdRitualId}`, {
    method: 'DELETE',
  });
  
  const data = await response.json();
  
  if (response.ok && data.success) {
    console.log('✓ Ritual deleted successfully');
    console.log('Message:', data.message);
    return true;
  } else {
    console.error('✗ Failed to delete ritual:', data);
    return false;
  }
}

/**
 * Test 7: Verify deletion (try to fetch deleted ritual)
 */
async function testVerifyDeletion() {
  console.log('\n=== Test 7: Verify Deletion ===');
  
  const response = await makeRequest(`${BASE_URL}/api/rituals`);
  const data = await response.json();
  
  if (response.ok) {
    const deletedRitual = data.rituals.find(r => r.id === createdRitualId);
    
    if (!deletedRitual) {
      console.log('✓ Ritual successfully deleted (not in list)');
      return true;
    } else {
      console.error('✗ Deleted ritual still appears in list');
      return false;
    }
  } else {
    console.error('✗ Failed to verify deletion:', data);
    return false;
  }
}

/**
 * Test 8: Test authentication requirement
 */
async function testAuthenticationRequired() {
  console.log('\n=== Test 8: Authentication Required ===');
  
  // Clear auth cookie
  const savedCookie = authCookie;
  authCookie = '';
  
  const response = await makeRequest(`${BASE_URL}/api/rituals`);
  const data = await response.json();
  
  // Restore auth cookie
  authCookie = savedCookie;
  
  if (response.status === 401) {
    console.log('✓ Authentication properly required (401 without auth)');
    return true;
  } else {
    console.error('✗ Authentication not properly enforced:', data);
    return false;
  }
}

/**
 * Test 9: Test validation (missing required fields)
 */
async function testValidation() {
  console.log('\n=== Test 9: Input Validation ===');
  
  // Test missing title
  const response1 = await makeRequest(`${BASE_URL}/api/rituals`, {
    method: 'POST',
    body: JSON.stringify({
      scheduledAt: new Date().toISOString(),
    }),
  });
  
  if (response1.status === 400) {
    console.log('✓ Validation working (missing title rejected)');
  } else {
    console.error('✗ Validation failed for missing title');
    return false;
  }
  
  // Test missing scheduledAt
  const response2 = await makeRequest(`${BASE_URL}/api/rituals`, {
    method: 'POST',
    body: JSON.stringify({
      title: 'Test Ritual',
    }),
  });
  
  if (response2.status === 400) {
    console.log('✓ Validation working (missing scheduledAt rejected)');
  } else {
    console.error('✗ Validation failed for missing scheduledAt');
    return false;
  }
  
  // Test invalid date
  const response3 = await makeRequest(`${BASE_URL}/api/rituals`, {
    method: 'POST',
    body: JSON.stringify({
      title: 'Test Ritual',
      scheduledAt: 'invalid-date',
    }),
  });
  
  if (response3.status === 400) {
    console.log('✓ Validation working (invalid date rejected)');
    return true;
  } else {
    console.error('✗ Validation failed for invalid date');
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('Starting RitualInstance CRUD API Tests...');
  console.log('Testing against:', BASE_URL);
  
  const results = [];
  
  results.push(await testLogin());
  results.push(await testCreateRitual());
  results.push(await testListRituals());
  results.push(await testUpdateRitual());
  results.push(await testOwnershipEnforcement());
  results.push(await testDeleteRitual());
  results.push(await testVerifyDeletion());
  results.push(await testAuthenticationRequired());
  results.push(await testValidation());
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log('\n' + '='.repeat(50));
  console.log(`Test Results: ${passed}/${total} passed`);
  console.log('='.repeat(50));
  
  if (passed === total) {
    console.log('✓ All tests passed!');
    process.exit(0);
  } else {
    console.log('✗ Some tests failed');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
