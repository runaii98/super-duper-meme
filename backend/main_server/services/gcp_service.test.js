/**
 * @jest-environment node
 */
const { 
  getGcpRegions, 
  getGcpZones, 
  getGcpMachineTypes, 
  getGcpDiskTypes 
} = require('./gcp_service');

// Mock the Google Cloud Compute modules
jest.mock('@google-cloud/compute', () => {
  // Create mock clients with list methods
  const mockList = jest.fn();
  const mockRegionsClient = jest.fn().mockImplementation(() => ({
    list: mockList
  }));
  const mockZonesClient = jest.fn().mockImplementation(() => ({
    list: mockList
  }));
  const mockMachineTypesClient = jest.fn().mockImplementation(() => ({
    list: mockList
  }));
  const mockDiskTypesClient = jest.fn().mockImplementation(() => ({
    list: mockList
  }));

  return {
    RegionsClient: mockRegionsClient,
    ZonesClient: mockZonesClient,
    MachineTypesClient: mockMachineTypesClient,
    DiskTypesClient: mockDiskTypesClient,
    __mockList: mockList // Expose for test control
  };
});

// Mock the credentials manager
jest.mock('../vm_allocation_engine/credentials_manager', () => ({
  loadGcpCredentials: jest.fn().mockResolvedValue({ 
    project_id: 'test-project-id' 
  })
}));

// Get reference to the mock list function
const { __mockList } = require('@google-cloud/compute');

