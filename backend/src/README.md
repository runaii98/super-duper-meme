# VM Monitoring and Logging API

This module provides APIs for setting up and checking the status of monitoring and logging agents on virtual machines in AWS and GCP.

## API Endpoints

### Instance Information

1. **GET /api/v1/instances/:instanceId**
   - Description: Get information about a VM instance
   - Query parameters: 
     - `provider`: 'aws' or 'gcp'
     - `region`: (for AWS)
     - `zone`: (for GCP)

2. **GET /api/v1/instances/:instanceId/console-output**
   - Description: Get console output from a VM instance
   - Query parameters: 
     - `provider`: 'aws' or 'gcp'
     - `region`: (for AWS)
     - `zone`: (for GCP)

3. **GET /api/v1/instances/:instanceId/metrics**
   - Description: List available metrics for a VM instance
   - Query parameters: 
     - `provider`: 'aws' or 'gcp'
     - `region`: (for AWS)
     - `zone`: (for GCP)
     - `namespace`: (optional) Filter metrics by namespace

4. **GET /api/v1/instances/:instanceId/log-groups/:logGroupName/streams**
   - Description: List log streams for a VM instance
   - Query parameters: 
     - `provider`: 'aws' or 'gcp'
     - `region`: (for AWS)
     - `zone`: (for GCP)

### Monitoring Configuration

1. **POST /api/v1/monitoring/instances/:instanceId/configure**
   - Description: Configure monitoring agent on a VM
   - Request Body:
     - `provider`: 'aws' or 'gcp'
     - `region`: AWS region or GCP zone
     - `agentConfiguration`: JSON configuration object for the agent

2. **GET /api/v1/monitoring/instances/:instanceId/agent-status**
   - Description: Check the status of a monitoring agent
   - Query parameters: 
     - `provider`: 'aws' or 'gcp'
     - `region`: AWS region or GCP zone
     - `commandId`: (AWS only) ID of the SSM command used to configure the agent

## Testing the API

We've provided several test scripts to verify the API functionality:

### Using PowerShell

```powershell
# Run the PowerShell test script
.\test_monitoring_endpoints.ps1
```

### Using Bash (WSL or Linux/Mac)

```bash
# Make the script executable
chmod +x test_monitoring_endpoints.sh

# Run the Bash test script
./test_monitoring_endpoints.sh
```

### Using Node.js

```bash
# Install dependencies
npm install axios

# Run the Node.js test script
node test_monitoring_endpoints.js
```

## Notes About Testing

- The test scripts use example instance IDs, regions, and zones that should be replaced with real values from your environment.
- For the AWS CloudWatch Agent, the configuration is passed as a JSON object.
- For the GCP Ops Agent, the configuration follows the YAML format but is passed as a JSON object.
- The GCP project ID is automatically determined from the service account credentials used by the server.

## Implementation Details

- AWS monitoring uses the CloudWatch Agent and AWS Systems Manager (SSM) for installation.
- GCP monitoring uses the Ops Agent with configuration via YAML.
- The APIs are designed to abstract away the cloud provider differences where possible. 

This module provides APIs for setting up and checking the status of monitoring and logging agents on virtual machines in AWS and GCP.

## API Endpoints

### Instance Information

1. **GET /api/v1/instances/:instanceId**
   - Description: Get information about a VM instance
   - Query parameters: 
     - `provider`: 'aws' or 'gcp'
     - `region`: (for AWS)
     - `zone`: (for GCP)

2. **GET /api/v1/instances/:instanceId/console-output**
   - Description: Get console output from a VM instance
   - Query parameters: 
     - `provider`: 'aws' or 'gcp'
     - `region`: (for AWS)
     - `zone`: (for GCP)

3. **GET /api/v1/instances/:instanceId/metrics**
   - Description: List available metrics for a VM instance
   - Query parameters: 
     - `provider`: 'aws' or 'gcp'
     - `region`: (for AWS)
     - `zone`: (for GCP)
     - `namespace`: (optional) Filter metrics by namespace

4. **GET /api/v1/instances/:instanceId/log-groups/:logGroupName/streams**
   - Description: List log streams for a VM instance
   - Query parameters: 
     - `provider`: 'aws' or 'gcp'
     - `region`: (for AWS)
     - `zone`: (for GCP)

### Monitoring Configuration

1. **POST /api/v1/monitoring/instances/:instanceId/configure**
   - Description: Configure monitoring agent on a VM
   - Request Body:
     - `provider`: 'aws' or 'gcp'
     - `region`: AWS region or GCP zone
     - `agentConfiguration`: JSON configuration object for the agent

2. **GET /api/v1/monitoring/instances/:instanceId/agent-status**
   - Description: Check the status of a monitoring agent
   - Query parameters: 
     - `provider`: 'aws' or 'gcp'
     - `region`: AWS region or GCP zone
     - `commandId`: (AWS only) ID of the SSM command used to configure the agent

## Testing the API

We've provided several test scripts to verify the API functionality:

### Using PowerShell

```powershell
# Run the PowerShell test script
.\test_monitoring_endpoints.ps1
```

### Using Bash (WSL or Linux/Mac)

```bash
# Make the script executable
chmod +x test_monitoring_endpoints.sh

# Run the Bash test script
./test_monitoring_endpoints.sh
```

### Using Node.js

```bash
# Install dependencies
npm install axios

# Run the Node.js test script
node test_monitoring_endpoints.js
```

## Notes About Testing

- The test scripts use example instance IDs, regions, and zones that should be replaced with real values from your environment.
- For the AWS CloudWatch Agent, the configuration is passed as a JSON object.
- For the GCP Ops Agent, the configuration follows the YAML format but is passed as a JSON object.
- The GCP project ID is automatically determined from the service account credentials used by the server.

## Implementation Details

- AWS monitoring uses the CloudWatch Agent and AWS Systems Manager (SSM) for installation.
- GCP monitoring uses the Ops Agent with configuration via YAML.
- The APIs are designed to abstract away the cloud provider differences where possible. 