const { EC2Client, DescribeInstancesCommand, GetConsoleOutputCommand } = require("@aws-sdk/client-ec2");
const { CloudWatchClient, ListMetricsCommand } = require("@aws-sdk/client-cloudwatch");
const { CloudWatchLogsClient, DescribeLogStreamsCommand } = require("@aws-sdk/client-cloudwatch-logs");
const { InstancesClient } = require('@google-cloud/compute'); // GCP Compute Client
const { MetricServiceClient } = require('@google-cloud/monitoring'); // GCP Monitoring Client
const { LoggingServiceV2Client } = require('@google-cloud/logging'); // GCP Logging Client
const credentialsManager = require('../vm_allocation_engine/credentials_manager'); // Assuming this handles GCP creds too

// TODO: Add GCP SDK clients when implementing GCP logic
// const { Compute } = require('@google-cloud/compute');
// const { MetricServiceClient } = require('@google-cloud/monitoring');
// const { Logging } = require('@google-cloud/logging');

class InstanceInfoService {
    constructor() {
        // Clients are initialized per-request to handle region/project correctly
    }

    async _getAwsEc2Client(region) {
        return new EC2Client({ region, credentials: await credentialsManager.loadAwsCredentials() });
    }

    async _getAwsCloudWatchClient(region) {
        return new CloudWatchClient({ region, credentials: await credentialsManager.loadAwsCredentials() });
    }

    async _getAwsCloudWatchLogsClient(region) {
        return new CloudWatchLogsClient({ region, credentials: await credentialsManager.loadAwsCredentials() });
    }

    async _getGcpComputeClient() {
        // Assumes credentialsManager sets up GOOGLE_APPLICATION_CREDENTIALS or provides them
        const gcpCredentials = await credentialsManager.loadGcpCredentials(); // May return undefined if relying on env var
        return new InstancesClient({ credentials: gcpCredentials }); // SDK handles ADC if credentials undefined
    }

    async _getGcpMonitoringClient() {
        const gcpCredentials = await credentialsManager.loadGcpCredentials();
        return new MetricServiceClient({ credentials: gcpCredentials });
    }

    async _getGcpLoggingClient() {
        const gcpCredentials = await credentialsManager.loadGcpCredentials();
        return new LoggingServiceV2Client({ credentials: gcpCredentials });
    }

    // Helper to get any GCP client and ensure its projectId is available
    async _getGcpClientAndProjectId(clientType = 'compute') {
        try {
            console.log(`[InstanceInfoService] Getting GCP client for ${clientType}`);
            let client;
            const gcpCredentials = await credentialsManager.loadGcpCredentials();
            console.log(`[InstanceInfoService] GCP credentials loaded successfully: ${!!gcpCredentials}`);

            switch (clientType) {
                case 'compute':
                    client = new InstancesClient({ credentials: gcpCredentials });
                    break;
                case 'monitoring':
                    client = new MetricServiceClient({ credentials: gcpCredentials });
                    break;
                case 'logging':
                    client = new LoggingServiceV2Client({ credentials: gcpCredentials });
                    break;
                default:
                    throw new Error(`Unknown GCP client type: ${clientType}`);
            }

            console.log(`[InstanceInfoService] GCP ${clientType} client initialized, fetching projectId...`);
            let projectId;
            try {
                projectId = await client.getProjectId();
                console.log(`[InstanceInfoService] GCP projectId successfully fetched: ${projectId}`);
            } catch (projectIdError) {
                console.error(`[InstanceInfoService] ERROR getting GCP projectId: ${projectIdError.message}`);
                throw new Error(`Failed to get GCP projectId from credentials: ${projectIdError.message}`);
            }

            if (!projectId) {
                throw new Error(`GCP Project ID could not be determined from credentials for client type: ${clientType}.`);
            }
            return { client, projectId };
        } catch (error) {
            console.error(`[InstanceInfoService] ERROR in _getGcpClientAndProjectId: ${error.message}`);
            throw error;
        }
    }

