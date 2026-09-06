import React from 'react';
import { ShieldCheck, Send, ArrowUpRight, Heart, Zap, CheckCircle2 } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

interface FooterProps {
  onSectionClick: (sectionId: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onSectionClick }) => {
  return (
    <footer className="mt-16 border-t border-neutral-800/80 bg-neutral-950 text-neutral-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-3">
            <div className="cursor-pointer" onClick={() => onSectionClick('hero-section')}>
              <BrandLogo size="md" />
            </div>
            <p className="text-neutral-400 max-w-sm leading-relaxed">
              Premium SMM order collection & manual fulfillment portal. No account required. Pay via UPI, auto-dispatch to owner's WhatsApp, and track order progression in real-time.
            </p>
            <div className="flex items-center gap-2 text-neutral-300 text-xs">
              <span className="font-semibold text-white">Owner Contact:</span>
              <a
                href="https://wa.me/917033994688"
                target="_blank"
                rel="noreferrer"
                className="font-mono text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>+91 70339 94688</span>
                <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Quick Navigation</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => onSectionClick('order-section')} className="hover:text-amber-400 transition-colors">
                  Place Order Now
                </button>
              </li>
              <li>
                <button onClick={() => onSectionClick('services-section')} className="hover:text-amber-400 transition-colors">
                  Services & Pricing
                </button>
              </li>
              <li>
                <button onClick={() => onSectionClick('how-it-works-section')} className="hover:text-amber-400 transition-colors">
                  How It Works
                </button>
              </li>
              <li>
                <button onClick={() => onSectionClick('support-section')} className="hover:text-amber-400 transition-colors">
                  Support & FAQ
                </button>
              </li>
            </ul>
          </div>

          {/* Trust & Guarantee */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Fulfillment Guarantee</h4>
            <ul className="space-y-2 text-neutral-400 text-[11px]">
              <li className="flex items-center gap-1.5 text-neutral-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Zero login or password needed</span>
              </li>
              <li className="flex items-center gap-1.5 text-neutral-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span>Verified Direct UPI Processing</span>
              </li>
              <li className="flex items-center gap-1.5 text-neutral-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Instant WhatsApp Order Dispatch</span>
              </li>
              <li className="flex items-center gap-1.5 text-neutral-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span>Real-Time Status Tracking</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-neutral-500">
          <div>
            © {new Date().getFullYear()} ayushXsisi. All rights reserved. SMM Order Collection System.
          </div>
          <div className="flex items-center gap-1">
            <span>Powered by <b>ayushXsisi Engine</b></span>
          </div>
        </div>
      </div>
    </footer>
  );
};
