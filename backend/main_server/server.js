const express = require('express');
const cors = require('cors');
const { findOptimalVm } = require('./vm_allocation_engine/region_selector');
const { provisionAwsVm, provisionGcpVm, deleteAwsVm, deleteGcpVm, modifyAwsRootVolume, modifyGcpBootDisk, listAwsInstances, listGcpInstances, stopAwsInstance, stopGcpInstance, osImageMappings } = require('./vm_allocation_engine/vm_provisioner');
const { createAwsSecurityGroup, createGcpFirewallRule, authorizeMoreAwsRules, revokeAwsSecurityGroupRules } = require('./vm_allocation_engine/security_manager');
const { EC2Client } = require('@aws-sdk/client-ec2');
const credentialsManager = require('./vm_allocation_engine/credentials_manager');
const { getVmMetrics, setupAwsVmMonitoring, setupGcpVmMonitoring } = require('./vm_monitoring_manager');

// New routes
const instanceInfoRoutes = require('./routes/instance_info_routes');
const monitoringRoutes = require('./routes/monitoring_routes');
const cloudProviderRoutes = require('./routes/cloud_provider_routes');

const app = express();
const PORT = process.env.PORT || 3006;

// --- CORS Configuration ---
const allowedOrigins = ['http://localhost:3000']; // Add any other origins if needed

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Add all methods your API supports
  allowedHeaders: ['Content-Type', 'Authorization'], // Add any custom headers your frontend might send
  credentials: true // If you need to handle cookies or authorization headers
};

app.use(cors(corsOptions));
// --- End CORS Configuration ---

// Middleware to parse JSON bodies
app.use(express.json());

// Register our route handlers
app.use('/api/v1/instances', instanceInfoRoutes);
app.use('/api/v1/monitoring', monitoringRoutes);

// Register our new cloud provider routes
app.use('/api/providers', cloudProviderRoutes);

// --- API Endpoint for OS Images ---
app.get('/api/v1/os-images', (req, res) => {
    console.log("Received request on /api/v1/os-images");
    if (osImageMappings) {
        res.json(osImageMappings);
    } else {
        console.error("osImageMappings is not loaded in /api/v1/os-images");
        res.status(500).json({ error: 'Internal Server Error: OS image data not available.' });
    }
});
// --- End API Endpoint for OS Images ---

// Basic route for testing server is up
app.get('/', (req, res) => {
    res.send('VM Allocation Engine API is running!');
});

// --- API Endpoint for Finding VMs ---
app.post('/api/v1/find-cheapest-instance', async (req, res) => {
    console.log("Received request on /api/v1/find-cheapest-instance");
    const criteria = req.body;

    // --- Enhanced Validation ---
    if (!criteria) {
        return res.status(400).json({ error: 'Request body is missing.' });
    }
    if (!criteria.user_ip_address) {
        return res.status(400).json({ error: 'Missing required field: user_ip_address' });
    }
    if (!criteria.preference || (criteria.preference !== 'performance' && criteria.preference !== 'price')) {
        return res.status(400).json({ error: 'Missing or invalid required field: preference (must be \'performance\' or \'price\')' });
    }
    
    // Hardware spec validation: Need at least vcpu and ram_gb
    if (typeof criteria.vcpu !== 'number' || criteria.vcpu <= 0) {
         return res.status(400).json({ error: 'Missing or invalid required field: vcpu (must be a positive number)' });
    }
    if (typeof criteria.ram_gb !== 'number' || criteria.ram_gb <= 0) {
         return res.status(400).json({ error: 'Missing or invalid required field: ram_gb (must be a positive number)' });
    }

    // Optional fields type check
    if (criteria.gpu_type && typeof criteria.gpu_type !== 'string') {
        return res.status(400).json({ error: 'Invalid field type: gpu_type (must be a string)' });
    }
    if (criteria.gpu_count && (typeof criteria.gpu_count !== 'number' || criteria.gpu_count <= 0)) {
        return res.status(400).json({ error: 'Invalid field type: gpu_count (must be a positive number)' });
    }
    if (criteria.storage_gb && (typeof criteria.storage_gb !== 'number' || criteria.storage_gb <= 0)) {
        return res.status(400).json({ error: 'Invalid field type: storage_gb (must be a positive number)' });
    }
     if (criteria.storage_type && typeof criteria.storage_type !== 'string') {
        return res.status(400).json({ error: 'Invalid field type: storage_type (must be a string)' });
    }
      if (criteria.instance_type && typeof criteria.instance_type !== 'string') {
        return res.status(400).json({ error: 'Invalid field type: instance_type (must be a string)' });
    }

    // Default gpu_count if gpu_type is provided without it
    if (criteria.gpu_type && !criteria.gpu_count) {
        criteria.gpu_count = 1;
    }

    console.log("Request Criteria (Validated):", criteria);

    try {
        const results = await findOptimalVm(criteria);
        console.log(`findOptimalVm returned ${results.length} results.`);
        res.json(results);
    } catch (error) {
        console.error("API Error in /api/v1/find-cheapest-instance:", error);
        // Avoid leaking detailed internal errors in production, but useful for debugging now
        res.status(500).json({ error: 'Internal Server Error', details: error.message }); 
    }
});

