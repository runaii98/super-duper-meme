/**
 * GCP Price Fetcher
 * 
 * Fetches VM pricing information from Google Cloud Billing Catalog API
 * Focuses on Compute Engine resources (vCPUs, RAM, GPUs)
 */

const { CloudCatalogClient } = require('@google-cloud/billing').v1;
const { GoogleAuth } = require('google-auth-library');
const credentialsManager = require('../credentials_manager');
const fs = require('fs'); // Added for file system operations
const path = require('path'); // Added for path manipulation

// Cache configuration
const CACHE_FILE = path.join(__dirname, 'gcp_prices_cache.json');
// const MAX_CACHE_AGE_MS = 60 * 60 * 1000; // 60 minutes - restore normal cache duration
const MAX_CACHE_AGE_MS = 1; // 1 millisecond - FORCE cache refresh for testing

// The client will be initialized with credentials in the init function
let billingClient = null;

/**
 * Initialize the GCP billing client with credentials
 * @returns {Promise<void>}
 */
async function initGcpClient() {
    try {
        if (billingClient) {
            return; // Already initialized
        }
        
        const gcpCredentials = await credentialsManager.loadGcpCredentials();
        
        // Create a GoogleAuth instance with the credentials
        const auth = new GoogleAuth({
            credentials: gcpCredentials,
            scopes: ['https://www.googleapis.com/auth/cloud-platform']
        });
        
        // Create the billing client with the auth instance
        billingClient = new CloudCatalogClient({ auth });
        console.log('GCP Billing API client initialized successfully');
    } catch (error) {
        console.error('Error initializing GCP client:', error);
        throw error;
    }
}

/**
 * Get the Compute Engine service ID from GCP
 * @returns {Promise<string>} The service ID for Compute Engine
 */
async function getComputeEngineServiceId() {
    try {
        // Ensure client is initialized
        await initGcpClient();
        
        const [services] = await billingClient.listServices({});
        
        const computeEngine = services.find(service => 
            service.displayName === 'Compute Engine');
            
        if (computeEngine) {
            console.log(`Found Compute Engine Service ID: ${computeEngine.name}`);
            return computeEngine.name; // This will be like "services/6F81-5844-456A"
        } else {
            throw new Error('Compute Engine service not found.');
        }
    } catch (error) {
        console.error('Error fetching service ID:', error);
        throw error;
    }
}

/**
 * Parse and extract resource information from GCP SKU
 * @param {Object} sku - The GCP SKU object
 * @returns {Object|null} Parsed resource info or null if not relevant/parseable
 */
function parseGcpSkuInfo(sku) {
    try {
        // Extract basic SKU info
        const skuId = sku.skuId;
        const description = sku.description || 'Unknown';
        
        // Log description for better debugging
        console.log(`Parsing GCP SKU: ${skuId} - ${description}`);
        
        // Get category details
        const serviceDisplayName = sku.category?.serviceDisplayName || 'Unknown';
        const resourceFamily = sku.category?.resourceFamily || 'Unknown';
        const resourceGroup = sku.category?.resourceGroup || 'Unknown';
        const usageType = sku.category?.usageType || 'Unknown';
        
        // Only process Compute Engine SKUs
        if (serviceDisplayName !== 'Compute Engine') {
            return null;
        }
        
        // Get pricing details
        const pricingInfo = Array.isArray(sku.pricingInfo) && sku.pricingInfo.length > 0 ? sku.pricingInfo[0] : null;
        if (!pricingInfo || !pricingInfo.pricingExpression) {
            console.log(`Skipping SKU ${skuId}: No pricing info available`);
        return null;
    }
    
        // Determine pricing model (spot or on-demand)
        const pricingModel = usageType.toLowerCase().includes('spot') ? 'Spot' : 'OnDemand';
        
        // Get the hourly price (first tier is usually pay-as-you-go)
        const pricingTiers = pricingInfo.pricingExpression.tieredRates || [];
        const firstTier = pricingTiers.length > 0 ? pricingTiers[0] : null;
        
        if (!firstTier) {
            console.log(`Skipping SKU ${skuId}: No pricing tiers available`);
            return null;
        }
        
        const price = {
            currencyCode: pricingInfo.pricingExpression.currencyCode || 'USD',
            units: parseInt(firstTier.unitPrice.units || 0, 10),
            nanos: parseInt(firstTier.unitPrice.nanos || 0, 10) 
        };
        
        // Calculate price per hour in decimal format
        const pricePerHour = price.units + (price.nanos / 1000000000);
        
        // Get regions
        const regions = [];
        if (sku.geoTaxonomy && sku.geoTaxonomy.regions && Array.isArray(sku.geoTaxonomy.regions)) {
            regions.push(...sku.geoTaxonomy.regions);
        }
        
        if (regions.length === 0) {
            console.log(`Skipping SKU ${skuId}: No region information`);
        return null;
    }

        // Create results for each region - one entry per region
        const results = [];
        for (const region of regions) {
            // Extract resource details from description and category
            const vmInfo = extractVmDetailsFromSku(sku, description, resourceFamily, resourceGroup);
            
            // Structured response matching fields we use in AWS
            const result = {
                provider: 'GCP',
                region: region,
                location: getGcpRegionDisplay(region),
                skuId: skuId,
                description: description,
                pricingModel: pricingModel,
                pricePerHour: pricePerHour,
                currency: price.currencyCode,
                
                // VM specific details from description parsing
                vcpu: vmInfo.vcpu,
                ram_gb: vmInfo.ram_gb,
                gpu_type: vmInfo.gpu_type,
                gpu_count: vmInfo.gpu_count,
                
                // Additional categorization fields
                resourceFamily,
                resourceGroup,
                
                // Optional fields we may be able to extract from description
                machine_type: vmInfo.machine_type,
                series: vmInfo.series
            };
            
            results.push(result);
        }
        
        return results;
    } catch (error) {
        console.error(`Error parsing GCP SKU ${sku.skuId || 'unknown'}: ${error.message}`);
        return null;
    }
}

