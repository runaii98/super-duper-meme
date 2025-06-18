#!/bin/bash

# Run API Tests Bash Script

# Define colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Parse command line arguments
BASIC=false
COMPREHENSIVE=false
ALL=false

# If no arguments provided, show usage
if [ $# -eq 0 ]; then
    echo -e "${YELLOW}Usage:${NC}"
    echo -e "${YELLOW}  ./run_tests.sh --basic            # Run basic API tests${NC}"
    echo -e "${YELLOW}  ./run_tests.sh --comprehensive    # Run comprehensive API tests${NC}"
    echo -e "${YELLOW}  ./run_tests.sh --all              # Run all API tests${NC}"
    exit 1
fi

# Parse arguments
for arg in "$@"
do
    case $arg in
        --basic)
        BASIC=true
        shift
        ;;
        --comprehensive)
        COMPREHENSIVE=true
        shift
        ;;
        --all)
        ALL=true
        shift
        ;;
        *)
        echo -e "${RED}Unknown argument: $arg${NC}"
        exit 1
        ;;
    esac
done

echo -e "${CYAN}Cloud Provider Management API Tests${NC}"
echo -e "${CYAN}=================================${NC}"

# Check if server is running
SERVER_RUNNING=false
if curl -s http://localhost:3006/ > /dev/null; then
    SERVER_RUNNING=true
    echo -e "${GREEN}✅ Server is running${NC}"
else
    echo -e "${RED}❌ Server is not running. Starting server...${NC}"
    
    # Start the server in a new terminal window
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        osascript -e 'tell app "Terminal" to do script "cd '$(pwd)'/main_server && node server.js"'
    else
        # Linux
        if command -v gnome-terminal &> /dev/null; then
            gnome-terminal -- bash -c "cd $(pwd)/main_server && node server.js; exec bash"
        elif command -v xterm &> /dev/null; then
            xterm -e "cd $(pwd)/main_server && node server.js" &
        else
            # Fallback: run in background
            echo -e "${YELLOW}No terminal emulator found. Running server in background...${NC}"
            cd main_server && node server.js > ../server.log 2>&1 &
            cd ..
        fi
    fi
    
    # Wait for server to start
    echo -e "${YELLOW}Waiting for server to start...${NC}"
    sleep 5
    
    # Check if server started successfully
    if curl -s http://localhost:3006/ > /dev/null; then
        SERVER_RUNNING=true
        echo -e "${GREEN}✅ Server started successfully${NC}"
    else
        echo -e "${RED}❌ Failed to start server. Please check for errors.${NC}"
    fi
fi

# Only proceed if server is running
if [ "$SERVER_RUNNING" = true ]; then
    # Run basic tests if specified or if all tests are requested
    if [ "$BASIC" = true ] || [ "$ALL" = true ]; then
        echo -e "\n${CYAN}Running Basic API Tests...${NC}"
        node test_basic_endpoints.js
    fi
    
    # Run comprehensive tests if specified or if all tests are requested
    if [ "$COMPREHENSIVE" = true ] || [ "$ALL" = true ]; then
        echo -e "\n${CYAN}Running Comprehensive API Tests...${NC}"
        node tests/test_api_endpoints.js
    fi
else
    echo -e "${RED}Tests cannot be run because the server is not running.${NC}"
fi 