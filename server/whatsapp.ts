import { Order, Service } from '../src/types';
import { db } from './db';

export interface WhatsAppSendResult {
  success: boolean;
  provider: 'meta_cloud' | 'twilio' | 'ultramsg' | 'simulation' | 'direct';
  status: 'delivered' | 'failed' | 'simulated';
  message: string;
  direct_whatsapp_url: string;
  error?: string;
}

export function formatWhatsAppMessage(order: Order, service?: Service): string {
  const dateObj = new Date(order.created_at);
  const formattedDate = dateObj.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const formattedTime = dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const formattedQuantity = Number(order.quantity).toLocaleString();

  const lines = [
    `*NEW ORDER — ayushXsisi*`,
    ``,
    `*Order ID:* ${order.order_id}`,
    ``,
    `*Service:* ${order.service_name}`,
    `*Service ID:* ${order.service_id}`,
    `*Quantity:* ${formattedQuantity}`,
    `*Target:* ${order.target}`,
    ``,
    `*Amount:* ₹${order.amount}`,
    `*Transaction ID:* ${order.transaction_id}`,
    ``,
    `*Customer Contact:* ${order.customer_contact || 'Not provided'}`,
    `*Notes:* ${order.customer_notes || 'None'}`,
    ``,
    `*Status:* ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}`,
    `*Date:* ${formattedDate}`,
    `*Time:* ${formattedTime}`
  ];

  return lines.join('\n');
}

