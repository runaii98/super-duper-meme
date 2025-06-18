#!/bin/bash
# Test script for monitoring and instance info endpoints
# Make sure the server is running before executing this script

# Set the base URL 
BASE_URL="http://localhost:3000/api/v1"

# Color codes for better readability
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=============================================${NC}"
echo -e "${BLUE}Testing Monitoring and Instance Info Endpoints${NC}"
echo -e "${BLUE}=============================================${NC}"

# Sample values - replace with actual values from your environment
# AWS
AWS_INSTANCE_ID="i-0123456789abcdef0"
AWS_REGION="us-east-1"
AWS_LOG_GROUP="/aws/ec2/instance/$AWS_INSTANCE_ID"
AWS_COMMAND_ID="11111111-2222-3333-4444-555555555555" # For agent-status endpoint

# GCP
GCP_INSTANCE_ID="vm-instance-1"  # Instance name in GCP
GCP_ZONE="us-central1-a"
GCP_LOG_GROUP="compute.googleapis.com%2Factivity_log"  # URL encoded

# -----------------------------------------------------
# 1. Test instance_info_routes.js endpoints
# -----------------------------------------------------

echo -e "\n${GREEN}1. Testing Instance Info Endpoints${NC}"

# 1.1 Test describeInstance - AWS
echo -e "\n${YELLOW}1.1 Test GET /instances/$AWS_INSTANCE_ID (AWS)${NC}"
curl -s -X GET "$BASE_URL/instances/$AWS_INSTANCE_ID?provider=aws&region=$AWS_REGION" | json_pp

# 1.2 Test describeInstance - GCP
echo -e "\n${YELLOW}1.2 Test GET /instances/$GCP_INSTANCE_ID (GCP)${NC}"
curl -s -X GET "$BASE_URL/instances/$GCP_INSTANCE_ID?provider=gcp&zone=$GCP_ZONE" | json_pp

# 1.3 Test getConsoleOutput - AWS
echo -e "\n${YELLOW}1.3 Test GET /instances/$AWS_INSTANCE_ID/console-output (AWS)${NC}"
curl -s -X GET "$BASE_URL/instances/$AWS_INSTANCE_ID/console-output?provider=aws&region=$AWS_REGION" | head -n 20

# 1.4 Test getConsoleOutput - GCP
echo -e "\n${YELLOW}1.4 Test GET /instances/$GCP_INSTANCE_ID/console-output (GCP)${NC}"
curl -s -X GET "$BASE_URL/instances/$GCP_INSTANCE_ID/console-output?provider=gcp&zone=$GCP_ZONE" | head -n 20

# 1.5 Test listMetrics - AWS
echo -e "\n${YELLOW}1.5 Test GET /instances/$AWS_INSTANCE_ID/metrics (AWS)${NC}"
curl -s -X GET "$BASE_URL/instances/$AWS_INSTANCE_ID/metrics?provider=aws&region=$AWS_REGION&namespace=AWS/EC2" | json_pp

# 1.6 Test listMetrics - GCP
echo -e "\n${YELLOW}1.6 Test GET /instances/$GCP_INSTANCE_ID/metrics (GCP)${NC}"
curl -s -X GET "$BASE_URL/instances/$GCP_INSTANCE_ID/metrics?provider=gcp&zone=$GCP_ZONE&namespace=compute.googleapis.com/instance" | json_pp

# 1.7 Test listLogStreams - AWS
echo -e "\n${YELLOW}1.7 Test GET /instances/$AWS_INSTANCE_ID/log-groups/$AWS_LOG_GROUP/streams (AWS)${NC}"
curl -s -X GET "$BASE_URL/instances/$AWS_INSTANCE_ID/log-groups/$AWS_LOG_GROUP/streams?provider=aws&region=$AWS_REGION" | json_pp

# 1.8 Test listLogStreams - GCP
echo -e "\n${YELLOW}1.8 Test GET /instances/$GCP_INSTANCE_ID/log-groups/$GCP_LOG_GROUP/streams (GCP)${NC}"
curl -s -X GET "$BASE_URL/instances/$GCP_INSTANCE_ID/log-groups/$GCP_LOG_GROUP/streams?provider=gcp&zone=$GCP_ZONE" | json_pp