// --- API Endpoint for Provisioning VMs ---
app.post('/api/v1/provision-vm', async (req, res) => {
    console.log("Received request on /api/v1/provision-vm");
    const vmDetails = req.body;

    // --- Basic Validation ---
    if (!vmDetails) {
        return res.status(400).json({ error: 'Request body is missing.' });
    }
    if (!vmDetails.provider || (vmDetails.provider !== 'AWS' && vmDetails.provider !== 'GCP')) {
        return res.status(400).json({ error: 'Missing or invalid required field: provider (must be \'AWS\' or \'GCP\')' });
    }
    if (!vmDetails.instance_type) {
        return res.status(400).json({ error: 'Missing required field: instance_type' });
    }
    if (!vmDetails.osImage) {
        return res.status(400).json({ error: 'Missing required field: osImage (e.g., "ubuntu-22.04")' });
    }
    if (vmDetails.storage_type && typeof vmDetails.storage_type !== 'string') {
        return res.status(400).json({ error: 'Invalid field type: storage_type (must be a string)' });
    }
    if (vmDetails.pricingModel && !["OnDemand", "Spot"].includes(vmDetails.pricingModel)) {
        return res.status(400).json({ error: 'Invalid field value: pricingModel (must be "OnDemand" or "Spot")' });
    }

    // Provider-specific location and security fields
    if (vmDetails.provider === 'AWS') {
        if (!vmDetails.region) {
            return res.status(400).json({ error: 'Missing required field for AWS: region' });
        }
        if (vmDetails.instanceName && typeof vmDetails.instanceName !== 'string') {
            return res.status(400).json({ error: 'Invalid field type for AWS: instanceName (must be a string)'});
        }
        // Optional: security_group_ids for AWS
        if (vmDetails.security_group_ids && (!Array.isArray(vmDetails.security_group_ids) || !vmDetails.security_group_ids.every(sg => typeof sg === 'string'))) {
            return res.status(400).json({ error: 'Invalid field type for AWS: security_group_ids (must be an array of strings)' });
        }
    } else if (vmDetails.provider === 'GCP') {
        if (!vmDetails.zone) {
            return res.status(400).json({ error: 'Missing required field for GCP: zone' });
        }
        // Optional: network_tags for GCP
        if (vmDetails.network_tags && (!Array.isArray(vmDetails.network_tags) || !vmDetails.network_tags.every(tag => typeof tag === 'string'))) {
            return res.status(400).json({ error: 'Invalid field type for GCP: network_tags (must be an array of strings)' });
        }
    }

    console.log("Request VM Details (Validated with security features):", vmDetails);

    try {
        let provisionResult;
        if (vmDetails.provider === 'AWS') {
            // Pass security_group_ids to provisionAwsVm
            provisionResult = await provisionAwsVm(vmDetails); // vmDetails will now contain security_group_ids if provided
        } else if (vmDetails.provider === 'GCP') {
            // Pass network_tags to provisionGcpVm
            provisionResult = await provisionGcpVm(vmDetails); // vmDetails will now contain network_tags if provided
        }

        if (provisionResult && provisionResult.success) {
            res.status(202).json(provisionResult); // 202 Accepted, as provisioning can be async
        } else {
            res.status(400).json({ error: 'VM provisioning failed', details: provisionResult ? provisionResult.error : 'Unknown error', diagnostic: provisionResult });
        }
    } catch (error) {
        console.error("API Error in /api/v1/provision-vm:", error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message }); 
    }
});

