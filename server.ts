import express, { Request, Response } from 'express';
import path from 'path';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import { db } from './server/db';
import { sendWhatsAppNotification } from './server/whatsapp';
import {
  dispatchAllOrderNotifications,
  sendTelegramNotification,
  sendDiscordNotification,
  sendCustomWebhookNotification
} from './server/notifications';
import {
  rateLimiter,
  generateAdminToken,
  adminAuthMiddleware,
  AuthenticatedRequest,
  generateCaptchaChallenge,
  verifyCaptchaAnswer,
  validateTransactionId,
  sanitizeText
} from './server/security';
import { OrderStatus, Order } from './src/types';

dotenv.config();

const app = express();
const PORT = 3000;

// Security & Parsing Middlewares
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiters
const publicOrderRateLimiter = rateLimiter(15, 60 * 1000, 'order'); // 15 orders per minute per IP
const loginRateLimiter = rateLimiter(10, 60 * 1000, 'login'); // 10 login attempts per minute

// ==========================================
// 1. PUBLIC API ROUTES
// ==========================================

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    brand: 'ayushXsisi',
    timestamp: new Date().toISOString()
  });
});

// Public App Config (UPI, Brand, Owner Contact, Announcement)
app.get('/api/public/config', (req: Request, res: Response) => {
  const settings = db.getSettings();
  res.json({
    success: true,
    brand_name: settings.brand_name || 'ayushXsisi',
    owner_whatsapp: settings.owner_whatsapp || '+917033994688',
    upi_id: settings.upi_id || 'ayushsisi@upi',
    upi_merchant_name: settings.upi_merchant_name || 'ayushXsisi SMM',
    upi_qr_url: settings.upi_qr_url || '',
    currency_symbol: settings.currency_symbol || '₹',
    allow_orders: settings.allow_orders,
    maintenance_mode: settings.maintenance_mode,
    announcement: settings.announcement
  });
});

// Public Categories
app.get('/api/public/categories', (req: Request, res: Response) => {
  const categories = db.getActiveCategories();
  res.json({ success: true, categories });
});

// Public Active Services
app.get('/api/public/services', (req: Request, res: Response) => {
  const services = db.getServices(false);
  res.json({ success: true, services });
});

// Generate Anti-Spam Captcha
app.get('/api/public/captcha', (req: Request, res: Response) => {
  const captcha = generateCaptchaChallenge();
  res.json({ success: true, captcha });
});

