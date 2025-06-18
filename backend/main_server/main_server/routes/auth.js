const express = require('express');
const bcrypt = require('bcryptjs');
const { getConnection } = require('../database/db_connection'); // Adjusted path

const router = express.Router();

// POST /api/v1/auth/signup
router.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Username, email, and password are required.' });
    }

    // Basic email validation
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Invalid email format.' });
    }

    if (password.length < 6) { // Example: Minimum password length
        return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    let connection;
    try {
        connection = await getConnection();

        // Check if username or email already exists
        const [existingUsers] = await connection.execute(
            'SELECT UserID FROM Users WHERE Username = ? OR Email = ?',
            [username, email]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({ message: 'Username or email already exists.' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Insert new user
        const [result] = await connection.execute(
            'INSERT INTO Users (Username, Email, PasswordHash) VALUES (?, ?, ?)',
            [username, email, passwordHash]
        );

        res.status(201).json({ message: 'User created successfully', userId: result.insertId });

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Internal server error during signup.' });
    } finally {
        if (connection) {
            try {
                connection.release();
                console.log('MySQL connection released back to pool.');
            } catch (releaseError) {
                console.error('Error releasing MySQL connection:', releaseError);
            }
        }
    }
});

// POST /api/v1/auth/login
router.post('/login', async (req, res) => {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || !password) {
        return res.status(400).json({ message: 'Username/email and password are required.' });
    }

    let connection;
    try {
        connection = await getConnection();

        // Find user by username or email
        const [users] = await connection.execute(
            'SELECT UserID, Username, Email, PasswordHash FROM Users WHERE Username = ? OR Email = ?',
            [usernameOrEmail, usernameOrEmail]
        );

        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials.' }); // User not found
        }

        const user = users[0];

        // Compare password
        const isMatch = await bcrypt.compare(password, user.PasswordHash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' }); // Incorrect password
        }

        // Login successful (later, generate JWT or session here)
        res.status(200).json({ 
            message: 'Login successful', 
            user: { 
                userId: user.UserID, 
                username: user.Username, 
                email: user.Email 
            }
            // token: 'YOUR_JWT_TOKEN_HERE' // Placeholder for JWT
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error during login.' });
    } finally {
        if (connection) {
            try {
                connection.release();
                console.log('MySQL connection released back to pool.');
            } catch (releaseError) {
                console.error('Error releasing MySQL connection:', releaseError);
            }
        }
    }
});

module.exports = router; 