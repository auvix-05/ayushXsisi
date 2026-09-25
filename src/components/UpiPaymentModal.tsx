import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  MessageCircle,
  Send,
  Clock,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { PhonePeQrCard } from './PhonePeQrCard';

interface UpiPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  upiId: string;
  merchantName: string;
  amount?: number;
  orderId?: string;
}

export const UpiPaymentModal: React.FC<UpiPaymentModalProps> = ({
  isOpen,
  onClose,
  upiId = '7033994688-4@ybl',
  merchantName = '| Ayush',
  amount,
  orderId
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(59);

  useEffect(() => {
    if (!isOpen) {
      setIsVerifying(false);
      setCountdown(59);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isVerifying || countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isVerifying, countdown]);

  if (!isOpen) return null;

  const handleOpenWhatsAppAdmin = () => {
    const text = encodeURIComponent(
      `Hello ayushXsisi Admin (+917033994688),\n\nI am making a payment of ${amount ? `₹${amount}` : 'my order'} via UPI (${upiId}).\n${orderId ? `Order Reference: ${orderId}\n` : ''}Please assist me or verify my payment receipt screenshot.`
    );
    window.open(`https://wa.me/917033994688?text=${text}`, '_blank');
  };

  const startVerificationTimer = () => {
    setIsVerifying(true);
    setCountdown(59);
  };

  return (
    <div id="upi-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div id="upi-modal-content" className="relative w-full max-w-md bg-neutral-900/95 border border-neutral-800 rounded-3xl p-6 sm:p-7 shadow-2xl text-white my-6">
        {/* Close Button */}
        <button
          id="upi-modal-close"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Official PhonePe / UPI Payment Card */}
        <PhonePeQrCard
          amount={amount}
          orderId={orderId}
          upiId={upiId}
          payeeName={merchantName || 'Shilpi Devi'}
          className="bg-neutral-950 border-neutral-800"
        />

        {/* 59-Second Fetching Verification Section */}
        {isVerifying ? (
          <div className="mt-4 p-4 bg-neutral-950 border border-amber-500/40 rounded-2xl space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </span>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  {countdown > 0 ? 'Fetching Payment Gateway...' : 'Fetching Complete'}
                </span>
              </div>
              <span className="font-mono text-xs font-black text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded">
                00:{countdown < 10 ? `0${countdown}` : countdown}s
              </span>
            </div>

            <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${Math.round(((59 - countdown) / 59) * 100)}%` }}
              />
            </div>

            <p className="text-[11px] text-neutral-300">
              {countdown > 0
                ? 'Please copy your 12-digit UTR from your bank app receipt and paste it into the order form below.'
                : 'Enter your 12-digit UTR / Txn ID in the order form to finish submission!'}
            </p>
          </div>
        ) : null}

        {/* DIRECT WHATSAPP ADMIN BUTTON (+917033994688) */}
        <div className="mt-4 p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-emerald-400 flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4" />
              Direct WhatsApp Support
            </span>
            <span className="font-mono text-[11px] text-emerald-300 font-semibold">+917033994688</span>
          </div>

          <button
            type="button"
            onClick={handleOpenWhatsAppAdmin}
            className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-900/30"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Chat Directly with Admin (+917033994688)</span>
          </button>
        </div>

        {/* Security & Verification Guidelines */}
        <div className="mt-3 p-3 bg-neutral-950/80 border border-neutral-800/80 rounded-2xl space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>How to complete order:</span>
          </div>
          <p className="text-[11px] text-neutral-400 leading-relaxed">
            1. Scan QR & pay on PhonePe, GPay, Paytm, or BHIM.<br/>
            2. Copy <b>12-digit UTR / Reference ID</b> from bank receipt.<br/>
            3. Paste into the order form and click Submit.
          </p>
        </div>

        {/* Bottom CTAs */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {!isVerifying && (
            <button
              type="button"
              onClick={startVerificationTimer}
              className="py-3 bg-neutral-800 hover:bg-neutral-700 text-amber-400 border border-neutral-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>59s Live Verify</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className={`py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-lg shadow-amber-500/20 ${
              !isVerifying ? 'sm:col-span-1' : 'w-full sm:col-span-2'
            }`}
          >
            I Have Paid • Enter UTR
          </button>
        </div>
      </div>
    </div>
  );
};
