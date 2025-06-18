/**
 * GCP Compute API Fetcher
 * 
 * Fetches VM instance types directly from Google Cloud Compute Engine API
 * More efficient than using Billing API for VM info
 */

const {GoogleAuth} = require('google-auth-library');
const compute = require('@google-cloud/compute');
const fs = require('fs');
const path = require('path');
const credentialsManager = require('../credentials_manager');

// Cache configuration
const CACHE_FILE = path.join(__dirname, 'gcp_instances_cache.json');
const MAX_CACHE_AGE_MS = 60 * 60 * 1000; // 60 minutes

// Pricing estimates - these would need to be updated periodically
// These are approximations and should be replaced with actual pricing data from Cloud Billing API
const PRICING_ESTIMATES = {
  'e2-standard': 0.02, // $ per vCPU hour
  'e2-highcpu': 0.018, // $ per vCPU hour
  'e2-highmem': 0.021, // $ per vCPU hour
  'n2-standard': 0.031, // $ per vCPU hour
  'n2-highcpu': 0.028, // $ per vCPU hour
  'n2-highmem': 0.033, // $ per vCPU hour
  'n2d-standard': 0.028, // $ per vCPU hour
  'c2-standard': 0.041, // $ per vCPU hour
  'c3-standard': 0.048, // $ per vCPU hour
  'a2-standard': 0.056, // $ per vCPU hour
  'g2-standard': 0.065, // $ per vCPU hour
  'memory-ram': 0.0042, // $ per GB hour (additional for memory)
  'gpu-nvidia-t4': 0.35, // $ per GPU hour
  'gpu-nvidia-a100': 3.20, // $ per GPU hour
};

// Initialize Compute Engine client
let computeClient = null;

/**
 * Initialize the GCP Compute client with credentials
 * @returns {Promise<void>}
 */
async function initComputeClient() {
  try {
    if (computeClient) {
      return; // Already initialized
    }
    
    const gcpCredentials = await credentialsManager.loadGcpCredentials();
    
    // Create Compute Engine client with the correct class access
    const InstancesClient = compute.InstancesClient;
    computeClient = new InstancesClient({
      credentials: gcpCredentials
    });
    
    console.log('GCP Compute Engine API client initialized successfully');
  } catch (error) {
    console.error('Error initializing GCP Compute client:', error);
    throw error;
  }
}

/**
 * Fetch available machine types from Google Compute Engine
 * @param {string} projectId - GCP Project ID
 * @param {Array<string>} zones - List of GCP zones to check (or defaults to a standard list)
 * @returns {Promise<Array>} - List of machine types with specs
 */
async function fetchGcpMachineTypes(projectId, zones = null) {
  try {
    await initComputeClient();
    
    if (!computeClient) {
      throw new Error('GCP Compute client not initialized');
    }
    
    // If zones not provided, use these common zones as examples
    const defaultZones = [
      'us-central1-a', 'us-east1-b', 'us-west1-a', 
      'europe-west1-b', 'europe-west4-a', 
      'asia-east1-a', 'asia-southeast1-a'
    ];
    
    const targetZones = zones || defaultZones;
    console.log(`Fetching machine types for ${targetZones.length} zones`);
    
    const allMachineTypes = [];
    const uniqueMachineTypes = new Set(); // Track unique machine types to avoid duplicates
    
    // Create a MachineTypesClient
    const MachineTypesClient = compute.MachineTypesClient;
    const machineTypesClient = new MachineTypesClient({
      credentials: await credentialsManager.loadGcpCredentials()
    });
    
    for (const zone of targetZones) {
      console.log(`Fetching machine types for zone: ${zone}`);
      
      try {
        // Extract region from zone (e.g., 'us-central1-a' -> 'us-central1')
        const region = zone.split('-').slice(0, 2).join('-');
        
        // Get machine types for this zone
        const [machineTypesResponse] = await machineTypesClient.list({
          project: projectId,
          zone: zone
        });
        
        if (!machineTypesResponse || !Array.isArray(machineTypesResponse)) {
          console.log(`No machine types returned for zone ${zone}`);
          continue;
        }
        
        console.log(`Found ${machineTypesResponse.length} machine types in zone ${zone}`);
        
        // Process machine types and add to unique list
        for (const machine of machineTypesResponse) {
          // Only add if we haven't seen this machine type name before
          if (!uniqueMachineTypes.has(machine.name)) {
            uniqueMachineTypes.add(machine.name);
            
            // Transform to standard format
            const machineType = {
              name: machine.name,
              id: machine.id,
              description: machine.description,
              guestCpus: machine.guestCpus,
              memoryMb: machine.memoryMb,
              zone: machine.zone || zone, // Ensure we always have a zone field
              isSharedCpu: machine.isSharedCpu || false
            };
            
            allMachineTypes.push(machineType);
          }
        }
      } catch (error) {
        console.error(`Error fetching machine types for zone ${zone}:`, error);
        // Continue to other zones even if one fails
      }
    }
    
    return allMachineTypes;
  } catch (error) {
    console.error('Error fetching GCP machine types:', error);
    throw error;
  }
}