/**
 * Extracts VM details from SKU description and category data
 */
function extractVmDetailsFromSku(sku, description, resourceFamily, resourceGroup) {
    const descLower = description.toLowerCase();
    const result = {
        vcpu: null,
        ram_gb: null,
        gpu_type: null,
        gpu_count: 0,
        machine_type: null,
        series: null
    };
    
    // Try to extract machine type series (n1, n2, e2, etc.)
    const seriesRegex = /(^|\s)(a2|n1|n2|n2d|c2|c2d|m1|m2|t2d|e2)(\s|$|-)|(standard|highmem|highcpu)/i;
    const seriesMatch = descLower.match(seriesRegex);
    if (seriesMatch) {
        result.series = seriesMatch[0].trim();
    }
    
    // Try to identify machine type from description
    if (descLower.includes('predefined')) {
        // E.g., "Predefined Instance Core running in Americas"
        const machineTypeRegex = /predefined\s+(.*?)\s+(core|ram|instance)/i;
        const mtMatch = description.match(machineTypeRegex);
        if (mtMatch) {
            result.machine_type = mtMatch[1].trim();
        }
    }
    
    // Check if this is a CPU SKU
    if (resourceFamily === 'Compute' && resourceGroup.includes('CPU')) {
        // E.g., "N1 Predefined Instance Core running in Americas"
        const vcpuRegex = /(\d+)\s*vcpu/i;
        const vcpuMatch = descLower.match(vcpuRegex);
        if (vcpuMatch) {
            result.vcpu = parseInt(vcpuMatch[1], 10);
        } else {
            // Just mark as a CPU component
            result.vcpu = 1; // Default for CPU component
        }
    }
    
    // Check if this is a RAM SKU
    if (resourceFamily === 'Compute' && resourceGroup.includes('RAM')) {
        // E.g., "N1 Predefined Instance Ram running in Americas"
        const ramRegex = /(\d+(\.\d+)?)\s*(gb|gib)/i;
        const ramMatch = descLower.match(ramRegex);
        if (ramMatch) {
            result.ram_gb = parseFloat(ramMatch[1]);
        } else {
            // Just mark as a RAM component
            result.ram_gb = 1; // Default for RAM component
        }
    }
    
    // Check if this is a GPU SKU
    if (resourceFamily === 'GPU') {
        // E.g., "NVIDIA Tesla T4 GPU running in Americas"
        const gpuTypeRegex = /(nvidia|amd)\s+(tesla|a100|t4|p100|p4|v100)/i;
        const gpuTypeMatch = descLower.match(gpuTypeRegex);
        if (gpuTypeMatch) {
            result.gpu_type = gpuTypeMatch[0].trim();
        }
        
        const gpuCountRegex = /(\d+)\s*gpu/i;
        const gpuCountMatch = descLower.match(gpuCountRegex);
        if (gpuCountMatch) {
            result.gpu_count = parseInt(gpuCountMatch[1], 10);
        } else {
            result.gpu_count = 1; // Default if it's a GPU SKU
        }
    }
    
    return result;
}

/**
 * Maps GCP region code to display name
 */
function getGcpRegionDisplay(regionCode) {
    const regionMap = {
        'us-central1': 'US Central (Iowa)',
        'us-east1': 'US East (South Carolina)',
        'us-east4': 'US East (Northern Virginia)',
        'us-west1': 'US West (Oregon)',
        'us-west2': 'US West (Los Angeles)',
        'us-west3': 'US West (Salt Lake City)',
        'us-west4': 'US West (Las Vegas)',
        'europe-west1': 'Europe West (Belgium)',
        'europe-west2': 'Europe West (London)',
        'europe-west3': 'Europe West (Frankfurt)',
        'europe-west4': 'Europe West (Netherlands)',
        'europe-west6': 'Europe West (Zurich)',
        'asia-east1': 'Asia East (Taiwan)',
        'asia-east2': 'Asia East (Hong Kong)',
        'asia-northeast1': 'Asia Northeast (Tokyo)',
        'asia-northeast2': 'Asia Northeast (Osaka)',
        'asia-northeast3': 'Asia Northeast (Seoul)',
        'asia-south1': 'Asia South (Mumbai)',
        'asia-southeast1': 'Asia Southeast (Singapore)',
        'asia-southeast2': 'Asia Southeast (Jakarta)',
        'australia-southeast1': 'Australia Southeast (Sydney)',
        'southamerica-east1': 'South America East (São Paulo)',
        // Add more regions as needed
    };
    
    return regionMap[regionCode] || regionCode;
}

