#!/usr/bin/env node

/**
 * Test login against production Vercel deployment
 */

async function testLogin() {
  const url = 'https://cultcodex-26.vercel.app/api/user-login';
  
  const credentials = {
    email: 'admin@cultofpsyche.com',
    password: 'CultAdmin2026!'
  };

  console.log('🧪 Testing production login...\n');
  console.log('URL:', url);
  console.log('Email:', credentials.email);
  console.log('Password:', credentials.password);
  console.log('\n' + '='.repeat(50) + '\n');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    console.log('Status:', response.status, response.statusText);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log('\nResponse body:');
    console.log(JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ Login successful!');
    } else {
      console.log('\n❌ Login failed');
      
      if (data.error === 'Invalid credentials') {
        console.log('\n🔍 This means either:');
        console.log('   1. User not found in database');
        console.log('   2. Password hash does not match');
        console.log('   3. Prisma query is still failing');
      }
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

testLogin();
