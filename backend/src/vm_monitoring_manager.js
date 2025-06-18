const { CloudWatchClient, GetMetricDataCommand } = require("@aws-sdk/client-cloudwatch");
const { MetricServiceClient } = require('@google-cloud/monitoring'); // v3
const credentialsManager = require('./vm_allocation_engine/credentials_manager'); // Adjust path as needed
const mysql = require('mysql2/promise'); // Using the promise-based version for async/await
const { SSMClient, SendCommandCommand } = require("@aws-sdk/client-ssm");
const { EC2Client } = require("@aws-sdk/client-ec2"); // May not be needed here directly but good for context

// MySQL connection pool setup
const dbPool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'yourstrongpassword', // Use environment variables in production!
    database: process.env.DB_NAME || 'myapp_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

/**
 * Fetches VM details from the MySQL database.
 * @param {string} internalVmId - Your internal ID for the VM.
 * @returns {Promise<object|null>} VM details object or null if not found.
 */
async function getVmDetailsFromDb(internalVmId) {
    try {
        const [rows] = await dbPool.execute(
            'SELECT * FROM virtual_machines WHERE internal_vm_id = ?',
            [internalVmId]
        );

        if (rows.length === 0) {
            console.warn(`[VMMonitoringManager] VM with internal ID ${internalVmId} not found in database.`);
            return null;
        }

        // Map the database fields to the return object format
        const vmInfo = {
            internalVmId: rows[0].internal_vm_id,
            provider: rows[0].provider,
            instanceId: rows[0].provider_instance_id,
            region: rows[0].region,
            zone: rows[0].zone,
            projectId: rows[0].project_id
        };

        console.log(`[VMMonitoringManager] Retrieved VM details for ${internalVmId}: ${JSON.stringify(vmInfo, null, 2)}`);
        return vmInfo;
    } catch (error) {
        console.error(`[VMMonitoringManager] Error fetching VM details from database for ${internalVmId}:`, error);
        throw new Error(`Failed to fetch VM details: ${error.message}`);
    }
}

