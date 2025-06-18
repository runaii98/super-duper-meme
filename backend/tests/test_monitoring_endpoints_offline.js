/**
 * API Endpoint Tester
 * 
 * This script tests each API endpoint in the system to determine which ones are working.
 * It makes offline checks by verifying that the routes and handlers exist without making actual API calls.
 */

const fs = require('fs');
const path = require('path');
const express = require('express');

// Create a test app
const app = express();

// Function to check if all required route files exist
function checkRouteFilesExist() {
  console.log('\n=== CHECKING ROUTE FILES ===');
  
  const routeFiles = [
    { path: 'main_server/routes/instance_info_routes.js', name: 'Instance Info Routes' },
    { path: 'main_server/routes/monitoring_routes.js', name: 'Monitoring Routes' },
    { path: 'main_server/routes/auth.js', name: 'Authentication Routes' }
  ];
  
  let allExist = true;
  
  routeFiles.forEach(file => {
    try {
      fs.accessSync(file.path, fs.constants.F_OK);
      console.log(`✅ ${file.name} file exists: ${file.path}`);
    } catch (err) {
      console.log(`❌ ${file.name} file is missing: ${file.path}`);
      allExist = false;
    }
  });
  
  return allExist;
}

// Function to check if required service files exist
function checkServiceFilesExist() {
  console.log('\n=== CHECKING SERVICE FILES ===');
  
  const serviceFiles = [
    { path: 'main_server/services/instance_info_service.js', name: 'Instance Info Service' },
    { path: 'main_server/services/monitoring_service.js', name: 'Monitoring Service' }
  ];
  
  let allExist = true;
  
  serviceFiles.forEach(file => {
    try {
      fs.accessSync(file.path, fs.constants.F_OK);
      console.log(`✅ ${file.name} file exists: ${file.path}`);
    } catch (err) {
      console.log(`❌ ${file.name} file is missing: ${file.path}`);
      allExist = false;
    }
  });
  
  return allExist;
}

// Function to verify route handlers by loading the route files
function verifyRouteHandlers() {
  console.log('\n=== VERIFYING ROUTE HANDLERS ===');
  
  const results = {
    instanceInfoRoutes: { exists: false, endpoints: [] },
    monitoringRoutes: { exists: false, endpoints: [] },
    authRoutes: { exists: false, endpoints: [] }
  };
  
  // Test Instance Info Routes
  try {
    const instanceInfoRoutes = require('./main_server/routes/instance_info_routes');
    results.instanceInfoRoutes.exists = true;
    
    // Collect all route definitions by analyzing the router's stack
    if (instanceInfoRoutes.stack) {
      results.instanceInfoRoutes.endpoints = instanceInfoRoutes.stack
        .filter(layer => layer.route)
        .map(layer => {
          return {
            path: layer.route.path,
            method: Object.keys(layer.route.methods)[0].toUpperCase(),
            status: '✅ Defined'
          };
        });
    } else {
      console.log('❌ Cannot inspect instance_info_routes endpoints - router stack not accessible');
    }
    
    console.log('✅ Instance Info Routes loaded successfully');
  } catch (err) {
    console.log('❌ Failed to load Instance Info Routes:', err.message);
  }
  
  // Test Monitoring Routes
  try {
    const monitoringRoutes = require('./main_server/routes/monitoring_routes');
    results.monitoringRoutes.exists = true;
    
    // Collect all route definitions
    if (monitoringRoutes.stack) {
      results.monitoringRoutes.endpoints = monitoringRoutes.stack
        .filter(layer => layer.route)
        .map(layer => {
          return {
            path: layer.route.path,
            method: Object.keys(layer.route.methods)[0].toUpperCase(),
            status: '✅ Defined'
          };
        });
    } else {
      console.log('❌ Cannot inspect monitoring_routes endpoints - router stack not accessible');
    }
    
    console.log('✅ Monitoring Routes loaded successfully');
  } catch (err) {
    console.log('❌ Failed to load Monitoring Routes:', err.message);
  }
  
  // Test Auth Routes
  try {
    const authRoutes = require('./main_server/routes/auth');
    results.authRoutes.exists = true;
    
    // Collect all route definitions
    if (authRoutes.stack) {
      results.authRoutes.endpoints = authRoutes.stack
        .filter(layer => layer.route)
        .map(layer => {
          return {
            path: layer.route.path,
            method: Object.keys(layer.route.methods)[0].toUpperCase(),
            status: '✅ Defined'
          };
        });
    } else {
      console.log('❌ Cannot inspect auth routes endpoints - router stack not accessible');
    }
    
    console.log('✅ Auth Routes loaded successfully');
  } catch (err) {
    console.log('❌ Failed to load Auth Routes:', err.message);
  }
  
  return results;
}

