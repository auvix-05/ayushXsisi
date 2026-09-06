import React from 'react';
import logoImg from '../assets/images/ayushxsisi_logo_1787817446152.jpg';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  variant?: 'emblem' | 'full' | 'rounded';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  variant = 'rounded'
}) => {
  const sizeMap = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9 sm:w-10 sm:h-10',
    lg: 'w-12 h-12 sm:w-14 sm:h-14',
    xl: 'w-16 h-16 sm:w-20 sm:h-20'
  };

  const imageSizeClasses = sizeMap[size] || sizeMap.md;

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Gold AX Monogram Logo Image */}
      <div className="relative group/logo flex-shrink-0">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/40 to-yellow-600/40 rounded-xl blur-[2px] opacity-60 group-hover/logo:opacity-100 transition-opacity" />
        <div className={`relative ${imageSizeClasses} rounded-xl overflow-hidden bg-neutral-950 border border-amber-500/30 shadow-lg shadow-amber-950/40 flex items-center justify-center`}>
          <img
            src={logoImg}
            alt="ayushXsisi Official Logo"
            className="w-full h-full object-cover object-center transform scale-105"
            referrerPolicy="no-referrer"
            loading="eager"
          />
        </div>
      </div>

      {/* Brand Text Branding */}
      {showText && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5 leading-tight">
            <span className="text-base sm:text-lg font-black tracking-tight text-white group-hover/logo:text-amber-300 transition-colors">
              ayushXsisi
            </span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" title="Online & Processing" />
          </div>
          <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-amber-400/90 font-mono">
            Direct SMM Fulfillment
          </span>
        </div>
      )}
    </div>
  );
};
