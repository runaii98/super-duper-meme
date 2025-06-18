/**
 * VM Allocation Algorithm
 * 
 * Implements the core logic for selecting the optimal VM instance
 * based on user requirements, pricing, and latency constraints
 */

const latencyEstimator = require('./latency_estimator');
const priceCache = require('./data_store/price_cache'); // Adjusted path
const { fetchGcpVmPrices, fetchSampleGcpPrices } = require('./price_fetchers/gcp_price_fetcher');
const { fetchAwsVmPrices, fetchAwsOnDemandPrices } = require('./price_fetchers/aws_price_fetcher');
const { generateCacheKey, standardizePricing } = require('./price_fetchers/common');
const gcpPriceFetcher = require('./price_fetchers/gcp_price_fetcher');
const awsOnDemandPriceFetcher = require('./price_fetchers/aws_price_fetcher');

// Cache duration in milliseconds
const PRICE_CACHE_DURATION = 3600000; // 1 hour

/**
 * Refresh all price data and update the cache
 * @returns {Promise<Object>} Statistics about the refresh operation
 */
async function refreshAllPriceData() {
    const startTime = Date.now();
    const stats = { success: true, providers: {} };

    try {
        // GCP OnDemand prices
        const gcpOnDemandPrices = await fetchGcpVmPrices();
        if (gcpOnDemandPrices.length > 0) {
            const cacheKey = generateCacheKey('GCP', 'OnDemand');
            await priceCache.saveToCache(cacheKey, gcpOnDemandPrices);
            stats.providers.gcpOnDemand = {
                count: gcpOnDemandPrices.length,
                success: true
            };
        } else {
            stats.providers.gcpOnDemand = {
                count: 0,
                success: false,
                error: 'No prices returned'
            };
        }

        // AWS OnDemand prices
        const awsOnDemandPrices = await fetchAwsOnDemandPrices();
        if (awsOnDemandPrices.length > 0) {
            const cacheKey = generateCacheKey('AWS', 'OnDemand');
            await priceCache.saveToCache(cacheKey, awsOnDemandPrices);
            stats.providers.awsOnDemand = {
                count: awsOnDemandPrices.length,
                success: true
            };
        } else {
            stats.providers.awsOnDemand = {
                count: 0,
                success: false,
                error: 'No prices returned'
            };
        }

        // Additional price types (Spot, etc.) would be handled similarly

        stats.duration = Date.now() - startTime;
        return stats;
    } catch (error) {
        console.error('Error refreshing price data:', error);
        stats.success = false;
        stats.error = error.message;
        return stats;
    }
}

/**
 * Get all pricing data (from cache or fetch if needed)
 * @param {string} provider - Cloud provider ('GCP', 'AWS', or undefined for both)
 * @param {string} pricingModel - Pricing model ('OnDemand', 'Spot', or undefined for both)
 * @returns {Promise<Array>} Array of standardized pricing objects
 */
async function getAllPricingData(provider, pricingModel) {
    // Log the request parameters
    console.log(`[Allocation] Requesting pricing data for provider: ${provider}, model: ${pricingModel}`);
    
    let result = [];
    if (provider === 'AWS' || provider === 'all') {
        if (pricingModel === 'OnDemand' || pricingModel === 'all') {
            const awsPrices = await awsOnDemandPriceFetcher.loadAwsOnDemandPrices();
            console.log(`[Allocation] Loaded ${awsPrices.length} AWS OnDemand instances`);
            result = result.concat(awsPrices);
        }
        if (pricingModel === 'Spot' || pricingModel === 'all') {
            // Use the actual AWS Spot prices fetcher
            const awsSpotPrices = await awsOnDemandPriceFetcher.loadAwsSpotPrices();
            console.log(`[Allocation] Loaded ${awsSpotPrices.length} AWS Spot instances`);
            result = result.concat(awsSpotPrices);
        }
    }
    
    if (provider === 'GCP' || provider === 'all') {
        const gcpPrices = await gcpPriceFetcher.loadGcpPrices();
        console.log(`[Allocation] Loaded ${gcpPrices.length} GCP instances`);
        
        // Sample log of a few GCP instances to verify format
        if (gcpPrices.length > 0) {
            console.log(`[Allocation] GCP instance samples:`);
            const sampleSize = Math.min(5, gcpPrices.length);
            for (let i = 0; i < sampleSize; i++) {
                console.log(`[Allocation] GCP Sample ${i+1}:`, JSON.stringify(gcpPrices[i], null, 2));
            }
            
            // Filter only instances matching requested pricing model
            if (pricingModel !== 'all') {
                const filteredGcpPrices = gcpPrices.filter(instance => 
                    instance.pricing_model === pricingModel || instance.pricingModel === pricingModel);
                
                console.log(`[Allocation] After pricing model filter, ${filteredGcpPrices.length} GCP instances remain (model=${pricingModel})`);
                result = result.concat(filteredGcpPrices);
            } else {
                result = result.concat(gcpPrices);
            }
        } else {
            console.log(`[Allocation] WARNING: No GCP instances loaded, check gcp_price_fetcher.js`);
        }
    }
    
    return result;
}