/**
 * Assembles complete GCP VM instance definitions from a list of raw, parsed SKUs.
 * This is where logic to combine vCPU, RAM, and GPU component SKUs for the
 * same region and pricing model would reside. It also identifies SKUs that
 * already represent full instances.
 *
 * @param {Array<Object>} parsedSkus - Array of SKU objects from parseGcpSkuInfo, each with region info.
 * @returns {Array<Object>} Array of assembled, complete VM pricing objects.
 */
function assembleGcpInstances(parsedSkus) {
    console.log(`[GCP Assemble] Starting assembly for ${parsedSkus.length} parsed SKUs.`);
    const finalAssembledInstances = [];
    
    const identifiedFullInstances = [];
    const cpuComponentSkus = {}; // Key: region_pricingModel_series -> [sku, ...]
    const ramComponentSkus = {};  // Key: region_pricingModel_series -> [sku, ...]
    const gpuSkus = [];

    // Known prefixes or identifiers for full machine SKUs (can be expanded)
    const fullInstanceSeriesPatterns = [
        /^e2-/, /^n1-standard-/, /^n2-standard-/, /^n2d-standard-/, 
        /^c2-standard-/, /^c2d-standard-/, /^m1-/, /^m2-/, /^m3-/,
        /^a2-/, /^g2-/
        // Add other series that are typically sold as full instances
    ];

    // Step 1: Categorize SKUs
    for (const sku of parsedSkus) {
        const descriptionLower = sku.description.toLowerCase();
        const resourceGroupLower = (sku.resourceGroup || '').toLowerCase();
        
        // Extract series information from description or resourceGroup for component grouping
        const seriesRegex = /(^|\s)(n1|n2|n2d|e2|c2|c2d|m1|m2|m3|a2|g2|custom)(\s|$|-)|(standard|highmem|highcpu)/i;
        const seriesMatch = descriptionLower.match(seriesRegex) || resourceGroupLower.match(seriesRegex);
        const seriesKey = (seriesMatch ? seriesMatch[0].trim() : 'unknown').toLowerCase();

        // A. Identify GPU SKUs
        if (resourceGroupLower.includes('gpu') || descriptionLower.includes('gpu')) {
            if (sku.gpu_count > 0 && sku.pricePerHour > 0) {
                console.log(`[GCP Assemble Category] GPU SKU: ${sku.description} (Region: ${sku.region}, Price: ${sku.pricePerHour})`);
                gpuSkus.push({
                    ...sku,
                    instanceType: sku.gpu_type || sku.resourceGroup || 'GPU_Instance',
                    // Ensure vCPU/RAM are 0 if it's purely a GPU SKU and not parsed otherwise
                    vcpu: sku.vcpu || 0,
                    ram_gb: sku.ram_gb || 0,
                });
            }
            continue; // Go to next SKU after handling GPU
        }
        
        // B. Check for Full instances first.
        // These are often predefined machine types.
        let isPredefinedFull = false;
        if (sku.vcpu > 0 && sku.ram_gb > 0) {
            // Check if skuId or resourceGroup matches known full instance patterns
            const isSeriesMatch = fullInstanceSeriesPatterns.some(pattern => 
                descriptionLower.match(pattern) || resourceGroupLower.match(pattern)
            );
            
            // Avoid classifying explicit CPU or RAM components as full instances
            const notExplicitComponent = 
                !descriptionLower.includes('core only') && 
                !descriptionLower.includes('ram only') && 
                !(descriptionLower.includes('core') && !descriptionLower.includes('instance')) &&
                !(descriptionLower.includes('ram') && !descriptionLower.includes('instance'));

            if (isSeriesMatch && notExplicitComponent) {
                console.log(`[GCP Assemble Category] Identified Predefined Full Instance: ${sku.description} (vCPU: ${sku.vcpu}, RAM: ${sku.ram_gb}, Region: ${sku.region})`);
                identifiedFullInstances.push({
                    ...sku,
                    // Format for compatibility with AWS format
                    provider: 'GCP',
                    instance_sku_id: sku.skuId,
                    compute_price_per_hour: sku.pricePerHour,
                    requested_storage_gb: 0, // Will be set by region_selector
                    requested_storage_type: null, // Will be set by region_selector
                    estimated_storage_cost_per_hour: 0, // Will be calculated by region_selector
                    total_price_per_hour: sku.pricePerHour, // Initial value before storage
                    network_performance: 'Standard', // Default
                    vram_gb: null,
                    pricing_model: sku.pricingModel,
                    gpu_type: sku.gpu_type || null,
                    gpu_count: sku.gpu_count || 0
                });
                isPredefinedFull = true;
                continue; // Go to next SKU after handling full instance
            } else if (notExplicitComponent && resourceGroupLower.match(/(standard|highmem|highcpu|micro|small|medium|large)/) && !resourceGroupLower.includes('custom')) {
                // Catch other potential full instances based on resource group naming conventions
                console.log(`[GCP Assemble Category] Identified Potential Full Instance (Non-Custom): ${sku.description} (vCPU: ${sku.vcpu}, RAM: ${sku.ram_gb}, Region: ${sku.region})`);
                 identifiedFullInstances.push({
                    ...sku,
                    // Format for compatibility with AWS format
                    provider: 'GCP',
                    instance_sku_id: sku.skuId,
                    compute_price_per_hour: sku.pricePerHour,
                    requested_storage_gb: 0, // Will be set by region_selector
                    requested_storage_type: null, // Will be set by region_selector
                    estimated_storage_cost_per_hour: 0, // Will be calculated by region_selector
                    total_price_per_hour: sku.pricePerHour, // Initial value before storage
                    network_performance: 'Standard', // Default
                    vram_gb: null,
                    pricing_model: sku.pricingModel,
                    gpu_type: sku.gpu_type || null,
                    gpu_count: sku.gpu_count || 0
                });
                isPredefinedFull = true;
                continue; // Go to next SKU
            }
        }
        
        // C. Process component SKUs (CPU, RAM) for later assembly
        // Group by combination key: region_pricingModel_series, e.g., "us-central1_OnDemand_n1"
        const componentKey = `${sku.region}_${sku.pricingModel}_${seriesKey}`;

        if (descriptionLower.includes('core') || (sku.vcpu > 0 && sku.ram_gb === 0 && sku.gpu_count === 0)) {
            if (!cpuComponentSkus[componentKey]) cpuComponentSkus[componentKey] = [];
            cpuComponentSkus[componentKey].push(sku);
            console.log(`[GCP Assemble Category] CPU Component: ${sku.description} (Key: ${componentKey}, vCPU: ${sku.vcpu}, Price: ${sku.pricePerHour})`);
        } else if (descriptionLower.includes('ram') || (sku.ram_gb > 0 && sku.vcpu === 0 && sku.gpu_count === 0)) {
            if (!ramComponentSkus[componentKey]) ramComponentSkus[componentKey] = [];
            ramComponentSkus[componentKey].push(sku);
            console.log(`[GCP Assemble Category] RAM Component: ${sku.description} (Key: ${componentKey}, RAM: ${sku.ram_gb}, Price: ${sku.pricePerHour})`);
        } else if (sku.vcpu > 0 && sku.ram_gb > 0 && !isPredefinedFull) {
            // If it has both vCPU and RAM but wasn't caught as a full instance,
            // it might be a component bundle or an unclassified full instance. Log it for now.
            console.log(`[GCP Assemble Category] Unclassified vCPU/RAM SKU (potential bundle or needs better full-instance rule): ${sku.description} (vCPU: ${sku.vcpu}, RAM: ${sku.ram_gb}, Region: ${sku.region})`);
            // Add to full instances for now, to be reviewed.
            identifiedFullInstances.push({
                ...sku,
                // Format for compatibility with AWS format
                provider: 'GCP',
                instance_sku_id: sku.skuId,
                compute_price_per_hour: sku.pricePerHour,
                requested_storage_gb: 0, // Will be set by region_selector
                requested_storage_type: null, // Will be set by region_selector
                estimated_storage_cost_per_hour: 0, // Will be calculated by region_selector
                total_price_per_hour: sku.pricePerHour, // Initial value before storage
                network_performance: 'Standard', // Default
                vram_gb: null,
                pricing_model: sku.pricingModel,
                gpu_type: sku.gpu_type || null,
                gpu_count: sku.gpu_count || 0
            });
        } else {
            console.log(`[GCP Assemble Category] SKU not fitting primary categories: ${sku.description} vCPU:${sku.vcpu} RAM:${sku.ram_gb} GPU:${sku.gpu_count}`);
        }
    }

    // Step 2: Assemble directly identified full instances
    for (const instance of identifiedFullInstances) {
        // Standardize field names
        const standardizedInstance = {
            ...instance,
            provider: 'GCP',
            instance_sku_id: instance.instance_sku_id || instance.skuId,
            instance_type: instance.instance_sku_id || instance.skuId,
            compute_price_per_hour: instance.compute_price_per_hour || instance.pricePerHour,
            pricing_model: instance.pricing_model || instance.pricingModel, 
            ram_gb: instance.ram_gb,
            ramGB: instance.ram_gb,
            vcpu: instance.vcpu,
            gpu_type: instance.gpu_type || null,
            gpuType: instance.gpu_type || null,
            gpu_count: instance.gpu_count || 0,
            gpuCount: instance.gpu_count || 0,
            vram_gb: instance.vram_gb || null,
            vramGB: instance.vram_gb || null,
            network_performance: instance.network_performance || 'Standard',
            total_price_per_hour: instance.total_price_per_hour || instance.pricePerHour
        };
        finalAssembledInstances.push(standardizedInstance);
    }
    console.log(`[GCP Assemble] Added ${identifiedFullInstances.length} directly identified full instances.`);

    // Step 3: Try to combine CPU and RAM components that match by their grouping keys
    // This is complex and depends on the component SKU format, but we try a simple approach:
    console.log(`[GCP Assemble] Attempting to combine ${Object.keys(cpuComponentSkus).length} CPU component groups with RAM components.`);
    
    for (const key in cpuComponentSkus) {
        const cpus = cpuComponentSkus[key];
        const rams = ramComponentSkus[key] || [];
        
        if (cpus.length > 0 && rams.length > 0) {
            console.log(`[GCP Assemble] For key ${key}, found ${cpus.length} CPU SKUs and ${rams.length} RAM SKUs to potentially combine.`);
            
            // Skip custom machine types for now as they need special handling
            if (key.includes('custom')) {
                // For "custom" SKUs, `parseGcpSkuInfo` often sets cpuSku.vcpu to 1 (per core price)
                // and ramSku.ram_gb to 1 (per GB price).
                // We cannot easily form "full" instances here without knowing target vCPU/RAM configurations.
                // For now, we will log and skip direct assembly for "custom" components in this loop,
                // but it's worth implementing in the future.
                console.log(`[GCP Assemble] Skipping automatic assembly of custom instance components for key ${key}. This would require specific target configurations.`);
                continue;
            }
            
            // Simple combination: Take 1st CPU SKU x 1st RAM SKU in each group with same region/series
            // This is a simplification - in reality, you might need more complex matching logic
            if (cpus.length > 0 && rams.length > 0) {
                const cpuSku = cpus[0]; // Take first CPU SKU in each group for now
                const regions = cpuSku.region;

                for (const ramSku of rams) {
                    // This simple combination assumes cpuSku.vcpu and ramSku.ram_gb from parseGcpSkuInfo are the *actual* amounts for a combinable unit.
                    // This is often NOT the case for N1/N2 etc. where cpuSku is "1 vCPU" and ramSku is "1 GB RAM".
                    // The real N1/N2/E2 predefined SKUs should have been caught by `identifiedFullInstances`.
                    
                    // Ensure both parts reference the same region
                    if (ramSku.region !== regions) {
                        console.log(`[GCP Assemble] Region mismatch for ${key}: CPU region ${regions} vs RAM region ${ramSku.region}`);
                        continue; // Skip this combination due to region mismatch
                    }

                    // Ensure we don't double-add if somehow parseGcpSkuInfo gave both CPU and RAM to one component
                    if (cpuSku.vcpu > 0 && ramSku.ram_gb > 0) {
                        const combinedPrice = (cpuSku.pricePerHour || 0) + (ramSku.pricePerHour || 0);
                        const seriesFromKey = key.split('_')[2]; // e.g., "n1", "e2"
                        const assembledDescription = `Assembled ${seriesFromKey}: ${cpuSku.vcpu} vCPU, ${ramSku.ram_gb} GB RAM`;
                        
                        console.log(`[GCP Assemble] Combining CPU: ${cpuSku.description} (vCPU: ${cpuSku.vcpu}) with RAM: ${ramSku.description} (RAM: ${ramSku.ram_gb}) for key ${key}`);
                        
                        const combinedInstance = {
                            provider: 'GCP',
                            region: cpuSku.region,
                            location: getGcpRegionDisplay(cpuSku.region),
                            instance_sku_id: `assembled_${seriesFromKey}_${cpuSku.vcpu}vcpu_${ramSku.ram_gb}gb`,
                            instance_type: `assembled_${seriesFromKey}_${cpuSku.vcpu}vcpu_${ramSku.ram_gb}gb`,
                            description: assembledDescription,
                            pricingModel: cpuSku.pricingModel, // Assuming same pricing model
                            pricing_model: cpuSku.pricingModel, // Standardized field name
                            vcpu: cpuSku.vcpu,
                            ram_gb: ramSku.ram_gb,
                            ramGB: ramSku.ram_gb, // Legacy field name
                            compute_price_per_hour: combinedPrice,
                            currency: cpuSku.currency || ramSku.currency || 'USD',
                            gpu_type: null,
                            gpu_count: 0,
                            gpuType: null,
                            gpuCount: 0,
                            vram_gb: null,
                            vramGB: null,
                            network_performance: 'Standard', // Default
                            requested_storage_gb: 0, // Will be set by region_selector
                            requested_storage_type: null, // Will be set by region_selector
                            estimated_storage_cost_per_hour: 0, // Will be calculated by region_selector
                            total_price_per_hour: combinedPrice // Initial value before storage
                        };
                        
                        finalAssembledInstances.push(combinedInstance);
                    }
                }
            }
        }
    }
    console.log(`[GCP Assemble] After CPU/RAM combination, total instances: ${finalAssembledInstances.length}.`);

    // Step 4: Add GPUs to the mix (simplification - real implementation might attach GPUs to specific instance types)
    for (const gpuSku of gpuSkus) {
        // For now, treat GPU SKUs as standalone GPU-optimized instances
        // Real implementation would need to handle attachment to specific instance types
        const gpuInstance = {
            provider: 'GCP',
            region: gpuSku.region,
            location: getGcpRegionDisplay(gpuSku.region),
            instance_sku_id: `gpu_${gpuSku.skuId}`,
            instance_type: `gpu_${gpuSku.skuId}`,
            description: `GPU Instance: ${gpuSku.description}`,
            compute_price_per_hour: gpuSku.pricePerHour,
            currency: gpuSku.currency || 'USD',
            vcpu: gpuSku.vcpu || 4, // Default to 4 vCPU for GPU instances if not specified
            ram_gb: gpuSku.ram_gb || 16, // Default to 16 GB RAM for GPU instances if not specified
            ramGB: gpuSku.ram_gb || 16, // Also add legacy field name
            gpu_type: gpuSku.gpu_type,
            gpuType: gpuSku.gpu_type,
            gpu_count: gpuSku.gpu_count,
            gpuCount: gpuSku.gpu_count,
            vram_gb: null, // May be calculated based on gpu_type
            vramGB: null, // Legacy field name
            network_performance: 'Up to 10 Gbps', // Default for GPU instances
            requested_storage_gb: 0, // Will be set by region_selector
            requested_storage_type: null, // Will be set by region_selector
            estimated_storage_cost_per_hour: 0, // Will be calculated by region_selector
            total_price_per_hour: gpuSku.pricePerHour, // Initial value before storage
            pricing_model: gpuSku.pricingModel
        };
        finalAssembledInstances.push(gpuInstance);
    }
    console.log(`[GCP Assemble] After adding GPU SKUs, total instances: ${finalAssembledInstances.length}.`);

    // Step 5: Deduplicate the finalAssembledInstances based on distinct configurations
    const uniqueInstances = [];
    const seenKeys = new Set();
    
    for (const inst of finalAssembledInstances) {
        // Create a key that uniquely identifies an instance configuration for deduplication purposes
        // For assembled instances, skuId is already unique. For others, it's the original skuId.
        // Region, pricingModel, vcpu, ram_gb, gpu_type, gpu_count are primary differentiators.
        const key = `${inst.instance_sku_id}_${inst.region}_${inst.pricing_model}_${inst.vcpu}_${inst.ram_gb}_${inst.gpu_type || ''}_${inst.gpu_count || 0}`;
        if (!seenKeys.has(key)) {
            // Ensure field names are consistent
            const standardizedInstance = {
                ...inst,
                // Required fields for allocation_algorithm.js
                instance_type: inst.instance_sku_id, // Alias for compatibility
                pricing_model: inst.pricing_model || inst.pricingModel, // Ensure consistent naming
                pricing_modell: inst.pricing_model || inst.pricingModel, // Just in case (typo in code)
                ram_gb: inst.ram_gb, // Ensure this is set
                // Other name variations some code might use
                ramGB: inst.ram_gb,
                gpuCount: inst.gpu_count,
                gpuType: inst.gpu_type
            };
            
            uniqueInstances.push(standardizedInstance);
            seenKeys.add(key);
        }
    }

    console.log(`[GCP Assemble] Assembly finished. Returning ${uniqueInstances.length} unique assembled/identified instances.`);
    
    // Sample log of final structure for first few instances
    if (uniqueInstances.length > 0) {
        const sampleCount = Math.min(3, uniqueInstances.length);
        console.log(`[GCP Assemble] Sample of final assembled instances (${sampleCount}):`);
        for (let i = 0; i < sampleCount; i++) {
            console.log(`Sample ${i+1}:`, JSON.stringify(uniqueInstances[i], null, 2));
        }
    }
    
    return uniqueInstances;
}

