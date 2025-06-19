const { EC2Client, StopInstancesCommand, StartInstancesCommand, ModifyInstanceAttributeCommand, DescribeInstancesCommand } = require('@aws-sdk/client-ec2');
const credentialsManager = require('./credentials_manager');
const { getGcpComputeClient } = require('./gcp_client');

/**
 * Changes the instance type of an AWS EC2 instance.
 * Instance must be stopped first.
 * @param {object} params - The parameters.
 * @param {string} params.instanceId - The ID of the instance.
 * @param {string} params.region - The AWS region.
 * @param {string} params.newInstanceType - The target instance type.
 * @returns {Promise<object>} The result of the operation.
 */
const changeAwsInstanceType = async ({ instanceId, region, newInstanceType }) => {
    try {
        const awsCredentials = await credentialsManager.loadAwsCredentials();
        const ec2Client = new EC2Client({ region, credentials: awsCredentials });

        // 1. Check current instance state
        const instanceDetails = await ec2Client.send(new DescribeInstancesCommand({ InstanceIds: [instanceId] }));
        const currentState = instanceDetails.Reservations[0].Instances[0].State.Name;

        if (currentState !== 'stopped') {
            return { success: false, message: 'Instance must be in "stopped" state to change its type.', currentState };
        }

        // 2. Modify the instance type
        const modifyCommand = new ModifyInstanceAttributeCommand({
            InstanceId: instanceId,
            InstanceType: { Value: newInstanceType },
        });
        await ec2Client.send(modifyCommand);

        return { success: true, message: `Instance ${instanceId} type changed to ${newInstanceType}. Please start it manually.` };
    } catch (error) {
        console.error(`Error changing AWS instance type for ${instanceId}:`, error);
        return { success: false, message: `Failed to change AWS instance type: ${error.message}`, awsDetails: error };
    }
};

/**
 * Changes the machine type of a GCP VM instance.
 * Instance must be stopped (TERMINATED) first.
 * @param {object} params - The parameters.
 * @param {string} params.instanceName - The name of the instance.
 * @param {string} params.zone - The GCP zone.
 * @param {string} params.projectId - The GCP project ID.
 * @param {string} params.newMachineType - The target machine type (e.g., "e2-medium").
 * @returns {Promise<object>} The result of the operation.
 */
const changeGcpInstanceType = async ({ instanceName, zone, projectId, newMachineType }) => {
    try {
        const { compute } = await getGcpComputeClient();

        // 1. Check current instance status
        const [instance] = await compute.instances.get({ project: projectId, zone, instance: instanceName });
        if (instance.status !== 'TERMINATED') {
            return { success: false, message: 'Instance must be in "TERMINATED" (stopped) state to change its type.', currentState: instance.status };
        }

        // 2. Set the machine type
        const [operation] = await compute.instances.setMachineType({
            project: projectId,
            zone,
            instance: instanceName,
            instancesSetMachineTypeRequestResource: {
                machineType: `zones/${zone}/machineTypes/${newMachineType}`,
            },
        });
        await operation.promise();

        return { success: true, message: `Instance ${instanceName} machine type changed to ${newMachineType}. Please start it manually.` };
    } catch (error) {
        console.error(`Error changing GCP instance type for ${instanceName}:`, error);
        return { success: false, message: `Failed to change GCP instance type: ${error.message}`, gcpDetails: error };
    }
};

module.exports = {
    changeAwsInstanceType,
    changeGcpInstanceType,
}; 