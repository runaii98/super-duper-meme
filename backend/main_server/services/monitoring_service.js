const vmMonitoringManager = require('../vm_monitoring_manager');
const { SSMClient, GetCommandInvocationCommand } = require("@aws-sdk/client-ssm");
const credentialsManager = require('../vm_allocation_engine/credentials_manager');
const { MetricServiceClient } = require('@google-cloud/monitoring');

class MonitoringService {
    constructor() {
        // Clients can be initialized here if they are region-agnostic or a default region is used.
        // For region-specific clients, it's often better to create them on-demand in methods.
    }

    async _getGcpMonitoringClient() {
        const gcpCredentials = await credentialsManager.loadGcpCredentials();
        return new MetricServiceClient({ credentials: gcpCredentials });
    }

    // Helper to get any GCP client and its associated project ID. 
    // This can be used if multiple client types are needed or to centralize projectId fetching.
    async _getGcpClientAndProjectId(clientType = 'monitoring') { // clientType can be 'monitoring', 'compute', etc.
        try {
            console.log(`[MonitoringService] Getting GCP client for ${clientType}`);
            const gcpCredentials = await credentialsManager.loadGcpCredentials();
            console.log(`[MonitoringService] GCP credentials loaded successfully: ${!!gcpCredentials}`);
            
            let client;
            switch (clientType) {
                // Add other client types here if needed by this service
                // case 'compute':
                // client = new InstancesClient({ credentials: gcpCredentials });
                // break;
                case 'monitoring':
                default:
                    client = new MetricServiceClient({ credentials: gcpCredentials });
                    break;
            }
            
            console.log(`[MonitoringService] GCP ${clientType} client initialized, fetching projectId...`);
            let projectId;
            try {
                projectId = await client.getProjectId();
                console.log(`[MonitoringService] GCP projectId successfully fetched: ${projectId}`);
            } catch (projectIdError) {
                console.error(`[MonitoringService] ERROR getting GCP projectId: ${projectIdError.message}`);
                throw new Error(`Failed to get GCP projectId from credentials: ${projectIdError.message}`);
            }
            
            if (!projectId) {
                throw new Error(`GCP Project ID could not be determined from credentials for client type: ${clientType}.`);
            }
            return { client, projectId };
        } catch (error) {
            console.error(`[MonitoringService] ERROR in _getGcpClientAndProjectId: ${error.message}`);
            throw error;
        }
    }

    async configureAgent(instanceId, provider, region, agentConfiguration) {
        if (!instanceId || !provider || !region || !agentConfiguration) {
            return { success: false, message: "Instance ID, provider, region, and agent configuration are required." };
        }

        provider = provider.toLowerCase();
        if (provider === 'aws') {
            // The region for setupAwsVmMonitoring is the instance's region.
            // Ensure credentials loaded by credentialsManager are appropriate for SSM in that region.
            return await vmMonitoringManager.setupAwsVmMonitoring(instanceId, region, agentConfiguration);
        } else if (provider === 'gcp') {
            try {
                console.log(`[MonitoringService] Configuring GCP agent for instance ${instanceId} in zone ${region}`);
                // We need projectId for setupGcpVmMonitoring. Fetch it using a GCP client.
                // Using MetricServiceClient here, but any GCP client from @google-cloud would work.
                let projectId;
                try {
                    const { projectId: fetchedProjectId } = await this._getGcpClientAndProjectId('monitoring'); 
                    projectId = fetchedProjectId;
                    console.log(`[MonitoringService] Successfully retrieved GCP projectId: ${projectId}`);
                } catch (projectIdError) {
                    console.error(`[MonitoringService] Failed to get GCP projectId: ${projectIdError.message}`);
                    return {
                        success: false,
                        message: `Failed to get GCP project ID from credentials: ${projectIdError.message}`,
                        error: projectIdError
                    };
                }

                // region is the zone for GCP
                // agentConfiguration is expected to be the Ops Agent YAML config string
                console.log(`[MonitoringService] Calling setupGcpVmMonitoring with projectId=${projectId}, zone=${region}`);
                const result = await vmMonitoringManager.setupGcpVmMonitoring(instanceId, projectId, region, agentConfiguration);
                if (result.success) {
                    return {
                        success: true,
                        message: "GCP Ops Agent configuration and installation guidance has been prepared. Manual application or OS Configuration service is typically required.",
                        instanceId: result.instanceId,
                        details: {
                            configContent: result.configContent,
                            installationScript: result.installationScript,
                            originalMessage: result.message, // Keep original message from vm_monitoring_manager for context
                            projectId: projectId // Include projectId used for transparency
                        }
                    };
                }
                return result; // Pass through if vmMonitoringManager.setupGcpVmMonitoring itself failed
            } catch (error) {
                console.error(`[MonitoringService] Error calling setupGcpVmMonitoring for instance ${instanceId}:`, error);
                return {
                    success: false,
                    message: error.message || "Failed to prepare GCP agent configuration due to an internal error.",
                    error: error
                };
            }
        } else {
            return { success: false, message: `Provider '${provider}' not supported for agent configuration.` };
        }
    }