describe('GCP Service', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getGcpRegions', () => {
    it('should return a list of GCP regions', async () => {
      // Mock the regions response
      __mockList.mockResolvedValueOnce([
        [
          { name: 'us-central1', status: 'UP' },
          { name: 'us-east1', status: 'UP' }
        ]
      ]);

      // Call the function
      const result = await getGcpRegions();

      // Assertions
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'us-central1',
        name: 'Us Central1',
        status: 'UP'
      });
      expect(result[1]).toEqual({
        id: 'us-east1',
        name: 'Us East1',
        status: 'UP'
      });
      expect(__mockList).toHaveBeenCalledWith({
        project: 'test-project-id'
      });
    });

    it('should handle errors gracefully', async () => {
      // Mock a failure
      __mockList.mockRejectedValueOnce(new Error('GCP Error'));

      // Call and expect it to throw
      await expect(getGcpRegions()).rejects.toThrow('Failed to fetch GCP regions');
    });
  });

  describe('getGcpZones', () => {
    it('should return zones for a given region', async () => {
      // Mock the zones response
      __mockList.mockResolvedValueOnce([
        [
          { name: 'us-central1-a', status: 'UP' },
          { name: 'us-central1-b', status: 'UP' },
          { name: 'us-central1-c', status: 'UP' }
        ]
      ]);

      // Call the function
      const result = await getGcpZones('us-central1');

      // Assertions
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ id: 'us-central1-a', name: 'us-central1-a' });
      expect(result[1]).toEqual({ id: 'us-central1-b', name: 'us-central1-b' });
      expect(result[2]).toEqual({ id: 'us-central1-c', name: 'us-central1-c' });
      expect(__mockList).toHaveBeenCalledWith({
        project: 'test-project-id',
        filter: 'name:us-central1-*'
      });
    });

    it('should throw an error if no region is provided', async () => {
      await expect(getGcpZones()).rejects.toThrow('Region is required');
    });

    it('should handle errors gracefully', async () => {
      __mockList.mockRejectedValueOnce(new Error('GCP Error'));
      await expect(getGcpZones('us-central1')).rejects.toThrow('Failed to fetch GCP zones');
    });
  });

  describe('getGcpMachineTypes', () => {
    it('should return machine types for a given zone', async () => {
      // Mock the machine types response
      __mockList.mockResolvedValueOnce([
        [
          {
            name: 'e2-standard-2',
            guestCpus: 2,
            memoryMb: 8192, // 8GB
            description: 'E2 standard machine with 2 vCPUs and 8GB memory'
          },
          {
            name: 'n2-standard-4',
            guestCpus: 4,
            memoryMb: 16384, // 16GB
            description: 'N2 standard machine with 4 vCPUs and 16GB memory'
          },
          {
            name: 'c2-standard-8',
            guestCpus: 8,
            memoryMb: 32768, // 32GB
            description: 'C2 compute-optimized machine with 8 vCPUs and 32GB memory'
          }
        ]
      ]);

      // Call the function
      const result = await getGcpMachineTypes('us-central1-a');

      // Assertions
      expect(result).toHaveLength(3);
      
      // Check general properties
      expect(result[0].id).toBe('e2-standard-2');
      expect(result[0].series).toBe('e2');
      expect(result[0].category).toBe('generalPurpose');
      expect(result[0].vcpu).toBe(2);
      expect(result[0].ramGB).toBe(8);
      
      // Check compute-optimized instance
      expect(result[2].id).toBe('c2-standard-8');
      expect(result[2].series).toBe('c2');
      expect(result[2].category).toBe('computeOptimized');
      expect(result[2].vcpu).toBe(8);
      expect(result[2].ramGB).toBe(32);
      
      // Check API call
      expect(__mockList).toHaveBeenCalledWith({
        project: 'test-project-id',
        zone: 'us-central1-a'
      });
    });

    it('should throw an error if no zone is provided', async () => {
      await expect(getGcpMachineTypes()).rejects.toThrow('Zone is required');
    });

    it('should handle errors gracefully', async () => {
      __mockList.mockRejectedValueOnce(new Error('GCP Error'));
      await expect(getGcpMachineTypes('us-central1-a')).rejects.toThrow('Failed to fetch GCP machine types');
    });
  });

  describe('getGcpDiskTypes', () => {
    it('should return disk types for a given zone', async () => {
      // Mock the disk types response
      __mockList.mockResolvedValueOnce([
        [
          {
            name: 'zones/us-central1-a/diskTypes/pd-standard',
            description: 'Standard persistent disk'
          },
          {
            name: 'zones/us-central1-a/diskTypes/pd-ssd',
            description: 'SSD persistent disk'
          },
          {
            name: 'zones/us-central1-a/diskTypes/pd-balanced',
            description: 'Balanced persistent disk'
          }
        ]
      ]);

      // Call the function
      const result = await getGcpDiskTypes('us-central1-a');

      // Assertions
      expect(result).toHaveLength(3);
      
      // Check for standard HDD
      const standardDisk = result.find(disk => disk.id === 'pd-standard');
      expect(standardDisk).toBeDefined();
      expect(standardDisk.type).toBe('HDD');
      expect(standardDisk.description).toBe('Standard persistent disk (HDD)');
      
      // Check for SSD
      const ssdDisk = result.find(disk => disk.id === 'pd-ssd');
      expect(ssdDisk).toBeDefined();
      expect(ssdDisk.type).toBe('SSD');
      expect(ssdDisk.description).toBe('SSD persistent disk');
      
      // Check for balanced SSD
      const balancedDisk = result.find(disk => disk.id === 'pd-balanced');
      expect(balancedDisk).toBeDefined();
      expect(balancedDisk.type).toBe('SSD');
      expect(balancedDisk.description).toBe('Balanced persistent disk (SSD)');
      
      // Check API call
      expect(__mockList).toHaveBeenCalledWith({
        project: 'test-project-id',
        zone: 'us-central1-a'
      });
    });

    it('should use different pricing for non-US regions', async () => {
      // Mock the disk types response for a non-US region
      __mockList.mockResolvedValueOnce([
        [
          {
            name: 'zones/europe-west1-b/diskTypes/pd-standard',
            description: 'Standard persistent disk'
          }
        ]
      ]);

      // Call the function with a non-US zone
      const result = await getGcpDiskTypes('europe-west1-b');

      // Check that the pricing is adjusted for non-US regions
      const standardDisk = result.find(disk => disk.id === 'pd-standard');
      expect(standardDisk.pricePerGBMonth).toBeGreaterThan(0.04); // Base US price
    });

    it('should throw an error if no zone is provided', async () => {
      await expect(getGcpDiskTypes()).rejects.toThrow('Zone is required');
    });

    it('should handle errors gracefully', async () => {
      __mockList.mockRejectedValueOnce(new Error('GCP Error'));
      await expect(getGcpDiskTypes('us-central1-a')).rejects.toThrow('Failed to fetch GCP disk types');
    });
  });
}); 