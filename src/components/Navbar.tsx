import React from 'react';
import { Sparkles, QrCode, Search, Shield, Menu, X, ArrowUpRight, Zap, ShieldCheck } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

interface NavbarProps {
  onOpenTrackModal: () => void;
  onOpenUpiModal: () => void;
  activeSection: string;
  onSectionClick: (sectionId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenTrackModal,
  onOpenUpiModal,
  activeSection,
  onSectionClick
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navLinks = [
    { id: 'order-section', label: 'Order Now' },
    { id: 'services-section', label: 'Services & Pricing' },
    { id: 'how-it-works-section', label: 'How It Works' },
    { id: 'support-section', label: 'Support & FAQ' }
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        
        {/* Left: Brand Crest & Status */}
        <div className="flex items-center gap-4">
          <div
            onClick={() => onSectionClick('hero-section')}
            className="cursor-pointer group flex items-center gap-2"
            id="navbar-brand-logo"
          >
            <BrandLogo size="md" />
          </div>

          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono text-emerald-400 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>UPI Gateway 24/7 Active</span>
          </div>
        </div>

        {/* Center: Modern Floating Pill Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-neutral-900/90 p-1.5 rounded-2xl border border-neutral-800 shadow-lg shadow-black/40">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => onSectionClick(link.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeSection === link.id
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-neutral-950 shadow-md shadow-amber-500/25'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Right: Quick Triggers */}
        <div className="hidden sm:flex items-center gap-2.5">
          {/* UPI Quick Trigger */}
          <button
            id="nav-upi-qr-btn"
            onClick={onOpenUpiModal}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-bold text-neutral-200 hover:text-white transition-all shadow-sm"
          >
            <QrCode className="w-4 h-4 text-emerald-400" />
            <span>UPI QR Scan</span>
          </button>

          {/* Track Order Button */}
          <button
            id="nav-track-order-btn"
            onClick={onOpenTrackModal}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 text-xs font-black transition-all shadow-lg shadow-amber-500/20 transform hover:-translate-y-0.5"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Track Order</span>
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={onOpenTrackModal}
            className="px-2.5 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-amber-400 text-xs font-bold flex items-center gap-1"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Track</span>
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-800 bg-neutral-950/95 backdrop-blur-2xl px-4 py-4 space-y-2 animate-fadeIn">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => {
                onSectionClick(link.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-colors ${
                activeSection === link.id
                  ? 'bg-amber-500 text-neutral-950'
                  : 'text-neutral-300 hover:bg-neutral-900'
              }`}
            >
              {link.label}
            </button>
          ))}

          <div className="pt-3 border-t border-neutral-800/80 flex flex-col gap-2">
            <button
              onClick={() => {
                onOpenUpiModal();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-bold text-white"
            >
              <QrCode className="w-4 h-4 text-emerald-400" />
              <span>Scan PhonePe / UPI QR</span>
            </button>
            <button
              onClick={() => {
                onOpenTrackModal();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500 text-neutral-950 font-black text-xs"
            >
              <Search className="w-4 h-4" />
              <span>Track Order Status</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
