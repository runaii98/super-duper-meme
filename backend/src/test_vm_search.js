// Script to test VM search with different GPU types
const regionSelector = require('./vm_allocation_engine/region_selector');

// Parse command line arguments
const args = process.argv.slice(2);
let specificGpuType = null;

// Parse --gpu-type argument
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--gpu-type' && i + 1 < args.length) {
    specificGpuType = args[i + 1];
    break;
  }
  if (args[i].startsWith('--gpu-type=')) {
    specificGpuType = args[i].split('=')[1];
    break;
  }
}

async function testVmSearch() {
  // Test criteria
  const gpuTypes = [
    // NVIDIA GPU models
    'nvidia-tesla-t4',
    'nvidia-tesla-v100',
    'nvidia-tesla-a100',
    'nvidia-h100',
    'nvidia-h100e',
    'nvidia-l4',
    'nvidia-l40s',
    
    // AWS instance families
    'p4d',     // A100
    'p4de',    // A100
    'p5',      // H100
    'p6',      // H100
    'p6e',     // H100e
    'g5',      // A10G
    'g4dn',    // T4
  ];

  // If a specific GPU type was provided via command line, only test that one
  const typesToTest = specificGpuType ? [specificGpuType] : gpuTypes;

  // Run tests for each GPU type
  for (const gpuType of typesToTest) {
    console.log(`\n----- Testing search for ${gpuType} -----\n`);
    
    try {
      const criteria = {
        vcpu: 4,
        ram_gb: 16,
        gpu_type: gpuType,
        gpu_count: 1,
        preference: 'price',
        user_ip_address: '98.123.45.67' // Sample IP for testing
      };
      
      const instances = await regionSelector.findOptimalVm(criteria);
      
      // Count instances by provider
      const awsCount = instances.filter(i => i.provider === 'AWS').length;
      const gcpCount = instances.filter(i => i.provider === 'GCP').length;
      
      console.log(`Total instances found: ${instances.length}`);
      console.log(`AWS instances: ${awsCount}`);
      console.log(`GCP instances: ${gcpCount}`);
      
      // Show one instance from each provider if available
      const awsInstance = instances.find(i => i.provider === 'AWS');
      const gcpInstance = instances.find(i => i.provider === 'GCP');
      
      if (awsInstance) {
        console.log('\nAWS Example:');
        console.log(`  ${awsInstance.provider} ${awsInstance.instance_type}`);
        console.log(`  vCPUs: ${awsInstance.vcpu}, RAM: ${awsInstance.ram_gb}GB, GPUs: ${awsInstance.gpu_count || '?'}, Type: ${awsInstance.gpu_type || '?'}`);
        console.log(`  Price: $${awsInstance.total_price_per_hour}/hour, Model: ${awsInstance.pricing_model}`);
      } else {
        console.log('\nNo AWS instances found');
      }
      
      if (gcpInstance) {
        console.log('\nGCP Example:');
        console.log(`  ${gcpInstance.provider} ${gcpInstance.instance_type}`);
        console.log(`  vCPUs: ${gcpInstance.vcpu}, RAM: ${gcpInstance.ram_gb}GB, GPUs: ${gcpInstance.gpu_count || '?'}, Type: ${gcpInstance.gpu_type || '?'}`);
        console.log(`  Price: $${gcpInstance.total_price_per_hour}/hour, Model: ${gcpInstance.pricing_model}`);
      } else {
        console.log('\nNo GCP instances found');
      }
    } catch (err) {
      console.error(`Error testing ${gpuType}:`, err);
    }
  }
}

// Run the tests
console.log('Starting VM search tests with GPU criteria...');
if (specificGpuType) {
  console.log(`Testing only GPU type: ${specificGpuType}`);
}
testVmSearch().then(() => {
  console.log('\nAll tests completed');
}).catch(err => {
  console.error('Error running tests:', err);
}); 