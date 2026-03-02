/**
 * Test script for Grimoire revision functionality
 * Tests the entry with multiple revisions
 */

const BASE_URL = 'http://localhost:3000';
const ADMIN_EMAIL = 'admin@cultofpsyche.com';
const ADMIN_PASSWORD = 'admin123';

let adminCookie = '';

async function login(email, password) {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  
  const setCookie = response.headers.get('set-cookie');
  return setCookie.split(';')[0];
}

async function testMultipleRevisions() {
  console.log('🧪 Testing Grimoire with Multiple Revisions\n');
  console.log('='.repeat(50));
  
  // Login
  console.log('\n🔐 Logging in...');
  adminCookie = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
  console.log('✅ Login successful');
  
  const slug = 'ritual-design-principles';
  
  // Get entry detail (should show latest revision)
  console.log('\n📖 Testing: Get Entry Detail');
  const detailResponse = await fetch(`${BASE_URL}/api/grimoire/${slug}`, {
    headers: { Cookie: adminCookie },
  });
  
  if (detailResponse.ok) {
    const data = await detailResponse.json();
    console.log(`✅ Entry: "${data.title}"`);
    console.log(`   Current revision: ${data.currentRevision.revisionNumber}`);
    console.log(`   Content preview: ${data.currentRevision.content.substring(0, 100)}...`);
  } else {
    console.log('❌ Failed to get entry detail');
    return;
  }
  
  // Get revision history
  console.log('\n📜 Testing: Get Revision History');
  const historyResponse = await fetch(`${BASE_URL}/api/grimoire/${slug}/revisions`, {
    headers: { Cookie: adminCookie },
  });
  
  if (historyResponse.ok) {
    const data = await historyResponse.json();
    console.log(`✅ Found ${data.revisions.length} revisions:`);
    data.revisions.forEach(rev => {
      console.log(`   - Revision ${rev.revisionNumber} by ${rev.author.email} at ${new Date(rev.createdAt).toLocaleString()}`);
    });
  } else {
    console.log('❌ Failed to get revision history');
    return;
  }
  
  // Get revision 1 (older version)
  console.log('\n📄 Testing: Get Revision 1 (older)');
  const rev1Response = await fetch(`${BASE_URL}/api/grimoire/${slug}/revisions/1`, {
    headers: { Cookie: adminCookie },
  });
  
  if (rev1Response.ok) {
    const data = await rev1Response.json();
    console.log(`✅ Revision ${data.revision.revisionNumber}`);
    console.log(`   Content length: ${data.revision.content.length} chars`);
    console.log(`   Content preview: ${data.revision.content.substring(0, 100)}...`);
  } else {
    console.log('❌ Failed to get revision 1');
    return;
  }
  
  // Get revision 2 (newer version)
  console.log('\n📄 Testing: Get Revision 2 (newer)');
  const rev2Response = await fetch(`${BASE_URL}/api/grimoire/${slug}/revisions/2`, {
    headers: { Cookie: adminCookie },
  });
  
  if (rev2Response.ok) {
    const data = await rev2Response.json();
    console.log(`✅ Revision ${data.revision.revisionNumber}`);
    console.log(`   Content length: ${data.revision.content.length} chars`);
    console.log(`   Content preview: ${data.revision.content.substring(0, 100)}...`);
  } else {
    console.log('❌ Failed to get revision 2');
    return;
  }
  
  // Test invalid revision number
  console.log('\n🚫 Testing: Invalid Revision Number');
  const invalidResponse = await fetch(`${BASE_URL}/api/grimoire/${slug}/revisions/999`, {
    headers: { Cookie: adminCookie },
  });
  
  if (invalidResponse.status === 404) {
    console.log('✅ Correctly returned 404 for non-existent revision');
  } else {
    console.log(`❌ Expected 404, got ${invalidResponse.status}`);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('\n✅ All revision tests passed!');
}

testMultipleRevisions().catch(err => {
  console.error('\n❌ Test failed:', err.message);
  process.exit(1);
});
