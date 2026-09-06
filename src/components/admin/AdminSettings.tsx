import React, { useState, useEffect } from 'react';
import {
  Settings,
  Send,
  QrCode,
  Lock,
  Download,
  Save,
  Check,
  AlertCircle,
  Database,
  RefreshCw,
  Eye,
  EyeOff,
  ShieldCheck,
  Zap,
  Bell,
  MessageSquare,
  Globe,
  HelpCircle,
  ExternalLink,
  Volume2
} from 'lucide-react';
import { AppSettings } from '../../types';
import {
  getAdminSettings,
  updateAdminSettings,
  changeAdminPassword,
  sendTestWhatsAppNotification,
  sendTestTelegramNotification,
  sendTestDiscordNotification,
  sendTestWebhookNotification
} from '../../lib/api';
import { PhonePeQrCard } from '../PhonePeQrCard';

interface AdminSettingsProps {
  token: string;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ token }) => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // WhatsApp Form
  const [ownerWhatsapp, setOwnerWhatsapp] = useState('+917033994688');
  const [whatsappProvider, setWhatsappProvider] = useState<'meta_cloud' | 'twilio' | 'simulated'>('simulated');
  const [metaToken, setMetaToken] = useState('');
  const [metaPhoneId, setMetaPhoneId] = useState('');
  const [twilioSid, setTwilioSid] = useState('');
  const [twilioAuthToken, setTwilioAuthToken] = useState('');
  const [twilioFromNumber, setTwilioFromNumber] = useState('');
  const [testSendingWa, setTestSendingWa] = useState(false);

  // Telegram Bot Form
  const [telegramBotToken, setTelegramBotToken] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [testSendingTg, setTestSendingTg] = useState(false);
  const [showTelegramHelp, setShowTelegramHelp] = useState(false);

  // Discord Webhook Form
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState('');
  const [testSendingDiscord, setTestSendingDiscord] = useState(false);

  // Custom Webhook Form
  const [customWebhookUrl, setCustomWebhookUrl] = useState('');
  const [testSendingWebhook, setTestSendingWebhook] = useState(false);

  // UPI Form
  const [upiId, setUpiId] = useState('7033994688-4@ybl');
  const [merchantName, setMerchantName] = useState('Shilpi Devi');
  const [qrImageUrl, setQrImageUrl] = useState('');
  const [announcement, setAnnouncement] = useState('⚡ Direct manual fulfillment by ayushXsisi. High quality & instant dispatch.');

  // Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await getAdminSettings(token);
      if (res.success && res.settings) {
        const s = res.settings;
        setSettings(s);
        setOwnerWhatsapp(s.owner_whatsapp || '+917033994688');
        setWhatsappProvider(s.whatsapp_provider || 'simulated');
        setMetaToken(s.whatsapp_meta_token || '');
        setMetaPhoneId(s.whatsapp_meta_phone_id || '');
        setTwilioSid(s.whatsapp_twilio_sid || '');
        setTwilioAuthToken(s.whatsapp_twilio_auth_token || '');
        setTwilioFromNumber(s.whatsapp_twilio_from || '');
        setTelegramBotToken(s.telegram_bot_token || '');
        setTelegramChatId(s.telegram_chat_id || '');
        setDiscordWebhookUrl(s.discord_webhook_url || '');
        setCustomWebhookUrl(s.custom_webhook_url || '');
        setUpiId(s.upi_id || '7033994688-4@ybl');
        setMerchantName(s.merchant_name || s.upi_merchant_name || 'Shilpi Devi');
        setQrImageUrl(s.qr_image_url || '');
        setAnnouncement(s.announcement_banner || '');
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAllSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setErrorNotice(null);
    setSuccessNotice(null);

    try {
      const res = await updateAdminSettings(token, {
        owner_whatsapp: ownerWhatsapp.trim(),
        whatsapp_provider: whatsappProvider,
        whatsapp_meta_token: metaToken.trim() || undefined,
        whatsapp_meta_phone_id: metaPhoneId.trim() || undefined,
        whatsapp_twilio_sid: twilioSid.trim() || undefined,
        whatsapp_twilio_auth_token: twilioAuthToken.trim() || undefined,
        whatsapp_twilio_from: twilioFromNumber.trim() || undefined,
        telegram_bot_token: telegramBotToken.trim() || undefined,
        telegram_chat_id: telegramChatId.trim() || undefined,
        discord_webhook_url: discordWebhookUrl.trim() || undefined,
        custom_webhook_url: customWebhookUrl.trim() || undefined,
        upi_id: upiId.trim(),
        merchant_name: merchantName.trim(),
        qr_image_url: qrImageUrl.trim() || undefined,
        announcement_banner: announcement.trim()
      });

      if (res.success) {
        setSuccessNotice('All notification and system settings updated successfully.');
        setTimeout(() => setSuccessNotice(null), 4000);
      }
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to update settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSendTestWhatsApp = async () => {
    setTestSendingWa(true);
    setErrorNotice(null);
    try {
      const res = await sendTestWhatsAppNotification(token, ownerWhatsapp);
      if (res.success) {
        setSuccessNotice(`WhatsApp test alert dispatched to ${ownerWhatsapp}: ${res.result?.message || 'Delivered'}`);
      } else {
        setErrorNotice(`WhatsApp test response: ${res.result?.message || 'Check credentials'}`);
      }
    } catch (err: any) {
      setErrorNotice('Failed to send WhatsApp test: ' + err.message);
    } finally {
      setTestSendingWa(false);
    }
  };

  const handleSendTestTelegram = async () => {
    if (!telegramBotToken || !telegramChatId) {
      setErrorNotice('Please enter both Telegram Bot Token and Chat ID to send a test alert.');
      return;
    }
    setTestSendingTg(true);
    setErrorNotice(null);
    try {
      const res = await sendTestTelegramNotification(token, telegramBotToken, telegramChatId);
      if (res.success) {
        setSuccessNotice('Telegram test notification delivered to your phone successfully!');
      } else {
        setErrorNotice(`Telegram delivery failed: ${res.result?.error || 'Invalid token or chat ID'}`);
      }
    } catch (err: any) {
      setErrorNotice('Telegram test failed: ' + err.message);
    } finally {
      setTestSendingTg(false);
    }
  };

  const handleSendTestDiscord = async () => {
    if (!discordWebhookUrl) {
      setErrorNotice('Please enter a Discord Webhook URL to send a test alert.');
      return;
    }
    setTestSendingDiscord(true);
    setErrorNotice(null);
    try {
      const res = await sendTestDiscordNotification(token, discordWebhookUrl);
      if (res.success) {
        setSuccessNotice('Discord webhook test alert dispatched successfully!');
      } else {
        setErrorNotice(`Discord delivery failed: ${res.result?.error || 'Invalid Webhook URL'}`);
      }
    } catch (err: any) {
      setErrorNotice('Discord test failed: ' + err.message);
    } finally {
      setTestSendingDiscord(false);
    }
  };

  const handleSendTestWebhook = async () => {
    if (!customWebhookUrl) {
      setErrorNotice('Please enter a Custom Webhook URL to send a test payload.');
      return;
    }
    setTestSendingWebhook(true);
    setErrorNotice(null);
    try {
      const res = await sendTestWebhookNotification(token, customWebhookUrl);
      if (res.success) {
        setSuccessNotice('Custom webhook test payload delivered successfully!');
      } else {
        setErrorNotice(`Webhook delivery failed: ${res.result?.error || 'Response error'}`);
      }
    } catch (err: any) {
      setErrorNotice('Webhook test failed: ' + err.message);
    } finally {
      setTestSendingWebhook(false);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNotice(null);
    setSuccessNotice(null);

    if (newPassword !== confirmPassword) {
      setErrorNotice('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorNotice('New password must be at least 6 characters.');
      return;
    }

    setChangingPassword(true);
    try {
      const res = await changeAdminPassword(token, currentPassword, newPassword);
      if (res.success) {
        setSuccessNotice('Admin password changed successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setSuccessNotice(null), 4000);
      }
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to change password.');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Alert Notices */}
      {successNotice && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-xs font-semibold flex items-center justify-between gap-2 animate-fadeIn">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>{successNotice}</span>
          </div>
          <button onClick={() => setSuccessNotice(null)} className="text-emerald-500 hover:text-emerald-300">✕</button>
        </div>
      )}
      {errorNotice && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-xs font-semibold flex items-center justify-between gap-2 animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorNotice}</span>
          </div>
          <button onClick={() => setErrorNotice(null)} className="text-rose-500 hover:text-rose-300">✕</button>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSaveAllSettings} className="space-y-6">
        {/* ======================================================== */}
        {/* 1. INSTANT ORDER NOTIFICATION CHANNELS */}
        {/* ======================================================== */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-neutral-800">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Instant Order Notification Hub</h3>
              <p className="text-xs text-neutral-400">Receive instant alerts on WhatsApp, Telegram, Discord, or Webhooks whenever a client places an order</p>
            </div>
          </div>

          {/* Channel A: WhatsApp Notification */}
          <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">WhatsApp Notification</h4>
                  <p className="text-[11px] text-neutral-400">Dispatches formatted order summary & 1-click customer WhatsApp verification</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSendTestWhatsApp}
                disabled={testSendingWa}
                className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-emerald-400 hover:text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors self-start sm:self-auto"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{testSendingWa ? 'Sending...' : 'Test WhatsApp'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-300 mb-1">Owner WhatsApp Number (with Country Code)</label>
                <input
                  type="text"
                  required
                  value={ownerWhatsapp}
                  onChange={(e) => setOwnerWhatsapp(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white font-mono focus:outline-none focus:border-amber-500"
                  placeholder="+917033994688"
                />
                <span className="text-[11px] text-neutral-500 mt-1 block">Active recipient: <b>{ownerWhatsapp || '+917033994688'}</b></span>
              </div>

              <div>
                <label className="block font-bold text-neutral-300 mb-1">WhatsApp Dispatch Mode</label>
                <select
                  value={whatsappProvider}
                  onChange={(e) => setWhatsappProvider(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white font-semibold focus:outline-none focus:border-amber-500"
                >
                  <option value="simulated">Simulation / Direct wa.me Dispatch Link (Default & Reliable)</option>
                  <option value="meta_cloud">Meta WhatsApp Cloud API (Direct Official)</option>
                  <option value="twilio">Twilio Programmable WhatsApp</option>
                </select>
              </div>
            </div>

            {/* Conditional Meta Cloud Inputs */}
            {whatsappProvider === 'meta_cloud' && (
              <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl space-y-3 text-xs animate-fadeIn">
                <div className="font-bold text-emerald-400">Meta WhatsApp Cloud API Credentials</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-400 mb-1">Phone Number ID</label>
                    <input
                      type="text"
                      value={metaPhoneId}
                      onChange={(e) => setMetaPhoneId(e.target.value)}
                      placeholder="e.g. 104829104829104"
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-400 mb-1">Permanent Access Token</label>
                    <input
                      type="password"
                      value={metaToken}
                      onChange={(e) => setMetaToken(e.target.value)}
                      placeholder="EAAB..."
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Conditional Twilio Inputs */}
            {whatsappProvider === 'twilio' && (
              <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl space-y-3 text-xs animate-fadeIn">
                <div className="font-bold text-emerald-400">Twilio WhatsApp Credentials</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-neutral-400 mb-1">Account SID</label>
                    <input
                      type="text"
                      value={twilioSid}
                      onChange={(e) => setTwilioSid(e.target.value)}
                      placeholder="AC..."
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-400 mb-1">Auth Token</label>
                    <input
                      type="password"
                      value={twilioAuthToken}
                      onChange={(e) => setTwilioAuthToken(e.target.value)}
                      placeholder="Auth Token"
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-400 mb-1">From Number</label>
                    <input
                      type="text"
                      value={twilioFromNumber}
                      onChange={(e) => setTwilioFromNumber(e.target.value)}
                      placeholder="+14155238886"
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white font-mono"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Channel B: Telegram Bot Notification (100% Free & Instant Alert) */}
          <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">Telegram Bot Instant Notification</h4>
                    <span className="px-2 py-0.5 bg-sky-500/20 text-sky-300 text-[10px] font-bold rounded-md">100% Free & Instant</span>
                  </div>
                  <p className="text-[11px] text-neutral-400">Receive order pings with sound & full details straight to your Telegram phone app in &lt;1 second</p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setShowTelegramHelp(!showTelegramHelp)}
                  className="px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-semibold rounded-xl flex items-center gap-1"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>{showTelegramHelp ? 'Hide Setup Guide' : 'Setup Guide'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleSendTestTelegram}
                  disabled={testSendingTg}
                  className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-sky-500/30 text-sky-400 hover:text-sky-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{testSendingTg ? 'Testing...' : 'Test Telegram'}</span>
                </button>
              </div>
            </div>

            {/* Telegram Quick Setup Guide */}
            {showTelegramHelp && (
              <div className="p-4 bg-neutral-900 border border-sky-500/20 rounded-xl space-y-2 text-xs text-neutral-300 animate-fadeIn">
                <div className="font-bold text-sky-400">How to get your Telegram Bot Token & Chat ID in 1 minute:</div>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-neutral-300">
                  <li>Open Telegram, search for <b>@BotFather</b> and send <code>/newbot</code> to create a bot. Copy the generated <b>Bot Token</b>.</li>
                  <li>Start a chat with your new bot and click <b>Start</b>.</li>
                  <li>Search for <b>@userinfobot</b> on Telegram to see your personal <b>Chat ID</b> number.</li>
                  <li>Paste the Bot Token and Chat ID below and click <b>"Test Telegram"</b>!</li>
                </ol>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-300 mb-1">Telegram Bot Token</label>
                <input
                  type="password"
                  value={telegramBotToken}
                  onChange={(e) => setTelegramBotToken(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white font-mono focus:outline-none focus:border-sky-500"
                  placeholder="1234567890:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-300 mb-1">Telegram Chat ID (Your Personal or Group ID)</label>
                <input
                  type="text"
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white font-mono focus:outline-none focus:border-sky-500"
                  placeholder="e.g. 987654321"
                />
              </div>
            </div>
          </div>

          {/* Channel C: Discord Webhook (Free Discord Channel Push) */}
          <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Discord Webhook Channel Notification</h4>
                  <p className="text-[11px] text-neutral-400">Posts styled order embeds to your private Discord server channel</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSendTestDiscord}
                disabled={testSendingDiscord}
                className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-indigo-500/30 text-indigo-400 hover:text-indigo-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors self-start sm:self-auto"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{testSendingDiscord ? 'Testing...' : 'Test Discord'}</span>
              </button>
            </div>

            <div className="text-xs">
              <label className="block font-bold text-neutral-300 mb-1">Discord Webhook URL</label>
              <input
                type="password"
                value={discordWebhookUrl}
                onChange={(e) => setDiscordWebhookUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white font-mono focus:outline-none focus:border-indigo-500"
                placeholder="https://discord.com/api/webhooks/..."
              />
            </div>
          </div>

          {/* Channel D: Custom Webhook (Zapier / Make / n8n) */}
          <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Custom Webhook / Zapier / n8n</h4>
                  <p className="text-[11px] text-neutral-400">Triggers an automated JSON HTTP POST to any external endpoint on new orders</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSendTestWebhook}
                disabled={testSendingWebhook}
                className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-purple-500/30 text-purple-400 hover:text-purple-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors self-start sm:self-auto"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{testSendingWebhook ? 'Testing...' : 'Test Webhook'}</span>
              </button>
            </div>

            <div className="text-xs">
              <label className="block font-bold text-neutral-300 mb-1">Webhook Endpoint URL</label>
              <input
                type="url"
                value={customWebhookUrl}
                onChange={(e) => setCustomWebhookUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white font-mono focus:outline-none focus:border-purple-500"
                placeholder="https://hooks.zapier.com/hooks/catch/..."
              />
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. PAYMENT & ANNOUNCEMENT SETTINGS */}
        {/* ======================================================== */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-neutral-800">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Payment & Brand Settings</h3>
              <p className="text-xs text-neutral-400">Configure receiving UPI address, merchant display, and announcements</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-neutral-300 mb-1">Receiving UPI ID / VPA</label>
                  <input
                    type="text"
                    required
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                    placeholder="7033994688-4@ybl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-300 mb-1">Merchant Display Name</label>
                  <input
                    type="text"
                    required
                    value={merchantName}
                    onChange={(e) => setMerchantName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white font-bold focus:outline-none focus:border-amber-500"
                    placeholder="Shilpi Devi"
                  />
                </div>
              </div>

              <div className="text-xs">
                <label className="block font-bold text-neutral-300 mb-1">Homepage Announcement Banner</label>
                <input
                  type="text"
                  value={announcement}
                  onChange={(e) => setAnnouncement(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  placeholder="⚡ Special Offer: 20% Extra Followers on all orders today!"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl flex items-center gap-2 shadow-md shadow-amber-500/20 transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingSettings ? 'Saving Settings...' : 'Save All Settings'}</span>
                </button>
              </div>
            </div>

            {/* Live QR Preview */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="w-full text-center mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Live Customer QR Preview</span>
              </div>
              <PhonePeQrCard
                upiId={upiId}
                payeeName={merchantName || 'Shilpi Devi'}
                compact={true}
                className="w-full max-w-xs"
              />
            </div>
          </div>
        </div>
      </form>

      {/* ======================================================== */}
      {/* 3. CHANGE ADMIN PASSWORD */}
      {/* ======================================================== */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-neutral-800">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Security & Password</h3>
            <p className="text-xs text-neutral-400">Update your private admin account password</p>
          </div>
        </div>

        <form onSubmit={handleChangePasswordSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-neutral-300 mb-1">Current Password</label>
              <input
                type={showPasswords ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block font-bold text-neutral-300 mb-1">New Password</label>
              <input
                type={showPasswords ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block font-bold text-neutral-300 mb-1">Confirm New Password</label>
              <input
                type={showPasswords ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setShowPasswords(!showPasswords)}
              className="text-neutral-400 hover:text-white text-xs flex items-center gap-1"
            >
              {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showPasswords ? 'Hide' : 'Show'} Passwords</span>
            </button>

            <button
              type="submit"
              disabled={changingPassword}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{changingPassword ? 'Updating...' : 'Update Password'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* ======================================================== */}
      {/* 4. DATABASE BACKUPS & SQL SCHEMAS */}
      {/* ======================================================== */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-neutral-800">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Database Backups & Export Formats</h3>
            <p className="text-xs text-neutral-400">Download system data snapshots or SQL migration schemas</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <a
            href="/api/admin/export/orders.csv"
            target="_blank"
            rel="noreferrer"
            className="p-4 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-2xl flex flex-col justify-between transition-colors group"
          >
            <div>
              <span className="font-bold text-white block group-hover:text-amber-400">Orders CSV Export</span>
              <p className="text-[11px] text-neutral-400 mt-1">Spreadsheet compatible format with all orders</p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </div>
          </a>

          <a
            href="/api/admin/export/backup.json"
            target="_blank"
            rel="noreferrer"
            className="p-4 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-2xl flex flex-col justify-between transition-colors group"
          >
            <div>
              <span className="font-bold text-white block group-hover:text-amber-400">Full JSON Backup</span>
              <p className="text-[11px] text-neutral-400 mt-1">Complete snapshot of database.json with orders & services</p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-amber-400 font-semibold text-[11px]">
              <Download className="w-3.5 h-3.5" />
              <span>Download JSON</span>
            </div>
          </a>

          <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col justify-between">
            <div>
              <span className="font-bold text-white block">MySQL Schema</span>
              <p className="text-[11px] text-neutral-400 mt-1">Ready in <code>/server/sql/schema.mysql.sql</code></p>
            </div>
            <div className="mt-3 text-neutral-400 text-[11px] font-mono">
              InnoDB • UTF8mb4
            </div>
          </div>

          <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col justify-between">
            <div>
              <span className="font-bold text-white block">PostgreSQL Schema</span>
              <p className="text-[11px] text-neutral-400 mt-1">Ready in <code>/server/sql/schema.postgres.sql</code></p>
            </div>
            <div className="mt-3 text-neutral-400 text-[11px] font-mono">
              UUID • JSONB • GIN
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
