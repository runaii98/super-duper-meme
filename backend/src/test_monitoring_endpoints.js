/**
 * Node.js script for testing monitoring and instance info endpoints
 * 
 * To run:
 * node test_monitoring_endpoints.js
 * 
 * Dependencies:
 * npm install axios
 */

const axios = require('axios');
const util = require('util');

// Set the base URL 
const BASE_URL = "http://localhost:3000/api/v1";

// Sample values - replace with actual values from your environment
// AWS
const AWS_INSTANCE_ID = "i-0123456789abcdef0";
const AWS_REGION = "us-east-1";
const AWS_LOG_GROUP = `/aws/ec2/instance/${AWS_INSTANCE_ID}`;
const AWS_COMMAND_ID = "11111111-2222-3333-4444-555555555555"; // For agent-status endpoint

// GCP
const GCP_INSTANCE_ID = "vm-instance-1";  // Instance name in GCP
const GCP_ZONE = "us-central1-a";
const GCP_LOG_GROUP = "compute.googleapis.com%2Factivity_log";  // URL encoded

// Helper function to pretty-print responses
function prettyPrint(data) {
  console.log(util.inspect(data, { depth: null, colors: true }));
}

// Helper function to handle errors
function handleError(error) {
  console.error("ERROR:", error.response ? error.response.data : error.message);
}

// Example CloudWatch Agent configuration for AWS
const AWS_AGENT_CONFIG = {
  agent: {
    metrics_collection_interval: 60,
    run_as_user: "cwagent"
  },
  metrics: {
    namespace: "MyCustomNamespace",
    metrics_collected: {
      cpu: {
        resources: ["*"],
        measurement: ["cpu_usage_idle", "cpu_usage_user", "cpu_usage_system"],
        totalcpu: true
      },
      mem: {
        measurement: ["mem_used_percent"]
      },
      disk: {
        resources: ["/"],
        measurement: ["disk_used_percent"],
        ignore_file_system_types: ["sysfs", "devtmpfs"]
      }
    }
  }
};

// Example Ops Agent configuration for GCP
const GCP_AGENT_CONFIG = {
  metrics: {
    receivers: {
      hostmetrics: {
        type: "hostmetrics",
        collection_interval: "60s"
      }
    },
    processors: {
      metrics_filter: {
        type: "exclude_metrics",
        metrics_pattern: []
      }
    },
    service: {
      pipelines: {
        pipeline1: {
          receivers: ["hostmetrics"],
          processors: ["metrics_filter"]
        }
      }
    }
  },
  logging: {
    receivers: {
      syslog: {
        type: "syslog",
        transport_protocol: "tcp",
        listen_address: "localhost:5140"
      }
    },
    service: {
      pipelines: {
        pipeline1: {
          receivers: ["syslog"]
        }
      }
    }
  }
};

