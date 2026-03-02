/**
 * Test script for Vault API endpoints
 * Tests the list and detail endpoints with various scenarios
 */

const BASE_URL = 'http://localhost:3000';

async function testVaultList() {
  console.log('\n=== Testing GET /api/vault (list) ===');
  
  try {
    const response = await fetch(`${BASE_URL}/api/vault`);
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Items found:', data.items?.length || 0);
    
    if (data.items && data.items.length > 0) {
      console.log('\nFirst item:');
      console.log('  Title:', data.items[0].title);
      console.log('  Slug:', data.items[0].slug);
      console.log('  Tags:', data.items[0].tags.join(', '));
      console.log('  Required Entitlement:', data.items[0].requiredEntitlement || 'None (free)');
    }
    
    console.log('\nPagination:', data.pagination);
    console.log('✅ List endpoint working');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function testVaultSearch() {
  console.log('\n=== Testing GET /api/vault with search ===');
  
  try {
    const response = await fetch(`${BASE_URL}/api/vault?search=mindfulness`);
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Items found:', data.items?.length || 0);
    
    if (data.items && data.items.length > 0) {
      console.log('Matching items:');
      data.items.forEach(item => {
        console.log(`  - ${item.title}`);
      });
    }
    
    console.log('✅ Search working');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function testVaultDetailFree() {
  console.log('\n=== Testing GET /api/vault/[slug] (free content) ===');
  
  try {
    const response = await fetch(`${BASE_URL}/api/vault/introduction-to-mindfulness`);
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Title:', data.title);
    console.log('Content length:', data.content?.length || 0, 'characters');
    console.log('Required Entitlement:', data.requiredEntitlement || 'None (free)');
    console.log('✅ Free content accessible');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function testVaultDetailGatedNoAuth() {
  console.log('\n=== Testing GET /api/vault/[slug] (gated content, no auth) ===');
  
  try {
    const response = await fetch(`${BASE_URL}/api/vault/advanced-ritual-practices`);
    const data = await response.json();
    
    console.log('Status:', response.status);
    
    if (response.status === 403) {
      console.log('Paywall triggered:', data.paywall);
      console.log('Message:', data.message);
      console.log('Required Entitlement:', data.requiredEntitlement);
      console.log('✅ Paywall working correctly');
    } else {
      console.log('⚠️  Expected 403, got', response.status);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function testVaultDetailNotFound() {
  console.log('\n=== Testing GET /api/vault/[slug] (not found) ===');
  
  try {
    const response = await fetch(`${BASE_URL}/api/vault/nonexistent-slug`);
    const data = await response.json();
    
    console.log('Status:', response.status);
    
    if (response.status === 404) {
      console.log('Error message:', data.message);
      console.log('✅ 404 handling working');
    } else {
      console.log('⚠️  Expected 404, got', response.status);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function runTests() {
  console.log('🧪 Starting Vault API Tests');
  console.log('Make sure the dev server is running on', BASE_URL);
  
  await testVaultList();
  await testVaultSearch();
  await testVaultDetailFree();
  await testVaultDetailGatedNoAuth();
  await testVaultDetailNotFound();
  
  console.log('\n✨ All tests completed!');
}

runTests().catch(console.error);
