/**
 * Credentials Manager Test Script
 * 
 * Tests loading of GCP and AWS credentials.
 * Run from main_server/ directory with: node tests/credentials_manager.test.js
 */

const credentialsManager = require('../vm_allocation_engine/credentials_manager'); // Updated path

async function testCredentialsLoading() {
    console.log('Testing Credentials Manager...');

    // Test GCP Credentials
    console.log('\n--- Testing GCP Credential Loading ---');
    try {
        const gcpCreds = await credentialsManager.loadGcpCredentials();
        console.log('GCP credentials loaded successfully.');
        // Log a non-sensitive field if available, e.g., project_id
        if (gcpCreds.project_id) {
            console.log(`GCP Project ID: ${gcpCreds.project_id}`);
        } else {
            console.log('GCP credentials loaded, but no project_id found.');
        }
    } catch (error) {
        console.error('Failed to load GCP credentials:', error.message);
    }

    // Test AWS Credentials
    console.log('\n--- Testing AWS Credential Loading ---');
    try {
        const awsCreds = await credentialsManager.loadAwsCredentials();
        console.log('AWS credentials loaded successfully.');
        // Log a non-sensitive field if available, e.g., accessKeyId
        if (awsCreds.accessKeyId) {
            console.log(`AWS Access Key ID: ${awsCreds.accessKeyId}`);
        } else {
            console.log('AWS credentials loaded, but no accessKeyId found.');
        }
    } catch (error) {
        console.error('Failed to load AWS credentials:', error.message);
    }

    console.log('\nCredentials loading tests finished.');
}

// Run the test function
testCredentialsLoading().catch(err => {
    console.error("Error during test execution:", err);
}); 