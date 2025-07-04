# Cloud Provider Management System

This system provides a backend API for managing cloud resources across multiple providers (AWS, GCP).

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- AWS and GCP credentials (optional for testing with mocked responses)

### Quick Start

#### Windows
```powershell
# Navigate to the backend directory
cd backend

# Run the start script
.\start_server.ps1
```

#### Linux/Mac
```bash
# Navigate to the backend directory
cd backend

# Make the script executable
chmod +x start_server.sh

# Run the start script
./start_server.sh
```

### Manual Setup

If the quick start scripts don't work for you, follow these steps:

1. Fix the server setup:
```
node fix_server.js
```

2. Start the server:
```
cd main_server
node server.js
```

### Cloud Provider Credentials

The system uses credentials from the following locations:
- AWS: `backend/main_server/credentials/aws.json`
- GCP: `backend/main_server/credentials/gcp.json`

The start scripts will create placeholder credential files if they don't exist. Replace them with your actual credentials for full functionality.

#### AWS Credentials Format
```json
{
  "accessKeyId": "YOUR_AWS_ACCESS_KEY_ID",
  "secretAccessKey": "YOUR_AWS_SECRET_ACCESS_KEY",
  "region": "us-east-1"
}
```

#### GCP Credentials Format
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
  "client_x509_cert_url": "YOUR_CLIENT_X509_CERT_URL"
}
```

## Running API Tests

To test the API endpoints, you can use the provided test scripts:

### Using Test Runner Scripts

#### Windows
```powershell
# Navigate to the backend directory
cd backend

# Run basic tests
.\run_tests.ps1 -Basic

# Run comprehensive tests
.\run_tests.ps1 -Comprehensive

# Run all tests
.\run_tests.ps1 -All
```

#### Linux/Mac
```bash
# Navigate to the backend directory
cd backend

# Make the script executable
chmod +x run_tests.sh

# Run basic tests
./run_tests.sh --basic

# Run comprehensive tests
./run_tests.sh --comprehensive

# Run all tests
./run_tests.sh --all
```

### Manual Testing

#### Basic Tests
```bash
# Navigate to the backend directory
cd backend

# Run the basic API tests
node test_basic_endpoints.js
```

#### Comprehensive Tests
```bash
# Navigate to the backend directory
cd backend

# Run the comprehensive API tests
node tests/test_api_endpoints.js
```

## Available Endpoints

- `GET /` - Basic health check
- `GET /api/v1/os-images` - List available OS images
- `POST /api/v1/find-cheapest-instance` - Find optimal VM instances
- `POST /api/v1/provision-vm` - Provision a new VM
- `GET /api/v1/instances` - List all instances
- `GET /api/providers/aws/regions` - List AWS regions
- `GET /api/providers/gcp/regions` - List GCP regions
- `GET /api/providers/cached-vm-instances` - Get cached VM instances

## Troubleshooting

### Port 3006 Already in Use
If you see an error like `EADDRINUSE: address already in use :::3006`, try:

1. Using the start scripts which attempt to free the port automatically
2. Manually kill the process using port 3006:
   - Windows: `netstat -ano | findstr :3006` then `taskkill /F /PID <PID>`
   - Linux/Mac: `kill -9 $(lsof -i:3006 -t)`

### Missing Modules
If you see errors about missing modules, run:
```
npm install
```

### Credential Issues
If you see warnings about invalid credentials, check that your credential files are properly formatted and contain valid keys.
