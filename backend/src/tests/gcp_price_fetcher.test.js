/**
 * GCP Price Fetcher Test Script
 * 
 * Tests fetching sample GCP VM pricing information.
 * Run from main_server/ directory with: node tests/gcp_price_fetcher.test.js
 */

const gcpPriceFetcher = require('../vm_allocation_engine/price_fetchers/gcp_price_fetcher'); // Updated path
const credentialsManager = require('../vm_allocation_engine/credentials_manager'); // Updated path

async function testGcpFetching() {
    console.log('Testing GCP Price Fetcher...');

    try {
        // Ensure credentials can be loaded (optional, as initGcpClient handles it)
        await credentialsManager.loadGcpCredentials();
        console.log('GCP credentials appear loadable.');

        // Initialize client (will throw if creds fail)
        await gcpPriceFetcher.initGcpClient();
        console.log('GCP client initialized.');

        // Fetch sample prices
        console.log('\n--- Fetching Sample GCP Prices ---');
        const samplePrices = await gcpPriceFetcher.fetchSampleGcpPrices();

        if (samplePrices && samplePrices.length > 0) {
            console.log(`Successfully fetched ${samplePrices.length} sample GCP prices.`);
            console.log('First sample:', JSON.stringify(samplePrices[0], null, 2));
        } else if (samplePrices) {
            console.log('Fetched GCP prices, but the sample array was empty.');
        } else {
            console.log('Failed to fetch sample GCP prices, result was undefined or null.');
        }

    } catch (error) {
        console.error('\nError during GCP price fetcher test:', error);
    }

    console.log('\nGCP price fetcher test finished.');
}

// Run the test function
testGcpFetching(); 