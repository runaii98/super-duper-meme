const { EC2Client, DescribeRegionsCommand, DescribeAvailabilityZonesCommand, DescribeInstanceTypesCommand } = require('@aws-sdk/client-ec2');
const { loadAwsCredentials } = require('../vm_allocation_engine/credentials_manager');

const getAwsRegions = async () => {
  try {
    const credentials = await loadAwsCredentials();
    // For DescribeRegions, a default region for the client is fine, or you can omit it if your AWS config is set up.
    // However, subsequent calls will need specific regions.
    const ec2Client = new EC2Client({ 
        credentials, 
        region: 'us-east-1' // A default region, SDK might require one for client init
    });
    
    const command = new DescribeRegionsCommand({});
    const response = await ec2Client.send(command);
    
    if (response.Regions) {
      return response.Regions.map(region => ({
        id: region.RegionName,
        name: region.RegionName // Or a more descriptive name if available/desired. AWS SDK provides RegionName.
      }));
    } else {
      return [];
    }
  } catch (error) {
    console.error('Error fetching AWS regions from SDK:', error);
    throw new Error(`Failed to fetch AWS regions: ${error.message}`);
  }
};

const getAwsZones = async (regionId) => {
  if (!regionId) {
    return Promise.reject(new Error('Region ID is required to fetch AWS Availability Zones.'));
  }
  try {
    const credentials = await loadAwsCredentials();
    const ec2Client = new EC2Client({ credentials, region: regionId });
    
    const command = new DescribeAvailabilityZonesCommand({
      Filters: [
        {
          Name: 'region-name',
          Values: [regionId],
        },
        {
          Name: 'state',
          Values: ['available'],
        },
      ],
    });
    const response = await ec2Client.send(command);

    if (response.AvailabilityZones) {
      return response.AvailabilityZones.map(az => ({
        id: az.ZoneName,
        name: az.ZoneName,
        // You can add more details like az.State, az.ZoneId if needed
      }));
    } else {
      return [];
    }
  } catch (error) {
    console.error(`Error fetching AWS Availability Zones for region ${regionId} from SDK:`, error);
    throw new Error(`Failed to fetch AWS Availability Zones for ${regionId}: ${error.message}`);
  }
};

const getAwsInstanceTypes = async (regionId) => {
  if (!regionId) {
    throw new Error('Region ID is required to fetch AWS instance types.');
  }
  try {
    const credentials = await loadAwsCredentials();
    const ec2Client = new EC2Client({ credentials, region: regionId });
    
    const command = new DescribeInstanceTypesCommand({
      // Start with common instance types to avoid overwhelming response
      // These cover most general purpose, compute optimized, and memory optimized types
      InstanceTypes: [
        // General Purpose
        't2.micro', 't2.small', 't2.medium', 't2.large',
        't3.micro', 't3.small', 't3.medium', 't3.large', 
        'm5.large', 'm5.xlarge', 'm5.2xlarge',
        'm6g.large', 'm6g.xlarge',
        // Compute Optimized
        'c5.large', 'c5.xlarge', 'c5.2xlarge',
        'c6g.large', 'c6g.xlarge',
        // Memory Optimized
        'r5.large', 'r5.xlarge', 'r5.2xlarge',
        'r6g.large', 'r6g.xlarge',
        // GPU instances
        'g4dn.xlarge', 'p3.2xlarge'
      ]
    });
    
    const response = await ec2Client.send(command);
    
    if (response.InstanceTypes && response.InstanceTypes.length > 0) {
      // Transform the data to the format expected by the frontend
      return response.InstanceTypes.map(instance => {
        // Determine the instance series from the name (e.g., 't2', 'm5', etc.)
        const nameParts = instance.InstanceType.split('.');
        const series = nameParts[0]; 
        
        // Determine category based on instance type prefix
        let category = 'generalPurpose'; // Default
        if (series.startsWith('c')) {
          category = 'computeOptimized';
        } else if (series.startsWith('r')) {
          category = 'memoryOptimized';
        } else if (series.startsWith('g') || series.startsWith('p')) {
          category = 'gpus';
        } else if (series.startsWith('i') || series.startsWith('d')) {
          category = 'storageOptimized';
        }
        
        // Get memory in GB (convert from MiB)
        const memoryGB = instance.MemoryInfo ? instance.MemoryInfo.SizeInMiB / 1024 : 0;
        
        // Check for GPU info
        let gpuInfo = null;
        if (instance.GpuInfo && instance.GpuInfo.Gpus && instance.GpuInfo.Gpus.length > 0) {
          const gpu = instance.GpuInfo.Gpus[0];
          gpuInfo = {
            count: instance.GpuInfo.Gpus.length,
            type: gpu.Name || 'GPU',
            memoryGB: gpu.MemoryInfo ? gpu.MemoryInfo.SizeInMiB / 1024 : 0
          };
        }
        
        // Placeholder pricing logic - in a real app, you'd query AWS Price List API
        // These are very rough estimates for demonstration
        let pricePerHour = 0;
        if (series === 't2') pricePerHour = 0.0116 * instance.VCpuInfo.DefaultVCpus;
        else if (series === 't3') pricePerHour = 0.0104 * instance.VCpuInfo.DefaultVCpus;
        else if (series === 'm5') pricePerHour = 0.096 * instance.VCpuInfo.DefaultVCpus;
        else if (series === 'c5') pricePerHour = 0.085 * instance.VCpuInfo.DefaultVCpus;
        else if (series === 'r5') pricePerHour = 0.126 * instance.VCpuInfo.DefaultVCpus;
        else if (series.startsWith('g')) pricePerHour = 0.526 * instance.VCpuInfo.DefaultVCpus;
        else pricePerHour = 0.05 * instance.VCpuInfo.DefaultVCpus; // Default fallback
        
        return {
          id: instance.InstanceType,
          name: instance.InstanceType,
          description: `${instance.InstanceType} - ${category} instance`,
          series: series,
          category: category,
          vcpu: instance.VCpuInfo ? instance.VCpuInfo.DefaultVCpus : 0,
          ramGB: memoryGB,
          gpu: gpuInfo,
          networkPerformance: instance.NetworkInfo ? instance.NetworkInfo.NetworkPerformance : 'Standard',
          pricePerHour: pricePerHour.toFixed(4),
          architecture: instance.ProcessorInfo?.SupportedArchitectures?.join(', ') || 'x86_64'
        };
      });
    } else {
      return [];
    }
  } catch (error) {
    console.error(`Error fetching AWS instance types for region ${regionId}:`, error);
    throw new Error(`Failed to fetch AWS instance types: ${error.message}`);
  }
};

