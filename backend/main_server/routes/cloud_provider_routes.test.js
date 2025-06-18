/**
 * @jest-environment node
 */
const express = require('express');
const bodyParser = require('body-parser');
const request = require('supertest');

// Mock the findOptimalVm function
const mockFindOptimalVm = jest.fn();

// Mock the module before requiring the router
jest.mock('../vm_allocation_engine/region_selector', () => ({
  findOptimalVm: mockFindOptimalVm
}));

// Import the router after the mock
const router = require('./cloud_provider_routes');

describe('Cloud Provider Routes', () => {
  let app;

  beforeEach(() => {
    // Create a fresh Express app for each test with proper middleware
    app = express();
    app.use(bodyParser.json()); // This is crucial for parsing JSON request bodies
    app.use('/api/providers', router);
    
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('POST /fetch-vm-provider', () => {
    it('should return appropriate VM options when valid parameters are provided', async () => {
      // Mock the findOptimalVm function to return test data
      const mockResults = [
        { 
          provider: 'AWS', 
          instance_type: 't2.micro', 
          vcpu: 1, 
          ram_gb: 1, 
          price_per_hour: 0.0116 
        },
        { 
          provider: 'AWS', 
          instance_type: 't3.small', 
          vcpu: 2, 
          ram_gb: 2, 
          price_per_hour: 0.0208 
        },
        { 
          provider: 'AWS', 
          instance_type: 'c5.large', 
          vcpu: 2, 
          ram_gb: 4, 
          price_per_hour: 0.0850 
        }
      ];
      
      mockFindOptimalVm.mockResolvedValue(mockResults);

      // Make the request
      const response = await request(app)
        .post('/api/providers/fetch-vm-provider')
        .send({ provider: 'aws', vCPU: 2, ramGB: 2 })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200);

      // Assertions
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('categorizedResults');
      expect(mockFindOptimalVm).toHaveBeenCalled();
      expect(mockFindOptimalVm).toHaveBeenCalledWith(expect.objectContaining({
        vcpu: 2,
        ram_gb: 2
      }));
    });

    it('should handle GPU requirements', async () => {
      // Mock the findOptimalVm function to return test data
      const mockResults = [
        { 
          provider: 'AWS', 
          instance_type: 'g4dn.xlarge', 
          vcpu: 4, 
          ram_gb: 16, 
          gpu_type: 'NVIDIA T4',
          gpu_count: 1,
          price_per_hour: 0.526 
        }
      ];
      
      mockFindOptimalVm.mockResolvedValue(mockResults);

      // Make the request
      const response = await request(app)
        .post('/api/providers/fetch-vm-provider')
        .send({ 
          provider: 'aws', 
          vCPU: 4, 
          ramGB: 16, 
          gpuType: 'nvidia-t4', 
          gpuCount: 1 
        })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200);

      // Assertions
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('categorizedResults');
      expect(mockFindOptimalVm).toHaveBeenCalled();
      expect(mockFindOptimalVm).toHaveBeenCalledWith(expect.objectContaining({
        vcpu: 4,
        ram_gb: 16,
        gpu_type: 'nvidia-t4',
        gpu_count: 1
      }));
    });

    it('should handle storage requirements', async () => {
      // Mock the findOptimalVm function to return test data
      const mockResults = [
        { 
          provider: 'AWS', 
          instance_type: 't3.medium', 
          vcpu: 2, 
          ram_gb: 4, 
          price_per_hour: 0.0416,
          storage_type: 'gp3',
          storage_gb: 100
        }
      ];
      
      mockFindOptimalVm.mockResolvedValue(mockResults);

      // Make the request
      const response = await request(app)
        .post('/api/providers/fetch-vm-provider')
        .send({ 
          provider: 'aws', 
          vCPU: 2, 
          ramGB: 4, 
          storageType: 'gp3', 
          storageGB: 100 
        })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200);

      // Assertions
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('categorizedResults');
      expect(mockFindOptimalVm).toHaveBeenCalled();
      expect(mockFindOptimalVm).toHaveBeenCalledWith(expect.objectContaining({
        vcpu: 2,
        ram_gb: 4,
        storage_type: 'gp3',
        storage_gb: 100
      }));
    });

    it('should return 400 if required parameters are missing', async () => {
      // Make the request without required parameters
      const response = await request(app)
        .post('/api/providers/fetch-vm-provider')
        .send({})
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400);

      // Assertions
      expect(response.body).toHaveProperty('error');
      expect(mockFindOptimalVm).not.toHaveBeenCalled();
    });

    it('should return 500 if findOptimalVm throws an error', async () => {
      // Mock the findOptimalVm function to throw an error
      mockFindOptimalVm.mockRejectedValue(new Error('Test error'));

      // Make the request
      const response = await request(app)
        .post('/api/providers/fetch-vm-provider')
        .send({ provider: 'aws', vCPU: 2, ramGB: 2 })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(500);

      // Assertions
      expect(response.body).toHaveProperty('error');
      expect(mockFindOptimalVm).toHaveBeenCalled();
    });
  });
}); 