const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

const dbConfig = {
    host: '127.0.0.1', // Or your Docker host IP if not localhost
    port: 3306,
    user: 'root',
    password: 'supersecretpassword', // Same as in docker-compose.yml
    database: 'run_ai_db'
};

const schemaFilePath = path.join(__dirname, 'db_schema.sql');

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkAndCreateSchema() {
    let connection;
    try {
        // Add a delay to allow MySQL container to initialize
        console.log('Waiting for MySQL to initialize (10 seconds)...');
        await delay(10000);

        // Connect to MySQL server (without specifying a database initially to check if db exists)
        connection = await mysql.createConnection({
            host: dbConfig.host,
            port: dbConfig.port,
            user: dbConfig.user,
            password: dbConfig.password
        });
        console.log('Successfully connected to MySQL server.');

        // Check if database exists, create if not
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        console.log(`Database '${dbConfig.database}' ensured.`);
        
        // Close initial connection and reconnect to the specific database
        await connection.end();
        
        connection = await mysql.createConnection(dbConfig);
        console.log(`Successfully connected to database '${dbConfig.database}'.`);

        // Read schema.sql file
        console.log(`Reading schema from ${schemaFilePath}...`);
        const schemaSql = await fs.readFile(schemaFilePath, 'utf-8');
        
        // Split SQL statements. Handles simple cases; might need improvement for complex SQL with semicolons in comments/strings.
        const sqlCommands = schemaSql.split(';').map(cmd => cmd.trim()).filter(cmd => cmd.length > 0);

        for (const command of sqlCommands) {
            if (command.toUpperCase().startsWith('CREATE TABLE')) {
                console.log(`Executing: ${command.substring(0, 100)}${command.length > 100 ? '...' : ''}`);
                await connection.query(command);
                console.log(`Table creation statement executed successfully.`);
            } else if (!command.startsWith('--')) { // Execute other commands if not comments
                console.log(`Executing: ${command}`);
                await connection.query(command);
            }
        }
        console.log('Database schema checked and applied successfully.');

    } catch (error) {
        console.error('Failed to check/create schema:', error);
        if (error.code === 'ECONNREFUSED') {
            console.error('Connection refused. Is the MySQL Docker container running and port 3306 exposed?');
            console.error('You can start it with: docker-compose up -d');
        }
    } finally {
        if (connection) {
            await connection.end();
            console.log('MySQL connection closed.');
        }
    }
}

checkAndCreateSchema(); 