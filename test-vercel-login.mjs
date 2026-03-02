// Test login against Vercel deployment
async function testVercelLogin() {
  const url = 'https://cultcodex-2666.vercel.app/api/auth/login';
  
  console.log('Testing login at:', url);
  console.log('Credentials: admin@cultofpsyche.com / admin123\n');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@cultofpsyche.com',
        password: 'admin123',
      }),
    });

    console.log('Status:', response.status, response.statusText);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log('\nResponse body:');
    console.log(JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✓ Login successful!');
    } else {
      console.log('\n✗ Login failed');
    }
  } catch (error) {
    console.error('\n✗ Error:', error.message);
  }
}

testVercelLogin();
