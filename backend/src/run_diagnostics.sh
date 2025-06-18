#!/bin/bash

# Initialize variables
SERVER_PID=""
TIMEOUT=5

# Cleanup function
cleanup() {
  echo "Cleaning up..."
  if [ ! -z "$SERVER_PID" ]; then
    echo "Stopping server (PID: $SERVER_PID)..."
    kill $SERVER_PID
  fi
  exit 0
}

# Catch interrupts and exits
trap cleanup SIGINT SIGTERM EXIT

# Start the server
echo "Starting server..."
node server.js &
SERVER_PID=$!
echo "Server started with PID: $SERVER_PID"

# Wait for server to start up
echo "Waiting $TIMEOUT seconds for server to start..."
sleep $TIMEOUT

# Update instance IDs - uncomment and modify these lines with your actual values
echo "IMPORTANT: Before running the test, edit test_monitoring_endpoints_diagnostic.js"
echo "to replace placeholders with actual VM instance IDs and regions."
read -p "Press Enter to continue (after updating instance IDs)..."

# Run the diagnostic test
echo "Running diagnostic test..."
node test_monitoring_endpoints_diagnostic.js

# Keep the script running until user interrupts
echo "Test complete. Press Ctrl+C to exit and stop the server."
wait $SERVER_PID 