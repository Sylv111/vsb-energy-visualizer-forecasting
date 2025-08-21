const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Wait a bit for server to start
setTimeout(async () => {
  await runTests();
}, 2000);

async function testCSVUpload() {
  try {
    console.log('Testing CSV upload API...');
    
    // Create a test CSV file
    const testCSV = `Date,Temperature,Humidity
2024-01-01,25.5,60
2024-01-02,26.2,58
2024-01-03,24.8,65`;
    
    const testFilePath = path.join(__dirname, 'test.csv');
    fs.writeFileSync(testFilePath, testCSV);
    
    // Create form data
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFilePath));
    formData.append('hasHeader', 'true');
    formData.append('delimiter', ',');
    formData.append('xColumn', '0');
    formData.append('yColumn', '1');
    
    // Test the API
    const response = await axios.post('http://localhost:3000/api/csv/upload', formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 10000
    });
    
    console.log('✅ API test successful!');
    console.log('Response:', response.data);
    
    // Clean up
    fs.unlinkSync(testFilePath);
    
  } catch (error) {
    console.error('❌ API test failed!');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

// Test health endpoint first
async function testHealth() {
  try {
    console.log('Testing health endpoint...');
    const response = await axios.get('http://localhost:3000/api/health');
    console.log('✅ Health check successful:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting API tests...\n');
  
  const healthOk = await testHealth();
  if (!healthOk) {
    console.log('❌ Health check failed, stopping tests');
    return;
  }
  
  console.log('\n---\n');
  await testCSVUpload();
}

runTests();