# -----------------------------------------------------
# 2. Test monitoring_routes.js endpoints
# -----------------------------------------------------

echo -e "\n${GREEN}2. Testing Monitoring Endpoints${NC}"

# 2.1 Test configureAgent - AWS
echo -e "\n${YELLOW}2.1 Test POST /monitoring/instances/$AWS_INSTANCE_ID/configure (AWS)${NC}"
# Example CloudWatch Agent configuration
AWS_AGENT_CONFIG='{
  "agent": {
    "metrics_collection_interval": 60,
    "run_as_user": "cwagent"
  },
  "metrics": {
    "namespace": "MyCustomNamespace",
    "metrics_collected": {
      "cpu": {
        "resources": ["*"],
        "measurement": ["cpu_usage_idle", "cpu_usage_user", "cpu_usage_system"],
        "totalcpu": true
      },
      "mem": {
        "measurement": ["mem_used_percent"]
      },
      "disk": {
        "resources": ["/"],
        "measurement": ["disk_used_percent"],
        "ignore_file_system_types": ["sysfs", "devtmpfs"]
      }
    }
  }
}'

curl -s -X POST "$BASE_URL/monitoring/instances/$AWS_INSTANCE_ID/configure" \
  -H "Content-Type: application/json" \
  -d "{
      \"provider\": \"aws\",
      \"region\": \"$AWS_REGION\",
      \"agentConfiguration\": $AWS_AGENT_CONFIG
    }" | json_pp

# 2.2 Test configureAgent - GCP
echo -e "\n${YELLOW}2.2 Test POST /monitoring/instances/$GCP_INSTANCE_ID/configure (GCP)${NC}"
# Example Ops Agent configuration for GCP
GCP_AGENT_CONFIG='{
  "metrics": {
    "receivers": {
      "hostmetrics": {
        "type": "hostmetrics",
        "collection_interval": "60s"
      }
    },
    "processors": {
      "metrics_filter": {
        "type": "exclude_metrics",
        "metrics_pattern": []
      }
    },
    "service": {
      "pipelines": {
        "pipeline1": {
          "receivers": ["hostmetrics"],
          "processors": ["metrics_filter"]
        }
      }
    }
  },
  "logging": {
    "receivers": {
      "syslog": {
        "type": "syslog",
        "transport_protocol": "tcp",
        "listen_address": "localhost:5140"
      }
    },
    "service": {
      "pipelines": {
        "pipeline1": {
          "receivers": ["syslog"]
        }
      }
    }
  }
}'

curl -s -X POST "$BASE_URL/monitoring/instances/$GCP_INSTANCE_ID/configure" \
  -H "Content-Type: application/json" \
  -d "{
      \"provider\": \"gcp\",
      \"region\": \"$GCP_ZONE\",
      \"agentConfiguration\": $GCP_AGENT_CONFIG
    }" | json_pp

# 2.3 Test getAgentStatus - AWS
echo -e "\n${YELLOW}2.3 Test GET /monitoring/instances/$AWS_INSTANCE_ID/agent-status (AWS)${NC}"
curl -s -X GET "$BASE_URL/monitoring/instances/$AWS_INSTANCE_ID/agent-status?provider=aws&region=$AWS_REGION&commandId=$AWS_COMMAND_ID" | json_pp

# 2.4 Test getAgentStatus - GCP
echo -e "\n${YELLOW}2.4 Test GET /monitoring/instances/$GCP_INSTANCE_ID/agent-status (GCP)${NC}"
curl -s -X GET "$BASE_URL/monitoring/instances/$GCP_INSTANCE_ID/agent-status?provider=gcp&region=$GCP_ZONE" | json_pp

echo -e "\n${BLUE}=============================================${NC}"
echo -e "${BLUE}   Tests Completed                           ${NC}"
echo -e "${BLUE}=============================================${NC}" 