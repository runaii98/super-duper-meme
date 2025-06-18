const express = require('express');
const router = express.Router();

const awsService = require('../services/aws_service');
const gcpService = require('../services/gcp_service');
const { findOptimalVm } = require('../vm_allocation_engine/region_selector');
// Import other provider services here as they are created (e.g., azureService)

// --- AWS Routes ---
router.get('/aws/regions', async (req, res) => {
  try {
    const regions = await awsService.getAwsRegions();
    res.json(regions);
  } catch (error) {
    console.error('Error fetching AWS regions:', error);
    res.status(500).json({ error: 'Failed to fetch AWS regions' });
  }
});

router.get('/aws/zones', async (req, res) => {
  try {
    const { region } = req.query;
    if (!region) {
      return res.status(400).json({ error: 'Region query parameter is required for AWS zones.' });
    }
    const zones = await awsService.getAwsZones(region);
    res.json(zones);
  } catch (error) {
    console.error(`Error fetching AWS zones for region ${req.query.region}:`, error);
    res.status(500).json({ error: 'Failed to fetch AWS zones' });
  }
});

router.get('/aws/instance-types', async (req, res) => {
  try {
    const { region } = req.query;
    if (!region) {
      return res.status(400).json({ error: 'Region query parameter is required for AWS instance types.' });
    }
    const instanceTypes = await awsService.getAwsInstanceTypes(region);
    res.json(instanceTypes);
  } catch (error) {
    console.error(`Error fetching AWS instance types for region ${req.query.region}:`, error);
    res.status(500).json({ error: 'Failed to fetch AWS instance types' });
  }
});

router.get('/aws/storage-options', async (req, res) => {
  try {
    const { region } = req.query;
    if (!region) {
      return res.status(400).json({ error: 'Region query parameter is required for AWS storage options.' });
    }
    const storageOptions = await awsService.getAwsStorageOptions(region);
    res.json(storageOptions);
  } catch (error) {
    console.error(`Error fetching AWS storage options for region ${req.query.region}:`, error);
    res.status(500).json({ error: 'Failed to fetch AWS storage options' });
  }
});

// --- GCP Routes ---
router.get('/gcp/regions', async (req, res) => {
  try {
    const regions = await gcpService.getGcpRegions();
    res.json(regions);
  } catch (error) {
    console.error('Error fetching GCP regions:', error);
    res.status(500).json({ error: 'Failed to fetch GCP regions' });
  }
});

router.get('/gcp/zones', async (req, res) => {
  try {
    const { region } = req.query;
    if (!region) {
      return res.status(400).json({ error: 'Region query parameter is required for GCP zones.' });
    }
    const zones = await gcpService.getGcpZones(region);
    res.json(zones);
  } catch (error) {
    console.error(`Error fetching GCP zones for region ${req.query.region}:`, error);
    res.status(500).json({ error: 'Failed to fetch GCP zones' });
  }
});

router.get('/gcp/machine-types', async (req, res) => {
  try {
    const { zone } = req.query; // GCP machine types are often zone-specific
    if (!zone) {
      return res.status(400).json({ error: 'Zone query parameter is required for GCP machine types.' });
    }
    const machineTypes = await gcpService.getGcpMachineTypes(zone);
    res.json(machineTypes);
  } catch (error) {
    console.error(`Error fetching GCP machine types for zone ${req.query.zone}:`, error);
    res.status(500).json({ error: 'Failed to fetch GCP machine types' });
  }
});

router.get('/gcp/disk-types', async (req, res) => {
  try {
    const { zone } = req.query; // GCP disk types can be zone-specific
    if (!zone) {
      return res.status(400).json({ error: 'Zone query parameter is required for GCP disk types.' });
    }
    const diskTypes = await gcpService.getGcpDiskTypes(zone);
    res.json(diskTypes);
  } catch (error) {
    console.error(`Error fetching GCP disk types for zone ${req.query.zone}:`, error);
    res.status(500).json({ error: 'Failed to fetch GCP disk types' });
  }
});

// --- Fetch VM Provider Options ---
/**
 * Endpoint to search for VM options across multiple cloud providers
 * based on user requirements like vCPU, RAM, GPU, etc.
 * This endpoint adapts the existing find-cheapest-instance functionality
 * to match the frontend VM launch flow requirements.
 */
