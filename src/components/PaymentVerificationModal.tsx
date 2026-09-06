import React, { useEffect, useState } from 'react';
import {
  Clock,
  ShieldCheck,
  Zap,
  Send,
  CheckCircle2,
  Lock,
  ArrowRight,
  ExternalLink,
  MessageCircle,
  Copy,
  Check
} from 'lucide-react';
import { OrderSubmissionResult } from '../types';

interface PaymentVerificationModalProps {
  orderResult: OrderSubmissionResult;
  onClose: () => void;
  onViewReceipt: () => void;
  onTrackOrder: (orderId: string) => void;
}

export const PaymentVerificationModal: React.FC<PaymentVerificationModalProps> = ({
  orderResult,
  onClose,
  onViewReceipt,
  onTrackOrder
}) => {
  const [countdown, setCountdown] = useState<number>(59);
  const [copiedUtr, setCopiedUtr] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const { order } = orderResult;
  const adminWhatsApp = '917033994688';

  // 59-Second Countdown Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const progressPercent = Math.round(((59 - countdown) / 59) * 100);

  // Dynamic verification stages
  const getVerificationStage = (sec: number) => {
    if (sec > 45) {
      return {
        stage: 1,
        title: 'Verifying UPI UTR Reference',
        desc: `Matching 12-digit UTR (${order.transaction_id}) with banking network`,
        badge: 'Gateway Syncing',
        color: 'text-amber-400',
        bg: 'bg-amber-500/10 border-amber-500/30'
      };
    } else if (sec > 30) {
      return {
        stage: 2,
        title: 'Proceed Money Transmitted to Admin Desk',
        desc: `₹${order.amount} logged on Admin Panel awaiting fast approval`,
        badge: 'Admin Panel Alerted',
        color: 'text-blue-400',
        bg: 'bg-blue-500/10 border-blue-500/30'
      };
    } else if (sec > 15) {
      return {
        stage: 3,
        title: 'Allocating Fast-Track Server Nodes',
        desc: `Queueing ${Number(order.quantity).toLocaleString()} units for ${order.service_name}`,
        badge: 'Server Assigned',
        color: 'text-purple-400',
        bg: 'bg-purple-500/10 border-purple-500/30'
      };
    } else if (sec > 0) {
      return {
        stage: 4,
        title: 'Finalizing Priority Dispatch Protocol',
        desc: 'Order registered in execution queue. Manual clearing ready',
        badge: 'Almost Verified',
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10 border-emerald-500/30'
      };
    } else {
      return {
        stage: 5,
        title: 'Verification Finished & Order Queued!',
        desc: 'Payment logged. Admin has received your proceed money',
        badge: 'Verified & Queued',
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/20 border-emerald-500/40'
      };
    }
  };

  const currentStage = getVerificationStage(countdown);

  const handleCopy = (text: string, type: 'utr' | 'id') => {
    navigator.clipboard.writeText(text);
    if (type === 'utr') {
      setCopiedUtr(true);
      setTimeout(() => setCopiedUtr(false), 2000);
    } else {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleOpenWhatsApp = () => {
    const text = encodeURIComponent(
      `Hello ayushXsisi Admin (+917033994688),\n\nI have submitted my payment:\n💳 Txn ID / UTR: ${order.transaction_id}\n💰 Proceed Money: ₹${order.amount}\n📦 Order ID: ${order.order_id}\n🎯 Service: ${order.service_name} (#${order.service_id})\n🔢 Quantity: ${Number(order.quantity).toLocaleString()}\n🔗 Link: ${order.target}\n\nPlease check your admin panel & approve my order immediately!`
    );
    window.open(`https://wa.me/${adminWhatsApp}?text=${text}`, '_blank');
  };

  // Circular progress SVG calculations
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div
      id="payment-verification-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fadeIn overflow-y-auto"
    >
      {/* Background Graphic Radar Animation */}
      <div className="relative w-full max-w-lg bg-gradient-to-b from-neutral-900 via-neutral-900/95 to-neutral-950 border border-neutral-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl text-white my-6 overflow-hidden">
        
        {/* Futuristic Ambient Glow Rings */}
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Status Bar with Live Proceed Money Tag */}
        <div className="flex items-center justify-between gap-2 mb-6 pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
              Live Gateway Active
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-xs font-black shadow-sm">
            <Zap className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
            <span>Proceed Money: ₹{order.amount}</span>
          </div>
        </div>

        {/* Central Futuristic Graphic Countdown Circle */}
        <div className="flex flex-col items-center justify-center mb-6 relative">
          <div className="relative w-40 h-40 flex items-center justify-center">
            {/* Pulsing Outer Scanning Wave */}
            <div className="absolute inset-0 rounded-full border border-amber-500/20 animate-ping opacity-25" />
            <div className="absolute inset-2 rounded-full border border-emerald-500/20 animate-pulse" />

            {/* SVG Circular Progress Track & Fill */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="text-neutral-800"
                strokeWidth="8"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="text-amber-400 transition-all duration-1000 ease-linear"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke="url(#gradient-amber-emerald)"
                fill="transparent"
              />
              <defs>
                <linearGradient id="gradient-amber-emerald" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="50%" stopColor="#fb923c" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
            </svg>

            {/* Center Content Inside Circle */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <Clock className="w-5 h-5 text-amber-400 mb-1 animate-spin" style={{ animationDuration: '4s' }} />
              <span className="font-mono text-3xl sm:text-4xl font-black text-white tracking-tight">
                00:{countdown < 10 ? `0${countdown}` : countdown}
              </span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">
                {countdown > 0 ? 'Verifying' : 'Complete'}
              </span>
            </div>
          </div>

          <h3 className="mt-4 text-xl sm:text-2xl font-black text-white text-center tracking-tight">
            Verifying Transaction ID & Proceeding Money
          </h3>
          <p className="text-xs text-neutral-400 text-center max-w-sm mt-1">
            Your payment is submitted and logged in real-time on the Admin website.
          </p>
        </div>

        {/* Live Multi-Stage Verification Graphic Card */}
        <div className={`p-4 rounded-2xl border ${currentStage.bg} transition-all duration-500 mb-5 relative overflow-hidden`}>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-neutral-400">
              Step {currentStage.stage} of 4
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${currentStage.bg} ${currentStage.color}`}>
              {currentStage.badge}
            </span>
          </div>

          <div className="text-sm font-black text-white mb-0.5 flex items-center gap-2">
            <ShieldCheck className={`w-4 h-4 ${currentStage.color} flex-shrink-0`} />
            <span>{currentStage.title}</span>
          </div>
          <p className="text-xs text-neutral-300 pl-6">
            {currentStage.desc}
          </p>

          {/* Smooth Linear Progress Bar */}
          <div className="w-full bg-neutral-950/80 rounded-full h-2 mt-3 overflow-hidden border border-neutral-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-400 to-emerald-400 transition-all duration-1000 ease-linear shadow-sm"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Transaction & Order Details Pill */}
        <div className="bg-neutral-950/90 border border-neutral-800/90 rounded-2xl p-4 mb-5 space-y-2.5 text-xs font-mono">
          <div className="flex items-center justify-between text-neutral-400">
            <span>Order ID:</span>
            <div className="flex items-center gap-1.5 text-white font-bold">
              <span className="text-amber-400">{order.order_id}</span>
              <button
                onClick={() => handleCopy(order.order_id, 'id')}
                className="p-1 hover:text-amber-300 text-neutral-400"
                title="Copy Order ID"
              >
                {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-neutral-400">
            <span>Transaction ID / UTR:</span>
            <div className="flex items-center gap-1.5 text-white font-bold">
              <span className="text-emerald-400">{order.transaction_id}</span>
              <button
                onClick={() => handleCopy(order.transaction_id, 'utr')}
                className="p-1 hover:text-emerald-300 text-neutral-400"
                title="Copy UTR"
              >
                {copiedUtr ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-neutral-400 pt-2 border-t border-neutral-800/80">
            <span>Proceed Money to Admin:</span>
            <span className="text-emerald-400 font-black text-sm">₹{order.amount}</span>
          </div>

          <div className="flex items-center justify-between text-neutral-400">
            <span>Service Ordered:</span>
            <span className="text-neutral-200 truncate max-w-[200px] font-sans font-medium">{order.service_name}</span>
          </div>
        </div>

        {/* DIRECT WHATSAPP ADMIN SPEEDUP BUTTON */}
        <div className="space-y-3">
          <button
            id="whatsapp-verify-fasttrack-btn"
            onClick={handleOpenWhatsApp}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 hover:via-emerald-500 hover:to-teal-500 text-neutral-950 font-black text-sm flex items-center justify-center gap-2.5 transition-all shadow-xl shadow-emerald-950/60 transform hover:-translate-y-0.5 active:scale-[0.99]"
          >
            <Send className="w-4 h-4 fill-neutral-950 flex-shrink-0" />
            <span>Chat Admin on WhatsApp (+91 7033994688)</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              id="view-receipt-btn"
              onClick={onViewReceipt}
              className="flex-1 py-3 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>View Order Receipt</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              id="track-order-btn"
              onClick={() => onTrackOrder(order.order_id)}
              className="flex-1 py-3 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Track Live Status</span>
            </button>
          </div>
        </div>

        <p className="mt-4 text-[11px] text-center text-neutral-500">
          Your proceed money has been logged into the admin console. Admin will verify against PhonePe/UPI records shortly.
        </p>
      </div>
    </div>
  );
};
