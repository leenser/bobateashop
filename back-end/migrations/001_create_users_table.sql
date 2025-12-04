-- Migration: Create users table for OAuth authentication
-- Date: 2024-11-24
-- Description: Add users table to support Google OAuth authentication

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    google_id VARCHAR(255) UNIQUE,
    picture VARCHAR(500),
    role VARCHAR(50) DEFAULT 'customer' CHECK (role IN ('customer', 'cashier', 'manager', 'admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Insert authorized user with admin role
INSERT INTO users (email, name, role, is_active, created_at, last_login)
VALUES (
    'reveille.bubbletea@gmail.com',
    'Reveille',
    'admin',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO UPDATE
SET role = 'admin', is_active = true;

-- Add comments for documentation
COMMENT ON TABLE users IS 'OAuth authenticated users with role-based access control';
COMMENT ON COLUMN users.email IS 'User email address from Google OAuth';
COMMENT ON COLUMN users.google_id IS 'Google unique identifier';
COMMENT ON COLUMN users.role IS 'User role: customer, cashier, manager, or admin';
COMMENT ON COLUMN users.is_active IS 'Whether the user account is active';

-- Grant necessary permissions (adjust based on your database user)
-- GRANT SELECT, INSERT, UPDATE ON users TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE users_id_seq TO your_app_user;
