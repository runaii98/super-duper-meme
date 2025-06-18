// Test script to check if AWS GPU instances are properly populated
const fs = require('fs');
const path = require('path');

// Path to AWS cache files
const awsOnDemandPath = path.join(__dirname, 'vm_allocation_engine/price_fetchers/aws_ondemand_prices_cache.json');

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
  inst.gpuCount > 0 || 
  (inst.gpuType && inst.gpuType.toLowerCase().includes('nvidia'))
);

console.log(`Found ${gpuInstances.length} AWS GPU instances`);

// Group by GPU type
const gpuTypes = {};
gpuInstances.forEach(inst => {
  const gpuType = inst.gpuType || 'unknown';
  if (!gpuTypes[gpuType]) {
    gpuTypes[gpuType] = 0;
  }
  gpuTypes[gpuType]++;
});

console.log('AWS GPU instances by type:');
Object.keys(gpuTypes).forEach(type => {
  console.log(`  ${type}: ${gpuTypes[type]} instances`);
});

// Display a few examples of each GPU type
console.log('\nExample instances:');
const shownTypes = new Set();
gpuInstances.forEach(inst => {
  const gpuType = inst.gpuType || 'unknown';
  if (!shownTypes.has(gpuType)) {
    console.log(`\n${gpuType}:`);
    console.log(`  ${inst.skuId}: ${inst.vcpu} vCPUs, ${inst.ramGB} GB RAM, ${inst.gpuCount} GPU(s), $${inst.pricePerHour}/hr`);
    shownTypes.add(gpuType);
  }
}); 