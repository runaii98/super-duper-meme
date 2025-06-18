/**
 * Cleanup Instance Script
 * 
 * This script terminates a specific cloud instance.
 * It's designed to be called from the command line with the necessary parameters.
 */

const { EC2Client, TerminateInstancesCommand, DeleteKeyPairCommand } = require('@aws-sdk/client-ec2');
const { InstancesClient } = require('@google-cloud/compute');
const credentialsManager = require('./credentials_manager');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
  .option('instanceId', {
    alias: 'i',
    description: 'ID of the instance to terminate',
    type: 'string',
    demandOption: true
  })
  .option('provider', {
    alias: 'p',
    description: 'Cloud provider (AWS or GCP)',
    type: 'string',
    default: 'AWS',
    choices: ['AWS', 'GCP']
  })
  .option('region', {
    alias: 'r',
    description: 'AWS region (required for AWS)',
    type: 'string',
    default: 'us-east-1'
  })
  .option('zone', {
    alias: 'z',
    description: 'GCP zone (required for GCP)',
    type: 'string'
  })
  .option('keyName', {
    alias: 'k',
    description: 'AWS key pair name to delete (optional)',
    type: 'string'
  })
  .option('projectId', {
    description: 'GCP project ID (required for GCP)',
    type: 'string'
  })
  .help()
  .alias('help', 'h')
  .argv;

async function deleteAwsInstance(instanceId, region, keyName) {
  try {
    console.log(`[Cleanup] Terminating AWS instance ${instanceId} in region ${region}...`);
    
    const awsCredentials = await credentialsManager.loadAwsCredentials();
    const ec2Client = new EC2Client({
      region: region,
      credentials: awsCredentials
    });

    // Terminate the instance
    const terminateCommand = new TerminateInstancesCommand({
      InstanceIds: [instanceId]
    });
    
    const result = await ec2Client.send(terminateCommand);
    console.log(`[Cleanup] Termination request successful:`, JSON.stringify(result, null, 2));
    
    // Delete the key pair if provided
    if (keyName) {
      console.log(`[Cleanup] Deleting key pair ${keyName}...`);
      const deleteKeyCommand = new DeleteKeyPairCommand({
        KeyName: keyName
      });
      
      const keyResult = await ec2Client.send(deleteKeyCommand);
      console.log(`[Cleanup] Key pair deletion successful:`, JSON.stringify(keyResult, null, 2));
    }
    
    return { success: true, message: `Instance ${instanceId} termination requested successfully.` };
  } catch (error) {
    console.error(`[Cleanup] Error terminating AWS instance:`, error);
    return { success: false, error: error.message };
  }
}

async function deleteGcpInstance(instanceId, zone, projectId) {
  try {
    console.log(`[Cleanup] Terminating GCP instance ${instanceId} in zone ${zone}...`);
    
    if (!zone) {
      throw new Error('Zone is required for GCP instance termination.');
    }
    
    const gcpCredentials = await credentialsManager.loadGcpCredentials();
    const gcpProject = projectId || await credentialsManager.getGcpProjectId();
    
    if (!gcpProject) {
      throw new Error('GCP project ID is required. Provide it as an argument or ensure it\'s configured in credentials.');
    }
    
    const instancesClient = new InstancesClient({
      credentials: gcpCredentials
    });
    
    const [response] = await instancesClient.delete({
      project: gcpProject,
      zone: zone,
      instance: instanceId
    });
    
    console.log(`[Cleanup] GCP instance deletion initiated. Operation:`, response.latestResponse.name);
    
    return { success: true, message: `Instance ${instanceId} deletion requested. Operation: ${response.latestResponse.name}` };
  } catch (error) {
    console.error(`[Cleanup] Error terminating GCP instance:`, error);
    return { success: false, error: error.message };
  }
}

async function main() {
  try {
    const { instanceId, provider, region, zone, keyName, projectId } = argv;
    
    let result;
    if (provider.toUpperCase() === 'AWS') {
      result = await deleteAwsInstance(instanceId, region, keyName);
    } else if (provider.toUpperCase() === 'GCP') {
      result = await deleteGcpInstance(instanceId, zone, projectId);
    } else {
      throw new Error(`Unsupported provider: ${provider}. Only AWS and GCP are supported.`);
    }
    
    if (result.success) {
      console.log(`[Cleanup] Success: ${result.message}`);
      process.exit(0);
    } else {
      console.error(`[Cleanup] Failed: ${result.error}`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`[Cleanup] Unexpected error:`, error);
    process.exit(1);
  }
}

main(); 