// Public Order Submission
app.post('/api/public/orders/submit', publicOrderRateLimiter, async (req: Request, res: Response) => {
  try {
    const settings = db.getSettings();
    if (!settings.allow_orders) {
      return res.status(403).json({
        success: false,
        error: 'Orders are temporarily paused for system maintenance. Please try again soon.'
      });
    }

    const {
      service_id,
      quantity,
      target,
      transaction_id,
      customer_contact,
      customer_notes,
      captcha_token,
      captcha_answer
    } = req.body;

    // 1. Anti-spam captcha verification
    if (captcha_token && captcha_answer !== undefined) {
      const isCaptchaValid = verifyCaptchaAnswer(captcha_token, Number(captcha_answer));
      if (!isCaptchaValid) {
        return res.status(400).json({
          success: false,
          error: 'Anti-spam security verification failed. Please recalculate and try again.'
        });
      }
    }

    // 2. Validate required fields
    if (!service_id || isNaN(Number(service_id))) {
      return res.status(400).json({ success: false, error: 'Please select a valid service.' });
    }

    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      return res.status(400).json({ success: false, error: 'Please specify a valid order quantity.' });
    }

    if (!target || typeof target !== 'string' || target.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Please provide a valid target URL or username.' });
    }

    if (!transaction_id || typeof transaction_id !== 'string') {
      return res.status(400).json({ success: false, error: 'Transaction ID / UTR is strictly required.' });
    }

    const cleanTxnId = sanitizeText(transaction_id);
    if (!validateTransactionId(cleanTxnId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Transaction ID / UTR format. Please provide a valid 6-40 character alphanumeric transaction reference.'
      });
    }

    const cleanTarget = sanitizeText(target);
    const cleanContact = customer_contact ? sanitizeText(customer_contact) : undefined;
    const cleanNotes = customer_notes ? sanitizeText(customer_notes) : undefined;

    // 3. Check for duplicate submission
    const isDuplicate = db.checkDuplicateOrder(cleanTxnId, cleanTarget, Number(service_id));
    if (isDuplicate) {
      return res.status(409).json({
        success: false,
        error: 'An order with this Transaction ID or recent identical target was already submitted. If this is a new transaction, please verify your UTR.'
      });
    }

    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

    // 4. Create Order & Save in DB
    const { order, service } = db.createOrder({
      service_id: Number(service_id),
      quantity: Number(quantity),
      target: cleanTarget,
      transaction_id: cleanTxnId,
      customer_contact: cleanContact,
      customer_notes: cleanNotes,
      client_ip: clientIp
    });

    // 5. Trigger Multi-Channel Notifications (WhatsApp, Telegram, Discord, Webhook)
    let dispatchSummary;
    try {
      dispatchSummary = await dispatchAllOrderNotifications(order, service);
    } catch (notifyErr) {
      console.error('Notification dispatch error:', notifyErr);
      dispatchSummary = {
        order_id: order.order_id,
        results: [],
        direct_whatsapp_url: `https://wa.me/${(settings.owner_whatsapp || '+917033994688').replace(/[^0-9]/g, '')}`
      };
    }

    // 6. Return response to customer
    return res.status(201).json({
      success: true,
      order_id: order.order_id,
      message: 'Order Submitted Successfully. Your order has been received and is awaiting manual processing.',
      order: {
        order_id: order.order_id,
        service_name: order.service_name,
        service_id: order.service_id,
        quantity: order.quantity,
        target: order.target,
        amount: order.amount,
        transaction_id: order.transaction_id,
        customer_contact: order.customer_contact,
        created_at: order.created_at,
        whatsapp_status: order.whatsapp_status,
        direct_whatsapp_url: dispatchSummary.direct_whatsapp_url
      }
    });
  } catch (error: any) {
    console.error('Order creation failed:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to place order. Please check inputs and try again.'
    });
  }
});

// Public Track Order by Order ID
app.get('/api/public/orders/track/:orderId', (req: Request, res: Response) => {
  const { orderId } = req.params;
  if (!orderId) {
    return res.status(400).json({ success: false, error: 'Order ID is required.' });
  }

  const order = db.getPublicOrderTrack(orderId);
  if (!order) {
    return res.status(404).json({
      success: false,
      error: `Order with ID "${orderId}" was not found. Please verify the exact Order ID (e.g. AX-20260827-XXXXXX).`
    });
  }

  return res.json({
    success: true,
    order
  });
});

// ==========================================
// 2. PRIVATE ADMIN AUTH & API ROUTES
// ==========================================

// Admin Login
app.post('/api/admin/login', loginRateLimiter, (req: Request, res: Response) => {
  const { username, password } = req.body;
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Username and password are required.' });
  }

  const admin = db.getAdminByUsername(username);
  if (!admin) {
    db.logSecurity('failed_login', `Failed login attempt for username: "${username}"`, ip);
    return res.status(401).json({ success: false, error: 'Invalid admin username or password.' });
  }

  const isPasswordValid = bcrypt.compareSync(password, admin.password_hash);
  if (!isPasswordValid) {
    db.logSecurity('failed_login', `Invalid password for admin: "${username}"`, ip);
    return res.status(401).json({ success: false, error: 'Invalid admin username or password.' });
  }

  db.recordAdminLogin(admin.id);
  db.logSecurity('login_attempt', `Successful admin login: ${admin.username}`, ip);

  const token = generateAdminToken({
    adminId: admin.id,
    username: admin.username,
    role: admin.role
  });

  return res.json({
    success: true,
    message: 'Admin authenticated successfully.',
    token,
    user: {
      id: admin.id,
      username: admin.username,
      role: admin.role,
      last_login: admin.last_login
    }
  });
});

// Admin Profile Verification
app.get('/api/admin/me', adminAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const admin = db.getAdminById(req.admin!.adminId);
  if (!admin) {
    return res.status(404).json({ success: false, error: 'Admin not found.' });
  }
  return res.json({
    success: true,
    user: {
      id: admin.id,
      username: admin.username,
      role: admin.role,
      last_login: admin.last_login
    }
  });
});

// Admin Dashboard Stats
app.get('/api/admin/stats', adminAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const stats = db.getDashboardStats();
  res.json({ success: true, stats });
});

