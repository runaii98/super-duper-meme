#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colors for console output (works in both Windows and Unix)
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

// File and directory paths
const PATHS = {
  mainServerDir: path.join(__dirname, 'main_server'),
  srcDir: path.join(__dirname, 'src'),
  backendDir: __dirname,
  mainServerPackageJson: path.join(__dirname, 'main_server', 'package.json'),
  backendPackageJson: path.join(__dirname, 'package.json'),
  credentialsDir: path.join(__dirname, 'main_server', 'credentials'),
  awsCredentials: path.join(__dirname, 'main_server', 'credentials', 'aws.json'),
  gcpCredentials: path.join(__dirname, 'main_server', 'credentials', 'gcp.json'),
  mainServerJs: path.join(__dirname, 'main_server', 'server.js'),
  vmMonitoringManager: path.join(__dirname, 'main_server', 'vm_monitoring_manager.js'),
  srcVmMonitoringManager: path.join(__dirname, 'src', 'vm_monitoring_manager.js'),
  vmAllocationDir: path.join(__dirname, 'main_server', 'vm_allocation_engine'),
  srcVmAllocationDir: path.join(__dirname, 'src', 'vm_allocation_engine')
};

// Log with color
function log(message, color = colors.reset) {
  console.log(color + message + colors.reset);
}

// Ask a question and return the answer
function askQuestion(question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer);
    });
  });
}

// Check if a directory exists
function checkDirExists(dirPath, dirName) {
  log(`Checking if ${dirName} directory exists...`, colors.blue);
  if (fs.existsSync(dirPath)) {
    log(`✅ ${dirName} directory found at ${dirPath}`, colors.green);
    return true;
  } else {
    log(`❌ ${dirName} directory not found at ${dirPath}`, colors.red);
    return false;
  }
}

// Check if a file exists
function checkFileExists(filePath, fileName) {
  log(`Checking if ${fileName} exists...`, colors.blue);
  if (fs.existsSync(filePath)) {
    log(`✅ ${fileName} found at ${filePath}`, colors.green);
    return true;
  } else {
    log(`❌ ${fileName} not found at ${filePath}`, colors.red);
    return false;
  }
}

// Check if the server port is in use
function checkPortInUse(port = 3006) {
  log(`Checking if port ${port} is in use...`, colors.blue);
  try {
    const isWindows = process.platform === "win32";
    let command;
    
    if (isWindows) {
      command = `netstat -ano | findstr :${port}`;
    } else {
      command = `lsof -i:${port} -t`;
    }
    
    const result = execSync(command, { encoding: 'utf-8' });
    if (result && result.trim()) {
      log(`⚠️ Port ${port} is already in use`, colors.yellow);
      return true;
    }
  } catch (error) {
    // This is actually good - it means the port is not in use
    log(`✅ Port ${port} is not in use`, colors.green);
    return false;
  }
  return false;
}

// Kill process using a specific port
async function killProcessUsingPort(port = 3006) {
  log(`Attempting to kill process using port ${port}...`, colors.blue);
  try {
    const isWindows = process.platform === "win32";
    
    if (isWindows) {
      const pidCommand = `netstat -ano | findstr :${port}`;
      const output = execSync(pidCommand, { encoding: 'utf-8' });
      const lines = output.split('\n');
      
      for (const line of lines) {
        if (line.includes(`:${port}`)) {
          const match = line.match(/(\d+)$/);
          if (match && match[1]) {
            const pid = match[1].trim();
            log(`Killing process with PID: ${pid}`, colors.blue);
            execSync(`taskkill /F /PID ${pid}`);
          }
        }
      }
    } else {
      execSync(`kill $(lsof -t -i:${port})`);
    }
    log(`✅ Successfully killed process on port ${port}`, colors.green);
    return true;
  } catch (error) {
    log(`❌ Failed to kill process: ${error.message}`, colors.red);
    return false;
  }
}

// Copy a file from source to destination
function copyFile(sourcePath, destPath, fileName) {
  log(`Copying ${fileName} from ${sourcePath} to ${destPath}...`, colors.blue);
  try {
    // Create directory if it doesn't exist
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    // Copy the file
    fs.copyFileSync(sourcePath, destPath);
    log(`✅ Successfully copied ${fileName}`, colors.green);
    return true;
  } catch (error) {
    log(`❌ Failed to copy ${fileName}: ${error.message}`, colors.red);
    return false;
  }
}

