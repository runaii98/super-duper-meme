# Cloud Provider Management Server Setup

This document provides instructions for setting up and running the Cloud Provider Management Server.

## Prerequisites

- Node.js v14.x or higher
- npm v6.x or higher
- Access to AWS and GCP credentials (for full functionality)

## Quick Start

To quickly start the server:

1. On Windows: Run the PowerShell script
   ```powershell
   .\start_server.ps1
   ```

2. On Linux/MacOS: Use the bash script
   ```bash
   ./start_server.sh
   ```

3. Using npm:
   ```bash
   npm run start
   ```

## Setup and Troubleshooting

If you encounter issues with the server, you can run the fix script:

```bash
npm run fix
```

This will:
1. Check for processes using port 3006 and kill them if necessary
2. Ensure all required files are in the correct locations
3. Create placeholder credential files if they don't exist
4. Install missing dependencies

## Manual Setup

If you need to manually set up the server:

1. Ensure required dependencies are installed:
   ```bash
   npm install
   ```

2. Check that the following directories and files exist:
   - `main_server/vm_allocation_engine/`
   - `main_server/vm_monitoring_manager.js`
   - `main_server/credentials/aws.json`
   - `main_server/credentials/gcp.json`
   - `main_server/routes/`
   - `main_server/services/`

3. If files are missing, they might be in the `src/` directory. Copy them to the appropriate locations.

4. Create credential files if they don't exist. Example formats:

   **AWS Credentials (aws.json)**:
   ```json
   {
     "accessKeyId": "YOUR_AWS_ACCESS_KEY_ID",
     "secretAccessKey": "YOUR_AWS_SECRET_ACCESS_KEY",
     "region": "us-east-1"
   }
   ```

   **GCP Credentials (gcp.json)**:
   ```json
   {
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
   }
   ```

## API Endpoints

The server runs on port 3006 by default and provides the following endpoints:

- `GET /` - Basic health check
- `GET /api/providers` - List available cloud providers
- `POST /api/v1/find-cheapest-instance` - Find optimal VM instances
- `POST /api/v1/provision-vm` - Provision a new VM
- `GET /api/v1/instances` - List all VM instances
- `GET /api/v1/os-images` - List available OS images

For more details on API usage, refer to the API documentation.

## Common Issues

1. **Port Already in Use**: If port 3006 is already in use, the server will fail to start. Use the start script to automatically detect and resolve this issue.

2. **Missing Dependencies**: If you encounter "Cannot find module" errors, run `npm install` to install missing dependencies.

3. **Invalid Credentials**: If you see credential warnings, update the credential files with valid AWS/GCP credentials.

4. **File Structure Issues**: If files are missing, they might be in the `src/` directory. Use the fix script to resolve this automatically.

## Environment Variables

You can customize the server behavior with these environment variables:

- `PORT` - Change the server port (default: 3006)
- `NODE_ENV` - Set the environment (development, production, test) 