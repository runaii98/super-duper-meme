const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const readline = require('readline');
const credentialsManager = require('./main_server/vm_allocation_engine/credentials_manager');

// Use a dynamic import for chalk
let chalk;
const importChalk = async () => {
  if (!chalk) {
    chalk = (await import('chalk')).default;
  }
};

const API_BASE_URL = 'http://localhost:3006/api';
const PROVIDERS = ['aws', 'gcp'];

// #region Helper Functions
const printHeader = async (message, color = 'blue') => {
  await importChalk();
  console.log(chalk[color].bold(`\n--- ${message} ---\n`));
};

const printSubHeader = async (message) => {
  await importChalk();
  console.log(chalk.cyan.bold(`\n===== ${message} =====`));
};

const printSuccess = async (message) => {
  await importChalk();
  console.log(chalk.green(`✅ ${message}`));
};

const printFailure = async (message, error) => {
  await importChalk();
  console.log(chalk.red(`❌ ${message}`));
  if (error) {
    const errorDetails = error.response ? error.response.data : (error.message || error);
    console.log(chalk.red.dim('   Error details:', JSON.stringify(errorDetails, null, 2)));
  }
};

const printWarning = async (message) => {
  await importChalk();
  console.log(chalk.yellow(`⚠️  ${message}`));
}

const printInfo = async (message) => {
  await importChalk();
  console.log(chalk.gray(`   -> ${message}`));
};
// #endregion

// #region Check 1: Credentials
async function checkCredentials() {
  await printSubHeader('Check 1: Cloud Credentials');
  let failures = 0;

  try {
    await printInfo('Loading AWS credentials...');
    await credentialsManager.loadAwsCredentials();
    await printSuccess('AWS credentials loaded successfully.');
  } catch (error) {
    await printFailure('Failed to load AWS credentials.', error);
    failures++;
  }

  try {
    await printInfo('Loading GCP credentials...');
    await credentialsManager.loadGcpCredentials();
    await printSuccess('GCP credentials loaded successfully.');
  } catch (error) {
    await printFailure('Failed to load GCP credentials.', error);
    failures++;
  }
  
  if (failures === 0) {
      await printSuccess('All credential checks passed!');
  } else {
      await printWarning(`${failures} credential check(s) failed.`);
  }

  return failures;
}
// #endregion

// #region Check 2: API Endpoints

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query) => {
    return new Promise(resolve => rl.question(query, resolve));
};

const startServerProcess = () => {
    console.log(chalk.yellow('\nAttempting to start the server...'));
    const serverPath = path.join(__dirname, 'main_server', 'server.js');
    const child = spawn('node', [serverPath], {
        detached: true,
        stdio: 'ignore' 
    });
    child.unref();
    console.log(chalk.green('Server process started. Please wait a few moments for it to initialize.'));
};

async function testApiEndpoints(isRetry = false) {
    if (!isRetry) {
        await printSubHeader('Check 2: API Endpoint Tests');
    } else {
        await printSubHeader('Check 2: API Endpoint Tests (Re-run)');
    }
    let failures = 0;

    // 1. Server Health Check
    await printInfo('Checking server health...');
    try {
        const response = await axios.get(`${API_BASE_URL}/providers/gcp/regions`);
        if (response.status === 200) {
            await printSuccess('Server is responsive.');
        } else {
            failures++;
            await printFailure('Server health check failed.', { message: `Received status ${response.status}` });
        }
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            await printFailure('Server health check failed. The server appears to be offline.', error);
            const answer = await askQuestion(chalk.yellow.bold('Would you like to try and start the server? (y/n) '));
            if (answer.toLowerCase() === 'y') {
                startServerProcess();
                console.log(chalk.cyan('Waiting 5 seconds for the server to initialize...'));
                await new Promise(resolve => setTimeout(resolve, 5000));
                return testApiEndpoints(true); // Retry the tests
            } else {
                await printWarning('Aborting API endpoint tests.');
                return 1; // Return 1 failure since the server is down
            }
        } else {
            failures++;
            await printFailure('Server health check failed with an unexpected error.', error);
            return failures;
        }
    }

    // 2. Test Regions Endpoints
    for (const provider of PROVIDERS) {
        await printInfo(`Testing ${provider.toUpperCase()} regions endpoint...`);
        try {
            const response = await axios.get(`${API_BASE_URL}/providers/${provider}/regions`);
            if (response.status === 200 && Array.isArray(response.data)) {
                await printSuccess(`[${provider.toUpperCase()}] Regions endpoint is OK. Retrieved ${response.data.length} regions.`);
            } else {
                failures++;
                await printFailure(`[${provider.toUpperCase()}] Regions endpoint check failed.`, { message: `Received status ${response.status}` });
            }
        } catch (error) {
            failures++;
            await printFailure(`[${provider.toUpperCase()}] Regions endpoint check failed.`, error);
        }
    }
    
    // 3. Test Cached VM Instances Endpoint
    for (const provider of PROVIDERS) {
        await printInfo(`Testing ${provider.toUpperCase()} cached VM instances endpoint...`);
        try {
            const response = await axios.get(`${API_BASE_URL}/providers/cached-vm-instances?provider=${provider.toUpperCase()}`);
             if (response.status === 200 && response.data.success) {
                await printSuccess(`[${provider.toUpperCase()}] Cached VM instances endpoint is OK.`);
            } else {
                failures++;
                await printFailure(`[${provider.toUpperCase()}] Cached VM instances endpoint check failed.`, { message: `Received status ${response.status}` });
            }
        } catch (error) {
            failures++;
            await printFailure(`[${provider.toUpperCase()}] Cached VM instances endpoint check failed.`, error);
        }
    }

    if (failures === 0) {
        await printSuccess('All API endpoint tests passed!');
    } else {
        await printWarning(`${failures} API endpoint test(s) failed.`);
    }

    return failures;
}
// #endregion

// #region Main Diagnostic Runner
async function runDiagnostics() {
  await importChalk(); // Ensure chalk is loaded first
  await printHeader('Running Platform Diagnostics', 'yellow');
  let totalFailures = 0;

  totalFailures += await checkCredentials();
  totalFailures += await testApiEndpoints();
  
  // Future checks will be added here
  // e.g. totalFailures += await checkDatabaseConnection();

  await printHeader('Diagnostic Summary', 'yellow');
  if (totalFailures === 0) {
    await printSuccess('🎉 All diagnostic checks passed successfully!');
  } else {
    await printFailure(`A total of ${totalFailures} checks failed. Please review the logs above.`);
  }
  
  rl.close();
}

runDiagnostics().catch(async (error) => {
  await importChalk();
  // Add a check to ensure chalk is available before using it
  if (chalk && chalk.red && chalk.red.bold) {
    console.error(chalk.red.bold('\nAn unexpected error occurred during the diagnostic run:'));
  } else {
    console.error('\nAn unexpected error occurred during the diagnostic run:');
  }
  console.error(error);
  rl.close();
}); 