// --- API Endpoint for Listing Instances ---
app.get('/api/v1/instances', async (req, res) => {
    console.log("Received request on /api/v1/instances");
    const providerFilter = req.query.provider ? req.query.provider.toUpperCase() : null;
    const statusFilter = req.query.status ? req.query.status.toLowerCase() : null;

    try {
        const { listAwsInstances, listGcpInstances } = require('./vm_allocation_engine/vm_provisioner');
        
        let awsResponse = { success: true, instances: [] }; // Default to success with empty instances
        let gcpResponse = { success: true, instances: [] }; // Default to success with empty instances

        if (providerFilter === 'AWS') {
            awsResponse = await listAwsInstances({ statusFilter }); // Pass statusFilter
        } else if (providerFilter === 'GCP') {
            gcpResponse = await listGcpInstances({ statusFilter }); // Pass statusFilter
        } else if (!providerFilter) {
            awsResponse = await listAwsInstances({ statusFilter }); // Pass statusFilter
            gcpResponse = await listGcpInstances({ statusFilter }); // Pass statusFilter
        } else {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid provider specified. Must be 'AWS', 'GCP', or omitted for all." 
            });
        }

        const allInstances = [];
        let awsMessage = null;
        let gcpMessage = null;

        if (awsResponse && awsResponse.success && Array.isArray(awsResponse.instances)) {
            allInstances.push(...awsResponse.instances);
        }
        if (awsResponse && awsResponse.message) {
            awsMessage = awsResponse.message;
        }

        if (gcpResponse && gcpResponse.success && Array.isArray(gcpResponse.instances)) {
            allInstances.push(...gcpResponse.instances);
        }
        if (gcpResponse && gcpResponse.message) {
            gcpMessage = gcpResponse.message;
        }

        const overallSuccess = (awsResponse && awsResponse.success) || (gcpResponse && gcpResponse.success);
        let responseMessage = null;

        if (providerFilter === 'AWS' && awsMessage) {
            responseMessage = awsMessage;
        } else if (providerFilter === 'GCP' && gcpMessage) {
            responseMessage = gcpMessage;
        } else if (!providerFilter) { // Combined messages if no provider filter
            if (awsMessage && gcpMessage && awsMessage !== gcpMessage) {
                responseMessage = `AWS: ${awsMessage} GCP: ${gcpMessage}`;
            } else {
                responseMessage = awsMessage || gcpMessage;
            }
        }

        res.json({
            success: overallSuccess || allInstances.length > 0, 
            instances: allInstances,
            ...(responseMessage && { message: responseMessage }), // Add message if it exists
            ...( (!awsResponse || !awsResponse.success) && providerFilter !== 'GCP' && { awsError: awsResponse.error || 'Failed to list AWS instances' } ),
            ...( (!gcpResponse || !gcpResponse.success) && providerFilter !== 'AWS' && { gcpError: gcpResponse.error || 'Failed to list GCP instances' } )
        });

    } catch (error) {
        console.error("API Error in /api/v1/instances:", error);
        res.status(500).json({ success: false, message: "Failed to list instances", error: error.message });
    }
});

