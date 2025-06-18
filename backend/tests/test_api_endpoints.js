/**
 * API Endpoint Test Script
 * 
 * This script tests all the API endpoints by provisioning a VM and then 
 * using all the relevant APIs on that VM.
 */

const axios = require('axios');
const fs = require('fs');
const crypto = require('crypto');
const fetch = require('node-fetch');

// Configure base URL for API calls
const BASE_URL = 'http://localhost:3006/api/v1';

// Testing options
const TEST_PROVIDER = 'AWS'; // AWS or GCP (in uppercase as required by the API)
const AWS_REGION = 'us-east-1';
const GCP_ZONE = 'us-central1-a';
const VM_NAME = `test-vm-${crypto.randomBytes(4).toString('hex')}`;

// Store created instance information
let createdInstanceId = null;
let provisioningCommandId = null;

// Utility function to log test results
function logResult(apiName, success, details = '') {
  const status = success ? '✅ PASSED' : '❌ FAILED';
  console.log(`\n[${status}] ${apiName}`);
  if (details) {
    console.log(`Details: ${details}`);
  }
}

// Utility to format time
function formatTimestamp() {
  return new Date().toISOString();
}

// Helper to log steps
function logStep(step) {
  console.log(`\n🔷 ${formatTimestamp()} - ${step}`);
}

// Helper function to wait
async function wait(seconds) {
  logStep(`Waiting for ${seconds} seconds...`);
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

// Helper function to log error details
function logErrorDetail(error) {
  console.log('Error type:', error.name);
  console.log('Error message:', error.message);
  
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.log('Status:', error.response.status);
    console.log('Headers:', JSON.stringify(error.response.headers, null, 2));
    console.log('Data:', typeof error.response.data === 'string' 
      ? error.response.data.substring(0, 500) // Truncate long string responses
      : JSON.stringify(error.response.data, null, 2));
  } else if (error.request) {
    // The request was made but no response was received
    console.log('No response received. Request details:');
    console.log(error.request._currentUrl || error.request.url || 'URL not available');
  } else {
    // Something happened in setting up the request that triggered an Error
    console.log('Error setting up request:', error.message);
  }
  
  if (error.config) {
    console.log('Request config:');
    console.log('  URL:', error.config.url);
    console.log('  Method:', error.config.method.toUpperCase());
    console.log('  Headers:', JSON.stringify(error.config.headers, null, 2));
    if (error.config.data) {
      console.log('  Data:', error.config.data);
    }
  }
}

// 1. Test VM Provisioning API
async function testProvisionVM() {
  try {
    logStep('TESTING: POST /api/v1/provision-vm');
    
    // Generate a simple password for the VM
    const password = `Test${Math.floor(Math.random() * 10000)}`;
    
    const payload = {
      provider: TEST_PROVIDER,
      name: VM_NAME,
      instance_type: TEST_PROVIDER === 'AWS' ? 't2.micro' : 'e2-micro',
      region: TEST_PROVIDER === 'AWS' ? AWS_REGION : undefined,
      zone: TEST_PROVIDER === 'GCP' ? GCP_ZONE : undefined,
      osImage: 'ubuntu-22.04',
      pricingModel: 'OnDemand',
      rootDiskSizeGB: 10,
      userData: `#!/bin/bash
echo "This is a test instance created at ${formatTimestamp()}" > /tmp/test-creation-time.txt`,
      password: password
    };
    
    console.log('Request payload:', JSON.stringify(payload, null, 2));
    
    const response = await axios.post(`${BASE_URL}/provision-vm`, payload);
    
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data.instanceId) {
      createdInstanceId = response.data.instanceId;
      if (response.data.commandId) { // For tracking AWS SSM commands if applicable
        provisioningCommandId = response.data.commandId;
      }
      logResult('VM Provisioning API', true, `Instance ID: ${createdInstanceId}`);
      
      // Save instance details for future tests
      const testInfo = {
        instanceId: createdInstanceId,
        provider: TEST_PROVIDER,
        region: TEST_PROVIDER === 'AWS' ? AWS_REGION : undefined,
        zone: TEST_PROVIDER === 'GCP' ? GCP_ZONE : undefined,
        commandId: provisioningCommandId,
        createdAt: formatTimestamp()
      };
      
      fs.writeFileSync('test_instance_info.json', JSON.stringify(testInfo, null, 2));
      
      return true;
    } else {
      logResult('VM Provisioning API', false, 'Failed to get instance ID in response');
      return false;
    }
  } catch (error) {
    console.log('\n🔴 ERROR in VM Provisioning API:');
    logErrorDetail(error);
    logResult('VM Provisioning API', false, `${error.message}${error.response ? '. Response: ' + JSON.stringify(error.response.data) : ''}`);
    return false;
  }
}

