const awsFetcher = require('./price_fetchers/aws_price_fetcher');
const gcpFetcher = require('./price_fetchers/gcp_compute_api_fetcher');
const latencyEstimator = require('./latency_estimator');

// Constants
const GCP_PROJECT_ID = 'glassy-fort-416908';

// --- Main Logic Function ---
/**
 * Finds the optimal VM instances across AWS and GCP based on hardware specs,
 * user preference (price vs performance), and user location (for latency).
 * 
 * @param {object} criteria 
 * @param {string} [criteria.instance_type] Specific instance type (e.g., "t2.medium", "e2-medium") - takes precedence if provided.
 * @param {string} [criteria.gpu_type] Specific GPU type (e.g., "nvidia-tesla-t4") (optional).
 * @param {number} [criteria.gpu_count] Number of GPUs (optional, defaults to 1 if gpu_type present).
 * @param {number} [criteria.vcpu] Required vCPUs (used if instance_type is not specific or is 'custom').
 * @param {number} [criteria.ram_gb] Required RAM in GB (used if instance_type is not specific or is 'custom').
 * @param {number} [criteria.storage_gb] Required storage in GB (optional).
 * @param {string} [criteria.storage_type] Type of storage (optional, e.g., "ssd", "hdd").
 * @param {string} criteria.user_ip_address User's IP address for latency estimation.
 * @param {string} criteria.preference "performance" or "price".
 * @returns {Promise<Array<object>>} A list of suitable instance options, sorted by preference.
 */