/**
 * Get network performance based on machine type and CPU count
 * @param {string} machineType - Instance type name
 * @param {number} cpuCount - Number of vCPUs
 * @returns {string} - Network performance description
 */
function getNetworkPerformance(machineType, cpuCount) {
  if (machineType.includes('g2-') || machineType.includes('a2-')) {
    return 'Up to 100 Gbps';
  } else if (machineType.includes('c3-') || machineType.includes('c2-')) {
    return 'Up to 32 Gbps';
  } else if (cpuCount >= 32) {
    return 'Up to 16 Gbps';
  } else if (cpuCount >= 16) {
    return 'Up to 10 Gbps';
  } else if (cpuCount >= 8) {
    return 'Up to 5 Gbps';
  } else if (cpuCount >= 4) {
    return 'Up to 2 Gbps';
  } else {
    return 'Up to 1 Gbps';
  }
}

/**
 * Maps GCP region code to display name
 */
function getGcpRegionDisplay(regionCode) {
  const regionMap = {
    'us-central1': 'US Central (Iowa)',
    'us-east1': 'US East (South Carolina)',
    'us-east4': 'US East (Northern Virginia)',
    'us-west1': 'US West (Oregon)',
    'us-west2': 'US West (Los Angeles)',
    'us-west3': 'US West (Salt Lake City)',
    'us-west4': 'US West (Las Vegas)',
    'europe-west1': 'Europe West (Belgium)',
    'europe-west2': 'Europe West (London)',
    'europe-west3': 'Europe West (Frankfurt)',
    'europe-west4': 'Europe West (Netherlands)',
    'europe-west6': 'Europe West (Zurich)',
    'asia-east1': 'Asia East (Taiwan)',
    'asia-east2': 'Asia East (Hong Kong)',
    'asia-northeast1': 'Asia Northeast (Tokyo)',
    'asia-northeast2': 'Asia Northeast (Osaka)',
    'asia-northeast3': 'Asia Northeast (Seoul)',
    'asia-south1': 'Asia South (Mumbai)',
    'asia-southeast1': 'Asia Southeast (Singapore)',
    'asia-southeast2': 'Asia Southeast (Jakarta)',
    'australia-southeast1': 'Australia Southeast (Sydney)',
    'southamerica-east1': 'South America East (São Paulo)',
    // Add more regions as needed
  };
  
  return regionMap[regionCode] || regionCode;
}

/**
 * Fetch GCP VM instance types with additional GPU options
 * @param {string} projectId - GCP Project ID
 * @returns {Promise<Array>} - List of machine types with specs
 */
