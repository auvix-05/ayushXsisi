-- =================================================================
-- ayushXsisi SMM Platform - PostgreSQL Production Database Schema
-- Compatible with PostgreSQL 13+
-- =================================================================

-- 1. Admins Table
CREATE TABLE IF NOT EXISTS admins (
  id VARCHAR(64) PRIMARY KEY,
  username VARCHAR(64) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(32) DEFAULT 'admin',
  last_login TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  slug VARCHAR(128) NOT NULL UNIQUE,
  icon VARCHAR(64) DEFAULT 'Folder',
  sort_order INT NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 3. Services Table
CREATE TABLE IF NOT EXISTS services (
  id VARCHAR(64) PRIMARY KEY,
  service_id INT NOT NULL UNIQUE,
  category_id VARCHAR(64) NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  price_per_1k NUMERIC(10,2) NOT NULL,
  min_quantity INT NOT NULL DEFAULT 100,
  max_quantity INT NOT NULL DEFAULT 100000,
  target_type VARCHAR(32) DEFAULT 'url',
  target_placeholder VARCHAR(255) DEFAULT 'URL or Username',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 4. Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL UNIQUE,
  service_id INT NOT NULL,
  service_name VARCHAR(255) NOT NULL,
  category_name VARCHAR(128) NULL,
  quantity INT NOT NULL,
  target VARCHAR(500) NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  transaction_id VARCHAR(128) NOT NULL,
  customer_contact VARCHAR(64) NULL,
  customer_notes TEXT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  whatsapp_status VARCHAR(32) NOT NULL DEFAULT 'queued',
  whatsapp_error TEXT NULL,
  client_ip VARCHAR(45) NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_transaction_id ON orders(transaction_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- 5. Order Status History Table
CREATE TABLE IF NOT EXISTS order_status_history (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  previous_status VARCHAR(32) NULL,
  new_status VARCHAR(32) NOT NULL,
  changed_by VARCHAR(128) NOT NULL,
  note TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 6. Admin Internal Notes Table
CREATE TABLE IF NOT EXISTS admin_notes (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  author VARCHAR(64) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 7. Settings Table
CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(64) PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 8. WhatsApp Logs Table
CREATE TABLE IF NOT EXISTS whatsapp_logs (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL,
  recipient VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL,
  provider VARCHAR(32) NOT NULL,
  message_snippet VARCHAR(255) NULL,
  error_message TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
