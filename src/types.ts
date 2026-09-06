export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled' | 'partial' | 'refunded';

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Service {
  id: string;
  service_id: number; // e.g. 101
  category_id: string;
  category_name?: string;
  name: string;
  description: string;
  price_per_1k: number; // in INR (₹)
  min_quantity: number;
  max_quantity: number;
  target_type: 'url' | 'username' | 'custom';
  target_placeholder: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  previous_status: OrderStatus | null;
  new_status: OrderStatus;
  changed_by: string;
  note?: string;
  created_at: string;
}

export interface AdminNote {
  id: string;
  order_id: string;
  author: string;
  content: string;
  created_at: string;
}

export interface WhatsAppLog {
  id: string;
  order_id: string;
  recipient?: string;
  phone_number?: string;
  status: 'delivered' | 'failed' | 'simulated' | 'queued' | 'not_sent';
  message_body?: string;
  message_snippet?: string;
  provider: 'meta_cloud' | 'twilio' | 'ultramsg' | 'simulation' | 'simulated' | 'direct';
  error_message?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor: string;
  action: string;
  details: string;
  ip_address?: string;
  created_at: string;
}

export interface Order {
  id: string;
  order_id: string; // e.g. AX-20260827-482731
  service_id: number;
  service_name: string;
  service_description?: string;
  category_name?: string;
  quantity: number;
  target: string;
  amount: number; // in INR (₹)
  transaction_id: string;
  customer_contact?: string;
  customer_notes?: string;
  status: OrderStatus;
  whatsapp_status: 'delivered' | 'failed' | 'simulated' | 'not_sent' | 'queued';
  whatsapp_error?: string;
  client_ip?: string;
  created_at: string;
  updated_at: string;
  history?: OrderStatusHistory[];
  notes?: AdminNote[];
}

export interface AdminUser {
  id: string;
  username: string;
  role: 'super_admin' | 'admin';
  created_at: string;
  last_login?: string;
}

export interface AppSettings {
  brand_name?: string;
  owner_whatsapp: string;
  upi_id: string;
  merchant_name?: string;
  upi_merchant_name?: string;
  qr_image_url?: string;
  upi_qr_url?: string;
  whatsapp_provider: 'meta_cloud' | 'twilio' | 'ultramsg' | 'simulation' | 'simulated';
  whatsapp_api_token?: string;
  whatsapp_meta_token?: string;
  whatsapp_meta_phone_id?: string;
  whatsapp_phone_number_id?: string;
  whatsapp_twilio_sid?: string;
  whatsapp_twilio_auth_token?: string;
  whatsapp_twilio_from?: string;
  twilio_account_sid?: string;
  twilio_auth_token?: string;
  twilio_whatsapp_from?: string;
  // Multi-channel Notification Integrations
  telegram_bot_token?: string;
  telegram_chat_id?: string;
  discord_webhook_url?: string;
  custom_webhook_url?: string;
  notify_telegram?: boolean;
  notify_discord?: boolean;
  notify_whatsapp?: boolean;
  notify_webhook?: boolean;
  support_email?: string;
  currency_symbol?: string;
  allow_orders?: boolean;
  maintenance_mode?: boolean;
  announcement?: string;
  announcement_banner?: string;
}

export interface DashboardStats {
  total_orders: number;
  pending_orders: number;
  processing_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  partial_orders: number;
  today_orders: number;
  today_revenue: number;
  total_revenue: number;
  status_distribution: {
    status: OrderStatus;
    count: number;
    amount: number;
  }[];
  recent_orders: Order[];
}

export interface CreateOrderPayload {
  service_id: number;
  quantity: number;
  target: string;
  transaction_id: string;
  customer_contact?: string;
  customer_notes?: string;
  captcha_answer: number;
  captcha_token: string;
}

export interface OrderSubmissionResult {
  success: boolean;
  order_id: string;
  message: string;
  order: {
    order_id: string;
    service_name: string;
    service_id: number;
    quantity: number;
    target: string;
    amount: number;
    transaction_id: string;
    customer_contact?: string;
    created_at: string;
    whatsapp_status: string;
  };
}

export interface TrackOrderResponse {
  success: boolean;
  order?: {
    order_id: string;
    service_name: string;
    service_id: number;
    quantity: number;
    target: string;
    amount: number;
    status: OrderStatus;
    created_at: string;
    updated_at: string;
    history: {
      status: OrderStatus;
      created_at: string;
    }[];
  };
  error?: string;
}
