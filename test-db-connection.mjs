#!/usr/bin/env node

/**
 * Test Database Connection on Vercel
 * This will help diagnose the DATABASE_URL issue
 */

const VERCEL_URL = 'https://cultcodex-2666.vercel.app';

async function testConnection() {
  console.log('🔍 Testing database connection on Vercel...\n');

  try {
    // Try to hit the seed endpoint to see the actual error
    const response = await fetch(`${VERCEL_URL}/api/admin/seed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ secret: 'cultcodex-seed-secret-2024' }),
    });

    const data = await response.json();
    
    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(data, null, 2));

    if (data.details) {
      console.log('\n📋 Error Details:');
      console.log(data.details);
    }

  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

testConnection();