async function findOptimalVm(criteria) {
    console.log("Starting findOptimalVm with criteria:", criteria);

    try {
        // --- 1. Load Pricing Data (using cached loaders) ---
        console.log("Loading pricing data from AWS and GCP...");
        
        // Initialize results arrays
        let awsOnDemandPrices = [];
        let awsSpotPrices = [];
        let gcpInstanceTypes = [];
        
        try {
            // Load AWS prices - these likely won't fail
            [awsOnDemandPrices, awsSpotPrices] = await Promise.all([
            awsFetcher.loadAwsOnDemandPrices(),
                awsFetcher.loadAwsSpotPrices()
            ]);
            
            // Load GCP prices separately with error handling
            try {
                gcpInstanceTypes = await gcpFetcher.loadGcpInstanceTypes(GCP_PROJECT_ID);
            } catch (gcpError) {
                console.error(`GCP instance fetching error: ${gcpError.message}. Proceeding with AWS only.`);
                // In case of error, we'll continue with only AWS instances
                gcpInstanceTypes = [];
            }
        } catch (priceLoadError) {
            console.error(`Error loading pricing data: ${priceLoadError.message}`);
            // If all price loading fails, return empty results
            if (awsOnDemandPrices.length === 0 && awsSpotPrices.length === 0 && gcpInstanceTypes.length === 0) {
                return [];
            }
        }
        
        console.log(`Loaded ${awsOnDemandPrices.length} AWS OnDemand, ${awsSpotPrices.length} AWS Spot, ${gcpInstanceTypes.length} GCP prices.`);
        
        const allPrices = [
            ...awsOnDemandPrices.map(p => ({...p, pricingModel: 'OnDemand', provider: 'AWS'})),
            ...awsSpotPrices.map(p => ({...p, pricingModel: 'Spot', provider: 'AWS'})),
            ...gcpInstanceTypes // GCP instances already have provider and pricingModel from our fetcher
        ].filter(p => p.compute_price_per_hour > 0 || p.pricePerHour > 0); // Ensure we only consider items with a price

        if (allPrices.length === 0) {
            console.warn("No pricing data loaded from any provider or all items have zero price.");
            return [];
        }

        // --- 2. Filter by Hardware Requirements ---
        console.log("Filtering instances by hardware requirements...");
        const suitableInstances = allPrices.filter(inst => {
            let matches = true;
            
            // Handle case where instance is completely undefined
            if (!inst) {
                console.error("WARNING: Found undefined instance in allInstances array");
                return false;
            }

            // Debug logging for any instances that have GPU info but don't match
            const hasGpuInfo = (inst.gpuCount && inst.gpuCount > 0) || 
                              (inst.gpu_count && inst.gpu_count > 0) || 
                              inst.gpuType || 
                              inst.gpu_type;
                              
            // Create standardized access to fields regardless of naming conventions
            const instGpuCount = inst.gpu_count || inst.gpuCount || 0;
            const instGpuType = inst.gpu_type || inst.gpuType || '';
            const instRamGB = inst.ram_gb || inst.ramGB || 0;

            // Only apply GPU filtering if GPU criteria are provided
            if (criteria.gpu_type || criteria.gpu_count) {
                if (hasGpuInfo) {
                    console.log(`GPU INSTANCE FOUND: ${inst.provider} ${inst.skuId || inst.instance_type}, GPU: ${instGpuType} (${instGpuCount}), vCPU: ${inst.vcpu}, RAM: ${instRamGB}GB`);
                }
                
                // GPU Type filter
                if (criteria.gpu_type && (!instGpuType || !isGpuTypeMatch(instGpuType, criteria.gpu_type))) {
                    if (hasGpuInfo) {
                        console.log(`  [REJECTED] GPU TYPE: ${instGpuType} doesn't match ${criteria.gpu_type}`);
                    }
                    matches = false;
                }
                
                // GPU Count filter
                if (criteria.gpu_count && instGpuCount < criteria.gpu_count) {
                    if (hasGpuInfo) {
                        console.log(`  [REJECTED] GPU COUNT: ${instGpuCount} < ${criteria.gpu_count}`);
                    }
                    matches = false;
                }
            }

            // vCPU filter
            if (criteria.vcpu && inst.vcpu < criteria.vcpu) {
                matches = false;
            }
            
            // RAM filter
            if (criteria.ram_gb && instRamGB < criteria.ram_gb) {
                matches = false;
            }
            
            return matches;
        });
        
        if (suitableInstances.length === 0) {
            console.warn("No instances found matching hardware criteria after initial filter.");
            return [];
        }
        console.log(`${suitableInstances.length} instances potentially match hardware specs after initial filter.`);

        // --- 3. Organize instances by provider and pricing model ---
        console.log("Organizing instances by provider and pricing model...");
        
        const instancesByProvider = {
            AWS: { OnDemand: [], Spot: [] },
            GCP: { OnDemand: [], Spot: [] }
        };
        
        suitableInstances.forEach(inst => {
            const provider = inst.provider;
            const pricingModel = inst.pricing_model || inst.pricingModel;
            if (instancesByProvider[provider] && instancesByProvider[provider][pricingModel]) {
                instancesByProvider[provider][pricingModel].push(inst);
            }
        });
        
        console.log(`Organized instances: AWS OnDemand: ${instancesByProvider.AWS.OnDemand.length}, ` +
                   `AWS Spot: ${instancesByProvider.AWS.Spot.length}, ` +
                   `GCP OnDemand: ${instancesByProvider.GCP.OnDemand.length}, ` +
                   `GCP Spot: ${instancesByProvider.GCP.Spot.length}`);
        
        // --- 4. Sort instances by fit to requirements ---
        const sortFn = (a, b) => {
            // Calculate overprovisioning score (lower is better)
            const aRam = a.ram_gb || a.ramGB;
            const bRam = b.ram_gb || b.ramGB;
            const scoreA = (a.vcpu - criteria.vcpu) + (aRam - criteria.ram_gb); 
            const scoreB = (b.vcpu - criteria.vcpu) + (bRam - criteria.ram_gb);

            if (scoreA !== scoreB) {
                return scoreA - scoreB; // Sort by lowest overprovisioning first
            }
            
            // If overprovisioning is equal, sort by lowest price
            const priceA = a.compute_price_per_hour || a.pricePerHour || Infinity;
            const priceB = b.compute_price_per_hour || b.pricePerHour || Infinity;
            return priceA - priceB;
        };
        
        instancesByProvider.AWS.OnDemand.sort(sortFn);
        instancesByProvider.AWS.Spot.sort(sortFn);
        instancesByProvider.GCP.OnDemand.sort(sortFn);
        instancesByProvider.GCP.Spot.sort(sortFn);
        
        // --- 5. Create instance pairs (each pair = 1 OnDemand + 1 Spot) ---
        console.log("Creating instance pairs (OnDemand + Spot)...");
        
        // Function to create pairs of matching instance types (OnDemand + Spot)
        const createPairs = (onDemandInstances, spotInstances, count) => {
            const pairs = [];
            const usedOnDemand = new Set();
            const usedSpot = new Set();
            
            // First pass - try to match instance types exactly
            for (let i = 0; i < onDemandInstances.length && pairs.length < count; i++) {
                const onDemand = onDemandInstances[i];
                // Get base instance type (remove any pricing model suffix)
                const onDemandType = onDemand.instance_type || onDemand.skuId;
                
                for (let j = 0; j < spotInstances.length; j++) {
                    if (usedSpot.has(j)) continue;
                    
                    const spot = spotInstances[j];
                    // Get base instance type (remove " (Spot)" suffix if present)
                    const spotType = (spot.instance_type || spot.skuId)
                        .replace(/ \(Spot\)$/i, '');
                    
                    // If they match, create a pair
                    if (spotType === onDemandType) {
                        pairs.push([onDemand, spot]);
                        usedOnDemand.add(i);
                        usedSpot.add(j);
                        break;
                    }
                }
            }
            
            // Second pass - for any remaining OnDemand instances, find the closest Spot instance
            for (let i = 0; i < onDemandInstances.length && pairs.length < count; i++) {
                if (usedOnDemand.has(i)) continue;
                
                const onDemand = onDemandInstances[i];
                let bestSpotMatch = -1;
                let bestMatchScore = Infinity;
                
                // Find the closest Spot instance by vCPU and RAM
                for (let j = 0; j < spotInstances.length; j++) {
                    if (usedSpot.has(j)) continue;
                    
                    const spot = spotInstances[j];
                    const vCpuDiff = Math.abs(spot.vcpu - onDemand.vcpu);
                    const ramDiff = Math.abs(
                        (spot.ram_gb || spot.ramGB) - (onDemand.ram_gb || onDemand.ramGB)
                    );
                    
                    const score = vCpuDiff + ramDiff;
                    if (score < bestMatchScore) {
                        bestMatchScore = score;
                        bestSpotMatch = j;
                    }
                }
                
                // If we found a match, create a pair
                if (bestSpotMatch >= 0) {
                    pairs.push([onDemand, spotInstances[bestSpotMatch]]);
                    usedOnDemand.add(i);
                    usedSpot.add(bestSpotMatch);
                }
            }
            
            // If we need more pairs and still have unused instances
            while (pairs.length < count) {
                // Find first unused OnDemand and Spot
                let unusedOnDemand = -1;
                let unusedSpot = -1;
                
                for (let i = 0; i < onDemandInstances.length; i++) {
                    if (!usedOnDemand.has(i)) {
                        unusedOnDemand = i;
                        break;
                    }
                }
                
                for (let j = 0; j < spotInstances.length; j++) {
                    if (!usedSpot.has(j)) {
                        unusedSpot = j;
                        break;
                    }
                }
                
                // If we have both, create a pair
                if (unusedOnDemand >= 0 && unusedSpot >= 0) {
                    pairs.push([onDemandInstances[unusedOnDemand], spotInstances[unusedSpot]]);
                    usedOnDemand.add(unusedOnDemand);
                    usedSpot.add(unusedSpot);
                } else if (unusedOnDemand >= 0) {
                    // Only OnDemand available
                    pairs.push([onDemandInstances[unusedOnDemand], null]);
                    usedOnDemand.add(unusedOnDemand);
                } else if (unusedSpot >= 0) {
                    // Only Spot available
                    pairs.push([null, spotInstances[unusedSpot]]);
                    usedSpot.add(unusedSpot);
                } else {
                    // No more instances available
                    break;
                }
            }
            
            return pairs;
        };
        
        // Create 2 pairs from AWS and 2 pairs from GCP
        const awsPairs = createPairs(
            instancesByProvider.AWS.OnDemand, 
            instancesByProvider.AWS.Spot, 
            3
        );
        
        const gcpPairs = createPairs(
            instancesByProvider.GCP.OnDemand, 
            instancesByProvider.GCP.Spot, 
            2
        );
        
        console.log(`Created ${awsPairs.length} AWS pairs and ${gcpPairs.length} GCP pairs`);
        
        // --- 6. Format and combine results ---
        const formatInstance = (inst, criteria) => {
            if (!inst) return null;
            
            const computePricePerHour = inst.compute_price_per_hour || inst.pricePerHour || 0;
            let estimatedStorageCostPerHour = 0;
            
            if (criteria.storage_gb) { 
                // Storage cost calculation
                const PLACEHOLDER_SSD_PRICE_PER_GB_HOUR_AWS = (0.10 / 730);
                const PLACEHOLDER_SSD_PRICE_PER_GB_HOUR_GCP = (0.17 / 730);
                
                if (inst.provider === 'AWS') {
                    if (criteria.storage_type && criteria.storage_type.toLowerCase() === 'ssd') {
                        estimatedStorageCostPerHour = criteria.storage_gb * PLACEHOLDER_SSD_PRICE_PER_GB_HOUR_AWS;
                    } else if (criteria.storage_type && criteria.storage_type.toLowerCase() === 'hdd') {
                        estimatedStorageCostPerHour = criteria.storage_gb * (PLACEHOLDER_SSD_PRICE_PER_GB_HOUR_AWS / 2);
                    } else {
                        estimatedStorageCostPerHour = criteria.storage_gb * PLACEHOLDER_SSD_PRICE_PER_GB_HOUR_AWS;
                    }
                } else if (inst.provider === 'GCP') {
                    if (criteria.storage_type && criteria.storage_type.toLowerCase() === 'ssd') {
                        estimatedStorageCostPerHour = criteria.storage_gb * PLACEHOLDER_SSD_PRICE_PER_GB_HOUR_GCP;
                    } else if (criteria.storage_type && criteria.storage_type.toLowerCase() === 'balanced') {
                        estimatedStorageCostPerHour = criteria.storage_gb * (PLACEHOLDER_SSD_PRICE_PER_GB_HOUR_GCP * 0.6);
                    } else if (criteria.storage_type && criteria.storage_type.toLowerCase() === 'hdd') {
                        estimatedStorageCostPerHour = criteria.storage_gb * (PLACEHOLDER_SSD_PRICE_PER_GB_HOUR_GCP * 0.25);
                    } else {
                        estimatedStorageCostPerHour = criteria.storage_gb * PLACEHOLDER_SSD_PRICE_PER_GB_HOUR_GCP;
                    }
                }
            }
            
            return {
                        provider: inst.provider,
                        region: inst.region,
                location: inst.location,
                instance_sku_id: inst.instance_sku_id || inst.skuId,
                instance_type: inst.instance_type || inst.skuId,
                        description: inst.description,
                        vcpu: inst.vcpu,
                ram_gb: inst.ram_gb || inst.ramGB,
                gpu_type: inst.gpu_type || inst.gpuType || null,
                gpu_count: inst.gpu_count || inst.gpuCount || 0,
                vram_gb: inst.vram_gb || inst.vramGB || null,
                network_performance: inst.network_performance || inst.networkPerformance || null,
                        requested_storage_gb: criteria.storage_gb || 0,
                        requested_storage_type: criteria.storage_type || null,
                pricing_model: inst.pricing_model || inst.pricingModel,
                        compute_price_per_hour: parseFloat(computePricePerHour.toFixed(5)),
                currency: inst.currency || 'USD',
                        estimated_storage_cost_per_hour: parseFloat(estimatedStorageCostPerHour.toFixed(5)),
                        total_price_per_hour: parseFloat((computePricePerHour + estimatedStorageCostPerHour).toFixed(5)),
                        raw_instance_data: criteria.debug ? inst : undefined
            };
        };
        
        // Format and collect all instances
        const results = [];
        
        // Add AWS pairs first (OnDemand, then Spot in each pair)
        for (const [onDemand, spot] of awsPairs) {
            if (onDemand) results.push(formatInstance(onDemand, criteria));
            if (spot) results.push(formatInstance(spot, criteria));
        }
        
        // Add GCP pairs second (OnDemand, then Spot in each pair)
        for (const [onDemand, spot] of gcpPairs) {
            if (onDemand) results.push(formatInstance(onDemand, criteria));
            if (spot) results.push(formatInstance(spot, criteria));
        }
        
        // Filter out nulls (in case some pairs were incomplete)
        const finalResults = results.filter(r => r !== null);
        
        console.log(`Returning ${finalResults.length} results (${awsPairs.length} AWS pairs, ${gcpPairs.length} GCP pairs)`);
        return finalResults;
    }
    catch (error) {
        console.error("Error in findOptimalVm:", error);
        return []; // Return empty array on error
    }
}