    async describeInstance(instanceId, provider, regionOrZone) { // Removed projectId
        provider = provider.toLowerCase();
        if (provider === 'aws') {
            if (!regionOrZone) throw new Error('Region is required for AWS describeInstance');
            const ec2Client = await this._getAwsEc2Client(regionOrZone);
            const command = new DescribeInstancesCommand({ InstanceIds: [instanceId] });
            try {
                const response = await ec2Client.send(command);
                if (response.Reservations && response.Reservations.length > 0 && response.Reservations[0].Instances.length > 0) {
                    return response.Reservations[0].Instances[0];
                }
                return null;
            } catch (error) {
                console.error(`Error describing AWS instance ${instanceId} in region ${regionOrZone}:`, error);
                if (error.name === 'InvalidInstanceID.NotFound') return null;
                throw error;
            }
        } else if (provider === 'gcp') {
            if (!regionOrZone) throw new Error('Zone is required for GCP describeInstance');
            
            console.log(`[DEBUG] GCP describeInstance request: instanceId=${instanceId}, zone=${regionOrZone}`);
            
            try {
                console.log(`[InstanceInfoService] Describing GCP instance ${instanceId} in zone ${regionOrZone}`);
                try {
                    const { client: computeClient, projectId } = await this._getGcpClientAndProjectId('compute');
                    console.log(`[InstanceInfoService] Successfully retrieved GCP client and projectId: ${projectId}`);
                    console.log(`[InstanceInfoService] Using projectId ${projectId} for GCP instance description`);

                    try {
                        const [instance] = await computeClient.get({
                            project: projectId,
                            zone: regionOrZone,
                            instance: instanceId, // instanceId for GCP is the instance name
                        });
                        return instance;
                    } catch (error) {
                        console.error(`Error describing GCP instance ${instanceId} in zone ${regionOrZone}, project ${projectId}:`, error);
                        if (error.code === 5) { // code 5 is NOT_FOUND for GCP
                            return null;
                        }
                        throw error;
                    }
                } catch (projectIdError) {
                    console.error(`[InstanceInfoService] Failed to get projectId: ${projectIdError.message}`);
                    throw new Error(`GCP Project ID could not be retrieved from credentials: ${projectIdError.message}`);
                }
            } catch (clientError) {
                console.error(`[InstanceInfoService] Failed to get GCP client: ${clientError.message}`);
                throw new Error(`GCP client initialization failed: ${clientError.message}`);
            }
        } else {
            throw new Error(`Provider '${provider}' not supported yet for describeInstance`);
        }
    }

    async getConsoleOutput(instanceId, provider, regionOrZone) { // Removed projectId
        provider = provider.toLowerCase();
        if (provider === 'aws') {
            if (!regionOrZone) throw new Error('Region is required for AWS getConsoleOutput');
            const ec2Client = await this._getAwsEc2Client(regionOrZone);
            const command = new GetConsoleOutputCommand({ InstanceId: instanceId, Latest: true });
            try {
                const response = await ec2Client.send(command);
                if (response.Output) {
                    return Buffer.from(response.Output, 'base64').toString('utf-8');
                }
                return null;
            } catch (error) {
                console.error(`Error getting console output for AWS instance ${instanceId}:`, error);
                throw error;
            }
        } else if (provider === 'gcp') {
            if (!regionOrZone) throw new Error('Zone is required for GCP getConsoleOutput');

            try {
                console.log(`[InstanceInfoService] Getting console output for GCP instance ${instanceId} in zone ${regionOrZone}`);
                const { client: computeClient, projectId } = await this._getGcpClientAndProjectId('compute');
                console.log(`[InstanceInfoService] Using projectId ${projectId} for GCP console output`);

                try {
                    const [response] = await computeClient.getSerialPortOutput({
                        project: projectId,
                        zone: regionOrZone,
                        instance: instanceId,
                        port: 1, // COM1, typically the main serial console output
                    });
                    return response.contents || null;
                } catch (error) {
                    console.error(`Error getting console output for GCP instance ${instanceId} in zone ${regionOrZone}, project ${projectId}:`, error);
                    if (error.code === 5) { // NOT_FOUND
                        return null;
                    }
                    throw error;
                }
            } catch (clientError) {
                console.error(`[InstanceInfoService] Failed to get GCP client: ${clientError.message}`);
                throw new Error(`GCP client initialization failed: ${clientError.message}`);
            }
        } else {
            throw new Error(`Provider '${provider}' not supported yet for getConsoleOutput`);
        }
    }

