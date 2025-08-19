const express = require('express');
const cors = require('cors');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'calculator_app',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
async function initializeDatabase() {
    try {
        const connection = await pool.getConnection();
        console.log('Database connected successfully');
        connection.release();
    } catch (error) {
        console.error('Database connection failed:', error.message);
        process.exit(1);
    }
}

// API Routes

// Create user session
app.post('/api/session', async (req, res) => {
    try {
        const { sessionId } = req.body;
        
        const [result] = await pool.execute(
            'INSERT INTO users (session_id) VALUES (?) ON DUPLICATE KEY UPDATE last_active = CURRENT_TIMESTAMP',
            [sessionId]
        );
        
        res.json({ 
            success: true, 
            sessionId: sessionId,
            message: 'Session initialized successfully'
        });
    } catch (error) {
        console.error('Session creation error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create session' 
        });
    }
});

// Save calculation
app.post('/api/calculations', async (req, res) => {
    try {
        const { sessionId, expression, result, operationType } = req.body;
        
        // Get user ID from session
        const [userResult] = await pool.execute(
            'SELECT id FROM users WHERE session_id = ?',
            [sessionId]
        );
        
        if (userResult.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Session not found' 
            });
        }
        
        const userId = userResult[0].id;
        
        // Save calculation
        const [calcResult] = await pool.execute(
            'INSERT INTO calculations (user_id, expression, result, operation_type) VALUES (?, ?, ?, ?)',
            [userId, expression, result, operationType]
        );
        
        res.json({ 
            success: true, 
            calculationId: calcResult.insertId,
            message: 'Calculation saved successfully'
        });
    } catch (error) {
        console.error('Save calculation error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to save calculation' 
        });
    }
});

// Get calculation history
app.get('/api/calculations/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const limit = parseInt(req.query.limit) || 50;
        
        // Get user ID from session
        const [userResult] = await pool.execute(
            'SELECT id FROM users WHERE session_id = ?',
            [sessionId]
        );
        
        if (userResult.length === 0) {
            return res.json([]);
        }
        
        const userId = userResult[0].id;
        
        // Get calculations
        const [calculations] = await pool.execute(
            `SELECT expression, result, operation_type, created_at 
             FROM calculations 
             WHERE user_id = ? 
             ORDER BY created_at DESC 
             LIMIT ?`,
            [userId, limit]
        );
        
        res.json(calculations);
    } catch (error) {
        console.error('Get calculations error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to retrieve calculations' 
        });
    }
});

// Clear calculation history
app.delete('/api/calculations/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        // Get user ID from session
        const [userResult] = await pool.execute(
            'SELECT id FROM users WHERE session_id = ?',
            [sessionId]
        );
        
        if (userResult.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Session not found' 
            });
        }
        
        const userId = userResult[0].id;
        
        // Delete calculations
        await pool.execute(
            'DELETE FROM calculations WHERE user_id = ?',
            [userId]
        );
        
        res.json({ 
            success: true, 
            message: 'History cleared successfully' 
        });
    } catch (error) {
        console.error('Clear calculations error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to clear history' 
        });
    }
});

// Get calculation statistics
app.get('/api/stats/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        // Get user ID from session
        const [userResult] = await pool.execute(
            'SELECT id FROM users WHERE session_id = ?',
            [sessionId]
        );
        
        if (userResult.length === 0) {
            return res.json({});
        }
        
        const userId = userResult[0].id;
        
        // Get statistics
        const [stats] = await pool.execute(
            `SELECT 
                COUNT(*) as total_calculations,
                COUNT(CASE WHEN operation_type = '+' THEN 1 END) as additions,
                COUNT(CASE WHEN operation_type = '-' THEN 1 END) as subtractions,
                COUNT(CASE WHEN operation_type = '*' THEN 1 END) as multiplications,
                COUNT(CASE WHEN operation_type = '/' THEN 1 END) as divisions,
                DATE(MIN(created_at)) as first_calculation,
                DATE(MAX(created_at)) as last_calculation
             FROM calculations 
             WHERE user_id = ?`,
            [userId]
        );
        
        res.json(stats[0] || {});
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to retrieve statistics' 
        });
    }
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ 
        success: false, 
        message: 'Endpoint not found' 
    });
});

// Start server
async function startServer() {
    await initializeDatabase();
    
    app.listen(PORT, () => {
        console.log(`Calculator server running on http://localhost:${PORT}`);
        console.log(`Database: ${dbConfig.database}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
}

startServer().catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nShutting down gracefully...');
    await pool.end();
    process.exit(0);
});

module.exports = app;