router.post('/fetch-vm-provider', async (req, res) => {
  try {
    const {
      provider,      // Optional - if provided, filter to just this provider
      region,        // Optional - region/location preference
      zone,          // Optional - specific zone preference
      vCPU,          // Required - number of vCPUs
      ramGB,         // Required - RAM in GB
      gpuType,       // Optional - type of GPU
      gpuCount,      // Optional - number of GPUs (defaults to 1 if gpuType is provided)
      storageType,   // Optional - storage type preference
      storageGB      // Optional - storage size in GB
    } = req.body;

    // Validate required parameters
    if (!vCPU || !ramGB) {
      return res.status(400).json({ 
        error: 'Missing required parameters', 
        details: 'vCPU and ramGB are required' 
      });
    }

    // Map to the criteria format expected by findOptimalVm
    const criteria = {
      vcpu: vCPU,
      ram_gb: ramGB,
      preference: 'price', // Default to price optimization
      user_ip_address: req.ip || '127.0.0.1', // Use client IP or fallback
    };

    // Add optional parameters if provided
    if (gpuType) criteria.gpu_type = gpuType;
    if (gpuCount) criteria.gpu_count = gpuCount;
    if (storageType) criteria.storage_type = storageType;
    if (storageGB) criteria.storage_gb = storageGB;

    // Call the existing VM search function
    const results = await findOptimalVm(criteria);

    // Filter by provider if specified
    let filteredResults = results;
    if (provider) {
      // Normalize provider name (AWS, GCP, etc.)
      const normalizedProvider = provider.toUpperCase();
      filteredResults = results.filter(vm => vm.provider === normalizedProvider);
    }

    // Filter by region/zone if specified
    if (region) {
      filteredResults = filteredResults.filter(vm => {
        // For AWS, check region directly
        if (vm.provider === 'AWS') {
          return vm.region === region;
        }
        // For GCP, zone contains region (e.g., us-central1-a contains us-central1)
        if (vm.provider === 'GCP' && vm.zone) {
          return vm.zone.startsWith(region);
        }
        return true;
      });
    }

    // Further filter by specific zone if provided
    if (zone) {
      filteredResults = filteredResults.filter(vm => 
        (vm.provider === 'GCP' && vm.zone === zone) || 
        (vm.provider === 'AWS' && vm.availability_zone === zone)
      );
    }

    // Group the results by category (generalPurpose, computeOptimized, etc.)
    const categorizedResults = {};
    
    filteredResults.forEach(vm => {
      // Determine category based on instance type prefix or metadata
      let category = 'other';
      
      if (vm.provider === 'AWS') {
        const instanceType = vm.instance_type || '';
        if (instanceType.startsWith('t')) category = 'generalPurpose';
        else if (instanceType.startsWith('c')) category = 'computeOptimized';
        else if (instanceType.startsWith('m')) category = 'generalPurpose';
        else if (instanceType.startsWith('r')) category = 'memoryOptimized';
        else if (instanceType.startsWith('i') || instanceType.startsWith('d')) category = 'storageOptimized';
        else if (instanceType.startsWith('p') || instanceType.startsWith('g')) category = 'gpus';
      } else if (vm.provider === 'GCP') {
        const machineType = vm.instance_type || '';
        if (machineType.includes('standard')) category = 'generalPurpose';
        else if (machineType.includes('highcpu')) category = 'computeOptimized';
        else if (machineType.includes('highmem')) category = 'memoryOptimized';
        else if (machineType.includes('megamem') || machineType.includes('ultramem')) category = 'memoryOptimized';
        else if (machineType.includes('storage-optimized')) category = 'storageOptimized';
        else if (vm.gpu_count > 0 || vm.gpu_type) category = 'gpus';
      }
      
      // Initialize category array if it doesn't exist
      if (!categorizedResults[category]) {
        categorizedResults[category] = [];
      }
      
      // Add to the appropriate category
      categorizedResults[category].push(vm);
    });

    // Return the categorized results
    res.json({
      success: true,
      totalResults: filteredResults.length,
      categorizedResults
    });
  } catch (error) {
    console.error('Error in fetch-vm-provider endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to fetch VM provider options', 
      details: error.message 
    });
  }
});

/**
 * New endpoint to fetch cached VM instances by category, provider, and region
 * This provides a more efficient way to browse available options without making
 * repeated API calls for different criteria.
 */
