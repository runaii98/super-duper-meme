const express = require('express');
const cors = require('cors');
const chalk = require('chalk');
const credentialsManager = require('./vm_allocation_engine/credentials_manager');

const app = express();
const PORT = process.env.PORT || 3006;

// --- CORS Configuration ---
const allowedOrigins = ['http://localhost:3000']; // Add any other origins if needed

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Add all methods your API supports
  allowedHeaders: ['Content-Type', 'Authorization'], // Add any custom headers your frontend might send
  credentials: true // If you need to handle cookies or authorization headers
};

app.use(cors(corsOptions));
// --- End CORS Configuration ---

// Middleware to parse JSON bodies
app.use(express.json());

// Load API routes
require('./api_routes')(app);


/**
 * Starts the server after performing critical startup checks.
 * This function ensures that credentials are valid before accepting connections.
 */
const startServer = async () => {
    console.log('Performing startup credential check...');
    try {
        const credentialStatus = await credentialsManager.checkCredentials();
        
        // Log status for all providers
        if (credentialStatus.aws) {
            console.log('✅ AWS credentials are valid.');
        } else {
            console.log('❌ AWS credentials are not valid or not found.');
        }

        if (credentialStatus.gcp) {
            console.log('✅ GCP credentials are valid.');
        } else {
            console.log('❌ GCP credentials are not valid or not found.');
        }

        // Check if at least one provider is available
        if (!credentialStatus.aws && !credentialStatus.gcp) {
            console.error(chalk.red.bold('\n[FATAL ERROR] No valid cloud provider credentials found. The server cannot operate.'));
            console.error(chalk.red('Please ensure at least one set of credentials (for AWS or GCP) is correctly configured.'));
            console.error(chalk.red('Exiting...'));
            process.exit(1); // Exit if no providers are configured
        }

        if (!credentialStatus.aws || !credentialStatus.gcp) {
             console.warn(chalk.yellow('\n⚠️  Warning: Credentials for one or more cloud providers are missing or invalid. Functionality for the affected providers will be disabled.'));
        }

        // Start listening for connections only after successful checks
        app.listen(PORT, () => {
            console.log(chalk.green.bold(`\n🚀 Server listening on port ${PORT}`));
        }).on('error', (err) => {
            // Handle server-specific errors like EADDRINUSE
            console.error(chalk.red.bold(`\n[SERVER ERROR] Failed to start server:`), err.message);
            process.exit(1);
        });

    } catch (error) {
        console.error(chalk.red.bold('\n[FATAL ERROR] An unexpected error occurred during server startup:'), error);
        process.exit(1);
    }
};

// --- Start the Server ---
// We only start the server if this file is run directly
if (require.main === module) {
startServer(); 
}

module.exports = app; // Export for testing purposes