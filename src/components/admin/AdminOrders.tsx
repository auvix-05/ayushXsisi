import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  RefreshCw,
  AlertCircle,
  X,
  Copy,
  Check,
  Send,
  Download,
  ExternalLink,
  MessageSquare,
  MessageCircle,
  ArrowUpDown,
  Layers,
  ChevronLeft,
  ChevronRight,
  Plus
} from 'lucide-react';
import { Order, OrderStatus, Category } from '../../types';
import {
  getAdminOrders,
  getAdminOrderDetails,
  updateOrderStatus,
  bulkUpdateOrderStatus,
  addAdminOrderNote,
  resendWhatsAppNotification
} from '../../lib/api';

interface AdminOrdersProps {
  token: string;
  categories: Category[];
  initialStatusFilter?: string;
  selectedOrderIdToOpen?: string | null;
  onClearSelectedOrderId?: () => void;
}

export const AdminOrders: React.FC<AdminOrdersProps> = ({
  token,
  categories,
  initialStatusFilter = 'all',
  selectedOrderIdToOpen,
  onClearSelectedOrderId
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Filters & Pagination
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'amount' | 'quantity'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Selected Order for Detail Drawer/Modal
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [newAdminNote, setNewAdminNote] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [resendingWa, setResendingWa] = useState(false);

  // Multi-select for bulk actions
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<OrderStatus>('processing');

  // Copy feedback helpers
  const [copiedId, setCopiedId] = useState(false);
  const [copiedTxn, setCopiedTxn] = useState(false);
  const [copiedProviderFormat, setCopiedProviderFormat] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, categoryFilter, sortBy, sortOrder, page]);

  // Live real-time polling every 2.5s so placed orders and proceed money show up immediately
  useEffect(() => {
    const interval = setInterval(() => {
      // Background silent refresh without full skeleton flicker
      fetchOrders(true);
    }, 2500);
    return () => clearInterval(interval);
  }, [statusFilter, categoryFilter, sortBy, sortOrder, page, searchQuery]);

  useEffect(() => {
    if (selectedOrderIdToOpen) {
      handleOpenOrderDetails(selectedOrderIdToOpen);
      if (onClearSelectedOrderId) onClearSelectedOrderId();
    }
  }, [selectedOrderIdToOpen]);

  const fetchOrders = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const res = await getAdminOrders(token, {
        status: statusFilter,
        category: categoryFilter,
        search: searchQuery,
        limit: pageSize,
        offset: (page - 1) * pageSize,
        sortBy,
        sortOrder
      });
      if (res.success) {
        setOrders(res.orders);
        setTotalCount(res.total);
      }
    } catch (err) {
      console.error('Failed to fetch admin orders:', err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const handleOpenOrderDetails = async (orderId: string) => {
    setDetailLoading(true);
    try {
      const res = await getAdminOrderDetails(token, orderId);
      if (res.success && res.order) {
        setActiveOrder(res.order);
      }
    } catch (err) {
      console.error('Failed to get order details:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setStatusUpdating(true);
    try {
      const res = await updateOrderStatus(token, orderId, newStatus);
      if (res.success && res.order) {
        setActiveOrder(res.order);
        setOrders(prev => prev.map(o => o.order_id === orderId ? { ...o, status: newStatus } : o));
      }
    } catch (err) {
      console.error('Status update failed:', err);
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder || !newAdminNote.trim()) return;

    setNoteSaving(true);
    try {
      const res = await addAdminOrderNote(token, activeOrder.order_id, newAdminNote.trim());
      if (res.success && res.order) {
        setActiveOrder(res.order);
        setNewAdminNote('');
      }
    } catch (err) {
      console.error('Failed to add admin note:', err);
    } finally {
      setNoteSaving(false);
    }
  };

  const handleResendWhatsApp = async () => {
    if (!activeOrder) return;
    setResendingWa(true);
    try {
      const res = await resendWhatsAppNotification(token, activeOrder.order_id);
      if (res.success && res.order) {
        setActiveOrder(res.order);
        alert('WhatsApp notification re-triggered successfully.');
      }
    } catch (err: any) {
      alert('Failed to resend WhatsApp notification: ' + err.message);
    } finally {
      setResendingWa(false);
    }
  };

  const handleCopyForProvider = () => {
    if (!activeOrder) return;
    // Format optimized for easy pasting into external SMM providers
    const text = `Service: ${activeOrder.service_name} (#${activeOrder.service_id})\nTarget: ${activeOrder.target}\nQuantity: ${activeOrder.quantity}\nOrder ID: ${activeOrder.order_id}`;
    navigator.clipboard.writeText(text);
    setCopiedProviderFormat(true);
    setTimeout(() => setCopiedProviderFormat(false), 2000);
  };

  const handleBulkStatusUpdate = async () => {
    if (selectedOrderIds.length === 0) return;
    try {
      await bulkUpdateOrderStatus(token, selectedOrderIds, bulkStatus);
      setSelectedOrderIds([]);
      fetchOrders();
    } catch (err) {
      console.error('Bulk update failed:', err);
    }
  };

  const handleToggleSelectOrder = (id: string) => {
    setSelectedOrderIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrderIds.length === orders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(orders.map(o => o.order_id));
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">Pending</span>;
      case 'processing':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">Processing</span>;
      case 'completed':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Completed</span>;
      case 'cancelled':
      case 'refunded':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">Cancelled</span>;
      case 'partial':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">Partial</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-neutral-800 text-neutral-300">{status}</span>;
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="space-y-6">
      {/* Search and Filters Header */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                id="admin-orders-search-input"
                type="text"
                placeholder="Search by Order ID (AX-...), Txn ID, Target link, or Customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl transition-colors"
            >
              Search
            </button>
          </form>

          {/* Export to CSV Trigger */}
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <a
              href="/api/admin/export/orders.csv"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Export CSV</span>
            </a>
          </div>
        </div>

        {/* Status & Category Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-800/80">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
            {[
              { id: 'all', label: 'All Orders' },
              { id: 'pending', label: '⚡ Incoming Proceed Money' },
              { id: 'processing', label: 'Processing' },
              { id: 'completed', label: 'Completed' },
              { id: 'cancelled', label: 'Cancelled' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setStatusFilter(tab.id);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  statusFilter === tab.id
                    ? tab.id === 'pending'
                      ? 'bg-emerald-500 text-neutral-950 font-bold shadow-md shadow-emerald-500/20'
                      : 'bg-amber-500 text-neutral-950 shadow-sm'
                    : 'bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar (when selected) */}
      {selectedOrderIds.length > 0 && (
        <div className="p-3 bg-neutral-900 border border-amber-500/30 rounded-xl flex items-center justify-between gap-3 animate-fadeIn">
          <div className="text-xs font-semibold text-amber-400">
            {selectedOrderIds.length} orders selected
          </div>
          <div className="flex items-center gap-2">
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value as OrderStatus)}
              className="bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg px-2.5 py-1.5"
            >
              <option value="pending">Mark as Pending</option>
              <option value="processing">Mark as Processing</option>
              <option value="completed">Mark as Completed</option>
              <option value="cancelled">Mark as Cancelled</option>
            </select>
            <button
              onClick={handleBulkStatusUpdate}
              className="px-3 py-1.5 bg-amber-500 text-neutral-950 font-bold text-xs rounded-lg hover:bg-amber-400"
            >
              Apply Status
            </button>
          </div>
        </div>
      )}

      {/* Orders Data Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="text-[11px] uppercase tracking-wider text-neutral-500 border-b border-neutral-800 bg-neutral-950">
              <tr>
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={orders.length > 0 && selectedOrderIds.length === orders.length}
                    onChange={handleSelectAll}
                    className="rounded border-neutral-700 text-amber-500 focus:ring-0"
                  />
                </th>
                <th className="py-3 px-3">Order ID</th>
                <th className="py-3 px-3">Service</th>
                <th className="py-3 px-3">Target</th>
                <th className="py-3 px-3">Quantity</th>
                <th className="py-3 px-3">Amount</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Txn ID</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-neutral-400 font-sans">
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-neutral-500 font-sans">
                    No orders found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-neutral-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedOrderIds.includes(order.order_id)}
                        onChange={() => handleToggleSelectOrder(order.order_id)}
                        className="rounded border-neutral-700 text-amber-500 focus:ring-0"
                      />
                    </td>
                    <td className="py-3 px-3 font-bold text-amber-400">{order.order_id}</td>
                    <td className="py-3 px-3 font-sans max-w-[180px] truncate text-white">
                      {order.service_name} (#{order.service_id})
                    </td>
                    <td className="py-3 px-3 max-w-[140px] truncate text-neutral-300" title={order.target}>
                      {order.target}
                    </td>
                    <td className="py-3 px-3 text-neutral-200">{Number(order.quantity).toLocaleString()}</td>
                    <td className="py-3 px-3 font-bold text-emerald-400">₹{order.amount}</td>
                    <td className="py-3 px-3 font-sans">{getStatusBadge(order.status)}</td>
                    <td className="py-3 px-3 text-neutral-400 truncate max-w-[120px]" title={order.transaction_id}>
                      {order.transaction_id}
                    </td>
                    <td className="py-3 px-3 font-sans text-neutral-400 whitespace-nowrap">
                      {new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </td>
                    <td className="py-3 px-4 text-right font-sans">
                      <button
                        onClick={() => handleOpenOrderDetails(order.order_id)}
                        className="px-3 py-1.5 rounded-lg bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 hover:text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between text-xs text-neutral-400">
          <div>
            Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, totalCount)} of {totalCount} orders
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-white font-bold">{page} / {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* ORDER DETAILS MODAL / DRAWER */}
      {/* ======================================================== */}
      {activeOrder && (
        <div id="order-details-drawer" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-white my-8 max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setActiveOrder(null)}
              className="absolute top-5 right-5 p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
                <Eye className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-extrabold text-white font-mono">{activeOrder.order_id}</h3>
                  {getStatusBadge(activeOrder.status)}
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Placed on {new Date(activeOrder.created_at).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Quick SMM Provider Fulfillment Helper Box */}
            <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-amber-300 block">External Provider Fulfillment Helper</span>
                <span className="text-[11px] text-neutral-300">
                  Copy formatted target & quantity to fulfill manually on your external SMM panel.
                </span>
              </div>
              <button
                onClick={handleCopyForProvider}
                className="w-full sm:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                {copiedProviderFormat ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedProviderFormat ? 'Copied Details!' : 'Copy for Provider'}</span>
              </button>
            </div>

            {/* Main Order Details Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mb-6">
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-2.5">
                <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Service Information</div>
                <div>
                  <span className="text-neutral-500 block text-[10px] uppercase font-bold">Service Name:</span>
                  <div className="font-semibold text-white text-sm">{activeOrder.service_name}</div>
                </div>
                <div className="flex justify-between border-t border-neutral-900 pt-1.5">
                  <span className="text-neutral-400">Service ID:</span>
                  <span className="font-mono text-amber-400 font-bold">#{activeOrder.service_id}</span>
                </div>
                {activeOrder.service_description && (
                  <div className="border-t border-neutral-900 pt-1.5">
                    <span className="text-neutral-500 block text-[10px] uppercase font-bold">Service Description:</span>
                    <p className="text-neutral-300 text-[11px] leading-relaxed mt-0.5">{activeOrder.service_description}</p>
                  </div>
                )}
                <div className="flex justify-between border-t border-neutral-900 pt-1.5">
                  <span className="text-neutral-400">Quantity:</span>
                  <span className="font-bold text-white">{Number(activeOrder.quantity).toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-neutral-900 pt-1.5">
                  <span className="text-neutral-400">Total Amount:</span>
                  <span className="font-extrabold text-emerald-400 text-sm">₹{activeOrder.amount}</span>
                </div>
                <div className="flex justify-between border-t border-neutral-900 pt-1.5 text-[11px]">
                  <span className="text-neutral-500">Created:</span>
                  <span className="text-neutral-300 font-mono">{new Date(activeOrder.created_at).toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-neutral-900 pt-1.5 text-[11px]">
                  <span className="text-neutral-500">Last Updated:</span>
                  <span className="text-neutral-300 font-mono">{new Date(activeOrder.updated_at).toLocaleString()}</span>
                </div>
              </div>

              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-2.5">
                <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Payment & Customer Target</div>
                <div>
                  <span className="text-neutral-400 block font-semibold text-[11px]">Transaction ID (UTR):</span>
                  <div className="flex items-center gap-1 font-mono text-emerald-400 font-bold text-sm bg-neutral-900/80 px-2.5 py-1.5 rounded-lg border border-neutral-800 mt-1">
                    <span>{activeOrder.transaction_id}</span>
                  </div>
                </div>
                <div>
                  <span className="text-neutral-400 block font-semibold text-[11px]">Target / Account URL:</span>
                  <div className="flex items-center gap-1.5 font-mono text-amber-300 break-all bg-neutral-900/80 px-2.5 py-1.5 rounded-lg border border-neutral-800 mt-1">
                    <span>{activeOrder.target}</span>
                    {activeOrder.target.startsWith('http') && (
                      <a href={activeOrder.target} target="_blank" rel="noreferrer" className="text-amber-400 hover:underline flex-shrink-0">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
                {activeOrder.customer_contact && (
                  <div className="pt-1">
                    <span className="text-neutral-400 block font-semibold text-[11px]">Customer Contact (WhatsApp/Phone):</span>
                    <a
                      href={`https://wa.me/${activeOrder.customer_contact.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-400 hover:underline font-mono font-bold inline-flex items-center gap-1 mt-0.5"
                    >
                      <span>{activeOrder.customer_contact}</span>
                      <MessageCircle className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
                {activeOrder.customer_notes && (
                  <div className="pt-1">
                    <span className="text-neutral-400 block font-semibold text-[11px]">Customer Notes:</span>
                    <span className="text-neutral-300 italic bg-neutral-900/50 p-2 rounded-lg block mt-0.5">{activeOrder.customer_notes}</span>
                  </div>
                )}
                <div className="pt-1">
                  <span className="text-neutral-400 block font-semibold text-[11px]">Current Status:</span>
                  <div className="mt-1">{getStatusBadge(activeOrder.status)}</div>
                </div>
              </div>
            </div>

            {/* Status Switcher Bar */}
            <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl mb-6">
              <div className="text-xs font-bold text-neutral-300 mb-2">Update Order Status:</div>
              <div className="flex flex-wrap gap-2">
                {(['pending', 'processing', 'completed', 'cancelled', 'partial', 'refunded'] as OrderStatus[]).map((st) => (
                  <button
                    key={st}
                    disabled={statusUpdating || activeOrder.status === st}
                    onClick={() => handleStatusChange(activeOrder.order_id, st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                      activeOrder.status === st
                        ? 'bg-amber-500 text-neutral-950 shadow-md ring-2 ring-amber-400/50'
                        : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* WhatsApp Notification Status Card */}
            <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-white block">
                    WhatsApp Delivery: <span className="uppercase text-emerald-400 font-mono">{activeOrder.whatsapp_status}</span>
                  </span>
                  <span className="text-neutral-400">Recipient: +91 70339 94688</span>
                </div>
              </div>
              <button
                onClick={handleResendWhatsApp}
                disabled={resendingWa}
                className="w-full sm:w-auto px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resendingWa ? 'animate-spin' : ''}`} />
                <span>Resend Notification</span>
              </button>
            </div>

            {/* Internal Admin Notes Timeline */}
            <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-4">
              <div className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                Internal Admin Notes ({activeOrder.notes?.length || 0})
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {(!activeOrder.notes || activeOrder.notes.length === 0) ? (
                  <p className="text-neutral-500 text-xs italic">No internal notes added yet.</p>
                ) : (
                  activeOrder.notes.map((note) => (
                    <div key={note.id} className="p-2.5 bg-neutral-900 rounded-xl text-xs space-y-1">
                      <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                        <span className="font-bold text-amber-400">{note.author}</span>
                        <span>{new Date(note.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-neutral-200">{note.content}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Note Input */}
              <form onSubmit={handleAddNote} className="flex gap-2 pt-2 border-t border-neutral-800">
                <input
                  type="text"
                  placeholder="Add note (e.g. Sent to SMM panel with task #123)..."
                  value={newAdminNote}
                  onChange={(e) => setNewAdminNote(e.target.value)}
                  className="flex-1 px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  disabled={noteSaving || !newAdminNote.trim()}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl transition-colors disabled:opacity-50"
                >
                  Add Note
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