/**
 * Helper function to check if two GPU types match, handling different formats
 * @param {string} instanceGpuType - The GPU type from the instance
 * @param {string} criteriaGpuType - The GPU type from the search criteria
 * @returns {boolean} - Whether the GPU types match
 */
function isGpuTypeMatch(instanceGpuType, criteriaGpuType) {
    if (!instanceGpuType || !criteriaGpuType) return false;
    
    console.log(`Comparing GPU types: '${instanceGpuType}' vs '${criteriaGpuType}'`);
    
    // Normalize both strings for comparison
    const normalizeGpuType = (gpuType) => {
        return gpuType.toLowerCase()
            .replace(/[\s-_]+/g, '') // Remove spaces, hyphens, underscores
            .replace(/nvidia/g, '') // Remove "nvidia" prefix
            .replace(/tesla/g, ''); // Remove "tesla" prefix
    };
    
    // Extract the core model names
    const extractModelName = (gpuType) => {
        // AWS instance family mapping to GPU models
        const awsInstanceToGpuMap = {
            'p6': 'h100',       // P6 instances use NVIDIA H100 GPUs
            'p5': 'h100',       // P5 instances use NVIDIA H100 GPUs
            'p5e': 'h200',      // P5e instances use NVIDIA H200 GPUs
            'p5en': 'h200',     // P5en instances also use NVIDIA H200 GPUs
            'p4d': 'a100',      // P4d instances use NVIDIA A100 GPUs
            'p4de': 'a100',     // P4de instances use NVIDIA A100 GPUs
            'g6': 'l4',         // G6 instances use NVIDIA L4 GPUs
            'g6e': 'l40s',      // G6e instances use NVIDIA L40S GPUs
            'g5': 'a10g',       // G5 instances use NVIDIA A10G GPUs
            'g4dn': 't4',       // G4dn instances use NVIDIA T4 GPUs
            'g3': 'm60',        // G3 instances use NVIDIA M60 GPUs
            'p3': 'v100',       // P3 instances use NVIDIA V100 GPUs
            'p2': 'k80'         // P2 instances use NVIDIA K80 GPUs
        };

        // GCP machine type to GPU model mapping
        const gcpMachineToGpuMap = {
            'a3-ultragpu': 'h200',   // A3 Ultra instances use NVIDIA H200 GPUs
            'a3-highgpu': 'h100',    // A3 High instances use NVIDIA H100 GPUs
            'a3-megagpu': 'h100',    // A3 Mega instances use NVIDIA H100 GPUs
            'a3-edgegpu': 'h100',    // A3 Edge instances use NVIDIA H100 GPUs
            'a4-highgpu': 'b200',    // A4 instances use NVIDIA B200 GPUs
            'a2': 'a100',            // A2 instances use NVIDIA A100 GPUs
            'g2': 'l4'               // G2 instances use NVIDIA L4 GPUs
        };

        // Special case handling for GCP A3/A4 machine types
        if (gpuType.toLowerCase().includes('a3-highgpu') || 
            gpuType.toLowerCase().includes('a3-megagpu') || 
            gpuType.toLowerCase().includes('a3-edgegpu')) {
            return 'h100';
        }
        
        if (gpuType.toLowerCase().includes('a3-ultragpu')) {
            return 'h200';
        }
        
        if (gpuType.toLowerCase().includes('a4-highgpu')) {
            return 'b200';
        }

        // AWS instance family detection - need to do this before normalization
        const awsInstanceMatch = Object.keys(awsInstanceToGpuMap).find(family => 
            gpuType.toLowerCase().startsWith(family)
        );
        
        if (awsInstanceMatch) {
            return awsInstanceToGpuMap[awsInstanceMatch];
        }
        
        // GCP machine type detection
        const gcpMachineMatch = Object.keys(gcpMachineToGpuMap).find(machineType => 
            gpuType.toLowerCase().includes(machineType)
        );
        
        if (gcpMachineMatch) {
            return gcpMachineToGpuMap[gcpMachineMatch];
        }

        // For normalized GPU names (like t4, v100, etc.)
        const normalizedType = normalizeGpuType(gpuType);
        
        // Simple check for core model match
        if (normalizedType.includes('t4')) return 't4';
        if (normalizedType.includes('v100')) return 'v100';
        if (normalizedType.includes('a100')) return 'a100';
        // p6e removed as not in use
        // if (normalizedType.includes('h100e')) return 'h100e';
        if (normalizedType.includes('h100')) return 'h100';
        if (normalizedType.includes('h200')) return 'h200';
        if (normalizedType.includes('b200')) return 'b200';
        if (normalizedType.includes('l40s')) return 'l40s';
        if (normalizedType.includes('l4')) return 'l4';
        if (normalizedType.includes('a10g')) return 'a10g';
        if (normalizedType.includes('m60')) return 'm60';
        if (normalizedType.includes('k80')) return 'k80';
        
        return normalizedType;
    };
    
    const instanceModel = extractModelName(instanceGpuType);
    const criteriaModel = extractModelName(criteriaGpuType);
    
    console.log(`Normalized types: '${instanceModel}' vs '${criteriaModel}'`);
    
    // Check if the extracted models match
    const isMatch = instanceModel === criteriaModel;
    
    if (!isMatch) {
        console.log(`  [REJECTED] GPU TYPE: ${instanceGpuType} doesn't match ${criteriaGpuType}`);
    }
    
    return isMatch;
}

