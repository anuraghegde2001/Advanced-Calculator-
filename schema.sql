-- Create database
CREATE DATABASE calculator_app;
USE calculator_app;

-- Users table for session management
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Calculations table for history storage
CREATE TABLE calculations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    expression VARCHAR(500) NOT NULL,
    result VARCHAR(100) NOT NULL,
    operation_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for performance
CREATE INDEX idx_user_calculations ON calculations(user_id, created_at DESC);
CREATE INDEX idx_session_lookup ON users(session_id);
