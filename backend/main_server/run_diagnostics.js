#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const readline = require('readline');
const chalk = require('chalk') || { green: (text) => `✅ ${text}`, red: (text) => `❌ ${text}`, yellow: (text) => `⚠️ ${text}`, blue: (text) => `ℹ️ ${text}` };

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// File and directory paths
const PATHS = {
  serverJs: path.join(__dirname, 'server.js'),
  packageJson: path.join(__dirname, 'package.json'),
  credentialsDir: path.join(__dirname, 'credentials'),
  vmAllocationDir: path.join(__dirname, 'vm_allocation_engine'),
  awsCredentials: path.join(__dirname, 'credentials', 'aws.json'),
  gcpCredentials: path.join(__dirname, 'credentials', 'gcp.json'),
};

// Check if server is running
function checkServerRunning(port = 3006) {
  try {
    console.log(chalk.blue(`Checking if server is already running on port ${port}...`));
    const isWin = process.platform === "win32";
    
    let command;
    if (isWin) {
      command = `netstat -ano | findstr :${port}`;
    } else {
      command = `lsof -i:${port} -t`;
    }
    
    const result = execSync(command, { encoding: 'utf-8' });
    if (result) {
      console.log(chalk.yellow(`Server is already running on port ${port}`));
      
      const killServer = readline.question ? 
        readline.question('Do you want to kill the process and restart? (y/n): ') : 
        askQuestion('Do you want to kill the process and restart? (y/n): ');
      
      if (killServer.toLowerCase() === 'y') {
        killServerProcess(port);
        return false;
      }
      return true;
    }
  } catch (error) {
    console.log(chalk.blue(`No server detected running on port ${port}`));
    return false;
  }
  return false;
}

// Kill server process
function killServerProcess(port) {
  console.log(chalk.blue(`Attempting to kill process on port ${port}...`));
  try {
    const isWin = process.platform === "win32";
    
    if (isWin) {
      const pidCommand = `netstat -ano | findstr :${port}`;
      const output = execSync(pidCommand, { encoding: 'utf-8' });
      const lines = output.split('\n');
      
      for (const line of lines) {
        if (line.includes(`${port}`)) {
          const match = line.match(/(\d+)$/);
          if (match && match[1]) {
            const pid = match[1].trim();
            console.log(chalk.blue(`Killing process with PID: ${pid}`));
            execSync(`taskkill /F /PID ${pid}`);
          }
        }
      }
    } else {
      execSync(`kill $(lsof -t -i:${port})`);
    }
    console.log(chalk.green(`Successfully killed process on port ${port}`));
  } catch (error) {
    console.log(chalk.red(`Failed to kill process: ${error.message}`));
  }
}

// Check if file exists
function checkFileExists(filePath, fileName) {
  console.log(chalk.blue(`Checking if ${fileName} exists...`));
  if (fs.existsSync(filePath)) {
    console.log(chalk.green(`${fileName} found at ${filePath}`));
    return true;
  } else {
    console.log(chalk.red(`${fileName} not found at ${filePath}`));
    return false;
  }
}

// Check required npm packages
function checkRequiredPackages() {
  console.log(chalk.blue('Checking required npm packages...'));
  
  try {
    const packageJson = require(PATHS.packageJson);
    const requiredPackages = [
      'express', 'cors', 'body-parser', 'js-yaml', 'axios', 
      'dotenv', 'uuid', 'morgan', 'winston'
    ];
    
    const missingPackages = [];
    
    for (const pkg of requiredPackages) {
      if (!packageJson.dependencies[pkg] && !packageJson.devDependencies[pkg]) {
        missingPackages.push(pkg);
      }
    }
    
    if (missingPackages.length > 0) {
      console.log(chalk.red(`Missing required packages: ${missingPackages.join(', ')}`));
      
      const installMissing = askQuestion('Do you want to install missing packages? (y/n): ');
      
      if (installMissing.toLowerCase() === 'y') {
        console.log(chalk.blue(`Installing missing packages: ${missingPackages.join(', ')}...`));
        try {
          execSync(`npm install --save ${missingPackages.join(' ')}`, { 
            cwd: path.dirname(PATHS.packageJson),
            stdio: 'inherit'
          });
          console.log(chalk.green('Packages installed successfully'));
        } catch (error) {
          console.log(chalk.red(`Failed to install packages: ${error.message}`));
        }
      }
    } else {
      console.log(chalk.green('All required packages are installed'));
    }
  } catch (error) {
    console.log(chalk.red(`Error checking package.json: ${error.message}`));
  }
}