router.get('/cached-vm-instances', async (req, res) => {
  try {
    const { provider, region, zone, category } = req.query;
    
    if (!provider) {
      return res.status(400).json({ 
        error: 'Missing required parameter', 
        details: 'provider is required' 
      });
    }
    
    console.log(`Cached VM instances request - provider: ${provider}, region: ${region}, zone: ${zone}, category: ${category}`);
    
    // Normalize provider to uppercase for consistent comparison
    const normalizedProvider = provider.toUpperCase();
    
    // Define example instances for testing/demo purposes
    const exampleInstances = {
      AWS: {
        "General Purpose": [
          {
            provider: 'AWS',
            instance_type: 't2.micro',
            vcpu: 1,
            ram_gb: 1,
            region: region || 'us-east-1',
            availability_zone: zone || 'us-east-1a',
            pricing_model: 'OnDemand',
            total_price_per_hour: 0.0116,
            description: 'Example t2.micro instance for testing'
          },
          {
            provider: 'AWS',
            instance_type: 't3.small',
            vcpu: 2,
            ram_gb: 2,
            region: region || 'us-east-1',
            availability_zone: zone || 'us-east-1a',
            pricing_model: 'OnDemand',
            total_price_per_hour: 0.0208,
            description: 'Example t3.small instance for testing'
          }
        ],
        "Compute Optimized": [
          {
            provider: 'AWS',
            instance_type: 'c5.large',
            vcpu: 2,
            ram_gb: 4,
            region: region || 'us-east-1',
            availability_zone: zone || 'us-east-1a',
            pricing_model: 'OnDemand',
            total_price_per_hour: 0.085,
            description: 'Example c5.large instance for testing'
          }
        ],
        "Graphics Processing Units": [
          {
            provider: 'AWS',
            instance_type: 'p3.2xlarge',
            vcpu: 8,
            ram_gb: 16,
            gpu_type: 'NVIDIA Tesla V100',
            gpu_count: 1,
            region: region || 'us-east-1',
            availability_zone: zone || 'us-east-1a',
            pricing_model: 'OnDemand',
            total_price_per_hour: 3.06,
            description: 'Example p3.2xlarge instance with V100 GPU for testing'
          }
        ]
      },
      GCP: {
        "General Purpose": [
          {
            provider: 'GCP',
            instance_type: 'e2-medium',
            vcpu: 2,
            ram_gb: 4,
            zone: zone || (region ? `${region}-a` : 'us-central1-a'),
            pricing_model: 'OnDemand',
            total_price_per_hour: 0.0353,
            description: 'Example e2-medium instance for testing'
          }
        ],
        "Compute Optimized": [
          {
            provider: 'GCP',
            instance_type: 'c2-standard-4',
            vcpu: 4,
            ram_gb: 16,
            zone: zone || (region ? `${region}-a` : 'us-central1-a'),
            pricing_model: 'OnDemand',
            total_price_per_hour: 0.2085,
            description: 'Example c2-standard-4 instance for testing'
          }
        ],
        "Graphics Processing Units": [
          {
            provider: 'GCP',
            instance_type: 'n1-standard-8-gpu-nvidia-tesla-t4-1',
            vcpu: 8,
            ram_gb: 30,
            gpu_type: 'NVIDIA Tesla T4',
            gpu_count: 1,
            zone: zone || (region ? `${region}-a` : 'us-central1-a'),
            pricing_model: 'OnDemand',
            total_price_per_hour: 0.9016,
            description: 'Example n1-standard-8 with T4 GPU for testing'
          }
        ]
      }
    };
    
    // If real data is available, fetch and use it
    // For now, we'll just use the example data
    
    // Check if the requested provider exists in our example data
    if (!exampleInstances[normalizedProvider]) {
      return res.status(400).json({
        success: false,
        error: 'Invalid provider',
        details: `Provider ${provider} is not supported. Supported providers: AWS, GCP`
      });
    }
    
    // Get all available categories for this provider
    const availableCategories = Object.keys(exampleInstances[normalizedProvider]);
    console.log(`Available categories for ${normalizedProvider}: ${availableCategories.join(', ')}`);
    
    // If a specific category is requested, return only that category
    if (category && availableCategories.includes(category)) {
      console.log(`Returning only ${category} category with ${exampleInstances[normalizedProvider][category].length} instances`);
      return res.json({
        success: true,
        category: category,
        instances: exampleInstances[normalizedProvider][category]
      });
    }
    
    // Otherwise, return all categories and their instances
    console.log(`Returning all categories with instances for ${normalizedProvider}`);
    res.json({
      success: true,
      categories: availableCategories,
      instances: exampleInstances[normalizedProvider]
    });
    
  } catch (error) {
    console.error('Error fetching cached VM instances:', error);
    res.status(500).json({ 
      error: 'Failed to fetch cached VM instances', 
      details: error.message 
    });
  }
});

// --- Add routes for other providers (Azure, DigitalOcean, OVH, Oracle) below ---
// Example structure for Azure:
// router.get('/azure/regions', async (req, res) => { /* ... */ });
// router.get('/azure/virtual-machine-sizes', async (req, res) => { /* ... query by location ... */ });
// router.get('/azure/disk-types', async (req, res) => { /* ... query by location ... */ });

module.exports = router; 