const mysql = require('mysql2/promise');

const dbConfig = {
    host: '127.0.0.1', // Or your Docker host IP if not localhost
    port: 3306,
    user: 'root',
    password: 'supersecretpassword', // Same as in docker-compose.yml
    database: 'run_ai_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

async function getConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('MySQL connection acquired from pool.');
        return connection;
    } catch (error) {
        console.error('Error getting MySQL connection from pool:', error);
        throw error; // Re-throw the error to be handled by the caller
    }
}

module.exports = { pool, getConnection }; 