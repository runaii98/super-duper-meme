/**
 * End-to-End Test Script for VM Provisioning and Monitoring
 * 
 * This script:
 * 1. Provisions an AWS VM and a GCP VM
 * 2. Uses the instance IDs and regions from the provisioning response
 * 3. Tests the monitoring endpoints with that real instance data
 * 
 * Usage:
 * node test_end_to_end.js
 * 
 * Dependencies:
 * npm install axios
 */

const axios = require('axios');
const util = require('util');
const fs = require('fs');
const path = require('path');

// Base URL for API
const BASE_URL = 'http://localhost:3000/api/v1';

// Helper for formatted logging
function prettyPrint(data) {
  console.log(util.inspect(data, { depth: null, colors: true }));
}

// Time helper
function formatTimestamp() {
  return new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
}

// Save VM details for reference
function saveVmDetails(provider, details) {
  const timestamp = formatTimestamp();
  const filename = `vm_details_${provider.toLowerCase()}_${timestamp}.json`;
  fs.writeFileSync(path.join(__dirname, filename), JSON.stringify(details, null, 2));
  console.log(`Saved VM details to ${filename}`);
  return filename;
}

// VM Configuration Templates
const awsVmConfig = {
  provider: 'AWS',
  instance_type: 't2.micro',
  osImage: 'ubuntu-22.04',
  region: 'us-east-1',
  storage_gb: 10,
  pricingModel: 'OnDemand',
  instanceName: `test-vm-aws-${formatTimestamp()}`
};

const gcpVmConfig = {
  provider: 'GCP',
  instance_type: 'e2-micro',
  osImage: 'ubuntu-22.04',
  zone: 'us-central1-a',
  storage_gb: 10,
  pricingModel: 'OnDemand',
  instanceName: `test-vm-gcp-${formatTimestamp().substring(0, 10)}`
};

