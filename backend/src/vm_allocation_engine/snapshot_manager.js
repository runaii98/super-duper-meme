const { 
    EC2Client, 
    CreateSnapshotCommand, 
    DescribeSnapshotsCommand, 
    DeleteSnapshotCommand,
    DescribeInstancesCommand 
} = require('@aws-sdk/client-ec2');
const credentialsManager = require('./credentials_manager');
const { getGcpComputeClient } = require('./gcp_client');
const { v4: uuidv4 } = require('uuid');

/**
 * Creates a snapshot of an AWS EC2 instance's root volume.
 * @param {object} params - The parameters.
 * @param {string} params.instanceId - The ID of the instance.
 * @param {string} params.region - The AWS region.
 * @param {string} [params.description] - A description for the snapshot.
 * @returns {Promise<object>} The result of the snapshot creation.
 */
const createAwsSnapshot = async ({ instanceId, region, description }) => {
    try {
        const awsCredentials = await credentialsManager.loadAwsCredentials();
        const ec2Client = new EC2Client({ region, credentials: awsCredentials });

        // First, find the root volume ID of the instance
        const describeInstancesCmd = new DescribeInstancesCommand({ InstanceIds: [instanceId] });
        const instanceData = await ec2Client.send(describeInstancesCmd);
        if (!instanceData.Reservations || instanceData.Reservations.length === 0) {
            return { success: false, message: `Instance ${instanceId} not found.` };
        }
        const rootDeviceName = instanceData.Reservations[0].Instances[0].RootDeviceName;
        const rootVolume = instanceData.Reservations[0].Instances[0].BlockDeviceMappings.find(
            (device) => device.DeviceName === rootDeviceName
        );
        const volumeId = rootVolume.Ebs.VolumeId;

        // Now, create the snapshot
        const snapshotCommand = new CreateSnapshotCommand({
            VolumeId: volumeId,
            Description: description || `Snapshot for instance ${instanceId}`,
        });
        const snapshotOutput = await ec2Client.send(snapshotCommand);
        
        return { success: true, message: 'Snapshot creation initiated.', details: snapshotOutput };
    } catch (error) {
        console.error(`Error creating AWS snapshot for instance ${instanceId}:`, error);
        return { success: false, message: `Failed to create AWS snapshot: ${error.message}`, awsDetails: error };
    }
};

/**
 * Creates a snapshot of a GCP VM's boot disk.
 * @param {object} params - The parameters.
 * @param {string} params.instanceName - The name of the instance.
 * @param {string} params.zone - The GCP zone.
 * @param {string} params.projectId - The GCP project ID.
 * @param {string} [params.description] - A description for the snapshot.
 * @returns {Promise<object>} The result of the snapshot creation.
 */
const createGcpSnapshot = async ({ instanceName, zone, projectId, description }) => {
    try {
        const { compute } = await getGcpComputeClient();
        
        // Get instance to find boot disk
        const [instance] = await compute.instances.get({ project: projectId, zone, instance: instanceName });
        const bootDisk = instance.disks.find(disk => disk.boot).source.split('/').pop();

        const snapshotName = `snapshot-${instanceName}-${uuidv4().substring(0, 8)}`;
        const [operation] = await compute.disks.createSnapshot({
            project: projectId,
            zone,
            disk: bootDisk,
            snapshotResource: {
                name: snapshotName,
                description: description || `Snapshot for VM ${instanceName}`
            }
        });
        await operation.promise();
        
        return { success: true, message: `Snapshot '${snapshotName}' created successfully.` };
    } catch (error) {
        console.error(`Error creating GCP snapshot for instance ${instanceName}:`, error);
        return { success: false, message: `Failed to create GCP snapshot: ${error.message}`, gcpDetails: error };
    }
};

/**
 * Lists AWS snapshots.
 * @param {object} params - The parameters.
 * @param {string} params.region - The AWS region.
 * @param {string[]} [params.snapshotIds] - Optional array of snapshot IDs to filter by.
 * @returns {Promise<object>} The list of snapshots or an error.
 */
const listAwsSnapshots = async ({ region, snapshotIds = [] }) => {
    try {
        const awsCredentials = await credentialsManager.loadAwsCredentials();
        const ec2Client = new EC2Client({ region, credentials: awsCredentials });
        const command = new DescribeSnapshotsCommand({ OwnerIds: ['self'], SnapshotIds: snapshotIds });
        const output = await ec2Client.send(command);
        return { success: true, snapshots: output.Snapshots };
    } catch (error) {
        console.error('Error listing AWS snapshots:', error);
        return { success: false, message: `Failed to list AWS snapshots: ${error.message}`, awsDetails: error };
    }
};

/**
 * Lists GCP snapshots.
 * @param {object} params - The parameters.
 * @param {string} params.projectId - The GCP project ID.
 * @returns {Promise<object>} The list of snapshots or an error.
 */
const listGcpSnapshots = async ({ projectId }) => {
    try {
        const { compute } = await getGcpComputeClient();
        const [snapshots] = await compute.snapshots.list({ project: projectId });
        return { success: true, snapshots };
    } catch (error) {
        console.error('Error listing GCP snapshots:', error);
        return { success: false, message: `Failed to list GCP snapshots: ${error.message}`, gcpDetails: error };
    }
};

/**
 * Deletes an AWS snapshot.
 * @param {object} params - The parameters.
 * @param {string} params.snapshotId - The ID of the snapshot to delete.
 * @param {string} params.region - The AWS region.
 * @returns {Promise<object>} The result of the deletion.
 */
const deleteAwsSnapshot = async ({ snapshotId, region }) => {
    try {
        const awsCredentials = await credentialsManager.loadAwsCredentials();
        const ec2Client = new EC2Client({ region, credentials: awsCredentials });
        const command = new DeleteSnapshotCommand({ SnapshotId: snapshotId });
        await ec2Client.send(command);
        return { success: true, message: `Snapshot ${snapshotId} deleted successfully.` };
    } catch (error) {
        console.error(`Error deleting AWS snapshot ${snapshotId}:`, error);
        return { success: false, message: `Failed to delete AWS snapshot: ${error.message}`, awsDetails: error };
    }
};

/**
 * Deletes a GCP snapshot.
 * @param {object} params - The parameters.
 * @param {string} params.snapshotName - The name of the snapshot to delete.
 * @param {string} params.projectId - The GCP project ID.
 * @returns {Promise<object>} The result of the deletion.
 */
const deleteGcpSnapshot = async ({ snapshotName, projectId }) => {
    try {
        const { compute } = await getGcpComputeClient();
        const [operation] = await compute.snapshots.delete({ project: projectId, snapshot: snapshotName });
        await operation.promise();
        return { success: true, message: `Snapshot ${snapshotName} deleted successfully.` };
    } catch (error) {
        console.error(`Error deleting GCP snapshot ${snapshotName}:`, error);
        return { success: false, message: `Failed to delete GCP snapshot: ${error.message}`, gcpDetails: error };
    }
};

module.exports = {
    createAwsSnapshot,
    createGcpSnapshot,
    listAwsSnapshots,
    listGcpSnapshots,
    deleteAwsSnapshot,
    deleteGcpSnapshot,
}; 