// 2. Test Instance Info API
async function testDescribeInstance() {
  try {
    logStep('TESTING: GET /api/v1/instances/:instanceId');
    
    if (!createdInstanceId) {
      logResult('Describe Instance API', false, 'No instance ID available for testing');
      return false;
    }
    
    // Build query parameters
    const params = new URLSearchParams();
    params.append('provider', TEST_PROVIDER);
    if (TEST_PROVIDER === 'AWS') {
      params.append('region', AWS_REGION);
    } else {
      params.append('zone', GCP_ZONE);
    }
    
    const response = await axios.get(`${BASE_URL}/instances/${createdInstanceId}?${params.toString()}`);
    
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    logResult('Describe Instance API', true, `Retrieved details for instance ${createdInstanceId}`);
    return true;
  } catch (error) {
    console.log('\n🔴 ERROR in Describe Instance API:');
    logErrorDetail(error);
    logResult('Describe Instance API', false, `${error.message}${error.response ? '. Response: ' + JSON.stringify(error.response.data) : ''}`);
    return false;
  }
}

// 3. Test Console Output API
async function testConsoleOutput() {
  try {
    logStep('TESTING: GET /api/v1/instances/:instanceId/console-output');
    
    if (!createdInstanceId) {
      logResult('Console Output API', false, 'No instance ID available for testing');
      return false;
    }
    
    // Build query parameters
    const params = new URLSearchParams();
    params.append('provider', TEST_PROVIDER);
    if (TEST_PROVIDER === 'AWS') {
      params.append('region', AWS_REGION);
    } else {
      params.append('zone', GCP_ZONE);
    }
    
    const response = await axios.get(`${BASE_URL}/instances/${createdInstanceId}/console-output?${params.toString()}`);
    
    // Console output can be large, so just log length
    console.log(`Response: Received ${response.data.length} bytes of console output`);
    
    logResult('Console Output API', true, `Retrieved console output for instance ${createdInstanceId}`);
    return true;
  } catch (error) {
    console.log('\n🔴 ERROR in Console Output API:');
    logErrorDetail(error);
    // Console output might not be available right away, especially for fresh instances
    const errorMsg = `${error.message}${error.response ? '. Response: ' + JSON.stringify(error.response.data) : ''}`;
    
    if (error.response && error.response.status === 404) {
      logResult('Console Output API', false, `Console output not available yet: ${errorMsg}`);
    } else {
      logResult('Console Output API', false, errorMsg);
    }
    return false;
  }
}

// 4. Test Instance Metrics API
async function testInstanceMetrics() {
  try {
    logStep('TESTING: GET /api/v1/instances/:instanceId/metrics');
    
    if (!createdInstanceId) {
      logResult('Instance Metrics API', false, 'No instance ID available for testing');
      return false;
    }
    
    // Build query parameters
    const params = new URLSearchParams();
    params.append('provider', TEST_PROVIDER);
    if (TEST_PROVIDER === 'AWS') {
      params.append('region', AWS_REGION);
      params.append('namespace', 'AWS/EC2'); // For AWS
    } else {
      params.append('zone', GCP_ZONE);
      // GCP namespace would go here if needed
    }
    
    const response = await axios.get(`${BASE_URL}/instances/${createdInstanceId}/metrics?${params.toString()}`);
    
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    logResult('Instance Metrics API', true, `Retrieved metrics for instance ${createdInstanceId}`);
    return true;
  } catch (error) {
    console.log('\n🔴 ERROR in Instance Metrics API:');
    logErrorDetail(error);
    // Metrics might not be available immediately
    const errorMsg = `${error.message}${error.response ? '. Response: ' + JSON.stringify(error.response.data) : ''}`;
    logResult('Instance Metrics API', false, errorMsg);
    return false;
  }
}

