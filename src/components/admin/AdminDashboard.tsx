import React, { useState, useEffect, useRef } from 'react';
import {
  ShoppingCart,
  Clock,
  RefreshCw,
  CheckCircle2,
  XCircle,
  TrendingUp,
  DollarSign,
  ArrowRight,
  Send,
  Eye,
  Search,
  Calendar,
  AlertCircle,
  Zap,
  Volume2,
  VolumeX,
  Copy,
  Check,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { DashboardStats, Order, OrderStatus } from '../../types';

interface AdminDashboardProps {
  stats: DashboardStats | null;
  onNavigateToOrders: (filterStatus?: string) => void;
  onViewOrder: (orderId: string) => void;
  onNavigateToServices: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  stats,
  onNavigateToOrders,
  onViewOrder,
  onNavigateToServices
}) => {
  const [searchOrderId, setSearchOrderId] = useState('');
  const [searchError, setSearchError] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const prevOrderCountRef = useRef<number>(0);

  // Web Audio chime synthesizer when new proceed money arrives
  const playPaymentChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch {}
  };

  useEffect(() => {
    if (stats) {
      if (prevOrderCountRef.current > 0 && stats.total_orders > prevOrderCountRef.current) {
        // New order arrived! Play chime
        playPaymentChime();
      }
      prevOrderCountRef.current = stats.total_orders;
    }
  }, [stats?.total_orders]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = searchOrderId.trim().toUpperCase();
    if (!cleanId) {
      setSearchError('Please enter an Order ID.');
      return;
    }
    setSearchError('');
    onViewOrder(cleanId);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!stats) {
    return (
      <div className="p-12 text-center text-neutral-500 text-sm">
        Loading dashboard metrics...
      </div>
    );
  }

  // Calculate pending proceed money
  const pendingOrders = stats.recent_orders?.filter(o => o.status === 'pending') || [];
  const pendingProceedMoney = pendingOrders.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const statCards = [
    {
      title: 'Total Orders',
      value: stats.total_orders.toLocaleString(),
      subtext: 'Lifetime orders recorded',
      icon: ShoppingCart,
      color: 'from-amber-500/10 to-orange-500/10 text-amber-400 border-amber-500/20',
      action: () => onNavigateToOrders('all')
    },
    {
      title: 'Pending Proceed Money',
      value: `₹${pendingProceedMoney.toLocaleString()}`,
      subtext: `${stats.pending_orders} orders awaiting verification`,
      icon: DollarSign,
      color: 'from-emerald-500/15 to-teal-500/15 text-emerald-400 border-emerald-500/30',
      action: () => onNavigateToOrders('pending')
    },
    {
      title: 'Processing Orders',
      value: stats.processing_orders.toLocaleString(),
      subtext: 'Currently active on provider',
      icon: RefreshCw,
      color: 'from-blue-500/10 to-cyan-500/10 text-blue-400 border-blue-500/20',
      action: () => onNavigateToOrders('processing')
    },
    {
      title: 'Completed Orders',
      value: stats.completed_orders.toLocaleString(),
      subtext: 'Successfully delivered to customer',
      icon: CheckCircle2,
      color: 'from-emerald-500/10 to-teal-500/10 text-emerald-400 border-emerald-500/20',
      action: () => onNavigateToOrders('completed')
    },
    {
      title: 'Cancelled Orders',
      value: (stats.cancelled_orders + stats.partial_orders).toLocaleString(),
      subtext: 'Cancelled or refunded orders',
      icon: XCircle,
      color: 'from-rose-500/10 to-pink-500/10 text-rose-400 border-rose-500/20',
      action: () => onNavigateToOrders('cancelled')
    },
    {
      title: "Today's Orders",
      value: stats.today_orders.toLocaleString(),
      subtext: `Today's Volume: ₹${stats.today_revenue.toLocaleString()}`,
      icon: Calendar,
      color: 'from-purple-500/10 to-indigo-500/10 text-purple-400 border-purple-500/20',
      action: () => onNavigateToOrders('all')
    },
    {
      title: 'Total Order Value',
      value: `₹${stats.total_revenue.toLocaleString()}`,
      subtext: `All-time order gross value`,
      icon: DollarSign,
      color: 'from-emerald-500/10 to-teal-500/10 text-emerald-400 border-emerald-500/20',
      action: () => onNavigateToOrders('all')
    }
  ];

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">Pending</span>;
      case 'processing':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">Processing</span>;
      case 'completed':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Completed</span>;
      case 'cancelled':
      case 'refunded':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">Cancelled</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-neutral-800 text-neutral-300">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* PROMINENT LIVE INCOMING PROCEED MONEY MONITOR */}
      {/* ======================================================== */}
      <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 border-2 border-emerald-500/40 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Live Incoming Proceed Money Monitor
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-500/30">
                  Real-time Polling: 2.5s
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Customer payments submitted with 12-digit UTR appear here instantly.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Audio Alert Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                soundEnabled
                  ? 'bg-neutral-800 text-emerald-400 border border-emerald-500/30'
                  : 'bg-neutral-950 text-neutral-500 border border-neutral-800'
              }`}
              title={soundEnabled ? 'Payment Sound Alert Active' : 'Sound Alert Muted'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>{soundEnabled ? 'Alert Chime: ON' : 'Muted'}</span>
            </button>

            <button
              onClick={() => onNavigateToOrders('pending')}
              className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-500/20"
            >
              <span>Manage Pending ({stats.pending_orders})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Pending Proceed Money Grid Cards */}
        {pendingOrders.length === 0 ? (
          <div className="p-6 rounded-2xl bg-neutral-950/60 border border-neutral-800/80 text-center">
            <ShieldCheck className="w-8 h-8 text-emerald-400/80 mx-auto mb-2" />
            <p className="text-sm font-bold text-white">All Incoming Payments Verified</p>
            <p className="text-xs text-neutral-400 mt-1">
              No unconfirmed proceed payments pending. As soon as a client submits their UTR, it will flash here automatically.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {pendingOrders.slice(0, 6).map((order) => (
              <div
                key={order.id}
                className="p-4 rounded-2xl bg-neutral-950/90 border border-emerald-500/30 hover:border-emerald-500/60 transition-all flex flex-col justify-between space-y-3 shadow-lg group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-amber-400">
                      {order.order_id}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 font-mono font-black text-sm text-emerald-400 animate-pulse">
                      ₹{order.amount}
                    </span>
                  </div>

                  <div className="text-xs font-medium text-white truncate max-w-full">
                    {order.service_name}
                  </div>

                  <div className="mt-1 flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                    <span>Qty: {Number(order.quantity).toLocaleString()}</span>
                    <span className="truncate max-w-[130px]" title={order.target}>
                      {order.target}
                    </span>
                  </div>

                  <div className="mt-2 p-2 bg-neutral-900 rounded-xl border border-neutral-800 flex items-center justify-between text-xs font-mono">
                    <span className="text-neutral-400 text-[10px]">UTR:</span>
                    <span className="text-emerald-300 font-bold truncate max-w-[140px]">
                      {order.transaction_id}
                    </span>
                    <button
                      onClick={() => handleCopy(order.transaction_id, order.order_id)}
                      className="p-1 text-neutral-400 hover:text-white"
                      title="Copy UTR"
                    >
                      {copiedId === order.order_id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-neutral-800/80">
                  <button
                    onClick={() => onViewOrder(order.order_id)}
                    className="flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Verify Payment</span>
                  </button>

                  {order.customer_contact && (
                    <a
                      href={`https://wa.me/${order.customer_contact.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                        `Hello, regarding your ayushXsisi order ${order.order_id} (UTR: ${order.transaction_id}). Payment of ₹${order.amount} received!`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-emerald-400 border border-neutral-800"
                      title="WhatsApp Customer"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Prominent Order Search Box */}
      <div className="bg-neutral-900 border border-amber-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
            <Search className="w-4 h-4" />
            <span>Direct Order Lookup</span>
          </div>
          <h2 className="text-xl font-black text-white">Find & Manage Any Customer Order</h2>
          <p className="text-xs text-neutral-400 mt-1 mb-4">
            Enter an Order ID to immediately inspect customer details, payment UTR, target link, and update fulfillment status.
          </p>

          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                id="admin-dashboard-order-search"
                type="text"
                value={searchOrderId}
                onChange={(e) => {
                  setSearchOrderId(e.target.value);
                  if (searchError) setSearchError('');
                }}
                placeholder="Enter Order ID (e.g. AX-20260827-482731)"
                className="w-full pl-10 pr-4 py-3 bg-neutral-950 border border-neutral-700 rounded-xl text-sm font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
              />
            </div>
            <button
              id="admin-dashboard-search-btn"
              type="submit"
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4" />
              <span>Search Order</span>
            </button>
          </form>

          {searchError && (
            <p className="text-xs text-rose-400 mt-2 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{searchError}</span>
            </p>
          )}
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={card.action}
              className={`p-5 rounded-2xl bg-neutral-900/90 border ${card.color} hover:scale-[1.01] transition-all cursor-pointer shadow-lg`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">{card.title}</span>
                <div className="p-2 rounded-xl bg-neutral-950 border border-neutral-800">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-black text-white">{card.value}</div>
                <div className="text-xs text-neutral-400 mt-1">{card.subtext}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Orders Feed Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Recent Orders Received</h3>
            <p className="text-xs text-neutral-400">Latest submissions requiring owner attention</p>
          </div>
          <button
            onClick={() => onNavigateToOrders('all')}
            className="text-xs font-semibold text-amber-400 hover:underline flex items-center gap-1"
          >
            <span>View All Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="text-[11px] uppercase tracking-wider text-neutral-500 border-b border-neutral-800 bg-neutral-950/40">
              <tr>
                <th className="py-3 px-3">Order ID</th>
                <th className="py-3 px-3">Service</th>
                <th className="py-3 px-3">Target</th>
                <th className="py-3 px-3">Quantity</th>
                <th className="py-3 px-3">Proceed Amount</th>
                <th className="py-3 px-3">Txn ID (UTR)</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80 font-mono">
              {stats.recent_orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-neutral-500 font-sans">
                    No orders recorded yet. As customers submit orders, they will appear here.
                  </td>
                </tr>
              ) : (
                stats.recent_orders.map((order) => (
                  <tr key={order.id} className="hover:bg-neutral-800/40 transition-colors">
                    <td className="py-3 px-3 font-bold text-amber-400">{order.order_id}</td>
                    <td className="py-3 px-3 font-sans max-w-[180px] truncate text-white">
                      {order.service_name} (#{order.service_id})
                    </td>
                    <td className="py-3 px-3 max-w-[150px] truncate text-neutral-300" title={order.target}>
                      {order.target}
                    </td>
                    <td className="py-3 px-3 text-neutral-200">{Number(order.quantity).toLocaleString()}</td>
                    <td className="py-3 px-3 font-bold text-emerald-400">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black">
                        ₹{order.amount}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-neutral-300">{order.transaction_id}</td>
                    <td className="py-3 px-3 font-sans">{getStatusBadge(order.status)}</td>
                    <td className="py-3 px-3 font-sans text-neutral-400">
                      {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-3 text-right font-sans">
                      <button
                        onClick={() => onViewOrder(order.order_id)}
                        className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white text-xs font-medium inline-flex items-center gap-1 transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Manage</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
