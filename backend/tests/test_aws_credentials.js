/**
 * AWS Credentials Test Script
 * 
 * This script tests AWS credentials loading and provides detailed diagnostics
 */

const fs = require('fs').promises;
const path = require('path');
const credentialsManager = require('./main_server/vm_allocation_engine/credentials_manager');

// ANSI color codes for prettier console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function testAwsCredentials() {
  console.log(`${colors.bright}${colors.blue}===== AWS Credentials Test =====\n${colors.reset}`);
  
  // 1. Check if credentials directory exists
  const credentialsDir = path.join(__dirname, 'main_server', 'credentials');
  console.log(`${colors.cyan}Checking credentials directory: ${credentialsDir}${colors.reset}`);
  
  try {
    const dirStats = await fs.stat(credentialsDir);
    if (dirStats.isDirectory()) {
      console.log(`${colors.green}✅ Credentials directory exists${colors.reset}`);
    } else {
      console.log(`${colors.red}❌ Credentials path exists but is not a directory${colors.reset}`);
      return;
    }
  } catch (error) {
    console.log(`${colors.red}❌ Credentials directory does not exist: ${error.message}${colors.reset}`);
    return;
  }
  
  // 2. List all files in credentials directory
  console.log(`\n${colors.cyan}Listing files in credentials directory:${colors.reset}`);
  let files = [];
  try {
    files = await fs.readdir(credentialsDir);
    if (files.length === 0) {
      console.log(`${colors.yellow}⚠️ Credentials directory is empty${colors.reset}`);
    } else {
      files.forEach(file => {
        console.log(`- ${file}`);
      });
      
      // Check for AWS-specific files
      const awsFiles = files.filter(file => 
        file.toLowerCase() === 'aws.json' || 
        file.toLowerCase().includes('aws') || 
        file.toLowerCase().includes('amazon')
      );
      
      if (awsFiles.length > 0) {
        console.log(`${colors.green}✅ Found ${awsFiles.length} potential AWS credential files: ${awsFiles.join(', ')}${colors.reset}`);
      } else {
        console.log(`${colors.yellow}⚠️ No obvious AWS credential files found${colors.reset}`);
      }
    }
  } catch (error) {
    console.log(`${colors.red}❌ Error listing credentials directory: ${error.message}${colors.reset}`);
  }
  
  console.log(`\n${colors.cyan}DEBUG: Found ${files.length} files in credentials directory${colors.reset}`);
  
  // 3. Try to load AWS credentials using credentials manager
  console.log(`\n${colors.cyan}Attempting to load AWS credentials using credentials manager:${colors.reset}`);
  let awsCredentials = null;
  try {
    awsCredentials = await credentialsManager.loadAwsCredentials();
    console.log(`${colors.green}✅ Successfully loaded AWS credentials${colors.reset}`);
    
    // Check credential format
    if (awsCredentials.accessKeyId && awsCredentials.secretAccessKey) {
      console.log(`${colors.green}✅ AWS credentials have correct format (accessKeyId + secretAccessKey)${colors.reset}`);
      console.log(`${colors.green}✅ Access Key ID: ${awsCredentials.accessKeyId.substring(0, 4)}...${awsCredentials.accessKeyId.substring(awsCredentials.accessKeyId.length - 4)}${colors.reset}`);
    } else {
      console.log(`${colors.yellow}⚠️ AWS credentials don't have expected format. Found keys: ${Object.keys(awsCredentials).join(', ')}${colors.reset}`);
    }
  } catch (error) {
    console.log(`${colors.red}❌ Failed to load AWS credentials: ${error.message}${colors.reset}`);
    
    // 4. Examine credential loading logic from credentials_manager.js
    console.log(`\n${colors.cyan}Examining credential loading logic:${colors.reset}`);
    try {
      // First check for aws.json
      const awsJsonFile = files.find(file => file.toLowerCase() === 'aws.json');
      if (awsJsonFile) {
        console.log(`${colors.yellow}⚠️ Found aws.json but still failed to load. Checking file content...${colors.reset}`);
        try {
          const awsFilePath = path.join(credentialsDir, awsJsonFile);
          const awsFileContent = await fs.readFile(awsFilePath, 'utf8');
          
          try {
            const parsedContent = JSON.parse(awsFileContent);
            console.log(`${colors.yellow}File parsed as valid JSON. Available keys: ${Object.keys(parsedContent).join(', ')}${colors.reset}`);
            
            if (!parsedContent.accessKeyId || !parsedContent.secretAccessKey) {
              console.log(`${colors.red}❌ Missing required AWS credential keys (accessKeyId and/or secretAccessKey)${colors.reset}`);
            }
          } catch (jsonError) {
            console.log(`${colors.red}❌ AWS credentials file contains invalid JSON: ${jsonError.message}${colors.reset}`);
          }
        } catch (readError) {
          console.log(`${colors.red}❌ Error reading AWS credentials file: ${readError.message}${colors.reset}`);
        }
      } else {
        console.log(`${colors.yellow}⚠️ No aws.json file found, checking other JSON files...${colors.reset}`);
        
        // Check other JSON files
        const jsonFiles = files.filter(file => file.endsWith('.json') && !file.toLowerCase().includes('gcp'));
        if (jsonFiles.length === 0) {
          console.log(`${colors.red}❌ No JSON files found that could contain AWS credentials${colors.reset}`);
        } else {
          console.log(`${colors.yellow}Found ${jsonFiles.length} JSON files to check: ${jsonFiles.join(', ')}${colors.reset}`);
          
          for (const file of jsonFiles) {
            console.log(`\n${colors.cyan}Checking ${file}:${colors.reset}`);
            try {
              const filePath = path.join(credentialsDir, file);
              const fileContent = await fs.readFile(filePath, 'utf8');
              
              try {
                const parsedContent = JSON.parse(fileContent);
                console.log(`- Valid JSON with keys: ${Object.keys(parsedContent).join(', ')}`);
                
                if (parsedContent.accessKeyId && parsedContent.secretAccessKey) {
                  console.log(`${colors.green}✅ File contains AWS credential format but wasn't loaded by credentials manager${colors.reset}`);
                } else if (parsedContent.type === 'service_account') {
                  console.log(`${colors.yellow}⚠️ This appears to be a GCP service account file, not AWS credentials${colors.reset}`);
                } else {
                  console.log(`${colors.yellow}⚠️ File doesn't contain expected AWS credential format${colors.reset}`);
                }
              } catch (jsonError) {
                console.log(`${colors.red}❌ File contains invalid JSON: ${jsonError.message}${colors.reset}`);
              }
            } catch (readError) {
              console.log(`${colors.red}❌ Error reading file: ${readError.message}${colors.reset}`);
            }
          }
        }
      }
    } catch (dirError) {
      console.log(`${colors.red}❌ Error reading credentials directory: ${dirError.message}${colors.reset}`);
    }
  }
  
  // 5. Test checkCredentials function
  console.log(`\n${colors.cyan}Testing checkCredentials function:${colors.reset}`);
  try {
    const credentialStatus = await credentialsManager.checkCredentials();
    console.log(`${colors.green}✅ checkCredentials completed successfully${colors.reset}`);
    console.log(`AWS available: ${credentialStatus.aws}`);
    console.log(`GCP available: ${credentialStatus.gcp}`);
    console.log(`Any provider available: ${credentialStatus.hasAnyValid}`);
  } catch (error) {
    console.log(`${colors.red}❌ checkCredentials failed: ${error.message}${colors.reset}`);
  }
  
  console.log(`\n${colors.bright}${colors.blue}===== Test Complete =====\n${colors.reset}`);
}

// Run the test
testAwsCredentials().then(() => {
  console.log('Test completed successfully');
}).catch(error => {
  console.error('Test error:', error);
}); 