// 5. Test Log Streams API
async function testLogStreams() {
  try {
    logStep('TESTING: GET /api/v1/instances/:instanceId/log-groups/:logGroupName/streams');
    
    if (!createdInstanceId) {
      logResult('Log Streams API', false, 'No instance ID available for testing');
      return false;
    }
    
    // Build query parameters
    const params = new URLSearchParams();
    params.append('provider', TEST_PROVIDER);
    if (TEST_PROVIDER === 'AWS') {
      params.append('region', AWS_REGION);
    } else {
      params.append('zone', GCP_ZONE);
    }
    
    // For testing, we'll use a common log group name
    const logGroupName = TEST_PROVIDER === 'AWS' ? 'cloud-init-output' : 'syslog';
    
    const response = await axios.get(`${BASE_URL}/instances/${createdInstanceId}/log-groups/${logGroupName}/streams?${params.toString()}`);
    
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    logResult('Log Streams API', true, `Retrieved log streams for instance ${createdInstanceId}, log group ${logGroupName}`);
    return true;
  } catch (error) {
    console.log('\n🔴 ERROR in Log Streams API:');
    logErrorDetail(error);
    // Log streams might not be available immediately after instance creation
    const errorMsg = `${error.message}${error.response ? '. Response: ' + JSON.stringify(error.response.data) : ''}`;
    logResult('Log Streams API', false, errorMsg);
    return false;
  }
}

// 6. Test Monitoring Agent Configuration API
async function testConfigureMonitoring() {
  try {
    logStep('TESTING: POST /api/v1/monitoring/instances/:instanceId/configure');
    
    if (!createdInstanceId) {
      logResult('Configure Monitoring API', false, 'No instance ID available for testing');
      return false;
    }
    
    // Example AWS CloudWatch Agent configuration
    const awsConfig = {
      agent: {
        metrics_collection_interval: 60,
        run_as_user: "cwagent"
      },
      metrics: {
        metrics_collected: {
          cpu: {
            measurement: ["cpu_usage_idle", "cpu_usage_user", "cpu_usage_system"],
            metrics_collection_interval: 60,
            totalcpu: true
          },
          disk: {
            measurement: ["used_percent"],
            metrics_collection_interval: 60,
            resources: ["*"]
          },
          mem: {
            measurement: ["mem_used_percent"],
            metrics_collection_interval: 60
          }
        }
      }
    };
    
    // Simple GCP monitoring configuration (placeholder)
    const gcpConfig = {
      metrics: ["cpu", "memory", "disk"],
      logging: true,
      interval: 60
    };
    
    const payload = {
      provider: TEST_PROVIDER,
      region: TEST_PROVIDER === 'AWS' ? AWS_REGION : GCP_ZONE, // Use region for both in this API
      agentConfiguration: TEST_PROVIDER === 'AWS' ? awsConfig : gcpConfig
    };
    
    console.log('Request payload:', JSON.stringify(payload, null, 2));
    
    const response = await axios.post(`${BASE_URL}/monitoring/instances/${createdInstanceId}/configure`, payload);
    
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data.commandId) {
      provisioningCommandId = response.data.commandId; // Save command ID for next test
    }
    
    logResult('Configure Monitoring API', true, `Configured monitoring for instance ${createdInstanceId}`);
    return true;
  } catch (error) {
    console.log('\n🔴 ERROR in Configure Monitoring API:');
    logErrorDetail(error);
    const errorMsg = `${error.message}${error.response ? '. Response: ' + JSON.stringify(error.response.data) : ''}`;
    logResult('Configure Monitoring API', false, errorMsg);
    return false;
  }
}

