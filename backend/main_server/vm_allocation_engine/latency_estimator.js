/**
 * Latency Estimator
 * 
 * Estimates network latency between a user location and cloud provider regions
 * Uses geolocation data to calculate approximate distances and latencies
 */

// Cloud provider region coordinates (latitude, longitude)
// This is a simplified dataset, would need to be expanded for production
const REGION_COORDINATES = {
    // GCP regions
    'us-central1': { lat: 41.2619, lng: -95.8608, provider: 'GCP', displayName: 'Iowa' },
    'us-east1': { lat: 33.1958, lng: -80.0131, provider: 'GCP', displayName: 'South Carolina' },
    'us-east4': { lat: 39.0438, lng: -77.4874, provider: 'GCP', displayName: 'Northern Virginia' },
    'us-west1': { lat: 45.6075, lng: -121.1786, provider: 'GCP', displayName: 'Oregon' },
    'us-west2': { lat: 34.0522, lng: -118.2437, provider: 'GCP', displayName: 'Los Angeles' },
    'us-west3': { lat: 40.7608, lng: -111.8910, provider: 'GCP', displayName: 'Salt Lake City' },
    'us-west4': { lat: 36.1699, lng: -115.1398, provider: 'GCP', displayName: 'Las Vegas' },
    'europe-west1': { lat: 50.4501, lng: 3.8181, provider: 'GCP', displayName: 'Belgium' },
    'europe-west2': { lat: 51.5074, lng: -0.1278, provider: 'GCP', displayName: 'London' },
    'europe-west3': { lat: 50.1109, lng: 8.6821, provider: 'GCP', displayName: 'Frankfurt' },
    'europe-west4': { lat: 53.4386, lng: 6.8355, provider: 'GCP', displayName: 'Netherlands' },
    'asia-east1': { lat: 24.0717, lng: 120.5624, provider: 'GCP', displayName: 'Taiwan' },
    'asia-northeast1': { lat: 35.6895, lng: 139.6917, provider: 'GCP', displayName: 'Tokyo' },
    'asia-southeast1': { lat: 1.3521, lng: 103.8198, provider: 'GCP', displayName: 'Singapore' },
    'australia-southeast1': { lat: -33.8688, lng: 151.2093, provider: 'GCP', displayName: 'Sydney' },
    
    // AWS regions (mapped to similar GCP region names by common.js)
    'us-east1': { lat: 39.0438, lng: -77.4874, provider: 'AWS', displayName: 'N. Virginia' },
    'us-east2': { lat: 40.4173, lng: -82.7077, provider: 'AWS', displayName: 'Ohio' },
    'us-west1': { lat: 37.7749, lng: -122.4194, provider: 'AWS', displayName: 'N. California' },
    'us-west2': { lat: 45.8399, lng: -119.7006, provider: 'AWS', displayName: 'Oregon' },
    'europe-west1': { lat: 53.3498, lng: -6.2603, provider: 'AWS', displayName: 'Ireland' },
    'europe-west2': { lat: 51.5074, lng: -0.1278, provider: 'AWS', displayName: 'London' },
    'europe-central1': { lat: 50.1109, lng: 8.6821, provider: 'AWS', displayName: 'Frankfurt' },
    'asia-northeast1': { lat: 35.6895, lng: 139.6917, provider: 'AWS', displayName: 'Tokyo' },
    'asia-southeast1': { lat: 1.3521, lng: 103.8198, provider: 'AWS', displayName: 'Singapore' },
    'australia-southeast1': { lat: -33.8688, lng: 151.2093, provider: 'AWS', displayName: 'Sydney' },
};

/**
 * Calculate distance between two points using the Haversine formula
 * 
 * @param {number} lat1 - Latitude of the first point in degrees
 * @param {number} lng1 - Longitude of the first point in degrees
 * @param {number} lat2 - Latitude of the second point in degrees
 * @param {number} lng2 - Longitude of the second point in degrees
 * @returns {number} Distance in kilometers
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth radius in kilometers
    
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);
    
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
        Math.sin(dLng/2) * Math.sin(dLng/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

/**
 * Convert degrees to radians
 * 
 * @param {number} degrees - Angle in degrees
 * @returns {number} Angle in radians
 */
function toRadians(degrees) {
    return degrees * Math.PI / 180;
}

/**
 * Estimate latency based on distance
 * This is a simplified model that assumes 0.5ms latency per 100km distance
 * Real-world latency depends on many factors including undersea cables, peering, etc.
 * 
 * @param {number} distance - Distance in kilometers
 * @returns {number} Estimated latency in milliseconds
 */