/**
 * Check if a VM configuration meets the required hardware resources
 * @param {Object} resourceRequirements - Required resources {vcpu, ramGB, gpuType, vramGB, gpuCount}
 * @param {Object} vm - VM configuration to check
 * @returns {boolean} True if VM meets requirements
 */
function vmMeetsRequirements(resourceRequirements, vm) {
    // Add verbose logging for the first few instances to track evaluation
    if (!vmMeetsRequirements.detailedLogCount) {
        vmMeetsRequirements.detailedLogCount = 0;
    }
    const shouldLogDetailed = vmMeetsRequirements.detailedLogCount < 10;
    
    // Log the start of checking a instance, limited to first few
    if (shouldLogDetailed) {
        console.log(`[Requirements] Checking vm ${vmMeetsRequirements.detailedLogCount+1}: ${vm.provider} ${vm.instance_sku_id || vm.skuId} in ${vm.region}`);
        vmMeetsRequirements.detailedLogCount++;
    }
    
    // CPU check - VM must have at least the required vCPUs
    if (resourceRequirements.vcpu && vm.vcpu < resourceRequirements.vcpu) {
        return false;
    }
    
    // RAM check - VM must have at least the required RAM
    if (resourceRequirements.ramGB && vm.ramGB < resourceRequirements.ramGB) {
        return false;
    }
    
    // GPU count check - VM must have at least the required number of GPUs
    if (resourceRequirements.gpuCount && 
        (!vm.gpuCount || vm.gpuCount < resourceRequirements.gpuCount)) {
        return false;
    }
    
    // GPU type check - If specific type required, VM must have that type
    if (resourceRequirements.gpuType && vm.gpuType &&
        !vm.gpuType.toUpperCase().includes(resourceRequirements.gpuType.toUpperCase())) {
        return false;
    }
    
    // VRAM check - VM must have at least the required VRAM
    if (resourceRequirements.vramGB && 
        (!vm.vramGB || vm.vramGB < resourceRequirements.vramGB)) {
        return false;
    }
    
    return true;
}

/**
 * Find the optimal VM instance based on user requirements
 * @param {Object} userInput - User input params
 * @param {Object} userInput.hardware - Hardware requirements {vcpu, ramGB, gpuType, vramGB, gpuCount}
 * @param {string} userInput.pricingModel - Pricing model ('OnDemand' or 'Spot')
 * @param {string} userInput.userIpAddress - User's IP address for latency calculation
 * @param {string} userInput.appType - Type of app ('app' or 'model') for latency threshold
 * @returns {Promise<Object>} Selected VM instance and allocation details
 */