// Main function to run tests
async function runTests() {
  console.log("\n==============================================");
  console.log("Testing Monitoring and Instance Info Endpoints");
  console.log("==============================================");

  try {
    // -----------------------------------------------------
    // 1. Test instance_info_routes.js endpoints
    // -----------------------------------------------------
    console.log("\n1. Testing Instance Info Endpoints");

    // 1.1 Test describeInstance - AWS
    console.log("\n1.1 Test GET /instances/:instanceId (AWS)");
    const res1_1 = await axios.get(`${BASE_URL}/instances/${AWS_INSTANCE_ID}`, {
      params: { provider: 'aws', region: AWS_REGION }
    });
    prettyPrint(res1_1.data);

    // 1.2 Test describeInstance - GCP
    console.log("\n1.2 Test GET /instances/:instanceId (GCP)");
    const res1_2 = await axios.get(`${BASE_URL}/instances/${GCP_INSTANCE_ID}`, {
      params: { provider: 'gcp', zone: GCP_ZONE }
    });
    prettyPrint(res1_2.data);

    // 1.3 Test getConsoleOutput - AWS
    console.log("\n1.3 Test GET /instances/:instanceId/console-output (AWS)");
    const res1_3 = await axios.get(`${BASE_URL}/instances/${AWS_INSTANCE_ID}/console-output`, {
      params: { provider: 'aws', region: AWS_REGION }
    });
    // Show first 200 characters
    console.log(res1_3.data.substring(0, 200) + "...");

    // 1.4 Test getConsoleOutput - GCP
    console.log("\n1.4 Test GET /instances/:instanceId/console-output (GCP)");
    const res1_4 = await axios.get(`${BASE_URL}/instances/${GCP_INSTANCE_ID}/console-output`, {
      params: { provider: 'gcp', zone: GCP_ZONE }
    });
    // Show first 200 characters
    console.log(res1_4.data.substring(0, 200) + "...");

    // 1.5 Test listMetrics - AWS
    console.log("\n1.5 Test GET /instances/:instanceId/metrics (AWS)");
    const res1_5 = await axios.get(`${BASE_URL}/instances/${AWS_INSTANCE_ID}/metrics`, {
      params: { provider: 'aws', region: AWS_REGION, namespace: 'AWS/EC2' }
    });
    prettyPrint(res1_5.data);

    // 1.6 Test listMetrics - GCP
    console.log("\n1.6 Test GET /instances/:instanceId/metrics (GCP)");
    const res1_6 = await axios.get(`${BASE_URL}/instances/${GCP_INSTANCE_ID}/metrics`, {
      params: { provider: 'gcp', zone: GCP_ZONE, namespace: 'compute.googleapis.com/instance' }
    });
    prettyPrint(res1_6.data);

    // 1.7 Test listLogStreams - AWS
    console.log("\n1.7 Test GET /instances/:instanceId/log-groups/:logGroupName/streams (AWS)");
    const res1_7 = await axios.get(`${BASE_URL}/instances/${AWS_INSTANCE_ID}/log-groups/${AWS_LOG_GROUP}/streams`, {
      params: { provider: 'aws', region: AWS_REGION }
    });
    prettyPrint(res1_7.data);

    // 1.8 Test listLogStreams - GCP
    console.log("\n1.8 Test GET /instances/:instanceId/log-groups/:logGroupName/streams (GCP)");
    const res1_8 = await axios.get(`${BASE_URL}/instances/${GCP_INSTANCE_ID}/log-groups/${GCP_LOG_GROUP}/streams`, {
      params: { provider: 'gcp', zone: GCP_ZONE }
    });
    prettyPrint(res1_8.data);

    // -----------------------------------------------------
    // 2. Test monitoring_routes.js endpoints
    // -----------------------------------------------------
    console.log("\n2. Testing Monitoring Endpoints");

    // 2.1 Test configureAgent - AWS
    console.log("\n2.1 Test POST /monitoring/instances/:instanceId/configure (AWS)");
    const res2_1 = await axios.post(`${BASE_URL}/monitoring/instances/${AWS_INSTANCE_ID}/configure`, {
      provider: 'aws',
      region: AWS_REGION,
      agentConfiguration: AWS_AGENT_CONFIG
    });
    prettyPrint(res2_1.data);

    // 2.2 Test configureAgent - GCP
    console.log("\n2.2 Test POST /monitoring/instances/:instanceId/configure (GCP)");
    const res2_2 = await axios.post(`${BASE_URL}/monitoring/instances/${GCP_INSTANCE_ID}/configure`, {
      provider: 'gcp',
      region: GCP_ZONE, // zone for GCP
      agentConfiguration: GCP_AGENT_CONFIG
    });
    prettyPrint(res2_2.data);

    // 2.3 Test getAgentStatus - AWS
    console.log("\n2.3 Test GET /monitoring/instances/:instanceId/agent-status (AWS)");
    const res2_3 = await axios.get(`${BASE_URL}/monitoring/instances/${AWS_INSTANCE_ID}/agent-status`, {
      params: { provider: 'aws', region: AWS_REGION, commandId: AWS_COMMAND_ID }
    });
    prettyPrint(res2_3.data);

    // 2.4 Test getAgentStatus - GCP
    console.log("\n2.4 Test GET /monitoring/instances/:instanceId/agent-status (GCP)");
    const res2_4 = await axios.get(`${BASE_URL}/monitoring/instances/${GCP_INSTANCE_ID}/agent-status`, {
      params: { provider: 'gcp', region: GCP_ZONE } // region is zone for GCP
    });
    prettyPrint(res2_4.data);

  } catch (error) {
    handleError(error);
  }

  console.log("\n==============================================");
  console.log("   Tests Completed                           ");
  console.log("==============================================");
}

// Run the tests
runTests(); 