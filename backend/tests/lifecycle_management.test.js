const axios = require('axios');
const { EC2Client, DescribeInstancesCommand } = require('@aws-sdk/client-ec2');
const credentialsManager = require('../main_server/vm_allocation_engine/credentials_manager');

// Setup axios for testing - point to our API server
const apiClient = axios.create({
    baseURL: 'http://localhost:3006', // Make sure this matches your server port
    validateStatus: () => true // Don't throw on non-2xx responses, let us handle them
});

// Increase the timeout for E2E tests that create real resources
jest.setTimeout(300000); // 5 minutes

describe('Instance Lifecycle Management API (Live E2E - AWS)', () => {
    let testInstanceId;
    const testRegion = 'us-east-1'; // A region must be selected for live tests
    let ec2Client;

    // Helper function to poll the instance status until it reaches the desired state or times out
    const waitForStatus = async (instanceId, desiredStatus, timeout = 240000, interval = 10000) => {
        const startTime = Date.now();
        console.log(`Waiting for instance ${instanceId} to reach status: ${desiredStatus}...`);
        
        while (Date.now() - startTime < timeout) {
            try {
                const command = new DescribeInstancesCommand({ InstanceIds: [instanceId] });
                const data = await ec2Client.send(command);

                if (!data.Reservations || data.Reservations.length === 0) {
                     // If the instance is terminated, Reservations can be empty
                     if (desiredStatus === 'terminated') {
                        console.log(`Instance ${instanceId} is terminated.`);
                        return 'terminated';
                     }
                }

                const status = data.Reservations[0]?.Instances[0]?.State.Name;
                if (status === desiredStatus) {
                    console.log(`Instance ${instanceId} reached status: ${status}`);
                    return status;
                }
            } catch (error) {
                // If the instance is not found, it might have been terminated
                if (error.name === 'InvalidInstanceID.NotFound' && desiredStatus === 'terminated') {
                    console.log(`Instance ${instanceId} successfully terminated (not found).`);
                    return 'terminated';
                }
                // Don't throw, just log and retry
                console.error(`An error occurred while polling for status: ${error.message}`);
            }
            await new Promise(resolve => setTimeout(resolve, interval));
        }
        throw new Error(`Timeout waiting for instance ${instanceId} to reach status ${desiredStatus}.`);
    };

    // Before running tests, start the server and provision a test instance
    beforeAll(async () => {
        // Ensure the server is running separately before running these tests
        try {
            // Check if server is running
            await apiClient.get('/');
            console.log('Server is running and reachable.');
        } catch (error) {
            console.error('Server is not running. Please start the server before running tests.');
            throw new Error('Server not running');
        }

        const creds = await credentialsManager.loadAwsCredentials();
        ec2Client = new EC2Client({ region: testRegion, credentials: creds });

        console.log('Provisioning a t2.micro instance for E2E tests...');
        const provisionRes = await apiClient.post('/api/v1/provision-vm', {
            provider: 'AWS',
            region: testRegion,
            instance_type: 't2.micro', // Use a cheap, general-purpose instance type
            osImage: 'ubuntu-22.04',
            instanceName: 'e2e-lifecycle-test-instance'
        });
        
        expect(provisionRes.status).toBe(202);
        testInstanceId = provisionRes.data.instanceId;
        expect(testInstanceId).toBeDefined();
        console.log(`Successfully launched instance: ${testInstanceId}`);

        // Wait for the instance to be fully 'running' before starting tests
        await waitForStatus(testInstanceId, 'running');
    });

    // After all tests are complete, terminate the instance to avoid costs
    afterAll(async () => {
        if (testInstanceId) {
            console.log(`Cleaning up instance ${testInstanceId}...`);
            const res = await apiClient.delete(`/api/v1/instances/${testInstanceId}/AWS`, {
                params: { region: testRegion }
            });
            
            expect(res.status).toBe(200);
            await waitForStatus(testInstanceId, 'terminated');
            console.log('Cleanup complete.');
        }
    });

    it('should successfully stop the running test instance', async () => {
        const res = await apiClient.post(`/api/v1/instances/${testInstanceId}/stop/AWS`, null, {
            params: { region: testRegion }
        });
        
        expect(res.status).toBe(200);
        
        // Verify the instance is in the 'stopped' state
        const finalStatus = await waitForStatus(testInstanceId, 'stopped');
        expect(finalStatus).toBe('stopped');
    });

    it('should successfully start the stopped test instance', async () => {
        // Ensure the instance is stopped before trying to start it
        await apiClient.post(`/api/v1/instances/${testInstanceId}/stop/AWS`, null, {
            params: { region: testRegion }
        });
        await waitForStatus(testInstanceId, 'stopped', 180000); // Give it time to stop
        
        const res = await apiClient.post(`/api/v1/instances/${testInstanceId}/start/AWS`, null, {
            params: { region: testRegion }
        });
            
        expect(res.status).toBe(200);

        // Verify the instance is in the 'running' state
        const finalStatus = await waitForStatus(testInstanceId, 'running');
        expect(finalStatus).toBe('running');
    });
    
    it('should successfully reboot the running test instance', async () => {
        // Ensure instance is running
        await apiClient.post(`/api/v1/instances/${testInstanceId}/start/AWS`, null, {
            params: { region: testRegion }
        });
        await waitForStatus(testInstanceId, 'running');

        const res = await apiClient.post(`/api/v1/instances/${testInstanceId}/reboot/AWS`, null, {
            params: { region: testRegion }
        });

        expect(res.status).toBe(200);

        // Wait for it to be running again. A reboot involves a brief 'stopping' state.
        console.log('Instance rebooting. Waiting for it to become available again...');
        await waitForStatus(testInstanceId, 'running');
    });
}); 