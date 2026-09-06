import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Layers,
  Settings,
  Shield,
  LogOut,
  ExternalLink,
  Activity,
  User,
  Clock,
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  X,
  ArrowRight,
  Radio
} from 'lucide-react';
import { BrandLogo } from '../BrandLogo';
import { pollAdminOrders } from '../../lib/api';
import { Order } from '../../types';

interface AdminLayoutProps {
  token: string;
  currentTab: 'dashboard' | 'orders' | 'services' | 'settings' | 'logs';
  onTabChange: (tab: 'dashboard' | 'orders' | 'services' | 'settings' | 'logs') => void;
  adminUser: any;
  onLogout: () => void;
  onViewPublicSite: () => void;
  children: React.ReactNode;
}

// Synthesize pleasant multi-tone order chime using Web Audio API
function playOrderChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.1);

      gain.gain.setValueAtTime(0, ctx.currentTime + index * 0.1);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + index * 0.1 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + index * 0.1 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + index * 0.1);
      osc.stop(ctx.currentTime + index * 0.1 + 0.4);
    });
  } catch (e) {
    console.warn('Audio chime playback note:', e);
  }
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  token,
  currentTab,
  onTabChange,
  adminUser,
  onLogout,
  onViewPublicSite,
  children
}) => {
  const tabs = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders' as const, label: 'Orders & Fulfillment', icon: ShoppingCart },
    { id: 'services' as const, label: 'Services & Pricing', icon: Layers },
    { id: 'settings' as const, label: 'Settings & Backups', icon: Settings },
    { id: 'logs' as const, label: 'WhatsApp & Audit Logs', icon: Activity }
  ];

  // Sound & Live Alert State
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('admin_sound_enabled') !== 'false';
  });
  const [desktopPerm, setDesktopPerm] = useState<NotificationPermission>('default');
  const [activeAlerts, setActiveAlerts] = useState<Order[]>([]);
  const lastCheckTimeRef = useRef<string>(new Date().toISOString());
  const initialMountRef = useRef(true);

  useEffect(() => {
    if ('Notification' in window) {
      setDesktopPerm(Notification.permission);
    }
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('admin_sound_enabled', String(next));
    if (next) playOrderChime();
  };

  const requestDesktopPermission = async () => {
    if ('Notification' in window) {
      const res = await Notification.requestPermission();
      setDesktopPerm(res);
      if (res === 'granted') {
        new Notification('Ayush SMM Admin Alerts Active', {
          body: 'You will receive instant alerts on this screen whenever a new order is placed.',
          icon: '/favicon.ico'
        });
      }
    }
  };

  // Real-Time Polling for New Orders
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await pollAdminOrders(token, lastCheckTimeRef.current);
        if (res.success) {
          lastCheckTimeRef.current = res.server_time;
          if (!initialMountRef.current && res.new_orders && res.new_orders.length > 0) {
            // New orders arrived!
            if (soundEnabled) {
              playOrderChime();
            }

            // Push to alerts list
            setActiveAlerts((prev) => [...res.new_orders, ...prev].slice(0, 5));

            // Native Desktop Notification if granted
            if ('Notification' in window && Notification.permission === 'granted') {
              res.new_orders.forEach((order) => {
                new Notification(`🚨 New Order Placed: ₹${order.amount}`, {
                  body: `${order.service_name} • Order ID: ${order.order_id}`,
                  tag: order.order_id
                });
              });
            }
          }
          initialMountRef.current = false;
        }
      } catch (err) {
        // Quiet background polling error
      }
    }, 8000); // 8 second interval

    return () => clearInterval(interval);
  }, [token, soundEnabled]);

  const dismissAlert = (orderId: string) => {
    setActiveAlerts((prev) => prev.filter((o) => o.order_id !== orderId));
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 flex flex-col md:flex-row relative">
      {/* Toast Notification Container */}
      {activeAlerts.length > 0 && (
        <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full px-4 sm:px-0">
          {activeAlerts.map((order) => (
            <div
              key={order.order_id}
              className="bg-neutral-900 border-2 border-amber-500/80 rounded-2xl p-4 shadow-2xl shadow-amber-500/20 text-white animate-bounce-short relative overflow-hidden backdrop-blur-xl"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500 animate-pulse" />
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-neutral-950 flex items-center justify-center font-bold">
                    <BellRing className="w-4 h-4 animate-spin" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">New Client Order!</span>
                    <span className="text-sm font-black text-white">₹{order.amount} • {order.service_name}</span>
                  </div>
                </div>
                <button
                  onClick={() => dismissAlert(order.order_id)}
                  className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-2 text-xs text-neutral-300 font-mono flex items-center justify-between border-t border-neutral-800 pt-2">
                <span>ID: {order.order_id}</span>
                <span>Qty: {order.quantity.toLocaleString()}</span>
              </div>

              <button
                onClick={() => {
                  dismissAlert(order.order_id);
                  onTabChange('orders');
                }}
                className="mt-3 w-full py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-amber-500/20"
              >
                <span>Open Order Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Sidebar (Desktop) */}
      <aside className="w-full md:w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col justify-between flex-shrink-0">
        <div>
          {/* Brand Header */}
          <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
            <BrandLogo size="md" />
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`admin-nav-${tab.id}`}
                  onClick={() => onTabChange(tab.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/10 font-bold'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-neutral-950' : 'text-neutral-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User & Actions Footer */}
        <div className="p-4 border-t border-neutral-800 space-y-3">
          <div className="flex items-center gap-3 px-2 py-1.5 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-xs">
              <User className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white truncate">{adminUser?.username || 'Admin'}</div>
              <div className="text-[10px] text-neutral-400 truncate">{adminUser?.role || 'Super Admin'}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onViewPublicSite}
              className="py-2 px-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors"
              title="Open Public Customer Site"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Public</span>
            </button>

            <button
              onClick={onLogout}
              className="py-2 px-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-neutral-950 overflow-y-auto">
        {/* Top bar */}
        <header className="h-16 border-b border-neutral-800 px-6 flex items-center justify-between bg-neutral-900/40 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Panel /</span>
            <span className="text-sm font-bold text-white capitalize">{currentTab.replace('-', ' ')}</span>
            <div className="hidden lg:flex items-center gap-1.5 ml-4 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Alert Listener Active</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Sound Toggle Button */}
            <button
              onClick={toggleSound}
              className={`px-3 py-1.5 border rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                soundEnabled
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-neutral-300'
              }`}
              title={soundEnabled ? 'Order sound alert ON (Click to mute)' : 'Order sound alert MUTED (Click to unmute)'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-amber-400" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{soundEnabled ? 'Chime ON' : 'Muted'}</span>
            </button>

            {/* Desktop Notification Request if default */}
            {desktopPerm === 'default' && (
              <button
                onClick={requestDesktopPermission}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold rounded-xl transition-colors"
                title="Enable Push Desktop Notifications"
              >
                <Bell className="w-3.5 h-3.5 text-sky-400" />
                <span>Enable Push</span>
              </button>
            )}

            <button
              onClick={onViewPublicSite}
              className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">View Public Site</span>
            </button>
          </div>
        </header>

        {/* Tab Body */}
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </div>
      </main>
    </div>
  );
};

