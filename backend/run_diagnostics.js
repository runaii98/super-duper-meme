const axios = require('axios');
const chalk = require('chalk');
const path = require('path');
const credentialsManager = require('./main_server/vm_allocation_engine/credentials_manager');

const API_BASE_URL = 'http://localhost:3006/api';
const PROVIDERS = ['aws', 'gcp'];

// #region Helper Functions
const printHeader = (message, color = 'blue') => {
  console.log(chalk[color].bold(`\n--- ${message} ---\n`));
};

const printSubHeader = (message) => {
  console.log(chalk.cyan.bold(`\n===== ${message} =====`));
};

const printSuccess = (message) => {
  console.log(chalk.green(`✅ ${message}`));
};

const printFailure = (message, error) => {
  console.log(chalk.red(`❌ ${message}`));
  if (error) {
    const errorDetails = error.response ? error.response.data : (error.message || error);
    console.log(chalk.red.dim('   Error details:', JSON.stringify(errorDetails, null, 2)));
  }
};

const printWarning = (message) => {
    console.log(chalk.yellow(`⚠️  ${message}`));
}

const printInfo = (message) => {
  console.log(chalk.gray(`   -> ${message}`));
};
// #endregion

// #region Check 1: Credentials
async function checkCredentials() {
  printSubHeader('Check 1: Cloud Credentials');
  let failures = 0;

  try {
    printInfo('Loading AWS credentials...');
    await credentialsManager.loadAwsCredentials();
    printSuccess('AWS credentials loaded successfully.');
  } catch (error) {
    printFailure('Failed to load AWS credentials.', error);
    failures++;
  }

  try {
    printInfo('Loading GCP credentials...');
    await credentialsManager.loadGcpCredentials();
    printSuccess('GCP credentials loaded successfully.');
  } catch (error) {
    printFailure('Failed to load GCP credentials.', error);
    failures++;
  }
  
  if (failures === 0) {
      printSuccess('All credential checks passed!');
  } else {
      printWarning(`${failures} credential check(s) failed.`);
  }

  return failures;
}
// #endregion

// #region Check 2: API Endpoints
async function testApiEndpoints() {
    printSubHeader('Check 2: API Endpoint Tests');
    let failures = 0;

    // 1. Server Health Check
    printInfo('Checking server health...');
    try {
        const response = await axios.get(`${API_BASE_URL}/providers/gcp/regions`);
        if (response.status === 200) {
            printSuccess('Server is responsive.');
        } else {
            failures++;
            printFailure('Server health check failed. Expected status 200.', { message: `Received status ${response.status}` });
        }
    } catch (error) {
        failures++;
        printFailure('Server health check failed. Server is not reachable.', error);
        printWarning('Aborting API endpoint tests as server is not running.');
        return failures; // Abort if server is down
    }

    // 2. Test Regions Endpoints
    for (const provider of PROVIDERS) {
        printInfo(`Testing ${provider.toUpperCase()} regions endpoint...`);
        try {
            const response = await axios.get(`${API_BASE_URL}/providers/${provider}/regions`);
            if (response.status === 200 && Array.isArray(response.data)) {
                printSuccess(`[${provider.toUpperCase()}] Regions endpoint is OK. Retrieved ${response.data.length} regions.`);
            } else {
                failures++;
                printFailure(`[${provider.toUpperCase()}] Regions endpoint check failed.`, { message: `Received status ${response.status}` });
            }
        } catch (error) {
            failures++;
            printFailure(`[${provider.toUpperCase()}] Regions endpoint check failed.`, error);
        }
    }
    
    // 3. Test Cached VM Instances Endpoint
    for (const provider of PROVIDERS) {
        printInfo(`Testing ${provider.toUpperCase()} cached VM instances endpoint...`);
        try {
            const response = await axios.get(`${API_BASE_URL}/providers/cached-vm-instances?provider=${provider.toUpperCase()}`);
             if (response.status === 200 && response.data.success) {
                printSuccess(`[${provider.toUpperCase()}] Cached VM instances endpoint is OK.`);
            } else {
                failures++;
                printFailure(`[${provider.toUpperCase()}] Cached VM instances endpoint check failed.`, { message: `Received status ${response.status}` });
            }
        } catch (error) {
            failures++;
            printFailure(`[${provider.toUpperCase()}] Cached VM instances endpoint check failed.`, error);
        }
    }

    if (failures === 0) {
        printSuccess('All API endpoint tests passed!');
    } else {
        printWarning(`${failures} API endpoint test(s) failed.`);
    }

    return failures;
}
// #endregion

// #region Main Diagnostic Runner
async function runDiagnostics() {
  printHeader('Running Platform Diagnostics', 'yellow');
  let totalFailures = 0;

  totalFailures += await checkCredentials();
  totalFailures += await testApiEndpoints();
  
  // Future checks will be added here
  // e.g. totalFailures += await checkDatabaseConnection();

  printHeader('Diagnostic Summary', 'yellow');
  if (totalFailures === 0) {
    printSuccess('🎉 All diagnostic checks passed successfully!');
  } else {
    printFailure(`A total of ${totalFailures} checks failed. Please review the logs above.`);
  }
}

runDiagnostics().catch(error => {
  console.error(chalk.red.bold('\nAn unexpected error occurred during the diagnostic run:'));
  console.error(error);
}); 