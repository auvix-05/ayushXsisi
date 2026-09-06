import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Search,
  Check,
  QrCode,
  Copy,
  AlertCircle,
  Loader2,
  Info,
  Layers,
  Link as LinkIcon,
  Send,
  RefreshCw,
  Zap,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  CheckCircle2
} from 'lucide-react';
import { Category, Service, CreateOrderPayload, OrderSubmissionResult } from '../types';
import { getCaptchaChallenge, submitCustomerOrder } from '../lib/api';
import { PhonePeQrCard } from './PhonePeQrCard';

interface OrderFormProps {
  categories: Category[];
  services: Service[];
  selectedServiceId?: number | null;
  onSelectServiceId: (id: number) => void;
  upiId: string;
  merchantName: string;
  onOrderSuccess: (result: OrderSubmissionResult) => void;
}

export const OrderForm: React.FC<OrderFormProps> = ({
  categories,
  services,
  selectedServiceId,
  onSelectServiceId,
  upiId,
  merchantName,
  onOrderSuccess
}) => {
  // Form State
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [serviceSearch, setServiceSearch] = useState('');
  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);

  const [quantity, setQuantity] = useState<number | ''>('');
  const [target, setTarget] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');

  // Captcha State
  const [captchaQuestion, setCaptchaQuestion] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState<number | ''>('');

  // UI / Submission state
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [showQrCard, setShowQrCard] = useState(true);

  // Load Captcha on mount
  useEffect(() => {
    loadCaptcha();
  }, []);

  const loadCaptcha = async () => {
    try {
      const res = await getCaptchaChallenge();
      if (res.success && res.captcha) {
        setCaptchaQuestion(res.captcha.question);
        setCaptchaToken(res.captcha.token);
        setCaptchaAnswer('');
      }
    } catch {}
  };

  // Find currently active service object
  const activeService = useMemo(() => {
    if (!selectedServiceId && services.length > 0) {
      return services[0];
    }
    return services.find(s => s.service_id === selectedServiceId) || services[0] || null;
  }, [selectedServiceId, services]);

  // Set default service on mount if not set
  useEffect(() => {
    if (!selectedServiceId && services.length > 0) {
      onSelectServiceId(services[0].service_id);
    }
  }, [services, selectedServiceId, onSelectServiceId]);

  // Update default quantity when active service changes
  useEffect(() => {
    if (activeService) {
      if (quantity === '' || Number(quantity) < activeService.min_quantity) {
        setQuantity(activeService.min_quantity);
      }
    }
  }, [activeService]);

  // Filter services by category and search
  const filteredServices = useMemo(() => {
    return services.filter(s => {
      const matchCat = selectedCategory === 'all' || s.category_id === selectedCategory;
      const matchSearch = !serviceSearch.trim() ||
        s.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
        s.description.toLowerCase().includes(serviceSearch.toLowerCase()) ||
        String(s.service_id).includes(serviceSearch.trim());
      return matchCat && matchSearch;
    });
  }, [services, selectedCategory, serviceSearch]);

  // Dynamic cost calculation
  const calculatedTotal = useMemo(() => {
    if (!activeService || quantity === '' || isNaN(Number(quantity))) return 0;
    const qty = Number(quantity);
    const rate = activeService.price_per_1k ?? (activeService as any).rate_per_1000 ?? 0;
    const cost = (qty / 1000) * rate;
    return Math.round(cost * 100) / 100;
  }, [activeService, quantity]);

  // Validations
  const isQuantityValid = useMemo(() => {
    if (!activeService || quantity === '') return false;
    const q = Number(quantity);
    return q >= activeService.min_quantity && q <= activeService.max_quantity;
  }, [activeService, quantity]);

  const isTxnIdValid = useMemo(() => {
    return transactionId.trim().length >= 6 && transactionId.trim().length <= 40;
  }, [transactionId]);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleAddQuantity = (amountToAdd: number) => {
    if (!activeService) return;
    const current = Number(quantity) || 0;
    const next = Math.min(current + amountToAdd, activeService.max_quantity);
    setQuantity(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!activeService) {
      setErrorMessage('Please select a valid service.');
      return;
    }

    if (!isQuantityValid) {
      setErrorMessage(`Quantity must be between ${activeService.min_quantity.toLocaleString()} and ${activeService.max_quantity.toLocaleString()}.`);
      return;
    }

    if (!target.trim() || target.trim().length < 2) {
      setErrorMessage('Please enter your target profile link or username.');
      return;
    }

    if (!transactionId.trim()) {
      setErrorMessage('Transaction ID / UTR is strictly required to verify your payment.');
      return;
    }

    if (!isTxnIdValid) {
      setErrorMessage('Please enter a valid Transaction ID / UTR reference (at least 6 characters from your UPI app receipt).');
      return;
    }

    if (captchaAnswer === '' || isNaN(Number(captchaAnswer))) {
      setErrorMessage('Please solve the anti-spam security math question.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateOrderPayload = {
        service_id: activeService.service_id,
        quantity: Number(quantity),
        target: target.trim(),
        transaction_id: transactionId.trim().toUpperCase(),
        customer_contact: customerContact.trim() || undefined,
        customer_notes: customerNotes.trim() || undefined,
        captcha_token: captchaToken,
        captcha_answer: Number(captchaAnswer)
      };

      const result = await submitCustomerOrder(payload);
      if (result.success) {
        // Reset inputs on success
        setTarget('');
        setTransactionId('');
        setCustomerContact('');
        setCustomerNotes('');
        onOrderSuccess(result);
        loadCaptcha();
      } else {
        setErrorMessage(result.message || 'Order submission failed.');
        loadCaptcha();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit order. Please try again.');
      loadCaptcha();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="order-section" className="py-8 sm:py-12 max-w-5xl mx-auto px-4 sm:px-6">
      {/* Outer Card with Glassmorphic Gradient Border */}
      <div className="relative rounded-3xl bg-neutral-900/90 border border-neutral-800/90 p-6 sm:p-10 shadow-2xl backdrop-blur-2xl overflow-hidden">
        
        {/* Subtle Cyber Aurora Accents */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-neutral-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-400 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Instant Self-Service Portal</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Create New Order
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1">
              Select your package, pay via UPI, and submit your Transaction ID for 59-second live verification.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-mono font-bold text-emerald-400">
              Admin & UPI Desk Active
            </span>
          </div>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="p-4 mb-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-xs sm:text-sm animate-fadeIn">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* ======================================================== */}
          {/* STEP 1: SERVICE SELECTION */}
          {/* ======================================================== */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-neutral-950 font-mono text-xs flex items-center justify-center font-bold">1</span>
                <span>Select Category & Service</span>
              </label>

              {activeService && (
                <span className="text-xs font-mono text-amber-400 font-bold">
                  Rate: ₹{activeService.price_per_1k ?? (activeService as any).rate_per_1000} / 1,000
                </span>
              )}
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                    : 'bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                All Platforms
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategory === c.id
                      ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                      : 'bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {/* Service Select Box */}
            <div className="relative">
              <select
                id="service-selector"
                value={activeService?.service_id || ''}
                onChange={(e) => onSelectServiceId(Number(e.target.value))}
                className="w-full px-4 py-3.5 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-2xl text-xs sm:text-sm text-white font-medium focus:outline-none focus:border-amber-500 transition-colors"
              >
                {filteredServices.map((srv) => (
                  <option key={srv.id} value={srv.service_id}>
                    #{srv.service_id} — {srv.name} (₹{srv.price_per_1k ?? (srv as any).rate_per_1000}/1k)
                  </option>
                ))}
              </select>
            </div>

            {/* Active Service Specs Pill */}
            {activeService && (
              <div className="p-3.5 bg-neutral-950/60 border border-neutral-800/80 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-3 text-neutral-400">
                  <span>Min: <b className="text-white font-mono">{activeService.min_quantity.toLocaleString()}</b></span>
                  <span>Max: <b className="text-white font-mono">{activeService.max_quantity.toLocaleString()}</b></span>
                  <span>Speed: <b className="text-emerald-400 font-medium">{activeService.speed}</b></span>
                </div>
                <div className="text-neutral-400">
                  Guarantee: <b className="text-amber-400 font-medium">{activeService.guarantee}</b>
                </div>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* STEP 2: QUANTITY & LIVE COST BADGE */}
          {/* ======================================================== */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label htmlFor="quantity-input" className="text-xs font-black uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-neutral-950 font-mono text-xs flex items-center justify-center font-bold">2</span>
                <span>Order Quantity</span>
              </label>

              {/* Glowing Real-time Price Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 text-emerald-300 font-mono font-black text-sm shadow-sm">
                <span className="text-xs text-neutral-400 font-normal">Total Price:</span>
                <span>₹{calculatedTotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  id="quantity-input"
                  type="number"
                  required
                  min={activeService?.min_quantity || 10}
                  max={activeService?.max_quantity || 1000000}
                  step={10}
                  placeholder="Enter amount (e.g. 1000)"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                  className="w-full px-4 py-3.5 bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-2xl text-base text-white font-mono font-bold placeholder-neutral-600 focus:outline-none transition-colors"
                />
              </div>

              {/* Quick Increment Chips */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => handleAddQuantity(500)}
                  className="px-3 py-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-bold text-neutral-300 hover:text-white hover:border-neutral-700"
                >
                  +500
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuantity(1000)}
                  className="px-3 py-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-bold text-neutral-300 hover:text-white hover:border-neutral-700"
                >
                  +1K
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuantity(5000)}
                  className="px-3 py-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-bold text-neutral-300 hover:text-white hover:border-neutral-700"
                >
                  +5K
                </button>
                <button
                  type="button"
                  onClick={() => activeService && setQuantity(activeService.max_quantity)}
                  className="px-3 py-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-bold text-amber-400 hover:border-amber-500/50"
                >
                  Max
                </button>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* STEP 3: TARGET PROFILE LINK / USERNAME */}
          {/* ======================================================== */}
          <div className="space-y-3">
            <label htmlFor="target-link-input" className="text-xs font-black uppercase tracking-wider text-neutral-300 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-neutral-950 font-mono text-xs flex items-center justify-center font-bold">3</span>
                <span>Target Link / Profile Username</span>
              </span>
              <span className="text-[11px] text-neutral-500 font-normal">Public Accounts Only</span>
            </label>

            <div className="relative">
              <LinkIcon className="w-4 h-4 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                id="target-link-input"
                type="text"
                required
                placeholder="https://instagram.com/username or @username"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-2xl text-xs sm:text-sm text-white font-mono placeholder-neutral-600 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* ======================================================== */}
          {/* STEP 4: UPI QR CODE & TRANSACTION ID (UTR) ENTRY */}
          {/* ======================================================== */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-neutral-950 font-mono text-xs flex items-center justify-center font-bold">4</span>
                <span>Payment via UPI & Transaction ID (UTR)</span>
              </label>

              <button
                type="button"
                onClick={() => setShowQrCard(!showQrCard)}
                className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>{showQrCard ? 'Hide QR Code' : 'Show PhonePe QR'}</span>
              </button>
            </div>

            {/* Interactive PhonePe QR Card */}
            {showQrCard && (
              <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 shadow-xl">
                <PhonePeQrCard
                  amount={calculatedTotal}
                  upiId={upiId}
                  payeeName={merchantName}
                  compact={true}
                  showPayeeInfo={true}
                />
              </div>
            )}

            {/* Transaction ID / UTR Input Box */}
            <div className="space-y-2">
              <label htmlFor="txn-id-input" className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Transaction ID / UPI UTR (Required)</span>
                </span>
                <span className="text-[11px] text-amber-400 font-bold">12-Digit Reference from Bank App</span>
              </label>

              <div className="relative">
                <CreditCard className="w-5 h-5 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  id="txn-id-input"
                  type="text"
                  required
                  placeholder="e.g. 423891823901 or TXN938472"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value.toUpperCase().trim())}
                  className="w-full pl-12 pr-4 py-4 bg-neutral-950 border-2 border-neutral-700 focus:border-amber-500 rounded-2xl text-base sm:text-lg text-white font-mono font-black placeholder-neutral-600 focus:outline-none uppercase tracking-wider shadow-inner"
                />
              </div>
              <p className="text-[11px] text-neutral-400">
                💡 Pay ₹{calculatedTotal || 0} via PhonePe/GPay/Paytm, copy the 12-digit UTR/Ref from the receipt, and paste it here.
              </p>
            </div>
          </div>

          {/* ======================================================== */}
          {/* STEP 5: OPTIONAL CUSTOMER CONTACT & ANTI-SPAM CAPTCHA */}
          {/* ======================================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="customer-contact-input" className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center justify-between">
                <span>Customer WhatsApp (Optional)</span>
              </label>
              <input
                id="customer-contact-input"
                type="text"
                placeholder="e.g. +91 98765 43210"
                value={customerContact}
                onChange={(e) => setCustomerContact(e.target.value)}
                className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Anti-Spam Security Question */}
            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-400">Math Security:</span>
                <span className="px-2.5 py-1 bg-neutral-900 border border-neutral-800 rounded-lg text-xs font-mono font-bold text-amber-400">
                  {captchaQuestion || 'Loading...'}
                </span>
                <button
                  type="button"
                  onClick={loadCaptcha}
                  className="p-1 text-neutral-500 hover:text-white rounded"
                  title="Refresh question"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                id="captcha-answer-input"
                type="number"
                required
                placeholder="Answer"
                value={captchaAnswer}
                onChange={(e) => setCaptchaAnswer(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                className="w-20 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-500 text-center"
              />
            </div>
          </div>

          {/* ======================================================== */}
          {/* SUBMIT BUTTON WITH PROCEED MONEY TRIGGER */}
          {/* ======================================================== */}
          <div className="pt-2">
            <button
              id="place-order-submit-btn"
              type="submit"
              disabled={submitting}
              className="w-full py-4 sm:py-5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:via-orange-400 hover:to-rose-400 text-neutral-950 font-black text-base tracking-wide uppercase shadow-2xl shadow-amber-500/25 flex items-center justify-center gap-2.5 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Submitting Payment & Opening 59s Verification...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Submit & Verify Payment (₹{calculatedTotal || 0})</span>
                </>
              )}
            </button>

            <p className="text-[11px] text-center text-neutral-400 mt-3">
              ⚡ Clicking submit immediately launches the 59-second live verification modal and transmits proceed money to the admin website.
            </p>
          </div>
        </form>
      </div>
    </section>
  );
};
