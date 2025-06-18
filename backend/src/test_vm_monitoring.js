/**
 * Test script for VM Monitoring Manager
 * This script inserts test VM records into MySQL and tests the monitoring functions
 */

const { getVmMetrics, insertTestVmRecord } = require('./vm_monitoring_manager');

// Define sample VM data for testing
const testAwsVm = {
    internalVmId: 'test-aws-vm-001',
    provider: 'AWS',
    instanceId: 'i-0123456789abcdef0', // Example AWS instance ID
    instanceName: 'test-aws-machine',
    region: 'us-east-1',
    zone: null,
    projectId: null,
    instanceType: 't2.micro',
    osImage: 'ubuntu-22.04',
    status: 'running',
    publicIpAddress: '54.123.45.67',
    privateIpAddress: '172.31.45.67',
    sshKeyPairName: 'test-key-pair'
};

const testGcpVm = {
    internalVmId: 'test-gcp-vm-001',
    provider: 'GCP',
    instanceId: 'test-gcp-instance', // GCP uses names as instance IDs
    instanceName: 'test-gcp-machine',
    region: null,
    zone: 'us-central1-a',
    projectId: 'my-test-project-id',
    instanceType: 'e2-medium',
    osImage: 'ubuntu-22.04',
    status: 'running',
    publicIpAddress: '35.123.45.67',
    privateIpAddress: '10.142.0.5',
    sshKeyPairName: 'test-gcp-key'
};

/**
 * Insert test data into the database
 */
async function setupTestData() {
    try {
        console.log('Inserting test AWS VM record...');
        await insertTestVmRecord(testAwsVm);
        
        console.log('Inserting test GCP VM record...');
        await insertTestVmRecord(testGcpVm);
        
        console.log('Test data inserted successfully');
    } catch (error) {
        console.error('Error setting up test data:', error);
    }
}

/**
 * Test fetching VM details
 */
async function testGetVmMetrics() {
    try {
        // Note: In a real environment, these calls would actually communicate with AWS/GCP APIs
        // For testing without actual cloud resources, you might see errors from the cloud SDK calls
        
        console.log('\nTrying to get metrics for AWS VM...');
        try {
            const awsMetrics = await getVmMetrics('test-aws-vm-001', {
                metrics: ['cpu_utilization'],
                period: 300, // 5 minutes
                startTime: new Date(Date.now() - 3600 * 1000).toISOString(), // Last hour
                endTime: new Date().toISOString()
            });
            console.log('AWS VM Metrics Response:', JSON.stringify(awsMetrics, null, 2));
        } catch (error) {
            console.error('Error getting AWS metrics (expected if AWS credentials not available):', error.message);
        }
        
        console.log('\nTrying to get metrics for GCP VM...');
        try {
            const gcpMetrics = await getVmMetrics('test-gcp-vm-001', {
                metrics: ['cpu_utilization'],
                period: 300, // 5 minutes
                startTime: new Date(Date.now() - 3600 * 1000).toISOString(), // Last hour
                endTime: new Date().toISOString()
            });
            console.log('GCP VM Metrics Response:', JSON.stringify(gcpMetrics, null, 2));
        } catch (error) {
            console.error('Error getting GCP metrics (expected if GCP credentials not available):', error.message);
        }
        
    } catch (error) {
        console.error('Test error:', error);
    }
}

// Run the tests
async function runTests() {
    try {
        await setupTestData();
        await testGetVmMetrics();
        console.log('\nTests completed');
        process.exit(0);
    } catch (error) {
        console.error('Test suite error:', error);
        process.exit(1);
    }
}

runTests(); 