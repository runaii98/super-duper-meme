const { InstancesClient, ZonesClient, RegionsClient, MachineTypesClient, DiskTypesClient } = require('@google-cloud/compute');
const { loadGcpCredentials } = require('../vm_allocation_engine/credentials_manager');

const getGcpRegions = async () => {
  try {
    const credentials = await loadGcpCredentials();
    const regionsClient = new RegionsClient({
      credentials: credentials,
      projectId: credentials.project_id
    });

    const [regions] = await regionsClient.list({
      project: credentials.project_id
    });

    return regions.map(region => ({
      id: region.name,
      name: region.name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), // Format: us-central1 -> Us Central1
      status: region.status
    }));
  } catch (error) {
    console.error('Error fetching GCP regions from SDK:', error);
    throw new Error(`Failed to fetch GCP regions: ${error.message}`);
  }
};

const getGcpZones = async (region) => {
  if (!region) {
    return Promise.reject(new Error('Region is required to fetch GCP zones.'));
  }

  try {
    const credentials = await loadGcpCredentials();
    const zonesClient = new ZonesClient({
      credentials: credentials,
      projectId: credentials.project_id
    });

    const [zones] = await zonesClient.list({
      project: credentials.project_id,
      filter: `name:${region}-*`
    });

    return zones
      .filter(zone => zone.status === 'UP')
      .map(zone => ({
        id: zone.name,
        name: zone.name
      }));
  } catch (error) {
    console.error(`Error fetching GCP zones for region ${region} from SDK:`, error);
    throw new Error(`Failed to fetch GCP zones for ${region}: ${error.message}`);
  }
};

const getGcpMachineTypes = async (zone) => {
  if (!zone) {
    throw new Error('Zone is required to fetch GCP machine types.');
  }
  
  try {
    const credentials = await loadGcpCredentials();
    const machineTypesClient = new MachineTypesClient({
      credentials: credentials,
      projectId: credentials.project_id
    });
    
    const [machineTypes] = await machineTypesClient.list({
      project: credentials.project_id,
      zone: zone
    });
    
    return machineTypes.map(machine => {
      // Extract the series from the name (e.g., 'e2', 'n2', 'c2')
      let series = 'standard';
      const nameParts = machine.name.split('-');
      if (nameParts.length > 0) {
        // Try to extract series like e2, n2, c2, etc.
        const match = nameParts[0].match(/^([a-z]+\d+)/);
        if (match) {
          series = match[1];
        }
      }
      
      // Determine category based on series or machine type
      let category = 'generalPurpose'; // Default
      if (series.startsWith('c')) {
        category = 'computeOptimized';
      } else if (series.startsWith('m')) {
        category = 'memoryOptimized';
      } else if (machine.name.includes('gpu')) {
        category = 'gpus';
      } else if (machine.name.includes('highcpu')) {
        category = 'computeOptimized';
      } else if (machine.name.includes('highmem')) {
        category = 'memoryOptimized';
      }
      
      // Convert memory from bytes to GB
      const memoryGB = machine.memoryMb / 1024;
      
      // Pricing is complex and varies by region - these are estimates
      // In a real app, you would query the Cloud Billing API or use a pre-compiled list
      // We'll use a simple formula for demo purposes
      const basePricePerCpu = 0.033; // Base price per vCPU per hour
      const basePricePerGb = 0.0044; // Base price per GB of memory per hour
      
      // Apply modifiers based on series
      let cpuPriceMod = 1.0;
      let memPriceMod = 1.0;
      
      if (series === 'e2') {
        cpuPriceMod = 0.7; // E2 is cheaper than standard
        memPriceMod = 0.7;
      } else if (series === 'n2') {
        cpuPriceMod = 1.1; // N2 is more expensive than standard
        memPriceMod = 1.1;
      } else if (series === 'c2') {
        cpuPriceMod = 1.3; // C2 is more expensive as it's compute optimized
        memPriceMod = 0.9;
      } else if (series === 'm2') {
        cpuPriceMod = 0.9; // Memory-optimized instances typically charge less for CPU
        memPriceMod = 1.4; // And more for memory
      }
      
      // Calculate hourly price
      const cpuPrice = machine.guestCpus * basePricePerCpu * cpuPriceMod;
      const memPrice = memoryGB * basePricePerGb * memPriceMod;
      const pricePerHour = cpuPrice + memPrice;
      
      return {
        id: machine.name,
        name: machine.name,
        description: machine.description || `${machine.name} - ${category} instance`,
        series: series,
        category: category,
        vcpu: machine.guestCpus,
        ramGB: memoryGB,
        sharedCpu: machine.name.includes('micro') || machine.name.includes('small') || machine.name.includes('medium'),
        pricePerHour: pricePerHour.toFixed(4),
        architecture: 'x86_64', // GCP generally uses x86_64, though ARM is available
        zone: zone
      };
    });
  } catch (error) {
    console.error(`Error fetching GCP machine types for zone ${zone}:`, error);
    throw new Error(`Failed to fetch GCP machine types: ${error.message}`);
  }
};

