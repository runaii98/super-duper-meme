const axios = require('axios');

async function testGcpRegions() {
  console.log('Testing GCP Regions API with dynamic credentials...');
  try {
    const response = await axios.get('http://localhost:3006/api/providers/gcp/regions');
    
    console.log(`✅ Success! Retrieved ${response.data.length} GCP regions`);
    console.log('Sample regions:', response.data.slice(0, 3));
    
    return true;
  } catch (error) {
    console.error('❌ Error accessing GCP Regions API:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error message:', error.message);
    }
    return false;
  }
}

// Run the test
testGcpRegions()
  .then(result => {
    console.log(`\nTest ${result ? 'PASSED' : 'FAILED'}`);
    process.exit(result ? 0 : 1);
  })
  .catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
  }); 