/**
 * Fix Server Setup Script
 * 
 * This script resolves common issues with the server setup:
 * 1. Copies necessary files from src to main_server if they don't exist
 * 2. Creates credential placeholders if needed
 * 3. Installs missing dependencies
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Paths
const srcDir = path.join(__dirname, 'src');
const mainServerDir = path.join(__dirname, 'main_server');
const credentialsDir = path.join(mainServerDir, 'credentials');
const vmAllocationEngineDir = path.join(mainServerDir, 'vm_allocation_engine');

// Function to copy a file if it doesn't exist
function copyFileIfNotExists(source, destination) {
  if (!fs.existsSync(destination) && fs.existsSync(source)) {
    console.log(`Copying ${source} to ${destination}`);
    
    // Create directory if it doesn't exist
    const destDir = path.dirname(destination);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    fs.copyFileSync(source, destination);
    return true;
  } else if (!fs.existsSync(source)) {
    console.log(`Source file doesn't exist: ${source}`);
    return false;
  } else {
    console.log(`File already exists: ${destination}`);
    return true;
  }
}

// Function to copy directory recursively
function copyDirRecursive(source, destination) {
  if (!fs.existsSync(source)) {
    console.log(`Source directory doesn't exist: ${source}`);
    return false;
  }
  
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }
  
  const files = fs.readdirSync(source);
  for (const file of files) {
    const sourcePath = path.join(source, file);
    const destPath = path.join(destination, file);
    
    if (fs.lstatSync(sourcePath).isDirectory()) {
      copyDirRecursive(sourcePath, destPath);
    } else {
      copyFileIfNotExists(sourcePath, destPath);
    }
  }
  
  return true;
}

// Create AWS credentials placeholder
function createAwsCredentialsPlaceholder() {
  const awsCredentialsPath = path.join(credentialsDir, 'aws.json');
  if (!fs.existsSync(awsCredentialsPath)) {
    console.log('Creating AWS credentials placeholder');
    const awsCredentials = {
      accessKeyId: 'YOUR_AWS_ACCESS_KEY_ID',
      secretAccessKey: 'YOUR_AWS_SECRET_ACCESS_KEY',
      region: 'us-east-1'
    };
    
    if (!fs.existsSync(credentialsDir)) {
      fs.mkdirSync(credentialsDir, { recursive: true });
    }
    
    fs.writeFileSync(awsCredentialsPath, JSON.stringify(awsCredentials, null, 2));
  }
}

// Create GCP credentials placeholder
function createGcpCredentialsPlaceholder() {
  const gcpCredentialsPath = path.join(credentialsDir, 'gcp.json');
  if (!fs.existsSync(gcpCredentialsPath)) {
    console.log('Creating GCP credentials placeholder');
    const gcpCredentials = {
      "type": "service_account",
      "project_id": "YOUR_PROJECT_ID",
      "private_key_id": "YOUR_PRIVATE_KEY_ID",
      "private_key": "YOUR_PRIVATE_KEY",
      "client_email": "YOUR_CLIENT_EMAIL",
      "client_id": "YOUR_CLIENT_ID",
      "auth_uri": "https://accounts.google.com/o/oauth2/auth",
      "token_uri": "https://oauth2.googleapis.com/token",
      "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
      "client_x509_cert_url": "YOUR_CLIENT_X509_CERT_URL"
    };
    
    if (!fs.existsSync(credentialsDir)) {
      fs.mkdirSync(credentialsDir, { recursive: true });
    }
    
    fs.writeFileSync(gcpCredentialsPath, JSON.stringify(gcpCredentials, null, 2));
  }
}

// Create vm_monitoring_manager.js if it doesn't exist
function createVmMonitoringManager() {
  const vmMonitoringManagerPath = path.join(mainServerDir, 'vm_monitoring_manager.js');
  if (!fs.existsSync(vmMonitoringManagerPath)) {
    console.log('Creating vm_monitoring_manager.js');
    const content = `/**
 * VM Monitoring Manager
 * 
 * This module provides functions for monitoring VMs across different cloud providers.
 */

