/**
 * AWS Price Fetcher
 * 
 * Fetches EC2 instance pricing information from AWS Pricing API
 * Focuses on instance types, vCPUs, RAM, and GPUs
 */

const { PricingClient, GetProductsCommand } = require("@aws-sdk/client-pricing");
const credentialsManager = require('../credentials_manager');
const fs = require('fs'); // Added for file system operations
const path = require('path'); // Added for path manipulation

// Cache configuration
const CACHE_FILE_ONDEMAND = path.join(__dirname, 'aws_ondemand_prices_cache.json');
const CACHE_FILE_SPOT = path.join(__dirname, 'aws_spot_prices_cache.json'); // Added cache for Spot
const MAX_CACHE_AGE_MS = 60 * 60 * 1000; // 60 minutes

// The client will be initialized with credentials in the init function
let pricingClient = null;

/**
 * Initialize the AWS pricing client with credentials
 * @returns {Promise<void>}
 */
async function initAwsClient() {
    try {
        if (pricingClient) {
            return; // Already initialized
        }
        
        const awsCredentials = await credentialsManager.loadAwsCredentials();
        
        // Create the pricing client with credentials
        // The pricing API is only available in us-east-1
        pricingClient = new PricingClient({ 
            region: "us-east-1",
            credentials: awsCredentials
        });
        
        console.log('AWS Pricing API client initialized successfully');
    } catch (error) {
        console.error('Error initializing AWS client:', error);
        throw error;
    }
}

/**
 * Fetch AWS EC2 instance prices for On-Demand instances
 * @returns {Promise<Array>} Array of standardized VM pricing objects
 */
async function fetchAwsOnDemandPrices() {
    try {
        return await fetchAwsInstancePrices('OnDemand');
    } catch (error) {
        console.error('Error fetching AWS OnDemand prices:', error);
        return [];
    }
}

/**
 * Fetch AWS EC2 instance prices for Spot instances
 * Note: Spot pricing through this API might not be real-time
 * @returns {Promise<Array>} Array of standardized VM pricing objects
 */
async function fetchAwsSpotPrices() {
    try {
        // Note: This API doesn't provide real-time spot prices
        // Alternatively, use EC2 API's describeSpotPriceHistory for current prices
        return await fetchAwsInstancePrices('Spot');
    } catch (error) {
        console.error('Error fetching AWS Spot prices:', error);
        return [];
    }
}

/**
 * Fetch AWS EC2 instance prices filtering by term type (OnDemand or Spot)
 * @param {string} termType - 'OnDemand' or 'Spot'
 * @returns {Promise<Array>} Array of standardized VM pricing objects
 */
