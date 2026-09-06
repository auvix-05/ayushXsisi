import { Order, Service } from '../src/types';
import { db } from './db';
import { sendWhatsAppNotification, formatWhatsAppMessage } from './whatsapp';

export interface NotificationResult {
  channel: 'whatsapp' | 'telegram' | 'discord' | 'custom_webhook';
  success: boolean;
  status: string;
  message?: string;
  error?: string;
}

export interface DispatchSummary {
  order_id: string;
  results: NotificationResult[];
  direct_whatsapp_url: string;
}

/**
 * Send instant Telegram Bot notification to owner
 */
export async function sendTelegramNotification(
  order: Order,
  service?: Service,
  customBotToken?: string,
  customChatId?: string
): Promise<NotificationResult> {
  const settings = db.getSettings();
  const botToken = customBotToken || process.env.TELEGRAM_BOT_TOKEN || settings.telegram_bot_token;
  const chatId = customChatId || process.env.TELEGRAM_CHAT_ID || settings.telegram_chat_id;

  if (!botToken || !chatId) {
    return {
      channel: 'telegram',
      success: false,
      status: 'skipped',
      message: 'Telegram Bot Token or Chat ID not configured.'
    };
  }

  const dateStr = new Date(order.created_at).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const text = [
    `🔔 *NEW ORDER RECEIVED — ayushXsisi*`,
    ``,
    `📦 *Order ID:* \`${order.order_id}\``,
    `⚡ *Service:* ${order.service_name}`,
    `🆔 *Service ID:* #${order.service_id}`,
    `🔢 *Quantity:* ${Number(order.quantity).toLocaleString()}`,
    `💰 *Amount:* ₹${order.amount}`,
    `💳 *UTR / Txn ID:* \`${order.transaction_id}\``,
    `🎯 *Target / Link:* ${order.target}`,
    `📱 *Customer Contact:* ${order.customer_contact || 'Not provided'}`,
    `📝 *Customer Notes:* ${order.customer_notes || 'None'}`,
    `🕒 *Time:* ${dateStr}`,
    `📊 *Status:* ${order.status.toUpperCase()}`
  ].join('\n');

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      })
    });

    const data = await response.json();
    if (response.ok && data.ok) {
      db.logSecurity('notification_sent', `Telegram notification delivered for Order ${order.order_id}`);
      return {
        channel: 'telegram',
        success: true,
        status: 'delivered',
        message: 'Telegram notification delivered successfully.'
      };
    } else {
      const errMsg = data.description || 'Telegram API returned error';
      console.warn(`[Telegram Bot Error] ${errMsg}`);
      return {
        channel: 'telegram',
        success: false,
        status: 'failed',
        error: errMsg
      };
    }
  } catch (err: any) {
    console.error('[Telegram Bot Network Error]', err);
    return {
      channel: 'telegram',
      success: false,
      status: 'error',
      error: err.message || 'Network failure communicating with Telegram API'
    };
  }
}

/**
 * Send instant Discord Webhook notification to owner
 */
