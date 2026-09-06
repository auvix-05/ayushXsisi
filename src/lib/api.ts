import {
  Category,
  Service,
  Order,
  DashboardStats,
  CreateOrderPayload,
  OrderSubmissionResult,
  TrackOrderResponse,
  AppSettings,
  OrderStatus,
  WhatsAppLog,
  AuditLog
} from '../types';

const API_BASE = '/api';

export class ApiError extends Error {
  constructor(public message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(data.error || `Request failed with status ${response.status}`, response.status);
  }

  return data as T;
}

// ----------------------------------------------------
// Public Client API
// ----------------------------------------------------

export async function getPublicConfig(): Promise<{
  brand_name: string;
  owner_whatsapp: string;
  upi_id: string;
  upi_merchant_name: string;
  merchant_name?: string;
  upi_qr_url?: string;
  currency_symbol: string;
  allow_orders: boolean;
  announcement?: string;
  announcement_banner?: string;
}> {
  return request('/public/config');
}

export async function getPublicSettings(): Promise<{ success: boolean; settings: AppSettings }> {
  try {
    const config = await getPublicConfig();
    return {
      success: true,
      settings: {
        owner_whatsapp: config.owner_whatsapp,
        upi_id: config.upi_id,
        merchant_name: config.merchant_name || config.upi_merchant_name,
        upi_merchant_name: config.upi_merchant_name,
        announcement_banner: config.announcement_banner || config.announcement,
        whatsapp_provider: 'simulated'
      }
    };
  } catch {
    return {
      success: false,
      settings: {
        owner_whatsapp: '+917033994688',
        upi_id: '7033994688-4@ybl',
        merchant_name: 'Shilpi Devi',
        whatsapp_provider: 'simulated'
      }
    };
  }
}

export async function getPublicCategories(): Promise<{ success: boolean; categories: Category[] }> {
  return request('/public/categories');
}

export async function getPublicServices(): Promise<{ success: boolean; services: Service[]; categories?: Category[] }> {
  return request('/public/services');
}

export async function getCaptchaChallenge(): Promise<{
  success: boolean;
  captcha: { question: string; token: string };
}> {
  return request('/public/captcha');
}

export async function submitCustomerOrder(payload: CreateOrderPayload): Promise<OrderSubmissionResult> {
  return request('/public/orders/submit', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function trackCustomerOrder(orderId: string): Promise<TrackOrderResponse> {
  return request(`/public/orders/track/${encodeURIComponent(orderId.trim())}`);
}

// ----------------------------------------------------
// Admin Client API
// ----------------------------------------------------

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`
  };
}

export async function adminLogin(username: string, password: string): Promise<{
  success: boolean;
  token: string;
  user: { id: string; username: string; role: string; last_login?: string };
}> {
  return request('/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
}

export async function getAdminMe(token: string): Promise<{
  success: boolean;
  user: { id: string; username: string; role: string; last_login?: string };
}> {
  return request('/admin/me', {
    headers: authHeaders(token)
  });
}

export async function verifyAdminToken(token: string): Promise<{
  valid: boolean;
  user?: { id: string; username: string; role: string; last_login?: string };
}> {
  try {
    const res = await getAdminMe(token);
    return { valid: res.success, user: res.user };
  } catch {
    return { valid: false };
  }
}

export async function getAdminStats(token: string): Promise<{ success: boolean; stats: DashboardStats }> {
  return request('/admin/stats', {
    headers: authHeaders(token)
  });
}

export async function getAdminDashboardStats(token: string): Promise<{ success: boolean; stats: DashboardStats }> {
  return getAdminStats(token);
}

export async function getAdminOrders(
  token: string,
  params: {
    status?: string;
    search?: string;
    category?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: string;
  } = {}
): Promise<{ success: boolean; orders: Order[]; total: number }> {
  const query = new URLSearchParams();
  if (params.status) query.append('status', params.status);
  if (params.search) query.append('search', params.search);
  if (params.category) query.append('category', params.category);
  if (params.limit) query.append('limit', String(params.limit));
  if (params.offset !== undefined) query.append('offset', String(params.offset));
  if (params.sortBy) query.append('sortBy', params.sortBy);
  if (params.sortOrder) query.append('sortOrder', params.sortOrder);

  return request(`/admin/orders?${query.toString()}`, {
    headers: authHeaders(token)
  });
}

export async function getAdminOrderDetails(token: string, orderId: string): Promise<{ success: boolean; order: Order }> {
  return request(`/admin/orders/${encodeURIComponent(orderId)}`, {
    headers: authHeaders(token)
  });
}

export async function updateOrderStatus(
  token: string,
  orderId: string,
  status: OrderStatus,
  note?: string
): Promise<{ success: boolean; order: Order; message: string }> {
  return request(`/admin/orders/${encodeURIComponent(orderId)}/status`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ status, note })
  });
}

export async function bulkUpdateOrderStatus(
  token: string,
  orderIds: string[],
  status: OrderStatus,
  note?: string
): Promise<{ success: boolean; message: string }> {
  return request('/admin/orders/bulk-status', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ order_ids: orderIds, status, note })
  });
}

export async function addAdminOrderNote(
  token: string,
  orderId: string,
  content: string
): Promise<{ success: boolean; order: Order }> {
  return request(`/admin/orders/${encodeURIComponent(orderId)}/notes`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ content })
  });
}

export async function resendWhatsAppNotification(
  token: string,
  orderId: string
): Promise<{ success: boolean; message: string; order: Order }> {
  return request(`/admin/orders/${encodeURIComponent(orderId)}/resend-whatsapp`, {
    method: 'POST',
    headers: authHeaders(token)
  });
}

export async function sendTestWhatsAppNotification(
  token: string,
  phoneNumber?: string
): Promise<{ success: boolean; result: { status: string; message: string } }> {
  return request('/admin/whatsapp/test', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ phone_number: phoneNumber })
  });
}

export async function getAdminServices(token: string): Promise<{ success: boolean; services: Service[] }> {
  return request('/admin/services', {
    headers: authHeaders(token)
  });
}

export async function createAdminService(
  token: string,
  data: Partial<Service>
): Promise<{ success: boolean; service: Service; message: string }> {
  return request('/admin/services', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data)
  });
}

export async function updateAdminService(
  token: string,
  id: string,
  data: Partial<Service>
): Promise<{ success: boolean; service: Service; message: string }> {
  return request(`/admin/services/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(data)
  });
}