// Function to check for VM provisioning API endpoint
function checkProvisioningAPI() {
  console.log('\n=== CHECKING VM PROVISIONING API ===');
  
  // Look for files that might contain the provision-vm endpoint
  const possibleFiles = [
    'main_server/routes/vm_routes.js',
    'main_server/routes/provision_routes.js',
    'main_server/routes/instance_routes.js'
  ];
  
  let found = false;
  
  for (const filePath of possibleFiles) {
    try {
      fs.accessSync(filePath, fs.constants.F_OK);
      console.log(`✅ Found potential VM provisioning route file: ${filePath}`);
      found = true;
      
      // Try to read the file to check for provision-vm endpoint
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('provision-vm') || content.includes('provisionVm')) {
        console.log(`✅ File ${filePath} contains VM provisioning endpoint code`);
      } else {
        console.log(`❓ File ${filePath} exists but may not contain VM provisioning endpoint`);
      }
      
    } catch (err) {
      // File doesn't exist, which is expected for most of these
    }
  }
  
  if (!found) {
    console.log('❓ Could not find dedicated VM provisioning route file');
    console.log('Checking main app file for direct route definitions...');
    
    // Check server.js or app.js for direct route definitions
    const mainAppFiles = ['server.js', 'app.js', 'index.js', 'main_server/server.js'];
    
    for (const filePath of mainAppFiles) {
      try {
        fs.accessSync(filePath, fs.constants.F_OK);
        console.log(`✅ Found main app file: ${filePath}`);
        
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('provision-vm') || content.includes('provisionVm')) {
          console.log(`✅ File ${filePath} contains VM provisioning endpoint code`);
          found = true;
        }
        
      } catch (err) {
        // File doesn't exist, try next one
      }
    }
  }
  
  if (!found) {
    console.log('❓ Could not automatically detect VM provisioning API implementation');
    console.log('Manual verification required for POST /api/v1/provision-vm endpoint');
  }
  
  return found;
}

// Function to generate a report of all endpoints
function generateEndpointReport(routeResults) {
  console.log('\n=== API ENDPOINT STATUS REPORT ===');
  
  // Instance Info Endpoints
  console.log('\n## Instance Information APIs');
  if (routeResults.instanceInfoRoutes.exists) {
    if (routeResults.instanceInfoRoutes.endpoints.length > 0) {
      routeResults.instanceInfoRoutes.endpoints.forEach(endpoint => {
        console.log(`${endpoint.status} ${endpoint.method} /api/v1/instances${endpoint.path}`);
      });
    } else {
      console.log('❓ Could not determine endpoints - manual check required');
      // Manually list expected endpoints based on API_Implemented.md
      console.log('Expected endpoints:');
      console.log('- GET /api/v1/instances/:instanceId');
      console.log('- GET /api/v1/instances/:instanceId/console-output');
      console.log('- GET /api/v1/instances/:instanceId/metrics');
      console.log('- GET /api/v1/instances/:instanceId/log-groups/:logGroupName/streams');
    }
  } else {
    console.log('❌ Instance Info Routes not loaded');
  }
  
  // Monitoring Endpoints
  console.log('\n## Monitoring APIs');
  if (routeResults.monitoringRoutes.exists) {
    if (routeResults.monitoringRoutes.endpoints.length > 0) {
      routeResults.monitoringRoutes.endpoints.forEach(endpoint => {
        console.log(`${endpoint.status} ${endpoint.method} /api/v1/monitoring${endpoint.path}`);
      });
    } else {
      console.log('❓ Could not determine endpoints - manual check required');
      // Manually list expected endpoints based on API_Implemented.md
      console.log('Expected endpoints:');
      console.log('- POST /api/v1/monitoring/instances/:instanceId/configure');
      console.log('- GET /api/v1/monitoring/instances/:instanceId/agent-status');
    }
  } else {
    console.log('❌ Monitoring Routes not loaded');
  }
  
  // Auth Endpoints
  console.log('\n## Authentication APIs');
  if (routeResults.authRoutes.exists) {
    if (routeResults.authRoutes.endpoints.length > 0) {
      routeResults.authRoutes.endpoints.forEach(endpoint => {
        console.log(`${endpoint.status} ${endpoint.method} /api/v1/auth${endpoint.path}`);
      });
    } else {
      console.log('❓ Could not determine endpoints - manual check required');
      // Manually list expected endpoints based on API_Implemented.md
      console.log('Expected endpoints:');
      console.log('- POST /api/v1/auth/signup');
      console.log('- POST /api/v1/auth/login');
    }
  } else {
    console.log('❌ Auth Routes not loaded');
  }
  
  // VM Provisioning API (from previous conversation)
  console.log('\n## VM Provisioning API');
  console.log('Expected endpoint:');
  console.log('- POST /api/v1/provision-vm (Status unknown - needs verification)');
}

// Run the tests
console.log('==================================================');
console.log('API ENDPOINT TESTING - OFFLINE CHECK');
console.log('==================================================');

const routeFilesExist = checkRouteFilesExist();
const serviceFilesExist = checkServiceFilesExist();
const routeResults = verifyRouteHandlers();
const provisioningApiExists = checkProvisioningAPI();
generateEndpointReport(routeResults);

console.log('\n==================================================');
console.log('TESTING COMPLETE');
console.log('==================================================');

console.log('\nNext Steps:');
console.log('1. For fully working endpoints, all required files should exist and routes should be defined.');
console.log('2. For online testing, use Postman to make actual API calls to each endpoint.');
console.log('3. For any endpoints marked with issues, check the corresponding route and service files.');
console.log('\nNote: This script only verifies that the route definitions exist. It does not test actual functionality or make API calls.');
