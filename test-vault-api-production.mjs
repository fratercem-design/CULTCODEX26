#!/usr/bin/env node

/**
 * Test vault API on production
 */

async function testVaultAPI() {
  const baseUrl = 'https://cultcodex-2666.vercel.app';
  
  console.log('🧪 Testing Vault API on production...\n');

  // First, login to get session cookie
  console.log('1. Logging in...');
  const loginResponse = await fetch(`${baseUrl}/api/user-login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'admin@cultofpsyche.com',
      password: 'CultAdmin2026!'
    }),
  });

  if (!loginResponse.ok) {
    console.error('❌ Login failed');
    return;
  }

  const sessionCookie = loginResponse.headers.get('set-cookie');
  if (!sessionCookie) {
    console.error('❌ No session cookie received');
    return;
  }

  console.log('✅ Login successful\n');

  // Test GET /api/vault
  console.log('2. Testing GET /api/vault...');
  const vaultResponse = await fetch(`${baseUrl}/api/vault`, {
    headers: {
      'Cookie': sessionCookie,
    },
  });

  console.log('Status:', vaultResponse.status, vaultResponse.statusText);
  
  if (vaultResponse.ok) {
    const data = await vaultResponse.json();
    console.log('✅ Vault API working');
    console.log('Items found:', data.items?.length || 0);
    if (data.items?.length > 0) {
      console.log('First item:', data.items[0].title);
    }
  } else {
    console.log('❌ Vault API failed');
    const text = await vaultResponse.text();
    console.log('Response:', text.substring(0, 500));
  }

  // Test GET /api/admin/vault
  console.log('\n3. Testing GET /api/admin/vault...');
  const adminVaultResponse = await fetch(`${baseUrl}/api/admin/vault`, {
    headers: {
      'Cookie': sessionCookie,
    },
  });

  console.log('Status:', adminVaultResponse.status, adminVaultResponse.statusText);
  
  if (adminVaultResponse.ok) {
    const data = await adminVaultResponse.json();
    console.log('✅ Admin Vault API working');
    console.log('Items found:', data.items?.length || 0);
  } else {
    console.log('❌ Admin Vault API failed');
    const text = await adminVaultResponse.text();
    console.log('Response:', text.substring(0, 500));
  }
}

testVaultAPI().catch(console.error);
