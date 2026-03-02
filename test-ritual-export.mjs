/**
 * Test script for Ritual ICS Export endpoint
 * Tests GET /api/rituals/export
 * 
 * This script:
 * 1. Creates a test user and logs in
 * 2. Creates multiple ritual instances
 * 3. Exports rituals as ICS file
 * 4. Validates ICS format and content
 * 5. Cleans up test data
 */

const BASE_URL = 'http://localhost:3000';

// Helper function to make authenticated requests
async function makeRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  return response;
}

// Test user credentials
const testEmail = `test-ritual-export-${Date.now()}@example.com`;
const testPassword = 'SecurePassword123!';

console.log('🧪 Testing Ritual ICS Export Endpoint\n');

try {
  // Step 1: Create test user
  console.log('1️⃣  Creating test user...');
  const signupResponse = await makeRequest(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
    }),
  });

  if (!signupResponse.ok) {
    const error = await signupResponse.json();
    throw new Error(`Signup failed: ${error.message}`);
  }
  console.log('✅ Test user created\n');

  // Step 2: Login to get session cookie
  console.log('2️⃣  Logging in...');
  const loginResponse = await makeRequest(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
    }),
  });

  if (!loginResponse.ok) {
    const error = await loginResponse.json();
    throw new Error(`Login failed: ${error.message}`);
  }

  const sessionCookie = loginResponse.headers.get('set-cookie');
  if (!sessionCookie) {
    throw new Error('No session cookie received');
  }
  console.log('✅ Logged in successfully\n');

  // Step 3: Create multiple ritual instances
  console.log('3️⃣  Creating ritual instances...');
  const rituals = [
    {
      title: 'Morning Meditation',
      description: 'Daily morning meditation practice',
      scheduledAt: new Date('2024-01-15T06:00:00Z').toISOString(),
    },
    {
      title: 'Full Moon Ritual',
      description: 'Monthly full moon ceremony with candles and incense',
      scheduledAt: new Date('2024-01-25T20:00:00Z').toISOString(),
    },
    {
      title: 'Evening Reflection',
      description: null, // Test with null description
      scheduledAt: new Date('2024-01-20T18:00:00Z').toISOString(),
    },
  ];

  const createdRituals = [];
  for (const ritual of rituals) {
    const createResponse = await makeRequest(`${BASE_URL}/api/rituals`, {
      method: 'POST',
      headers: {
        Cookie: sessionCookie,
      },
      body: JSON.stringify(ritual),
    });

    if (!createResponse.ok) {
      const error = await createResponse.json();
      throw new Error(`Failed to create ritual: ${error.message}`);
    }

    const created = await createResponse.json();
    createdRituals.push(created);
    console.log(`   ✓ Created: ${created.title}`);
  }
  console.log('✅ All rituals created\n');

  // Step 4: Export rituals as ICS
  console.log('4️⃣  Exporting rituals as ICS...');
  const exportResponse = await makeRequest(`${BASE_URL}/api/rituals/export`, {
    method: 'GET',
    headers: {
      Cookie: sessionCookie,
    },
  });

  if (!exportResponse.ok) {
    const error = await exportResponse.json();
    throw new Error(`Export failed: ${error.message}`);
  }

  // Verify Content-Type header
  const contentType = exportResponse.headers.get('content-type');
  if (!contentType || !contentType.includes('text/calendar')) {
    throw new Error(`Invalid Content-Type: ${contentType}`);
  }
  console.log(`   ✓ Content-Type: ${contentType}`);

  // Verify Content-Disposition header
  const contentDisposition = exportResponse.headers.get('content-disposition');
  if (!contentDisposition || !contentDisposition.includes('attachment')) {
    throw new Error(`Invalid Content-Disposition: ${contentDisposition}`);
  }
  console.log(`   ✓ Content-Disposition: ${contentDisposition}`);

  // Get ICS content
  const icsContent = await exportResponse.text();
  console.log('✅ ICS file exported\n');

  // Step 5: Validate ICS format
  console.log('5️⃣  Validating ICS format...');
  
  // Check ICS structure
  if (!icsContent.startsWith('BEGIN:VCALENDAR')) {
    throw new Error('ICS file does not start with BEGIN:VCALENDAR');
  }
  console.log('   ✓ Valid ICS header');

  if (!icsContent.includes('END:VCALENDAR')) {
    throw new Error('ICS file does not end with END:VCALENDAR');
  }
  console.log('   ✓ Valid ICS footer');

  // Check for required ICS properties
  const requiredProps = ['VERSION:2.0', 'PRODID:', 'CALSCALE:GREGORIAN'];
  for (const prop of requiredProps) {
    if (!icsContent.includes(prop)) {
      throw new Error(`Missing required property: ${prop}`);
    }
  }
  console.log('   ✓ Required properties present');

  // Check for VEVENT entries
  const veventCount = (icsContent.match(/BEGIN:VEVENT/g) || []).length;
  if (veventCount !== rituals.length) {
    throw new Error(`Expected ${rituals.length} VEVENTs, found ${veventCount}`);
  }
  console.log(`   ✓ Found ${veventCount} VEVENT entries`);

  // Validate each ritual is in the ICS
  for (const ritual of rituals) {
    if (!icsContent.includes(ritual.title)) {
      throw new Error(`Ritual title not found in ICS: ${ritual.title}`);
    }
    console.log(`   ✓ Found ritual: ${ritual.title}`);

    // Check DTSTART is present
    const dtstart = icsContent.match(/DTSTART:(\d{8}T\d{6}Z)/);
    if (!dtstart) {
      throw new Error('DTSTART not found or invalid format');
    }
  }

  // Check description handling
  if (icsContent.includes('Morning Meditation')) {
    if (!icsContent.includes('DESCRIPTION:Daily morning meditation practice')) {
      throw new Error('Description not found for Morning Meditation');
    }
    console.log('   ✓ Description included for rituals with descriptions');
  }

  console.log('✅ ICS format validated\n');

  // Step 6: Test authentication requirement
  console.log('6️⃣  Testing authentication requirement...');
  const unauthResponse = await makeRequest(`${BASE_URL}/api/rituals/export`, {
    method: 'GET',
  });

  if (unauthResponse.ok) {
    throw new Error('Export endpoint should require authentication');
  }

  if (unauthResponse.status !== 401) {
    throw new Error(`Expected 401, got ${unauthResponse.status}`);
  }
  console.log('✅ Authentication required\n');

  // Step 7: Cleanup - Delete created rituals
  console.log('7️⃣  Cleaning up test data...');
  for (const ritual of createdRituals) {
    const deleteResponse = await makeRequest(`${BASE_URL}/api/rituals/${ritual.id}`, {
      method: 'DELETE',
      headers: {
        Cookie: sessionCookie,
      },
    });

    if (!deleteResponse.ok) {
      console.warn(`   ⚠️  Failed to delete ritual ${ritual.id}`);
    }
  }
  console.log('✅ Test data cleaned up\n');

  console.log('🎉 All tests passed!\n');
  console.log('📄 Sample ICS content:');
  console.log('─'.repeat(60));
  console.log(icsContent.substring(0, 500) + '...\n');

} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}