// Admin Orders List (Search, Filter, Pagination, Sorting)
app.get('/api/admin/orders', adminAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { status, search, category, limit, offset, sortBy, sortOrder } = req.query;

  const result = db.getOrders({
    status: status as string,
    search: search as string,
    category: category as string,
    limit: limit ? parseInt(limit as string, 10) : 50,
    offset: offset ? parseInt(offset as string, 10) : 0,
    sortBy: sortBy as any,
    sortOrder: sortOrder as any
  });

  res.json({
    success: true,
    orders: result.orders,
    total: result.total
  });
});

// Admin Order Details by Order ID
app.get('/api/admin/orders/:orderId', adminAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { orderId } = req.params;
  const order = db.getOrderByOrderId(orderId);
  if (!order) {
    return res.status(404).json({ success: false, error: `Order ${orderId} not found.` });
  }
  return res.json({ success: true, order });
});

// Admin Update Order Status
app.post('/api/admin/orders/:orderId/status', adminAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { orderId } = req.params;
  const { status, note } = req.body;

  const validStatuses: OrderStatus[] = ['pending', 'processing', 'completed', 'cancelled', 'partial', 'refunded'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
    });
  }

  const updated = db.updateOrderStatus(orderId, status, req.admin!.username, note);
  if (!updated) {
    return res.status(404).json({ success: false, error: `Order ${orderId} not found.` });
  }

  return res.json({
    success: true,
    message: `Order status updated to "${status}".`,
    order: updated
  });
});

// Admin Bulk Status Update
app.post('/api/admin/orders/bulk-status', adminAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { order_ids, status, note } = req.body;
  if (!Array.isArray(order_ids) || order_ids.length === 0) {
    return res.status(400).json({ success: false, error: 'order_ids array is required.' });
  }

  const validStatuses: OrderStatus[] = ['pending', 'processing', 'completed', 'cancelled', 'partial', 'refunded'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid status provided.' });
  }

  let count = 0;
  for (const oId of order_ids) {
    const updated = db.updateOrderStatus(oId, status, req.admin!.username, note || 'Bulk status update');
    if (updated) count++;
  }

  return res.json({
    success: true,
    message: `Updated status for ${count} orders to ${status}.`
  });
});

// Admin Add Internal Note
app.post('/api/admin/orders/:orderId/notes', adminAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { orderId } = req.params;
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ success: false, error: 'Note content cannot be empty.' });
  }

  const note = db.addAdminNote(orderId, req.admin!.username, sanitizeText(content));
  const updatedOrder = db.getOrderByOrderId(orderId);

  return res.json({
    success: true,
    message: 'Internal admin note recorded.',
    note,
    order: updatedOrder
  });
});

// Admin Resend / Retrigger WhatsApp Notification
app.post('/api/admin/orders/:orderId/resend-whatsapp', adminAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { orderId } = req.params;
  const order = db.getOrderByOrderId(orderId);
  if (!order) {
    return res.status(404).json({ success: false, error: `Order ${orderId} not found.` });
  }

  const service = db.getServiceById(order.service_id);
  const result = await sendWhatsAppNotification(order, service);

  const updatedOrder = db.getOrderByOrderId(orderId);
  return res.json({
    success: result.success,
    message: result.message,
    whatsapp_result: result,
    order: updatedOrder
  });
});

// Admin Send Test WhatsApp Notification
app.post('/api/admin/whatsapp/test', adminAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { phone_number } = req.body;
  const targetPhone = phone_number || db.getSettings().owner_whatsapp || '+917033994688';

  const mockOrder: any = {
    order_id: `TEST-${Date.now().toString().slice(-6)}`,
    service_id: 101,
    service_name: 'Test SMM Notification (Diagnostics)',
    quantity: 1000,
    amount: 150,
    transaction_id: 'UPI-TEST-DIAGNOSTIC',
    target: '@ayushXsisi_test',
    customer_contact: '+917033994688',
    customer_notes: 'System test message from ayushXsisi admin settings',
    created_at: new Date().toISOString()
  };

  const result = await sendWhatsAppNotification(mockOrder);
  db.logSecurity('whatsapp_test', `Admin ${req.admin?.username} triggered test WhatsApp notification to ${targetPhone}`);

  return res.json({
    success: result.success,
    message: result.message,
    result
  });
});

