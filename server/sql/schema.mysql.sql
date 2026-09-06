-- =================================================================
-- ayushXsisi SMM Platform - MySQL Production Database Schema
-- Compatible with MySQL 8.0+ / MariaDB 10.5+
-- =================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Admins Table
CREATE TABLE IF NOT EXISTS `admins` (
  `id` VARCHAR(64) NOT NULL,
  `username` VARCHAR(64) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('super_admin', 'admin') DEFAULT 'admin',
  `last_login` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS `categories` (
  `id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(128) NOT NULL,
  `slug` VARCHAR(128) NOT NULL UNIQUE,
  `icon` VARCHAR(64) DEFAULT 'Folder',
  `sort_order` INT NOT NULL DEFAULT 1,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Services Table
CREATE TABLE IF NOT EXISTS `services` (
  `id` VARCHAR(64) NOT NULL,
  `service_id` INT NOT NULL UNIQUE,
  `category_id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `price_per_1k` DECIMAL(10,2) NOT NULL,
  `min_quantity` INT NOT NULL DEFAULT 100,
  `max_quantity` INT NOT NULL DEFAULT 100000,
  `target_type` ENUM('url', 'username', 'custom') DEFAULT 'url',
  `target_placeholder` VARCHAR(255) DEFAULT 'URL or Username',
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Orders Table
CREATE TABLE IF NOT EXISTS `orders` (
  `id` VARCHAR(64) NOT NULL,
  `order_id` VARCHAR(64) NOT NULL UNIQUE,
  `service_id` INT NOT NULL,
  `service_name` VARCHAR(255) NOT NULL,
  `category_name` VARCHAR(128) NULL,
  `quantity` INT NOT NULL,
  `target` VARCHAR(500) NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `transaction_id` VARCHAR(128) NOT NULL,
  `customer_contact` VARCHAR(64) NULL,
  `customer_notes` TEXT NULL,
  `status` ENUM('pending', 'processing', 'completed', 'cancelled', 'partial', 'refunded') NOT NULL DEFAULT 'pending',
  `whatsapp_status` ENUM('delivered', 'failed', 'simulated', 'queued', 'not_sent') NOT NULL DEFAULT 'queued',
  `whatsapp_error` TEXT NULL,
  `client_ip` VARCHAR(45) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_orders_order_id` (`order_id`),
  INDEX `idx_orders_status` (`status`),
  INDEX `idx_orders_transaction_id` (`transaction_id`),
  INDEX `idx_orders_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Order Status History Table
CREATE TABLE IF NOT EXISTS `order_status_history` (
  `id` VARCHAR(64) NOT NULL,
  `order_id` VARCHAR(64) NOT NULL,
  `previous_status` VARCHAR(32) NULL,
  `new_status` VARCHAR(32) NOT NULL,
  `changed_by` VARCHAR(128) NOT NULL,
  `note` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`order_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Admin Internal Notes Table
CREATE TABLE IF NOT EXISTS `admin_notes` (
  `id` VARCHAR(64) NOT NULL,
  `order_id` VARCHAR(64) NOT NULL,
  `author` VARCHAR(64) NOT NULL,
  `content` TEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`order_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. System & WhatsApp Settings Table
CREATE TABLE IF NOT EXISTS `settings` (
  `key` VARCHAR(64) NOT NULL,
  `value` LONGTEXT NOT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. WhatsApp Dispatch Logs Table
CREATE TABLE IF NOT EXISTS `whatsapp_logs` (
  `id` VARCHAR(64) NOT NULL,
  `order_id` VARCHAR(64) NOT NULL,
  `recipient` VARCHAR(32) NOT NULL,
  `status` VARCHAR(32) NOT NULL,
  `provider` VARCHAR(32) NOT NULL,
  `message_snippet` VARCHAR(255) NULL,
  `error_message` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
