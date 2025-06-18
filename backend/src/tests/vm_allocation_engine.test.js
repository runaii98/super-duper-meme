/**
 * VM Allocation Engine Test Script
 * 
 * This script tests the functionality of the VM allocation engine
 * Run from main_server/ directory with: node tests/vm_allocation_engine.test.js
 */

const vmAllocationEngine = require('../vm_allocation_engine/index'); // Updated path
const latencyEstimator = require('../vm_allocation_engine/latency_estimator'); // Updated path
const allocationAlgorithm = require('../vm_allocation_engine/allocation_algorithm'); // Updated path
const gcpPriceFetcher = require('../vm_allocation_engine/price_fetchers/gcp_price_fetcher'); // Updated path
const awsPriceFetcher = require('../vm_allocation_engine/price_fetchers/aws_price_fetcher'); // Updated path
const credentialsManager = require('../vm_allocation_engine/credentials_manager'); // Updated path

// Mock data for testing fallback if API calls fail
const mockPrices = [
    {
        provider: 'GCP',
        resourceType: 'CPU',
        vcpu: 2,
        ramGB: 8,
        region: 'us-central1',
        pricingModel: 'OnDemand',
        pricePerHour: 0.0475,
        currency: 'USD'
    },
    {
        provider: 'GCP',
        resourceType: 'CPU',
        vcpu: 4,
        ramGB: 16,
        region: 'us-central1',
        pricingModel: 'OnDemand',
        pricePerHour: 0.0950,
        currency: 'USD'
    },
    {
        provider: 'GCP',
        resourceType: 'GPU',
        vcpu: 4,
        ramGB: 16,
        gpuType: 'NVIDIA T4',
        gpuCount: 1,
        vramGB: 16,
        region: 'us-central1',
        pricingModel: 'OnDemand',
        pricePerHour: 0.3500,
        currency: 'USD'
    },
    {
        provider: 'AWS',
        instanceType: 't3.medium',
        vcpu: 2,
        ramGB: 4,
        region: 'us-east1',
        pricingModel: 'OnDemand',
        pricePerHour: 0.0416,
        currency: 'USD'
    },
    {
        provider: 'AWS',
        instanceType: 'g4dn.xlarge',
        vcpu: 4,
        ramGB: 16,
        gpuType: 'NVIDIA T4',
        gpuCount: 1,
        vramGB: 16,
        region: 'us-east1',
        pricingModel: 'OnDemand',
        pricePerHour: 0.5260,
        currency: 'USD'
    }
];

/**
 * Check if both AWS and GCP credentials are valid
 * @returns {Promise<boolean>} True if both are valid
 */
async function areCredentialsValid() {
    try {
        // Try to load both credential files
        await credentialsManager.loadGcpCredentials();
        await credentialsManager.loadAwsCredentials();
        return true;
    } catch (error) {
        console.error('Credential validation failed:', error.message);
        return false;
    }
}

/**
 * Initialize the cloud API clients
 */
async function initializeCloudClients() {
    try {
        // Initialize GCP client
        await gcpPriceFetcher.initGcpClient();
        
        // Initialize AWS client
        await awsPriceFetcher.initAwsClient();
        
        console.log('Cloud clients initialized successfully!');
        return true;
    } catch (error) {
        console.error('Error initializing cloud clients:', error);
        return false;
    }
}

