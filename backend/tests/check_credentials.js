/**
 * Simple Credential Check Script
 */

const credManager = require('./main_server/vm_allocation_engine/credentials_manager');

async function testCredentials() {
  try {
    console.log('===== AWS Credentials Test =====');
    
    try {
      console.log('\nTesting AWS credentials...');
      const awsCreds = await credManager.loadAwsCredentials();
      console.log('AWS credentials loaded successfully:', true);
      console.log('Keys in AWS credentials:', Object.keys(awsCreds).join(', '));
      console.log('Access Key ID (first/last 4 chars):', 
        `${awsCreds.accessKeyId.substring(0, 4)}...${awsCreds.accessKeyId.substring(awsCreds.accessKeyId.length - 4)}`);
    } catch (awsErr) {
      console.log('AWS credentials error:', awsErr.message);
    }
    
    try {
      console.log('\nTesting GCP credentials...');
      const gcpCreds = await credManager.loadGcpCredentials();
      console.log('GCP credentials loaded successfully:', true);
      console.log('Project ID:', gcpCreds.project_id);
    } catch (gcpErr) {
      console.log('GCP credentials error:', gcpErr.message);
    }
    
    console.log('\nTesting checkCredentials function...');
    const status = await credManager.checkCredentials();
    console.log('\nCredential Status:');
    console.log('AWS available:', status.aws);
    console.log('GCP available:', status.gcp);
    console.log('Any provider available:', status.hasAnyValid);
    
    console.log('\n===== Test Complete =====');
  } catch (err) {
    console.error('Error in test:', err);
  }
}

testCredentials().then(() => {
  console.log('Test completed successfully');
}).catch(err => {
  console.error('Test failed:', err);
}); 