/**
 * Fetch GCP VM prices from the Billing Catalog API
 * @returns {Promise<Array>} Array of standardized VM pricing objects
 */
async function fetchGcpVmPrices() {
    try {
        console.log('----------------------------------------------------');
        console.log('STARTING FRESH GCP VM PRICE FETCH');
        console.log('----------------------------------------------------');
        
        // Attempt to clear existing cache to force regeneration
        try {
            if (fs.existsSync(CACHE_FILE)) {
                fs.unlinkSync(CACHE_FILE);
                console.log(`Cleared existing GCP cache file at ${CACHE_FILE}`);
            }
        } catch (clearErr) {
            console.error(`Failed to clear GCP cache: ${clearErr.message}`);
        }
        
        await initGcpClient();
        if (!billingClient) {
            throw new Error('GCP Billing client not initialized');
        }
        
        const computeEngineServiceId = await getComputeEngineServiceId();
        if (!computeEngineServiceId) {
            throw new Error('Failed to get Compute Engine service ID');
        }

        const allParsedSkusWithRegion = [];
        let nextPageToken = null;
        let pageCount = 0; // Add page counter

        console.log(`Fetching SKUs for ${computeEngineServiceId}...`);

        do {
            pageCount++; // Increment counter
            console.log(`Fetching GCP SKU page ${pageCount}...`);

            const request = {
                parent: computeEngineServiceId,
                pageSize: 500,
                pageToken: nextPageToken,
                // autoPaginate: false, // Explicitly disable autoPaginate if manually handling tokens
                // currencyCode: 'USD' // Optional: specify currency
            };

            const skusCallResponse = await billingClient.listSkus(request);
            // skusCallResponse is an array: [response, nextRequestObjectIfAny, rawResponseObject]
            // We are interested in the first element, which is the primary response object.
            const skusPageResponse = skusCallResponse[0]; 

            console.log(`[GCP Fetch Debug] Page ${pageCount}: skusCallResponse structure type: ${typeof skusCallResponse}`);
            if (Array.isArray(skusCallResponse)) {
                console.log(`[GCP Fetch Debug] Page ${pageCount}: skusCallResponse is an array with length: ${skusCallResponse.length}`);
            }
            
            let skusInPage = [];
            let currentPageNextToken = null;
            
            // CRITICAL FIX: Based on logs, it appears the response structure doesn't match expectations
            // The response may directly be an array of SKUs without the expected wrapper structure
            if (Array.isArray(skusPageResponse)) {
                // The response itself is the array of SKUs (no .skus property)
                console.log(`[GCP Fetch Debug] Page ${pageCount}: skusPageResponse IS an array. Treating as direct SKU array.`);
                skusInPage = skusPageResponse;
                currentPageNextToken = null; // Can't paginate when not using structure with nextPageToken
            } else if (skusPageResponse && typeof skusPageResponse === 'object') {
                console.log(`[GCP Fetch Debug] Page ${pageCount}: skusPageResponse is an object. Evaluating properties.`);
                
                // Check for skus property
                if (skusPageResponse.hasOwnProperty('skus')) {
                    console.log(`[GCP Fetch Debug] Page ${pageCount}: skusPageResponse HAS 'skus' property.`);
                    console.log(`[GCP Fetch Debug] Page ${pageCount}: typeof skusPageResponse.skus: ${typeof skusPageResponse.skus}`);
                    console.log(`[GCP Fetch Debug] Page ${pageCount}: Array.isArray(skusPageResponse.skus): ${Array.isArray(skusPageResponse.skus)}`);

                    if (Array.isArray(skusPageResponse.skus)) {
                        skusInPage = skusPageResponse.skus;
                        console.log(`[GCP Fetch Debug] Page ${pageCount}: skusPageResponse.skus IS an array. Length: ${skusInPage.length}`);
                    } else {
                        console.warn(`[GCP Fetch Debug] Page ${pageCount}: skusPageResponse.skus is NOT an array. Value:`, skusPageResponse.skus);
                        skusInPage = []; // Default to empty if not an array
                    }
                } else {
                    // Even if there's no skus property, let's check if this is a single SKU object
                    // Signs of a SKU: would have properties like 'name', 'skuId', 'description', 'category'
                    if (skusPageResponse.hasOwnProperty('name') && 
                        skusPageResponse.hasOwnProperty('skuId') && 
                        skusPageResponse.hasOwnProperty('description') && 
                        skusPageResponse.hasOwnProperty('category')) {
                        console.log(`[GCP Fetch Debug] Page ${pageCount}: skusPageResponse appears to be a single SKU object. Adding to skusInPage.`);
                        skusInPage = [skusPageResponse]; // Treat as a single SKU object
                    } else {
                        console.warn(`[GCP Fetch Debug] Page ${pageCount}: skusPageResponse does NOT have a 'skus' property or SKU signature.`);
                        skusInPage = []; // Default to empty
                    }
                }

                // Check for nextPageToken property
                if (skusPageResponse.hasOwnProperty('nextPageToken')) {
                    console.log(`[GCP Fetch Debug] Page ${pageCount}: skusPageResponse HAS 'nextPageToken' property. Value: ${skusPageResponse.nextPageToken}`);
                    currentPageNextToken = skusPageResponse.nextPageToken || null;
                } else {
                    console.warn(`[GCP Fetch Debug] Page ${pageCount}: skusPageResponse does NOT have a 'nextPageToken' property.`);
                    currentPageNextToken = null;
                }

            } else {
                console.warn(`[GCP Fetch Debug] Page ${pageCount}: skusPageResponse was null, undefined, or not an object. Value:`, skusPageResponse);
                skusInPage = [];
                currentPageNextToken = null;
            }
            
            console.log(`[GCP Fetch Debug] Page ${pageCount}: Assigning ${skusInPage.length} SKUs to skusInPage.`);
            console.log(`[GCP Fetch Debug] Page ${pageCount}: Assigning Next Page Token: ${currentPageNextToken}`);

            for (const sku of skusInPage) { 
                const parsedSkuBase = parseGcpSkuInfo(sku); 
                
                if (parsedSkuBase) {
                    // Add region information for each region where this SKU is available
                    // and add to a flat list for later assembly
                    for (const region of sku.serviceRegions || []) {
                        allParsedSkusWithRegion.push({
                            ...parsedSkuBase, // contains vcpu, ram_gb etc. IF parsed for this SKU
                            region: region,
                            // Retain original pricingModel from parseGcpSkuInfo
                            pricingModel: parsedSkuBase.pricingModel 
                        });
                    }
                }
            }
            
            nextPageToken = currentPageNextToken; 
        } while (nextPageToken && pageCount < 200); 

        console.log(`Fetched and parsed ${allParsedSkusWithRegion.length} raw SKU-region combinations from GCP Billing Catalog.`);
        
        // New step: Assemble instances from the parsed SKUs
        const assembledInstances = assembleGcpInstances(allParsedSkusWithRegion);
        
        console.log(`Returning ${assembledInstances.length} assembled GCP instances.`);
        return assembledInstances; // Return the assembled instances
    } catch (error) {
        console.error(`[GCP Fetch ERROR] ${error.message}`);
        console.error(error.stack);
        return [];
    }
}

