import React, { useState } from 'react';
import { MessageSquare, HelpCircle, ChevronDown, ChevronUp, Send, ShieldCheck, Mail } from 'lucide-react';

export const SupportSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Do I need to sign up or create an account to place an order?',
      a: 'No! ayushXsisi allows you to place orders directly without creating an account. Simply pick your service, make your payment via UPI, and submit your Transaction ID.'
    },
    {
      q: 'How do I know my order has been received?',
      a: 'Immediately upon submission, our system generates a unique Order ID (e.g. AX-20260827-482731) and automatically transmits full order details to the owner’s WhatsApp (+917033994688). You can also track live progress using the "Track Order" button.'
    },
    {
      q: 'How long does it take for my order to start?',
      a: 'Most services start within 0-60 minutes after the owner verifies the UPI Transaction ID. Delivery speeds vary depending on the platform (e.g. Instagram Followers: 20K/day, YouTube Views: instant start).'
    },
    {
      q: 'Where do I find my Transaction ID (UTR)?',
      a: 'After completing the payment on Google Pay, PhonePe, Paytm, or your banking app, open the payment receipt details. Look for "UPI Ref No", "UTR", or "Transaction ID" (usually a 12-digit number).'
    },
    {
      q: 'Is my social media account safe?',
      a: 'Yes, 100%. We never ask for your account password. All services only require your public profile link or username.'
    },
    {
      q: 'What if my order has a problem or drops?',
      a: 'Our services come with non-drop stability and 30-day refill guarantees. If you ever need support, you can directly message the owner on WhatsApp with your Order ID.'
    }
  ];

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="support-section" className="py-12 sm:py-16 max-w-5xl mx-auto px-4 sm:px-6">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider">
          Direct Customer Support
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3 tracking-tight">
          Frequently Asked Questions
        </h2>
        <p className="text-neutral-400 text-sm sm:text-base mt-2">
          Everything you need to know about ordering, UPI payments, and fulfillment.
        </p>
      </div>

      {/* Direct Contact Card */}
      <div className="mb-10 p-6 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-neutral-900 to-amber-950/30 border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-4 text-left">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <MessageSquare className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Need Urgent Help with an Order?</h3>
            <p className="text-xs text-neutral-300 mt-0.5">
              Chat directly with owner on WhatsApp: <span className="text-emerald-400 font-mono font-bold">+91 70339 94688</span>
            </p>
          </div>
        </div>

        <a
          id="support-whatsapp-link"
          href="https://wa.me/917033994688?text=Hello%20ayushXsisi%2C%20I%20have%20a%20question%20about%20your%20SMM%20services."
          target="_blank"
          rel="noreferrer"
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-900/30 whitespace-nowrap"
        >
          <Send className="w-4 h-4" />
          <span>Open WhatsApp Chat</span>
        </a>
      </div>

      {/* FAQ Accordion */}
      <div className="space-y-3">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="bg-neutral-900/80 border border-neutral-800 rounded-2xl overflow-hidden transition-colors"
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 text-white hover:text-amber-400 transition-colors"
              >
                <span className="text-sm sm:text-base font-semibold">{faq.q}</span>
                {isOpen ? (
                  <ChevronUp className="w-5 h-5 text-amber-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-neutral-500 flex-shrink-0" />
                )}
              </button>

              {isOpen && (
                <div className="px-4 pb-5 sm:px-5 text-xs sm:text-sm text-neutral-400 leading-relaxed border-t border-neutral-800/60 pt-3 animate-fadeIn">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