// Admin Services CRUD
app.get('/api/admin/services', adminAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const services = db.getServices(true);
  res.json({ success: true, services });
});

app.post('/api/admin/services', adminAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const service = db.createService(req.body);
    db.logSecurity('service_modified', `Service created: "${service.name}" (#${service.service_id}) by ${req.admin?.username}`);
    res.status(201).json({ success: true, message: 'Service created successfully.', service });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || 'Failed to create service.' });
  }
});

app.put('/api/admin/services/:id', adminAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const updated = db.updateService(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Service not found.' });
  }
  db.logSecurity('service_modified', `Service updated: "${updated.name}" (#${updated.service_id}) by ${req.admin?.username}`);
  return res.json({ success: true, message: 'Service updated successfully.', service: updated });
});

app.delete('/api/admin/services/:id', adminAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const deleted = db.deleteService(req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'Service not found.' });
  }
  db.logSecurity('service_modified', `Service deleted ID: ${req.params.id} by ${req.admin?.username}`);
  return res.json({ success: true, message: 'Service deleted successfully.' });
});

// Admin Categories CRUD
app.get('/api/admin/categories', adminAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const categories = db.getCategories();
  res.json({ success: true, categories });
});

app.post('/api/admin/categories', adminAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const cat = db.createCategory(req.body);
  res.status(201).json({ success: true, category: cat });
});

app.put('/api/admin/categories/:id', adminAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const updated = db.updateCategory(req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, error: 'Category not found.' });
  return res.json({ success: true, category: updated });
});

app.delete('/api/admin/categories/:id', adminAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const deleted = db.deleteCategory(req.params.id);
  if (!deleted) return res.status(404).json({ success: false, error: 'Category not found.' });
  return res.json({ success: true, message: 'Category deleted successfully.' });
});

// Admin Settings CRUD
app.get('/api/admin/settings', adminAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const settings = db.getSettings();
  res.json({ success: true, settings });
});

app.put('/api/admin/settings', adminAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const updated = db.updateSettings(req.body);
  res.json({ success: true, message: 'Settings saved successfully.', settings: updated });
});

// Admin Change Password
app.post('/api/admin/change-password', adminAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      error: 'New password must be at least 6 characters long.'
    });
  }

  const admin = db.getAdminById(req.admin!.adminId);
  if (!admin) {
    return res.status(404).json({ success: false, error: 'Admin not found.' });
  }

  const isValid = bcrypt.compareSync(currentPassword, admin.password_hash);
  if (!isValid) {
    return res.status(400).json({ success: false, error: 'Current password is incorrect.' });
  }

  const salt = bcrypt.genSaltSync(10);
  const newHash = bcrypt.hashSync(newPassword, salt);
  db.updateAdminPassword(admin.id, newHash);
  db.logSecurity('password_changed', `Admin password changed by ${admin.username}`);

  return res.json({ success: true, message: 'Password updated successfully.' });
});

// Admin Activity & WhatsApp Logs
app.get('/api/admin/logs', adminAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const rawDb = db.getRawDatabase();
  res.json({
    success: true,
    whatsapp_logs: rawDb.whatsapp_logs,
    security_logs: rawDb.security_logs
  });
});

// Admin Live Order Polling & Alert Check
app.get('/api/admin/orders/poll', adminAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const since = req.query.since ? String(req.query.since) : undefined;
  const rawOrders = db.getRawDatabase().orders;
  
  let newOrders = [];
  if (since) {
    const sinceDate = new Date(since).getTime();
    newOrders = rawOrders.filter(o => new Date(o.created_at).getTime() > sinceDate);
  } else {
    // If no since date, return top 5 latest
    newOrders = rawOrders.slice(0, 5);
  }

  res.json({
    success: true,
    server_time: new Date().toISOString(),
    new_orders_count: newOrders.length,
    new_orders: newOrders
  });
});

// Test WhatsApp Notification
app.post('/api/admin/notifications/test-whatsapp', adminAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { phone_number } = req.body;
  const mockOrder: Order = {
    id: `mock-${Date.now()}`,
    order_id: `TEST-${Date.now().toString().slice(-6)}`,
    service_id: 1,
    service_name: 'Test Instagram Followers Notification',
    quantity: 1000,
    amount: 85,
    target: 'https://instagram.com/ayushxsisi',
    transaction_id: 'TESTUTR999999',
    customer_contact: phone_number || '+917033994688',
    customer_notes: 'System test alert',
    status: 'pending' as const,
    whatsapp_status: 'simulated' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const result = await sendWhatsAppNotification(mockOrder);
  res.json({ success: true, result });
});

