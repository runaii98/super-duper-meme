/**
 * Monitoring and Instance Info Endpoints Diagnostic Test
 * 
 * Purpose: Test the endpoints with detailed error reporting to diagnose
 * issues with projectId handling in GCP requests.
 * 
 * Usage: node test_monitoring_endpoints_diagnostic.js
 */

const axios = require('axios');
const util = require('util');

// Base URL for API
const BASE_URL = 'http://localhost:3000/api/v1';

// Sample values - replace with actual instance IDs from your environment
const AWS_INSTANCE_ID = "i-01cd979da5dd7ec2c"; // Updated with the actual ID from test results
const AWS_REGION = "us-east-1a";
const AWS_COMMAND_ID = ""; // Leave empty if you don't have one yet

const GCP_INSTANCE_ID = "test-vm-gcp-2025-05-16"; // This should be replaced with an actual GCP instance if available
const GCP_ZONE = "us-central1-a";

// Pretty print helper
function prettyPrint(data) {
  console.log(util.inspect(data, { depth: null, colors: true }));
}

// HTTP Request with detailed error logging
async function makeRequest(method, url, params = null, data = null) {
  console.log(`\n[REQUEST] ${method.toUpperCase()} ${url}`);
  if (params) console.log(`Query params:`, params);
  if (data) console.log(`Request body:`, data);
  
  try {
    const config = { 
      method, 
      url,
      ...(params && { params }),
      ...(data && { data })
    };
    
    const response = await axios(config);
    console.log(`[RESPONSE] Status: ${response.status}`);
    return response.data;
  } catch (error) {
    console.error(`[ERROR] Status: ${error.response?.status || 'Unknown'}`);
    console.error(`Error details:`, error.response?.data || error.message);
    throw error;
  }
}

// Agent configurations
const AWS_AGENT_CONFIG = {
  agent: {
    metrics_collection_interval: 60,
    run_as_user: "cwagent"
  },
  metrics: {
    namespace: "MyCustomNamespace",
    metrics_collected: {
      cpu: { resources: ["*"], measurement: ["cpu_usage_idle"], totalcpu: true },
      mem: { measurement: ["mem_used_percent"] },
      disk: { resources: ["/"], measurement: ["disk_used_percent"] }
    }
  }
};

const GCP_AGENT_CONFIG = {
  metrics: {
    receivers: { hostmetrics: { type: "hostmetrics", collection_interval: "60s" } },
    processors: { metrics_filter: { type: "exclude_metrics", metrics_pattern: [] } },
    service: { pipelines: { pipeline1: { receivers: ["hostmetrics"], processors: ["metrics_filter"] } } }
  },
  logging: {
    receivers: { syslog: { type: "syslog", transport_protocol: "tcp", listen_address: "localhost:5140" } },
    service: { pipelines: { pipeline1: { receivers: ["syslog"] } } }
  }
};