async function fetchGcpVmInstanceTypes(projectId) {
  try {
    console.log('----------------------------------------------------');
    console.log('STARTING FRESH GCP VM INSTANCE TYPE FETCH');
    console.log('----------------------------------------------------');
    
    // Fetch base machine types
    const machineTypes = await fetchGcpMachineTypes(projectId);
    
    // If no machine types were found, propagate error
    if (!machineTypes || machineTypes.length === 0) {
      throw new Error('No machine types found from the GCP Compute Engine API');
    }
    
    // Add GPU options for compatible machine types
    console.log(`Total unique machine types fetched: ${machineTypes.length}`);
    
    // Build standard response
    const instances = machineTypes.map(m => {
      // Parse series and variant from name
      const machineInfo = parseMachineTypeName(m.name);
      
      // Extract region from zone if available
      let region = 'unknown';
      let location = 'Unknown';
      
      if (m.zone && typeof m.zone === 'string') {
        const zoneParts = m.zone.split('/');
        if (zoneParts.length > 0) {
          const zoneId = zoneParts.pop();
          if (zoneId) {
            // Remove the zone letter suffix to get region (e.g., 'us-central1-a' -> 'us-central1')
            region = zoneId.slice(0, -2);
            location = getGcpRegionDisplay(region);
          }
        }
      }
      
      // Calculate pricing
      const computePrice = calculatePriceBySpecs(machineInfo.series, m.guestCpus, m.memoryMb / 1024);
      
      // Build instance object in standard format
      const instance = {
        provider: 'GCP',
        region: region,
        location: location,
        instance_type: m.name,
        instance_sku_id: m.id || m.name,
        description: `${m.name}: ${m.description || `${m.guestCpus} vCPU, ${Math.round(m.memoryMb / 1024)} GB RAM`}`,
        vcpu: m.guestCpus,
        ram_gb: m.memoryMb / 1024,
        ramGB: m.memoryMb / 1024, // Legacy support
        pricing_model: 'OnDemand',
        compute_price_per_hour: computePrice,
        total_price_per_hour: computePrice,
        network_performance: getNetworkPerformance(m.name, m.guestCpus),
        gpu_type: null,
        gpu_count: 0,
        gpuType: null,
        gpuCount: 0,
        vram_gb: null,
        vramGB: null,
        requested_storage_gb: 0,
        requested_storage_type: null,
        estimated_storage_cost_per_hour: 0,
        currency: 'USD',
        series: machineInfo.series,
        variant: machineInfo.variant
      };
      
      return instance;
    });
    
    // For compatible instances, add GPU option variants
    const gpuConfigs = [
      { type: 'nvidia-tesla-t4', count: 1, price: 0.35 },
      { type: 'nvidia-tesla-t4', count: 2, price: 0.70 },
      { type: 'nvidia-tesla-v100', count: 1, price: 2.48 },
      { type: 'nvidia-tesla-a100', count: 1, price: 3.20 }
    ];
    
    // GPU compatibility check - only add to instances with sufficient resources
    const gpuCompatibleMachines = instances.filter(
      i => i.vcpu >= 4 && i.ram_gb >= 16 && 
      (i.series === 'n1' || i.series === 'n2' || i.series === 'a2')
    );
    
    // For each compatible instance, create variants with GPU options
    const gpuInstances = [];
    
    for (const baseInstance of gpuCompatibleMachines) {
      for (const gpu of gpuConfigs) {
        const instanceType = `${baseInstance.instance_type}-gpu-${gpu.type}-${gpu.count}`;
        const totalPrice = baseInstance.compute_price_per_hour + (gpu.price * gpu.count);
        
        const gpuInstance = {
          ...baseInstance,
          instance_type: instanceType,
          instance_sku_id: `${baseInstance.instance_sku_id}-gpu-${gpu.type}-${gpu.count}`,
          description: `${baseInstance.description} with ${gpu.count}x ${gpu.type}`,
          gpu_type: gpu.type,
          gpu_count: gpu.count,
          gpuType: gpu.type,
          gpuCount: gpu.count,
          vram_gb: gpu.type.includes('a100') ? 40 : (gpu.type.includes('v100') ? 32 : 16),
          vramGB: gpu.type.includes('a100') ? 40 : (gpu.type.includes('v100') ? 32 : 16),
          compute_price_per_hour: totalPrice,
          total_price_per_hour: totalPrice
        };
        
        gpuInstances.push(gpuInstance);
      }
    }
    
    // Create Spot instances for all OnDemand instances (applying spot discounts)
    const spotInstances = [];
    const spotDiscounts = {
      'us-central1': 0.75, // 25% discount
      'us-east1': 0.75,
      'us-west1': 0.80,
      'europe-west1': 0.70,
      'europe-west4': 0.75,
      'asia-east1': 0.70,
      'asia-southeast1': 0.80,
      'default': 0.75 // 25% discount as default
    };
    
    // Add spot variants of all instances
    for (const onDemandInstance of [...instances, ...gpuInstances]) {
      // Apply region-specific discount or default
      const discountFactor = spotDiscounts[onDemandInstance.region] || spotDiscounts.default;
      
      // Calculate spot pricing (discounted from on-demand)
      const spotComputePrice = parseFloat((onDemandInstance.compute_price_per_hour * discountFactor).toFixed(4));
      const spotTotalPrice = parseFloat((onDemandInstance.total_price_per_hour * discountFactor).toFixed(4));
      
      // Create spot instance (copy of on-demand with modified pricing and labels)
      const spotInstance = {
        ...onDemandInstance,
        pricing_model: 'Spot',
        compute_price_per_hour: spotComputePrice,
        total_price_per_hour: spotTotalPrice,
        // Create a new description without modifying the original
        description: `${onDemandInstance.description} (Spot)`
      };
      
      spotInstances.push(spotInstance);
    }
    
    // Combine all instances: OnDemand Base + OnDemand GPU + Spot Base + Spot GPU
    const allInstances = [...instances, ...gpuInstances, ...spotInstances];
    
    console.log(`Generated ${instances.length} OnDemand instances`);
    console.log(`Added ${gpuInstances.length} GPU-enabled instances`);
    console.log(`Added ${spotInstances.length} Spot instances`);
    console.log(`Total instances: ${allInstances.length}`);
    
    return allInstances;
  } catch (error) {
    console.error(`Error fetching GCP VM instance types: ${error.message}`);
    throw error; // Propagate the error without fallback
  }
}