// 7. Test Monitoring Agent Status API
async function testMonitoringStatus() {
  try {
    logStep('TESTING: GET /api/v1/monitoring/instances/:instanceId/agent-status');
    
    if (!createdInstanceId) {
      logResult('Monitoring Status API', false, 'No instance ID available for testing');
      return false;
    }
    
    if (TEST_PROVIDER === 'AWS' && !provisioningCommandId) {
      logResult('Monitoring Status API', false, 'No command ID available for AWS testing');
      return false;
    }
    
    // Build query parameters
    const params = new URLSearchParams();
    params.append('provider', TEST_PROVIDER);
    if (TEST_PROVIDER === 'AWS') {
      params.append('region', AWS_REGION);
      params.append('commandId', provisioningCommandId);
    } else {
      params.append('region', GCP_ZONE); // This API uses 'region' for both providers
    }
    
    const response = await axios.get(`${BASE_URL}/monitoring/instances/${createdInstanceId}/agent-status?${params.toString()}`);
    
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    logResult('Monitoring Status API', true, `Retrieved monitoring status for instance ${createdInstanceId}`);
    return true;
  } catch (error) {
    console.log('\n🔴 ERROR in Monitoring Status API:');
    logErrorDetail(error);
    const errorMsg = `${error.message}${error.response ? '. Response: ' + JSON.stringify(error.response.data) : ''}`;
    logResult('Monitoring Status API', false, errorMsg);
    return false;
  }
}

// Test Authentication API - Signup
async function testAuthSignup() {
  try {
    logStep('TESTING: POST /api/v1/auth/signup');
    
    const username = `testuser_${crypto.randomBytes(4).toString('hex')}`;
    const email = `${username}@example.com`;
    const password = 'Password123!';
    
    const payload = { username, email, password };
    
    console.log('Request payload:', JSON.stringify({ ...payload, password: '********' }, null, 2));
    
    const response = await axios.post(`${BASE_URL}/auth/signup`, payload);
    
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    // Save user details for login test
    fs.writeFileSync('test_user_info.json', JSON.stringify({ username, email, password }, null, 2));
    
    logResult('Auth Signup API', true, `Created user ${username}`);
    return true;
  } catch (error) {
    console.log('\n🔴 ERROR in Auth Signup API:');
    logErrorDetail(error);
    const errorMsg = `${error.message}${error.response ? '. Response: ' + JSON.stringify(error.response.data) : ''}`;
    logResult('Auth Signup API', false, errorMsg);
    return false;
  }
}

// Test Authentication API - Login
async function testAuthLogin() {
  try {
    logStep('TESTING: POST /api/v1/auth/login');
    
    let userInfo;
    try {
      userInfo = JSON.parse(fs.readFileSync('test_user_info.json', 'utf8'));
    } catch (err) {
      logResult('Auth Login API', false, 'No user info available for testing');
      return false;
    }
    
    const payload = { 
      usernameOrEmail: userInfo.username, 
      password: userInfo.password 
    };
    
    console.log('Request payload:', JSON.stringify({ ...payload, password: '********' }, null, 2));
    
    const response = await axios.post(`${BASE_URL}/auth/login`, payload);
    
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    logResult('Auth Login API', true, `Logged in as ${userInfo.username}`);
    return true;
  } catch (error) {
    console.log('\n🔴 ERROR in Auth Login API:');
    logErrorDetail(error);
    const errorMsg = `${error.message}${error.response ? '. Response: ' + JSON.stringify(error.response.data) : ''}`;
    logResult('Auth Login API', false, errorMsg);
    return false;
  }
}

