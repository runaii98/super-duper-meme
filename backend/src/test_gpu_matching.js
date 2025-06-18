// GPU Matching Test
// This script tests the GPU matching functionality across different GPU types and providers

const regionSelector = require('./vm_allocation_engine/region_selector');

// Import necessary modules
const fs = require('fs');
const path = require('path');

// Load AWS and GCP instance data from cache files
let awsInstances = [], gcpInstances = [];

try {
  const awsDataPath = path.join(__dirname, 'vm_allocation_engine/price_fetchers/aws_ondemand_prices_cache.json');
  const gcpDataPath = path.join(__dirname, 'vm_allocation_engine/price_fetchers/gcp_instances_cache.json');
  
  if (fs.existsSync(awsDataPath)) {
    awsInstances = JSON.parse(fs.readFileSync(awsDataPath, 'utf8'));
    console.log(`Loaded ${awsInstances.length} AWS instances from cache`);
  } else {
    console.error('AWS cache file not found');
  }
  
  if (fs.existsSync(gcpDataPath)) {
    gcpInstances = JSON.parse(fs.readFileSync(gcpDataPath, 'utf8'));
    console.log(`Loaded ${gcpInstances.length} GCP instances from cache`);
  } else {
    console.error('GCP cache file not found');
  }
} catch (err) {
  console.error('Error loading instance data:', err);
}

// Extract the isGpuTypeMatch function from regionSelector if it's not exported
const isGpuTypeMatch = regionSelector.isGpuTypeMatch || function(instanceGpuType, criteriaGpuType) {
  // This is a placeholder - the actual implementation should be imported or copied from regionSelector.js
  console.warn('Using placeholder isGpuTypeMatch function - results may not be accurate');
  return instanceGpuType && criteriaGpuType && 
         instanceGpuType.toLowerCase().includes(criteriaGpuType.toLowerCase());
};

// Filter GPU instances from the data
const awsGpuInstances = awsInstances.filter(instance => 
  instance.gpu_type || instance.gpuType || 
  (instance.instance_type && (instance.instance_type.startsWith('p') || instance.instance_type.startsWith('g')))
);

// Process GCP instances to set GPU types based on instance types and descriptions
for (const instance of gcpInstances) {
  if (instance.description && !instance.gpu_type) {
    // Extract GPU type from the description
    let gpuMatch = instance.description.match(/NVIDIA\s+(Tesla\s+)?([A-Za-z0-9]+)/i);
    if (gpuMatch && gpuMatch[2]) {
      instance.gpu_type = `nvidia-${gpuMatch[2].toLowerCase()}`;
    }
  }
  
  // Extract GPU type from instance type if not extracted from description
  if (!instance.gpu_type && instance.instance_type) {
    if (instance.instance_type.includes('a2-')) {
      instance.gpu_type = 'nvidia-a100';
    } else if (instance.instance_type.includes('a3-highgpu') || 
               instance.instance_type.includes('a3-megagpu') || 
               instance.instance_type.includes('a3-edgegpu')) {
      instance.gpu_type = 'nvidia-h100';
    } else if (instance.instance_type.includes('a3-ultragpu')) {
      instance.gpu_type = 'nvidia-h200';
    } else if (instance.instance_type.includes('a4-')) {
      instance.gpu_type = 'nvidia-b200';
    } else if (instance.instance_type.includes('g2-')) {
      instance.gpu_type = 'nvidia-l4';
    }
  }
}

const gcpGpuInstances = gcpInstances.filter(instance => 
  instance.gpu_type || instance.gpuType || 
  (instance.guestAccelerators && instance.guestAccelerators.length > 0) ||
  (instance.instance_type && (
    instance.instance_type.includes('a2-') || 
    instance.instance_type.includes('a3-') || 
    instance.instance_type.includes('a4-') || 
    instance.instance_type.includes('g2-')
  ))
);

console.log(`Found ${awsGpuInstances.length} AWS GPU instances`);
console.log(`Found ${gcpGpuInstances.length} GCP GPU instances`);

// Get GPU type functions
function getAwsGpuType(instance) {
  if (typeof regionSelector.getAwsGpuType === 'function') {
    // Ensure instance has the expected structure for getAwsGpuType
    const awsInstance = {
      InstanceType: instance.instance_type || instance.InstanceType || ''
    };
    
    if (instance.GpuInfo) {
      awsInstance.GpuInfo = instance.GpuInfo;
    }
    
    return regionSelector.getAwsGpuType(awsInstance);
  }
  
  // Fallback implementation
  if (instance.gpu_type) return instance.gpu_type;
  if (instance.gpuType) return instance.gpuType;
  
  // Basic instance type detection
  const instanceType = instance.instance_type || instance.InstanceType || '';
  if (instanceType) {
    if (instanceType.startsWith('p5')) return 'nvidia-h100';
    if (instanceType.startsWith('p4')) return 'nvidia-a100';
    if (instanceType.startsWith('g4')) return 'nvidia-t4';
    if (instanceType.startsWith('g5')) return 'nvidia-a10g';
  }
  
  return null;
}