    async listMetrics(instanceId, provider, region, namespace) { // Removed projectId
        provider = provider.toLowerCase();
        if (provider === 'aws') {
            if (!region) throw new Error('Region is required for AWS listMetrics');
            const cwClient = await this._getAwsCloudWatchClient(region);
            const params = { Dimensions: [{ Name: 'InstanceId', Value: instanceId }] };
            if (namespace) params.Namespace = namespace; // e.g. 'AWS/EC2', 'CWAgent'
            const command = new ListMetricsCommand(params);
            try {
                const response = await cwClient.send(command);
                return response.Metrics || [];
            } catch (error) {
                console.error(`Error listing metrics for AWS instance ${instanceId}:`, error);
                throw error;
            }
        } else if (provider === 'gcp') {
            console.log(`[DEBUG] GCP listMetrics request: instanceId=${instanceId}, zone=${region}, namespace=${namespace || 'none'}`);
            
            try {
                console.log(`[InstanceInfoService] Listing metrics for GCP instance ${instanceId} in zone ${region}`);
                try {
                    const { client: monitoringClient, projectId } = await this._getGcpClientAndProjectId('monitoring');
                    console.log(`[InstanceInfoService] Successfully retrieved GCP client and projectId: ${projectId}`);
                    console.log(`[InstanceInfoService] Using projectId ${projectId} for GCP metrics listing`);
                    
                    // region here is the zone for GCP, instanceId is the instance name.
                    // namespace is conceptual; we'll use it to filter metric types if provided.
                    
                    // Base filter for GCE instance metrics
                    let filter = `resource.type = "gce_instance" AND resource.labels.instance_id = "${instanceId}"`;
                    if (region) { // region is zone for GCP
                        filter += ` AND resource.labels.zone = "${region}"`;
                    }
                    
                    // If a namespace (metric type prefix) is provided, add it to the filter.
                    // e.g., "compute.googleapis.com/instance" or "agent.googleapis.com"
                    if (namespace) {
                        filter += ` AND metric.type = starts_with("${namespace}")`;
                    } else {
                        // Default to common GCE metrics if no specific namespace given.
                        filter += ` AND (metric.type = starts_with("compute.googleapis.com/instance/") OR metric.type = starts_with("agent.googleapis.com/"))`;
                    }

                    try {
                        const request = {
                            name: `projects/${projectId}`,
                            filter: filter,
                            // pageSize: 100, // Optional: control page size
                        };
                        console.log(`[InstanceInfoService] GCP listMetrics request: ${JSON.stringify(request)}`);

                        const [descriptors] = await monitoringClient.listMetricDescriptors(request);
                        
                        return descriptors.map(desc => ({
                            name: desc.type,
                            description: desc.description,
                            unit: desc.unit,
                            metricKind: desc.metricKind,
                            valueType: desc.valueType,
                            labels: desc.labels ? desc.labels.map(l => ({ key: l.key, description: l.description })) : []
                        }));

                    } catch (error) {
                        console.error(`Error listing metric descriptors for GCP instance ${instanceId} in project ${projectId}:`, error);
                        if (error.code === 5) { 
                             return { error: "NOT_FOUND", message: `Could not find metrics, ensure project ID '${projectId}' and instance '${instanceId}' are correct and metrics are available. Details: ${error.details}` };
                        } else if (error.code === 3) { 
                            return { error: "INVALID_ARGUMENT", message: `Invalid argument for listing metrics. Check filter syntax or parameters. Filter used: '${filter}'. Details: ${error.details}` };
                        }
                        throw error;
                    }
                } catch (projectIdError) {
                    console.error(`[InstanceInfoService] Failed to get projectId: ${projectIdError.message}`);
                    throw new Error(`GCP Project ID could not be retrieved from credentials: ${projectIdError.message}`);
                }
            } catch (clientError) {
                console.error(`[InstanceInfoService] Failed to get GCP client: ${clientError.message}`);
                throw new Error(`GCP client initialization failed: ${clientError.message}`);
            }
        } else {
            throw new Error(`Provider '${provider}' not supported yet for listMetrics`);
        }
    }

    async listLogStreams(instanceId, provider, region, logGroupName) { // Removed projectId. region is zone for GCP.
        provider = provider.toLowerCase();
        if (provider === 'aws') {
            if (!region) throw new Error('Region is required for AWS listLogStreams');
            if (!logGroupName) throw new Error('logGroupName is required for AWS');
            const cwLogsClient = await this._getAwsCloudWatchLogsClient(region);
            const command = new DescribeLogStreamsCommand({
                logGroupName: decodeURIComponent(logGroupName), // logGroupName might be URL encoded
                orderBy: 'LastEventTime',
                descending: true,
                limit: 50
            });
            try {
                const response = await cwLogsClient.send(command);
                return response.logStreams || [];
            } catch (error) {
                console.error(`Error listing log streams for AWS log group ${logGroupName}:`, error);
                throw error;
            }
        } else if (provider === 'gcp') {
            if (!region) throw new Error('Zone (passed as region parameter) is required for GCP listLogStreams to construct full resource name');
            
            try {
                console.log(`[InstanceInfoService] Listing log streams for GCP instance ${instanceId} in zone ${region}`);
                const { client: loggingClient, projectId } = await this._getGcpClientAndProjectId('logging');
                console.log(`[InstanceInfoService] Using projectId ${projectId} for GCP log streams listing`);

                const parentProject = `projects/${projectId}`;
                const instanceResourceName = `projects/${projectId}/zones/${region}/instances/${instanceId}`;

                try {
                    const request = {
                        parent: parentProject, 
                        resourceNames: [instanceResourceName], 
                    };
                    console.log(`[InstanceInfoService] GCP listLogs request: ${JSON.stringify(request)}`)

                    const [logs] = await loggingClient.listLogs(request);

                    let filteredLogs = logs;
                    if (logGroupName) {
                        const decodedLogGroupName = decodeURIComponent(logGroupName);
                        filteredLogs = logs.filter(logName => logName.endsWith(`/${decodedLogGroupName}`));
                    }

                    return filteredLogs.map(logName => ({
                        logStreamName: logName, 
                        arn: `gcp:${projectId}:logging:::log:${logName.split('/').pop()}`, 
                        instanceId: instanceId
                    }));
                } catch (error) {
                    console.error(`Error listing log streams for GCP instance ${instanceId}:`, error);
                    throw error;
                }
            } catch (clientError) {
                console.error(`[InstanceInfoService] Failed to get GCP client: ${clientError.message}`);
                throw new Error(`GCP client initialization failed: ${clientError.message}`);
            }
        } else {
            throw new Error(`Provider '${provider}' not supported yet for listLogStreams`);
        }
    }
}

module.exports = new InstanceInfoService(); 