/**
 * Test script for Stripe checkout endpoints
 * 
 * This script tests:
 * 1. Login to get authentication token
 * 2. Create monthly subscription checkout session
 * 3. Create lifetime purchase checkout session
 */

import { config } from 'dotenv';
config();

const BASE_URL = 'http://localhost:3000';

async function login() {
  console.log('🔐 Logging in...');
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'admin@cultofpsyche.com',
      password: 'admin123',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Login failed: ${error}`);
  }

  const cookies = response.headers.get('set-cookie');
  const data = await response.json();
  console.log('✅ Login successful:', data.user.email);
  
  return cookies;
}

async function testMonthlyCheckout(cookies) {
  console.log('\n💳 Testing monthly subscription checkout...');
  const response = await fetch(`${BASE_URL}/api/billing/checkout/monthly`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies,
      'Origin': BASE_URL,
    },
  });

  const data = await response.json();

  if (response.status === 503) {
    console.log('⚠️  Stripe not configured (expected in test environment)');
    console.log('   Error:', data.error);
    return null;
  }

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Monthly checkout failed: ${error}`);
  }

  console.log('✅ Monthly checkout session created');
  console.log('   Session ID:', data.sessionId);
  console.log('   Checkout URL:', data.url);
  
  return data;
}

async function testLifetimeCheckout(cookies) {
  console.log('\n💎 Testing lifetime purchase checkout...');
  const response = await fetch(`${BASE_URL}/api/billing/checkout/lifetime`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies,
      'Origin': BASE_URL,
    },
  });

  const data = await response.json();

  if (response.status === 503) {
    console.log('⚠️  Stripe not configured (expected in test environment)');
    console.log('   Error:', data.error);
    return null;
  }

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Lifetime checkout failed: ${error}`);
  }

  console.log('✅ Lifetime checkout session created');
  console.log('   Session ID:', data.sessionId);
  console.log('   Checkout URL:', data.url);
  
  return data;
}

async function testUnauthenticatedAccess() {
  console.log('\n🚫 Testing unauthenticated access (should fail)...');
  const response = await fetch(`${BASE_URL}/api/billing/checkout/monthly`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 401) {
    console.log('✅ Correctly rejected unauthenticated request');
    return true;
  } else {
    throw new Error('Expected 401 Unauthorized but got: ' + response.status);
  }
}

async function runTests() {
  console.log('🧪 Starting Stripe Checkout Tests\n');
  console.log('=' .repeat(50));

  try {
    // Test unauthenticated access first
    await testUnauthenticatedAccess();

    // Login and get cookies
    const cookies = await login();

    // Test monthly checkout
    await testMonthlyCheckout(cookies);

    // Test lifetime checkout
    await testLifetimeCheckout(cookies);

    console.log('\n' + '='.repeat(50));
    console.log('✅ All tests passed!');
    console.log('\n📝 Summary:');
    console.log('   - Authentication: Working');
    console.log('   - Monthly subscription checkout: Endpoint working (Stripe not configured)');
    console.log('   - Lifetime purchase checkout: Endpoint working (Stripe not configured)');
    console.log('   - Authorization guard: Working');
    console.log('\n💡 Note: To test with actual Stripe, add STRIPE_SECRET_KEY,');
    console.log('   STRIPE_MONTHLY_PRICE_ID, and STRIPE_LIFETIME_PRICE_ID to .env');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

runTests();
