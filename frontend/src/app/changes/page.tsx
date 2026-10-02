'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, Filter, RotateCw, Search, Shield, Zap, CheckCircle2, ChevronRight, Terminal } from 'lucide-react';
import { getChanges } from '@/lib/api';
import { Change } from '@/lib/types';
import { SourceBadge } from '@/components/SourceBadge';

export default function ChangesPage() {
  const [changes, setChanges] = useState<Change[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedService, setSelectedService] = useState('all');
  const [selectedActorType, setSelectedActorType] = useState('all');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getChanges();
      setChanges(data);
      if (data.length > 0 && !selectedEventId) {
        setSelectedEventId(data[0].id);
      }
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
  const actorTypes = ['all', ...Array.from(new Set(changes.map((c) => c.actor_type)))];

  const filteredChanges = changes.filter((c) => {
    const matchesSearch =
      c.action.toLowerCase().includes(filterQuery.toLowerCase()) ||
      c.resource_name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      c.actor_id.toLowerCase().includes(filterQuery.toLowerCase());
    const matchesService =
      selectedService === 'all' || c.service.toLowerCase() === selectedService.toLowerCase();
    const matchesActor =
      selectedActorType === 'all' || c.actor_type.toLowerCase() === selectedActorType.toLowerCase();
    return matchesSearch && matchesService && matchesActor;
  });

  const selectedChange =
    changes.find((c) => c.id === selectedEventId) || (filteredChanges.length > 0 ? filteredChanges[0] : null);

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#222733]">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-blue-400 transition-colors mr-1"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Console</span>
            </Link>
            <span>/</span>
            <h1 className="text-base font-bold font-mono text-slate-100 uppercase tracking-wide flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-blue-400" />
              <span>CloudTrail Infrastructure Changes</span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Normalized configuration modification events across monitored AWS services in us-east-2.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="px-2.5 py-1.5 rounded border border-[#222733] bg-[#13161c] hover:bg-[#1a1e27] text-slate-300 font-mono text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Sync Events</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5 p-2.5 rounded border border-[#222733] bg-[#13161c]">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Filter by action, resource, or actor ARN..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-[#0a0c0f] border border-[#222733] rounded text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono uppercase text-slate-400">SERVICE:</span>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="bg-[#0a0c0f] border border-[#222733] rounded text-xs font-mono text-slate-300 px-2.5 py-1.5 focus:outline-none focus:border-blue-500 uppercase"
            >
              {services.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono uppercase text-slate-400">ACTOR:</span>
            <select
              value={selectedActorType}
              onChange={(e) => setSelectedActorType(e.target.value)}
              className="bg-[#0a0c0f] border border-[#222733] rounded text-xs font-mono text-slate-300 px-2.5 py-1.5 focus:outline-none focus:border-blue-500 uppercase"
            >
              {actorTypes.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Split: Dense Event Table + Selected Event Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left/Center Event Table (8 Cols) */}
        <div className="lg:col-span-8 border border-[#222733] rounded bg-[#13161c] overflow-hidden">
          <div className="px-3 py-2 border-b border-[#222733] bg-[#0e1116] flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-slate-200 uppercase">
              Events Stream ({filteredChanges.length})
            </span>
            <span className="text-slate-400 text-[10px]">
              Click row to inspect event details
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#0a0c0f] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#222733]">
                <tr>
                  <th className="py-2 px-3">Action</th>
                  <th className="py-2 px-3">Service</th>
                  <th className="py-2 px-3">Resource</th>
                  <th className="py-2 px-3">Actor</th>
                  <th className="py-2 px-3">Type</th>
                  <th className="py-2 px-3">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e232d]">
                {filteredChanges.map((chg) => {
                  const isSelected = selectedChange?.id === chg.id;

                  return (
                    <tr
                      key={chg.id}
                      onClick={() => setSelectedEventId(chg.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#1a2b4c] text-white font-semibold'
                          : 'hover:bg-[#181c24] text-slate-300'
                      }`}
                    >
                      <td className="py-2 px-3 font-bold text-slate-100 font-sans">
                        {chg.action}
                      </td>
                      <td className="py-2 px-3">
                        <SourceBadge source={chg.service} />
                      </td>
                      <td className="py-2 px-3 text-slate-300 text-[11px] truncate max-w-[160px]" title={chg.resource_name}>
                        {chg.resource_name}
                      </td>
                      <td className="py-2 px-3 text-slate-400 text-[11px] truncate max-w-[140px]" title={chg.actor_id}>
                        {chg.actor_id}
                      </td>
                      <td className="py-2 px-3 uppercase text-[10px]">
                        <span
                          className={`px-1.5 py-0.2 rounded font-bold ${
                            chg.actor_type === 'ai_agent'
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                              : chg.actor_type === 'human'
                              ? 'bg-blue-950 text-blue-300 border border-blue-800'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {chg.actor_type}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-400 text-[10px] whitespace-nowrap">
                        {new Date(chg.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Event Inspector Panel (4 Cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="border border-[#222733] rounded bg-[#13161c] p-3.5 space-y-3 font-mono text-xs sticky top-4">
            <div className="flex items-center justify-between border-b border-[#222733] pb-2">
              <span className="font-bold uppercase tracking-wider text-slate-200">
                CloudTrail Inspector
              </span>
              {selectedChange && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#1e232d] text-blue-300 uppercase">
                  {selectedChange.service}
                </span>
              )}
            </div>

            {selectedChange ? (
              <div className="space-y-3">
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block">Action</span>
                  <span className="font-bold text-slate-100 text-sm break-all font-sans">
                    {selectedChange.action}
                  </span>
                </div>

                <div className="p-2.5 rounded bg-[#0d0f12] border border-[#1f242e] text-[11px] space-y-1.5">
                  <div className="flex justify-between gap-2 border-b border-[#1a1f28] pb-1">
                    <span className="text-slate-400">Resource:</span>
                    <span className="text-slate-200 truncate font-bold" title={selectedChange.resource_name}>
                      {selectedChange.resource_name}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2 border-b border-[#1a1f28] pb-1">
                    <span className="text-slate-400">Actor Type:</span>
                    <span className="text-blue-300 font-semibold uppercase">
                      {selectedChange.actor_type}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2 border-b border-[#1a1f28] pb-1">
                    <span className="text-slate-400">Actor ID:</span>
                    <span className="text-slate-200 truncate" title={selectedChange.actor_id}>
                      {selectedChange.actor_id}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2 border-b border-[#1a1f28] pb-1">
                    <span className="text-slate-400">Region:</span>
                    <span className="text-slate-200">{selectedChange.region}</span>
                  </div>
                  <div className="flex justify-between gap-2 border-b border-[#1a1f28] pb-1">
                    <span className="text-slate-400">Timestamp:</span>
                    <span className="text-slate-200">{new Date(selectedChange.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-400">Event ID:</span>
                    <span className="text-slate-400 truncate max-w-[180px]" title={selectedChange.raw_event_ref}>
                      {selectedChange.raw_event_ref || selectedChange.id}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase text-slate-400 block font-semibold">
                    Raw Evidence Reference
                  </span>
                  <div className="p-2 rounded bg-[#0a0c0f] border border-[#1f242e] text-[10px] text-slate-400 break-all">
                    aws:cloudtrail:{selectedChange.region}:event:{selectedChange.raw_event_ref || selectedChange.id}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">
                Select an event from the stream to view full details.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
