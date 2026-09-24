import React, { useState, useEffect, useRef } from 'react';
import { Copy, Check, Download, QrCode, ShieldCheck, Sparkles, ExternalLink, Maximize2 } from 'lucide-react';
import QRCode from 'qrcode';

interface PhonePeQrCardProps {
  amount?: number;
  orderId?: string;
  upiId?: string;
  payeeName?: string;
  compact?: boolean;
  className?: string;
  showPayeeInfo?: boolean;
}

export const PhonePeQrCard: React.FC<PhonePeQrCardProps> = ({
  amount,
  orderId,
  upiId = '7033994688-4@ybl',
  payeeName = '|Ayush ',
  compact = false,
  className = '',
  showPayeeInfo = true
}) => {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isEnlarged, setIsEnlarged] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Construct UPI string for PhonePe / UPI apps
  const note = orderId ? `Order ${orderId} ayushXsisi` : 'ayushXsisi SMM Service';
  const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}${amount && amount > 0 ? `&am=${amount}` : ''}&cu=INR&tn=${encodeURIComponent(note)}`;

  useEffect(() => {
    // Generate high-resolution QR with PhonePe center logo overlay
    QRCode.toDataURL(upiUrl, {
      width: compact ? 260 : 360,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H' // High error correction to allow center logo placement
    }).then(url => {
      setQrDataUrl(url);
    }).catch(err => {
      console.error('Failed to generate QR code:', err);
    });
  }, [upiUrl, compact]);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `PhonePe-QR-${payeeName.replace(/\s+/g, '-')}-${amount ? `${amount}INR` : 'ayushXsisi'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div
        className={`relative overflow-hidden rounded-2xl bg-neutral-950 border border-neutral-800 text-white shadow-2xl transition-all duration-300 ${
          compact ? 'p-4' : 'p-6 sm:p-7'
        } ${className}`}
      >
        {/* Ambient PhonePe purple backdrop glow */}
        <div className="absolute -top-10 -right-10 w-36 h-36 bg-purple-600/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-indigo-600/15 rounded-full blur-2xl pointer-events-none" />

        {/* 1. PhonePe Official Brand Header */}
        <div className="flex flex-col items-center text-center mb-3">
          <div className="flex items-center justify-center gap-2 mb-1.5">
            {/* PhonePe Purple Circle Badge */}
            <div className="w-8 h-8 rounded-full bg-[#5f259f] flex items-center justify-center shadow-lg shadow-purple-900/40 border border-purple-400/30 text-white font-extrabold text-sm select-none">
              पे
            </div>
            <span className="text-lg sm:text-xl font-black tracking-tight text-white">
              PhonePe
            </span>
          </div>

          {/* ACCEPTED HERE Tag */}
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-950/80 border border-purple-500/40 text-[10px] sm:text-[11px] font-extrabold tracking-wider text-purple-300 uppercase shadow-inner">
            <Sparkles className="w-2.5 h-2.5 text-purple-400" />
            <span>ACCEPTED HERE</span>
          </div>

          <p className="text-[11px] text-neutral-400 mt-1.5 font-medium">
            Scan & Pay Using PhonePe or Any UPI App
          </p>
        </div>

        {/* Dynamic Amount Banner if specified */}
        {amount !== undefined && amount > 0 && (
          <div className="mb-3.5 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-950/60 via-neutral-900 to-purple-950/60 border border-purple-500/30 flex items-center justify-between text-xs">
            <span className="text-neutral-400">Total Payable:</span>
            <span className="text-base font-black text-emerald-400">₹{amount.toLocaleString()}</span>
          </div>
        )}

        {/* 2. QR Code Box with PhonePe center icon */}
        <div className="relative mx-auto flex flex-col items-center justify-center">
          <div
            onClick={() => setIsEnlarged(true)}
            className="group relative p-2.5 sm:p-3 bg-white rounded-2xl shadow-xl hover:shadow-purple-500/20 transition-all duration-200 cursor-pointer"
            title="Click to view full screen"
          >
            {qrDataUrl ? (
              <div className="relative">
                <img
                  src={qrDataUrl}
                  alt={`PhonePe QR Code for ${payeeName}`}
                  className={`${compact ? 'w-40 h-40' : 'w-48 h-48 sm:w-52 sm:h-52'} rounded-xl object-contain block`}
                />
                {/* Center PhonePe Icon */}
                <div className="absolute inset-0 m-auto w-9 h-9 rounded-full bg-[#5f259f] border-2 border-white flex items-center justify-center shadow-md pointer-events-none">
                  <span className="text-white font-extrabold text-xs">पे</span>
                </div>
              </div>
            ) : (
              <div className={`${compact ? 'w-40 h-40' : 'w-48 h-48 sm:w-52 sm:h-52'} flex items-center justify-center bg-neutral-100 rounded-xl`}>
                <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* Hover overlay hint */}
            <div className="absolute inset-0 bg-neutral-950/40 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1">
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Tap to Enlarge</span>
            </div>
          </div>
        </div>

        {/* 3. Payee Details & Verified Merchant */}
        {showPayeeInfo && (
          <div className="mt-3.5 text-center space-y-1">
            <h4 className="text-sm sm:text-base font-bold text-white tracking-wide">
              {payeeName}
            </h4>
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-400">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Jio Payments Bank • Ending 4594</span>
            </div>
          </div>
        )}

        {/* 4. Interactive Copy & Action Bar */}
        <div className="mt-4 pt-3.5 border-t border-neutral-800/80 space-y-2">
          {/* UPI ID Pill with Copy */}
          <div className="flex items-center justify-between p-2 sm:p-2.5 bg-neutral-900/90 border border-neutral-800 rounded-xl">
            <div className="flex flex-col text-left pl-1 truncate">
              <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-bold">UPI VPA</span>
              <span className="font-mono text-xs font-bold text-amber-400 truncate">{upiId}</span>
            </div>
            <button
              type="button"
              onClick={handleCopyUpi}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-white transition-colors flex-shrink-0"
              title="Copy UPI ID to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400 font-bold text-[11px]">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-neutral-400" />
                  <span className="text-[11px]">Copy ID</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center justify-between gap-2 pt-1 text-[11px]">
            <button
              type="button"
              onClick={handleDownloadQr}
              className="flex-1 py-1.5 px-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-neutral-300 hover:text-white transition-colors flex items-center justify-center gap-1"
            >
              <Download className="w-3 h-3 text-purple-400" />
              <span>Save QR</span>
            </button>

            <a
              href={upiUrl}
              className="flex-1 py-1.5 px-2 bg-purple-900/30 hover:bg-purple-900/50 border border-purple-700/40 rounded-lg text-purple-300 hover:text-purple-200 transition-colors flex items-center justify-center gap-1 font-semibold"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Pay with App</span>
            </a>
          </div>
        </div>
      </div>

      {/* Enlarged Modal for scanning directly */}
      {isEnlarged && (
        <div
          onClick={() => setIsEnlarged(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-sm w-full bg-neutral-950 border border-neutral-800 rounded-3xl p-6 sm:p-8 text-center text-white shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-center gap-2">
              <div className="w-9 h-9 rounded-full bg-[#5f259f] flex items-center justify-center text-white font-black text-base shadow-lg">
                पे
              </div>
              <span className="text-2xl font-black text-white">PhonePe</span>
            </div>

            <div className="inline-block px-3 py-1 rounded-full bg-purple-950 border border-purple-500/40 text-xs font-bold text-purple-300">
              ACCEPTED HERE
            </div>

            <p className="text-xs text-neutral-400">Scan & Pay Using Any UPI App</p>

            <div className="p-4 bg-white rounded-2xl inline-block shadow-2xl relative">
              <img
                src={qrDataUrl}
                alt="PhonePe QR Code Full"
                className="w-64 h-64 rounded-xl object-contain block mx-auto"
              />
              <div className="absolute inset-0 m-auto w-11 h-11 rounded-full bg-[#5f259f] border-2 border-white flex items-center justify-center shadow-lg pointer-events-none">
                <span className="text-white font-extrabold text-sm">पे</span>
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-white">{payeeName}</h3>
              <p className="text-xs text-neutral-400">Jio Payments Bank (4594)</p>
              {amount !== undefined && amount > 0 && (
                <div className="pt-2 text-xl font-black text-emerald-400">
                  ₹{amount.toLocaleString()}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleCopyUpi}
                className="flex-1 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied VPA' : 'Copy VPA'}</span>
              </button>
              <button
                onClick={() => setIsEnlarged(false)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-xs font-bold text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
