const express = require('express');
const router = express.Router();
const instanceInfoService = require('../services/instance_info_service');

// Middleware to handle common async logic and error responses
const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// GET /api/v1/instances/:instanceId
router.get('/:instanceId', asyncHandler(async (req, res) => {
    const { instanceId } = req.params;
    const { provider, region, zone } = req.query; // region for AWS, zone for GCP. Removed projectId
    
    let regionOrZone = provider && provider.toLowerCase() === 'aws' ? region : zone;
    if (!provider || !regionOrZone) {
        return res.status(400).json({ error: 'provider and region (for AWS) or zone (for GCP) query parameters are required.' });
    }

    try {
        const instanceDetails = await instanceInfoService.describeInstance(instanceId, provider, regionOrZone);
        if (instanceDetails) {
            res.json(instanceDetails);
        } else {
            res.status(404).json({ error: 'Instance not found or provider not supported.' });
        }
    } catch (error) {
        console.error(`[InstanceInfoRoutes] Error in describeInstance: ${error.message}`);
        // If it's a specific error about projectId being needed from the credential file, handle it
        if (error.message && error.message.includes('GCP Project ID could not be determined')) {
            return res.status(500).json({ 
                error: 'Failed to retrieve GCP Project ID from credentials. Check credential file configuration.',
                details: error.message
            });
        }
        throw error; // Let the router error handler catch other errors
    }
}));

// GET /api/v1/instances/:instanceId/console-output
router.get('/:instanceId/console-output', asyncHandler(async (req, res) => {
    const { instanceId } = req.params;
    const { provider, region, zone } = req.query; // Removed projectId

    let regionOrZone = provider && provider.toLowerCase() === 'aws' ? region : zone;
    if (!provider || !regionOrZone) {
        return res.status(400).json({ error: 'provider and region (for AWS) or zone (for GCP) query parameters are required.' });
    }

    try {
        const output = await instanceInfoService.getConsoleOutput(instanceId, provider, regionOrZone);
        if (output !== null) {
            res.type('text/plain').send(output);
        } else {
            res.status(404).json({ error: 'Console output not found, instance not found, or provider not supported.' });
        }
    } catch (error) {
        console.error(`[InstanceInfoRoutes] Error in getConsoleOutput: ${error.message}`);
        if (error.message && error.message.includes('GCP Project ID could not be determined')) {
            return res.status(500).json({ 
                error: 'Failed to retrieve GCP Project ID from credentials. Check credential file configuration.',
                details: error.message
            });
        }
        throw error;
    }
}));

// GET /api/v1/instances/:instanceId/metrics
router.get('/:instanceId/metrics', asyncHandler(async (req, res) => {
    const { instanceId } = req.params;
    // For AWS: provider, region, namespace (optional)
    // For GCP: provider, region (as zone), namespace (optional, conceptual)
    const { provider, region, zone, namespace } = req.query; // Removed projectId
    
    let effectiveRegionOrZone = provider && provider.toLowerCase() === 'aws' ? region : zone;

    if (!provider || !effectiveRegionOrZone) {
        return res.status(400).json({ error: 'provider and region (for AWS) or zone (for GCP) query parameters are required.' });
    }

    try {
        const metrics = await instanceInfoService.listMetrics(instanceId, provider, effectiveRegionOrZone, namespace);
        res.json(metrics);
    } catch (error) {
        console.error(`[InstanceInfoRoutes] Error in listMetrics: ${error.message}`);
        if (error.message && error.message.includes('GCP Project ID could not be determined')) {
            return res.status(500).json({ 
                error: 'Failed to retrieve GCP Project ID from credentials. Check credential file configuration.',
                details: error.message
            });
        }
        throw error;
    }
}));

// GET /api/v1/instances/:instanceId/log-groups/:logGroupName/streams
router.get('/:instanceId/log-groups/:logGroupName/streams', asyncHandler(async (req, res) => {
    const { instanceId, logGroupName } = req.params;
    // For AWS: provider, region
    // For GCP: provider, region (as zone)
    const { provider, region, zone } = req.query; // Removed projectId
    
    let effectiveRegionOrZone = provider && provider.toLowerCase() === 'aws' ? region : zone;

    if (!provider || !effectiveRegionOrZone) {
        return res.status(400).json({ error: 'provider and region (for AWS) or zone (for GCP) query parameters are required.' });
    }
    if (!logGroupName) { // logGroupName is a path param, so always present if route matches
        return res.status(400).json({ error: 'logGroupName path parameter is required.' });
    }

    try {
        const streams = await instanceInfoService.listLogStreams(instanceId, provider, effectiveRegionOrZone, logGroupName);
        res.json(streams);
    } catch (error) {
        console.error(`[InstanceInfoRoutes] Error in listLogStreams: ${error.message}`);
        if (error.message && error.message.includes('GCP Project ID could not be determined')) {
            return res.status(500).json({ 
                error: 'Failed to retrieve GCP Project ID from credentials. Check credential file configuration.',
                details: error.message
            });
        }
        throw error;
    }
}));

// Basic error handler for the router (add to your main app error handler for more robustness)
router.use((err, req, res, next) => {
    console.error("[InstanceInfoRoutes Error]", err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
});

module.exports = router; 