// --- API Endpoint for Creating Security Features (AWS SG / GCP Firewall) ---
app.post('/api/v1/create-security-feature', async (req, res) => {
    console.log("Received request on /api/v1/create-security-feature");
    // Added ingressRules and egressRules for AWS
    const { provider, name, description, region, rules, ingressRules, egressRules, networkName, sourceRanges, targetTags, priority } = req.body;

    if (!provider || (provider !== 'AWS' && provider !== 'GCP')) {
        return res.status(400).json({ error: 'Missing or invalid required field: provider (must be \'AWS\' or \'GCP\')' });
    }
    if (!name) {
        return res.status(400).json({ error: 'Missing required field: name (groupName for AWS, firewallName for GCP)' });
    }
    if (!description) {
        return res.status(400).json({ error: 'Missing required field: description' });
    }
    if (!rules && !ingressRules && !egressRules) {
        return res.status(400).json({ error: 'Missing or invalid required field: rules, ingressRules, or egressRules (must be present)' });
    }

    // For AWS, 'rules' is deprecated in favor of 'ingressRules'. Handle for backward compatibility or ask user to update.
    // We will prioritize ingressRules if present, otherwise use rules for ingress.
    const actualIngressRules = provider === 'AWS' ? (ingressRules || rules || []) : (rules || []);
    const actualEgressRules = provider === 'AWS' ? (egressRules || []) : [];

    if ((provider === 'AWS') && (!Array.isArray(actualIngressRules) || !Array.isArray(actualEgressRules))) {
        return res.status(400).json({ error: 'For AWS, ingressRules and egressRules must be arrays.' });
    }
    if ((provider === 'GCP') && (!Array.isArray(actualIngressRules) || actualIngressRules.length === 0)) {
         return res.status(400).json({ error: 'Missing or invalid required field for GCP: rules (must be a non-empty array for allowedRules)' });
    }
    // If it was a generic 'rules' field for AWS and ingressRules is not present, then actualIngressRules has it.
    // If rules and ingressRules are both present for AWS, ingressRules takes precedence.

    try {
        let result;
        if (provider === 'AWS') {
            if (!region) {
                return res.status(400).json({ error: 'Missing required field for AWS: region' });
            }

            const validateAwsRules = (rulesToValidate, ruleType) => {
                for (const rule of rulesToValidate) {
                    if (typeof rule.protocol !== 'string' || typeof rule.fromPort !== 'number' || typeof rule.toPort !== 'number') {
                        return `Invalid AWS ${ruleType} rule structure. Each rule must have protocol (string), fromPort (number), toPort (number).`;
                    }
                    if (rule.cidrIp && typeof rule.cidrIp !== 'string') {
                        return `Invalid AWS ${ruleType} rule: cidrIp must be a string.`;
                    }
                    if (rule.cidrIpv6 && typeof rule.cidrIpv6 !== 'string') {
                        return `Invalid AWS ${ruleType} rule: cidrIpv6 must be a string.`;
                    }
                    if (rule.description && typeof rule.description !== 'string') {
                        return `Invalid AWS ${ruleType} rule: description must be a string.`;
                    }
                    if (!rule.cidrIp && !rule.cidrIpv6 && !rule.sourceSecurityGroupId) { // Added check for sourceSecurityGroupId
                        return `Invalid AWS ${ruleType} rule: Each rule must have at least cidrIp, cidrIpv6, or sourceSecurityGroupId.`;
                    }
                }
                return null; // No error
            };

            let validationError = validateAwsRules(actualIngressRules, 'ingress');
            if (validationError) return res.status(400).json({ error: validationError });
            
            validationError = validateAwsRules(actualEgressRules, 'egress');
            if (validationError) return res.status(400).json({ error: validationError });
            
            result = await createAwsSecurityGroup({ 
                groupName: name, 
                description, 
                region, 
                ingressRules: actualIngressRules, 
                egressRules: actualEgressRules 
            });
        } else if (provider === 'GCP') {
            if (!targetTags || !Array.isArray(targetTags) || targetTags.length === 0) {
                 return res.status(400).json({ error: 'Missing required field for GCP: targetTags (must be a non-empty array of strings)' });
            }
            // Validate GCP rules structure (which are currently only ingress)
            for (const rule of actualIngressRules) { // GCP uses actualIngressRules for its 'allowed' rules
                if (typeof rule.IPProtocol !== 'string' || !Array.isArray(rule.ports) || rule.ports.length === 0) {
                    return res.status(400).json({ error: 'Invalid GCP rule structure. Each rule must have IPProtocol (string) and ports (non-empty array of strings).' });
                }
            }
            result = await createGcpFirewallRule({
                firewallName: name,
                description,
                networkName, 
                allowedRules: actualIngressRules, 
                sourceRanges,    
                targetTags,
                priority         
            });
        }

        if (result && result.success) {
            res.status(201).json(result); // 201 Created
        } else {
            res.status(400).json({ error: `Failed to create security feature for ${provider}`, details: result ? result.error : 'Unknown error', diagnostic: result });
        }
    } catch (error) {
        console.error("API Error in /api/v1/create-security-feature:", error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

// --- API Endpoint for Modifying AWS Security Group Rules ---
app.patch('/api/v1/aws/security-groups/:groupId/rules', async (req, res) => {
    const { groupId } = req.params;
    const { region, authorize, revoke } = req.body;

    if (!region) {
        return res.status(400).json({ error: 'Missing required field in body: region' });
    }
    if ((!authorize || !Array.isArray(authorize)) && (!revoke || !Array.isArray(revoke))) {
        return res.status(400).json({ error: 'Request body must contain at least one of "authorize" or "revoke" arrays.' });
    }

    let authorizedRuleDetails = [];
    let revocationResult = { success: true, revokedCount: 0, errors: [] };
    const errors = [];
    let overallSuccess = true;

    try {
        const awsCredentials = await credentialsManager.loadAwsCredentials(); // Ensure this is accessible or pass client
        const ec2Client = new EC2Client({ region: region, credentials: awsCredentials });

        // Authorize new rules if requested
        if (authorize && authorize.length > 0) {
            const ingressToAuth = authorize.filter(rule => !rule.isEgress);
            const egressToAuth = authorize.filter(rule => rule.isEgress);

            // Validate rules before sending to authorization function
            const validateAwsRuleSpec = (ruleSpec, type) => {
                 if (typeof ruleSpec.protocol !== 'string' || typeof ruleSpec.fromPort !== 'number' || typeof ruleSpec.toPort !== 'number') {
                    return `Invalid AWS ${type} rule structure. Each rule must have protocol (string), fromPort (number), toPort (number).`;
                }
                if (!ruleSpec.cidrIp && !ruleSpec.cidrIpv6 && !ruleSpec.sourceSecurityGroupId) {
                    return `Invalid AWS ${type} rule: Each rule must have at least cidrIp, cidrIpv6, or sourceSecurityGroupId.`;
                }
                return null;
            };

            for (const rule of ingressToAuth) {
                const error = validateAwsRuleSpec(rule, 'authorize ingress');
                if (error) errors.push(error);
            }
            for (const rule of egressToAuth) {
                const error = validateAwsRuleSpec(rule, 'authorize egress');
                if (error) errors.push(error);
            }

            if (errors.length > 0) {
                return res.status(400).json({ error: "Validation failed for rules to authorize.", details: errors });
            }
            
            if (ingressToAuth.length > 0) {
                const ingressResults = await authorizeMoreAwsRules(ec2Client, groupId, ingressToAuth, false, ingressToAuth);
                authorizedRuleDetails.push(...ingressResults);
            }
            if (egressToAuth.length > 0) {
                const egressResults = await authorizeMoreAwsRules(ec2Client, groupId, egressToAuth, true, egressToAuth);
                authorizedRuleDetails.push(...egressResults);
            }
            console.log(`[API] Authorized rules for SG ${groupId}:`, authorizedRuleDetails);
        }

        // Revoke rules if requested
        if (revoke && revoke.length > 0) {
            // Basic validation for revoke rules
            for (const rule of revoke) {
                if (typeof rule !== 'object' || rule === null || typeof rule.isEgress !== 'boolean') {
                    errors.push('Invalid revoke rule: Each item in revoke array must be an object with an isEgress boolean property.');
                    continue;
                }
                if (!rule.securityGroupRuleId && (!rule.protocol || typeof rule.fromPort !== 'number' || typeof rule.toPort !== 'number')) {
                     errors.push('Invalid revoke rule spec: Must provide securityGroupRuleId or full rule properties (protocol, fromPort, toPort, etc.).');
                }
            }
            if (errors.length > 0) {
                 return res.status(400).json({ error: "Validation failed for rules to revoke.", details: errors });
            }

            const revokeResultInternal = await revokeAwsSecurityGroupRules({ groupId, region, rulesToRevoke: revoke });
            revocationResult.revokedCount = revokeResultInternal.revokedCount || 0;
            if (!revokeResultInternal.success) {
                overallSuccess = false;
                revocationResult.success = false;
                const errMsg = revokeResultInternal.error || 'Failed to revoke some rules.';
                errors.push(errMsg);
                if(revokeResultInternal.details) errors.push(JSON.stringify(revokeResultInternal.details));
                console.error(`[API] Error revoking rules for SG ${groupId}:`, errMsg, revokeResultInternal.details);
            } else {
                console.log(`[API] Revoked ${revocationResult.revokedCount} rules for SG ${groupId}.`);
            }
        }

        if (!overallSuccess || errors.length > 0) {
             return res.status(errors.some(e => e.includes("Validation failed")) ? 400 : 500).json({
                message: "Completed modification request with one or more errors.",
                authorizedRules: authorizedRuleDetails,
                revocationStatus: revocationResult,
                errors: errors
            });
        }

        res.status(200).json({
            message: "Security group rules modified successfully.",
            groupId: groupId,
            authorizedRules: authorizedRuleDetails,
            revokedRulesCount: revocationResult.revokedCount
        });

    } catch (error) {
        console.error(`API Error in PATCH /aws/security-groups/${groupId}/rules:`, error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

// --- API Endpoint for Deleting VMs ---
app.delete('/api/v1/delete-vm', async (req, res) => {
    console.log("Received request on /api/v1/delete-vm");
    const { provider, instance_id, region, key_name, instance_name, zone } = req.body;

    // Basic Validation
    if (!provider || (provider.toUpperCase() !== 'AWS' && provider.toUpperCase() !== 'GCP')) {
        return res.status(400).json({ error: 'Missing or invalid required field: provider (must be \'AWS\' or \'GCP\')' });
    }

    try {
        let deleteResult;
        if (provider.toUpperCase() === 'AWS') {
            if (!instance_id) {
                return res.status(400).json({ error: 'Missing required field for AWS: instance_id' });
            }
            if (!region) {
                return res.status(400).json({ error: 'Missing required field for AWS: region' });
            }
            if (!key_name) {
                return res.status(400).json({ error: 'Missing required field for AWS: key_name (the EC2 Key Pair name)' });
            }
            console.log(`Attempting to delete AWS VM. Instance ID: ${instance_id}, Region: ${region}, Key Name: ${key_name}`);
            deleteResult = await deleteAwsVm({ instanceId: instance_id, region, keyName: key_name });
        } else if (provider.toUpperCase() === 'GCP') {
            if (!instance_name) { // GCP uses instance name for deletion
                return res.status(400).json({ error: 'Missing required field for GCP: instance_name' });
            }
            if (!zone) {
                return res.status(400).json({ error: 'Missing required field for GCP: zone' });
            }
            
            const gcpCredentials = await credentialsManager.loadGcpCredentials();
            if (!gcpCredentials || !gcpCredentials.project_id) {
                console.error("[Server] GCP project_id not found in credentials for deletion.");
                return res.status(500).json({ error: "Configuration error: GCP project_id not found." });
            }
            const projectIdToUse = gcpCredentials.project_id;
            console.log(`Attempting to delete GCP VM. Instance Name: ${instance_name}, Zone: ${zone}, Project ID: ${projectIdToUse}`);
            // For GCP, deleteGcpVm expects `instanceId` to be the instance *name*.
            deleteResult = await deleteGcpVm({ instanceId: instance_name, zone, projectId: projectIdToUse });
        }

        if (deleteResult && deleteResult.success) {
            res.status(200).json(deleteResult); // 200 OK for successful deletion or initiation
        } else {
            // Log the full diagnostic detail on the server for debugging
            console.error("VM deletion failed. Diagnostic info:", deleteResult);
            // Send a more structured error to the client
            res.status(deleteResult && deleteResult.gcpDetails && deleteResult.gcpDetails.code === 5 ? 404 : deleteResult && deleteResult.awsDetails && (deleteResult.awsDetails.code === 'InvalidInstanceID.NotFound' || deleteResult.awsDetails.code === 'InvalidKeyPair.NotFound') ? 404 : 400)
               .json({ 
                   error: 'VM deletion failed', 
                   details: deleteResult ? deleteResult.message : 'Unknown error', 
                   providerDetails: deleteResult ? (deleteResult.awsDetails || deleteResult.gcpDetails) : null 
                });
        }
    } catch (error) {
        console.error("API Error in /api/v1/delete-vm:", error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message }); 
    }
});

// --- API Endpoint for Modifying VM Storage (Root/Boot Disk) ---
app.patch('/api/v1/vm-storage', async (req, res) => {
    console.log("Received request on /api/v1/vm-storage");
    const { provider, instance_id, region, instance_name, zone, new_size_gb, new_storage_type } = req.body;

    if (!provider || (provider.toUpperCase() !== 'AWS' && provider.toUpperCase() !== 'GCP')) {
        return res.status(400).json({ error: 'Missing or invalid required field: provider (must be \'AWS\' or \'GCP\')' });
    }
    if (!new_size_gb && (provider.toUpperCase() === 'GCP' || !new_storage_type)) {
         return res.status(400).json({ error: 'Missing required field: new_size_gb is required. For AWS, new_storage_type can also be provided.' });
    }
    if (new_size_gb && (typeof new_size_gb !== 'number' || new_size_gb <= 0)) {
        return res.status(400).json({ error: 'Invalid field: new_size_gb must be a positive number.' });
    }
    if (new_storage_type && typeof new_storage_type !== 'string') {
        return res.status(400).json({ error: 'Invalid field: new_storage_type must be a string.' });
    }

    try {
        let result;
        if (provider.toUpperCase() === 'AWS') {
            if (!instance_id || !region) {
                return res.status(400).json({ error: 'Missing required fields for AWS: instance_id, region.' });
            }
            if (!new_size_gb && !new_storage_type) {
                 return res.status(400).json({ error: 'For AWS, at least new_size_gb or new_storage_type must be provided.' });
            }
            console.log(`Attempting to modify AWS VM storage. Instance ID: ${instance_id}, Region: ${region}, New Size: ${new_size_gb}GB, New Type: ${new_storage_type}`);
            result = await modifyAwsRootVolume({ instanceId: instance_id, region, newSizeGb: new_size_gb, newStorageType: new_storage_type });
        
        } else if (provider.toUpperCase() === 'GCP') {
            if (!instance_name || !zone) {
                return res.status(400).json({ error: 'Missing required fields for GCP: instance_name, zone.' });
            }
            if (!new_size_gb) {
                return res.status(400).json({ error: 'Missing required field for GCP: new_size_gb.' });
            }
            if (new_storage_type){
                 return res.status(400).json({ error: 'Modifying storage type for GCP disks is not supported in this version. Only new_size_gb is allowed.' });
            }

            const gcpCredentials = await credentialsManager.loadGcpCredentials();
            if (!gcpCredentials || !gcpCredentials.project_id) {
                console.error("[Server] GCP project_id not found in credentials for storage modification.");
                return res.status(500).json({ error: "Configuration error: GCP project_id not found." });
            }
            const projectIdToUse = gcpCredentials.project_id;
            console.log(`Attempting to modify GCP VM storage. Instance Name: ${instance_name}, Zone: ${zone}, Project ID: ${projectIdToUse}, New Size: ${new_size_gb}GB`);
            result = await modifyGcpBootDisk({ instanceName: instance_name, zone, projectId: projectIdToUse, newSizeGb: new_size_gb });
        }

        if (result && result.success) {
            // If GCP modification has a special note about DisksClient, include it
            let responseMessage = result.message;
            if (result.requiresDisksClient) {
                responseMessage = result.message + " (Note: Full GCP disk resize implementation requires DisksClient integration in vm_provisioner.js)";
            }
            res.status(200).json({ ...result, message: responseMessage });
        } else {
            console.error("VM storage modification failed. Diagnostic info:", result);
            const statusCode = result && result.error === "Instance Not Stopped" ? 409 : 400; // 409 Conflict if instance needs to be stopped
            res.status(statusCode).json({ 
                error: 'VM storage modification failed',
                details: result ? result.message : 'Unknown error',
                providerDetails: result ? (result.awsDetails || result.gcpDetails) : null,
                currentState: result ? result.currentState : null
            });
        }
    } catch (error) {
        console.error("API Error in /api/v1/vm-storage:", error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message }); 
    }
});

// --- API Endpoint for Stopping an Instance ---
app.post('/api/v1/instances/:instanceId/stop/:provider', async (req, res) => {
    const { instanceId, provider: providerFromPath } = req.params; 
    const { region, zone, projectId } = req.query; // Get from query

    const provider = providerFromPath.toUpperCase();

    console.log(`Received request to stop instance ${instanceId} for provider ${provider}`);
    console.log(`Query params: region=${region}, zone=${zone}, projectId=${projectId}`);

    if (provider !== 'AWS' && provider !== 'GCP') {
        return res.status(400).json({ error: 'Invalid provider in URL. Must be \'AWS\' or \'GCP\'.' });
    }

    try {
        let result;
        if (provider === 'AWS') {
            if (!region) {
                return res.status(400).json({ error: 'Missing required query parameter for AWS: region' });
            }
            result = await stopAwsInstance({ instanceId, region });
        } else { // GCP
            if (!zone || !projectId) {
                return res.status(400).json({ error: 'Missing required query parameters for GCP: zone, projectId' });
            }
            // For GCP, instanceId from path is used as instanceName
            result = await stopGcpInstance({ instanceName: instanceId, zone, projectId });
        }

        if (result && result.success) {
            res.status(200).json(result);
        } else {
            console.error("Instance stop failed. Diagnostic info:", result);
            const statusCode = (result?.awsDetails?.code === 'InvalidInstanceID.NotFound' || result?.gcpDetails?.code === 5) ? 404 : 400;
            res.status(statusCode).json({ 
                error: 'Instance stop operation failed',
                details: result ? result.message : 'Unknown error',
                providerDetails: result ? (result.awsDetails || result.gcpDetails) : null 
            });
        }
    } catch (error) {
        console.error(`API Error in /api/v1/instances/${instanceId}/stop/${provider}:`, error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message }); 
    }
});

// --- Start the server ---
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
}); 