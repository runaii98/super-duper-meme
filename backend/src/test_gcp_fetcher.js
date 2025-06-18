/**
 * Test script for the new GCP Compute Engine API-based fetcher
 */

const gcpFetcher = require('./vm_allocation_engine/price_fetchers/gcp_compute_api_fetcher');

// GCP Project ID - replace with your actual project ID
const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID || 'your-project-id';

async function testGcpComputeApiFetcher() {
  console.log('Testing GCP Compute Engine API Fetcher...');
  
  try {
    // Test fetching VM instance types
    console.log('Fetching GCP VM instance types...');
    const instanceTypes = await gcpFetcher.loadGcpInstanceTypes(GCP_PROJECT_ID);
    
    console.log(`Successfully fetched ${instanceTypes.length} GCP instance types.`);
    
    // Print some sample instances
    console.log('\nSample Instances:');
    if (instanceTypes.length > 0) {
      for (let i = 0; i < Math.min(5, instanceTypes.length); i++) {
        const instance = instanceTypes[i];
        console.log(`${i+1}. ${instance.instance_type}, vCPU: ${instance.vcpu}, RAM: ${instance.ram_gb}GB, Price: $${instance.compute_price_per_hour}/hr`);
      }
      
      // Print some high-CPU instances
      console.log('\nHigh CPU Instances:');
      const highCpuInstances = instanceTypes
        .filter(inst => inst.vcpu >= 16)
        .sort((a, b) => a.compute_price_per_hour - b.compute_price_per_hour)
        .slice(0, 5);
      
      for (let i = 0; i < highCpuInstances.length; i++) {
        const instance = highCpuInstances[i];
        console.log(`${i+1}. ${instance.instance_type}, vCPU: ${instance.vcpu}, RAM: ${instance.ram_gb}GB, Price: $${instance.compute_price_per_hour}/hr`);
      }
      
      // Print some GPU instances
      console.log('\nGPU Instances:');
      const gpuInstances = instanceTypes
        .filter(inst => inst.gpu_count > 0)
        .sort((a, b) => a.compute_price_per_hour - b.compute_price_per_hour)
        .slice(0, 5);
      
      for (let i = 0; i < gpuInstances.length; i++) {
        const instance = gpuInstances[i];
        console.log(`${i+1}. ${instance.instance_type}, vCPU: ${instance.vcpu}, RAM: ${instance.ram_gb}GB, GPU: ${instance.gpu_count}x ${instance.gpu_type}, Price: $${instance.compute_price_per_hour}/hr`);
      }
    } else {
      console.log('No instances fetched. Check your GCP credentials and project ID.');
    }
  } catch (error) {
    console.error('Error testing GCP Compute Engine API fetcher:', error);
  }
}

// Run the test
testGcpComputeApiFetcher(); 