async function fetchAwsInstancePrices(termType = 'OnDemand') {
    const allProducts = [];
    let nextToken = undefined;
    let pageCount = 0; // Add page counter
    const maxPages = 50; // Limit pages for testing - INCREASED FROM 5 to 50

    console.log(`Fetching AWS EC2 ${termType} instance prices...`);

    try {
        // Ensure client is initialized
        await initAwsClient();
        
        do {
            pageCount++; // Increment counter
            console.log(`Fetching AWS ${termType} page ${pageCount}...`);

            let commandFilters = [];
            if (termType === 'OnDemand') {
                // Use the original, more specific filters for OnDemand
                commandFilters = [
                    { Type: "TERM_MATCH", Field: "termType", Value: termType },
                    { Type: "TERM_MATCH", Field: "operatingSystem", Value: "Linux" },
                    { Type: "TERM_MATCH", Field: "currentGeneration", Value: "Yes" },
                    { Type: "TERM_MATCH", Field: "tenancy", Value: "Shared" },
                    { Type: "TERM_MATCH", Field: "operation", Value: "RunInstances" },
                    { Type: "TERM_MATCH", Field: "capacitystatus", Value: "Used" }
                ];
            } else { // For Spot
                console.log(`Using minimal filter (termType only) for Spot fetch. Max pages: ${maxPages}. Note: AWS Pricing API has limited Spot data.`);
                commandFilters = [
                    { Type: "TERM_MATCH", Field: "termType", Value: termType }
                ];
            }

            const command = new GetProductsCommand({
                ServiceCode: "AmazonEC2",
                Filters: commandFilters, // Use the dynamically built filters
                FormatVersion: "aws_v1",
                NextToken: nextToken,
                MaxResults: 100, // Max is 100
            });

            const output = await pricingClient.send(command);
            
            console.log(`Fetched ${output.PriceList.length} AWS ${termType} products in this page`);

            if (output.PriceList) {
                for (let i = 0; i < output.PriceList.length; i++) {
                    const priceItem = output.PriceList[i];
                    // Log the raw priceItem for the first 2 items on the first page for debugging
                    if (pageCount === 1 && i < 2) { 
                        console.log('Raw priceItem from AWS API:', JSON.stringify(priceItem, null, 2));
                    }

                    let product;
                    try {
                        // Check if it's a String object and convert before parsing
                        if (typeof priceItem === 'object' && priceItem !== null && typeof priceItem.toString === 'function') {
                             product = JSON.parse(priceItem.toString());
                        } else if (typeof priceItem === 'string') {
                             product = JSON.parse(priceItem); 
                        } else {
                             product = priceItem; // Assume already an object
                        }
                        // Log the parsed product for the first 2 items on the first page for debugging
                        if (pageCount === 1 && i < 2) {
                            console.log('Initial parsed product object:', JSON.stringify(product, null, 2));
                        }
                    } catch (parseError) {
                        console.error('Error parsing price item:', parseError, 'Item:', priceItem);
                        continue; // Skip this item
                    }
                    
                    const parsedProduct = parseAwsProductInfo(product, termType);
                    if (parsedProduct) {
                        allProducts.push(parsedProduct);
                    }
                }
            }
            
            nextToken = output.NextToken;
            if (nextToken) {
                console.log(`Fetching next page of AWS ${termType} products...`);
            }
            // Add break condition for testing
            if (pageCount >= maxPages) {
                console.warn(`Reached max page limit (${maxPages}) for AWS ${termType} fetching during test.`);
                nextToken = undefined; // Force loop termination
            }
        } while (nextToken);

        console.log(`Fetched ${allProducts.length} AWS EC2 ${termType} instance prices (limited to ${maxPages} pages).`);
        return allProducts;

    } catch (error) {
        console.error(`Error fetching AWS ${termType} prices:`, error);
        return [];
    }
}

/**
 * Parse AWS product info into a standardized format
 * @param {Object} product - AWS pricing product object
 * @param {string} termType - 'OnDemand' or 'Spot'
 * @returns {Object|null} Parsed product info or null if not relevant/parseable
 */
