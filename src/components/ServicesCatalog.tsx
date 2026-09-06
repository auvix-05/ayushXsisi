import React, { useState, useMemo } from 'react';
import { Search, Sparkles, CheckCircle2, ArrowRight, Tag, Info } from 'lucide-react';
import { Category, Service } from '../types';

interface ServicesCatalogProps {
  categories: Category[];
  services: Service[];
  onSelectService: (serviceId: number) => void;
}

export const ServicesCatalog: React.FC<ServicesCatalogProps> = ({
  categories,
  services,
  onSelectService
}) => {
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    return services.filter(s => {
      const matchCat = selectedCat === 'all' || s.category_id === selectedCat;
      const matchQuery = !searchQuery.trim() ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(s.service_id).includes(searchQuery.trim());
      return matchCat && matchQuery;
    });
  }, [services, selectedCat, searchQuery]);

  return (
    <section id="services-section" className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-10">
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider">
          Complete Rate Card
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3 tracking-tight">
          Transparent Services & Pricing
        </h2>
        <p className="text-neutral-400 text-sm sm:text-base mt-2">
          High-retention, high-speed social media growth packages. All active services are updated in real-time.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-thin">
          <button
            onClick={() => setSelectedCat('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCat === 'all'
                ? 'bg-amber-500 text-neutral-950 shadow-md'
                : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:bg-neutral-800 hover:text-white'
            }`}
          >
            All Services ({services.length})
          </button>
          {categories.map((c) => {
            const count = services.filter(s => s.category_id === c.id).length;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCat(c.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCat === c.id
                    ? 'bg-amber-500 text-neutral-950 shadow-md'
                    : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:bg-neutral-800 hover:text-white'
                }`}
              >
                {c.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Search service name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((srv) => (
          <div
            key={srv.id}
            className="bg-neutral-900/90 border border-neutral-800 hover:border-amber-500/50 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 group hover:shadow-xl hover:shadow-amber-500/5"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 font-mono text-[11px] font-bold text-amber-400">
                  ID: #{srv.service_id}
                </span>
                <span className="text-[11px] font-semibold text-neutral-400 bg-neutral-800/80 px-2 py-0.5 rounded-full">
                  {srv.category_name}
                </span>
              </div>

              <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors leading-snug">
                {srv.name}
              </h3>

              <p className="text-xs text-neutral-400 mt-2 line-clamp-3 leading-relaxed">
                {srv.description}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-800">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-500 block">Rate / 1000</span>
                  <span className="text-xl font-black text-emerald-400">₹{srv.price_per_1k}</span>
                </div>
                <div className="text-right text-[11px] text-neutral-400">
                  <div>Min: <span className="text-neutral-200 font-medium">{srv.min_quantity.toLocaleString()}</span></div>
                  <div>Max: <span className="text-neutral-200 font-medium">{srv.max_quantity.toLocaleString()}</span></div>
                </div>
              </div>

              <button
                id={`select-service-${srv.service_id}`}
                onClick={() => onSelectService(srv.service_id)}
                className="w-full py-2.5 px-4 bg-neutral-950 hover:bg-amber-500 text-neutral-200 hover:text-neutral-950 font-bold text-xs rounded-xl border border-neutral-800 hover:border-amber-500 flex items-center justify-center gap-2 transition-all"
              >
                <span>Order This Service</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="p-12 text-center bg-neutral-900/40 border border-neutral-800 rounded-2xl">
          <p className="text-neutral-400 text-sm">No services found matching "{searchQuery}".</p>
        </div>
      )}
    </section>
  );
};
