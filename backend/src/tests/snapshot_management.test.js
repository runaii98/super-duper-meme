const axios = require('axios');
const { EC2Client, DescribeInstancesCommand, DescribeSnapshotsCommand } = require('@aws-sdk/client-ec2');
const credentialsManager = require('../vm_allocation_engine/credentials_manager');

// Setup axios for testing
const apiClient = axios.create({
    baseURL: 'http://localhost:3006', // Make sure this matches your server port
    validateStatus: () => true // Don't throw on non-2xx responses, let us handle them
});

jest.setTimeout(400000); // 6.5 minutes, as snapshots and instance stopping can be slow

describe('Snapshot and VM Modification API (Live E2E - AWS)', () => {
    let testInstanceId;
    let testSnapshotId;
    const testRegion = 'us-east-1';
    let ec2Client;

    // Helper to poll instance status
    const waitForInstanceStatus = async (instanceId, desiredStatus, timeout = 300000) => {
        const startTime = Date.now();
        console.log(`Waiting for instance ${instanceId} to reach status: ${desiredStatus}...`);
        while (Date.now() - startTime < timeout) {
            try {
                const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({ InstanceIds: [instanceId] }));
                const status = Reservations[0]?.Instances[0]?.State.Name;
                if (status === desiredStatus) {
                    console.log(`Instance ${instanceId} reached status: ${status}`);
                    return status;
                }
            } catch (error) {
                console.error(`Polling instance status failed: ${error.message}`);
            }
            await new Promise(resolve => setTimeout(resolve, 15000));
        }
        throw new Error(`Timeout waiting for instance ${instanceId} to reach ${desiredStatus}`);
    };
    
    // Helper to poll snapshot status
    const waitForSnapshotStatus = async (snapshotId, desiredStatus, timeout = 300000) => {
        const startTime = Date.now();
        console.log(`Waiting for snapshot ${snapshotId} to reach status: ${desiredStatus}...`);
        while (Date.now() - startTime < timeout) {
            try {
                const { Snapshots } = await ec2Client.send(new DescribeSnapshotsCommand({ SnapshotIds: [snapshotId] }));
                const status = Snapshots[0]?.State;
                if (status === desiredStatus) {
                    console.log(`Snapshot ${snapshotId} reached status: ${status}`);
                    return status;
                }
            } catch (error) {
                 if (error.name.includes('NotFound')) {
                    if (desiredStatus === 'deleted') return 'deleted';
                }
                console.error(`Polling snapshot status failed: ${error.message}`);
            }
            await new Promise(resolve => setTimeout(resolve, 15000));
        }
        throw new Error(`Timeout waiting for snapshot ${snapshotId} to reach ${desiredStatus}`);
    };

    beforeAll(async () => {
        // Ensure the server is running separately before running these tests
        try {
            await apiClient.get('/');
            console.log('Server is running and reachable.');
        } catch (error) {
            console.error('Server is not running. Please start the server before running tests.');
            throw new Error('Server not running');
        }

        const creds = await credentialsManager.loadAwsCredentials();
        ec2Client = new EC2Client({ region: testRegion, credentials: creds });

        const provisionRes = await apiClient.post('/api/v1/provision-vm', {
            provider: 'AWS',
            region: testRegion,
            instance_type: 't2.micro',
            osImage: 'ubuntu-22.04',
            instanceName: 'e2e-snapshot-test-instance'
        });
        
        expect(provisionRes.status).toBe(202);
        testInstanceId = provisionRes.data.instanceId;
        expect(testInstanceId).toBeDefined();
        await waitForInstanceStatus(testInstanceId, 'running');
    });

    afterAll(async () => {
        if (testSnapshotId) {
            console.log(`Cleaning up snapshot ${testSnapshotId}...`);
            await apiClient.delete(`/api/v1/snapshots/${testSnapshotId}/AWS`, {
                data: { region: testRegion } // For DELETE requests, use data instead of params
            });
            await waitForSnapshotStatus(testSnapshotId, 'deleted');
        }
        if (testInstanceId) {
            console.log(`Cleaning up instance ${testInstanceId}...`);
            await apiClient.delete(`/api/v1/instances/${testInstanceId}/AWS`, {
                params: { region: testRegion }
            });
        }
    });

    describe('Snapshot Management', () => {
        it('should create a snapshot from the test instance', async () => {
            const res = await apiClient.post(`/api/v1/instances/${testInstanceId}/snapshots/AWS`, {
                region: testRegion, 
                description: 'E2E Test Snapshot'
            });

            expect(res.status).toBe(202);
            expect(res.data.details).toBeDefined();
            testSnapshotId = res.data.details.SnapshotId;
            expect(testSnapshotId).toBeDefined();

            await waitForSnapshotStatus(testSnapshotId, 'completed');
        });

        it('should list the created snapshot', async () => {
            const res = await apiClient.get('/api/v1/snapshots/AWS', {
                params: { region: testRegion }
            });

            expect(res.status).toBe(200);
            expect(res.data.success).toBe(true);
            const found = res.data.snapshots.some(s => s.SnapshotId === testSnapshotId);
            expect(found).toBe(true);
        });

        it('should delete the created snapshot', async () => {
            expect(testSnapshotId).toBeDefined(); // Ensure snapshot was created
            const res = await apiClient.delete(`/api/v1/snapshots/${testSnapshotId}/AWS`, {
                data: { region: testRegion } // For DELETE requests with body, use data
            });
            
            expect(res.status).toBe(200);

            // Verify it's deleted
            await waitForSnapshotStatus(testSnapshotId, 'deleted');
            testSnapshotId = null; // Prevent afterAll from trying to delete it again
        });
    });

    describe('VM Modification', () => {
        it('should change the instance type of a stopped instance', async () => {
            // 1. Stop the instance
            await apiClient.post(`/api/v1/instances/${testInstanceId}/stop/AWS`, null, {
                params: { region: testRegion }
            });
            await waitForInstanceStatus(testInstanceId, 'stopped');

            // 2. Change the type
            const newType = 't2.small';
            const res = await apiClient.patch(`/api/v1/instances/${testInstanceId}/change-vm-type/AWS`, {
                region: testRegion, 
                newType: newType
            });
            
            expect(res.status).toBe(200);

            // 3. Verify the type was changed
            const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({ InstanceIds: [testInstanceId] }));
            const instance = Reservations[0].Instances[0];
            expect(instance.InstanceType).toBe(newType);

            // 4. Start it again for subsequent tests/cleanup
            await apiClient.post(`/api/v1/instances/${testInstanceId}/start/AWS`, null, {
                params: { region: testRegion }
            });
            await waitForInstanceStatus(testInstanceId, 'running');
        });
    });
}); 