function parseAwsProductInfo(product, termType) {
    try {
        if (!product || !product.product || !product.product.attributes) {
            console.warn('Skipping AWS product due to missing product or attributes:', product);
            return null;
        }

        const attributes = product.product.attributes;
        
        // Skip if not a compute instance or missing key attributes
        if (!attributes || 
            !attributes.instanceType || 
            !attributes.vcpu || 
            !attributes.memory) {
            // Keep a simple log for genuinely missing critical attributes
            // console.log(`Skipping product ${attributes.instanceType || 'N/A'}: Missing critical attributes (instanceType, vcpu, or memory)`);
            return null;
        }
        
        // Find the price terms (OnDemand or Spot)
        const terms = product.terms[termType];
        if (!terms) {
            return null;
        }
        
        // Get the price per hour
        let pricePerHour = 0;
        for (const termKey in terms) {
            const term = terms[termKey];
            const priceDimensions = term.priceDimensions;
            
            for (const dimensionKey in priceDimensions) {
                const dimension = priceDimensions[dimensionKey];
                
                if (dimension.unit === 'Hrs') {
                    pricePerHour = parseFloat(dimension.pricePerUnit.USD) || 0;
                    break;
                }
            }
            
            if (pricePerHour > 0) {
                break;
            }
        }
        
        // Skip if no valid price found
        if (pricePerHour <= 0) {
            // console.log(`Skipping product ${attributes.instanceType || 'N/A'} due to missing/zero price.`);
            return null;
        }
        
        // Parse memory value (e.g., "16 GiB" -> 16)
        const memoryGB = parseFloat(attributes.memory.replace(/\s*GiB/i, '')) || 0;
        
        // Construct description
        const description = `${attributes.instanceType} - ${attributes.instanceFamily} in ${attributes.location || attributes.regionCode}`;

        // Build the result object according to the desired schema
        const result = {
            provider: 'AWS',
            skuId: attributes.instanceType, // Using instanceType as skuId
            description: description,
            resourceGroup: attributes.instanceFamily, // Using instanceFamily as resourceGroup
            region: attributes.regionCode,
            location: attributes.location,
            vcpu: parseInt(attributes.vcpu, 10) || 0,
            ramGB: memoryGB,
            networkPerformance: attributes.networkPerformance,
            pricingModel: termType,
            pricePerHour: pricePerHour,
            currency: 'USD', // AWS Pricing API returns USD by default
        };
        
        // Add GPU information if available
        if (attributes.gpu) {
            result.gpuCount = parseInt(attributes.gpu, 10) || 0;
            
            // Add GPU type if available, or try to infer from processor info
            if (attributes.gpuMemory) {
                // Parse GPU memory if available (e.g., "16 GiB" -> 16)
                const gpuMemoryMatch = attributes.gpuMemory.match(/(\d+(?:\.\d+)?)\s*GiB/i);
                result.vramGB = gpuMemoryMatch ? parseFloat(gpuMemoryMatch[1]) : 0;
            }
            
            // Try to extract GPU type from instance type for known GPU instances
            if (attributes.instanceType.startsWith('p') || 
                attributes.instanceType.startsWith('g') ||
                attributes.instanceType.startsWith('inf')) {
                
                if (attributes.instanceType.startsWith('p3')) {
                    result.gpuType = 'NVIDIA V100';
                } else if (attributes.instanceType.startsWith('p4')) {
                    result.gpuType = 'NVIDIA A100';
                } else if (attributes.instanceType.startsWith('g4dn')) {
                    result.gpuType = 'NVIDIA T4';
                } else if (attributes.instanceType.startsWith('g5')) {
                    result.gpuType = 'NVIDIA A10G';
                } else {
                    // Generic label for other GPU types
                    result.gpuType = attributes.processorFeatures || 'GPU';
                }
            }
            // Ensure vramGB is set on the result if parsed
            if (result.vramGB === undefined) result.vramGB = 0; 
        }
        // Additional GPU detection based on instance family
        else if (!result.gpuCount && attributes.instanceType) {
            // Detect GPU instances by instance type prefix
            const instanceType = attributes.instanceType.toLowerCase();
            
            if (instanceType.startsWith('p3')) {
                result.gpuType = 'nvidia-tesla-v100';
                result.gpuCount = instanceType.includes('8xl') ? 4 : 
                                  instanceType.includes('16xl') ? 8 : 
                                  instanceType.includes('24xl') ? 8 : 1;
                result.vramGB = 16; // V100 typically has 16GB VRAM
            } 
            else if (instanceType.startsWith('p4d') || instanceType.startsWith('p4de')) {
                result.gpuType = 'nvidia-tesla-a100';
                result.gpuCount = instanceType.includes('24xl') ? 8 : 1;
                result.vramGB = 40; // A100 typically has 40GB VRAM
            }
            else if (instanceType.startsWith('g4dn')) {
                result.gpuType = 'nvidia-tesla-t4';
                result.gpuCount = instanceType.includes('xlarge') || instanceType.includes('large') ? 1 :
                                 instanceType.includes('2xl') ? 1 :
                                 instanceType.includes('4xl') ? 1 :
                                 instanceType.includes('8xl') ? 1 :
                                 instanceType.includes('12xl') ? 4 :
                                 instanceType.includes('16xl') ? 1 : 1;
                result.vramGB = 16; // T4 typically has 16GB VRAM
            }
            else if (instanceType.startsWith('g5')) {
                result.gpuType = 'nvidia-a10g';
                result.gpuCount = instanceType.includes('xlarge') ? 1 :
                                 instanceType.includes('2xl') ? 1 :
                                 instanceType.includes('4xl') ? 1 :
                                 instanceType.includes('8xl') ? 1 :
                                 instanceType.includes('12xl') ? 4 :
                                 instanceType.includes('16xl') ? 4 :
                                 instanceType.includes('24xl') ? 4 :
                                 instanceType.includes('48xl') ? 8 : 1;
                result.vramGB = 24; // A10G typically has 24GB VRAM
            }
            // For any resource group or description containing "GPU"
            else if (attributes.resourceGroup && attributes.resourceGroup.toLowerCase().includes('gpu') ||
                    result.description.toLowerCase().includes('gpu')) {
                result.gpuType = 'gpu';
                result.gpuCount = 1; // Default to 1 if we detect it's a GPU instance
                result.vramGB = 8;   // Default to 8GB if unknown
            }
        }
        
        return result;
    } catch (error) {
        console.error('Error parsing AWS product:', error);
        return null;
    }
}

