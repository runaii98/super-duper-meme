/**
 * Price Cache
 * 
 * A simple file-based caching system for cloud pricing data
 * Allows for caching and retrieval of pricing data to avoid repeated API calls
 */

const fs = require('fs').promises;
const path = require('path');

// Cache directory - Adjusted for new location
const CACHE_DIR = path.join(__dirname, '..', '..', 'cache');

/**
 * Ensure the cache directory exists
 * @returns {Promise<void>}
 */
async function ensureCacheDir() {
    try {
        await fs.mkdir(CACHE_DIR, { recursive: true });
    } catch (error) {
        if (error.code !== 'EEXIST') {
            console.error('Error creating cache directory:', error);
            throw error;
        }
    }
}

/**
 * Get the full path to a cache file
 * @param {string} cacheKey - Unique identifier for the cache
 * @returns {string} Full path to the cache file
 */
function getCacheFilePath(cacheKey) {
    return path.join(CACHE_DIR, `${cacheKey}.json`);
}

/**
 * Check if cached data is still valid (not expired)
 * @param {Object} cacheData - The cached data with metadata
 * @param {number} maxAgeMs - Maximum age in milliseconds
 * @returns {boolean} True if cache is valid, false if expired
 */
function isCacheValid(cacheData, maxAgeMs = 3600000) { // Default: 1 hour
    if (!cacheData || !cacheData.timestamp) return false;
    
    const now = Date.now();
    const cacheAge = now - cacheData.timestamp;
    
    return cacheAge < maxAgeMs;
}

/**
 * Save data to the cache
 * @param {string} cacheKey - Unique identifier for the cache
 * @param {Array|Object} data - Data to cache
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
async function saveToCache(cacheKey, data) {
    try {
        await ensureCacheDir();
        
        const cacheFilePath = getCacheFilePath(cacheKey);
        const cacheData = {
            timestamp: Date.now(),
            data: data
        };
        
        await fs.writeFile(cacheFilePath, JSON.stringify(cacheData, null, 2));
        console.log(`Saved ${Array.isArray(data) ? data.length : 'object'} to cache: ${cacheKey}`);
        return true;
    } catch (error) {
        console.error(`Error saving data to cache (${cacheKey}):`, error);
        return false;
    }
}

/**
 * Load data from the cache if valid
 * @param {string} cacheKey - Unique identifier for the cache
 * @param {number} maxAgeMs - Maximum age in milliseconds (default: 1 hour)
 * @returns {Promise<Object|Array|null>} Cached data if valid, null otherwise
 */
async function loadFromCache(cacheKey, maxAgeMs = 3600000) {
    try {
        const cacheFilePath = getCacheFilePath(cacheKey);
        
        // Check if cache file exists
        try {
            await fs.access(cacheFilePath);
        } catch (error) {
            // File doesn't exist
            return null;
        }
        
        // Read and parse cache file
        const cacheContent = await fs.readFile(cacheFilePath, 'utf8');
        const cacheData = JSON.parse(cacheContent);
        
        // Check if cache is still valid
        if (isCacheValid(cacheData, maxAgeMs)) {
            console.log(`Loaded valid cache: ${cacheKey}`);
            return cacheData.data;
        } else {
            console.log(`Cache expired: ${cacheKey}`);
            return null;
        }
    } catch (error) {
        console.error(`Error loading data from cache (${cacheKey}):`, error);
        return null;
    }
}

/**
 * Invalidate (delete) a specific cache
 * @param {string} cacheKey - Unique identifier for the cache
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
async function invalidateCache(cacheKey) {
    try {
        const cacheFilePath = getCacheFilePath(cacheKey);
        
        try {
            await fs.unlink(cacheFilePath);
            console.log(`Invalidated cache: ${cacheKey}`);
            return true;
        } catch (error) {
            if (error.code === 'ENOENT') {
                // File doesn't exist, consider it successful
                return true;
            }
            throw error;
        }
    } catch (error) {
        console.error(`Error invalidating cache (${cacheKey}):`, error);
        return false;
    }
}

/**
 * Clear all cached data
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
async function clearAllCaches() {
    try {
        await ensureCacheDir();
        
        const files = await fs.readdir(CACHE_DIR);
        
        for (const file of files) {
            if (file.endsWith('.json')) {
                const filePath = path.join(CACHE_DIR, file);
                await fs.unlink(filePath);
            }
        }
        
        console.log('Cleared all caches');
        return true;
    } catch (error) {
        console.error('Error clearing all caches:', error);
        return false;
    }
}

/**
 * Get information about all available caches
 * @returns {Promise<Array>} Array of cache information objects
 */
async function listCaches() {
    try {
        await ensureCacheDir();
        
        const files = await fs.readdir(CACHE_DIR);
        const cacheInfos = [];
        
        for (const file of files) {
            if (file.endsWith('.json')) {
                try {
                    const filePath = path.join(CACHE_DIR, file);
                    const stats = await fs.stat(filePath);
                    const content = await fs.readFile(filePath, 'utf8');
                    const cacheData = JSON.parse(content);
                    
                    cacheInfos.push({
                        key: file.replace('.json', ''),
                        size: stats.size,
                        timestamp: cacheData.timestamp,
                        age: Date.now() - cacheData.timestamp,
                        isValid: isCacheValid(cacheData),
                        itemCount: Array.isArray(cacheData.data) ? cacheData.data.length : 'N/A'
                    });
                } catch (error) {
                    console.error(`Error processing cache file ${file}:`, error);
                }
            }
        }
        
        return cacheInfos;
    } catch (error) {
        console.error('Error listing caches:', error);
        return [];
    }
}

module.exports = {
    saveToCache,
    loadFromCache,
    invalidateCache,
    clearAllCaches,
    listCaches,
    isCacheValid,
    getCacheFilePath
}; 