export async function deleteAdminService(
  token: string,
  id: string
): Promise<{ success: boolean; message: string }> {
  return request(`/admin/services/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(token)
  });
}

export async function getAdminCategories(token: string): Promise<{ success: boolean; categories: Category[] }> {
  return request('/admin/categories', {
    headers: authHeaders(token)
  });
}

export async function createAdminCategory(
  token: string,
  data: Partial<Category>
): Promise<{ success: boolean; category: Category }> {
  return request('/admin/categories', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data)
  });
}

export async function updateAdminCategory(
  token: string,
  id: string,
  data: Partial<Category>
): Promise<{ success: boolean; category: Category }> {
  return request(`/admin/categories/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(data)
  });
}

export async function deleteAdminCategory(
  token: string,
  id: string
): Promise<{ success: boolean; message: string }> {
  return request(`/admin/categories/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(token)
  });
}

export async function getAdminSettings(token: string): Promise<{ success: boolean; settings: AppSettings }> {
  return request('/admin/settings', {
    headers: authHeaders(token)
  });
}

export async function updateAdminSettings(
  token: string,
  settings: Partial<AppSettings>
): Promise<{ success: boolean; settings: AppSettings; message: string }> {
  return request('/admin/settings', {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(settings)
  });
}

export async function changeAdminPassword(
  token: string,
  currentPass: string,
  newPass: string
): Promise<{ success: boolean; message: string }> {
  return request('/admin/change-password', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass })
  });
}

export async function getAdminLogs(token: string): Promise<{
  success: boolean;
  whatsapp_logs: WhatsAppLog[];
  audit_logs: AuditLog[];
}> {
  return request('/admin/logs', {
    headers: authHeaders(token)
  });
}

export async function pollAdminOrders(
  token: string,
  since?: string
): Promise<{
  success: boolean;
  server_time: string;
  new_orders_count: number;
  new_orders: Order[];
}> {
  const query = since ? `?since=${encodeURIComponent(since)}` : '';
  return request(`/admin/orders/poll${query}`, {
    headers: authHeaders(token)
  });
}

export async function sendTestTelegramNotification(
  token: string,
  botToken?: string,
  chatId?: string
): Promise<{ success: boolean; result: any }> {
  return request('/admin/notifications/test-telegram', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ bot_token: botToken, chat_id: chatId })
  });
}

export async function sendTestDiscordNotification(
  token: string,
  webhookUrl?: string
): Promise<{ success: boolean; result: any }> {
  return request('/admin/notifications/test-discord', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ webhook_url: webhookUrl })
  });
}

export async function sendTestWebhookNotification(
  token: string,
  webhookUrl?: string
): Promise<{ success: boolean; result: any }> {
  return request('/admin/notifications/test-webhook', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ webhook_url: webhookUrl })
  });
}

