import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Copy,
  Check,
  Send,
  ArrowRight,
  ShieldCheck,
  Clock,
  ExternalLink,
  Loader2,
  Sparkles,
  MessageCircle,
  Radio,
  Zap
} from 'lucide-react';
import { OrderSubmissionResult } from '../types';

interface OrderSuccessModalProps {
  orderResult: OrderSubmissionResult | null;
  onClose: () => void;
  onTrackOrder: (orderId: string) => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  orderResult,
  onClose,
  onTrackOrder
}) => {
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState<number>(59);
  const [countdownActive, setCountdownActive] = useState<boolean>(true);

  useEffect(() => {
    if (orderResult) {
      // Reset countdown to 59 seconds upon opening
      setCountdown(59);
      setCountdownActive(true);

      // Trigger celebratory confetti blast
      try {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 }
        });
      } catch {}
    }
  }, [orderResult]);

  // 59-Second Fetching Countdown Timer
  useEffect(() => {
    if (!orderResult || !countdownActive || countdown <= 0) return;

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
  }, [orderResult, countdownActive, countdown]);

  if (!orderResult) return null;

  const { order } = orderResult;
  const adminWhatsAppNumber = '917033994688';

  const handleCopyOrderId = () => {
    navigator.clipboard.writeText(order.order_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsAppChat = () => {
    const text = encodeURIComponent(
      `Hello ayushXsisi Admin (+917033994688),\n\nI have completed my payment for:\n📦 Order ID: ${order.order_id}\n🎯 Service: ${order.service_name} (#${order.service_id})\n🔢 Quantity: ${Number(order.quantity).toLocaleString()}\n🔗 Link/Target: ${order.target}\n💰 Amount Paid: ₹${order.amount}\n💳 UTR / Txn ID: ${order.transaction_id}\n\nPlease verify my payment & fast-track order processing!`
    );
    window.open(`https://wa.me/${adminWhatsAppNumber}?text=${text}`, '_blank');
  };

  // Dynamic verification step message based on countdown
  const getVerificationStep = (secs: number) => {
    if (secs > 45) {
      return {
        title: 'Fetching Bank & UPI Verification Node...',
        desc: 'Checking 12-digit UTR against banking records',
        step: 1
      };
    } else if (secs > 30) {
      return {
        title: 'Dispatching Real-Time Alert to WhatsApp (+917033994688)...',
        desc: 'Notifying admin team directly for priority queueing',
        step: 2
      };
    } else if (secs > 15) {
      return {
        title: 'Registering Order in ayushXsisi Secure Ledger...',
        desc: 'Allocating delivery nodes and non-drop server pools',
        step: 3
      };
    } else if (secs > 0) {
      return {
        title: 'Finalizing Auto-Sync with Fulfillment Engine...',
        desc: 'Preparing initial delivery batch',
        step: 4
      };
    } else {
      return {
        title: 'Verified & Confirmed in Priority Queue!',
        desc: 'Your order is active and scheduled for processing',
        step: 5
      };
    }
  };

  const currentStep = getVerificationStep(countdown);
  const progressPercent = Math.round(((59 - countdown) / 59) * 100);

  return (
    <div id="order-success-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-white my-8">
        
        {/* Success Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3 text-emerald-400">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Payment Submitted & Registered</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Order Received</h2>
          <p className="mt-1 text-xs sm:text-sm text-neutral-400">
            Your payment is being verified and queued for fast delivery.
          </p>
        </div>

        {/* 59-SECOND FETCHING & VERIFICATION COUNTDOWN CARD */}
        <div className="p-4 sm:p-5 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 border border-amber-500/40 rounded-2xl mb-6 shadow-xl relative overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                {countdown > 0 ? 'Live Payment Verification Fetching' : 'Verification Complete'}
              </span>
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/30 font-mono font-extrabold text-amber-300 text-sm flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>00:{countdown < 10 ? `0${countdown}` : countdown}s</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden mb-3 border border-neutral-700">
            <div
              className="bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 h-full rounded-full transition-all duration-1000 ease-linear shadow-sm shadow-amber-500/50"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Dynamic Status Text */}
          <div className="flex items-start gap-2.5 text-left">
            {countdown > 0 ? (
              <Loader2 className="w-4 h-4 text-amber-400 animate-spin flex-shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-xs font-bold text-white leading-tight">{currentStep.title}</p>
              <p className="text-[11px] text-neutral-400 mt-0.5">{currentStep.desc}</p>
            </div>
          </div>
        </div>

        {/* PROMINENT DIRECT WHATSAPP ADMIN CHAT BUTTON */}
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-emerald-900/40 to-neutral-950 border-2 border-emerald-500/50 shadow-xl shadow-emerald-950/40">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-neutral-950 flex items-center justify-center font-bold">
                <MessageCircle className="w-5 h-5 fill-current" />
              </div>
              <div>
                <span className="text-xs font-black text-white block">Direct Admin Support</span>
                <span className="text-[11px] text-emerald-400 font-mono font-bold">+91 70339 94688</span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Admin Online
            </span>
          </div>

          <p className="text-xs text-neutral-300 mb-3 leading-relaxed">
            Click below to chat directly with admin on WhatsApp (<span className="font-mono text-emerald-400 font-bold">+917033994688</span>) with your order ID & payment details preloaded.
          </p>

          <button
            id="chat-whatsapp-admin-btn"
            onClick={handleOpenWhatsAppChat}
            className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black rounded-xl text-sm flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transform active:scale-[0.99]"
          >
            <Send className="w-4 h-4 fill-neutral-950" />
            <span>Chat Directly with Admin on WhatsApp (+917033994688)</span>
          </button>
        </div>

        {/* Order ID Spotlight Box */}
        <div className="p-4 bg-gradient-to-br from-neutral-950 to-neutral-900 border border-neutral-800 rounded-2xl mb-6 shadow-inner text-center">
          <div className="text-xs uppercase tracking-widest font-semibold text-neutral-400 mb-1">
            Your Unique Order ID
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="font-mono text-xl sm:text-2xl font-extrabold text-amber-400 tracking-wider">
              {order.order_id}
            </span>
            <button
              id="copy-order-id-btn"
              onClick={handleCopyOrderId}
              className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
              title="Copy Order ID"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          {copied && <span className="text-xs text-emerald-400 font-medium mt-1 inline-block">Copied to clipboard!</span>}
        </div>

        {/* Order Details Breakdown Card */}
        <div className="p-4 bg-neutral-950/80 border border-neutral-800 rounded-2xl mb-6 text-xs sm:text-sm space-y-2.5">
          <div className="flex justify-between pb-2 border-b border-neutral-800">
            <span className="text-neutral-400">Service:</span>
            <span className="text-white font-semibold text-right max-w-[65%] truncate">
              {order.service_name} (#{order.service_id})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Target / Link:</span>
            <span className="text-neutral-200 font-mono text-right max-w-[65%] truncate" title={order.target}>
              {order.target}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Quantity:</span>
            <span className="text-white font-medium">{Number(order.quantity).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Amount Paid:</span>
            <span className="text-emerald-400 font-bold">₹{order.amount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Transaction ID:</span>
            <span className="font-mono text-neutral-300 font-semibold">{order.transaction_id}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-neutral-800">
            <span className="text-neutral-400">Initial Status:</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="w-3 h-3" />
              Pending Verification
            </span>
          </div>
        </div>

        {/* Secondary Action Buttons */}
        <div className="space-y-2.5">
          <button
            id="track-this-order-btn"
            onClick={() => {
              onClose();
              onTrackOrder(order.order_id);
            }}
            className="w-full py-3 px-4 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors border border-neutral-700"
          >
            <span>Track Live Order Progress</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            id="modal-close-home-btn"
            onClick={onClose}
            className="w-full py-2.5 text-neutral-400 hover:text-white text-xs font-medium text-center transition-colors"
          >
            Return to Homepage / Place Another Order
          </button>
        </div>
      </div>
    </div>
  );
};
