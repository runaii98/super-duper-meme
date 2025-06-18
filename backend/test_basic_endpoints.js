/**
 * Basic API Endpoint Test Script
 * 
 * This script tests the basic API endpoints to verify the server is working correctly.
 */

const axios = require('axios');

// Configure base URL for API calls
const BASE_URL = 'http://localhost:3006';

// Utility function to log test results
function logResult(apiName, success, details = '') {
  const status = success ? '✅ PASSED' : '❌ FAILED';
  console.log(`\n[${status}] ${apiName}`);
  if (details) {
    console.log(`Details: ${details}`);
  }
}

// Helper to log steps
function logStep(step) {
  console.log(`\n🔷 ${new Date().toISOString()} - ${step}`);
}

// Test the root endpoint
async function testRootEndpoint() {
  try {
    logStep('TESTING: GET /');
    const response = await axios.get(`${BASE_URL}/`);
    console.log('Response:', response.data);
    logResult('Root Endpoint', true, 'Server is running');
    return true;
  } catch (error) {
    console.log('\n🔴 ERROR in Root Endpoint:');
    console.log('Error message:', error.message);
    logResult('Root Endpoint', false, error.message);
    return false;
  }
}

// Test the AWS regions endpoint
async function testAwsRegionsEndpoint() {
  try {
    logStep('TESTING: GET /api/providers/aws/regions');
    const response = await axios.get(`${BASE_URL}/api/providers/aws/regions`);
    console.log(`Response: Retrieved ${response.data.length} AWS regions`);
    if (response.data.length > 0) {
      console.log('Sample regions:', response.data.slice(0, 3));
    }
    logResult('AWS Regions Endpoint', true, `Successfully retrieved AWS regions`);
    return true;
  } catch (error) {
    console.log('\n🔴 ERROR in AWS Regions Endpoint:');
    console.log('Error message:', error.message);
    logResult('AWS Regions Endpoint', false, error.message);
    return false;
  }
}

// Test the GCP regions endpoint
async function testGcpRegionsEndpoint() {
  try {
    logStep('TESTING: GET /api/providers/gcp/regions');
    const response = await axios.get(`${BASE_URL}/api/providers/gcp/regions`);
    console.log(`Response: Retrieved ${response.data.length} GCP regions`);
    if (response.data.length > 0) {
      console.log('Sample regions:', response.data.slice(0, 3));
    }
    logResult('GCP Regions Endpoint', true, `Successfully retrieved GCP regions`);
    return true;
  } catch (error) {
    console.log('\n🔴 ERROR in GCP Regions Endpoint:');
    console.log('Error message:', error.message);
    logResult('GCP Regions Endpoint', false, error.message);
    return false;
  }
}

// Test the OS images endpoint
async function testOsImagesEndpoint() {
  try {
    logStep('TESTING: GET /api/v1/os-images');
    const response = await axios.get(`${BASE_URL}/api/v1/os-images`);
    console.log('Response:', response.data);
    logResult('OS Images Endpoint', true, 'Successfully retrieved OS images');
    return true;
  } catch (error) {
    console.log('\n🔴 ERROR in OS Images Endpoint:');
    console.log('Error message:', error.message);
    logResult('OS Images Endpoint', false, error.message);
    return false;
  }
}

// Test the instances endpoint
async function testInstancesEndpoint() {
  try {
    logStep('TESTING: GET /api/v1/instances');
    const response = await axios.get(`${BASE_URL}/api/v1/instances`);
    console.log('Response:', response.data);
    logResult('Instances Endpoint', true, 'Successfully retrieved instances');
    return true;
  } catch (error) {
    console.log('\n🔴 ERROR in Instances Endpoint:');
    console.log('Error message:', error.message);
    logResult('Instances Endpoint', false, error.message);
    return false;
  }
}

// Main function to run all tests
async function runTests() {
  console.log('=====================================================');
  console.log(`🚀 STARTING BASIC API ENDPOINT TESTING - ${new Date().toISOString()}`);
  console.log('=====================================================\n');

  // Run the tests in sequence
  const results = [
    { name: 'Root Endpoint', result: await testRootEndpoint() },
    { name: 'AWS Regions Endpoint', result: await testAwsRegionsEndpoint() },
    { name: 'GCP Regions Endpoint', result: await testGcpRegionsEndpoint() },
    { name: 'OS Images Endpoint', result: await testOsImagesEndpoint() },
    { name: 'Instances Endpoint', result: await testInstancesEndpoint() }
  ];

  // Generate summary report
  console.log('\n=====================================================');
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('=====================================================');

  let passCount = 0;
  let failCount = 0;

  results.forEach(test => {
    const status = test.result ? '✅ PASSED' : '❌ FAILED';
    console.log(`${status} - ${test.name}`);

    if (test.result) passCount++;
    else failCount++;
  });

  console.log('-----------------------------------------------------');
  console.log(`Total: ${results.length} | Passed: ${passCount} | Failed: ${failCount}`);
  console.log('=====================================================');
}

// Run the tests
runTests().then(() => {
  console.log('Tests completed');
}).catch(error => {
  console.error('Error running tests:', error);
}); 