'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, Filter, RotateCw, Search, Shield, Zap } from 'lucide-react';
import { getChanges } from '@/lib/api';
import { Change } from '@/lib/types';
import { SourceBadge } from '@/components/SourceBadge';

export default function ChangesPage() {
  const [changes, setChanges] = useState<Change[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedService, setSelectedService] = useState('all');

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getChanges();
      setChanges(data);
    } catch (e) {
      console.error('Failed to load changes:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const services = ['all', ...Array.from(new Set(changes.map((c) => c.service)))];

  const filteredChanges = changes.filter((c) => {
    const matchesSearch =
      c.action.toLowerCase().includes(filterQuery.toLowerCase()) ||
      c.resource_name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      c.actor_id.toLowerCase().includes(filterQuery.toLowerCase());
    const matchesService =
      selectedService === 'all' || c.service.toLowerCase() === selectedService.toLowerCase();
    return matchesSearch && matchesService;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-400 transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-400" />
            CloudTrail Infrastructure Changes
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Normalized configuration modification events across monitored AWS services.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="p-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 p-4 rounded-xl border border-slate-800 bg-slate-900/60">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by action, resource, or actor..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 px-3 py-2 focus:outline-none focus:border-indigo-500 uppercase font-mono"
          >
            {services.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Changes Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Service</th>
                <th className="py-3 px-4">Resource</th>
                <th className="py-3 px-4">Actor Type</th>
                <th className="py-3 px-4">Actor Identity</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
              {filteredChanges.map((chg) => (
                <tr key={chg.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-white font-sans">{chg.action}</td>
                  <td className="py-3 px-4">
                    <SourceBadge source={chg.service} />
                  </td>
                  <td className="py-3 px-4 text-slate-300 font-mono text-[11px] truncate max-w-[200px]" title={chg.resource_name}>
                    {chg.resource_name}
                  </td>
                  <td className="py-3 px-4 capitalize font-sans">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        chg.actor_type === 'ai_agent'
                          ? 'bg-cyan-500/20 text-cyan-300'
                          : chg.actor_type === 'human'
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {chg.actor_type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px] truncate max-w-[180px]" title={chg.actor_id}>
                    {chg.actor_id}
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                    {new Date(chg.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
