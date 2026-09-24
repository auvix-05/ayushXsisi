import React, { useState, useEffect } from 'react';
import {
  Activity,
  Send,
  Shield,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Search
} from 'lucide-react';
import { WhatsAppLog } from '../../types';
import { getAdminLogs } from '../../lib/api';

interface AdminLogsProps {
  token: string;
}

export const AdminLogs: React.FC<AdminLogsProps> = ({ token }) => {
  const [whatsappLogs, setWhatsappLogs] = useState<WhatsAppLogin[]>([]);
  const [securityLogs, setSecurityLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'audit'>('whatsapp');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await getAdminLogs(token);
      if (res.success) {
        setWhatsappLogs(res.whatsapp_logs || []);
        setSecurityLogs((res as any).security_logs || res.audit_logs || []);
      }
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredWhatsappLogs = whatsappLogs.filter(l =>
    !searchQuery.trim() ||
    l.order_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.phone_number || l.recipient || '').includes(searchQuery.trim()) ||
    (l.message_body || l.message_snippet || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSecurityLogs = securityLogs.filter(a =>
    !searchQuery.trim() ||
    (a.type || a.action || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.details || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.ip || a.actor || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'whatsapp'
                ? 'bg-amber-500 text-neutral-950 shadow-md'
                : 'bg-neutral-950 text-neutral-400 hover:text-white'
            }`}
          >
            WhatsApp Dispatch Logs ({whatsappLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'audit'
                ? 'bg-amber-500 text-neutral-950 shadow-md'
                : 'bg-neutral-950 text-neutral-400 hover:text-white'
            }`}
          >
            Security & System Audit ({securityLogs.length})
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
            />
          </div>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="p-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-neutral-400 hover:text-white"
            title="Refresh Logs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* WhatsApp Logs View */}
      {activeTab === 'whatsapp' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="text-[11px] uppercase tracking-wider text-neutral-500 border-b border-neutral-800 bg-neutral-950">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-3">Order ID</th>
                  <th className="py-3 px-3">Recipient</th>
                  <th className="py-3 px-3">Provider</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4">Message Body Preview</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/80 font-mono">
                {filteredWhatsappLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-neutral-500 font-sans">
                      No WhatsApp dispatch logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  filteredWhatsappLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-neutral-800/40">
                      <td className="py-3 px-4 text-neutral-400 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-amber-400 font-bold">{log.order_id || 'N/A'}</td>
                      <td className="py-3 px-3 text-white">{log.phone_number || log.recipient}</td>
                      <td className="py-3 px-3 uppercase text-[10px] text-neutral-400">{log.provider}</td>
                      <td className="py-3 px-3 font-sans">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          log.status === 'delivered' || log.status === 'simulated'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-sans text-neutral-300 max-w-xs truncate" title={log.message_body || log.message_snippet}>
                        {log.message_body || log.message_snippet}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Audit Logs View */}
      {activeTab === 'audit' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="text-[11px] uppercase tracking-wider text-neutral-500 border-b border-neutral-800 bg-neutral-950">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-3">Type / Action</th>
                  <th className="py-3 px-3">IP / Actor</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/80 font-mono">
                {filteredSecurityLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-neutral-500 font-sans">
                      No security audit events recorded yet.
                    </td>
                  </tr>
                ) : (
                  filteredSecurityLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-neutral-800/40">
                      <td className="py-3 px-4 text-neutral-400 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 uppercase text-[11px] text-amber-400 font-bold font-sans">
                        {log.type || log.action}
                      </td>
                      <td className="py-3 px-3 text-neutral-400 font-sans">{log.ip || log.actor || 'System'}</td>
                      <td className="py-3 px-4 font-sans text-neutral-300">{log.details}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