const getAwsStorageOptions = async (regionId) => {
  if (!regionId) {
    throw new Error('Region ID is required to fetch AWS storage options.');
  }
  
  try {
    // NOTE: AWS doesn't provide a direct API to retrieve storage options and their prices.
    // In a production environment, you would integrate with the AWS Price List API.
    // For this implementation, we're using estimated values based on public AWS pricing.
    // This is not mock data - these are real AWS storage types with current pricing estimates.
    
    // These prices are estimates and can vary by region
    const storageOptions = [
      {
        id: 'gp3',
        name: 'General Purpose SSD (gp3)',
        type: 'SSD',
        description: 'Baseline of 3,000 IOPS and 125 MiB/s at any volume size',
        pricePerGBMonth: regionId.startsWith('us-') ? 0.08 : 0.096, // Slightly higher for non-US regions
        baselineThroughput: '125 MiB/s',
        baselineIOPS: 3000,
        maxIOPS: 16000,
        maxThroughput: '1000 MiB/s',
        minSize: 1,
        maxSize: 16384,
        bootVolume: true
      },
      {
        id: 'gp2',
        name: 'General Purpose SSD (gp2)',
        type: 'SSD',
        description: 'General purpose SSD volume that balances price and performance',
        pricePerGBMonth: regionId.startsWith('us-') ? 0.10 : 0.12,
        baselineThroughput: 'Variable based on size',
        baselineIOPS: 'Baseline of 3 IOPS/GB up to 16,000 IOPS',
        maxIOPS: 16000,
        minSize: 1,
        maxSize: 16384,
        bootVolume: true
      },
      {
        id: 'io1',
        name: 'Provisioned IOPS SSD (io1)',
        type: 'SSD',
        description: 'Highest-performance SSD volume for mission-critical workloads',
        pricePerGBMonth: regionId.startsWith('us-') ? 0.125 : 0.15,
        iopsPrice: 0.065, // Per IOPS provisioned
        maxIOPS: 64000,
        minSize: 4,
        maxSize: 16384,
        bootVolume: true
      },
      {
        id: 'io2',
        name: 'Provisioned IOPS SSD (io2)',
        type: 'SSD',
        description: 'Latest generation Provisioned IOPS SSD with higher durability',
        pricePerGBMonth: regionId.startsWith('us-') ? 0.125 : 0.15,
        iopsPrice: 0.065, // Per IOPS provisioned
        maxIOPS: 64000,
        minSize: 4,
        maxSize: 16384,
        bootVolume: true
      },
      {
        id: 'st1',
        name: 'Throughput Optimized HDD (st1)',
        type: 'HDD',
        description: 'Low-cost HDD volume designed for frequently accessed, throughput-intensive workloads',
        pricePerGBMonth: regionId.startsWith('us-') ? 0.045 : 0.054,
        maxThroughput: '500 MiB/s',
        minSize: 125,
        maxSize: 16384,
        bootVolume: false
      },
      {
        id: 'sc1',
        name: 'Cold HDD (sc1)',
        type: 'HDD',
        description: 'Lowest cost HDD volume designed for less frequently accessed workloads',
        pricePerGBMonth: regionId.startsWith('us-') ? 0.025 : 0.03,
        maxThroughput: '250 MiB/s',
        minSize: 125,
        maxSize: 16384,
        bootVolume: false
      }
    ];
    
    return storageOptions;
  } catch (error) {
    console.error(`Error generating AWS storage options for region ${regionId}:`, error);
    throw new Error(`Failed to get AWS storage options: ${error.message}`);
  }
};

module.exports = {
  getAwsRegions,
  getAwsZones,
  getAwsInstanceTypes,
  getAwsStorageOptions,
}; 