// Test the cached-vm-instances endpoint and compare with fetch-vm-provider
async function testCachedVmInstances() {
  console.log('Testing cached-vm-instances endpoint...');
  
  // First, check if the server is running and responding
  try {
    console.log('\n--- Checking server health ---');
    const response = await axios.get('http://localhost:3006/api/v1/health');
    console.log('Server health check:', response.status === 200 ? 'OK' : 'Failed');
  } catch (error) {
    console.error('Server health check failed:', error.message);
    console.log('Is the server running on port 3006?');
  }
  
  // First, test the fetch-vm-provider endpoint with different parameters
  try {
    console.log('\n--- Testing fetch-vm-provider endpoint (AWS) ---');
    
    const params = {
      vCPU: 2,  // Try with lower requirements
      ramGB: 4,
      provider: 'AWS', // Use uppercase
      preference: 'price' // Add preference parameter
    };
    
    const response = await axios.post('http://localhost:3006/api/providers/fetch-vm-provider', params);
    console.log('Response status:', response.status);
    console.log('Success:', response.data.success);
    
    if (response.data.success) {
      console.log('Total results:', response.data.totalResults);
      console.log('Categories:', Object.keys(response.data.categorizedResults));
      
      // Show number of instances per category
      Object.keys(response.data.categorizedResults).forEach(category => {
        const count = response.data.categorizedResults[category].length;
        console.log(`  - ${category}: ${count} instances`);
        
        // Show first instance as example
        if (count > 0) {
          const instance = response.data.categorizedResults[category][0];
          console.log(`    Example: ${instance.instance_type}, vCPU: ${instance.vcpu}, RAM: ${instance.ram_gb}GB, Price: $${instance.total_price_per_hour}/hr`);
        }
      });
    } else {
      console.log('Error:', response.data.error);
    }
  } catch (error) {
    console.error('Error testing fetch-vm-provider endpoint:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
  
  // Try with GCP
  try {
    console.log('\n--- Testing fetch-vm-provider endpoint (GCP) ---');
    
    const params = {
      vCPU: 2,  // Try with lower requirements
      ramGB: 4,
      provider: 'GCP', // Use uppercase
      preference: 'price' // Add preference parameter
    };
    
    const response = await axios.post('http://localhost:3006/api/providers/fetch-vm-provider', params);
    console.log('Response status:', response.status);
    console.log('Success:', response.data.success);
    
    if (response.data.success) {
      console.log('Total results:', response.data.totalResults);
      console.log('Categories:', Object.keys(response.data.categorizedResults));
      
      // Show number of instances per category
      Object.keys(response.data.categorizedResults).forEach(category => {
        const count = response.data.categorizedResults[category].length;
        console.log(`  - ${category}: ${count} instances`);
        
        // Show first instance as example
        if (count > 0) {
          const instance = response.data.categorizedResults[category][0];
          console.log(`    Example: ${instance.instance_type}, vCPU: ${instance.vcpu}, RAM: ${instance.ram_gb}GB, Price: $${instance.total_price_per_hour}/hr`);
        }
      });
    } else {
      console.log('Error:', response.data.error);
    }
  } catch (error) {
    console.error('Error testing fetch-vm-provider endpoint for GCP:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
  
  // Test with AWS provider and us-east-1 region - uppercase provider
  try {
    console.log('\n--- Testing AWS cached instances (uppercase provider) ---');
    const response = await fetch('http://localhost:3006/api/providers/cached-vm-instances?provider=AWS&region=us-east-1');
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Success:', data.success);
    
    if (!data.success) {
      console.log('Error message:', data.error || 'No error message provided');
      throw new Error('API returned success: false');
    }
    
    // Check if we have categories or directly instances
    if (data.categories) {
      console.log('Categories:', data.categories);
    }
    
    // Log the number of instances in each category
    if (data.instances) {
      if (typeof data.instances === 'object' && !Array.isArray(data.instances)) {
        // If instances is an object with categories as keys
        console.log('\nInstance counts by category:');
        Object.keys(data.instances).forEach(category => {
          console.log(`  - Category ${category}: ${data.instances[category].length} instances`);
          
          // Print a sample instance from each category
          if (data.instances[category].length > 0) {
            const instance = data.instances[category][0];
            console.log(`    Example: ${instance.instance_type}, vCPU: ${instance.vcpu}, RAM: ${instance.ram_gb}GB, Price: $${instance.total_price_per_hour}/hr`);
          }
        });
      } else if (Array.isArray(data.instances)) {
        // If instances is an array (when using category parameter)
        console.log(`\nFound ${data.instances.length} instances`);
        if (data.instances.length > 0) {
          const instance = data.instances[0];
          console.log(`Example: ${instance.instance_type}, vCPU: ${instance.vcpu}, RAM: ${instance.ram_gb}GB, Price: $${instance.total_price_per_hour}/hr`);
        }
      } else {
        console.log('Unexpected instances data format:', typeof data.instances);
      }
    } else {
      console.log('No instances data found in the response');
    }
  } catch (error) {
    console.error('Error testing AWS cached instances:', error);
  }
  
  // Test with GCP provider and us-central1 region
  try {
    console.log('\n--- Testing GCP cached instances (uppercase provider) ---');
    const response = await fetch('http://localhost:3006/api/providers/cached-vm-instances?provider=GCP&region=us-central1');
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Success:', data.success);
    
    if (!data.success) {
      console.log('Error message:', data.error || 'No error message provided');
      throw new Error('API returned success: false');
    }
    
    // Check if we have categories or directly instances
    if (data.categories) {
      console.log('Categories:', data.categories);
    }
    
    // Log the number of instances in each category
    if (data.instances) {
      if (typeof data.instances === 'object' && !Array.isArray(data.instances)) {
        // If instances is an object with categories as keys
        console.log('\nInstance counts by category:');
        Object.keys(data.instances).forEach(category => {
          console.log(`  - Category ${category}: ${data.instances[category].length} instances`);
          
          // Print a sample instance from each category
          if (data.instances[category].length > 0) {
            const instance = data.instances[category][0];
            console.log(`    Example: ${instance.instance_type}, vCPU: ${instance.vcpu}, RAM: ${instance.ram_gb}GB, Price: $${instance.total_price_per_hour}/hr`);
          }
        });
      } else if (Array.isArray(data.instances)) {
        // If instances is an array (when using category parameter)
        console.log(`\nFound ${data.instances.length} instances`);
        if (data.instances.length > 0) {
          const instance = data.instances[0];
          console.log(`Example: ${instance.instance_type}, vCPU: ${instance.vcpu}, RAM: ${instance.ram_gb}GB, Price: $${instance.total_price_per_hour}/hr`);
        }
      } else {
        console.log('Unexpected instances data format:', typeof data.instances);
      }
    } else {
      console.log('No instances data found in the response');
    }
  } catch (error) {
    console.error('Error testing GCP cached instances:', error);
  }
  
  // Test with a specific category - try with full name "Graphics Processing Units"
  try {
    console.log('\n--- Testing with specific category (Graphics Processing Units) with uppercase provider ---');
    const response = await fetch('http://localhost:3006/api/providers/cached-vm-instances?provider=AWS&category=Graphics%20Processing%20Units');
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Success:', data.success);
    
    if (!data.success) {
      console.log('Error message:', data.error || 'No error message provided');
      throw new Error('API returned success: false');
    }
    
    console.log('Category requested:', 'Graphics Processing Units');
    console.log('Category in response:', data.category);
    
    // Handle the response based on its structure
    if (Array.isArray(data.instances)) {
      console.log('Number of instances:', data.instances.length);
      
      // Print first instance if available
      if (data.instances.length > 0) {
        const instance = data.instances[0];
        console.log(`Example GPU instance: ${instance.instance_type}, vCPU: ${instance.vcpu}, RAM: ${instance.ram_gb}GB, GPU: ${instance.gpu_type || 'N/A'}, Price: $${instance.total_price_per_hour}/hr`);
      }
    } else if (typeof data.instances === 'object' && data.instances !== null) {
      console.log('Instances returned as categories object instead of array');
      if (data.instances['Graphics Processing Units']) {
        console.log('Number of GPU instances:', data.instances['Graphics Processing Units'].length);
        if (data.instances['Graphics Processing Units'].length > 0) {
          const instance = data.instances['Graphics Processing Units'][0];
          console.log(`Example GPU instance: ${instance.instance_type}, vCPU: ${instance.vcpu}, RAM: ${instance.ram_gb}GB, GPU: ${instance.gpu_type || 'N/A'}, Price: $${instance.total_price_per_hour}/hr`);
        }
      } else {
        console.log('No "Graphics Processing Units" category found in instances object');
      }
    } else {
      console.log('Unexpected or missing instances data format');
    }
  } catch (error) {
    console.error('Error testing cached GPU instances:', error);
  }
}

// Test GCP Regions API with dynamic credentials
async function testGcpRegions() {
  try {
    logStep('TESTING: GET /api/providers/gcp/regions');
    
    const response = await axios.get('http://localhost:3006/api/providers/gcp/regions');
    
    console.log(`Response: Retrieved ${response.data.length} GCP regions`);
    if (response.data.length > 0) {
      console.log('Sample regions:', response.data.slice(0, 3));
    }
    
    logResult('GCP Regions API', true, `Successfully retrieved GCP regions with dynamic credentials`);
    return true;
  } catch (error) {
    console.log('\n🔴 ERROR in GCP Regions API:');
    logErrorDetail(error);
    logResult('GCP Regions API', false, `${error.message}${error.response ? '. Response: ' + JSON.stringify(error.response.data) : ''}`);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('=====================================================');
  console.log(`🚀 STARTING API ENDPOINT TESTING - ${formatTimestamp()}`);
  console.log('=====================================================');
  console.log(`Provider: ${TEST_PROVIDER}`);
  console.log(`Location: ${TEST_PROVIDER === 'AWS' ? AWS_REGION : GCP_ZONE}`);
  console.log('=====================================================\n');
  
  // First, test GCP Regions with dynamic credentials
  await testGcpRegions();
  
  // 1. Try loading saved instance ID if available (for resuming tests)
  try {
    const testInfo = JSON.parse(fs.readFileSync('test_instance_info.json', 'utf8'));
    createdInstanceId = testInfo.instanceId;
    provisioningCommandId = testInfo.commandId;
    
    console.log(`Loaded existing test instance ID: ${createdInstanceId}`);
    console.log(`Created at: ${testInfo.createdAt}`);
    
  } catch (err) {
    console.log('No existing test instance found. Will create a new one.');
  }
  
  // Track test results
  const results = [];
  
  // 2. Run the tests in sequence
  
  // First test authentication APIs (these don't depend on VM)
  results.push({ name: 'Auth Signup API', result: await testAuthSignup() });
  results.push({ name: 'Auth Login API', result: await testAuthLogin() });
  results.push({ name: 'GCP Regions API', result: await testGcpRegions() });
  
  // Then test VM provisioning if needed
  if (!createdInstanceId) {
    results.push({ name: 'VM Provisioning API', result: await testProvisionVM() });
    
    if (createdInstanceId) {
      console.log(`\n⏳ Waiting for instance ${createdInstanceId} to initialize (60 seconds)...`);
      await wait(60); // Wait for VM to initialize before testing other APIs
    } else {
      console.log('\n❌ Failed to create test VM. Skipping VM-dependent tests.');
    }
  }
  
  // Only run VM-dependent tests if we have a VM
  if (createdInstanceId) {
    results.push({ name: 'Describe Instance API', result: await testDescribeInstance() });
    results.push({ name: 'Console Output API', result: await testConsoleOutput() });
    results.push({ name: 'Instance Metrics API', result: await testInstanceMetrics() });
    results.push({ name: 'Log Streams API', result: await testLogStreams() });
    results.push({ name: 'Configure Monitoring API', result: await testConfigureMonitoring() });
    
    if (TEST_PROVIDER === 'AWS' && !provisioningCommandId) {
      console.log('\n⚠️ No command ID available for AWS. Skipping monitoring status test.');
    } else {
      console.log('\n⏳ Waiting for monitoring agent configuration to apply (30 seconds)...');
      await wait(30);
      results.push({ name: 'Monitoring Status API', result: await testMonitoringStatus() });
    }
  }
  
  // 3. Generate summary report
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
  
  if (createdInstanceId) {
    console.log(`\n🖥️ Test VM Created: ${createdInstanceId} (${TEST_PROVIDER.toUpperCase()})`);
    console.log('Note: This VM will continue to run and incur charges. You may want to terminate it manually.');
  }
  
  console.log(`\n🏁 Testing completed at ${formatTimestamp()}`);
}

// Run the tests
// runTests().then(() => {
//   console.log('Tests completed');
// }).catch(error => {
//   console.error('Error running tests:', error);
// });

// Only run the cached VM instances test
testCachedVmInstances().then(() => {
  console.log('Cached VM instances test completed');
}).catch(error => {
  console.error('Error testing cached VM instances:', error);
}); 