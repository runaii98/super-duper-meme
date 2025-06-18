// Debugging script to examine field naming inconsistencies between AWS and GCP instances
const fs = require('fs');
const path = require('path');

// Path to AWS and GCP cache files
const awsOnDemandPath = path.join(__dirname, 'vm_allocation_engine/price_fetchers/aws_ondemand_prices_cache.json');
const awsSpotPath = path.join(__dirname, 'vm_allocation_engine/price_fetchers/aws_spot_prices_cache.json');
// Load the region selector to examine the filtering logic
const regionSelector = require('./vm_allocation_engine/region_selector');

// Check if the cache files exist
if (!fs.existsSync(awsOnDemandPath)) {
  console.log('AWS OnDemand cache file not found. Run the server first to generate it.');
  process.exit(1);
}

// Load the cache files
const awsOnDemandInstances = JSON.parse(fs.readFileSync(awsOnDemandPath, 'utf8'));
console.log(`Loaded ${awsOnDemandInstances.length} AWS OnDemand instances`);

// Filter for GPU instances
const gpuInstances = awsOnDemandInstances.filter(inst => 
  (inst.gpuCount && inst.gpuCount > 0) || 
  (inst.gpuType && inst.gpuType.toLowerCase().includes('nvidia'))
);

console.log(`Found ${gpuInstances.length} AWS GPU instances with gpuCount or gpuType set`);

// Examine field naming inconsistencies
if (gpuInstances.length > 0) {
  // Get a sample GPU instance
  const sampleInstance = gpuInstances[0];
  
  // Check field names for consistency
  console.log('\nExamining field names in an AWS GPU instance:');
  console.log('Instance Type:', sampleInstance.instance_type || sampleInstance.instanceType || sampleInstance.skuId);
  console.log('GPU Type:', sampleInstance.gpu_type || sampleInstance.gpuType);
  console.log('GPU Count:', sampleInstance.gpu_count || sampleInstance.gpuCount);
  console.log('RAM (GB):', sampleInstance.ram_gb || sampleInstance.ramGB);
  console.log('vCPUs:', sampleInstance.vcpu);
  console.log('Pricing Model:', sampleInstance.pricing_model || sampleInstance.pricingModel);
  console.log('Price per Hour:', sampleInstance.compute_price_per_hour || sampleInstance.pricePerHour);
  
  // Show all available fields for reference
  console.log('\nAll fields in AWS GPU instance:');
  Object.keys(sampleInstance).forEach(key => {
    console.log(`  ${key}: ${JSON.stringify(sampleInstance[key])}`);
  });
}

// Now simulate the filtering criteria used in region_selector.js
const testCriteria = {
  vcpu: 4,
  ram_gb: 16,
  gpu_type: 'nvidia-tesla-t4',
  gpu_count: 1,
  preference: 'price',
  user_ip_address: '98.123.45.67'
};

// Manual filter test mimicking the region selector
console.log('\nTesting filter criteria against AWS GPU instances:');
console.log('Criteria:', JSON.stringify(testCriteria));

let matches = 0;
let failedVcpu = 0;
let failedRam = 0;
let failedGpuType = 0;
let failedGpuCount = 0;

gpuInstances.forEach(inst => {
  let instanceMatches = true;
  
  // Check vCPU
  if (testCriteria.vcpu) {
    if (!(inst.vcpu >= testCriteria.vcpu)) {
      instanceMatches = false;
      failedVcpu++;
    }
  }
  
  // Check RAM
  if (testCriteria.ram_gb) {
    const instRam = inst.ram_gb || inst.ramGB;
    if (!(instRam >= testCriteria.ram_gb)) {
      instanceMatches = false;
      failedRam++;
    }
  }
  
  // Check GPU type
  if (testCriteria.gpu_type) {
    const gpuType = inst.gpu_type || inst.gpuType;
    if (!gpuType || !gpuType.toLowerCase().includes(testCriteria.gpu_type.toLowerCase())) {
      instanceMatches = false;
      failedGpuType++;
    }
  }
  
  // Check GPU count
  if (testCriteria.gpu_count) {
    const gpuCount = inst.gpu_count || inst.gpuCount || 0;
    if (!(gpuCount >= testCriteria.gpu_count)) {
      instanceMatches = false;
      failedGpuCount++;
    }
  }
  
  if (instanceMatches) {
    matches++;
    console.log(`MATCH: ${inst.skuId}, vCPU: ${inst.vcpu}, RAM: ${inst.ram_gb || inst.ramGB}GB, GPU: ${inst.gpu_type || inst.gpuType} x${inst.gpu_count || inst.gpuCount}`);
  }
});

console.log(`\nResults: ${matches} AWS GPU instances match the criteria`);
console.log(`Failed vCPU check: ${failedVcpu}`);
console.log(`Failed RAM check: ${failedRam}`);
console.log(`Failed GPU type check: ${failedGpuType}`);
console.log(`Failed GPU count check: ${failedGpuCount}`); 