// Check and create cloud provider credentials
function checkCredentials() {
  console.log(chalk.blue('Checking cloud provider credentials...'));
  
  // Create credentials directory if it doesn't exist
  if (!fs.existsSync(PATHS.credentialsDir)) {
    console.log(chalk.yellow('Credentials directory not found, creating it...'));
    fs.mkdirSync(PATHS.credentialsDir, { recursive: true });
  }
  
  // Check AWS credentials
  if (!fs.existsSync(PATHS.awsCredentials)) {
    console.log(chalk.yellow('AWS credentials not found, creating placeholder...'));
    const awsTemplate = {
      accessKeyId: "YOUR_AWS_ACCESS_KEY_ID",
      secretAccessKey: "YOUR_AWS_SECRET_ACCESS_KEY",
      region: "us-east-1"
    };
    fs.writeFileSync(PATHS.awsCredentials, JSON.stringify(awsTemplate, null, 2));
    console.log(chalk.green('Created AWS credentials placeholder'));
  }
  
  // Check GCP credentials
  if (!fs.existsSync(PATHS.gcpCredentials)) {
    console.log(chalk.yellow('GCP credentials not found, creating placeholder...'));
    const gcpTemplate = {
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
    fs.writeFileSync(PATHS.gcpCredentials, JSON.stringify(gcpTemplate, null, 2));
    console.log(chalk.green('Created GCP credentials placeholder'));
  }
}

// Check VM allocation engine files
function checkVmAllocationEngine() {
  console.log(chalk.blue('Checking VM allocation engine files...'));
  
  if (!fs.existsSync(PATHS.vmAllocationDir)) {
    console.log(chalk.red('VM allocation engine directory not found!'));
    console.log(chalk.yellow('Checking if VM allocation engine files exist in src directory...'));
    
    const srcVmAllocationDir = path.join(__dirname, 'src', 'vm_allocation_engine');
    if (fs.existsSync(srcVmAllocationDir)) {
      console.log(chalk.yellow('VM allocation engine files found in src directory, moving to correct location...'));
      
      try {
        fs.mkdirSync(PATHS.vmAllocationDir, { recursive: true });
        
        // Copy all files from src/vm_allocation_engine to vm_allocation_engine
        const files = fs.readdirSync(srcVmAllocationDir, { withFileTypes: true });
        
        for (const file of files) {
          const srcPath = path.join(srcVmAllocationDir, file.name);
          const destPath = path.join(PATHS.vmAllocationDir, file.name);
          
          if (file.isDirectory()) {
            fs.mkdirSync(destPath, { recursive: true });
            // Copy subdirectory files
            const subFiles = fs.readdirSync(srcPath);
            for (const subFile of subFiles) {
              const subSrcPath = path.join(srcPath, subFile);
              const subDestPath = path.join(destPath, subFile);
              fs.copyFileSync(subSrcPath, subDestPath);
            }
          } else {
            fs.copyFileSync(srcPath, destPath);
          }
        }
        
        console.log(chalk.green('VM allocation engine files moved successfully'));
      } catch (error) {
        console.log(chalk.red(`Failed to move VM allocation engine files: ${error.message}`));
      }
    } else {
      console.log(chalk.red('VM allocation engine files not found in src directory'));
      return false;
    }
  } else {
    console.log(chalk.green('VM allocation engine directory exists'));
  }
  
  // Check for specific required files
  const requiredFiles = [
    'index.js',
    'region_selector.js',
    'vm_provisioner.js',
    'allocation_algorithm.js'
  ];
  
  let missingFiles = [];
  for (const file of requiredFiles) {
    const filePath = path.join(PATHS.vmAllocationDir, file);
    if (!fs.existsSync(filePath)) {
      missingFiles.push(file);
    }
  }
  
  if (missingFiles.length > 0) {
    console.log(chalk.red(`Missing VM allocation engine files: ${missingFiles.join(', ')}`));
    return false;
  }
  
  return true;
}

// Function to ask questions and get user input
function askQuestion(question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer);
    });
  });
}

// Start server
async function startServer() {
  console.log(chalk.blue('Starting server...'));
  
  const serverProcess = spawn('node', ['server.js'], {
    cwd: __dirname,
    stdio: 'inherit'
  });
  
  serverProcess.on('error', (error) => {
    console.log(chalk.red(`Failed to start server: ${error.message}`));
  });
  
  serverProcess.on('exit', (code) => {
    if (code !== 0) {
      console.log(chalk.red(`Server exited with code ${code}`));
    } else {
      console.log(chalk.green('Server stopped'));
    }
  });
  
  console.log(chalk.green('Server started'));
  
  // Keep the process alive
  process.stdin.resume();
  
  // Handle cleanup on exit
  process.on('SIGINT', () => {
    console.log(chalk.blue('Shutting down server...'));
    serverProcess.kill();
    rl.close();
    process.exit();
  });
}

// Main diagnostic function
async function runDiagnostics() {
  console.log(chalk.blue('Running server diagnostics...'));
  
  // Check if server is already running
  const isServerRunning = checkServerRunning();
  if (isServerRunning) {
    console.log(chalk.yellow('Server is already running. Please stop it before running diagnostics.'));
    rl.close();
    return;
  }
  
  // Check if server.js exists
  const serverExists = checkFileExists(PATHS.serverJs, 'server.js');
  if (!serverExists) {
    console.log(chalk.red('Cannot proceed without server.js'));
    rl.close();
    return;
  }
  
  // Check required packages
  checkRequiredPackages();
  
  // Check credentials
  checkCredentials();
  
  // Check VM allocation engine
  const vmAllocationEngineOk = checkVmAllocationEngine();
  if (!vmAllocationEngineOk) {
    const proceed = await askQuestion('VM allocation engine issues detected. Continue anyway? (y/n): ');
    if (proceed.toLowerCase() !== 'y') {
      console.log(chalk.yellow('Exiting diagnostic tool.'));
      rl.close();
      return;
    }
  }
  
  // Ask to start the server
  const startServerNow = await askQuestion('Do you want to start the server now? (y/n): ');
  if (startServerNow.toLowerCase() === 'y') {
    await startServer();
  } else {
    console.log(chalk.yellow('Server not started. Diagnostics completed.'));
    rl.close();
  }
}

// Run the diagnostics
runDiagnostics().catch(error => {
  console.error('Error running diagnostics:', error);
  rl.close();
}); 