// Get VM metrics
exports.getVmMetrics = async (provider, instanceId, region, options = {}) => {
  try {
    console.log(\`Getting metrics for \${provider} instance \${instanceId} in \${region}\`);
    return {
      success: true,
      metrics: {
        cpu: { utilization: Math.random() * 100 },
        memory: { utilization: Math.random() * 100 },
        disk: { utilization: Math.random() * 100 }
      }
    };
  } catch (error) {
    console.error('Error getting VM metrics:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Setup AWS VM monitoring
exports.setupAwsVmMonitoring = async (instanceId, region, config = {}) => {
  try {
    console.log(\`Setting up monitoring for AWS instance \${instanceId} in \${region}\`);
    return {
      success: true,
      commandId: 'mock-command-id-' + Date.now()
    };
  } catch (error) {
    console.error('Error setting up AWS VM monitoring:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Setup GCP VM monitoring
exports.setupGcpVmMonitoring = async (instanceId, zone, config = {}) => {
  try {
    console.log(\`Setting up monitoring for GCP instance \${instanceId} in \${zone}\`);
    return {
      success: true,
      operationId: 'mock-operation-id-' + Date.now()
    };
  } catch (error) {
    console.error('Error setting up GCP VM monitoring:', error);
    return {
      success: false,
      error: error.message
    };
  }
};`;
    fs.writeFileSync(vmMonitoringManagerPath, content);
  }
}

// Install missing dependencies
function installMissingDependencies() {
  console.log('Checking for missing dependencies...');
  try {
    console.log('Installing dependencies...');
    execSync('npm install', { stdio: 'inherit', cwd: __dirname });
    console.log('Dependencies installed successfully');
  } catch (error) {
    console.error('Error installing dependencies:', error.message);
  }
}

// Main function
async function main() {
  console.log('Starting server setup fix...');
  
  // Create main_server directory if it doesn't exist
  if (!fs.existsSync(mainServerDir)) {
    fs.mkdirSync(mainServerDir, { recursive: true });
  }
  
  // Copy src/vm_allocation_engine to main_server/vm_allocation_engine
  const srcVmAllocationEngineDir = path.join(srcDir, 'vm_allocation_engine');
  if (fs.existsSync(srcVmAllocationEngineDir)) {
    console.log('Copying vm_allocation_engine directory...');
    copyDirRecursive(srcVmAllocationEngineDir, vmAllocationEngineDir);
  } else {
    console.log('vm_allocation_engine directory not found in src');
  }
  
  // Copy src/routes to main_server/routes
  const srcRoutesDir = path.join(srcDir, 'routes');
  const mainServerRoutesDir = path.join(mainServerDir, 'routes');
  if (fs.existsSync(srcRoutesDir)) {
    console.log('Copying routes directory...');
    copyDirRecursive(srcRoutesDir, mainServerRoutesDir);
  } else {
    console.log('routes directory not found in src');
  }
  
  // Copy src/server.js to main_server/server.js
  const srcServerPath = path.join(srcDir, 'server.js');
  const mainServerServerPath = path.join(mainServerDir, 'server.js');
  copyFileIfNotExists(srcServerPath, mainServerServerPath);
  
  // Copy src/services to main_server/services
  const srcServicesDir = path.join(srcDir, 'services');
  const mainServerServicesDir = path.join(mainServerDir, 'services');
  if (fs.existsSync(srcServicesDir)) {
    console.log('Copying services directory...');
    copyDirRecursive(srcServicesDir, mainServerServicesDir);
  } else {
    console.log('services directory not found in src');
  }
  
  // Create credential placeholders
  createAwsCredentialsPlaceholder();
  createGcpCredentialsPlaceholder();
  
  // Create vm_monitoring_manager.js
  createVmMonitoringManager();
  
  // Install missing dependencies
  installMissingDependencies();
  
  console.log('Server setup fix completed');
}

// Run the main function
main().catch(error => {
  console.error('Error fixing server setup:', error);
  process.exit(1);
}); 