function getGcpGpuType(instance) {
  if (typeof regionSelector.getGcpGpuType === 'function') {
    // Convert our instance to the expected format for getGcpGpuType
    const gcpInstance = {
      machineType: instance.instance_type || '',
      guestAccelerators: []
    };
    
    // If we have gpu_type, add it as an accelerator
    if (instance.gpu_type) {
      gcpInstance.guestAccelerators.push({
        acceleratorType: instance.gpu_type
      });
    }
    
    return regionSelector.getGcpGpuType(gcpInstance);
  }
  
  // Fallback - use our assigned GPU type
  if (instance.gpu_type) return instance.gpu_type;
  if (instance.gpuType) return instance.gpuType;
  
  // Basic instance type detection
  if (instance.instance_type) {
    if (instance.instance_type.includes('a3-')) return 'nvidia-h100';
    if (instance.instance_type.includes('a2-')) return 'nvidia-a100';
    if (instance.instance_type.includes('g2-')) return 'nvidia-l4';
  }
  
  return null;
}

// Test GPU matching for specific types
function testGpuMatching() {
  const gpuTypes = [
    // NVIDIA GPU models
    'nvidia-h100',
    'nvidia-h200',
    'nvidia-a100',
    'nvidia-l4',
    'nvidia-l40s',
    'nvidia-t4',
    'nvidia-a10g',
    'nvidia-tesla-v100',
    'nvidia-tesla-m60',
    'nvidia-k80',
    
    // AWS instance families
    'p6',
    'p5',
    'p5e',
    'p4d',
    'g6',
    'g5',
    'g4dn',
    'g3',
    
    // GCP instance families
    'a3-highgpu',
    'a3-ultragpu',
    'a2',
    'g2'
  ];
  
  console.log('\n===== TESTING GPU TYPE MATCHING =====\n');
  
  // Test each GPU type
  for (const gpuType of gpuTypes) {
    console.log(`\n----- Testing ${gpuType} -----`);
    
    // Count matches in AWS instances
    let awsMatches = 0;
    const awsMatchingInstances = [];
    
    for (const instance of awsGpuInstances) {
      const instanceGpuType = getAwsGpuType(instance);
      if (instanceGpuType && isGpuTypeMatch(instanceGpuType, gpuType)) {
        awsMatches++;
        if (awsMatchingInstances.length < 3) { // Only store first 3 matches to avoid console spam
          awsMatchingInstances.push({
            type: instance.InstanceType || instance.instance_type,
            gpu: instanceGpuType
          });
        }
      }
    }
    
    // Count matches in GCP instances
    let gcpMatches = 0;
    const gcpMatchingInstances = [];
    
    for (const instance of gcpGpuInstances) {
      const instanceGpuType = getGcpGpuType(instance);
      if (instanceGpuType && isGpuTypeMatch(instanceGpuType, gpuType)) {
        gcpMatches++;
        if (gcpMatchingInstances.length < 3) { // Only store first 3 matches to avoid console spam
          gcpMatchingInstances.push({
            type: instance.instance_type,
            gpu: instanceGpuType
          });
        }
      }
    }
    
    // Print results
    console.log(`AWS: ${awsMatches} matching instances`);
    if (awsMatchingInstances.length > 0) {
      console.log('  Examples:');
      awsMatchingInstances.forEach(inst => {
        console.log(`  - ${inst.type} (${inst.gpu})`);
      });
    }
    
    console.log(`GCP: ${gcpMatches} matching instances`);
    if (gcpMatchingInstances.length > 0) {
      console.log('  Examples:');
      gcpMatchingInstances.forEach(inst => {
        console.log(`  - ${inst.type} (${inst.gpu})`);
      });
    }
    
    if (awsMatches === 0 && gcpMatches === 0) {
      console.log(`*** WARNING: No instances matched for ${gpuType} ***`);
    }
  }
}

// Test the extraction functions themselves
function testExtractionFunctions() {
  console.log('\n===== TESTING GPU TYPE EXTRACTION =====\n');
  
  // Test a sample of AWS instances
  console.log('AWS Instances:');
  const awsSamples = awsGpuInstances.slice(0, Math.min(5, awsGpuInstances.length));
  
  for (const instance of awsSamples) {
    const gpuType = getAwsGpuType(instance);
    console.log(`- ${instance.InstanceType || instance.instance_type}: ${gpuType || 'No GPU detected'}`);
  }
  
  // Test a sample of GCP instances
  console.log('\nGCP Instances:');
  const gcpSamples = gcpGpuInstances.slice(0, Math.min(5, gcpGpuInstances.length));
  
  for (const instance of gcpSamples) {
    const gpuType = getGcpGpuType(instance);
    console.log(`- ${instance.instance_type}: ${gpuType || 'No GPU detected'}`);
  }
}