// Main test function
async function runTests() {
  console.log("\n==============================================");
  console.log("Monitoring and Instance Info Diagnostic Test");
  console.log("==============================================");

  try {
    // -----------------------------------------------------
    // 1. Test Instance Info Endpoints
    // -----------------------------------------------------
    console.log("\n1. Testing Instance Info Endpoints");

    // 1.1 Test describeInstance - AWS
    console.log("\n1.1 Test GET /instances/:instanceId (AWS)");
    try {
      const data = await makeRequest(
        'get', 
        `${BASE_URL}/instances/${AWS_INSTANCE_ID}`,
        { provider: 'aws', region: AWS_REGION }
      );
      prettyPrint(data);
    } catch (error) {
      console.log("[TEST] AWS describeInstance test failed");
    }

    // 1.2 Test describeInstance - GCP
    console.log("\n1.2 Test GET /instances/:instanceId (GCP)");
    try {
      const data = await makeRequest(
        'get', 
        `${BASE_URL}/instances/${GCP_INSTANCE_ID}`,
        { provider: 'gcp', zone: GCP_ZONE }
      );
      prettyPrint(data);
    } catch (error) {
      console.log("[TEST] GCP describeInstance test failed");
    }

    // 1.3 Test listMetrics - AWS
    console.log("\n1.3 Test GET /instances/:instanceId/metrics (AWS)");
    try {
      const data = await makeRequest(
        'get', 
        `${BASE_URL}/instances/${AWS_INSTANCE_ID}/metrics`,
        { provider: 'aws', region: AWS_REGION }
      );
      prettyPrint(data);
    } catch (error) {
      console.log("[TEST] AWS listMetrics test failed");
    }

    // 1.4 Test listMetrics - GCP
    console.log("\n1.4 Test GET /instances/:instanceId/metrics (GCP)");
    try {
      const data = await makeRequest(
        'get', 
        `${BASE_URL}/instances/${GCP_INSTANCE_ID}/metrics`,
        { provider: 'gcp', zone: GCP_ZONE }
      );
      prettyPrint(data);
    } catch (error) {
      console.log("[TEST] GCP listMetrics test failed");
    }

    // -----------------------------------------------------
    // 2. Test Monitoring Endpoints
    // -----------------------------------------------------
    console.log("\n2. Testing Monitoring Endpoints");

    // 2.1 Test configureAgent - AWS
    console.log("\n2.1 Test POST /monitoring/instances/:instanceId/configure (AWS)");
    let awsCommandId = AWS_COMMAND_ID;
    try {
      const data = await makeRequest(
        'post',
        `${BASE_URL}/monitoring/instances/${AWS_INSTANCE_ID}/configure`,
        null,
        {
          provider: 'aws',
          region: AWS_REGION,
          agentConfiguration: AWS_AGENT_CONFIG
        }
      );
      prettyPrint(data);
      if (data.commandId) {
        awsCommandId = data.commandId;
        console.log(`[TEST] Captured AWS command ID: ${awsCommandId}`);
      }
    } catch (error) {
      console.log("[TEST] AWS configureAgent test failed");
    }

    // 2.2 Test configureAgent - GCP 
    console.log("\n2.2 Test POST /monitoring/instances/:instanceId/configure (GCP)");
    try {
      const data = await makeRequest(
        'post',
        `${BASE_URL}/monitoring/instances/${GCP_INSTANCE_ID}/configure`,
        null,
        {
          provider: 'gcp',
          region: GCP_ZONE, // Note: using zone as region for GCP
          agentConfiguration: GCP_AGENT_CONFIG
        }
      );
      prettyPrint(data);
    } catch (error) {
      console.log("[TEST] GCP configureAgent test failed");
    }

    // Wait a bit for agent configuration to take effect
    console.log("\nWaiting 10 seconds for agent configuration to process...");
    await new Promise(resolve => setTimeout(resolve, 10000));

    // 2.3 Test getAgentStatus - AWS (only if we have a commandId)
    if (awsCommandId) {
      console.log("\n2.3 Test GET /monitoring/instances/:instanceId/agent-status (AWS)");
      try {
        const data = await makeRequest(
          'get',
          `${BASE_URL}/monitoring/instances/${AWS_INSTANCE_ID}/agent-status`,
          { 
            provider: 'aws', 
            region: AWS_REGION,
            commandId: awsCommandId
          }
        );
        prettyPrint(data);
      } catch (error) {
        console.log("[TEST] AWS getAgentStatus test failed");
      }
    } else {
      console.log("\n2.3 Skipping AWS agent status check - no command ID available");
    }

    // 2.4 Test getAgentStatus - GCP
    console.log("\n2.4 Test GET /monitoring/instances/:instanceId/agent-status (GCP)");
    try {
      const data = await makeRequest(
        'get',
        `${BASE_URL}/monitoring/instances/${GCP_INSTANCE_ID}/agent-status`,
        { 
          provider: 'gcp', 
          region: GCP_ZONE // Note: using zone as region for GCP
        }
      );
      prettyPrint(data);
    } catch (error) {
      console.log("[TEST] GCP getAgentStatus test failed");
    }

  } catch (error) {
    console.error("\nGeneral execution error:", error.message);
  }

  console.log("\n==============================================");
  console.log("Diagnostic Test Completed");
  console.log("==============================================");
}

// Run the test
runTests(); 