// Test both with real APIs and with mock data as fallback
async function runTests() {
    console.log('Running VM Allocation Engine tests...');
    
    // Check if credentials are valid
    const credentialsValid = await areCredentialsValid();
    console.log(`Credentials validation: ${credentialsValid ? 'PASSED' : 'FAILED'}`);
    
    // Initialize cloud clients if credentials are valid
    let useRealAPIs = false;
    if (credentialsValid) {
        useRealAPIs = await initializeCloudClients();
    }
    
    // If we can't use real APIs, use mock data
    if (!useRealAPIs) {
        console.log('Using mock data for pricing information');
        // Override the getAllPricingData function for testing
        allocationAlgorithm.getAllPricingData = async () => mockPrices;
    }
    
    // Initialize the engine
    console.log('\n----- Initializing VM Allocation Engine -----');
    const initResult = await vmAllocationEngine.initialize(useRealAPIs);
    console.log('Initialization result:', initResult);
    
    // Test user location detection
    console.log('\n----- Testing User Location Detection -----');
    const locationResult = await vmAllocationEngine.getUserLocation('8.8.8.8'); // Google DNS IP for testing
    console.log('User location result:', locationResult);
    
    // Get region latencies
    console.log('\n----- Testing Region Latencies -----');
    const latencyResult = await vmAllocationEngine.getRegionLatencies('8.8.8.8');
    
    // Display first 5 regions with lowest latency
    if (latencyResult.success && latencyResult.regions) {
        console.log('First 5 regions with lowest latency:');
        latencyResult.regions.slice(0, 5).forEach(region => {
            console.log(`- ${region.region} (${region.provider}): ${region.displayName}, Latency: ${region.latencyMs.toFixed(2)}ms`);
        });
    } else {
        console.log('Region latency result:', latencyResult);
    }
    
    // Test VM allocation with basic CPU requirements
    console.log('\n----- Testing VM Allocation (Basic CPU) -----');
    const basicResult = await vmAllocationEngine.findOptimalInstance({
        hardware: {
            vcpu: 2,
            ramGB: 4
        },
        pricingModel: 'OnDemand',
        userIpAddress: '8.8.8.8',
        appType: 'app'
    });
    
    if (basicResult.success) {
        console.log('Basic allocation successful:');
        console.log(`- Provider: ${basicResult.provider}`);
        console.log(`- Region: ${basicResult.region}`);
        console.log(`- Price: $${basicResult.estimatedPricePerHour.toFixed(4)}/hour`);
        console.log(`- Latency: ${basicResult.latencyMs.toFixed(2)}ms`);
    } else {
        console.log('Basic allocation failed:', basicResult.error);
    }
    
    // Test VM allocation with GPU requirements
    console.log('\n----- Testing VM Allocation (GPU) -----');
    const gpuResult = await vmAllocationEngine.findOptimalInstance({
        hardware: {
            vcpu: 4,
            ramGB: 16,
            gpuCount: 1,
            vramGB: 16
        },
        pricingModel: 'OnDemand',
        userIpAddress: '8.8.8.8',
        appType: 'app'
    });
    
    if (gpuResult.success) {
        console.log('GPU allocation successful:');
        console.log(`- Provider: ${gpuResult.provider}`);
        console.log(`- Region: ${gpuResult.region}`);
        console.log(`- Price: $${gpuResult.estimatedPricePerHour.toFixed(4)}/hour`);
        console.log(`- Latency: ${gpuResult.latencyMs.toFixed(2)}ms`);
        console.log(`- GPU: ${gpuResult.vm.gpuType || 'Unknown'}`);
    } else {
        console.log('GPU allocation failed:', gpuResult.error);
    }
    
    if (useRealAPIs) {
        // Test sample prices (only if using real APIs)
        console.log('\n----- Testing Sample Price Fetching -----');
        try {
            const gcpSample = await gcpPriceFetcher.fetchSampleGcpPrices();
            console.log(`Fetched ${gcpSample.length} GCP samples`);
            if (gcpSample.length > 0) {
                console.log('Sample GCP SKU:', gcpSample[0]);
            }
            
            const awsSample = await awsPriceFetcher.fetchSampleAwsPrices();
            console.log(`Fetched ${awsSample.length} AWS samples`);
            if (awsSample.length > 0) {
                console.log('Sample AWS Instance:', awsSample[0]);
            }
        } catch (error) {
            console.error('Error fetching sample prices:', error.message);
        }
    } else {
        // Test requirement checker with mock data
        console.log('\n----- Testing Requirements Checker -----');
        console.log('Check if VM meets requirements:');
        
        const vm1 = mockPrices[0]; // 2 vCPU, 8GB RAM
        const vm2 = mockPrices[2]; // GPU VM
        
        const reqs1 = { vcpu: 2, ramGB: 4 };
        const reqs2 = { vcpu: 4, ramGB: 16, gpuCount: 1 };
        const reqs3 = { vcpu: 8, ramGB: 32 }; // Not satisfiable
        
        console.log(`VM1 meets basic requirements: ${allocationAlgorithm.vmMeetsRequirements(reqs1, vm1)}`);
        console.log(`VM1 meets high requirements: ${allocationAlgorithm.vmMeetsRequirements(reqs3, vm1)}`);
        console.log(`VM2 meets GPU requirements: ${allocationAlgorithm.vmMeetsRequirements(reqs2, vm2)}`);
    }
    
    // Test latency estimation
    console.log('\n----- Testing Latency Estimation -----');
    const distKm = latencyEstimator.haversineDistance(37.7749, -122.4194, 40.7128, -74.0060);
    const latencyMs = latencyEstimator.estimateLatencyFromDistance(distKm);
    
    console.log(`Distance from San Francisco to New York: ${distKm.toFixed(2)} km`);
    console.log(`Estimated latency: ${latencyMs.toFixed(2)} ms`);
    
    console.log('\nAll tests completed!');
}

// Run the tests
runTests().catch(error => {
    console.error('Error running tests:', error);
    process.exit(1); // Exit with error code
}); 