// For testing purposes, this function can be used to insert a test VM record
async function insertTestVmRecord(vmDetails) {
    try {
        // First, let's check if we have a test user, if not, create one
        const [userRows] = await dbPool.execute(
            'SELECT id FROM users WHERE internal_user_id = ?',
            ['test-user-001']
        );

        let userId;
        if (userRows.length === 0) {
            // Create a test user if one doesn't exist
            const [userResult] = await dbPool.execute(
                'INSERT INTO users (internal_user_id, email, hashed_password, full_name) VALUES (?, ?, ?, ?)',
                ['test-user-001', 'test@example.com', 'hashedpassword123', 'Test User']
            );
            userId = userResult.insertId;
        } else {
            userId = userRows[0].id;
        }

        // Now insert the VM record
        const [result] = await dbPool.execute(
            `INSERT INTO virtual_machines 
            (internal_vm_id, user_id, provider, provider_instance_id, instance_name, 
            region, zone, project_id, instance_type, os_image, status, 
            public_ip_address, private_ip_address, ssh_key_pair_name) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                vmDetails.internalVmId,
                userId,
                vmDetails.provider,
                vmDetails.instanceId,
                vmDetails.instanceName || null,
                vmDetails.region || null, 
                vmDetails.zone || null,
                vmDetails.projectId || null,
                vmDetails.instanceType || null,
                vmDetails.osImage || null,
                vmDetails.status || 'running',
                vmDetails.publicIpAddress || null,
                vmDetails.privateIpAddress || null,
                vmDetails.sshKeyPairName || null
            ]
        );

        console.log(`[VMMonitoringManager] Test VM record inserted with ID: ${result.insertId}`);
        return true;
    } catch (error) {
        console.error('[VMMonitoringManager] Error inserting test VM record:', error);
        throw error;
    }
}

/**
 * Standardized metric names you might want to support.
 * This map helps translate your API's metric names to cloud-specific ones.
 */
const METRIC_TRANSLATIONS = {
    "cpu_utilization": {
        aws: { name: "CPUUtilization", namespace: "AWS/EC2", unit: "Percent", defaultStat: "Average" },
        gcp: { type: "compute.googleapis.com/instance/cpu/utilization", unit: "Percent/100", defaultAligner: "ALIGN_MEAN" } // GCP CPU is 0-1, AWS is 0-100
    },
    "memory_used_percent": {
        aws: { name: "mem_used_percent", namespace: "CWAgent", unit: "Percent", defaultStat: "Average" }, // From CloudWatch Agent
        gcp: { type: "agent.googleapis.com/memory/percent_used", metricLabels: { state: "used" }, unit: "Percent", defaultAligner: "ALIGN_MEAN" } // From Ops Agent
    },
    "disk_read_ops": {
        aws: { name: "DiskReadOps", namespace: "AWS/EC2", unit: "Count/Second", defaultStat: "Sum" },
        gcp: { type: "compute.googleapis.com/instance/disk/read_ops_count", unit: "Count/Second", defaultAligner: "ALIGN_SUM" }
    },
    "disk_write_ops": {
        aws: { name: "DiskWriteOps", namespace: "AWS/EC2", unit: "Count/Second", defaultStat: "Sum" },
        gcp: { type: "compute.googleapis.com/instance/disk/write_ops_count", unit: "Count/Second", defaultAligner: "ALIGN_SUM" }
    },
    "network_in_bytes": {
        aws: { name: "NetworkIn", namespace: "AWS/EC2", unit: "Bytes/Second", defaultStat: "Sum" },
        gcp: { type: "compute.googleapis.com/instance/network/received_bytes_count", unit: "Bytes/Second", defaultAligner: "ALIGN_SUM" }
    },
    "network_out_bytes": {
        aws: { name: "NetworkOut", namespace: "AWS/EC2", unit: "Bytes/Second", defaultStat: "Sum" },
        gcp: { type: "compute.googleapis.com/instance/network/sent_bytes_count", unit: "Bytes/Second", defaultAligner: "ALIGN_SUM" }
    },
    // GPU Metrics (example - names will depend on DCGM exporter and agent config)
    "gpu_utilization": { // Assuming a single GPU or aggregate
        aws: { name: "DCGM_FI_DEV_GPU_UTIL", namespace: "ECS/containerInsights/Prometheus", unit: "Percent", dimensions: [{Name: "job", Value: "dcgm"}], defaultStat: "Average" }, // Namespace from Prometheus config in CW agent
        gcp: { type: "prometheus.googleapis.com/DCGM_FI_DEV_GPU_UTIL/gauge", unit: "Percent", defaultAligner: "ALIGN_MEAN"} // From Ops Agent Prometheus scraper
    },
    "gpu_memory_used_percent": {
         aws: { name: "DCGM_FI_DEV_FB_USED_PERCENT", namespace: "ECS/containerInsights/Prometheus", unit: "Percent", dimensions: [{Name: "job", Value: "dcgm"}], defaultStat: "Average" },
         gcp: { type: "prometheus.googleapis.com/DCGM_FI_DEV_FB_USED_PERCENT/gauge", unit: "Percent", defaultAligner: "ALIGN_MEAN"}
    },
    // Docker/Container Metrics (example - names will depend on cAdvisor/Docker agent config)
    "container_cpu_usage": { // Example for a specific container, or aggregate
        aws: { name: "container_cpu_usage_seconds_total", namespace: "ECS/containerInsights/Prometheus", unit: "Count", dimensions: [{Name: "job", Value: "cadvisor"}], defaultStat: "Sum" }, // Rate would be calculated
        gcp: { type: "prometheus.googleapis.com/container_cpu_usage_seconds_total/counter", unit: "Count", defaultAligner: "ALIGN_RATE"} // Or agent.googleapis.com/docker/cpu/usage_time
    },
    "container_memory_usage_bytes": {
        aws: { name: "container_memory_usage_bytes", namespace: "ECS/containerInsights/Prometheus", unit: "Bytes", dimensions: [{Name: "job", Value: "cadvisor"}], defaultStat: "Average" },
        gcp: { type: "prometheus.googleapis.com/container_memory_usage_bytes/gauge", unit: "Bytes", defaultAligner: "ALIGN_MEAN"} // Or agent.googleapis.com/docker/memory/bytes_used
    }
    // Add more standardized metrics here
};


/**
 * Fetches and normalizes metrics for a given VM.
 * @param {string} internalVmId - Your internal ID for the VM.
 * @param {object} queryOptions - Optional parameters.
 * @param {string} [queryOptions.startTime] - ISO 8601. Defaults to 1 hour ago.
 * @param {string} [queryOptions.endTime] - ISO 8601. Defaults to now.
 * @param {number} [queryOptions.period=60] - Period in seconds.
 * @param {Array<string>} [queryOptions.metrics] - Array of standardized metric names to fetch. Defaults to a basic set.
 * @param {Array<string>} [queryOptions.statistics] - Array of statistics (e.g., Average, Sum). Defaults to metric's default.
 * @returns {Promise<object>} Standardized metrics response.
 */
async function getVmMetrics(internalVmId, queryOptions = {}) {
    const vmInfo = await getVmDetailsFromDb(internalVmId);

    if (!vmInfo) {
        throw new Error(`VM with internal ID ${internalVmId} not found.`);
    }

    const defaults = {
        startTime: new Date(Date.now() - 3600 * 1000).toISOString(),
        endTime: new Date().toISOString(),
        period: 60,
        metrics: ["cpu_utilization", "memory_used_percent"], // Default metrics to fetch
        // statistics are handled per-metric by cloud provider functions
    };
    const options = { ...defaults, ...queryOptions };
    options.metrics = Array.isArray(options.metrics) ? options.metrics : [options.metrics];


    let result;
    if (vmInfo.provider === "AWS") {
        result = await getAwsVmMetrics(vmInfo, options);
    } else if (vmInfo.provider === "GCP") {
        result = await getGcpVmMetrics(vmInfo, options);
    } else {
        throw new Error(`Unsupported provider for VM ${internalVmId}: ${vmInfo.provider}`);
    }
    
    return {
        vmId: internalVmId,
        providerVmId: vmInfo.instanceId,
        provider: vmInfo.provider,
        queryDetails: {
            startTime: options.startTime,
            endTime: options.endTime,
            periodSeconds: options.period,
            requestedMetrics: options.metrics
        },
        metrics: result
    };
}

/**
 * Fetches metrics from AWS CloudWatch.
 */
async function getAwsVmMetrics(awsVmInfo, options) {
    const { instanceId, region } = awsVmInfo;
    const { startTime, endTime, period, metrics: requestedMetrics, statistics: requestedStats } = options;

    const awsCredentials = await credentialsManager.loadAwsCredentials();
    const cwClient = new CloudWatchClient({ region: region, credentials: awsCredentials });

    const metricDataQueries = requestedMetrics.map((metricKey, index) => {
        const translation = METRIC_TRANSLATIONS[metricKey]?.aws;
        if (!translation) {
            console.warn(`[VMMonitoringManager] AWS translation not found for metric: ${metricKey}`);
            return null;
        }

        let queryDimensions = [{ Name: "InstanceId", Value: instanceId }];
        if (translation.dimensions) {
            queryDimensions = queryDimensions.concat(translation.dimensions);
        }

        return {
            Id: `q${index}_${metricKey.replace(/[^a-zA-Z0-9]/g, "")}`,
            MetricStat: {
                Metric: {
                    Namespace: translation.namespace,
                    MetricName: translation.name,
                    Dimensions: queryDimensions,
                },
                Period: period,
                Stat: requestedStats?.[0] || translation.defaultStat || "Average", // Use provided stat or default
                Unit: translation.unit !== "Percent/100" ? translation.unit : undefined // AWS handles Percent directly
            },
            ReturnData: true,
        };
    }).filter(q => q !== null);

    if (metricDataQueries.length === 0) return [];

    const command = new GetMetricDataCommand({
        MetricDataQueries: metricDataQueries,
        StartTime: new Date(startTime),
        EndTime: new Date(endTime),
        ScanBy: "TimestampDescending",
    });

    try {
        const data = await cwClient.send(command);
        return normalizeAwsMetrics(data, requestedMetrics);
    } catch (error) {
        console.error(`[VMMonitoringManager] Error fetching AWS CloudWatch metrics for ${instanceId}:`, error);
        throw error;
    }
}

function normalizeAwsMetrics(awsResponse, requestedMetrics) {
    const normalized = [];
    if (awsResponse && awsResponse.MetricDataResults) {
        awsResponse.MetricDataResults.forEach(result => {
            const originalQueryIdParts = result.Id.substring(1).split('_'); // Remove 'q' and split index_metricKey
            const originalMetricKey = originalQueryIdParts.slice(1).join('_'); // Reconstruct metricKey

            const translation = METRIC_TRANSLATIONS[originalMetricKey]?.aws;
            
            // Safely get stat from MetricDataQueries if it exists
            let stat = "Unknown";
            if (awsResponse.MetricDataQueries) {
                const query = awsResponse.MetricDataQueries.find(q => q.Id === result.Id);
                if (query && query.MetricStat) {
                    stat = query.MetricStat.Stat;
                }
            }

            normalized.push({
                metricName: originalMetricKey,
                namespace: translation?.namespace || "Unknown",
                unit: translation?.unit === "Percent/100" ? "Percent" : (translation?.unit || "Unknown"),
                statistics: [stat],
                datapoints: result.Timestamps.map((ts, index) => ({
                    timestamp: ts.toISOString(),
                    value: translation?.unit === "Percent/100" ? result.Values[index] * 100 : result.Values[index]
                })).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)) // Ensure ascending
            });
        });
    }
    return normalized;
}

/**
 * Fetches metrics from GCP Cloud Monitoring.
 */
async function getGcpVmMetrics(gcpVmInfo, options) {
    const { instanceId, projectId, zone } = gcpVmInfo; // instanceId here is GCP instance NAME
    const { startTime, endTime, period, metrics: requestedMetrics, statistics: requestedStats } = options;

    const gcpCredentials = await credentialsManager.loadGcpCredentials();
    const client = new MetricServiceClient({ credentials: gcpCredentials });

    const timeSeriesRequests = requestedMetrics.map(async (metricKey) => {
        const translation = METRIC_TRANSLATIONS[metricKey]?.gcp;
        if (!translation) {
            console.warn(`[VMMonitoringManager] GCP translation not found for metric: ${metricKey}`);
            return []; // Return empty for this metric if no translation
        }

        let filter = `metric.type = "${translation.type}" AND resource.labels.instance_id = "${instanceId}"`;
        if (zone && !translation.type.startsWith("prometheus.googleapis.com")) { // Zone might not apply to all Prometheus metrics
             filter += ` AND resource.labels.zone = "${zone}"`;
        }
        if (translation.metricLabels) {
            for (const labelKey in translation.metricLabels) {
                filter += ` AND metric.labels.${labelKey} = "${translation.metricLabels[labelKey]}"`;
            }
        }
        
        try {
            const [timeSeries] = await client.listTimeSeries({
                name: `projects/${projectId}`,
                filter: filter,
                interval: {
                    startTime: { seconds: Math.floor(new Date(startTime).getTime() / 1000) },
                    endTime: { seconds: Math.floor(new Date(endTime).getTime() / 1000) },
                },
                aggregation: {
                    alignmentPeriod: { seconds: period },
                    perSeriesAligner: requestedStats?.[0] || translation.defaultAligner || "ALIGN_MEAN",
                },
                view: 'FULL',
            });
            return timeSeries.map(ts => ({ ...ts, originalMetricKey: metricKey, translation })); // Add original key for normalization
        } catch(error){
            console.error(`[VMMonitoringManager] Error fetching GCP metric ${metricKey} (${translation.type}) for ${instanceId}:`, error.details || error.message);
            return []; // Return empty on error for this specific metric
        }
    });

    try {
        const resultsArray = await Promise.all(timeSeriesRequests);
        const allTimeSeries = resultsArray.flat();
        return normalizeGcpMetrics(allTimeSeries);
    } catch (error) {
        console.error(`[VMMonitoringManager] Error processing GCP Cloud Monitoring requests for ${instanceId}:`, error);
        throw error; // Re-throw aggregate error if Promise.all fails for other reasons
    }
}


function normalizeGcpMetrics(timeSeriesArray) {
    const metricsMap = new Map();

    timeSeriesArray.forEach(ts => {
        if (!ts || !ts.metric || !ts.points || ts.points.length === 0) return;

        const originalMetricKey = ts.originalMetricKey;
        const translation = ts.translation; // METRIC_TRANSLATIONS[originalMetricKey]?.gcp
        const unit = translation?.unit === "Percent/100" ? "Percent" : (translation?.unit || ts.unit || "Unknown");

        // Create a unique key for map if dimensions differ for the same metric type
        const seriesKey = `${originalMetricKey}_${JSON.stringify(ts.metric.labels || {})}`;

        if (!metricsMap.has(seriesKey)) {
            metricsMap.set(seriesKey, {
                metricName: originalMetricKey,
                namespace: ts.resource?.type || "gce_instance",
                unit: unit,
                statistics: [ts.aggregation?.perSeriesAligner || "Unknown"], // This might not be directly available, infer from request
                dimensions: ts.metric.labels ? Object.entries(ts.metric.labels).map(([k, v]) => ({ name: k, value: v })) : [],
                datapoints: []
            });
        }

        const metricEntry = metricsMap.get(seriesKey);
        ts.points.forEach(point => {
            let value = point.value.doubleValue ?? point.value.int64Value ?? point.value.boolValue ?? point.value.stringValue ?? point.value.distributionValue?.mean; // Prefer mean for distribution
            if (translation?.unit === "Percent/100" && typeof value === 'number') {
                value *= 100;
            }
            metricEntry.datapoints.push({
                timestamp: new Date(parseInt(point.interval.endTime.seconds) * 1000).toISOString(),
                value: value
            });
        });
    });
    
    metricsMap.forEach(metric => metric.datapoints.sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp)));

    return Array.from(metricsMap.values());
}

// Placeholder for GCP Ops Agent setup logic
async function setupGcpVmMonitoring(instanceId, projectId, zone, agentConfigYaml) {
    console.warn("[vm_monitoring_manager] GCP Ops Agent setup for running VMs is complex and typically requires pre-existing OS Config policies or SSH. This function is a placeholder.");
    // In a real scenario, you might:
    // 1. Use OS Config API to apply a new configuration if the agent is managed by it.
    // 2. SSH into the machine, write the config to /etc/google-cloud-ops-agent/config.yaml, and restart the agent.
    //    This requires SSH key management and remote execution capabilities.
    // 3. For new VMs, this is best done via startup scripts.
    return {
        success: false,
        message: "GCP Ops Agent setup on running VM not fully implemented. Placeholder.",
        details: { instanceId, projectId, zone, agentConfigProvided: !!agentConfigYaml }
    };
}

/**
 * Installs or configures the AWS CloudWatch Agent on a given EC2 instance using SSM SendCommand.
 * @param {string} instanceId The ID of the EC2 instance.
 * @param {string} region The AWS region of the instance.
 * @param {object} cloudWatchAgentConfig The CloudWatch Agent configuration JSON object.
 * @returns {Promise<object>} An object indicating success or failure and the command ID.
 */
async function setupAwsVmMonitoring(instanceId, region, cloudWatchAgentConfig) {
    if (!instanceId || !region || !cloudWatchAgentConfig) {
        return { success: false, message: "Instance ID, region, and agent configuration are required." };
    }

    console.log(`[vm_monitoring_manager] Initiating CloudWatch Agent setup for instance ${instanceId} in region ${region}.`);

    try {
        const awsCredentials = await credentialsManager.loadAwsCredentials(); // Make sure this provides credentials for SSM
        const ssmClient = new SSMClient({ region, credentials: awsCredentials });

        const agentConfigString = JSON.stringify(cloudWatchAgentConfig);
        const installScriptName = "install_and_configure_cloudwatch_agent.sh"; // Using a descriptive name

        // Commands to download, configure, and restart the CloudWatch Agent
        // This script is more robust: it ensures the agent is installed, then configures and restarts.
        const commands = [
            "#!/bin/bash",
            "set -e", // Exit immediately if a command exits with a non-zero status.
            "echo \"Starting CloudWatch Agent setup via SSM...\"",
            
            "# Check if wget is installed, install if not (common prerequisite)",
            "if ! command -v wget &> /dev/null; then",
            "  echo \"wget not found. Attempting to install...\"",
            "  if command -v apt-get &> /dev/null; then sudo apt-get update -y && sudo apt-get install -y wget; fi",
            "  elif command -v yum &> /dev/null; then sudo yum install -y wget; fi",
            "  else echo \"Package manager not supported for wget installation. Please install wget manually.\" && exit 1; fi",
            "fi",

            "# Determine architecture and OS for download URL",
            "ARCH=$(uname -m)",
            "AGENT_URL=\"\"",
            "PKG_MANAGER=\"\"",
            "if [[ \"$ARCH\" == \"x86_64\" ]]; then AGENT_URL=\"https://s3.amazonaws.com/amazoncloudwatch-agent/linux/amd64/latest/amazon-cloudwatch-agent\"; fi",
            "if [[ \"$ARCH\" == \"aarch64\" ]]; then AGENT_URL=\"https://s3.amazonaws.com/amazoncloudwatch-agent/linux/arm64/latest/amazon-cloudwatch-agent\"; fi",
            "if [[ -z \"$AGENT_URL\" ]]; then echo \"Unsupported architecture: $ARCH\"; exit 1; fi",
            
            "# Download and install/update the agent using the determined package type (rpm or deb or just binary)",
            "echo \"Downloading CloudWatch Agent from $AGENT_URL ...\"",
            "wget \"$AGENT_URL.rpm\" -O /tmp/amazon-cloudwatch-agent.rpm || wget \"$AGENT_URL.deb\" -O /tmp/amazon-cloudwatch-agent.deb || wget \"$AGENT_URL.tar.gz\" -O /tmp/amazon-cloudwatch-agent.tar.gz",
            
            "if [ -f /tmp/amazon-cloudwatch-agent.rpm ]; then",
            "  echo \"Installing .rpm package...\"",
            "  sudo yum install -y /tmp/amazon-cloudwatch-agent.rpm || sudo dnf install -y /tmp/amazon-cloudwatch-agent.rpm",
            "elif [ -f /tmp/amazon-cloudwatch-agent.deb ]; then",
            "  echo \"Installing .deb package...\"",
            "  sudo dpkg -i -E /tmp/amazon-cloudwatch-agent.deb || (sudo apt-get update -y && sudo apt-get install -y -f /tmp/amazon-cloudwatch-agent.deb)",
            "elif [ -f /tmp/amazon-cloudwatch-agent.tar.gz ]; then",
            "  echo \"Installing from .tar.gz...\"",
            "  sudo tar xf /tmp/amazon-cloudwatch-agent.tar.gz -C /tmp",
            "  sudo /tmp/install.sh",
            "else",
            "  echo \"Failed to download a suitable CloudWatch agent package.\"",
            "  exit 1",
            "fi",
            "echo \"CloudWatch Agent installed/updated.\"",

            "# Create configuration directory if it doesn\'t exist",
            "sudo mkdir -p /opt/aws/amazon-cloudwatch-agent/etc/",
            
            "# Write the configuration file",
            "echo \"Writing CloudWatch Agent configuration...\"",
            "cat <<'EOF' | sudo tee /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json > /dev/null",
            agentConfigString, 
            "EOF",
            "echo \"CloudWatch Agent configuration written.\"",

            "# Start/Restart the agent with the new configuration",
            "echo \"Starting/Restarting CloudWatch Agent...\"",
            "sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s",
            "echo \"CloudWatch Agent setup script finished.\""
        ];

        const sendCommand = new SendCommandCommand({
            InstanceIds: [instanceId],
            DocumentName: "AWS-RunShellScript",
            Parameters: {
                commands: commands,
                executionTimeout: ["3600"] // Optional: 1 hour timeout
            },
            Comment: `CloudWatch Agent configuration update via API at ${new Date().toISOString()}`,
            // OutputS3BucketName: "your-s3-bucket-for-ssm-logs", // Optional: For storing command output
            // OutputS3KeyPrefix: "ssm-command-outputs/",      // Optional
        });

        const { Command } = await ssmClient.send(sendCommand);
        console.log(`[vm_monitoring_manager] SSM SendCommand initiated. Command ID: ${Command.CommandId}`);
        
        return {
            success: true,
            message: "CloudWatch Agent configuration command sent successfully.",
            instanceId: instanceId,
            commandId: Command.CommandId,
            // You can add status polling logic here or in the service layer if needed
        };

    } catch (error) {
        console.error(`[vm_monitoring_manager] Error in setupAwsVmMonitoring for instance ${instanceId}:`, error);
        return {
            success: false,
            message: error.message || "Failed to send CloudWatch Agent configuration command.",
            error: error
        };
    }
}

// Export insertTestVmRecord for testing
module.exports = {
    getVmMetrics,
    insertTestVmRecord, // Only export for testing, remove in production
    setupAwsVmMonitoring,
    setupGcpVmMonitoring
}; 