    async getAgentStatus(instanceId, provider, region, commandId) {
        if (!instanceId || !provider || !region) {
            return { success: false, message: "Instance ID, provider, and region are required for agent status." };
        }
        provider = provider.toLowerCase();

        if (provider === 'aws') {
            if (!commandId) {
                // If no commandId, we can't check SSM command status.
                // Future enhancement: try to check agent status via CloudWatch Synthetics or instance metadata if possible,
                // or by running a new SSM command to check the agent service status (e.g., systemctl status amazon-cloudwatch-agent).
                return { 
                    success: false, 
                    message: "commandId is required to check AWS CloudWatch Agent configuration status via SSM. General agent health check not yet implemented without a commandId.",
                    status: "UNKNOWN",
                    details: "Provide a commandId from a recent configuration attempt."
                };
            }
            try {
                const awsCredentials = await credentialsManager.loadAwsCredentials();
                const ssmClient = new SSMClient({ region, credentials: awsCredentials });
                const getCommandInvocation = new GetCommandInvocationCommand({
                    CommandId: commandId,
                    InstanceId: instanceId
                });
                const response = await ssmClient.send(getCommandInvocation);
                
                let agentOperationalStatus = "UNKNOWN";
                // Infer operational status based on SSM command outcome for the configuration script
                switch (response.Status) {
                    case "Success":
                        agentOperationalStatus = "RUNNING_CONFIGURED"; // Assuming script ensures it's running
                        break;
                    case "Pending":
                    case "InProgress":
                    case "Delayed":
                        agentOperationalStatus = "PENDING_CONFIGURATION";
                        break;
                    case "Failed":
                    case "Cancelled":
                    case "TimedOut":
                    case "Cancelling":
                        agentOperationalStatus = "ERROR_CONFIGURATION";
                        break;
                    default:
                        agentOperationalStatus = "UNKNOWN";
                }

                return {
                    success: true,
                    instanceId: response.InstanceId,
                    commandId: response.CommandId,
                    requestedDateTime: response.RequestedDateTime ? response.RequestedDateTime.toISOString() : null,
                    status: agentOperationalStatus, // This is the status of the *configuration command*
                    ssmCommandStatus: response.Status,
                    ssmCommandStatusDetails: response.StatusDetails,
                    standardOutputUrl: response.StandardOutputUrl, // Link to S3 if configured
                    standardErrorUrl: response.StandardErrorUrl,   // Link to S3 if configured
                    // Note: To get actual CloudWatch Agent health, you'd typically need to query CloudWatch metrics
                    // or run a command on the instance to check the service status.
                };
            } catch (error) {
                console.error(`[MonitoringService] Error getting SSM command invocation for instance ${instanceId}, command ${commandId}:`, error);
                return {
                    success: false,
                    message: error.message || "Failed to get agent configuration status.",
                    status: "ERROR_API_CALL",
                    error: error
                };
            }
        } else if (provider === 'gcp') {
            // For GCP, region is the zone, instanceId is the instance name.
            // We will check for the 'agent.googleapis.com/agent/uptime' metric.
            try {
                console.log(`[MonitoringService] Getting GCP agent status for instance ${instanceId} in zone ${region}`);
                let monitoringClient, projectId;
                
                try {
                    const result = await this._getGcpClientAndProjectId('monitoring');
                    monitoringClient = result.client;
                    projectId = result.projectId;
                    console.log(`[MonitoringService] Successfully retrieved GCP client and projectId: ${projectId}`);
                } catch (clientError) {
                    console.error(`[MonitoringService] Error getting GCP client and projectId: ${clientError.message}`);
                    return {
                        success: false,
                        message: `Failed to initialize GCP monitoring client: ${clientError.message}`,
                        status: "ERROR_CLIENT_INIT",
                        error: clientError
                    };
                }

                const now = Date.now();
                const fiveMinutesAgo = new Date(now - 5 * 60 * 1000).toISOString();
                const nowISO = new Date(now).toISOString();

                const request = {
                    name: `projects/${projectId}`,
                    filter: `metric.type = "agent.googleapis.com/agent/uptime" AND resource.type = "gce_instance" AND resource.labels.instance_id = "${instanceId}" AND resource.labels.zone = "${region}"`,
                    interval: {
                        startTime: {
                            seconds: Math.floor(new Date(fiveMinutesAgo).getTime() / 1000),
                        },
                        endTime: {
                            seconds: Math.floor(new Date(nowISO).getTime() / 1000),
                        },
                    },
                    pageSize: 1, 
                };
                console.log(`[MonitoringService] GCP getAgentStatus listTimeSeries request for project ${projectId}: ${JSON.stringify(request)}`);

                const [timeSeries] = await monitoringClient.listTimeSeries(request);

                if (timeSeries && timeSeries.length > 0 && timeSeries[0].points && timeSeries[0].points.length > 0) {
                    return {
                        success: true,
                        instanceId: instanceId,
                        status: "RUNNING", 
                        details: "Ops Agent is reporting metrics (uptime found in the last 5 minutes).",
                        lastMetricValue: timeSeries[0].points[0].value.int64Value || timeSeries[0].points[0].value.doubleValue,
                        lastMetricTime: new Date(timeSeries[0].points[0].interval.endTime.seconds * 1000).toISOString(),
                        projectId: projectId // Optionally include projectId in response for informational purposes
                    };
                } else {
                    return {
                        success: true, 
                        instanceId: instanceId,
                        status: "UNKNOWN_OR_STOPPED",
                        details: "Ops Agent uptime metric not found in the last 5 minutes. Agent might be stopped, not configured, or not reporting.",
                        projectId: projectId
                    };
                }
            } catch (error) {
                console.error(`[MonitoringService] Error getting GCP Ops Agent status for instance ${instanceId}:`, error);
                // Try to get projectId for logging even if the main operation failed, if not already fetched.
                let loggedProjectId = 'unknown';
                try {
                    const gcpCreds = await credentialsManager.loadGcpCredentials();
                    const tempClient = new MetricServiceClient({ credentials: gcpCreds });
                    loggedProjectId = await tempClient.getProjectId() || 'unknown_after_fetch';
                } catch (pidError) {
                    // ignore if can't get projectId for logging
                }
                console.error(`[MonitoringService] Error context: instanceId=${instanceId}, region=${region}, attemptedProjectId=${loggedProjectId}`, error);
                return {
                    success: false,
                    message: error.message || "Failed to get GCP Ops Agent status due to API error.",
                    status: "ERROR_API_CALL",
                    error: error
                };
            }
        } else {
            return { success: false, message: `Provider '${provider}' not supported for agent status.` };
        }
    }

    // TODO: Implement other methods:
    // async getAgentConfiguration(instanceId, provider, region) { /* ... */ }
    // async getConfiguredMetrics(instanceId, provider, region) { /* ... */ }
    // async getConfiguredLogSources(instanceId, provider, region) { /* ... */ }
}

module.exports = new MonitoringService(); 