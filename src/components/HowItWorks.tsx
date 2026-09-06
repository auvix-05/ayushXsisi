import React from 'react';
import { Layers, QrCode, Clock, CheckCircle, Zap, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Choose Service & Target',
      desc: 'Pick your desired platform (Instagram, YouTube, Telegram, etc.) and enter your public profile link or username.',
      icon: Layers,
      color: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30'
    },
    {
      num: '02',
      title: 'Scan UPI & Copy 12-Digit UTR',
      desc: 'Scan the dynamic PhonePe / UPI QR code with any UPI app and copy the 12-digit transaction reference (UTR) from your receipt.',
      icon: QrCode,
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30'
    },
    {
      num: '03',
      title: '59s Live Verification Pop-Up',
      desc: 'As soon as you enter your Transaction ID, the 59-second verification radar initiates and proceed money immediately reflects on the admin website.',
      icon: Clock,
      color: 'from-blue-500/20 to-cyan-500/20 text-blue-400 border-blue-500/30'
    },
    {
      num: '04',
      title: 'Fulfillment & Real-Time Tracking',
      desc: 'The owner verifies the proceed payment and initiates high-speed delivery. Track progress anytime with your unique Order ID.',
      icon: CheckCircle,
      color: 'from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30'
    }
  ];

  return (
    <section id="how-it-works-section" className="py-14 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-14">
        <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/25 uppercase tracking-wider">
          Frictionless 4-Step Process
        </span>
        <h2 className="text-3xl sm:text-4xl font-black text-white mt-3 tracking-tight">
          How ayushXsisi Operates
        </h2>
        <p className="text-neutral-400 text-sm sm:text-base mt-2">
          Lightning-fast order collection with 59-second payment verification and direct owner dispatch.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.num}
              className="relative p-6 rounded-3xl bg-neutral-900/90 border border-neutral-800/90 hover:border-neutral-700 transition-all flex flex-col justify-between shadow-xl group hover:shadow-2xl hover:shadow-black/60"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${step.color} border flex items-center justify-center transition-transform group-hover:scale-105`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="font-mono text-3xl font-black text-neutral-700 group-hover:text-neutral-500 transition-colors">
                    {step.num}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mb-2 leading-snug">{step.title}</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">{step.desc}</p>
              </div>

              <div className="mt-5 pt-3 border-t border-neutral-800/80 text-[11px] text-neutral-400 flex items-center gap-1.5 font-medium">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Zero login needed</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
