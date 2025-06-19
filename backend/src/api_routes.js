const express = require('express');
const { findOptimalVm } = require('./vm_allocation_engine/region_selector');
const { 
    provisionAwsVm, 
    provisionGcpVm, 
    stopAwsInstance, 
    stopGcpInstance, 
    startAwsInstance,
    startGcpInstance,
    rebootAwsInstance,
    rebootGcpInstance,
    terminateAwsInstance,
    terminateGcpInstance,
    osImageMappings 
} = require('./vm_allocation_engine/vm_provisioner');
const { 
    createAwsSnapshot,
    createGcpSnapshot,
    listAwsSnapshots,
    listGcpSnapshots,
    deleteAwsSnapshot,
    deleteGcpSnapshot
} = require('./vm_allocation_engine/snapshot_manager');
const { 
    changeAwsInstanceType, 
    changeGcpInstanceType 
} = require('./vm_allocation_engine/vm_modifier');
const { createAwsSecurityGroup, createGcpFirewallRule, authorizeMoreAwsRules, revokeAwsSecurityGroupRules } = require('./vm_allocation_engine/security_manager');
const { EC2Client } = require('@aws-sdk/client-ec2');
const credentialsManager = require('./vm_allocation_engine/credentials_manager');
const { getVmMetrics, setupAwsVmMonitoring, setupGcpVmMonitoring } = require('./vm_monitoring_manager');

// New routes
const instanceInfoRoutes = require('./routes/instance_info_routes');
const monitoringRoutes = require('./routes/monitoring_routes');
const cloudProviderRoutes = require('./routes/cloud_provider_routes');

module.exports = function(app) {
    // Register our route handlers
    app.use('/api/v1/instances', instanceInfoRoutes);
    app.use('/api/v1/monitoring', monitoringRoutes);
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

    // Basic route for testing server is up
    app.get('/', (req, res) => {
        res.send('VM Allocation Engine API is running!');
    });

    // --- API Endpoint for Finding VMs ---
    app.post('/api/v1/find-cheapest-instance', async (req, res) => {
        // ... (full implementation from server.js)
    });

    // --- API Endpoint for Provisioning VMs ---
    app.post('/api/v1/provision-vm', async (req, res) => {
        // ... (full implementation from server.js)
    });

    // --- API Endpoint for Listing Instances ---
    app.get('/api/v1/instances', async (req, res) => {
        // ... (full implementation from server.js)
    });
    
    // --- Lifecycle Endpoints ---
    app.post('/api/v1/instances/:instanceId/stop/:provider', async (req, res) => {
        // ... (full implementation from server.js)
    });
    app.post('/api/v1/instances/:instanceId/start/:provider', async (req, res) => {
        // ... (full implementation from server.js)
    });
    app.post('/api/v1/instances/:instanceId/reboot/:provider', async (req, res) => {
        // ... (full implementation from server.js)
    });
    app.delete('/api/v1/instances/:instanceId/:provider', async (req, res) => {
        // ... (full implementation from server.js)
    });

    // --- Instance Modification Endpoints ---
    app.patch('/api/v1/instances/:instanceId/change-vm-type/:provider', async (req, res) => {
        // ... (full implementation from server.js)
    });
    app.patch('/api/v1/vm-storage', async (req, res) => {
        // ... (full implementation from server.js)
    });
    
    // --- Snapshot Management Endpoints ---
    app.post('/api/v1/instances/:instanceId/snapshots/:provider', async (req, res) => {
        // ... (full implementation from server.js)
    });
    app.get('/api/v1/snapshots/:provider', async (req, res) => {
        // ... (full implementation from server.js)
    });
    app.delete('/api/v1/snapshots/:snapshotId/:provider', async (req, res) => {
        // ... (full implementation from server.js)
    });

    // --- Security Management Endpoints ---
    app.post('/api/v1/create-security-feature', async (req, res) => {
        // ... (full implementation from server.js)
    });
    app.patch('/api/v1/aws/security-groups/:groupId/rules', async (req, res) => {
        // ... (full implementation from server.js)
    });
    app.delete('/api/v1/delete-firewall-rule', async (req, res) => {
        // ... (full implementation from server.js)
    });
}; 