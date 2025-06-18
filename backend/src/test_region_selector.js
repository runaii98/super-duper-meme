// Test script for region_selector.js

const selector = require('./vm_allocation_engine/region_selector');

async function testRegionSelector() {
  console.log('Testing region selector with 4 vCPUs, 8GB RAM...');
  
  try {
    const criteria = {
      vcpu: 4,
      ram_gb: 8,
      preference: 'price',
      user_ip_address: '98.123.45.67' // Sample IP for testing
    };
    
    const instances = await selector.findOptimalVm(criteria);
    
    console.log(`\nTotal instances found: ${instances.length}`);
    
    // Organize results by provider and pricing model
    const awsOnDemand = instances.filter(i => i.provider === 'AWS' && i.pricing_model === 'OnDemand');
    const awsSpot = instances.filter(i => i.provider === 'AWS' && i.pricing_model === 'Spot');
    const gcpOnDemand = instances.filter(i => i.provider === 'GCP' && i.pricing_model === 'OnDemand');
    const gcpSpot = instances.filter(i => i.provider === 'GCP' && i.pricing_model === 'Spot');
    
    console.log(`AWS OnDemand: ${awsOnDemand.length}`);
    console.log(`AWS Spot: ${awsSpot.length}`);
    console.log(`GCP OnDemand: ${gcpOnDemand.length}`);
    console.log(`GCP Spot: ${gcpSpot.length}`);
    
    // Print the first instance of each type (if available)
    if (awsOnDemand.length > 0) {
      console.log('\nAWS OnDemand Sample:');
      console.log(`- ${awsOnDemand[0].instance_type}: ${awsOnDemand[0].vcpu} vCPU, ${awsOnDemand[0].ram_gb}GB RAM, $${awsOnDemand[0].total_price_per_hour}/hr`);
    }
    
    if (awsSpot.length > 0) {
      console.log('\nAWS Spot Sample:');
      console.log(`- ${awsSpot[0].instance_type}: ${awsSpot[0].vcpu} vCPU, ${awsSpot[0].ram_gb}GB RAM, $${awsSpot[0].total_price_per_hour}/hr`);
    }
    
    if (gcpOnDemand.length > 0) {
      console.log('\nGCP OnDemand Sample:');
      console.log(`- ${gcpOnDemand[0].instance_type}: ${gcpOnDemand[0].vcpu} vCPU, ${gcpOnDemand[0].ram_gb}GB RAM, $${gcpOnDemand[0].total_price_per_hour}/hr`);
    }
    
    if (gcpSpot.length > 0) {
      console.log('\nGCP Spot Sample:');
      console.log(`- ${gcpSpot[0].instance_type}: ${gcpSpot[0].vcpu} vCPU, ${gcpSpot[0].ram_gb}GB RAM, $${gcpSpot[0].total_price_per_hour}/hr`);
    }
    
  } catch (error) {
    console.error('Error testing region selector:', error);
  }
}

// Run the test
testRegionSelector(); 