/**
 * Fetch sample GCP prices for testing (limits to a few entries)
 * Useful for development and debugging
 */
async function fetchSampleGcpPrices() {
    try {
        const skus = await fetchGcpVmPrices(); // Use the full fetch with page limit
        
        // Get a sample of CPU, RAM, and GPU resources
        const cpuSample = skus.filter(s => s.resourceType === 'CPU' && s.region === 'us-central1').slice(0, 3);
        const ramSample = skus.filter(s => s.resourceType === 'RAM' && s.region === 'us-central1').slice(0, 2);
        const gpuSample = skus.filter(s => s.resourceType === 'GPU' && s.region === 'us-central1').slice(0, 3);
        
        return [...cpuSample, ...ramSample, ...gpuSample];
    } catch (error) {
        console.error('Error fetching sample GCP prices:', error);
        return [];
    }
}

/**
 * Load GCP VM prices, using cache if available and not expired.
 * Fetches new data and updates cache if necessary.
 * @returns {Promise<Array>} Array of standardized VM pricing objects
 */
async function loadGcpPrices() {
    try {
        // Try to load from cache first if exists and valid
        if (fs.existsSync(CACHE_FILE)) {
            const cacheStats = fs.statSync(CACHE_FILE);
            const cacheAge = Date.now() - cacheStats.mtimeMs;
            
            if (cacheAge < MAX_CACHE_AGE_MS) {
                console.log(`Loading GCP prices from cache (age: ${(cacheAge / 1000 / 60).toFixed(2)} minutes)`);
                const cachedData = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
                return cachedData;
            } else {
                console.log(`GCP price cache expired (age: ${(cacheAge / 1000 / 60).toFixed(2)} minutes). Fetching fresh data...`);
            }
        } else {
            console.log('No GCP price cache found. Fetching fresh data...');
        }
        
        // Fetch fresh data
        const gcpInstances = await fetchGcpVmPrices();
        
        // Validate and log the final instances
        if (Array.isArray(gcpInstances) && gcpInstances.length > 0) {
            console.log(`Fetched ${gcpInstances.length} formatted GCP instances ready for caching`);
            
            // Sample log of a few instances to verify format
            const sampleSize = Math.min(3, gcpInstances.length);
            for (let i = 0; i < sampleSize; i++) {
                const instance = gcpInstances[i];
                console.log(`Sample GCP instance ${i+1}/${sampleSize}:`, JSON.stringify(instance, null, 2));
            }
            
            // Cache the results
            fs.writeFileSync(CACHE_FILE, JSON.stringify(gcpInstances, null, 2));
            console.log(`Cached ${gcpInstances.length} GCP instances to ${CACHE_FILE}`);
            return gcpInstances;
        } else {
            console.log('GCP price fetch did not return data. Cache not updated.');
            // If we have an old cache, still use that even if it's expired
            if (fs.existsSync(CACHE_FILE)) {
                console.log('Using expired cache as fallback');
                const cachedData = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
                return cachedData;
            } 
            return [];
        }
    } catch (error) {
        console.error(`Error loading GCP prices: ${error.message}`);
        
        // Try to use cached data if available, even if expired
        if (fs.existsSync(CACHE_FILE)) {
            console.log('Error fetching fresh data. Using cached data as fallback.');
            const cachedData = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
            return cachedData;
        }
        
        return [];
    }
}

module.exports = {
    fetchGcpVmPrices,
    parseGcpSkuInfo,
    assembleGcpInstances,
    fetchSampleGcpPrices,
    loadGcpPrices,
    initGcpClient
}; 