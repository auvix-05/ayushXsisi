import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { Category, Service, Order, OrderStatusHistory, AdminNote, AppSettings, WhatsAppLog, DashboardStats, OrderStatus } from '../src/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

interface AdminUserRecord {
  id: string;
  username: string;
  password_hash: string;
  role: 'super_admin' | 'admin';
  created_at: string;
  last_login?: string;
}

interface SecurityLogRecord {
  id: string;
  type: 'login_attempt' | 'failed_login' | 'order_blocked' | 'password_changed' | 'service_modified' | 'whatsapp_test' | string;
  ip?: string;
  details: string;
  created_at: string;
}

export interface DatabaseSchema {
  version: number;
  admins: AdminUserRecord[];
  categories: Category[];
  services: Service[];
  orders: Order[];
  order_status_history: OrderStatusHistory[];
  admin_notes: AdminNote[];
  whatsapp_logs: WhatsAppLog[];
  security_logs: SecurityLogRecord[];
  settings: AppSettings;
}

// Initial Seed Data
const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'cat_ig',
    name: 'Instagram Services',
    slug: 'instagram',
    icon: 'Instagram',
    sort_order: 1,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'cat_yt',
    name: 'YouTube Growth',
    slug: 'youtube',
    icon: 'Youtube',
    sort_order: 2,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'cat_tg',
    name: 'Telegram Growth',
    slug: 'telegram',
    icon: 'Send',
    sort_order: 3,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'cat_x',
    name: 'Twitter / X',
    slug: 'twitter',
    icon: 'Twitter',
    sort_order: 4,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'cat_fb',
    name: 'Facebook Services',
    slug: 'facebook',
    icon: 'Facebook',
    sort_order: 5,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'cat_sp',
    name: 'Spotify & Music',
    slug: 'spotify',
    icon: 'Music',
    sort_order: 6,
    is_active: true,
    created_at: new Date().toISOString()
  }
];

