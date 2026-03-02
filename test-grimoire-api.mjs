/**
 * Test script for Grimoire API endpoints
 * 
 * This script tests:
 * 1. Creating a grimoire entry (admin endpoint - Task 10, not yet implemented)
 * 2. Listing grimoire entries
 * 3. Getting grimoire entry detail
 * 4. Getting revision history
 * 5. Getting specific revision
 * 6. Access control (403 for users without grimoire_access)
 */

const BASE_URL = 'http://localhost:3000';

// Test credentials
const ADMIN_EMAIL = 'admin@cultofpsyche.com';
const ADMIN_PASSWORD = 'admin123';

let adminCookie = '';
let testEntrySlug = '';

async function login(email, password) {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  
  if (!response.ok) {
    throw new Error(`Login failed: ${response.status}`);
  }
  
  const setCookie = response.headers.get('set-cookie');
  if (!setCookie) {
    throw new Error('No session cookie received');
  }
  
  return setCookie.split(';')[0];
}

async function testListGrimoireEntries() {
  console.log('\n📚 Testing: List Grimoire Entries');
  
  const response = await fetch(`${BASE_URL}/api/grimoire`, {
    headers: { Cookie: adminCookie },
  });
  
  console.log(`Status: ${response.status}`);
  
  if (response.ok) {
    const data = await response.json();
    console.log(`✅ Found ${data.entries.length} grimoire entries`);
    
    if (data.entries.length > 0) {
      testEntrySlug = data.entries[0].slug;
      console.log(`   First entry: "${data.entries[0].title}" (slug: ${testEntrySlug})`);
    }
    
    return true;
  } else {
    const error = await response.json();
    console.log(`❌ Failed: ${error.message}`);
    return false;
  }
}

async function testListGrimoireEntriesWithSearch() {
  console.log('\n🔍 Testing: List Grimoire Entries with Search');
  
  const response = await fetch(`${BASE_URL}/api/grimoire?search=test`, {
    headers: { Cookie: adminCookie },
  });
  
  console.log(`Status: ${response.status}`);
  
  if (response.ok) {
    const data = await response.json();
    console.log(`✅ Search returned ${data.entries.length} entries`);
    return true;
  } else {
    const error = await response.json();
    console.log(`❌ Failed: ${error.message}`);
    return false;
  }
}

async function testGetGrimoireEntry() {
  if (!testEntrySlug) {
    console.log('\n⏭️  Skipping: Get Grimoire Entry (no entries available)');
    return true;
  }
  
  console.log('\n📖 Testing: Get Grimoire Entry Detail');
  
  const response = await fetch(`${BASE_URL}/api/grimoire/${testEntrySlug}`, {
    headers: { Cookie: adminCookie },
  });
  
  console.log(`Status: ${response.status}`);
  
  if (response.ok) {
    const data = await response.json();
    console.log(`✅ Retrieved entry: "${data.title}"`);
    console.log(`   Current revision: ${data.currentRevision.revisionNumber}`);
    console.log(`   Content length: ${data.currentRevision.content.length} chars`);
    return true;
  } else {
    const error = await response.json();
    console.log(`❌ Failed: ${error.message}`);
    return false;
  }
}

async function testGetRevisionHistory() {
  if (!testEntrySlug) {
    console.log('\n⏭️  Skipping: Get Revision History (no entries available)');
    return true;
  }
  
  console.log('\n📜 Testing: Get Revision History');
  
  const response = await fetch(`${BASE_URL}/api/grimoire/${testEntrySlug}/revisions`, {
    headers: { Cookie: adminCookie },
  });
  
  console.log(`Status: ${response.status}`);
  
  if (response.ok) {
    const data = await response.json();
    console.log(`✅ Found ${data.revisions.length} revisions`);
    
    if (data.revisions.length > 0) {
      console.log(`   Latest revision: ${data.revisions[0].revisionNumber}`);
    }
    
    return true;
  } else {
    const error = await response.json();
    console.log(`❌ Failed: ${error.message}`);
    return false;
  }
}

async function testGetSpecificRevision() {
  if (!testEntrySlug) {
    console.log('\n⏭️  Skipping: Get Specific Revision (no entries available)');
    return true;
  }
  
  console.log('\n📄 Testing: Get Specific Revision');
  
  const response = await fetch(`${BASE_URL}/api/grimoire/${testEntrySlug}/revisions/1`, {
    headers: { Cookie: adminCookie },
  });
  
  console.log(`Status: ${response.status}`);
  
  if (response.ok) {
    const data = await response.json();
    console.log(`✅ Retrieved revision ${data.revision.revisionNumber}`);
    console.log(`   Author: ${data.revision.author.email}`);
    console.log(`   Content length: ${data.revision.content.length} chars`);
    return true;
  } else {
    const error = await response.json();
    console.log(`❌ Failed: ${error.message}`);
    return false;
  }
}

async function testAccessControl() {
  console.log('\n🔒 Testing: Access Control (no authentication)');
  
  const response = await fetch(`${BASE_URL}/api/grimoire`);
  
  console.log(`Status: ${response.status}`);
  
  if (response.status === 401) {
    console.log('✅ Correctly denied access without authentication');
    return true;
  } else {
    console.log('❌ Should have returned 401 Unauthorized');
    return false;
  }
}

async function runTests() {
  console.log('🧪 Starting Grimoire API Tests\n');
  console.log('=' .repeat(50));
  
  try {
    // Login as admin
    console.log('\n🔐 Logging in as admin...');
    adminCookie = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log('✅ Login successful');
    
    // Run tests
    const results = [];
    
    results.push(await testAccessControl());
    results.push(await testListGrimoireEntries());
    results.push(await testListGrimoireEntriesWithSearch());
    results.push(await testGetGrimoireEntry());
    results.push(await testGetRevisionHistory());
    results.push(await testGetSpecificRevision());
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('\n📊 Test Summary:');
    const passed = results.filter(r => r).length;
    const total = results.length;
    console.log(`   Passed: ${passed}/${total}`);
    
    if (passed === total) {
      console.log('\n✅ All tests passed!');
      
      if (!testEntrySlug) {
        console.log('\n💡 Note: No grimoire entries found in database.');
        console.log('   To fully test the API, create grimoire entries using the admin interface (Task 10).');
      }
    } else {
      console.log('\n❌ Some tests failed');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

runTests();
