import React, { useState, useEffect } from 'react';
import { X, Search, Loader2, Clock, CheckCircle2, AlertCircle, RefreshCw, MessageSquare, ExternalLink } from 'lucide-react';
import { trackCustomerOrder } from '../lib/api';
import { OrderStatus } from '../types';

interface TrackOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrderId?: string;
}

export const TrackOrderModal: React.FC<TrackOrderModalProps> = ({
  isOpen,
  onClose,
  initialOrderId = ''
}) => {
  const [orderIdInput, setOrderIdInput] = useState(initialOrderId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<any | null>(null);

  useEffect(() => {
    if (initialOrderId && isOpen) {
      setOrderIdInput(initialOrderId);
      handleSearch(initialOrderId);
    }
  }, [initialOrderId, isOpen]);

  if (!isOpen) return null;

  const handleSearch = async (idToSearch?: string) => {
    const id = (idToSearch || orderIdInput).trim();
    if (!id) {
      setError('Please enter a valid Order ID.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await trackCustomerOrder(id);
      if (res.success && res.order) {
        setOrderData(res.order);
      } else {
        setError(res.error || 'Order not found.');
        setOrderData(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to find order.');
      setOrderData(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Pending Verification
          </span>
        );
      case 'processing':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            In Processing
          </span>
        );
      case 'completed':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Completed
          </span>
        );
      case 'cancelled':
      case 'refunded':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            Cancelled / Refunded
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-neutral-800 text-neutral-300">
            {status}
          </span>
        );
    }
  };

  const renderTimeline = (status: OrderStatus) => {
    const steps = [
      { key: 'received', title: 'Order Submitted', desc: 'Received & Saved in DB' },
      { key: 'pending', title: 'Payment Verification', desc: 'Owner verifying Transaction ID' },
      { key: 'processing', title: 'Provider Delivery', desc: 'Fulfilling on SMM Network' },
      { key: 'completed', title: 'Order Completed', desc: 'Service Delivered Successfully' }
    ];

    let activeIndex = 0;
    if (status === 'pending') activeIndex = 1;
    if (status === 'processing') activeIndex = 2;
    if (status === 'completed') activeIndex = 3;

    return (
      <div className="py-4">
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-800">
          {steps.map((step, idx) => {
            const isDone = idx <= activeIndex;
            const isCurrent = idx === activeIndex;

            return (
              <div key={step.key} className="relative flex items-start gap-3">
                <div
                  className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    isDone
                      ? 'bg-emerald-500 text-neutral-950 ring-4 ring-emerald-500/20'
                      : 'bg-neutral-800 text-neutral-500'
                  }`}
                >
                  {isDone ? '✓' : idx + 1}
                </div>
                <div>
                  <div className={`text-sm font-semibold ${isCurrent ? 'text-emerald-400' : isDone ? 'text-white' : 'text-neutral-500'}`}>
                    {step.title}
                  </div>
                  <div className="text-xs text-neutral-400">{step.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div id="track-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl text-white my-8">
        <button
          id="track-modal-close"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Track Your SMM Order</h3>
            <p className="text-xs text-neutral-400">Real-time status tracking by Order ID</p>
          </div>
        </div>

        {/* Search Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex gap-2 mb-6"
        >
          <input
            id="track-order-input"
            type="text"
            placeholder="e.g. AX-20260827-482731"
            value={orderIdInput}
            onChange={(e) => setOrderIdInput(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white font-mono text-sm placeholder-neutral-500 focus:outline-none focus:border-amber-500 uppercase"
          />
          <button
            id="track-order-search-btn"
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-sm flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Track</span>
          </button>
        </form>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Order Details View */}
        {orderData && (
          <div className="space-y-5 animate-fadeIn">
            <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-sm font-bold text-amber-400">{orderData.order_id}</span>
                {getStatusBadge(orderData.status)}
              </div>

              <div className="text-sm font-semibold text-white mb-1">{orderData.service_name}</div>
              <div className="text-xs text-neutral-400 mb-3">Target: <span className="font-mono text-neutral-200">{orderData.target}</span></div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-neutral-800/80">
                <div>
                  <span className="text-neutral-500 block">Quantity</span>
                  <span className="font-medium text-white">{Number(orderData.quantity).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Total Amount</span>
                  <span className="font-bold text-emerald-400">₹{orderData.amount}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Order Date</span>
                  <span className="text-neutral-300">
                    {new Date(orderData.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Transaction Reference</span>
                  <span className="font-mono text-neutral-300 truncate">{orderData.transaction_id}</span>
                </div>
              </div>
            </div>

            {/* Visual Timeline */}
            <div className="p-4 bg-neutral-950/60 border border-neutral-800 rounded-xl">
              <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Order Progression
              </div>
              {renderTimeline(orderData.status)}
            </div>

            {/* Support Trigger */}
            <div className="p-3 rounded-xl bg-neutral-950/40 border border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
              <span>Have an urgent question regarding this order?</span>
              <a
                href={`https://wa.me/917033994688?text=${encodeURIComponent(`Hi ayushXsisi, I need support for my order: ${orderData.order_id}`)}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 font-semibold flex items-center gap-1.5 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp Owner</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