const INITIAL_SERVICES: Service[] = [
  {
    id: 'srv_101',
    service_id: 101,
    category_id: 'cat_ig',
    category_name: 'Instagram Services',
    name: 'Instagram Real Followers [High Quality + Refill 30D]',
    description: 'High quality active-looking accounts. 0-1 hour startup. Speed 20K/Day. 30 Days non-drop refill guarantee.',
    price_per_1k: 150,
    min_quantity: 100,
    max_quantity: 100000,
    target_type: 'username',
    target_placeholder: '@your_instagram_username or Profile URL',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'srv_102',
    service_id: 102,
    category_id: 'cat_ig',
    category_name: 'Instagram Services',
    name: 'Instagram Premium Likes [Instant + Organic Flow]',
    description: 'Super fast instant delivery. Starts in 60 seconds. Safe for reach & explore boost.',
    price_per_1k: 35,
    min_quantity: 50,
    max_quantity: 50000,
    target_type: 'url',
    target_placeholder: 'https://www.instagram.com/p/XXXXXX/',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'srv_103',
    service_id: 103,
    category_id: 'cat_ig',
    category_name: 'Instagram Services',
    name: 'Instagram Reels Views [Ultra Fast + High Retention]',
    description: 'Boost your reels into the explore algorithm. Instant start, 100K/Day speed.',
    price_per_1k: 15,
    min_quantity: 500,
    max_quantity: 1000000,
    target_type: 'url',
    target_placeholder: 'https://www.instagram.com/reel/XXXXXX/',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'srv_201',
    service_id: 201,
    category_id: 'cat_yt',
    category_name: 'YouTube Growth',
    name: 'YouTube Subscribers [Non-Drop + Monetization Safe]',
    description: 'High retention natural subscribers. Guaranteed safe for YouTube Partner Program & monetization.',
    price_per_1k: 890,
    min_quantity: 50,
    max_quantity: 10000,
    target_type: 'url',
    target_placeholder: 'https://youtube.com/@channel or Channel URL',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'srv_202',
    service_id: 202,
    category_id: 'cat_yt',
    category_name: 'YouTube Growth',
    name: 'YouTube High Retention Views [Real Engagement]',
    description: 'Organic impressions, high watch time retention. Recommended for video ranking.',
    price_per_1k: 180,
    min_quantity: 500,
    max_quantity: 500000,
    target_type: 'url',
    target_placeholder: 'https://youtu.be/XXXXXX or Video Link',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'srv_301',
    service_id: 301,
    category_id: 'cat_tg',
    category_name: 'Telegram Growth',
    name: 'Telegram Channel / Group Members [30 Days Refill]',
    description: 'Fast adding members for public & private channels or groups. Non-drop stability.',
    price_per_1k: 110,
    min_quantity: 100,
    max_quantity: 50000,
    target_type: 'url',
    target_placeholder: 'https://t.me/channel_name or @username',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'srv_302',
    service_id: 302,
    category_id: 'cat_tg',
    category_name: 'Telegram Growth',
    name: 'Telegram Post Views [Last 5 Posts Auto-Spread]',
    description: 'Instant delivery views on latest posts to maintain high engagement ratio.',
    price_per_1k: 20,
    min_quantity: 200,
    max_quantity: 100000,
    target_type: 'url',
    target_placeholder: 'https://t.me/channel/123 or Post Link',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'srv_401',
    service_id: 401,
    category_id: 'cat_x',
    category_name: 'Twitter / X',
    name: 'Twitter (X) Real Followers [Worldwide Active]',
    description: 'High quality profiles with avatars, bios, and tweets. Safe delivery speed.',
    price_per_1k: 320,
    min_quantity: 50,
    max_quantity: 25000,
    target_type: 'username',
    target_placeholder: '@twitter_handle or Profile URL',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'srv_501',
    service_id: 501,
    category_id: 'cat_fb',
    category_name: 'Facebook Services',
    name: 'Facebook Page Likes & Followers [Combo High Quality]',
    description: 'Permanent page likes and followers. Builds instant credibility for business pages.',
    price_per_1k: 240,
    min_quantity: 100,
    max_quantity: 50000,
    target_type: 'url',
    target_placeholder: 'https://facebook.com/page-name or URL',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'srv_601',
    service_id: 601,
    category_id: 'cat_sp',
    category_name: 'Spotify & Music',
    name: 'Spotify Track Plays / Streams [USA & Worldwide]',
    description: 'Eligible for royalties. Real user streams with natural 60s+ listening duration.',
    price_per_1k: 160,
    min_quantity: 1000,
    max_quantity: 500000,
    target_type: 'url',
    target_placeholder: 'https://open.spotify.com/track/XXXXXX',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const INITIAL_SETTINGS: AppSettings = {
  brand_name: 'ayushXsisi',
  owner_whatsapp: '+917033994688',
  upi_id: '7033994688-4@ybl',
  upi_merchant_name: 'Shilpi Devi',
  merchant_name: 'Shilpi Devi',
  upi_qr_url: '',
  whatsapp_provider: 'simulation',
  currency_symbol: '₹',
  allow_orders: true,
  maintenance_mode: false,
  announcement: '🚀 Instant Manual Fulfillment Active! Pay via PhonePe / UPI QR & enter your UTR to dispatch order directly to WhatsApp.'
};

class Database {
  private schema: DatabaseSchema;
  private isInitialized = false;

  constructor() {
    this.schema = {
      version: 1,
      admins: [],
      categories: INITIAL_CATEGORIES,
      services: INITIAL_SERVICES,
      orders: [],
      order_status_history: [],
      admin_notes: [],
      whatsapp_logs: [],
      security_logs: [],
      settings: INITIAL_SETTINGS
    };
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        this.schema = {
          ...this.schema,
          ...parsed,
          settings: { ...INITIAL_SETTINGS, ...(parsed.settings || {}) }
        };
      } else {
        // Create initial default admin
        const salt = bcrypt.genSaltSync(10);
        const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'ayushXsisi@2026';
        const passwordHash = bcrypt.hashSync(defaultPassword, salt);
        
        this.schema.admins = [
          {
            id: 'admin_primary',
            username: process.env.ADMIN_DEFAULT_USERNAME || 'admin',
            password_hash: passwordHash,
            role: 'super_admin',
            created_at: new Date().toISOString()
          }
        ];
        this.save();
      }
      this.isInitialized = true;
    } catch (err) {
      console.error('Error initializing database:', err);
    }
  }

  private save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmpFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(this.schema, null, 2), 'utf8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error('Error saving database to disk:', err);
    }
  }

  // --- ADMIN OPERATIONS ---
  public getAdminByUsername(username: string): AdminUserRecord | undefined {
    return this.schema.admins.find(a => a.username.toLowerCase() === username.toLowerCase());
  }

  public getAdminById(id: string): AdminUserRecord | undefined {
    return this.schema.admins.find(a => a.id === id);
  }

  public updateAdminPassword(adminId: string, newPasswordHash: string): boolean {
    const admin = this.schema.admins.find(a => a.id === adminId);
    if (!admin) return false;
    admin.password_hash = newPasswordHash;
    this.save();
    return true;
  }

  public recordAdminLogin(adminId: string) {
    const admin = this.schema.admins.find(a => a.id === adminId);
    if (admin) {
      admin.last_login = new Date().toISOString();
      this.save();
    }
  }

  // --- CATEGORIES ---
  public getCategories(): Category[] {
    return [...this.schema.categories].sort((a, b) => a.sort_order - b.sort_order);
  }

  public getActiveCategories(): Category[] {
    return this.getCategories().filter(c => c.is_active);
  }

  public createCategory(data: Partial<Category>): Category {
    const category: Category = {
      id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: data.name || 'New Category',
      slug: data.slug || (data.name || 'category').toLowerCase().replace(/\s+/g, '-'),
      icon: data.icon || 'Folder',
      sort_order: data.sort_order || this.schema.categories.length + 1,
      is_active: data.is_active !== undefined ? data.is_active : true,
      created_at: new Date().toISOString()
    };
    this.schema.categories.push(category);
    this.save();
    return category;
  }

  public updateCategory(id: string, updates: Partial<Category>): Category | null {
    const idx = this.schema.categories.findIndex(c => c.id === id);
    if (idx === -1) return null;
    this.schema.categories[idx] = { ...this.schema.categories[idx], ...updates };
    this.save();
    return this.schema.categories[idx];
  }

  public deleteCategory(id: string): boolean {
    const initialLen = this.schema.categories.length;
    this.schema.categories = this.schema.categories.filter(c => c.id !== id);
    if (this.schema.categories.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // --- SERVICES ---
  public getServices(includeInactive = false): Service[] {
    let services = [...this.schema.services];
    if (!includeInactive) {
      services = services.filter(s => s.is_active);
    }
    return services.sort((a, b) => a.service_id - b.service_id);
  }

  public getServiceById(serviceId: number): Service | undefined {
    return this.schema.services.find(s => s.service_id === Number(serviceId));
  }

  public getServiceByDbId(id: string): Service | undefined {
    return this.schema.services.find(s => s.id === id);
  }

  public createService(data: {
    service_id?: number;
    category_id: string;
    name: string;
    description: string;
    price_per_1k: number;
    min_quantity: number;
    max_quantity: number;
    target_type?: 'url' | 'username' | 'custom';
    target_placeholder?: string;
    is_active?: boolean;
  }): Service {
    let assignedServiceId = data.service_id;
    if (!assignedServiceId) {
      const maxId = this.schema.services.reduce((max, s) => Math.max(max, s.service_id), 100);
      assignedServiceId = maxId + 1;
    }

    const category = this.schema.categories.find(c => c.id === data.category_id);

    const newService: Service = {
      id: `srv_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      service_id: assignedServiceId,
      category_id: data.category_id,
      category_name: category ? category.name : 'General',
      name: data.name,
      description: data.description,
      price_per_1k: Number(data.price_per_1k),
      min_quantity: Number(data.min_quantity),
      max_quantity: Number(data.max_quantity),
      target_type: data.target_type || 'url',
      target_placeholder: data.target_placeholder || 'Link or Username',
      is_active: data.is_active !== undefined ? data.is_active : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.schema.services.push(newService);
    this.save();
    return newService;
  }

  public updateService(id: string, updates: Partial<Service>): Service | null {
    const idx = this.schema.services.findIndex(s => s.id === id || s.service_id === Number(id));
    if (idx === -1) return null;

    if (updates.category_id) {
      const cat = this.schema.categories.find(c => c.id === updates.category_id);
      if (cat) updates.category_name = cat.name;
    }

    this.schema.services[idx] = {
      ...this.schema.services[idx],
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.save();
    return this.schema.services[idx];
  }

  public deleteService(id: string): boolean {
    const initialLen = this.schema.services.length;
    this.schema.services = this.schema.services.filter(s => s.id !== id && s.service_id !== Number(id));
    if (this.schema.services.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // --- ORDER GENERATION & MANAGEMENT ---
  public generateUniqueOrderId(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const randomDigits = Math.floor(100000 + Math.random() * 900000); // 6 digits
    const orderId = `AX-${year}${month}${day}-${randomDigits}`;

    // Verify uniqueness
    if (this.schema.orders.some(o => o.order_id === orderId)) {
      return this.generateUniqueOrderId();
    }
    return orderId;
  }

  public checkDuplicateOrder(transactionId: string, target: string, serviceId: number): boolean {
    const normalizedTxn = transactionId.trim().toUpperCase();
    // Check if txn ID was already used
    const txnExists = this.schema.orders.some(o => o.transaction_id.trim().toUpperCase() === normalizedTxn);
    if (txnExists) return true;

    // Check if same target & service placed in last 3 minutes
    const fiveMinutesAgo = Date.now() - 3 * 60 * 1000;
    const recentDuplicate = this.schema.orders.some(o => {
      const orderTime = new Date(o.created_at).getTime();
      return (
        orderTime > fiveMinutesAgo &&
        o.service_id === serviceId &&
        o.target.trim().toLowerCase() === target.trim().toLowerCase()
      );
    });

    return recentDuplicate;
  }

  public createOrder(data: {
    service_id: number;
    quantity: number;
    target: string;
    transaction_id: string;
    customer_contact?: string;
    customer_notes?: string;
    client_ip?: string;
  }): { order: Order; service: Service } {
    const service = this.getServiceById(data.service_id);
    if (!service) {
      throw new Error(`Service with ID ${data.service_id} not found.`);
    }

    if (data.quantity < service.min_quantity) {
      throw new Error(`Minimum quantity for this service is ${service.min_quantity}.`);
    }
    if (data.quantity > service.max_quantity) {
      throw new Error(`Maximum quantity for this service is ${service.max_quantity}.`);
    }

    // Exact price calculation: (price_per_1k / 1000) * quantity
    const totalAmount = Math.round(((service.price_per_1k / 1000) * data.quantity) * 100) / 100;
    const orderId = this.generateUniqueOrderId();
    const nowIso = new Date().toISOString();

    const order: Order = {
      id: `ord_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      order_id: orderId,
      service_id: service.service_id,
      service_name: service.name,
      service_description: service.description,
      category_name: service.category_name,
      quantity: Number(data.quantity),
      target: data.target.trim(),
      amount: totalAmount,
      transaction_id: data.transaction_id.trim().toUpperCase(),
      customer_contact: data.customer_contact ? data.customer_contact.trim() : undefined,
      customer_notes: data.customer_notes ? data.customer_notes.trim() : undefined,
      status: 'pending',
      whatsapp_status: 'queued',
      client_ip: data.client_ip,
      created_at: nowIso,
      updated_at: nowIso,
      history: [
        {
          id: `hist_${Date.now()}_1`,
          order_id: orderId,
          previous_status: null,
          new_status: 'pending',
          changed_by: 'Customer (Order Submission)',
          note: 'Initial order placement.',
          created_at: nowIso
        }
      ],
      notes: []
    };

    this.schema.orders.unshift(order);
    this.save();
    return { order, service };
  }

  public getOrders(filters: {
    status?: string;
    search?: string;
    category?: string;
    limit?: number;
    offset?: number;
    sortBy?: 'created_at' | 'amount' | 'quantity';
    sortOrder?: 'asc' | 'desc';
  } = {}): { orders: Order[]; total: number } {
    let result = [...this.schema.orders];

    if (filters.status && filters.status !== 'all') {
      result = result.filter(o => o.status.toLowerCase() === filters.status?.toLowerCase());
    }

    if (filters.category && filters.category !== 'all') {
      result = result.filter(o => o.category_name?.toLowerCase() === filters.category?.toLowerCase());
    }

    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      result = result.filter(o => 
        o.order_id.toLowerCase().includes(q) ||
        o.transaction_id.toLowerCase().includes(q) ||
        o.target.toLowerCase().includes(q) ||
        o.service_name.toLowerCase().includes(q) ||
        (o.customer_contact && o.customer_contact.toLowerCase().includes(q))
      );
    }

    // Sorting
    const sortBy = filters.sortBy || 'created_at';
    const sortOrder = filters.sortOrder || 'desc';

    result.sort((a, b) => {
      if (sortBy === 'amount') {
        return sortOrder === 'asc' ? a.amount - b.amount : b.amount - a.amount;
      }
      if (sortBy === 'quantity') {
        return sortOrder === 'asc' ? a.quantity - b.quantity : b.quantity - a.quantity;
      }
      // default: created_at
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();
      return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
    });

    const total = result.length;
    const offset = filters.offset || 0;
    const limit = filters.limit || 50;

    const pagedOrders = result.slice(offset, offset + limit).map(order => {
      // Attach admin notes and history
      return {
        ...order,
        service_description: order.service_description || this.getServiceById(order.service_id)?.description || '',
        notes: this.schema.admin_notes.filter(n => n.order_id === order.order_id),
        history: this.schema.order_status_history.filter(h => h.order_id === order.order_id)
      };
    });

    return { orders: pagedOrders, total };
  }

  public getOrderByOrderId(orderId: string): Order | undefined {
    const order = this.schema.orders.find(o => o.order_id.toUpperCase() === orderId.trim().toUpperCase());
    if (!order) return undefined;
    return {
      ...order,
      service_description: order.service_description || this.getServiceById(order.service_id)?.description || '',
      notes: this.schema.admin_notes.filter(n => n.order_id === order.order_id),
      history: this.schema.order_status_history.filter(h => h.order_id === order.order_id)
    };
  }

  public getPublicOrderTrack(orderId: string): Order | undefined {
    const order = this.getOrderByOrderId(orderId);
    if (!order) return undefined;
    // Sanitize private notes for public view
    return {
      id: order.id,
      order_id: order.order_id,
      service_id: order.service_id,
      service_name: order.service_name,
      quantity: order.quantity,
      target: order.target,
      amount: order.amount,
      transaction_id: order.transaction_id,
      status: order.status,
      whatsapp_status: order.whatsapp_status,
      created_at: order.created_at,
      updated_at: order.updated_at,
      history: order.history
    };
  }

  public updateOrderStatus(orderId: string, newStatus: OrderStatus, changedBy: string, note?: string): Order | null {
    const order = this.schema.orders.find(o => o.order_id === orderId);
    if (!order) return null;

    const prevStatus = order.status;
    order.status = newStatus;
    order.updated_at = new Date().toISOString();

    const historyRecord: OrderStatusHistory = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      order_id: orderId,
      previous_status: prevStatus,
      new_status: newStatus,
      changed_by: changedBy,
      note: note || `Status updated from ${prevStatus} to ${newStatus}`,
      created_at: new Date().toISOString()
    };

    this.schema.order_status_history.push(historyRecord);
    this.save();
    return this.getOrderByOrderId(orderId) || null;
  }

  public updateOrderWhatsAppStatus(orderId: string, status: 'delivered' | 'failed' | 'simulated', errorMsg?: string) {
    const order = this.schema.orders.find(o => o.order_id === orderId);
    if (order) {
      order.whatsapp_status = status;
      if (errorMsg) order.whatsapp_error = errorMsg;
      this.save();
    }
  }

  public addAdminNote(orderId: string, author: string, content: string): AdminNote {
    const note: AdminNote = {
      id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      order_id: orderId,
      author,
      content,
      created_at: new Date().toISOString()
    };
    this.schema.admin_notes.push(note);
    this.save();
    return note;
  }

  public logWhatsApp(log: Omit<WhatsAppLog, 'id' | 'created_at'>): WhatsAppLog {
    const record: WhatsAppLog = {
      ...log,
      id: `walog_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      created_at: new Date().toISOString()
    };
    this.schema.whatsapp_logs.unshift(record);
    if (this.schema.whatsapp_logs.length > 200) {
      this.schema.whatsapp_logs = this.schema.whatsapp_logs.slice(0, 200);
    }
    this.save();
    return record;
  }

  public logSecurity(type: SecurityLogRecord['type'], details: string, ip?: string) {
    const record: SecurityLogRecord = {
      id: `sec_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type,
      details,
      ip,
      created_at: new Date().toISOString()
    };
    this.schema.security_logs.unshift(record);
    if (this.schema.security_logs.length > 300) {
      this.schema.security_logs = this.schema.security_logs.slice(0, 300);
    }
    this.save();
  }

  // --- STATS & ANALYTICS ---
  public getDashboardStats(): DashboardStats {
    const orders = this.schema.orders;
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    let totalRevenue = 0;
    let todayOrders = 0;
    let todayRevenue = 0;
    let pendingCount = 0;
    let processingCount = 0;
    let completedCount = 0;
    let cancelledCount = 0;
    let partialCount = 0;

    orders.forEach(o => {
      totalRevenue += o.amount;
      if (o.created_at.startsWith(todayStr)) {
        todayOrders += 1;
        todayRevenue += o.amount;
      }
      switch (o.status) {
        case 'pending': pendingCount++; break;
        case 'processing': processingCount++; break;
        case 'completed': completedCount++; break;
        case 'cancelled': cancelledCount++; break;
        case 'partial': partialCount++; break;
        case 'refunded': cancelledCount++; break;
      }
    });

    const status_distribution = [
      { status: 'pending' as OrderStatus, count: pendingCount, amount: orders.filter(o => o.status === 'pending').reduce((s, o) => s + o.amount, 0) },
      { status: 'processing' as OrderStatus, count: processingCount, amount: orders.filter(o => o.status === 'processing').reduce((s, o) => s + o.amount, 0) },
      { status: 'completed' as OrderStatus, count: completedCount, amount: orders.filter(o => o.status === 'completed').reduce((s, o) => s + o.amount, 0) },
      { status: 'cancelled' as OrderStatus, count: cancelledCount, amount: orders.filter(o => o.status === 'cancelled' || o.status === 'refunded').reduce((s, o) => s + o.amount, 0) },
      { status: 'partial' as OrderStatus, count: partialCount, amount: orders.filter(o => o.status === 'partial').reduce((s, o) => s + o.amount, 0) }
    ];

    return {
      total_orders: orders.length,
      pending_orders: pendingCount,
      processing_orders: processingCount,
      completed_orders: completedCount,
      cancelled_orders: cancelledCount,
      partial_orders: partialCount,
      today_orders: todayOrders,
      today_revenue: Math.round(todayRevenue * 100) / 100,
      total_revenue: Math.round(totalRevenue * 100) / 100,
      status_distribution,
      recent_orders: orders.slice(0, 10)
    };
  }

  // --- SETTINGS ---
  public getSettings(): AppSettings {
    return { ...this.schema.settings };
  }

  public updateSettings(updates: Partial<AppSettings>): AppSettings {
    this.schema.settings = {
      ...this.schema.settings,
      ...updates
    };
    this.save();
    return this.schema.settings;
  }

  public getRawDatabase(): DatabaseSchema {
    return this.schema;
  }
}

export const db = new Database();
