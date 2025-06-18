# PowerShell script to run server and diagnostic tests

# Initialize variables
$serverProcess = $null
$timeout = 5

# Cleanup function
function Cleanup {
    Write-Host "Cleaning up..."
    if ($null -ne $serverProcess) {
        Write-Host "Stopping server (PID: $($serverProcess.Id))..."
        Stop-Process -Id $serverProcess.Id -Force
    }
}

# Register cleanup to happen on script exit
$PSCleanup = [scriptblock]::Create({
    Cleanup
})
$ExecutionContext.SessionState.Module.OnRemove += $PSCleanup

# Start the server
Write-Host "Starting server..."
$serverProcess = Start-Process -FilePath "node" -ArgumentList "server.js" -PassThru -NoNewWindow

# Wait for server to start up
Write-Host "Waiting $timeout seconds for server to start..."
Start-Sleep -Seconds $timeout

# Update instance IDs - instructions for user
Write-Host "IMPORTANT: Before running the test, edit test_monitoring_endpoints_diagnostic.js"
Write-Host "to replace placeholders with actual VM instance IDs and regions."
Read-Host "Press Enter to continue (after updating instance IDs)..."

# Run the diagnostic test
Write-Host "Running diagnostic test..."
node test_monitoring_endpoints_diagnostic.js

# Keep the script running until user interrupts
Write-Host "Test complete. Press Ctrl+C to exit and stop the server."
Wait-Process -Id $serverProcess.Id 