/**
 * Extract GPU info from an AWS instance type
 * @param {Object} instance - The AWS instance object
 * @returns {string|null} - The GPU type, or null if no GPU
 */
function getAwsGpuType(instance) {
    // AWS instance type pattern check
    if (instance.InstanceType.startsWith('g') ||
        instance.InstanceType.startsWith('p')) {

        // Map AWS instance families to NVIDIA GPU models
        if (instance.InstanceType.startsWith('p6')) {
            // P6e is not in use - only using P6 for H100 GPUs
            // return instance.InstanceType.startsWith('p6e') ? 'nvidia-h100e' : 'nvidia-h100';
            return 'nvidia-h100';
        } else if (instance.InstanceType.startsWith('p5')) {
            if (instance.InstanceType.startsWith('p5e') || instance.InstanceType.startsWith('p5en')) {
                return 'nvidia-h200'; // P5e/P5en instances use H200 GPUs
            }
            return 'nvidia-h100'; // Standard P5 instances use H100 GPUs
        } else if (instance.InstanceType.startsWith('p4d') || instance.InstanceType.startsWith('p4de')) {
            return 'nvidia-a100';
        } else if (instance.InstanceType.startsWith('g6')) {
            return instance.InstanceType.startsWith('g6e') ? 'nvidia-l40s' : 'nvidia-l4';
        } else if (instance.InstanceType.startsWith('g5')) {
            return 'nvidia-a10g';
        } else if (instance.InstanceType.startsWith('g4')) {
            return 'nvidia-t4';
        } else if (instance.InstanceType.startsWith('g3')) {
            return 'nvidia-tesla-m60';
        } else if (instance.InstanceType.startsWith('p3')) {
            return 'nvidia-tesla-v100';
        } else if (instance.InstanceType.startsWith('p2')) {
            return 'nvidia-k80';
        }

        // Default - extract from instance info if available
        if (instance.GpuInfo && instance.GpuInfo.Gpus && instance.GpuInfo.Gpus.length > 0) {
            return instance.GpuInfo.Gpus[0].Name;
        }
    }
    
    return null;
}