export async function sendWhatsAppNotification(order: Order, service?: Service): Promise<WhatsAppSendResult> {
  const settings = db.getSettings();
  const ownerNumber = process.env.OWNER_WHATSAPP_NUMBER || settings.owner_whatsapp || '+917033994688';
  const cleanOwnerNumber = ownerNumber.replace(/[^0-9]/g, '');
  const messageBody = formatWhatsAppMessage(order, service);

  // Generate direct wa.me link for manual one-click dispatch / backup
  const directWhatsAppUrl = `https://wa.me/${cleanOwnerNumber}?text=${encodeURIComponent(messageBody)}`;

  // Check if Meta WhatsApp Cloud API credentials are provided
  const metaToken = process.env.WHATSAPP_API_TOKEN || settings.whatsapp_api_token;
  const metaPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || settings.whatsapp_phone_number_id;

  // Check if Twilio WhatsApp API credentials are provided
  const twilioSid = process.env.TWILIO_ACCOUNT_SID || settings.twilio_account_sid;
  const twilioAuth = process.env.TWILIO_AUTH_TOKEN || settings.twilio_auth_token;
  const twilioFrom = process.env.TWILIO_WHATSAPP_FROM || settings.twilio_whatsapp_from || 'whatsapp:+14155238886';

  // 1. Try Meta Cloud API if configured
  if (metaToken && metaPhoneId) {
    try {
      const response = await fetch(`https://graph.facebook.com/v18.0/${metaPhoneId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${metaToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanOwnerNumber,
          type: 'text',
          text: { body: messageBody }
        })
      });

      const data = await response.json();
      if (response.ok && !data.error) {
        db.updateOrderWhatsAppStatus(order.order_id, 'delivered');
        db.logWhatsApp({
          order_id: order.order_id,
          recipient: ownerNumber,
          status: 'delivered',
          provider: 'meta_cloud',
          message_snippet: messageBody.slice(0, 120)
        });
        return {
          success: true,
          provider: 'meta_cloud',
          status: 'delivered',
          message: 'WhatsApp notification sent successfully via Meta Cloud API.',
          direct_whatsapp_url: directWhatsAppUrl
        };
      } else {
        const errorMsg = data.error?.message || 'Meta API response error';
        console.warn(`[WhatsApp Meta API Error] ${errorMsg}`);
        db.updateOrderWhatsAppStatus(order.order_id, 'failed', errorMsg);
        db.logWhatsApp({
          order_id: order.order_id,
          recipient: ownerNumber,
          status: 'failed',
          provider: 'meta_cloud',
          message_snippet: messageBody.slice(0, 120),
          error_message: errorMsg
        });
        return {
          success: false,
          provider: 'meta_cloud',
          status: 'failed',
          message: `Meta API delivery failed: ${errorMsg}`,
          direct_whatsapp_url: directWhatsAppUrl,
          error: errorMsg
        };
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'Meta Cloud API fetch exception';
      console.error('[WhatsApp Network Error]', err);
      db.updateOrderWhatsAppStatus(order.order_id, 'failed', errorMsg);
      db.logWhatsApp({
        order_id: order.order_id,
        recipient: ownerNumber,
        status: 'failed',
        provider: 'meta_cloud',
        message_snippet: messageBody.slice(0, 120),
        error_message: errorMsg
      });
      return {
        success: false,
        provider: 'meta_cloud',
        status: 'failed',
        message: errorMsg,
        direct_whatsapp_url: directWhatsAppUrl,
        error: errorMsg
      };
    }
  }

  // 2. Try Twilio API if configured
  if (twilioSid && twilioAuth) {
    try {
      const authHeader = 'Basic ' + Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64');
      const params = new URLSearchParams();
      params.append('From', twilioFrom.startsWith('whatsapp:') ? twilioFrom : `whatsapp:${twilioFrom}`);
      params.append('To', `whatsapp:+${cleanOwnerNumber}`);
      params.append('Body', messageBody);

      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      const data = await response.json();
      if (response.ok && data.sid) {
        db.updateOrderWhatsAppStatus(order.order_id, 'delivered');
        db.logWhatsApp({
          order_id: order.order_id,
          recipient: ownerNumber,
          status: 'delivered',
          provider: 'twilio',
          message_snippet: messageBody.slice(0, 120)
        });
        return {
          success: true,
          provider: 'twilio',
          status: 'delivered',
          message: 'WhatsApp notification sent successfully via Twilio.',
          direct_whatsapp_url: directWhatsAppUrl
        };
      } else {
        const errorMsg = data.message || 'Twilio delivery failed';
        db.updateOrderWhatsAppStatus(order.order_id, 'failed', errorMsg);
        db.logWhatsApp({
          order_id: order.order_id,
          recipient: ownerNumber,
          status: 'failed',
          provider: 'twilio',
          message_snippet: messageBody.slice(0, 120),
          error_message: errorMsg
        });
        return {
          success: false,
          provider: 'twilio',
          status: 'failed',
          message: errorMsg,
          direct_whatsapp_url: directWhatsAppUrl,
          error: errorMsg
        };
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'Twilio connection exception';
      db.updateOrderWhatsAppStatus(order.order_id, 'failed', errorMsg);
      db.logWhatsApp({
        order_id: order.order_id,
        recipient: ownerNumber,
        status: 'failed',
        provider: 'twilio',
        message_snippet: messageBody.slice(0, 120),
        error_message: errorMsg
      });
      return {
        success: false,
        provider: 'twilio',
        status: 'failed',
        message: errorMsg,
        direct_whatsapp_url: directWhatsAppUrl,
        error: errorMsg
      };
    }
  }

  // 3. Fallback / Production-Ready Simulation & Logging Mode
  // If no cloud credentials configured in env, we simulate & log delivery cleanly
  console.log(`\n======================================================`);
  console.log(`📱 [WHATSAPP DISPATCH] To: ${ownerNumber} (${cleanOwnerNumber})`);
  console.log(`------------------------------------------------------`);
  console.log(messageBody);
  console.log(`🔗 Direct WhatsApp URL: ${directWhatsAppUrl}`);
  console.log(`======================================================\n`);

  db.updateOrderWhatsAppStatus(order.order_id, 'simulated');
  db.logWhatsApp({
    order_id: order.order_id,
    recipient: ownerNumber,
    status: 'simulated',
    provider: 'simulation',
    message_snippet: messageBody.slice(0, 120)
  });

  return {
    success: true,
    provider: 'simulation',
    status: 'simulated',
    message: `Order notification generated and logged for owner (${ownerNumber}). Direct link ready.`,
    direct_whatsapp_url: directWhatsAppUrl
  };
}
