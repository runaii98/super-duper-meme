/**
 * Common utilities for price fetchers
 * 
 * Provides helper functions and shared code for GCP and AWS price fetchers
 */

/**
 * Normalize cloud provider region codes to a standard format
 * GCP and AWS use different region naming conventions
 * 
 * @param {string} provider - Cloud provider ('GCP' or 'AWS')
 * @param {string} region - Provider-specific region code
 * @returns {string} Normalized region code
 */
function normalizeRegionCode(provider, region) {
    if (provider === 'GCP') {
        // GCP regions are already in the format "us-central1"
        return region;
    } else if (provider === 'AWS') {
        // AWS regions are like "us-east-1" - normalize to GCP-like format
        // This is a simplification - a more comprehensive mapping would be needed
        const awsToGcpRegionMap = {
            'us-east-1': 'us-east1',
            'us-east-2': 'us-east2',
            'us-west-1': 'us-west1',
            'us-west-2': 'us-west2',
            'eu-west-1': 'europe-west1',
            'eu-west-2': 'europe-west2',
            'eu-central-1': 'europe-central1',
            'ap-northeast-1': 'asia-northeast1',
            'ap-southeast-1': 'asia-southeast1',
            'ap-southeast-2': 'australia-southeast1',
            // Add more mappings as needed
        };
        
        return awsToGcpRegionMap[region] || region;
    }
    
    return region;
}

/**
 * Calculate estimated VRAM for a given GPU type
 * This is a helper since VRAM information isn't always explicitly provided
 * 
 * @param {string} gpuType - GPU type name
 * @returns {number} Estimated VRAM in GB
 */
function estimateVramForGpuType(gpuType) {
    if (!gpuType) return 0;
    
    const gpuTypeNormalized = gpuType.toUpperCase();
    
    // Standard VRAM sizes for common GPU types
    // This is a simplification - in reality there can be variations
    if (gpuTypeNormalized.includes('T4')) return 16;
    if (gpuTypeNormalized.includes('L4')) return 24;
    if (gpuTypeNormalized.includes('P4')) return 8;
    if (gpuTypeNormalized.includes('P100')) return 16;
    if (gpuTypeNormalized.includes('V100')) return 16;  // Could be 16GB or 32GB
    if (gpuTypeNormalized.includes('A100')) return 40;  // Could be 40GB or 80GB
    if (gpuTypeNormalized.includes('A10G')) return 24;
    if (gpuTypeNormalized.includes('K80')) return 12;
    
    // Default fallback
    return 0;
}

/**
 * Convert pricing to a standardized format for comparison across cloud providers
 * 
 * @param {Object} pricing - Pricing object from cloud provider
 * @returns {Object} Standardized pricing object
 */
function standardizePricing(pricing) {
    if (!pricing) return null;
    
    // Ensure required fields exist
    if (!pricing.provider || !pricing.region || !pricing.pricePerHour) {
        return null;
    }
    
    // Create standardized object with required fields
    const result = {
        provider: pricing.provider,
        region: normalizeRegionCode(pricing.provider, pricing.region),
        pricePerHour: pricing.pricePerHour,
        pricingModel: pricing.pricingModel || 'OnDemand',
        currency: pricing.currency || 'USD',
    };
    
    // Add resource-specific fields if they exist
    if (pricing.vcpu) result.vcpu = pricing.vcpu;
    if (pricing.ramGB) result.ramGB = pricing.ramGB;
    if (pricing.gpuType) result.gpuType = pricing.gpuType;
    if (pricing.gpuCount) result.gpuCount = pricing.gpuCount;
    
    // Calculate VRAM if it doesn't exist but we have GPU type
    if (!pricing.vramGB && pricing.gpuType) {
        result.vramGB = estimateVramForGpuType(pricing.gpuType);
    } else if (pricing.vramGB) {
        result.vramGB = pricing.vramGB;
    }
    
    // Provider-specific identifiers
    if (pricing.provider === 'GCP') {
        result.skuId = pricing.skuId;
        result.resourceGroup = pricing.resourceGroup;
    } else if (pricing.provider === 'AWS') {
        result.instanceType = pricing.instanceType;
        result.instanceFamily = pricing.instanceFamily;
    }
    
    return result;
}

/**
 * Save pricing data to a cache
 * This is a placeholder for a more sophisticated caching system
 * 
 * @param {Array} pricingData - Array of pricing objects
 * @param {string} cacheFile - Path to cache file or identifier
 * @returns {Promise<boolean>} Success indicator
 */
async function savePricingToCache(pricingData, cacheFile) {
    // This would be implemented based on your preferred caching strategy
    // Could write to file, database, Redis, etc.
    console.log(`Would save ${pricingData.length} pricing records to cache: ${cacheFile}`);
    return true;
}

/**
 * Load pricing data from cache
 * This is a placeholder for a more sophisticated caching system
 * 
 * @param {string} cacheFile - Path to cache file or identifier
 * @returns {Promise<Array>} Cached pricing data or empty array if not found
 */
async function loadPricingFromCache(cacheFile) {
    // This would be implemented based on your preferred caching strategy
    // Could read from file, database, Redis, etc.
    console.log(`Would load pricing data from cache: ${cacheFile}`);
    return [];
}

/**
 * Generate a cache key based on provider and pricing model
 * 
 * @param {string} provider - Cloud provider name
 * @param {string} pricingModel - Pricing model (OnDemand, Spot, etc.)
 * @returns {string} Cache key
 */
function generateCacheKey(provider, pricingModel) {
    return `${provider.toLowerCase()}_${pricingModel.toLowerCase()}_prices`;
}

module.exports = {
    normalizeRegionCode,
    estimateVramForGpuType,
    standardizePricing,
    savePricingToCache,
    loadPricingFromCache,
    generateCacheKey
}; 