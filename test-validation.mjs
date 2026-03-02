/**
 * Test script to verify comprehensive input validation
 * Tests various validation scenarios across different endpoints
 */

const BASE_URL = 'http://localhost:3000';

// Test cases for validation
const tests = [
  {
    name: 'Signup - Invalid email format',
    endpoint: '/api/auth/signup',
    method: 'POST',
    body: {
      email: 'invalid-email',
      password: 'Test123!@#',
    },
    expectedStatus: 400,
    expectedError: 'email',
  },
  {
    name: 'Signup - Weak password (no uppercase)',
    endpoint: '/api/auth/signup',
    method: 'POST',
    body: {
      email: 'test@example.com',
      password: 'test123!@#',
    },
    expectedStatus: 400,
    expectedError: 'password',
  },
  {
    name: 'Signup - Weak password (no special char)',
    endpoint: '/api/auth/signup',
    method: 'POST',
    body: {
      email: 'test@example.com',
      password: 'Test12345',
    },
    expectedStatus: 400,
    expectedError: 'password',
  },
  {
    name: 'Signup - Valid credentials',
    endpoint: '/api/auth/signup',
    method: 'POST',
    body: {
      email: 'validtest@example.com',
      password: 'Test123!@#',
    },
    expectedStatus: 201,
  },
];

async function runTest(test) {
  try {
    const response = await fetch(`${BASE_URL}${test.endpoint}`, {
      method: test.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(test.body),
    });

    const data = await response.json();
    
    console.log(`\n✓ Test: ${test.name}`);
    console.log(`  Status: ${response.status} (expected: ${test.expectedStatus})`);
    
    if (response.status === test.expectedStatus) {
      console.log(`  ✓ Status matches`);
      
      if (test.expectedError && data.errors) {
        const hasExpectedError = data.errors.some(err => 
          err.field.includes(test.expectedError)
        );
        if (hasExpectedError) {
          console.log(`  ✓ Contains expected error field: ${test.expectedError}`);
        } else {
          console.log(`  ✗ Missing expected error field: ${test.expectedError}`);
          console.log(`  Errors:`, JSON.stringify(data.errors, null, 2));
        }
      }
    } else {
      console.log(`  ✗ Status mismatch`);
      console.log(`  Response:`, JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log(`\n✗ Test: ${test.name}`);
    console.log(`  Error: ${error.message}`);
  }
}

async function runAllTests() {
  console.log('='.repeat(60));
  console.log('Testing Comprehensive Input Validation');
  console.log('='.repeat(60));

  for (const test of tests) {
    await runTest(test);
  }

  console.log('\n' + '='.repeat(60));
  console.log('Tests Complete');
  console.log('='.repeat(60));
}

runAllTests();
