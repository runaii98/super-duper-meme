# Start Server PowerShell Script

Write-Host "Starting server setup..." -ForegroundColor Cyan

# Check if port 3006 is in use and kill the process if necessary
$portCheck = netstat -ano | findstr :3006
if ($portCheck) {
    Write-Host "Port 3006 is in use. Attempting to free it..." -ForegroundColor Yellow
    $processId = ($portCheck -split ' ')[-1]
    try {
        taskkill /F /PID $processId
        Write-Host "Killed process with PID: $processId" -ForegroundColor Green
    } catch {
        Write-Host "Failed to kill process. You may need to manually free port 3006." -ForegroundColor Red
    }
}

# Run the fix script first
Write-Host "Running fix script..." -ForegroundColor Cyan
node fix_server.js

# Check if the fix script was successful
if ($LASTEXITCODE -ne 0) {
    Write-Host "Fix script failed. Please check the errors above." -ForegroundColor Red
    exit 1
}

# Change directory to main_server and start the server
Write-Host "Starting server..." -ForegroundColor Green
cd main_server
node server.js

# If the server exits, return to the original directory
cd ..

# Check if vm_monitoring_manager.js exists
if (-not (Test-Path -Path ".\main_server\vm_monitoring_manager.js")) {
    Write-Host "vm_monitoring_manager.js not found in main_server directory"
    
    if (Test-Path -Path ".\src\vm_monitoring_manager.js") {
        Write-Host "Found vm_monitoring_manager.js in src directory"
        $copy = Read-Host "Do you want to copy it to main_server? (y/n)"
        
        if ($copy -eq "y") {
            # Create directory if it doesn't exist
            if (-not (Test-Path -Path ".\main_server")) {
                New-Item -Path ".\main_server" -ItemType Directory -Force
            }
            
            Copy-Item -Path ".\src\vm_monitoring_manager.js" -Destination ".\main_server\vm_monitoring_manager.js" -Force
            Write-Host "Copied vm_monitoring_manager.js to main_server directory"
        }
    }
}

# Check if vm_allocation_engine directory exists
if (-not (Test-Path -Path ".\main_server\vm_allocation_engine")) {
    Write-Host "vm_allocation_engine directory not found in main_server directory"
    
    if (Test-Path -Path ".\src\vm_allocation_engine") {
        Write-Host "Found vm_allocation_engine directory in src directory"
        $copy = Read-Host "Do you want to copy it to main_server? (y/n)"
        
        if ($copy -eq "y") {
            # Create directory if it doesn't exist
            if (-not (Test-Path -Path ".\main_server")) {
                New-Item -Path ".\main_server" -ItemType Directory -Force
            }
            
            # Create vm_allocation_engine directory
            if (-not (Test-Path -Path ".\main_server\vm_allocation_engine")) {
                New-Item -Path ".\main_server\vm_allocation_engine" -ItemType Directory -Force
            }
            
            # Copy all files recursively
            Copy-Item -Path ".\src\vm_allocation_engine\*" -Destination ".\main_server\vm_allocation_engine\" -Recurse -Force
            Write-Host "Copied vm_allocation_engine directory to main_server directory"
        }
    }
}

# Check credentials directory
if (-not (Test-Path -Path ".\main_server\credentials")) {
    Write-Host "credentials directory not found in main_server directory, creating it..."
    New-Item -Path ".\main_server\credentials" -ItemType Directory -Force
}

# Check AWS credentials
if (-not (Test-Path -Path ".\main_server\credentials\aws.json")) {
    Write-Host "AWS credentials not found, creating placeholder..."
    $awsCredentials = @"
{
  "accessKeyId": "YOUR_AWS_ACCESS_KEY_ID",
  "secretAccessKey": "YOUR_AWS_SECRET_ACCESS_KEY",
  "region": "us-east-1"
}
"@
    Set-Content -Path ".\main_server\credentials\aws.json" -Value $awsCredentials
    Write-Host "Created AWS credentials placeholder"
}

# Check GCP credentials
if (-not (Test-Path -Path ".\main_server\credentials\gcp.json")) {
    Write-Host "GCP credentials not found, creating placeholder..."
    $gcpCredentials = @"
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
"@
    Set-Content -Path ".\main_server\credentials\gcp.json" -Value $gcpCredentials
    Write-Host "Created GCP credentials placeholder"
} 