// AWS CloudWatch Agent configuration
const awsAgentConfig = {
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

// GCP Ops Agent configuration
const gcpAgentConfig = {
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

// Main test function
async function runEndToEndTest() {
  console.log("\n===============================================");
  console.log("Starting End-to-End VM Provisioning and Monitoring Test");
  console.log("===============================================");

  // Store VM details
  let awsVmDetails = null;
  let gcpVmDetails = null;
  let awsCommandId = null;

  try {
    // Step 1: Provision AWS VM
    console.log("\n1. Provisioning AWS VM...");
    try {
      const res1 = await axios.post(`${BASE_URL}/provision-vm`, awsVmConfig);
      awsVmDetails = res1.data;
      console.log(`AWS VM provisioned successfully: ${awsVmDetails.instanceName}`);
      const detailsFile = saveVmDetails('AWS', awsVmDetails);
      console.log(`AWS VM details saved to: ${detailsFile}`);
    } catch (error) {
      console.error("Error provisioning AWS VM:", error.response?.data || error.message);
      
      // If we can't provision, see if we can fetch an existing VM
      console.log("Trying to use an existing AWS instance instead...");
      // This would typically require knowledge of an existing instance ID
      // For now, we'll use a placeholder - replace with your actual instance ID if available
      awsVmDetails = {
        provider: "AWS", 
        instanceName: "REPLACE_WITH_EXISTING_INSTANCE_ID", 
        region: "us-east-1"
      };
    }

    // Step 2: Provision GCP VM
    console.log("\n2. Provisioning GCP VM...");
    try {
      const res2 = await axios.post(`${BASE_URL}/provision-vm`, gcpVmConfig);
      gcpVmDetails = res2.data;
      console.log(`GCP VM provisioned successfully: ${gcpVmDetails.instanceName}`);
      const detailsFile = saveVmDetails('GCP', gcpVmDetails);
      console.log(`GCP VM details saved to: ${detailsFile}`);
    } catch (error) {
      console.error("Error provisioning GCP VM:", error.response?.data || error.message);
      
      // If we can't provision, see if we can fetch an existing VM
      console.log("Trying to use an existing GCP instance instead...");
      // This would typically require knowledge of an existing instance ID
      // For now, we'll use a placeholder - replace with your actual instance ID if available
      gcpVmDetails = {
        provider: "GCP", 
        instanceName: "REPLACE_WITH_EXISTING_INSTANCE_ID", 
        projectId: "REPLACE_WITH_PROJECT_ID", 
        zone: "us-central1-a"
      };
    }

    // Allow time for VMs to initialize
    console.log("\nWaiting 30 seconds for VMs to initialize...");
    await new Promise(resolve => setTimeout(resolve, 30000));

    // Get actual instance IDs from VM details
    const awsInstanceId = awsVmDetails.instanceId || awsVmDetails.instanceName;
    const gcpInstanceId = gcpVmDetails.instanceName;
    
    // Get regions/zones
    const awsRegion = awsVmDetails.region || awsVmConfig.region;
    const gcpZone = gcpVmDetails.zone || gcpVmConfig.zone;

    // -----------------------------------------------------
    // 3. Test instance_info_routes.js endpoints with real instance data
    // -----------------------------------------------------
    console.log("\n3. Testing Instance Info Endpoints with Real VM Data");

    // 3.1 Test describeInstance - AWS
    console.log("\n3.1 Test GET /instances/:instanceId (AWS)");
    try {
      const res3_1 = await axios.get(`${BASE_URL}/instances/${awsInstanceId}`, {
        params: { provider: 'aws', region: awsRegion }
      });
      console.log("AWS Instance Details:");
      prettyPrint(res3_1.data);
    } catch (error) {
      console.error("Error fetching AWS instance details:", error.response?.data || error.message);
    }

    // 3.2 Test describeInstance - GCP
    console.log("\n3.2 Test GET /instances/:instanceId (GCP)");
    try {
      const res3_2 = await axios.get(`${BASE_URL}/instances/${gcpInstanceId}`, {
        params: { provider: 'gcp', zone: gcpZone }
      });
      console.log("GCP Instance Details:");
      prettyPrint(res3_2.data);
    } catch (error) {
      console.error("Error fetching GCP instance details:", error.response?.data || error.message);
    }

    // 3.3 Test getConsoleOutput - AWS
    console.log("\n3.3 Test GET /instances/:instanceId/console-output (AWS)");
    try {
      const res3_3 = await axios.get(`${BASE_URL}/instances/${awsInstanceId}/console-output`, {
        params: { provider: 'aws', region: awsRegion }
      });
      console.log("AWS Console Output (first 200 chars):");
      console.log(res3_3.data.substring(0, 200) + "...");
    } catch (error) {
      console.error("Error fetching AWS console output:", error.response?.data || error.message);
    }

    // 3.4 Test getConsoleOutput - GCP
    console.log("\n3.4 Test GET /instances/:instanceId/console-output (GCP)");
    try {
      const res3_4 = await axios.get(`${BASE_URL}/instances/${gcpInstanceId}/console-output`, {
        params: { provider: 'gcp', zone: gcpZone }
      });
      console.log("GCP Console Output (first 200 chars):");
      console.log(res3_4.data.substring(0, 200) + "...");
    } catch (error) {
      console.error("Error fetching GCP console output:", error.response?.data || error.message);
    }

    // 3.5 Test listMetrics - AWS
    console.log("\n3.5 Test GET /instances/:instanceId/metrics (AWS)");
    try {
      const res3_5 = await axios.get(`${BASE_URL}/instances/${awsInstanceId}/metrics`, {
        params: { provider: 'aws', region: awsRegion, namespace: 'AWS/EC2' }
      });
      console.log("AWS Metrics:");
      prettyPrint(res3_5.data);
    } catch (error) {
      console.error("Error fetching AWS metrics:", error.response?.data || error.message);
    }

    // 3.6 Test listMetrics - GCP
    console.log("\n3.6 Test GET /instances/:instanceId/metrics (GCP)");
    try {
      const res3_6 = await axios.get(`${BASE_URL}/instances/${gcpInstanceId}/metrics`, {
        params: { provider: 'gcp', zone: gcpZone, namespace: 'compute.googleapis.com/instance' }
      });
      console.log("GCP Metrics:");
      prettyPrint(res3_6.data);
    } catch (error) {
      console.error("Error fetching GCP metrics:", error.response?.data || error.message);
    }

    // -----------------------------------------------------
    // 4. Test monitoring_routes.js endpoints with real instance data
    // -----------------------------------------------------
    console.log("\n4. Testing Monitoring Endpoints with Real VM Data");

    // 4.1 Test configureAgent - AWS
    console.log("\n4.1 Test POST /monitoring/instances/:instanceId/configure (AWS)");
    try {
      const res4_1 = await axios.post(`${BASE_URL}/monitoring/instances/${awsInstanceId}/configure`, {
        provider: 'aws',
        region: awsRegion,
        agentConfiguration: awsAgentConfig
      });
      console.log("AWS Agent Configuration Result:");
      prettyPrint(res4_1.data);
      
      // Save the command ID for status check
      if (res4_1.data.commandId) {
        awsCommandId = res4_1.data.commandId;
        console.log(`Saved AWS SSM Command ID: ${awsCommandId}`);
      }
    } catch (error) {
      console.error("Error configuring AWS agent:", error.response?.data || error.message);
    }

    // 4.2 Test configureAgent - GCP
    console.log("\n4.2 Test POST /monitoring/instances/:instanceId/configure (GCP)");
    try {
      const res4_2 = await axios.post(`${BASE_URL}/monitoring/instances/${gcpInstanceId}/configure`, {
        provider: 'gcp',
        region: gcpZone,
        agentConfiguration: gcpAgentConfig
      });
      console.log("GCP Agent Configuration Result:");
      prettyPrint(res4_2.data);
    } catch (error) {
      console.error("Error configuring GCP agent:", error.response?.data || error.message);
    }

    // Allow time for agents to start up
    console.log("\nWaiting 20 seconds for agents to initialize...");
    await new Promise(resolve => setTimeout(resolve, 20000));

    // 4.3 Test getAgentStatus - AWS
    if (awsCommandId) {
      console.log("\n4.3 Test GET /monitoring/instances/:instanceId/agent-status (AWS)");
      try {
        const res4_3 = await axios.get(`${BASE_URL}/monitoring/instances/${awsInstanceId}/agent-status`, {
          params: { provider: 'aws', region: awsRegion, commandId: awsCommandId }
        });
        console.log("AWS Agent Status:");
        prettyPrint(res4_3.data);
      } catch (error) {
        console.error("Error fetching AWS agent status:", error.response?.data || error.message);
      }
    } else {
      console.log("\n4.3 Skipping AWS agent status check - no command ID available");
    }

    // 4.4 Test getAgentStatus - GCP
    console.log("\n4.4 Test GET /monitoring/instances/:instanceId/agent-status (GCP)");
    try {
      const res4_4 = await axios.get(`${BASE_URL}/monitoring/instances/${gcpInstanceId}/agent-status`, {
        params: { provider: 'gcp', region: gcpZone }
      });
      console.log("GCP Agent Status:");
      prettyPrint(res4_4.data);
    } catch (error) {
      console.error("Error fetching GCP agent status:", error.response?.data || error.message);
    }

  } catch (error) {
    console.error("General execution error:", error.message);
  }

  console.log("\n===============================================");
  console.log("End-to-End Test Completed");
  console.log("===============================================");
}

// Run the test
runEndToEndTest(); 