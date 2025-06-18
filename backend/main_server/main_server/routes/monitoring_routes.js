const express = require('express');
const router = express.Router();
const monitoringService = require('../services/monitoring_service');

// Middleware for consistent async error handling
const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// POST /api/v1/monitoring/instances/:instanceId/configure
router.post('/instances/:instanceId/configure', asyncHandler(async (req, res) => {
    const { instanceId } = req.params;
    const { provider, region, agentConfiguration } = req.body;

    if (!provider || !region || !agentConfiguration) {
        return res.status(400).json({ 
            error: 'Missing required fields in body. provider, region, and agentConfiguration are required.' 
        });
    }

    // Basic validation for agentConfiguration structure (can be more detailed)
    if (typeof agentConfiguration !== 'object' || agentConfiguration === null) {
        return res.status(400).json({ error: 'agentConfiguration must be a valid JSON object.' });
    }
    if (provider.toLowerCase() === 'aws' && (!agentConfiguration.agent || !agentConfiguration.metrics)) {
        // Rudimentary check for common CloudWatch Agent top-level keys
        // console.warn("Warning: AWS agentConfiguration might be missing expected keys like 'agent' or 'metrics'. Proceeding...");
        // You might add more strict validation depending on requirements
    }
    // Add similar basic validation for GCP if needed when implemented

    try {
        const result = await monitoringService.configureAgent(instanceId, provider, region, agentConfiguration);

        if (result.success) {
            res.status(202).json({ // 202 Accepted as SSM command is async
                message: result.message,
                instanceId: result.instanceId,
                commandId: result.commandId, // If AWS/SSM was used
                details: result.details
            });
        } else {
            res.status(400).json({ // Or 500 if it's a server-side failure in the service
                error: result.message || 'Failed to configure monitoring agent.',
                details: result.error ? result.error.toString() : (result.details || 'No additional details.')
            });
        }
    } catch (error) {
        console.error(`[MonitoringRoutes] Error in configureAgent: ${error.message}`);
        if (error.message && error.message.includes('GCP Project ID could not be determined')) {
            return res.status(500).json({ 
                error: 'Failed to retrieve GCP Project ID from credentials. Check credential file configuration.',
                details: error.message
            });
        }
        throw error;
    }
}));

// GET /api/v1/monitoring/instances/:instanceId/agent-status
router.get('/instances/:instanceId/agent-status', asyncHandler(async (req, res) => {
    const { instanceId } = req.params;
    const { provider, region, commandId } = req.query; // commandId is crucial for AWS SSM status. Removed projectId for GCP

    if (!provider || !region) {
        return res.status(400).json({
            error: 'Missing required query parameters. provider and region are required.'
        });
    }
    // For AWS, commandId is essential for the current implementation
    if (provider.toLowerCase() === 'aws' && !commandId) {
        return res.status(400).json({
            error: 'Missing required query parameter for AWS: commandId.'
        });
    }

    try {
        const result = await monitoringService.getAgentStatus(instanceId, provider, region, commandId);

        if (result.success) {
            res.status(200).json(result);
        } else {
            // Determine appropriate status code based on why it failed
            const statusCode = result.status === "ERROR_API_CALL" || result.message.includes("Failed to get") ? 500 : 400;
            res.status(statusCode).json({
                error: result.message || 'Failed to get agent status.',
                status: result.status,
                details: result.error ? result.error.toString() : (result.details || 'No additional details.')
            });
        }
    } catch (error) {
        console.error(`[MonitoringRoutes] Error in getAgentStatus: ${error.message}`);
        if (error.message && error.message.includes('GCP Project ID could not be determined')) {
            return res.status(500).json({ 
                error: 'Failed to retrieve GCP Project ID from credentials. Check credential file configuration.',
                details: error.message
            });
        }
        throw error;
    }
}));

// TODO: Define other routes:
// GET /instances/:instanceId/configuration
// GET /instances/:instanceId/metrics/configured
// GET /instances/:instanceId/logs/configured

// Basic error handler for this router
router.use((err, req, res, next) => {
    console.error("[MonitoringRoutes Error]", err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
});

module.exports = router; 