/**
 * Load GCP VM instance types, using cache if available and not expired.
 * Fetches new data and updates cache if necessary.
 * @param {string} projectId - GCP Project ID
 * @returns {Promise<Array>} Array of standardized VM instance objects
 */
async function loadGcpInstanceTypes(projectId) {
  try {
    // Try to load from cache first if exists and valid
    if (fs.existsSync(CACHE_FILE)) {
      const cacheStats = fs.statSync(CACHE_FILE);
      const cacheAge = Date.now() - cacheStats.mtimeMs;
      
      if (cacheAge < MAX_CACHE_AGE_MS) {
        console.log(`Loading GCP instance types from cache (age: ${Math.round(cacheAge / 1000)}s)`);
        const cachedData = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
        return cachedData;
      } else {
        console.log(`GCP instance types cache expired (age: ${Math.round(cacheAge / 1000)}s). Fetching fresh data...`);
      }
    } else {
      console.log('No GCP instance types cache found. Fetching fresh data...');
    }
    
    // Fetch fresh data
    const instances = await fetchGcpVmInstanceTypes(projectId);
    
    // Validate and save to cache
    if (Array.isArray(instances) && instances.length > 0) {
      console.log(`Fetched ${instances.length} GCP instance types successfully`);
      fs.writeFileSync(CACHE_FILE, JSON.stringify(instances, null, 2));
      console.log(`Cached ${instances.length} GCP instance types to ${CACHE_FILE}`);
      return instances;
    } else {
      console.log('GCP instance type fetch did not return data. Cache not updated.');
      
      // If we have an old cache, still use that even if it's expired
      if (fs.existsSync(CACHE_FILE)) {
        console.log('Using expired cache as fallback');
        const cachedData = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
        return cachedData;
      }
      
      return [];
    }
  } catch (error) {
    console.error(`Error loading GCP instance types: ${error.message}`);
    
    // Try to use cached data if available, even if expired
    if (fs.existsSync(CACHE_FILE)) {
      console.log('Error fetching fresh data. Using cached data as fallback.');
      const cachedData = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      return cachedData;
    }
    
    throw error; // No fallbacks - propagate error
  }
}

/**
 * Parse machine type name into series and variant components
 * @param {string} machineName - Machine type name (e.g., 'n2-standard-2')
 * @returns {object} - Series and variant information
 */
function parseMachineTypeName(machineName) {
  // Default values
  const result = {
    series: 'unknown',
    variant: 'standard',
    size: 'unknown'
  };
  
  // Parse the machine type name (e.g., 'n2-standard-2')
  const parts = machineName.split('-');
  
  if (parts.length >= 1) {
    result.series = parts[0];
  }
  
  if (parts.length >= 2) {
    result.variant = parts[1];
  }
  
  if (parts.length >= 3) {
    result.size = parts[2];
  }
  
  return result;
}

/**
 * Calculate price based on machine specs and series
 * @param {string} series - Machine series (e.g., 'n2', 'e2')
 * @param {number} vcpu - Number of vCPUs
 * @param {number} ramGb - RAM in GB
 * @returns {number} - Estimated price per hour
 */
function calculatePriceBySpecs(series, vcpu, ramGb) {
  // Base prices per vCPU-hour for different series
  const vCpuPrices = {
    'e2': 0.021,
    'n1': 0.031,
    'n2': 0.031,
    'n2d': 0.028,
    'c2': 0.043,
    'c3': 0.048,
    'a2': 0.056,
    'g2': 0.065,
    'm1': 0.043, // Memory-optimized
    'm2': 0.050  // Memory-optimized
  };
  
  // RAM prices per GB-hour
  const ramPrices = {
    'e2': 0.0028,
    'n1': 0.0042,
    'n2': 0.0042,
    'n2d': 0.0038,
    'c2': 0.0043,
    'c3': 0.0048,
    'a2': 0.0056,
    'g2': 0.0065,
    'm1': 0.0058, // Memory-optimized
    'm2': 0.0068  // Memory-optimized
  };
  
  // Use defaults if series not found
  const vCpuPrice = vCpuPrices[series] || 0.035;
  const ramPrice = ramPrices[series] || 0.0045;
  
  // Calculate total hourly price
  const cpuCost = vcpu * vCpuPrice;
  const ramCost = ramGb * ramPrice;
  
  return parseFloat((cpuCost + ramCost).toFixed(4)); // Round to 4 decimal places
}

module.exports = {
  fetchGcpMachineTypes,
  fetchGcpVmInstanceTypes,
  loadGcpInstanceTypes,
  initComputeClient
}; 