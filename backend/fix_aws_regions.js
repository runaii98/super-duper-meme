/**
 * AWS Regions Endpoint Fix Script
 * 
 * This script analyzes the AWS regions endpoint and provides a fix
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

async function analyzeAwsRegionsEndpoint() {
  console.log('===== Analyzing AWS Regions Endpoint =====\n');
  
  // 1. Check if the endpoint handler exists in routes
  console.log('Checking routes files...');
  const routesDir = path.join(__dirname, 'main_server', 'routes');
  
  try {
    const routeFiles = await fs.readdir(routesDir);
    console.log(`Found ${routeFiles.length} route files: ${routeFiles.join(', ')}`);
    
    // Look for the file that likely handles cloud provider routes
    const cloudProviderRouteFile = routeFiles.find(file => 
      file.includes('cloud') || file.includes('provider') || file.includes('aws')
    );
    
    if (cloudProviderRouteFile) {
      console.log(`Found potential cloud provider route file: ${cloudProviderRouteFile}`);
      
      // Read the file to analyze it
      const routeFilePath = path.join(routesDir, cloudProviderRouteFile);
      const routeFileContent = await fs.readFile(routeFilePath, 'utf8');
      
      // Check if the file has an AWS regions endpoint handler
      if (routeFileContent.includes('/regions') && routeFileContent.includes('aws')) {
        console.log('✅ File appears to have AWS regions endpoint handler');
        
        // Extract the handler function or route to check implementation
        const routeMatches = routeFileContent.match(/router\.get\(['"]\/providers\/aws\/regions['"].*?\{[\s\S]*?\}/);
        if (routeMatches) {
          console.log('Route implementation:');
          console.log(routeMatches[0]);
        } else {
          console.log('❌ Could not find the specific AWS regions route implementation');
        }
      } else {
        console.log('❌ File does not appear to have AWS regions endpoint handler');
      }
    } else {
      console.log('❌ Could not find a cloud provider route file');
    }
  } catch (error) {
    console.error('Error reading routes directory:', error.message);
  }
  
  // 2. Try to make a request to the endpoint to diagnose the issue
  console.log('\nTesting endpoint with request...');
  try {
    const response = await axios.get('http://localhost:3006/api/providers/aws/regions');
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
  } catch (error) {
    console.log('Request failed with error:', error.message);
    
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
  
  // 3. Compare with GCP regions endpoint to understand the difference
  console.log('\nComparing with GCP regions endpoint...');
  try {
    const response = await axios.get('http://localhost:3006/api/providers/gcp/regions');
    console.log('GCP regions endpoint works. Status:', response.status);
    console.log('GCP regions count:', response.data.length);
  } catch (error) {
    console.log('GCP regions request failed:', error.message);
  }
  
  // 4. Provide recommendations
  console.log('\n===== Recommendations =====');
  console.log(`
1. Implement AWS regions endpoint:
   - Ensure cloud_provider_routes.js has a route for AWS regions
   - The handler should use AWS SDK or cached data to fetch regions
   - Return regions in the same format as the GCP regions endpoint

2. If AWS regions are already implemented, check for:
   - AWS SDK errors (credentials might be invalid for this specific operation)
   - Error handling that might be hiding the actual issue
   - Ensure AWS credentials have permissions to list regions

3. Fix implementation in cloud_provider_routes.js to handle AWS regions:

   router.get('/providers/aws/regions', async (req, res) => {
     try {
       // Example implementation using AWS SDK
       const AWS = require('aws-sdk');
       const credentials = await credentialsManager.loadAwsCredentials();
       
       // Configure AWS with credentials
       AWS.config.update({
         accessKeyId: credentials.accessKeyId,
         secretAccessKey: credentials.secretAccessKey,
         region: credentials.region || 'us-east-1'
       });
       
       const ec2 = new AWS.EC2();
       const result = await ec2.describeRegions({}).promise();
       
       // Transform to match GCP regions format
       const regions = result.Regions.map(region => ({
         id: region.RegionName,
         name: region.RegionName,
         status: 'UP'
       }));
       
       res.json(regions);
     } catch (error) {
       console.error('Error fetching AWS regions:', error);
       res.status(500).json({ error: 'Failed to fetch AWS regions' });
     }
   });
  `);
}

analyzeAwsRegionsEndpoint().catch(error => {
  console.error('Script error:', error);
}); 