/**
 * Monitoring Endpoints Test with Real VM Provisioning
 * 
 * This script follows a complete workflow:
 * 1. Provision real AWS and GCP VMs
 * 2. Wait for VMs to initialize
 * 3. Test the monitoring endpoints with the provisioned VMs
 * 4. Log detailed diagnostics about projectId handling
 * 
 * Usage: node test_monitoring_with_provisioning.js
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

// Sleep helper function
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
async function runMonitoringTests() {
  console.log("\n===============================================");
  console.log("Starting Monitoring Test with VM Provisioning");
  console.log("===============================================");

  // Store VM details
  let awsVmDetails = null;
  let gcpVmDetails = null;
  let awsCommandId = null;

  try {
    // Step 1: Provision AWS VM
    console.log("\n1. Provisioning AWS VM...");
    try {
      const res1 = await makeRequest('post', `${BASE_URL}/provision-vm`, null, awsVmConfig);
      awsVmDetails = res1;
      console.log(`AWS VM provisioned successfully: ${awsVmDetails.instanceName || awsVmDetails.instanceId}`);
      const detailsFile = saveVmDetails('AWS', awsVmDetails);
      console.log(`AWS VM details saved to: ${detailsFile}`);
    } catch (error) {
      console.error("Error provisioning AWS VM. Using fallback instance values.");
      // Fallback to hardcoded values if provisioning fails
      awsVmDetails = {
        instanceId: "i-01cd979da5dd7ec2c", // Replace with a known instance ID if this doesn't work
        region: "us-east-1"
      };
    }

    // Step 2: Provision GCP VM
    console.log("\n2. Provisioning GCP VM...");
    try {
      const res2 = await makeRequest('post', `${BASE_URL}/provision-vm`, null, gcpVmConfig);
      gcpVmDetails = res2;
      console.log(`GCP VM provisioned successfully: ${gcpVmDetails.instanceName}`);
      const detailsFile = saveVmDetails('GCP', gcpVmDetails);
      console.log(`GCP VM details saved to: ${detailsFile}`);
    } catch (error) {
      console.error("Error provisioning GCP VM. Using fallback instance values.");
      // Fallback to hardcoded values if provisioning fails
      gcpVmDetails = {
        instanceName: "test-vm-gcp-2025-05-16", // Replace with a known instance name if this doesn't work
        zone: "us-central1-a"
      };
    }

    // Allow time for VMs to initialize (critical for monitoring setup)
    const initializationTime = 60; // seconds
    console.log(`\nWaiting ${initializationTime} seconds for VMs to initialize...`);
    await sleep(initializationTime * 1000);

    // Extract VM identifiers and regions
    const awsInstanceId = awsVmDetails.instanceId || awsVmDetails.instanceName;
    const awsRegion = awsVmDetails.region || (awsVmDetails.details && awsVmDetails.details.region) || 'us-east-1';
    
    const gcpInstanceId = gcpVmDetails.instanceName;
    const gcpZone = gcpVmDetails.zone;

    console.log("\nTest VMs:");
    console.log(`AWS: Instance ID=${awsInstanceId}, Region=${awsRegion}`);
    console.log(`GCP: Instance ID=${gcpInstanceId}, Zone=${gcpZone}`);

    // -----------------------------------------------------
    // 3. Test instance_info endpoints
    // -----------------------------------------------------
    console.log("\n3. Testing Instance Info Endpoints");

    // 3.1 Test describeInstance - AWS
    console.log("\n3.1 Test GET /instances/:instanceId (AWS)");
    try {
      const data = await makeRequest(
        'get', 
        `${BASE_URL}/instances/${awsInstanceId}`,
        { provider: 'aws', region: awsRegion }
      );
      console.log("AWS Instance Details:");
      prettyPrint(data);
    } catch (error) {
      console.log("[TEST] AWS describeInstance test failed");
    }

    // 3.2 Test describeInstance - GCP
    console.log("\n3.2 Test GET /instances/:instanceId (GCP)");
    try {
      const data = await makeRequest(
        'get', 
        `${BASE_URL}/instances/${gcpInstanceId}`,
        { provider: 'gcp', zone: gcpZone }
      );
      console.log("GCP Instance Details:");
      prettyPrint(data);
    } catch (error) {
      console.log("[TEST] GCP describeInstance test failed");
    }

    // 3.3 Test listMetrics - AWS
    console.log("\n3.3 Test GET /instances/:instanceId/metrics (AWS)");
    try {
      const data = await makeRequest(
        'get', 
        `${BASE_URL}/instances/${awsInstanceId}/metrics`,
        { provider: 'aws', region: awsRegion }
      );
      console.log("AWS Metrics:");
      prettyPrint(data);
    } catch (error) {
      console.log("[TEST] AWS listMetrics test failed");
    }

    // 3.4 Test listMetrics - GCP
    console.log("\n3.4 Test GET /instances/:instanceId/metrics (GCP)");
    try {
      const data = await makeRequest(
        'get', 
        `${BASE_URL}/instances/${gcpInstanceId}/metrics`,
        { provider: 'gcp', zone: gcpZone }
      );
      console.log("GCP Metrics:");
      prettyPrint(data);
    } catch (error) {
      console.log("[TEST] GCP listMetrics test failed");
    }

    // -----------------------------------------------------
    // 4. Test monitoring endpoints
    // -----------------------------------------------------
    console.log("\n4. Testing Monitoring Endpoints");

    // 4.1 Test configureAgent - AWS
    console.log("\n4.1 Test POST /monitoring/instances/:instanceId/configure (AWS)");
    try {
      const data = await makeRequest(
        'post',
        `${BASE_URL}/monitoring/instances/${awsInstanceId}/configure`,
        null,
        {
          provider: 'aws',
          region: awsRegion,
          agentConfiguration: awsAgentConfig
        }
      );
      console.log("AWS Agent Configuration Result:");
      prettyPrint(data);
      
      if (data.commandId) {
        awsCommandId = data.commandId;
        console.log(`Captured AWS command ID: ${awsCommandId}`);
      }
    } catch (error) {
      console.log("[TEST] AWS configureAgent test failed");
    }

    // 4.2 Test configureAgent - GCP
    console.log("\n4.2 Test POST /monitoring/instances/:instanceId/configure (GCP)");
    try {
      const data = await makeRequest(
        'post',
        `${BASE_URL}/monitoring/instances/${gcpInstanceId}/configure`,
        null,
        {
          provider: 'gcp',
          region: gcpZone,
          agentConfiguration: gcpAgentConfig
        }
      );
      console.log("GCP Agent Configuration Result:");
      prettyPrint(data);
    } catch (error) {
      console.log("[TEST] GCP configureAgent test failed");
    }

    // Wait for agent setup to complete
    const agentSetupTime = 30; // seconds
    console.log(`\nWaiting ${agentSetupTime} seconds for agent setup to complete...`);
    await sleep(agentSetupTime * 1000);

    // 4.3 Test getAgentStatus - AWS (only if we have a commandId)
    if (awsCommandId) {
      console.log("\n4.3 Test GET /monitoring/instances/:instanceId/agent-status (AWS)");
      try {
        const data = await makeRequest(
          'get',
          `${BASE_URL}/monitoring/instances/${awsInstanceId}/agent-status`,
          { 
            provider: 'aws', 
            region: awsRegion,
            commandId: awsCommandId
          }
        );
        console.log("AWS Agent Status:");
        prettyPrint(data);
      } catch (error) {
        console.log("[TEST] AWS getAgentStatus test failed");
      }
    } else {
      console.log("\n4.3 Skipping AWS agent status check - no command ID available");
    }

    // 4.4 Test getAgentStatus - GCP
    console.log("\n4.4 Test GET /monitoring/instances/:instanceId/agent-status (GCP)");
    try {
      const data = await makeRequest(
        'get',
        `${BASE_URL}/monitoring/instances/${gcpInstanceId}/agent-status`,
        { 
          provider: 'gcp', 
          region: gcpZone
        }
      );
      console.log("GCP Agent Status:");
      prettyPrint(data);
    } catch (error) {
      console.log("[TEST] GCP getAgentStatus test failed");
    }

  } catch (error) {
    console.error("\nGeneral execution error:", error.message);
  } finally {
    // Always report results summary
    console.log("\n===============================================");
    console.log("Test Summary");
    console.log("===============================================");
    if (awsVmDetails) {
      console.log(`AWS VM: ID=${awsVmDetails.instanceId || 'unknown'}, Region=${awsVmDetails.region || 'unknown'}`);
    } else {
      console.log("No AWS VM was provisioned");
    }
    
    if (gcpVmDetails) {
      console.log(`GCP VM: Name=${gcpVmDetails.instanceName || 'unknown'}, Zone=${gcpVmDetails.zone || 'unknown'}`);
    } else {
      console.log("No GCP VM was provisioned");
    }
    
    console.log("\nNOTE: Provisioned VMs will continue running and may incur charges.");
    console.log("Remember to terminate them when no longer needed.");
    console.log("===============================================");
  }
}

// Run the test
runMonitoringTests(); 
 * Monitoring Endpoints Test with Real VM Provisioning
 * 
 * This script follows a complete workflow:
 * 1. Provision real AWS and GCP VMs
 * 2. Wait for VMs to initialize
 * 3. Test the monitoring endpoints with the provisioned VMs
 * 4. Log detailed diagnostics about projectId handling
 * 
 * Usage: node test_monitoring_with_provisioning.js
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

// Sleep helper function
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
async function runMonitoringTests() {
  console.log("\n===============================================");
  console.log("Starting Monitoring Test with VM Provisioning");
  console.log("===============================================");

  // Store VM details
  let awsVmDetails = null;
  let gcpVmDetails = null;
  let awsCommandId = null;

  try {
    // Step 1: Provision AWS VM
    console.log("\n1. Provisioning AWS VM...");
    try {
      const res1 = await makeRequest('post', `${BASE_URL}/provision-vm`, null, awsVmConfig);
      awsVmDetails = res1;
      console.log(`AWS VM provisioned successfully: ${awsVmDetails.instanceName || awsVmDetails.instanceId}`);
      const detailsFile = saveVmDetails('AWS', awsVmDetails);
      console.log(`AWS VM details saved to: ${detailsFile}`);
    } catch (error) {
      console.error("Error provisioning AWS VM. Using fallback instance values.");
      // Fallback to hardcoded values if provisioning fails
      awsVmDetails = {
        instanceId: "i-01cd979da5dd7ec2c", // Replace with a known instance ID if this doesn't work
        region: "us-east-1"
      };
    }

    // Step 2: Provision GCP VM
    console.log("\n2. Provisioning GCP VM...");
    try {
      const res2 = await makeRequest('post', `${BASE_URL}/provision-vm`, null, gcpVmConfig);
      gcpVmDetails = res2;
      console.log(`GCP VM provisioned successfully: ${gcpVmDetails.instanceName}`);
      const detailsFile = saveVmDetails('GCP', gcpVmDetails);
      console.log(`GCP VM details saved to: ${detailsFile}`);
    } catch (error) {
      console.error("Error provisioning GCP VM. Using fallback instance values.");
      // Fallback to hardcoded values if provisioning fails
      gcpVmDetails = {
        instanceName: "test-vm-gcp-2025-05-16", // Replace with a known instance name if this doesn't work
        zone: "us-central1-a"
      };
    }

    // Allow time for VMs to initialize (critical for monitoring setup)
    const initializationTime = 60; // seconds
    console.log(`\nWaiting ${initializationTime} seconds for VMs to initialize...`);
    await sleep(initializationTime * 1000);

    // Extract VM identifiers and regions
    const awsInstanceId = awsVmDetails.instanceId || awsVmDetails.instanceName;
    const awsRegion = awsVmDetails.region || (awsVmDetails.details && awsVmDetails.details.region) || 'us-east-1';
    
    const gcpInstanceId = gcpVmDetails.instanceName;
    const gcpZone = gcpVmDetails.zone;

    console.log("\nTest VMs:");
    console.log(`AWS: Instance ID=${awsInstanceId}, Region=${awsRegion}`);
    console.log(`GCP: Instance ID=${gcpInstanceId}, Zone=${gcpZone}`);

    // -----------------------------------------------------
    // 3. Test instance_info endpoints
    // -----------------------------------------------------
    console.log("\n3. Testing Instance Info Endpoints");

    // 3.1 Test describeInstance - AWS
    console.log("\n3.1 Test GET /instances/:instanceId (AWS)");
    try {
      const data = await makeRequest(
        'get', 
        `${BASE_URL}/instances/${awsInstanceId}`,
        { provider: 'aws', region: awsRegion }
      );
      console.log("AWS Instance Details:");
      prettyPrint(data);
    } catch (error) {
      console.log("[TEST] AWS describeInstance test failed");
    }

    // 3.2 Test describeInstance - GCP
    console.log("\n3.2 Test GET /instances/:instanceId (GCP)");
    try {
      const data = await makeRequest(
        'get', 
        `${BASE_URL}/instances/${gcpInstanceId}`,
        { provider: 'gcp', zone: gcpZone }
      );
      console.log("GCP Instance Details:");
      prettyPrint(data);
    } catch (error) {
      console.log("[TEST] GCP describeInstance test failed");
    }

    // 3.3 Test listMetrics - AWS
    console.log("\n3.3 Test GET /instances/:instanceId/metrics (AWS)");
    try {
      const data = await makeRequest(
        'get', 
        `${BASE_URL}/instances/${awsInstanceId}/metrics`,
        { provider: 'aws', region: awsRegion }
      );
      console.log("AWS Metrics:");
      prettyPrint(data);
    } catch (error) {
      console.log("[TEST] AWS listMetrics test failed");
    }

    // 3.4 Test listMetrics - GCP
    console.log("\n3.4 Test GET /instances/:instanceId/metrics (GCP)");
    try {
      const data = await makeRequest(
        'get', 
        `${BASE_URL}/instances/${gcpInstanceId}/metrics`,
        { provider: 'gcp', zone: gcpZone }
      );
      console.log("GCP Metrics:");
      prettyPrint(data);
    } catch (error) {
      console.log("[TEST] GCP listMetrics test failed");
    }

    // -----------------------------------------------------
    // 4. Test monitoring endpoints
    // -----------------------------------------------------
    console.log("\n4. Testing Monitoring Endpoints");

    // 4.1 Test configureAgent - AWS
    console.log("\n4.1 Test POST /monitoring/instances/:instanceId/configure (AWS)");
    try {
      const data = await makeRequest(
        'post',
        `${BASE_URL}/monitoring/instances/${awsInstanceId}/configure`,
        null,
        {
          provider: 'aws',
          region: awsRegion,
          agentConfiguration: awsAgentConfig
        }
      );
      console.log("AWS Agent Configuration Result:");
      prettyPrint(data);
      
      if (data.commandId) {
        awsCommandId = data.commandId;
        console.log(`Captured AWS command ID: ${awsCommandId}`);
      }
    } catch (error) {
      console.log("[TEST] AWS configureAgent test failed");
    }

    // 4.2 Test configureAgent - GCP
    console.log("\n4.2 Test POST /monitoring/instances/:instanceId/configure (GCP)");
    try {
      const data = await makeRequest(
        'post',
        `${BASE_URL}/monitoring/instances/${gcpInstanceId}/configure`,
        null,
        {
          provider: 'gcp',
          region: gcpZone,
          agentConfiguration: gcpAgentConfig
        }
      );
      console.log("GCP Agent Configuration Result:");
      prettyPrint(data);
    } catch (error) {
      console.log("[TEST] GCP configureAgent test failed");
    }

    // Wait for agent setup to complete
    const agentSetupTime = 30; // seconds
    console.log(`\nWaiting ${agentSetupTime} seconds for agent setup to complete...`);
    await sleep(agentSetupTime * 1000);

    // 4.3 Test getAgentStatus - AWS (only if we have a commandId)
    if (awsCommandId) {
      console.log("\n4.3 Test GET /monitoring/instances/:instanceId/agent-status (AWS)");
      try {
        const data = await makeRequest(
          'get',
          `${BASE_URL}/monitoring/instances/${awsInstanceId}/agent-status`,
          { 
            provider: 'aws', 
            region: awsRegion,
            commandId: awsCommandId
          }
        );
        console.log("AWS Agent Status:");
        prettyPrint(data);
      } catch (error) {
        console.log("[TEST] AWS getAgentStatus test failed");
      }
    } else {
      console.log("\n4.3 Skipping AWS agent status check - no command ID available");
    }

    // 4.4 Test getAgentStatus - GCP
    console.log("\n4.4 Test GET /monitoring/instances/:instanceId/agent-status (GCP)");
    try {
      const data = await makeRequest(
        'get',
        `${BASE_URL}/monitoring/instances/${gcpInstanceId}/agent-status`,
        { 
          provider: 'gcp', 
          region: gcpZone
        }
      );
      console.log("GCP Agent Status:");
      prettyPrint(data);
    } catch (error) {
      console.log("[TEST] GCP getAgentStatus test failed");
    }

  } catch (error) {
    console.error("\nGeneral execution error:", error.message);
  } finally {
    // Always report results summary
    console.log("\n===============================================");
    console.log("Test Summary");
    console.log("===============================================");
    if (awsVmDetails) {
      console.log(`AWS VM: ID=${awsVmDetails.instanceId || 'unknown'}, Region=${awsVmDetails.region || 'unknown'}`);
    } else {
      console.log("No AWS VM was provisioned");
    }
    
    if (gcpVmDetails) {
      console.log(`GCP VM: Name=${gcpVmDetails.instanceName || 'unknown'}, Zone=${gcpVmDetails.zone || 'unknown'}`);
    } else {
      console.log("No GCP VM was provisioned");
    }
    
    console.log("\nNOTE: Provisioned VMs will continue running and may incur charges.");
    console.log("Remember to terminate them when no longer needed.");
    console.log("===============================================");
  }
}

// Run the test
runMonitoringTests(); 