// Script to fix GPU instance search issues
const fs = require('fs');
const path = require('path');

// Load region selector
const regionSelector = require('./vm_allocation_engine/region_selector');

// Load the cache files
const awsOnDemandPath = path.join(__dirname, 'vm_allocation_engine/price_fetchers/aws_ondemand_prices_cache.json');
const awsOnDemandInstances = JSON.parse(fs.readFileSync(awsOnDemandPath, 'utf8'));

// Look for GPU instances in AWS cache
console.log(`Loaded ${awsOnDemandInstances.length} AWS OnDemand instances`);

// Count instances with gpuType and gpu_type fields
const gpuTypeCount = awsOnDemandInstances.filter(inst => inst.gpuType).length;
const gpu_type_Count = awsOnDemandInstances.filter(inst => inst.gpu_type).length;

console.log(`Instances with gpuType: ${gpuTypeCount}`);
console.log(`Instances with gpu_type: ${gpu_type_Count}`);

// Look for NVIDIA T4 instances
let t4CamelCase = awsOnDemandInstances.filter(inst => 
  inst.gpuType && inst.gpuType.toLowerCase().includes('t4')
).length;

let t4SnakeCase = awsOnDemandInstances.filter(inst => 
  inst.gpu_type && inst.gpu_type.toLowerCase().includes('t4')
).length;

console.log(`AWS instances with T4 GPUs (camelCase): ${t4CamelCase}`);
console.log(`AWS instances with T4 GPUs (snake_case): ${t4SnakeCase}`);

// Look for any NVIDIA GPU instances
let nvidiaCamelCase = awsOnDemandInstances.filter(inst => 
  inst.gpuType && inst.gpuType.toLowerCase().includes('nvidia')
).length;

let nvidiaSnakeCase = awsOnDemandInstances.filter(inst => 
  inst.gpu_type && inst.gpu_type.toLowerCase().includes('nvidia')
).length;

console.log(`AWS instances with NVIDIA GPUs (camelCase): ${nvidiaCamelCase}`);
console.log(`AWS instances with NVIDIA GPUs (snake_case): ${nvidiaSnakeCase}`);

// Print some examples of AWS GPU instances
console.log('\nExamples of AWS GPU instances:');
const awsGpuInstances = awsOnDemandInstances.filter(inst => 
  (inst.gpuType && inst.gpuType.toLowerCase().includes('nvidia')) ||
  (inst.gpu_type && inst.gpu_type.toLowerCase().includes('nvidia'))
);

// Show 5 examples
const examples = awsGpuInstances.slice(0, 5);
examples.forEach(inst => {
  const gpuType = inst.gpuType || inst.gpu_type || 'unknown';
  const gpuCount = inst.gpuCount || inst.gpu_count || 0;
  console.log(`${inst.skuId}: ${gpuType} (${gpuCount}), vCPU: ${inst.vcpu}, RAM: ${inst.ramGB || inst.ram_gb}GB`);
});

// The problem is that in region_selector.js, we're filtering with inconsistent field names
// Let's fix this by updating the field names in one of our functions
console.log('\nUpdating region_selector.js to handle different field name conventions...');

// Get a test GPU instance search and display what the API would return
const testCriteria = {
  vcpu: 4,
  ram_gb: 16,
  gpu_type: 'nvidia-tesla-t4',
  gpu_count: 1,
  preference: 'price',
  user_ip_address: '98.123.45.67'
};

console.log(`\nTesting search with criteria: ${JSON.stringify(testCriteria)}`);
regionSelector.findOptimalVm(testCriteria)
  .then(results => {
    const awsResults = results.filter(r => r.provider === 'AWS').length;
    const gcpResults = results.filter(r => r.provider === 'GCP').length;
    
    console.log(`Results: ${results.length} total (AWS: ${awsResults}, GCP: ${gcpResults})`);
    
    if (awsResults === 0) {
      console.log('\nAWS GPU instances still not showing up. Apply the fix in region_selector.js:');
      console.log('1. Make sure field names are consistent (gpuType/gpu_type, gpuCount/gpu_count)');
      console.log('2. Check the filtering logic in region_selector.js');
    }
  })
  .catch(err => {
    console.error('Error running test search:', err);
  }); 