/**
 * Extract GPU info from a GCP instance name
 * @param {Object} instance - The GCP instance object
 * @returns {string|null} - The GPU type, or null if no GPU
 */
function getGcpGpuType(instance) {
    if (!instance.guestAccelerators || instance.guestAccelerators.length === 0) {
        return null;
    }
    
    // Extract machine type
    const machineType = instance.machineType;
    
    // Handle A3 series (H100/H200 GPUs) and A4 series (B200 GPUs)
    if (machineType.includes('a3-ultragpu')) {
        return 'nvidia-h200'; // A3 Ultra instances use NVIDIA H200 GPUs
    }
    
    if (machineType.includes('a3-highgpu') || 
        machineType.includes('a3-megagpu') || 
        machineType.includes('a3-edgegpu')) {
        return 'nvidia-h100'; // A3 High/Mega/Edge instances use NVIDIA H100 GPUs
    }

    if (machineType.includes('a4-highgpu')) {
        return 'nvidia-b200'; // A4 instances use NVIDIA B200 GPUs
    }
    
    if (machineType.includes('a2')) {
        return 'nvidia-a100'; // A2 instances use NVIDIA A100 GPUs
    }
    
    if (machineType.includes('g2')) {
        return 'nvidia-l4'; // G2 instances use NVIDIA L4 GPUs
    }
    
    // If no specific machine type match, use the accelerator type
    const gpuType = instance.guestAccelerators[0].acceleratorType;
    
    // Add nvidia- prefix if not already present
    return gpuType.includes('nvidia-') ? gpuType : `nvidia-${gpuType}`;
}

module.exports = {
    findOptimalVm,
    isGpuTypeMatch,
    getAwsGpuType,
    getGcpGpuType
}; 