/**
 * Fetch both OnDemand and Spot prices and combine them
 * @returns {Promise<Array>} Array of standardized VM pricing objects for both pricing models
 */
async function fetchAwsVmPrices() {
    const onDemandPrices = await fetchAwsOnDemandPrices();
    const spotPrices = await fetchAwsSpotPrices();
    
    return [...onDemandPrices, ...spotPrices];
}

/**
 * Fetch sample AWS prices for testing (limits to a few entries)
 * Useful for development and debugging
 */
async function fetchSampleAwsPrices() {
    try {
        const prices = await fetchAwsOnDemandPrices();
        
        // Get a sample of general purpose, compute optimized, and GPU instances
        const generalPurpose = prices.filter(p => p.instanceFamily === 'm5' || p.instanceFamily === 'm6').slice(0, 2);
        const computeOptimized = prices.filter(p => p.instanceFamily === 'c5' || p.instanceFamily === 'c6').slice(0, 2);
        const gpuInstances = prices.filter(p => p.gpuCount > 0).slice(0, 2);
        
        return [...generalPurpose, ...computeOptimized, ...gpuInstances];
    } catch (error) {
        console.error('Error fetching sample AWS prices:', error);
        return [];
    }
}

/**
 * Load AWS EC2 On-Demand instance prices, using cache if available and not expired.
 * Fetches new data and updates cache if necessary.
 * @returns {Promise<Array>} Array of standardized VM pricing objects for On-Demand
 */
async function loadAwsOnDemandPrices() {
    return await loadAwsPricesWithCache(CACHE_FILE_ONDEMAND, 'OnDemand');
}

/**
 * Load AWS EC2 Spot instance prices, using cache if available and not expired.
 * Fetches new data and updates cache if necessary.
 * Note: Spot prices via this API might not be real-time.
 * @returns {Promise<Array>} Array of standardized VM pricing objects for Spot
 */