async function findOptimalInstance(userInput) {
    try {
        // Validate inputs
        if (!userInput || !userInput.hardware || !userInput.userIpAddress) {
            return {
                error: 'Invalid input: Missing required parameters',
                success: false
            };
        }
        
        // Set defaults if not provided
        const pricingModel = userInput.pricingModel || 'OnDemand';
        const appType = userInput.appType || 'app';
        
        // Determine max latency based on app type
        const maxLatencyMs = appType === 'app' ? 150 : 100;
        
        // Get user location from IP address
        const userLocation = await latencyEstimator.getUserLocationFromIp(userInput.userIpAddress);
        
        // Get regions within latency constraints
        const regions = latencyEstimator.getRegionsByLatency(userLocation, maxLatencyMs);
        
        if (regions.length === 0) {
            return {
                error: 'No regions found within acceptable latency',
                success: false,
                userLocation
            };
        }
        
        // Log when we start loading pricing data
        console.log(`[Allocation] Loading pricing data for all providers and models...`);
        
        // Load ALL pricing data, then filter
        const allPricing = await getAllPricingData('all', 'all');
        
        // Add a count by provider and model
        const providerCounts = {
            'AWS-OnDemand': 0,
            'AWS-Spot': 0,
            'GCP-OnDemand': 0,
            'GCP-Spot': 0
        };
        
        allPricing.forEach(instance => {
            const provider = instance.provider;
            const model = instance.pricing_model || instance.pricingModel;
            const key = `${provider}-${model}`;
            if (providerCounts[key] !== undefined) {
                providerCounts[key]++;
            }
        });
        
        console.log(`[Allocation] Provider counts:`);
        for (const [key, count] of Object.entries(providerCounts)) {
            console.log(`[Allocation] ${key}: ${count} instances`);
        }
        
        console.log(`Loaded ${allPricing.length} AWS OnDemand, AWS Spot, and GCP prices.`);
        
        if (allPricing.length === 0) {
            return {
                error: 'No pricing data available',
                success: false,
                userLocation
            };
        }
        
        // Filter VMs by region and requirements
        const candidateVMs = allPricing.filter(vm => {
            // Check if VM is in an acceptable region
            const vmRegion = regions.find(r => r.region === vm.region);
            if (!vmRegion) return false;
            
            // Add latency info to the VM object for sorting
            vm.latencyMs = vmRegion.latencyMs;
            
            // Check if VM meets hardware requirements
            return vmMeetsRequirements(userInput.hardware, vm);
        });
        
        if (candidateVMs.length === 0) {
            return {
                error: 'No suitable VMs found matching requirements within latency constraints',
                success: false,
                userLocation,
                regions: regions.map(r => r.region)
            };
        }
        
        // Sort VMs by price (cheapest first)
        candidateVMs.sort((a, b) => a.pricePerHour - b.pricePerHour);
        
        // Select the cheapest VM that meets requirements
        const selectedVM = candidateVMs[0];
        
        // Return full details
        return {
            success: true,
            vm: selectedVM,
            userLocation,
            latencyMs: selectedVM.latencyMs,
            estimatedPricePerHour: selectedVM.pricePerHour,
            region: selectedVM.region,
            provider: selectedVM.provider,
            candidatesCount: candidateVMs.length
        };
    } catch (error) {
        console.error('Error finding optimal instance:', error);
        return {
            error: `Internal server error: ${error.message}`,
            success: false
        };
    }
}

/**
 * Find a VM that exactly matches a given specification
 * Used for user-selected dedicated instances
 * 
 * @param {Object} specifications - Exact specifications to find {provider, instanceType, region}
 * @returns {Promise<Object>} Found VM spec or error message
 */
async function findExactVmSpecification(specifications) {
    try {
        if (!specifications || !specifications.provider || !specifications.instanceType || !specifications.region) {
            return {
                error: 'Invalid input: Missing required specifications (provider, instanceType, region)',
                success: false
            };
        }

        const provider = specifications.provider.toUpperCase();
        const instanceType = specifications.instanceType;
        const region = specifications.region;
        const pricingModel = specifications.pricingModel || 'OnDemand';

        // Get pricing data for the specified provider and model
        const pricingData = await getAllPricingData(provider, pricingModel);
        
        if (!pricingData || pricingData.length === 0) {
             return {
                error: `No pricing data found for ${provider} ${pricingModel}`,
                success: false
            };
        }

        // Find the specific VM
        let foundVm = null;
        if (provider === 'AWS') {
            foundVm = pricingData.find(vm => vm.instanceType === instanceType && vm.region === region);
        } else if (provider === 'GCP') {
            // GCP pricing is per resource (CPU/RAM/GPU), not predefined instance types
            // We need to find the combination of SKUs that match the instance type
            // This requires a more complex lookup or pre-built mapping
            // For now, we return an error or a placeholder
             return {
                error: 'Finding exact GCP instance types by name is not directly supported by SKU data',
                success: false
            };
        }

        if (foundVm) {
            return {
                success: true,
                vm: foundVm
            };
        } else {
            return {
                error: `VM specification not found: ${provider} ${instanceType} in ${region} (${pricingModel})`,
                success: false
            };
        }

    } catch (error) {
        console.error('Error finding exact VM specification:', error);
        return {
            error: `Internal server error: ${error.message}`,
            success: false
        };
    }
}

module.exports = {
    findOptimalInstance,
    refreshAllPriceData,
    findExactVmSpecification
}; 