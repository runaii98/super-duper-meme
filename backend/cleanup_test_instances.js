/**
 * Cleanup Test Instances Script
 * 
 * This script cleans up test VM instances created during API testing.
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Check if test_instance_info.json exists
try {
  const instanceInfoPath = path.join(__dirname, 'test_instance_info.json');
  
  if (!fs.existsSync(instanceInfoPath)) {
    console.log('No test_instance_info.json file found. No instances to clean up.');
    process.exit(0);
  }
  
  const instanceInfo = JSON.parse(fs.readFileSync(instanceInfoPath, 'utf8'));
  console.log('Found test instance:', instanceInfo);
  
  if (!instanceInfo.instanceId) {
    console.log('No instanceId found in test_instance_info.json. Nothing to clean up.');
    process.exit(0);
  }
  
  // Call the main server API to delete the instance
  const provider = instanceInfo.provider || 'AWS';
  const region = instanceInfo.region || 'us-east-1';
  const zone = instanceInfo.zone;
  
  console.log(`Attempting to terminate ${provider} instance ${instanceInfo.instanceId}...`);
  
  // Execute the Node script to delete the instance
  const args = [
    'main_server/vm_allocation_engine/cleanup_instance.js',
    '--instanceId', instanceInfo.instanceId,
    '--provider', provider
  ];
  
  if (region) args.push('--region', region);
  if (zone) args.push('--zone', zone);
  
  console.log('Executing:', 'node', args.join(' '));
  
  const child = spawn('node', args, { 
    stdio: 'inherit',
    shell: true
  });
  
  child.on('close', (code) => {
    if (code === 0) {
      console.log(`Successfully requested termination of instance ${instanceInfo.instanceId}`);
      console.log('Note: The actual termination may take a few minutes to complete on the cloud provider side.');
      
      // Rename the test instance file to prevent re-deletion
      fs.renameSync(
        instanceInfoPath, 
        path.join(__dirname, `test_instance_info_deleted_${Date.now()}.json`)
      );
      
      console.log('Renamed test_instance_info.json to prevent re-deletion.');
    } else {
      console.error(`Failed to terminate instance. Exit code: ${code}`);
    }
  });
  
} catch (error) {
  console.error('Error during cleanup:', error);
  process.exit(1);
} 