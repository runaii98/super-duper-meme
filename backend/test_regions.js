/**
 * Simple Regions Test Script
 * 
 * This script tests both AWS and GCP regions endpoints
 */

const axios = require('axios');

async function testRegions() {
  console.log('===== Testing Cloud Provider Regions =====\n');
  
  // Test AWS regions endpoint
  console.log('Testing AWS regions endpoint...');
  try {
    const awsResponse = await axios.get('http://localhost:3006/api/providers/aws/regions');
    console.log('AWS regions response status:', awsResponse.status);
    console.log('AWS regions count:', awsResponse.data.length);
    console.log('First 3 AWS regions:', awsResponse.data.slice(0, 3));
  } catch (error) {
    console.error('AWS regions error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
  
  console.log('\nTesting GCP regions endpoint...');
  try {
    const gcpResponse = await axios.get('http://localhost:3006/api/providers/gcp/regions');
    console.log('GCP regions response status:', gcpResponse.status);
    console.log('GCP regions count:', gcpResponse.data.length);
    console.log('First 3 GCP regions:', gcpResponse.data.slice(0, 3));
  } catch (error) {
    console.error('GCP regions error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }

  // Test AWS regions directly to see if it's a credential issue
  console.log('\nTesting AWS service directly...');
  try {
    // First, check what AWS regions route exists
    console.log('Testing various AWS regions route patterns...');
    
    // Try different patterns
    const patterns = [
      '/api/aws/regions',
      '/api/providers/aws/regions'
    ];
    
    for (const pattern of patterns) {
      try {
        console.log(`Testing pattern: ${pattern}`);
        const response = await axios.get(`http://localhost:3006${pattern}`);
        console.log(`SUCCESS - Status: ${response.status}, Data count: ${response.data.length}`);
      } catch (error) {
        console.log(`FAILED - Pattern ${pattern} error: ${error.response ? error.response.status : error.message}`);
      }
    }
  } catch (error) {
    console.error('Error testing AWS service:', error.message);
  }
}

testRegions().catch(error => {
  console.error('Script error:', error);
}); 