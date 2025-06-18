# Run API Tests PowerShell Script

param (
    [switch]$Basic,
    [switch]$Comprehensive,
    [switch]$All
)

Write-Host "Cloud Provider Management API Tests" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# If no parameters are specified, show usage
if (-not ($Basic -or $Comprehensive -or $All)) {
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\run_tests.ps1 -Basic            # Run basic API tests" -ForegroundColor Yellow
    Write-Host "  .\run_tests.ps1 -Comprehensive    # Run comprehensive API tests" -ForegroundColor Yellow
    Write-Host "  .\run_tests.ps1 -All             # Run all API tests" -ForegroundColor Yellow
    exit
}

# Check if server is running
$serverRunning = $false
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3006/" -TimeoutSec 5 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        $serverRunning = $true
        Write-Host "✅ Server is running" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Server is not running. Starting server..." -ForegroundColor Red
    
    # Start the server in a new PowerShell window
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\main_server'; node server.js"
    
    # Wait for server to start
    Write-Host "Waiting for server to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    # Check if server started successfully
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3006/" -TimeoutSec 5 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $serverRunning = $true
            Write-Host "✅ Server started successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to start server. Please check for errors." -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Failed to start server. Please check for errors." -ForegroundColor Red
    }
}

# Only proceed if server is running
if ($serverRunning) {
    # Run basic tests if specified or if all tests are requested
    if ($Basic -or $All) {
        Write-Host "`nRunning Basic API Tests..." -ForegroundColor Cyan
        node test_basic_endpoints.js
    }
    
    # Run comprehensive tests if specified or if all tests are requested
    if ($Comprehensive -or $All) {
        Write-Host "`nRunning Comprehensive API Tests..." -ForegroundColor Cyan
        node tests/test_api_endpoints.js
    }
} else {
    Write-Host "Tests cannot be run because the server is not running." -ForegroundColor Red
} 