// Copy a directory recursively
function copyDirectoryRecursive(source, destination) {
  log(`Copying directory from ${source} to ${destination}...`, colors.blue);
  try {
    // Create destination directory if it doesn't exist
    if (!fs.existsSync(destination)) {
      fs.mkdirSync(destination, { recursive: true });
    }
    
    // Get all files and directories in source
    const entries = fs.readdirSync(source, { withFileTypes: true });
    
    // Copy each entry
    for (const entry of entries) {
      const sourcePath = path.join(source, entry.name);
      const destPath = path.join(destination, entry.name);
      
      if (entry.isDirectory()) {
        // Recursively copy directories
        copyDirectoryRecursive(sourcePath, destPath);
      } else {
        // Copy files
        fs.copyFileSync(sourcePath, destPath);
      }
    }
    
    log(`✅ Successfully copied directory`, colors.green);
    return true;
  } catch (error) {
    log(`❌ Failed to copy directory: ${error.message}`, colors.red);
    return false;
  }
}

// Create basic credentials files
function createCredentialsFiles() {
  log(`Checking credentials files...`, colors.blue);
  
  // Create credentials directory if it doesn't exist
  if (!fs.existsSync(PATHS.credentialsDir)) {
    log(`Creating credentials directory...`, colors.yellow);
    fs.mkdirSync(PATHS.credentialsDir, { recursive: true });
  }
  
  // Create AWS credentials if they don't exist
  if (!fs.existsSync(PATHS.awsCredentials)) {
    log(`Creating AWS credentials file...`, colors.yellow);
    const awsCredentials = {
      accessKeyId: "YOUR_AWS_ACCESS_KEY_ID",
      secretAccessKey: "YOUR_AWS_SECRET_ACCESS_KEY",
      region: "us-east-1"
    };
    fs.writeFileSync(PATHS.awsCredentials, JSON.stringify(awsCredentials, null, 2));
    log(`✅ AWS credentials file created`, colors.green);
  } else {
    log(`✅ AWS credentials file already exists`, colors.green);
  }
  
  // Create GCP credentials if they don't exist
  if (!fs.existsSync(PATHS.gcpCredentials)) {
    log(`Creating GCP credentials file...`, colors.yellow);
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
      "client_x509_cert_url": "YOUR_CLIENT_CERT_URL"
    };
    fs.writeFileSync(PATHS.gcpCredentials, JSON.stringify(gcpCredentials, null, 2));
    log(`✅ GCP credentials file created`, colors.green);
  } else {
    log(`✅ GCP credentials file already exists`, colors.green);
  }
}

// Check required dependencies in package.json
function checkRequiredDependencies() {
  log(`Checking required dependencies...`, colors.blue);
  
  try {
    // Read package.json
    const packageJson = require(PATHS.backendPackageJson);
    
    // Required dependencies
    const requiredDeps = ['express', 'cors', 'js-yaml', 'axios'];
    
    // Check each dependency
    const missingDeps = [];
    for (const dep of requiredDeps) {
      if (!packageJson.dependencies[dep] && !packageJson.devDependencies[dep]) {
        missingDeps.push(dep);
      }
    }
    
    if (missingDeps.length > 0) {
      log(`⚠️ Missing dependencies: ${missingDeps.join(', ')}`, colors.yellow);
      return missingDeps;
    } else {
      log(`✅ All required dependencies are present`, colors.green);
      return [];
    }
  } catch (error) {
    log(`❌ Error checking dependencies: ${error.message}`, colors.red);
    return [];
  }
}

// Install missing dependencies
async function installMissingDependencies(missingDeps) {
  if (missingDeps.length === 0) return true;
  
  const answer = await askQuestion(`Do you want to install missing dependencies: ${missingDeps.join(', ')}? (y/n) `);
  
  if (answer.toLowerCase() === 'y') {
    log(`Installing missing dependencies...`, colors.blue);
    try {
      const command = `npm install --save ${missingDeps.join(' ')}`;
      execSync(command, { cwd: PATHS.backendDir, stdio: 'inherit' });
      log(`✅ Dependencies installed successfully`, colors.green);
      return true;
    } catch (error) {
      log(`❌ Failed to install dependencies: ${error.message}`, colors.red);
      return false;
    }
  } else {
    log(`⚠️ Skipping dependency installation`, colors.yellow);
    return false;
  }
}