const getGcpDiskTypes = async (zone) => {
  if (!zone) {
    throw new Error('Zone is required to fetch GCP disk types.');
  }
  
  try {
    const credentials = await loadGcpCredentials();
    const diskTypesClient = new DiskTypesClient({
      credentials: credentials,
      projectId: credentials.project_id
    });
    
    // For disk types, we need to use the correct method
    const [diskTypes] = await diskTypesClient.list({
      project: credentials.project_id,
      zone: zone
    });
    
    return diskTypes.map(diskType => {
      // Extract the type from the name (e.g., 'pd-standard', 'pd-ssd')
      const nameParts = diskType.name.split('/');
      const simpleName = nameParts[nameParts.length - 1];
      
      // NOTE: While we fetch real disk types from GCP API, pricing info is not included.
      // We're using estimated values based on public GCP pricing documentation.
      // These are real GCP disk types with their actual characteristics.
      let pricePerGBMonth = 0.04; // Default pricing
      let type = 'HDD';
      let speedDescription = 'Standard';
      let minSizeGB = 10;
      let maxSizeGB = 65536;
      
      // Set specific values based on disk type
      if (simpleName === 'pd-standard') {
        pricePerGBMonth = 0.04;
        type = 'HDD';
        speedDescription = 'Standard persistent disk (HDD)';
      } else if (simpleName === 'pd-balanced') {
        pricePerGBMonth = 0.1;
        type = 'SSD';
        speedDescription = 'Balanced persistent disk (SSD)';
      } else if (simpleName === 'pd-ssd') {
        pricePerGBMonth = 0.17;
        type = 'SSD';
        speedDescription = 'SSD persistent disk';
      } else if (simpleName === 'pd-extreme') {
        pricePerGBMonth = 0.23;
        type = 'SSD';
        speedDescription = 'Extreme persistent disk (SSD)';
        minSizeGB = 500;
      } else if (simpleName === 'local-ssd') {
        pricePerGBMonth = 0.08; // This is per GB per hour converted to month for consistency
        type = 'SSD';
        speedDescription = 'Local SSD (attached to instance)';
        minSizeGB = 375;
        maxSizeGB = 9000; // Multiple of 375GB disks
      }
      
      // Apply regional price adjustments if needed
      // This is a simplified approach - actual GCP pricing varies by region
      if (!zone.startsWith('us-')) {
        // Non-US regions typically have higher prices
        pricePerGBMonth *= 1.2;
      }
      
      return {
        id: simpleName,
        name: diskType.description || simpleName,
        type: type,
        description: speedDescription,
        pricePerGBMonth: pricePerGBMonth,
        defaultSizeGB: 100,
        minSizeGB: minSizeGB,
        maxSizeGB: maxSizeGB,
        zone: zone
      };
    });
  } catch (error) {
    console.error(`Error fetching GCP disk types for zone ${zone}:`, error);
    throw new Error(`Failed to fetch GCP disk types: ${error.message}`);
  }
};

module.exports = {
  getGcpRegions,
  getGcpZones,
  getGcpMachineTypes,
  getGcpDiskTypes,
}; 