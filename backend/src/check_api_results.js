// Script to test our API with GPU queries
const http = require('http');

// Helper function to make API requests
function makeRequest(criteria) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/find-cheapest-instance',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve(parsedData);
        } catch (err) {
          reject(new Error(`Failed to parse response: ${err.message}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(new Error(`Request failed: ${err.message}`));
    });

    req.write(JSON.stringify(criteria));
    req.end();
  });
}

// Test different GPU types
async function runTests() {
  console.log('Testing search for NVIDIA T4 GPUs...');
  const t4Results = await makeRequest({
    vcpu: 4,
    ram_gb: 16,
    gpu_type: 'nvidia-tesla-t4',
    gpu_count: 1,
    preference: 'price',
    user_ip_address: '98.123.45.67'
  });

  // Analyze results by provider
  const t4ByProvider = analyzeResults(t4Results);
  console.log(`Found ${t4Results.length} total instances for T4 GPU search`);
  console.log(`AWS: ${t4ByProvider.AWS.length} instances`);
  console.log(`GCP: ${t4ByProvider.GCP.length} instances`);
  console.log();

  // Print some example instances
  if (t4ByProvider.AWS.length > 0) {
    console.log('Example AWS T4 instance:');
    printInstance(t4ByProvider.AWS[0]);
  }
  if (t4ByProvider.GCP.length > 0) {
    console.log('Example GCP T4 instance:');
    printInstance(t4ByProvider.GCP[0]);
  }
  console.log();

  // Test NVIDIA V100 GPUs
  console.log('Testing search for NVIDIA V100 GPUs...');
  const v100Results = await makeRequest({
    vcpu: 8,
    ram_gb: 32,
    gpu_type: 'nvidia-tesla-v100',
    gpu_count: 1,
    preference: 'price',
    user_ip_address: '98.123.45.67'
  });

  const v100ByProvider = analyzeResults(v100Results);
  console.log(`Found ${v100Results.length} total instances for V100 GPU search`);
  console.log(`AWS: ${v100ByProvider.AWS.length} instances`);
  console.log(`GCP: ${v100ByProvider.GCP.length} instances`);
  console.log();

  // Test NVIDIA A100 GPUs
  console.log('Testing search for NVIDIA A100 GPUs...');
  const a100Results = await makeRequest({
    vcpu: 8,
    ram_gb: 32,
    gpu_type: 'nvidia-tesla-a100',
    gpu_count: 1,
    preference: 'price',
    user_ip_address: '98.123.45.67'
  });

  const a100ByProvider = analyzeResults(a100Results);
  console.log(`Found ${a100Results.length} total instances for A100 GPU search`);
  console.log(`AWS: ${a100ByProvider.AWS.length} instances`);
  console.log(`GCP: ${a100ByProvider.GCP.length} instances`);
}

// Helper to analyze results by provider
function analyzeResults(results) {
  const byProvider = {
    AWS: [],
    GCP: []
  };

  results.forEach(instance => {
    if (byProvider[instance.provider]) {
      byProvider[instance.provider].push(instance);
    }
  });

  return byProvider;
}

// Helper to print instance details
function printInstance(instance) {
  const price = instance.compute_price_per_hour || instance.pricePerHour || instance.total_price_per_hour;
  console.log(`  ${instance.provider} ${instance.instance_type || instance.skuId}`);
  console.log(`  vCPUs: ${instance.vcpu}, RAM: ${instance.ram_gb}GB, GPUs: ${instance.gpu_count}, Type: ${instance.gpu_type}`);
  console.log(`  Price: $${price}/hour, Model: ${instance.pricing_model}`);
}

// Run the tests
runTests().catch(err => {
  console.error('Error running tests:', err);
}); 