# Testing the VM Monitoring and Logging API

This document provides instructions for testing the VM Monitoring and Logging API endpoints.

## Available Test Scripts

We've provided several test scripts to verify the API functionality:

1. `test_monitoring_endpoints.js` - Node.js script that tests all endpoints with real API calls
2. `test_monitoring_endpoints.ps1` - PowerShell script for testing all endpoints
3. `test_monitoring_endpoints.sh` - Bash script for testing all endpoints
4. `test_monitoring_endpoints_offline.js` - Node.js script with mocked responses (no actual API calls)

## Running the Tests

### Prerequisites

- Node.js installed (for the Node.js test scripts)
- PowerShell (for the PowerShell test script)
- Bash shell (for the bash script, available through WSL on Windows)
- The server application must be running for the live tests (except for the offline test)

### Testing with Node.js

```bash
# First, install required dependencies
npm install axios

# For real API calls (requires actual cloud resources)
node test_monitoring_endpoints.js

# For offline testing with mocked responses
node test_monitoring_endpoints_offline.js
```

### Testing with PowerShell

```powershell
# Run from the main_server directory
.\test_monitoring_endpoints.ps1
```

### Testing with Bash

```bash
# Make the script executable (Linux/Mac/WSL)
chmod +x test_monitoring_endpoints.sh

# Run the script
./test_monitoring_endpoints.sh
```

## Customizing the Tests

The test scripts use example instance IDs, regions, and zones that should be replaced with real values from your environment:

- AWS_INSTANCE_ID: Your actual EC2 instance ID
- AWS_REGION: The region where your EC2 instance is located
- AWS_LOG_GROUP: The CloudWatch Log Group to query
- AWS_COMMAND_ID: The SSM command ID from a previous agent configuration

- GCP_INSTANCE_ID: Your GCP compute instance name
- GCP_ZONE: The zone where your GCP instance is located
- GCP_LOG_GROUP: The log group name for GCP

## Offline Testing

The `test_monitoring_endpoints_offline.js` script provides a way to test the API endpoint interfaces without making actual API calls. It uses mocked responses to simulate successful API interactions.

This is useful for:
- Understanding the expected request/response formats
- Verifying the API design
- Testing without actual cloud resources

To run the offline test:

```bash
node test_monitoring_endpoints_offline.js
```

## API Endpoint Documentation

See the `README.md` file for complete API endpoint documentation. 