function estimateLatencyFromDistance(distance) {
    // Base latency (processing, etc)
    const baseLatency = 5; 
    
    // Speed of light in fiber is roughly 200,000 km/s
    // Round trip means dividing by 100,000 km/s
    // 1ms = 100km at this speed (simplified)
    const distanceLatency = distance * 0.5; // 0.5ms per 100km (simplified)
    
    // Add some jitter and overhead for routing, processing, etc.
    const overhead = Math.sqrt(distance) * 0.2;
    
    return baseLatency + distanceLatency + overhead;
}

/**
 * Get information for all cloud regions
 * 
 * @returns {Array} Array of region information objects
 */
function getAllRegions() {
    return Object.keys(REGION_COORDINATES).map(region => {
        return {
            region,
            ...REGION_COORDINATES[region]
        };
    });
}

/**
 * Get regions filtered by maximum acceptable latency
 * 
 * @param {Object} userLocation - User location {lat, lng}
 * @param {number} maxLatencyMs - Maximum acceptable latency in milliseconds
 * @param {string} [provider] - Optional provider filter ('GCP' or 'AWS')
 * @returns {Array} Array of region objects sorted by latency
 */
function getRegionsByLatency(userLocation, maxLatencyMs, provider = null) {
    if (!userLocation || !userLocation.lat || !userLocation.lng) {
        throw new Error('Invalid user location');
    }
    
    const regions = getAllRegions()
        .filter(region => !provider || region.provider === provider)
        .map(region => {
            const distance = haversineDistance(
                userLocation.lat, userLocation.lng,
                region.lat, region.lng
            );
            const latencyMs = estimateLatencyFromDistance(distance);
            
            return {
                ...region,
                distance,
                latencyMs
            };
        })
        .filter(region => region.latencyMs <= maxLatencyMs)
        .sort((a, b) => a.latencyMs - b.latencyMs);
    
    return regions;
}

/**
 * Estimate location from IP address
 * This is a mock implementation - in production you would use a geolocation service
 * 
 * @param {string} ipAddress - IP address to geolocate
 * @returns {Promise<Object>} User location {lat, lng, country, city}
 */
async function getUserLocationFromIp(ipAddress) {
    // Mock implementation - in production use a service like ipstack, MaxMind, or ip-api
    // For localhost testing purposes, default to a US location
    if (ipAddress === '127.0.0.1' || ipAddress === 'localhost' || ipAddress.startsWith('192.168.')) {
        return {
            lat: 37.7749,
            lng: -122.4194,
            country: 'United States',
            city: 'San Francisco'
        };
    }
    
    // Another example for testing
    if (ipAddress.startsWith('10.')) {
        return {
            lat: 40.7128,
            lng: -74.0060,
            country: 'United States',
            city: 'New York'
        };
    }
    
    // TODO: Implement actual IP geolocation service
    // For now just return a default
    console.warn(`Using default location for IP: ${ipAddress}`);
    return {
        lat: 37.7749,
        lng: -122.4194,
        country: 'United States',
        city: 'San Francisco'
    };
}

/**
 * Get all cloud regions with their distances and latencies from a user location
 * 
 * @param {Object|string} userLocationOrIp - User location object {lat, lng} or IP address
 * @returns {Promise<Array>} Array of region objects with distances and latencies
 */
async function getAllRegionsWithLatencies(userLocationOrIp) {
    let userLocation;
    
    if (typeof userLocationOrIp === 'string') {
        // It's an IP address
        userLocation = await getUserLocationFromIp(userLocationOrIp);
    } else if (userLocationOrIp && userLocationOrIp.lat && userLocationOrIp.lng) {
        // It's already a location object
        userLocation = userLocationOrIp;
    } else {
        throw new Error('Invalid user location or IP address');
    }
    
    const regions = getAllRegions().map(region => {
        const distance = haversineDistance(
            userLocation.lat, userLocation.lng,
            region.lat, region.lng
        );
        const latencyMs = estimateLatencyFromDistance(distance);
        
        return {
            ...region,
            distance,
            latencyMs
        };
    }).sort((a, b) => a.latencyMs - b.latencyMs);
    
    return regions;
}

module.exports = {
    getRegionsByLatency,
    getUserLocationFromIp,
    getAllRegionsWithLatencies,
    getAllRegions,
    haversineDistance,
    estimateLatencyFromDistance
}; 