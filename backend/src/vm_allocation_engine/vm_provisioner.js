const { listAwsInstances, listGcpInstances } = require('./vm_lister');
const { modifyAwsRootVolume, modifyGcpBootDisk } = require('./vm_modifier');

// --- Instance Lifecycle Functions ---

/**
 * Starts an AWS EC2 instance.
 * @param {object} params - The parameters.
 * @param {string} params.instanceId - The ID of the instance to start.
 * @param {string} params.region - The AWS region of the instance.
 * @returns {Promise<object>} The result of the start operation.
 */
const startAwsInstance = async ({ instanceId, region }) => {
    try {
        const awsCredentials = await credentialsManager.loadAwsCredentials();
        const ec2Client = new EC2Client({ region, credentials: awsCredentials });
        const command = new StartInstancesCommand({ InstanceIds: [instanceId] });
        const output = await ec2Client.send(command);
        console.log(`Successfully sent start command for instance ${instanceId}.`);
        return { 
            success: true, 
            message: `Start command issued for instance ${instanceId}.`,
            details: output.StartingInstances
        };
    } catch (error) {
        console.error(`Error starting AWS instance ${instanceId}:`, error);
        return { success: false, message: `Failed to start AWS instance: ${error.message}`, awsDetails: error };
    }
};

/**
 * Starts a GCP Compute Engine instance.
 * @param {object} params - The parameters.
 * @param {string} params.instanceName - The name of the instance to start.
 * @param {string} params.zone - The GCP zone of the instance.
 * @param {string} params.projectId - The GCP project ID.
 * @returns {Promise<object>} The result of the start operation.
 */
const startGcpInstance = async ({ instanceName, zone, projectId }) => {
    try {
        const { compute, auth } = await getGcpComputeClient();
        const request = { project: projectId, zone, instance: instanceName };
        const [operation] = await compute.instances.start(request);
        await operation.promise();
        console.log(`Successfully started GCP instance ${instanceName}.`);
        return { 
            success: true, 
            message: `Instance ${instanceName} started successfully.` 
        };
    } catch (error) {
        console.error(`Error starting GCP instance ${instanceName}:`, error);
        return { success: false, message: `Failed to start GCP instance: ${error.message}`, gcpDetails: error };
    }
};

/**
 * Reboots an AWS EC2 instance.
 * @param {object} params - The parameters.
 * @param {string} params.instanceId - The ID of the instance to reboot.
 * @param {string} params.region - The AWS region of the instance.
 * @returns {Promise<object>} The result of the reboot operation.
 */
const rebootAwsInstance = async ({ instanceId, region }) => {
    try {
        const awsCredentials = await credentialsManager.loadAwsCredentials();
        const ec2Client = new EC2Client({ region, credentials: awsCredentials });
        const command = new RebootInstancesCommand({ InstanceIds: [instanceId] });
        await ec2Client.send(command);
        console.log(`Successfully sent reboot command for instance ${instanceId}.`);
        return { 
            success: true, 
            message: `Reboot command issued for instance ${instanceId}.`
        };
    } catch (error) {
        console.error(`Error rebooting AWS instance ${instanceId}:`, error);
        return { success: false, message: `Failed to reboot AWS instance: ${error.message}`, awsDetails: error };
    }
};

/**
 * Reboots (resets) a GCP Compute Engine instance.
 * @param {object} params - The parameters.
 * @param {string} params.instanceName - The name of the instance to reboot.
 * @param {string} params.zone - The GCP zone of the instance.
 * @param {string} params.projectId - The GCP project ID.
 * @returns {Promise<object>} The result of the reboot operation.
 */
const rebootGcpInstance = async ({ instanceName, zone, projectId }) => {
    try {
        const { compute, auth } = await getGcpComputeClient();
        const request = { project: projectId, zone, instance: instanceName };
        const [operation] = await compute.instances.reset(request);
        await operation.promise();
        console.log(`Successfully reset (rebooted) GCP instance ${instanceName}.`);
        return { 
            success: true, 
            message: `Instance ${instanceName} reset (rebooted) successfully.` 
        };
    } catch (error) {
        console.error(`Error rebooting GCP instance ${instanceName}:`, error);
        return { success: false, message: `Failed to reboot GCP instance: ${error.message}`, gcpDetails: error };
    }
};


// --- Instance Termination Functions ---

/**
 * Terminates an AWS EC2 instance but DOES NOT delete the associated key pair.
 * @param {object} params - The parameters for deleting an AWS VM.
 * @param {string} params.instanceId - The ID of the instance to delete.
 * @param {string} params.region - The AWS region where the instance exists.
 * @returns {Promise<object>} An object indicating the success or failure of the operation.
 */
const terminateAwsInstance = async ({ instanceId, region }) => {
    console.log(`Attempting to terminate AWS instance ${instanceId} in region ${region}.`);
    const awsCredentials = await credentialsManager.loadAwsCredentials();
    if (!awsCredentials) {
        return { success: false, message: "AWS credentials not loaded." };
    }

    const ec2Client = new EC2Client({ region, credentials: awsCredentials });

    try {
        console.log(`Terminating EC2 Instance: ${instanceId}...`);
        await terminateEc2Instance(ec2Client, instanceId);
        console.log(`Instance ${instanceId} termination command issued.`);
        
        // Key Pair deletion is removed for safety. It should be a separate, deliberate action.

        return { success: true, message: `Successfully initiated termination for instance ${instanceId}.` };
    } catch (error) {
        console.error(`Error during AWS VM deletion for instance ${instanceId}:`, error);
        return { success: false, message: `Failed to delete AWS VM: ${error.message}`, awsDetails: error };
    }
};

/**
 * @param {string} params.projectId - The GCP project ID.
 * @returns {Promise<object>} An object indicating the success or failure of the operation.
 */
const terminateGcpInstance = async ({ instanceId, zone, projectId }) => {
    console.log(`Attempting to delete GCP instance ${instanceId} from project ${projectId} in zone ${zone}.`);
    try {
        const { compute } = await getGcpComputeClient();
        const request = {
            project: projectId,
            zone,
            instance: instanceId, // For GCP SDK, instanceId is the name of the instance
        };
        const [operation] = await compute.instances.delete(request);
        // Waiting for the operation to complete
        await operation.promise();
        console.log(`Instance ${instanceId} deleted successfully from GCP.`);
        return { success: true, message: `Instance ${instanceId} deleted successfully.` };
    } catch (error) {
        console.error(`Error deleting GCP instance ${instanceId}:`, error);
        // Check for a 'Not Found' error
        if (error.code === 5) { // '5' is the gRPC code for NOT_FOUND
            return { success: false, message: `GCP instance '${instanceId}' not found.`, gcpDetails: error };
        }
        return { success: false, message: `Failed to delete GCP instance: ${error.message}`, gcpDetails: error };
    }
};


module.exports = {
    provisionAwsVm,
    provisionGcpVm,
    stopAwsInstance,
    stopGcpInstance,
    startAwsInstance,
    startGcpInstance,
    rebootAwsInstance,
    rebootGcpInstance,
    terminateAwsInstance,
    terminateGcpInstance,
    listAwsInstances,
    listGcpInstances,
    osImageMappings,
// ... existing code ...
} 