# Monitoring and Instance Info Endpoints Testing

This document provides instructions for testing the monitoring and instance info endpoints for AWS and GCP VMs.

## Files Overview

- `test_monitoring_endpoints_diagnostic.js` - Node.js script for testing endpoints with detailed error reporting
- `run_diagnostics.ps1` - PowerShell script to run the server and diagnostic tests (Windows)
- `run_diagnostics.sh` - Shell script to run the server and diagnostic tests (Linux/Mac)

## Prerequisites

1. Ensure Node.js is installed
2. Required npm packages: `axios` and cloud SDKs
   ```
   npm install axios @aws-sdk/client-ssm @aws-sdk/client-ec2 @aws-sdk/client-cloudwatch @aws-sdk/client-cloudwatch-logs @google-cloud/compute @google-cloud/monitoring @google-cloud/logging
   ```
3. Properly configured AWS and GCP credentials in the credentials folder

## Running the Tests

### Step 1: Configure Instance IDs

Edit `test_monitoring_endpoints_diagnostic.js` to replace the placeholder values with your actual VM instance IDs:

```javascript
const AWS_INSTANCE_ID = "REPLACE_WITH_ACTUAL_AWS_INSTANCE_ID"; // e.g. "i-0123456789abcdef0"
const AWS_REGION = "us-east-1";
const AWS_COMMAND_ID = ""; // Leave empty if you don't have one yet

const GCP_INSTANCE_ID = "REPLACE_WITH_ACTUAL_GCP_INSTANCE_ID"; // e.g. "test-vm-gcp-name"
const GCP_ZONE = "us-central1-a";
```

### Step 2: Run the Tests

#### Windows:

```
.\run_diagnostics.ps1
```

#### Linux/Mac:

```
./run_diagnostics.sh
```

Or run the server and tests separately:

```
# Terminal 1 - Start the server
node server.js

# Terminal 2 - Run the diagnostic test
node test_monitoring_endpoints_diagnostic.js
```

## Understanding the Test Results

The diagnostic script will:

1. Test instance info endpoints for both AWS and GCP
2. Test monitoring endpoints for both AWS and GCP
3. Log detailed request and response information for debugging

### Common Issues

- **GCP projectId Issues**: Look for log messages with `[MonitoringService]` or `[InstanceInfoService]` prefixes to see details about projectId retrieval
- **AWS Command Status**: The AWS agent status check requires a valid command ID from a previous agent configuration call

## Troubleshooting

If you encounter issues:

1. Verify VM instances are running and accessible
2. Check credentials and permissions in the credentials folder
3. Review server logs for detailed error information
4. Confirm that the projectId is being properly fetched from GCP credentials

## Using End-to-End Testing

For a full end-to-end test that provisions VMs and then tests the monitoring endpoints:

```
node test_end_to_end.js
```

This script will:
1. Provision AWS and GCP VMs
2. Test all instance info and monitoring endpoints with the new VMs
3. Save the VM details for future reference 