function testGpuTypeAssignment() {
  console.log('\n===== VERIFYING GPU TYPE ASSIGNMENT =====\n');
  
  // GCP family types and their expected GPU models
  const gcpTestCases = [
    { type: 'a2-highgpu-1g', expected: 'nvidia-a100' },
    { type: 'a3-highgpu-8g', expected: 'nvidia-h100' },
    { type: 'a3-ultragpu-8g', expected: 'nvidia-h200' },
    { type: 'a4-highgpu-8g', expected: 'nvidia-b200' },
    { type: 'g2-standard-32', expected: 'nvidia-l4' }
  ];
  
  // Find matching instances for each test case
  for (const testCase of gcpTestCases) {
    const instances = gcpGpuInstances.filter(inst => 
      inst.instance_type && inst.instance_type.includes(testCase.type)
    );
    
    const hasMatch = instances.length > 0;
    const matchedGpuType = hasMatch ? instances[0].gpu_type : 'none';
    
    console.log(`GCP ${testCase.type}: ${hasMatch ? 'Found' : 'Not found'}, GPU Type: ${matchedGpuType}`);
    console.log(`  Expected: ${testCase.expected}, Actual: ${matchedGpuType}`);
    console.log(`  Matches expected: ${matchedGpuType === testCase.expected}`);
  }
  
  // AWS family types and their expected GPU models
  const awsTestCases = [
    { type: 'p5', expected: 'nvidia-h100' },
    { type: 'p4d', expected: 'nvidia-a100' },
    { type: 'g5', expected: 'nvidia-a10g' },
    { type: 'g4dn', expected: 'nvidia-t4' }
  ];
  
  // Find matching instances for each test case
  for (const testCase of awsTestCases) {
    const instances = awsGpuInstances.filter(inst => 
      inst.instance_type && inst.instance_type.startsWith(testCase.type)
    );
    
    console.log(`AWS ${testCase.type}: ${instances.length > 0 ? 'Found' : 'Not found'}`);
  }
}

// Export the isGpuTypeMatch function if available
async function exportFunctions() {
  // Create a temporary file with exported functions for testing
  if (!regionSelector.isGpuTypeMatch) {
    try {
      // Read the region_selector.js file
      const regionSelectorPath = path.join(__dirname, 'vm_allocation_engine/region_selector.js');
      let content = fs.readFileSync(regionSelectorPath, 'utf8');
      
      // Check if the module.exports line exists
      if (content.includes('module.exports')) {
        // Add isGpuTypeMatch, getAwsGpuType, and getGcpGpuType to exports
        const exportLine = content.indexOf('module.exports');
        const exportStatement = content.substring(exportLine);
        
        // Create a modified export statement
        const newExportStatement = 'module.exports = {\n    findOptimalVm,\n    isGpuTypeMatch,\n    getAwsGpuType,\n    getGcpGpuType\n}; ';
        
        // Replace the original export statement
        const modifiedContent = content.replace(exportStatement, newExportStatement);
        
        // Write to a temporary file
        const tempPath = path.join(__dirname, 'temp_region_selector.js');
        fs.writeFileSync(tempPath, modifiedContent);
        
        console.log('Created temporary file with exported functions');
        
        // Now try to load the temporary module with the exported functions
        delete require.cache[require.resolve('./vm_allocation_engine/region_selector.js')];
        const tempRegionSelector = require('./temp_region_selector.js');
        
        // Check if the functions are available
        if (tempRegionSelector.isGpuTypeMatch) {
          console.log('Successfully loaded isGpuTypeMatch function');
          return tempRegionSelector;
        }
      }
    } catch (err) {
      console.error('Error creating temporary file:', err);
    }
  }
  
  return regionSelector;
}

// Main test function
async function runTests() {
  console.log('Starting GPU matching tests...');
  
  try {
    // Try to export the necessary functions for testing
    const enhancedRegionSelector = await exportFunctions();
    
    // Verify GPU type assignment
    testGpuTypeAssignment();
    
    // Test extraction functions
    testExtractionFunctions();
    
    // Test GPU matching
    testGpuMatching();
    
    console.log('\nAll tests completed.');
  } catch (error) {
    console.error('Error running tests:', error);
  } finally {
    // Clean up temporary file if it exists
    const tempPath = path.join(__dirname, 'temp_region_selector.js');
    if (fs.existsSync(tempPath)) {
      try {
        fs.unlinkSync(tempPath);
        console.log('Cleaned up temporary file');
      } catch (err) {
        console.error('Error cleaning up temporary file:', err);
      }
    }
  }
}

// Run the tests
runTests(); 