// Test Telegram Bot Notification
app.post('/api/admin/notifications/test-telegram', adminAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { bot_token, chat_id } = req.body;
  const mockOrder: Order = {
    id: `mock-${Date.now()}`,
    order_id: `TEST-${Date.now().toString().slice(-6)}`,
    service_id: 1,
    service_name: 'Test Telegram Order Notification',
    quantity: 1000,
    amount: 90,
    target: 'https://instagram.com/test_account',
    transaction_id: 'TG-TEST-UTR-123456',
    customer_contact: '+91 9876543210',
    customer_notes: 'Testing instant Telegram bot alert delivery',
    status: 'pending' as const,
    whatsapp_status: 'simulated' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const result = await sendTelegramNotification(mockOrder, undefined, bot_token, chat_id);
  res.json({ success: result.success, result });
});

// Test Discord Webhook Notification
app.post('/api/admin/notifications/test-discord', adminAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { webhook_url } = req.body;
  const mockOrder: Order = {
    id: `mock-${Date.now()}`,
    order_id: `TEST-${Date.now().toString().slice(-6)}`,
    service_id: 2,
    service_name: 'Test Discord Order Notification',
    quantity: 2500,
    amount: 199,
    target: 'https://instagram.com/brand_profile',
    transaction_id: 'DSC-TEST-UTR-789012',
    customer_contact: '+91 9876543210',
    customer_notes: 'Testing instant Discord webhook alert delivery',
    status: 'pending' as const,
    whatsapp_status: 'simulated' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const result = await sendDiscordNotification(mockOrder, undefined, webhook_url);
  res.json({ success: result.success, result });
});

// Test Custom Webhook Notification
app.post('/api/admin/notifications/test-webhook', adminAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { webhook_url } = req.body;
  const mockOrder: Order = {
    id: `mock-${Date.now()}`,
    order_id: `TEST-${Date.now().toString().slice(-6)}`,
    service_id: 3,
    service_name: 'Test Custom Webhook Notification',
    quantity: 500,
    amount: 75,
    target: 'https://youtube.com/watch?v=example',
    transaction_id: 'WH-TEST-UTR-345678',
    customer_contact: '+91 9876543210',
    customer_notes: 'Testing Zapier / Custom Webhook integration',
    status: 'pending' as const,
    whatsapp_status: 'simulated' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const result = await sendCustomWebhookNotification(mockOrder, undefined, webhook_url);
  res.json({ success: result.success, result });
});

// Export Orders to CSV
app.get('/api/admin/export/orders.csv', adminAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { orders } = db.getOrders({ limit: 10000 });
  const headers = ['Order ID', 'Service ID', 'Service Name', 'Quantity', 'Amount (INR)', 'Transaction ID', 'Target', 'Customer Contact', 'Status', 'WhatsApp Status', 'Created At'];
  
  const rows = orders.map(o => [
    `"${o.order_id}"`,
    o.service_id,
    `"${(o.service_name || '').replace(/"/g, '""')}"`,
    o.quantity,
    o.amount,
    `"${(o.transaction_id || '').replace(/"/g, '""')}"`,
    `"${(o.target || '').replace(/"/g, '""')}"`,
    `"${(o.customer_contact || '').replace(/"/g, '""')}"`,
    o.status,
    o.whatsapp_status,
    `"${o.created_at}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="ayushXsisi_orders_${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send(csvContent);
});

// Export Full Database Backup JSON
app.get('/api/admin/export/backup.json', adminAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const backup = db.getRawDatabase();
  // Strip password hashes from export
  const safeBackup = {
    ...backup,
    admins: backup.admins.map(a => ({ id: a.id, username: a.username, role: a.role, created_at: a.created_at }))
  };
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="ayushXsisi_db_backup_${new Date().toISOString().slice(0, 10)}.json"`);
  res.json(safeBackup);
});

// ==========================================
// 3. VITE / STATIC CLIENT INTEGRATION
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 ayushXsisi server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
