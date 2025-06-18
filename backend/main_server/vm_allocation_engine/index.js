/**
 * VM Allocation Engine - Main Module
 * 
 * Entry point for the VM allocation engine
 * Provides a unified interface to all engine functionality
 */

const allocationAlgorithm = require('./allocation_algorithm');
const latencyEstimator = require('./latency_estimator');
const gcpPriceFetcher = require('./price_fetchers/gcp_price_fetcher');
const awsPriceFetcher = require('./price_fetchers/aws_price_fetcher');
const priceCache = require('./data_store/price_cache');

/**
 * Initialize the VM allocation engine
 * @param {boolean} prefetchPriceData - Whether to prefetch price data (default: false)
 * @returns {Promise<Object>} Initialization status
 */
async function initialize(prefetchPriceData = false) {
    try {
        // Create cache directory if it doesn't exist
        await priceCache.saveToCache('test', { test: true });
        await priceCache.invalidateCache('test');
        
        // Prefetch price data for faster initial allocations if requested
        if (prefetchPriceData) {
            // This can be run in the background
            setTimeout(async () => {
                try {
                    console.log('Prefetching VM pricing data...');
                    await allocationAlgorithm.refreshAllPriceData();
                    console.log('VM pricing data prefetched successfully!');
                } catch (error) {
                    console.error('Error prefetching VM pricing data:', error);
                }
            }, 0);
        }
        
        return { success: true, message: 'VM allocation engine initialized' };
    } catch (error) {
        console.error('Error initializing VM allocation engine:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Find the optimal VM instance based on user requirements
 * @param {Object} userInput - User input parameters
 * @returns {Promise<Object>} VM allocation result
 */
async function findOptimalInstance(userInput) {
    return allocationAlgorithm.findOptimalInstance(userInput);
}

/**
 * Find a VM by exact specifications
 * @param {Object} specifications - Exact VM specifications
 * @returns {Promise<Object>} VM lookup result
 */
async function findExactVmSpecification(specifications) {
    return allocationAlgorithm.findExactVmSpecification(specifications);
}

/**
 * Refresh all VM pricing data and update the cache
 * @returns {Promise<Object>} Refresh statistics
 */
async function refreshPriceData() {
    return allocationAlgorithm.refreshAllPriceData();
}

/**
 * Estimate where a user is located based on their IP address
 * @param {string} ipAddress - User IP address
 * @returns {Promise<Object>} User location data
 */
async function getUserLocation(ipAddress) {
    try {
        const location = await latencyEstimator.getUserLocationFromIp(ipAddress);
        return {
            success: true,
            location
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Get all cloud regions with their latency from a user's location
 * @param {string} ipAddress - User IP address
 * @returns {Promise<Object>} Region latency data
 */
async function getRegionLatencies(ipAddress) {
    try {
        const regions = await latencyEstimator.getAllRegionsWithLatencies(ipAddress);
        return {
            success: true,
            regions
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Check cache status and get information about cached data
 * @returns {Promise<Object>} Cache status
 */
async function getCacheStatus() {
    try {
        const caches = await priceCache.listCaches();
        return {
            success: true,
            caches
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Clear all cached price data
 * @returns {Promise<Object>} Clear cache result
 */
async function clearCache() {
    try {
        await priceCache.clearAllCaches();
        return {
            success: true,
            message: 'All caches cleared successfully'
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Get sample pricing data for testing/debugging
 * @returns {Promise<Object>} Sample VM pricing data
 */
async function getSamplePrices() {
    try {
        const gcpSample = await gcpPriceFetcher.fetchSampleGcpPrices();
        const awsSample = await awsPriceFetcher.fetchSampleAwsPrices();
        
        return {
            success: true,
            samples: {
                gcp: gcpSample,
                aws: awsSample
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = {
    initialize,
    findOptimalInstance,
    findExactVmSpecification,
    refreshPriceData,
    getUserLocation,
    getRegionLatencies,
    getCacheStatus,
    clearCache,
    getSamplePrices
}; 