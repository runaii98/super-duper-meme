#!/bin/bash

# Start Server Bash Script

echo -e "\033[1;36mStarting server setup...\033[0m"

# Check if port 3006 is in use and kill the process if necessary
PORT_CHECK=$(lsof -i:3006 -t)
if [ ! -z "$PORT_CHECK" ]; then
    echo -e "\033[1;33mPort 3006 is in use. Attempting to free it...\033[0m"
    kill -9 $PORT_CHECK
    echo -e "\033[1;32mKilled process with PID: $PORT_CHECK\033[0m"
fi

# Run the fix script first
echo -e "\033[1;36mRunning fix script...\033[0m"
node fix_server.js

# Check if the fix script was successful
if [ $? -ne 0 ]; then
    echo -e "\033[1;31mFix script failed. Please check the errors above.\033[0m"
    exit 1
fi

# Change directory to main_server and start the server
echo -e "\033[1;32mStarting server...\033[0m"
cd main_server
node server.js

# If the server exits, return to the original directory
cd .. 