async function loadAwsSpotPrices() {
    try {
        // Check if cache file exists
        if (fs.existsSync(CACHE_FILE_SPOT)) {
            const stats = fs.statSync(CACHE_FILE_SPOT);
            const ageMs = Date.now() - stats.mtimeMs;

            if (ageMs < MAX_CACHE_AGE_MS) {
                console.log(`Loading AWS Spot prices from cache (age: ${Math.round(ageMs / 1000)}s)`);
                const cachedData = fs.readFileSync(CACHE_FILE_SPOT, 'utf-8');
                return JSON.parse(cachedData);
            } else {
                console.log(`AWS Spot cache expired. Generating new Spot prices from OnDemand data...`);
            }
        } else {
            console.log(`AWS Spot cache file not found. Generating initial Spot prices from OnDemand data...`);
        }

        // Get OnDemand prices and derive Spot prices from them
        const onDemandPrices = await loadAwsOnDemandPrices();
        
        // Define regional discount factors (similar to GCP approach)
        // These values are typical AWS Spot discounts by region
        const spotDiscounts = {
            'us-east-1': 0.70, // 30% discount
            'us-east-2': 0.75, 
            'us-west-1': 0.72,
            'us-west-2': 0.70,
            'eu-central-1': 0.65,
            'eu-west-1': 0.70,
            'eu-west-2': 0.72,
            'ap-south-1': 0.75,
            'ap-northeast-1': 0.70,
            'ap-northeast-2': 0.72,
            'ap-southeast-1': 0.75,
            'ap-southeast-2': 0.72,
            'sa-east-1': 0.75,
            'default': 0.70 // 30% discount as default
        };
        
        // Generate Spot instances from OnDemand instances
        const spotPrices = onDemandPrices.map(instance => {
            // Apply region-specific discount or default
            const discountFactor = spotDiscounts[instance.region] || spotDiscounts.default;
            
            // Create a deep copy of the instance
            const spotInstance = JSON.parse(JSON.stringify(instance));
            
            // Update pricing model and apply discount
            spotInstance.pricingModel = 'Spot';
            spotInstance.pricePerHour = parseFloat((instance.pricePerHour * discountFactor).toFixed(4));
            
            // Update description to indicate it's a Spot instance
            spotInstance.description = `${instance.description} (Spot)`;
            
            return spotInstance;
        });

        console.log(`Generated ${spotPrices.length} AWS Spot instances from OnDemand data`);
        
        // Save to cache
        if (spotPrices.length > 0) {
            try {
                fs.writeFileSync(CACHE_FILE_SPOT, JSON.stringify(spotPrices, null, 2)); // Use pretty print
                console.log(`Successfully generated ${spotPrices.length} AWS Spot prices and updated cache.`);
            } catch (writeErr) {
                console.error(`Error writing to AWS Spot cache file:`, writeErr);
            }
        }
        
        return spotPrices;
    } catch (error) {
        console.error(`Error generating AWS Spot prices:`, error);
        return [];
    }
}

/**
 * Generic function to load AWS prices with caching logic.
 * @param {string} cacheFile - Path to the cache file.
 * @param {string} termType - 'OnDemand' or 'Spot'.
 * @returns {Promise<Array>} Array of standardized VM pricing objects.
 */
async function loadAwsPricesWithCache(cacheFile, termType) {
    // Reset log count for each load operation if it were still in use for parseAwsProductInfo
    // if (typeof parseAwsProductInfo.logCount !== 'undefined') {
    //     delete parseAwsProductInfo.logCount;
    // }
    try {
        if (fs.existsSync(cacheFile)) {
            const stats = fs.statSync(cacheFile);
            const ageMs = Date.now() - stats.mtimeMs;

            if (ageMs < MAX_CACHE_AGE_MS) {
                console.log(`Loading AWS ${termType} prices from cache (age: ${Math.round(ageMs / 1000)}s)`);
                const cachedData = fs.readFileSync(cacheFile, 'utf-8');
                return JSON.parse(cachedData);
            } else {
                console.log(`AWS ${termType} cache expired (age: ${Math.round(ageMs / 1000)}s > ${MAX_CACHE_AGE_MS / 1000}s). Fetching new prices...`);
            }
        } else {
            console.log(`AWS ${termType} cache file not found. Fetching initial prices...`);
        }
    } catch (err) {
        console.error(`Error checking or reading AWS ${termType} cache file:`, err);
        // Proceed to fetch new data
    }

    // Fetch new data
    let freshData = [];
    try {
        // Call the underlying fetch function for the specific term type
        freshData = await fetchAwsInstancePrices(termType);

        // Update cache only if fetch was successful
        if (freshData && freshData.length > 0) {
            try {
                fs.writeFileSync(cacheFile, JSON.stringify(freshData, null, 2)); // Use pretty print
                console.log(`Successfully fetched ${freshData.length} AWS ${termType} prices and updated cache.`);
            } catch (writeErr) {
                console.error(`Error writing to AWS ${termType} cache file:`, writeErr);
            }
        } else {
            console.warn(`AWS ${termType} price fetch did not return data. Cache not updated.`);
        }
    } catch (fetchErr) {
        console.error(`Unhandled error during fetchAwsInstancePrices (${termType}) execution:`, fetchErr);
        freshData = []; // Ensure empty array on error
    }

    return freshData;
}

module.exports = {
    fetchAwsVmPrices,
    fetchAwsOnDemandPrices,
    fetchAwsSpotPrices,
    fetchSampleAwsPrices,
    parseAwsProductInfo,
    loadAwsOnDemandPrices,
    loadAwsSpotPrices,
    initAwsClient
}; 