export async function sendDiscordNotification(
  order: Order,
  service?: Service,
  customWebhookUrl?: string
): Promise<NotificationResult> {
  const settings = db.getSettings();
  const webhookUrl = customWebhookUrl || process.env.DISCORD_WEBHOOK_URL || settings.discord_webhook_url;

  if (!webhookUrl) {
    return {
      channel: 'discord',
      success: false,
      status: 'skipped',
      message: 'Discord Webhook URL not configured.'
    };
  }

  const embed = {
    title: `🚨 NEW ORDER RECEIVED: ${order.order_id}`,
    color: 0xf59e0b, // Amber color
    fields: [
      { name: '🛒 Service', value: `${order.service_name} (\`#${order.service_id}\`)`, inline: false },
      { name: '🔢 Quantity', value: Number(order.quantity).toLocaleString(), inline: true },
      { name: '💰 Total Amount', value: `₹${order.amount}`, inline: true },
      { name: '💳 Transaction ID (UTR)', value: `\`${order.transaction_id}\``, inline: true },
      { name: '🎯 Target Link', value: order.target, inline: false },
      { name: '📱 Customer Contact', value: order.customer_contact || 'None', inline: true },
      { name: '📝 Customer Notes', value: order.customer_notes || 'None', inline: true },
      { name: '🕒 Order Date', value: new Date(order.created_at).toLocaleString(), inline: true }
    ],
    footer: {
      text: 'ayushXsisi Order Notification Engine'
    },
    timestamp: new Date().toISOString()
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'ayushXsisi Order Bot',
        avatar_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80',
        content: `**New customer order placed!** Order ID: \`${order.order_id}\` — ₹${order.amount}`,
        embeds: [embed]
      })
    });

    if (response.ok || response.status === 204) {
      db.logSecurity('notification_sent', `Discord notification sent for Order ${order.order_id}`);
      return {
        channel: 'discord',
        success: true,
        status: 'delivered',
        message: 'Discord webhook notification delivered successfully.'
      };
    } else {
      const text = await response.text();
      return {
        channel: 'discord',
        success: false,
        status: 'failed',
        error: `Discord Webhook returned status ${response.status}: ${text}`
      };
    }
  } catch (err: any) {
    console.error('[Discord Webhook Error]', err);
    return {
      channel: 'discord',
      success: false,
      status: 'error',
      error: err.message || 'Failed to trigger Discord webhook'
    };
  }
}

/**
 * Send Custom Webhook notification (e.g. Zapier, Make, n8n)
 */
export async function sendCustomWebhookNotification(
  order: Order,
  service?: Service,
  customUrl?: string
): Promise<NotificationResult> {
  const settings = db.getSettings();
  const url = customUrl || settings.custom_webhook_url;

  if (!url) {
    return {
      channel: 'custom_webhook',
      success: false,
      status: 'skipped',
      message: 'Custom webhook URL not configured.'
    };
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'order.created',
        order,
        service: service ? {
          service_id: service.service_id,
          name: service.name,
          category_name: service.category_name,
          price_per_1k: service.price_per_1k
        } : undefined,
        timestamp: new Date().toISOString()
      })
    });

    if (response.ok) {
      return {
        channel: 'custom_webhook',
        success: true,
        status: 'delivered',
        message: 'Custom webhook triggered successfully.'
      };
    } else {
      return {
        channel: 'custom_webhook',
        success: false,
        status: 'failed',
        error: `Webhook returned status ${response.status}`
      };
    }
  } catch (err: any) {
    return {
      channel: 'custom_webhook',
      success: false,
      status: 'error',
      error: err.message
    };
  }
}

/**
 * Dispatch multi-channel notifications whenever a customer submits an order
 */
export async function dispatchAllOrderNotifications(order: Order, service?: Service): Promise<DispatchSummary> {
  const results: NotificationResult[] = [];
  const settings = db.getSettings();
  const ownerWhatsapp = settings.owner_whatsapp || '+917033994688';
  const cleanNumber = ownerWhatsapp.replace(/[^0-9]/g, '');
  const messageBody = formatWhatsAppMessage(order, service);
  const directWhatsAppUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(messageBody)}`;

  // 1. WhatsApp Notification
  try {
    const waResult = await sendWhatsAppNotification(order, service);
    results.push({
      channel: 'whatsapp',
      success: waResult.success,
      status: waResult.status,
      message: waResult.message,
      error: waResult.error
    });
  } catch (err: any) {
    results.push({
      channel: 'whatsapp',
      success: false,
      status: 'failed',
      error: err.message
    });
  }

  // 2. Telegram Bot Notification (if configured or enabled)
  if (settings.telegram_bot_token && settings.telegram_chat_id) {
    const tgResult = await sendTelegramNotification(order, service);
    results.push(tgResult);
  }

  // 3. Discord Webhook Notification (if configured)
  if (settings.discord_webhook_url) {
    const discordResult = await sendDiscordNotification(order, service);
    results.push(discordResult);
  }

  // 4. Custom Webhook (if configured)
  if (settings.custom_webhook_url) {
    const customResult = await sendCustomWebhookNotification(order, service);
    results.push(customResult);
  }

  return {
    order_id: order.order_id,
    results,
    direct_whatsapp_url: directWhatsAppUrl
  };
}
