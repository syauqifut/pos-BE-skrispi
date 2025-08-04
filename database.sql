-- Create database (run this first)
-- CREATE DATABASE pos_db;

-- Connect to the pos_db database and create the users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'kasir')) DEFAULT 'kasir',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create an index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Insert a sample user (password is 'admin' hashed with bcrypt)
INSERT INTO users (name, username, password, role) 
VALUES (
    'Administrator',
    'admin', 
    '$2a$10$NA7OYwm5uydbf2g6KiC8KeizLNGcnoaqhmz76pxSunEQ8xS5wMXzG', 
    'admin'
) ON CONFLICT (username) DO NOTHING;

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Setup Tables
-- ============================================

-- Create units table
CREATE TABLE IF NOT EXISTS units (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    barcode TEXT,
    image_url TEXT,
    category_id TEXT,
    unit_id TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    updated_by INTEGER REFERENCES users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);

-- Trigger to automatically update updated_at for products
CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Inventory Tables
-- ============================================

-- Create conversions table
CREATE TABLE IF NOT EXISTS prices (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  purchase_price NUMERIC NOT NULL,
  selling_price NUMERIC NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id),
  updated_by INTEGER REFERENCES users(id)
);

-- ============================================
-- Stock Management Tables
-- ============================================

-- Create stocks table
CREATE TABLE IF NOT EXISTS stocks (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  transaction_id INTEGER, -- optional, FK to transactions if available
  type VARCHAR(20) NOT NULL CHECK (type IN ('sale', 'purchase', 'adjustment')),
  qty INTEGER NOT NULL, -- positive or negative depending on type
  unit_id TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id)
);

-- Trigger to automatically update updated_at for conversions
CREATE TRIGGER update_conversions_updated_at 
    BEFORE UPDATE ON conversions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Transaction Management Tables
-- ============================================

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  no VARCHAR UNIQUE NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('sale', 'purchase', 'adjustment')),
  date DATE NOT NULL,
  description TEXT,
  total_amount NUMERIC,
  paid_amount NUMERIC,
  payment_type VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INT NOT NULL REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by INT REFERENCES users(id)
);

-- Create transaction_items table
CREATE TABLE IF NOT EXISTS transaction_items (
  id SERIAL PRIMARY KEY,
  transaction_id INT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  product_id INT NOT NULL REFERENCES products(id),
  unit_id TEXT NOT NULL,
  qty NUMERIC NOT NULL,
  description TEXT
);

-- Create indexes for better performance on transactions
CREATE INDEX IF NOT EXISTS idx_transactions_no ON transactions(no);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_created_by ON transactions(created_by);

-- Create indexes for better performance on transaction_items
CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction_id ON transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_product_id ON transaction_items(product_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_unit_id ON transaction_items(unit_id);

-- Trigger to automatically update updated_at for transactions
CREATE TRIGGER update_transactions_updated_at 
    BEFORE UPDATE ON transactions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Push Notification Tables
-- ============================================

-- Create device_tokens table for FCM tokens
CREATE TABLE IF NOT EXISTS device_tokens (
    id SERIAL PRIMARY KEY,
    token TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_device_tokens_token ON device_tokens(token);
CREATE INDEX IF NOT EXISTS idx_device_tokens_is_active ON device_tokens(is_active);

-- Insert default device token record
INSERT INTO device_tokens (id, token) 
VALUES (1, 'd-1234567890') 
ON CONFLICT (id) DO UPDATE SET 
    token = EXCLUDED.token,
    updated_at = CURRENT_TIMESTAMP;

-- Trigger to automatically update updated_at for device_tokens
CREATE TRIGGER update_device_tokens_updated_at 
    BEFORE UPDATE ON device_tokens 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 

-- ============================================
-- Notification Management Tables
-- ============================================

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Trigger to automatically update updated_at for notifications