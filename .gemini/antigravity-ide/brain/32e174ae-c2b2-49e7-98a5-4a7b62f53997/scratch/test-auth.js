const http = require('http');

const makeRequest = (options, postData) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            body: JSON.parse(data)
          });
        } catch {
          resolve({
            statusCode: res.statusCode,
            body: data
          });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
};

const run = async () => {
  try {
    // 1. Success Login
    console.log('Testing: POST /auth/login (Success)...');
    const loginRes = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { username: 'admin', password: 'password' });
    console.log('Response Status:', loginRes.statusCode);
    console.log('Response Body:', loginRes.body);

    const token = loginRes.body.token;

    // 2. Invalid Login
    console.log('\nTesting: POST /auth/login (Invalid credentials)...');
    const invalidLoginRes = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { username: 'admin', password: 'wrong_password' });
    console.log('Response Status:', invalidLoginRes.statusCode);
    console.log('Response Body:', invalidLoginRes.body);

    // 3. Bad Payload Login
    console.log('\nTesting: POST /auth/login (Bad payload)...');
    const badLoginRes = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {});
    console.log('Response Status:', badLoginRes.statusCode);
    console.log('Response Body:', badLoginRes.body);

    // 4. Success Verify
    console.log('\nTesting: GET /auth/verify (Success)...');
    const verifyRes = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/auth/verify',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('Response Status:', verifyRes.statusCode);
    console.log('Response Body:', verifyRes.body);

    // 5. Invalid Verify
    console.log('\nTesting: GET /auth/verify (Invalid token)...');
    const invalidVerifyRes = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/auth/verify',
      method: 'GET',
      headers: { 'Authorization': 'Bearer bad_token' }
    });
    console.log('Response Status:', invalidVerifyRes.statusCode);
    console.log('Response Body:', invalidVerifyRes.body);

    // 6. No Token Verify
    console.log('\nTesting: GET /auth/verify (No token)...');
    const noTokenVerifyRes = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/auth/verify',
      method: 'GET'
    });
    console.log('Response Status:', noTokenVerifyRes.statusCode);
    console.log('Response Body:', noTokenVerifyRes.body);

  } catch (error) {
    console.error('Test execution failed:', error);
  }
};

run();