// Move VM monitoring manager if it's in the wrong location
async function fixVmMonitoringManager() {
  log(`Checking VM monitoring manager...`, colors.blue);
  
  const vmMonitoringExists = checkFileExists(PATHS.vmMonitoringManager, 'vm_monitoring_manager.js');
  
  if (!vmMonitoringExists) {
    // Check if it exists in src directory
    const srcVmMonitoringExists = checkFileExists(PATHS.srcVmMonitoringManager, 'vm_monitoring_manager.js (in src)');
    
    if (srcVmMonitoringExists) {
      const answer = await askQuestion(`VM monitoring manager found in src directory. Do you want to copy it to main_server? (y/n) `);
      
      if (answer.toLowerCase() === 'y') {
        copyFile(PATHS.srcVmMonitoringManager, PATHS.vmMonitoringManager, 'vm_monitoring_manager.js');
      }
    } else {
      log(`❌ VM monitoring manager not found in src directory either`, colors.red);
    }
  }
}

// Check and fix VM allocation engine
async function fixVmAllocationEngine() {
  log(`Checking VM allocation engine...`, colors.blue);
  
  const vmAllocationExists = checkDirExists(PATHS.vmAllocationDir, 'vm_allocation_engine');
  
  if (!vmAllocationExists) {
    // Check if it exists in src directory
    const srcVmAllocationExists = checkDirExists(PATHS.srcVmAllocationDir, 'vm_allocation_engine (in src)');
    
    if (srcVmAllocationExists) {
      const answer = await askQuestion(`VM allocation engine found in src directory. Do you want to copy it to main_server? (y/n) `);
      
      if (answer.toLowerCase() === 'y') {
        copyDirectoryRecursive(PATHS.srcVmAllocationDir, PATHS.vmAllocationDir);
      }
    } else {
      log(`❌ VM allocation engine not found in src directory either`, colors.red);
    }
  }
}

// Start the server
function startServer() {
  log(`Starting server...`, colors.blue);
  
  try {
    const serverProcess = spawn('node', ['server.js'], {
      cwd: PATHS.mainServerDir,
      stdio: 'inherit'
    });
    
    serverProcess.on('error', (error) => {
      log(`❌ Failed to start server: ${error.message}`, colors.red);
    });
    
    serverProcess.on('exit', (code) => {
      if (code !== 0) {
        log(`❌ Server exited with code ${code}`, colors.red);
      } else {
        log(`✅ Server stopped`, colors.green);
      }
      process.exit();
    });
    
    log(`✅ Server started successfully`, colors.green);
    
    // Handle process termination
    process.on('SIGINT', () => {
      log(`Shutting down server...`, colors.blue);
      serverProcess.kill();
      rl.close();
      process.exit();
    });
  } catch (error) {
    log(`❌ Failed to start server: ${error.message}`, colors.red);
  }
}

// Main diagnostic function
async function runDiagnostics() {
  log(`=== SERVER ISSUE FIXER ===`, colors.blue);
  
  // Check port usage
  const portInUse = checkPortInUse();
  if (portInUse) {
    const killProcess = await askQuestion('Port 3006 is in use. Do you want to kill the process? (y/n) ');
    if (killProcess.toLowerCase() === 'y') {
      await killProcessUsingPort();
    }
  }
  
  // Check directories
  checkDirExists(PATHS.mainServerDir, 'main_server');
  checkDirExists(PATHS.srcDir, 'src');
  
  // Check files
  checkFileExists(PATHS.mainServerJs, 'server.js');
  checkFileExists(PATHS.backendPackageJson, 'package.json');
  
  // Check required dependencies
  const missingDeps = checkRequiredDependencies();
  if (missingDeps.length > 0) {
    await installMissingDependencies(missingDeps);
  }
  
  // Check credentials
  createCredentialsFiles();
  
  // Fix VM monitoring manager
  await fixVmMonitoringManager();
  
  // Fix VM allocation engine
  await fixVmAllocationEngine();
  
  // Ask to start server
  const answer = await askQuestion('Do you want to start the server now? (y/n) ');
  if (answer.toLowerCase() === 'y') {
    startServer();
  } else {
    log(`Fixes completed. Run 'node main_server/server.js' to start the server.`, colors.blue);
    rl.close();
  }
}

// Run diagnostics
runDiagnostics().catch(error => {
  log(`❌ Error running diagnostics: ${error.message}`, colors.red);
  rl.close();
}); 