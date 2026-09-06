import React from 'react';
import { ArrowDown, Zap, ShieldCheck, Clock, Send, Sparkles, CheckCircle2, TrendingUp, ShieldAlert } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

interface HeroSectionProps {
  onOrderNowClick: () => void;
  onBrowseServicesClick: () => void;
  announcement?: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOrderNowClick,
  onBrowseServicesClick,
  announcement
}) => {
  return (
    <section id="hero-section" className="relative pt-10 pb-14 sm:pt-16 sm:pb-20 overflow-hidden">
      {/* Dynamic Cyber Aurora Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[480px] bg-gradient-to-b from-amber-500/15 via-orange-500/8 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative">
        {/* Top Hero Brand Crest with Subtle Hover Bounce */}
        <div className="flex justify-center mb-6">
          <BrandLogo size="lg" showText={false} className="transform hover:scale-105 transition-transform duration-300 drop-shadow-[0_0_25px_rgba(245,158,11,0.25)]" />
        </div>

        {/* Announcement Tag */}
        {announcement && (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-xs font-bold text-amber-300 mb-6 shadow-lg shadow-amber-500/5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 animate-pulse" />
            <span className="truncate max-w-xs sm:max-w-md">{announcement}</span>
          </div>
        )}

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.12]">
          Supercharge Your Growth <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 drop-shadow-sm">
            Direct With ayushXsisi
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-4 sm:mt-6 text-sm sm:text-lg text-neutral-300 max-w-2xl mx-auto leading-relaxed">
          High-retention social media amplification. Pay via UPI, enter your 12-digit UTR, watch our 59-second live verification timer, and proceed directly to fulfillment.
        </p>

        {/* Interactive Feature Pills */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto text-left">
          <div className="p-3.5 bg-neutral-900/90 border border-neutral-800/90 hover:border-emerald-500/40 rounded-2xl flex items-center gap-3 transition-colors shadow-lg">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black text-white">59s Verification</div>
              <div className="text-[11px] text-neutral-400">Live UTR timer</div>
            </div>
          </div>

          <div className="p-3.5 bg-neutral-900/90 border border-neutral-800/90 hover:border-amber-500/40 rounded-2xl flex items-center gap-3 transition-colors shadow-lg">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black text-white">Owner Alert</div>
              <div className="text-[11px] text-neutral-400">Direct WhatsApp</div>
            </div>
          </div>

          <div className="p-3.5 bg-neutral-900/90 border border-neutral-800/90 hover:border-blue-500/40 rounded-2xl flex items-center gap-3 transition-colors shadow-lg">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black text-white">Live Tracking</div>
              <div className="text-[11px] text-neutral-400">Track via Order ID</div>
            </div>
          </div>

          <div className="p-3.5 bg-neutral-900/90 border border-neutral-800/90 hover:border-rose-500/40 rounded-2xl flex items-center gap-3 transition-colors shadow-lg">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black text-white">100% Safe</div>
              <div className="text-[11px] text-neutral-400">Zero pass needed</div>
            </div>
          </div>
        </div>

        {/* Call to Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
          <button
            id="hero-order-now-btn"
            onClick={onOrderNowClick}
            className="px-7 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:via-orange-400 hover:to-rose-400 text-neutral-950 font-black text-sm uppercase tracking-wider shadow-2xl shadow-amber-500/25 flex items-center gap-2.5 transition-all transform hover:-translate-y-0.5"
          >
            <span>Place Order Now</span>
            <ArrowDown className="w-4 h-4" />
          </button>

          <button
            id="hero-browse-services-btn"
            onClick={onBrowseServicesClick}
            className="px-6 py-4 rounded-2xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-white font-bold text-sm transition-all"
          >
            Browse Services & Rates
          </button>
        </div>
      </div>
    </section>
  );
};
