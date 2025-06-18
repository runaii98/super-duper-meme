/**
 * Comprehensive Cloud Provider API Test Script
 * 
 * This script tests all cloud provider endpoints for AWS and GCP:
 * - Provider availability
 * - Region listing
 * - VM instance listing (general and by category)
 * - Error handling
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:3006/api';
const PROVIDERS = ['aws', 'gcp'];

// Helper functions
const printHeader = (message) => {
  console.log(`\n--- ${message} ---\n`);
};

const printSuccess = (message) => {
  console.log(`✅ ${message}`);
};

const printError = (message, error) => {
  console.log(`❌ ${message}`);
  if (error) {
    console.log('Error details:');
    console.log(error.response ? error.response.data : error.message);
  }
};

const printInfo = (message) => {
  console.log(`ℹ️ ${message}`);
};

const printInstanceExample = (instance) => {
  return `${instance.instance_type || instance.name}, vCPU: ${instance.vcpu}, RAM: ${instance.ram_gb || instance.memory}GB, ${instance.gpu_type ? 'GPU: ' + instance.gpu_type + ', ' : ''}Price: $${instance.total_price_per_hour || instance.price}/hr`;
};

// API test functions
async function testServerHealth() {
  printHeader('Testing Server Health');
  try {
    // Use a known working endpoint instead of a dedicated health endpoint
    const response = await axios.get(`${API_BASE_URL}/providers/gcp/regions`);
    if (response.status === 200) {
      printSuccess('Server is healthy (verified using GCP regions endpoint)');
      return true;
    } else {
      printError('Server health check failed');
      return false;
    }
  } catch (error) {
    printError('Server health check failed', error);
    return false;
  }
}

async function testProviderRegions(provider) {
  printHeader(`Testing ${provider.toUpperCase()} Regions`);
  try {
    // Use the correct path for regions endpoint: /api/providers/{provider}/regions
    const response = await axios.get(`${API_BASE_URL}/providers/${provider}/regions`);
    if (response.status === 200 && response.data && Array.isArray(response.data)) {
      printSuccess(`Retrieved ${response.data.length} ${provider.toUpperCase()} regions`);
      console.log('Sample regions:', response.data.slice(0, 3));
      return true;
    } else {
      printError(`Failed to retrieve ${provider.toUpperCase()} regions`);
      return false;
    }
  } catch (error) {
    printError(`Failed to retrieve ${provider.toUpperCase()} regions`, error);
    return false;
  }
}

async function testFetchVmProvider(provider) {
  printHeader(`Testing ${provider.toUpperCase()} VM Instances (fetch-vm-provider)`);
  try {
    const payload = {
      vCPU: 2,
      ramGB: 4,
      provider: provider.toUpperCase(),
      preference: 'price'
    };
    
    const response = await axios.post(`${API_BASE_URL}/providers/fetch-vm-provider`, payload);
    
    if (response.status === 200 && response.data && response.data.success) {
      printSuccess(`Retrieved ${provider.toUpperCase()} VM instances`);
      console.log(`Total results: ${response.data.totalResults}`);
      console.log(`Categories: ${JSON.stringify(Object.keys(response.data.categorizedResults))}`);
      
      // Print example instance from each category
      Object.keys(response.data.categorizedResults).forEach(category => {
        const categoryInstances = response.data.categorizedResults[category];
        console.log(`  - ${category}: ${categoryInstances.length} instances`);
        if (categoryInstances.length > 0) {
          const instance = categoryInstances[0];
          console.log(`    Example: ${instance.instance_type}, vCPU: ${instance.vcpu}, RAM: ${instance.ram_gb}GB, Price: $${instance.total_price_per_hour}/hr`);
        }
      });
      return true;
    } else {
      printError(`Failed to retrieve ${provider.toUpperCase()} VM instances`);
      return false;
    }
  } catch (error) {
    printError(`Failed to retrieve ${provider.toUpperCase()} VM instances`, error);
    return false;
  }
}

async function testCachedVmInstances(provider) {
  printHeader(`Testing ${provider.toUpperCase()} Cached VM Instances`);
  try {
    // Use appropriate default region based on provider
    const region = provider.toLowerCase() === 'aws' ? 'us-east-1' : 'us-central1';
    const response = await axios.get(`${API_BASE_URL}/providers/cached-vm-instances?provider=${provider.toUpperCase()}&region=${region}`);
    
    if (response.status === 200 && response.data && response.data.success) {
      printSuccess(`Retrieved ${provider.toUpperCase()} cached VM instances`);
      console.log(`Categories: ${JSON.stringify(response.data.categories)}`);
      
      // Print instance counts by category
      console.log('\nInstance counts by category:');
      
      // Check if instances is an object with categories as keys
      if (typeof response.data.instances === 'object' && !Array.isArray(response.data.instances)) {
        Object.keys(response.data.instances).forEach(category => {
          const categoryInstances = response.data.instances[category];
          console.log(`  - Category ${category}: ${categoryInstances.length} instances`);
          
          if (categoryInstances.length > 0) {
            console.log(`    Example: ${printInstanceExample(categoryInstances[0])}`);
          }
        });
      } else if (Array.isArray(response.data.instances)) {
        // If instances is directly an array, try to group by category
        for (const category of response.data.categories) {
          const categoryInstances = response.data.instances.filter(i => i.category === category);
          console.log(`  - Category ${category}: ${categoryInstances.length} instances`);
          if (categoryInstances.length > 0) {
            console.log(`    Example: ${printInstanceExample(categoryInstances[0])}`);
          }
        }
      }
      
      return true;
    } else {
      printError(`Failed to retrieve ${provider.toUpperCase()} cached VM instances`);
      return false;
    }
  } catch (error) {
    printError(`Failed to retrieve ${provider.toUpperCase()} cached VM instances`, error);
    return false;
  }
}

async function testCachedVmInstancesByCategory(provider, category) {
  printHeader(`Testing ${provider.toUpperCase()} Cached VM Instances by Category (${category})`);
  try {
    const encodedCategory = encodeURIComponent(category);
    const response = await axios.get(`${API_BASE_URL}/providers/cached-vm-instances?provider=${provider.toUpperCase()}&category=${encodedCategory}`);
    
    if (response.status === 200 && response.data && response.data.success) {
      printSuccess(`Retrieved ${provider.toUpperCase()} VM instances for category: ${category}`);
      
      // Print all instances for the category
      const instances = response.data.instances;
      console.log(`Found ${instances.length} instances in category ${category}:`);
      for (const instance of instances.slice(0, 3)) { // Show first 3 instances
        console.log(`  - ${printInstanceExample(instance)}`);
      }
      if (instances.length > 3) {
        console.log(`  ... and ${instances.length - 3} more`);
      }
      return true;
    } else {
      printError(`Failed to retrieve ${provider.toUpperCase()} VM instances for category: ${category}`);
      return false;
    }
  } catch (error) {
    printError(`Failed to retrieve ${provider.toUpperCase()} VM instances for category: ${category}`, error);
    return false;
  }
}

async function testErrorHandling() {
  printHeader('Testing Error Handling');
  try {
    // Test with invalid provider
    const response = await axios.get(`${API_BASE_URL}/providers/invalid-provider/regions`);
    printError('Test failed: Expected error for invalid provider but got success response');
    return false;
  } catch (error) {
    if (error.response && error.response.status >= 400) {
      printSuccess('Error handling works correctly for invalid provider');
      return true;
    } else {
      printError('Test failed: Unexpected error response', error);
      return false;
    }
  }
}

// Main test function
async function runTests() {
  console.log('========================================');
  console.log('  CLOUD PROVIDER API COMPREHENSIVE TEST  ');
  console.log('========================================\n');
  
  // Test server health first
  const serverHealthy = await testServerHealth();
  if (!serverHealthy) {
    printError('Aborting tests due to server health check failure');
    return;
  }
  
  // Test results tracking
  const results = {
    total: 0,
    passed: 0,
    failed: 0
  };
  
  // Test each provider's regions
  for (const provider of PROVIDERS) {
    results.total++;
    if (await testProviderRegions(provider)) {
      results.passed++;
    } else {
      results.failed++;
    }
  }
  
  // Test each provider's VM instances using fetch-vm-provider
  for (const provider of PROVIDERS) {
    results.total++;
    if (await testFetchVmProvider(provider)) {
      results.passed++;
    } else {
      results.failed++;
    }
  }
  
  // Test each provider's cached VM instances
  for (const provider of PROVIDERS) {
    results.total++;
    if (await testCachedVmInstances(provider)) {
      results.passed++;
    } else {
      results.failed++;
    }
  }
  
  // Test VM instances by category
  const categories = ['General Purpose', 'Compute Optimized', 'Graphics Processing Units'];
  for (const provider of PROVIDERS) {
    for (const category of categories) {
      results.total++;
      if (await testCachedVmInstancesByCategory(provider, category)) {
        results.passed++;
      } else {
        results.failed++;
      }
    }
  }
  
  // Test error handling
  results.total++;
  if (await testErrorHandling()) {
    results.passed++;
  } else {
    results.failed++;
  }
  
  // Print summary
  console.log('\n========================================');
  console.log('  TEST SUMMARY  ');
  console.log('========================================');
  console.log(`Total tests: ${results.total}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  
  if (results.failed === 0) {
    console.log('\n✅ All tests passed successfully!');
  } else {
    console.log(`\n❌ ${results.failed} tests failed. See above for details.`);
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Test execution error:', error);
}); 