/**
 * Credentials Manager
 * 
 * Loads and manages cloud provider credentials
 */

const fs = require('fs').promises;
const path = require('path');

// Path to credentials directory - Adjusted for new location
const CREDENTIALS_DIR = path.join(__dirname, '..', 'credentials');

/**
 * List all credential files in the credentials directory
 * @returns {Promise<Array<string>>} Array of filenames
 */
async function listCredentialFiles() {
    try {
        return await fs.readdir(CREDENTIALS_DIR);
    } catch (error) {
        console.error('Error reading credentials directory:', error);
        return [];
    }
}

/**
 * Find the first GCP credential file in the credentials directory
 * GCP credential files are typically JSON files containing "type": "service_account"
 * @returns {Promise<Object>} GCP credentials object
 */
async function loadGcpCredentials() {
    try {
        const files = await listCredentialFiles();
        
        // First try to find a file named gcp.json
        const gcpJsonFile = files.find(file => file.toLowerCase() === 'gcp.json');
        if (gcpJsonFile) {
            const credentialsPath = path.join(CREDENTIALS_DIR, gcpJsonFile);
            const credentialsData = await fs.readFile(credentialsPath, 'utf8');
            const credentials = JSON.parse(credentialsData);
            if (credentials.type === 'service_account') {
                return credentials;
            }
        }
        
        // Otherwise, check all JSON files for GCP service account credentials
        for (const file of files) {
            if (file.endsWith('.json') && file !== 'aws.json') {
                try {
                    const credentialsPath = path.join(CREDENTIALS_DIR, file);
                    const credentialsData = await fs.readFile(credentialsPath, 'utf8');
                    const credentials = JSON.parse(credentialsData);
                    
                    // Check if this is a GCP service account key
                    if (credentials.type === 'service_account') {
                        return credentials;
                    }
                } catch (err) {
                    // Skip files that can't be parsed
                    continue;
                }
            }
        }
        
        throw new Error('GCP credentials file not found in ' + CREDENTIALS_DIR);
    } catch (error) {
        console.error('Error loading GCP credentials:', error);
        throw new Error(`Failed to load GCP credentials: ${error.message}`);
    }
}

/**
 * Load AWS credentials from file
 * @returns {Promise<Object>} AWS credentials object with accessKeyId and secretAccessKey
 */
async function loadAwsCredentials() {
    try {
        const files = await listCredentialFiles();
        
        // First try to find a file named aws.json
        const awsJsonFile = files.find(file => file.toLowerCase() === 'aws.json');
        if (awsJsonFile) {
            const credentialsPath = path.join(CREDENTIALS_DIR, awsJsonFile);
            const credentialsData = await fs.readFile(credentialsPath, 'utf8');
            return JSON.parse(credentialsData);
        }
        
        // Otherwise, check all JSON files for AWS credentials format
        for (const file of files) {
            if (file.endsWith('.json') && !file.toLowerCase().includes('gcp')) {
                try {
                    const credentialsPath = path.join(CREDENTIALS_DIR, file);
                    const credentialsData = await fs.readFile(credentialsPath, 'utf8');
                    const credentials = JSON.parse(credentialsData);
                    
                    // Check if this has AWS credential format
                    if (credentials.accessKeyId && credentials.secretAccessKey) {
                        return credentials;
                    }
                } catch (err) {
                    // Skip files that can't be parsed
                    continue;
                }
            }
        }
        
        throw new Error('AWS credentials file not found in ' + CREDENTIALS_DIR);
    } catch (error) {
        console.error('Error loading AWS credentials:', error);
        throw new Error(`Failed to load AWS credentials: ${error.message}`);
    }
}

/**
 * Check if credentials for at least one provider are available
 * @returns {Promise<Object>} Status of available credentials
 */
async function checkCredentials() {
    const status = {
        aws: false,
        gcp: false,
        hasAnyValid: false
    };
    
    try {
        await loadAwsCredentials();
        status.aws = true;
        status.hasAnyValid = true;
        console.log('✅ AWS credentials are valid.');
    } catch (error) {
        console.log('Error loading AWS credentials:', error.message);
        status.aws = false;
        console.log('❌ AWS credentials are missing or invalid.');
    }
    
    try {
        await loadGcpCredentials();
        status.gcp = true;
        status.hasAnyValid = true;
        console.log('✅ GCP credentials are valid.');
    } catch (error) {
        console.log('Error loading GCP credentials:', error.message);
        status.gcp = false;
        console.log('❌ GCP credentials are missing or invalid.');
    }
    
    if (!status.hasAnyValid) {
        throw new Error('No valid credentials found for any cloud provider.');
    }
    
    if (!status.aws || !status.gcp) {
        console.log('⚠️ Warning: Credentials for one or more cloud providers are missing or invalid. Functionality for the affected providers will be disabled.');
    }
    
    return status;
}

/**
 * Get credentials for a specific cloud provider
 * @param {string} provider - Cloud provider ('GCP' or 'AWS')
 * @returns {Promise<Object>} Provider-specific credentials
 */
async function getProviderCredentials(provider) {
    if (provider === 'GCP') {
        return loadGcpCredentials();
    } else if (provider === 'AWS') {
        return loadAwsCredentials();
    } else {
        throw new Error(`Unsupported provider: ${provider}`);
    }
}

module.exports = {
    loadGcpCredentials,
    loadAwsCredentials,
    getProviderCredentials,
    checkCredentials
}; 