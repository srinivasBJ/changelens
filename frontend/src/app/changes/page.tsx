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

  const getActorBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case 'human':
        return 'bg-[#0066FF] text-[#FFFFFF] font-bold';
      case 'automation':
        return 'bg-[#333333] text-[#A8A8A8] font-semibold';
      case 'ai_agent':
        return 'bg-[#0066FF]/20 text-[#0066FF] border border-[#0066FF]/40 font-bold';
      default:
        return 'bg-[#2a2a2a] text-[#A8A8A8]';
    }
  };

  return (
    <div className="space-y-[32px]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-[#3a3a3a]">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[13px] font-sans text-[#A8A8A8] hover:text-[#D6D6D6] transition-colors mr-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Console</span>
            </Link>
            <span className="text-[#444444]">/</span>
            <h1 className="text-[24px] font-sans font-semibold text-[#D6D6D6] leading-[1.3] tracking-[-0.015em] flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#0066FF]" />
              <span>CloudTrail Infrastructure Changes</span>
            </h1>
          </div>
          <p className="text-[14px] font-sans font-normal text-[#A8A8A8] mt-1 leading-[1.55] prose-limit">
            Normalized configuration modification events across monitored AWS services in us-east-2.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="h-[44px] min-h-[44px] px-4 rounded-[8px] border border-[#3a3a3a] bg-transparent hover:bg-[#333333] text-[#A8A8A8] hover:text-[#D6D6D6] font-sans text-[14px] font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Sync Events</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 p-[20px] rounded-[10px] border border-[#3a3a3a] bg-[#1f1f1f]">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#7A7A7A] absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Filter by action, resource, or actor ARN..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full h-[44px] min-h-[44px] pl-10 pr-4 bg-[#171717] border border-[#303030] rounded-[8px] text-[13px] font-mono text-[#D6D6D6] placeholder-[#7A7A7A] focus:outline-none focus:border-[#0066FF]"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-sans uppercase font-semibold tracking-[0.08em] text-[#7A7A7A]">SERVICE:</span>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="h-[44px] min-h-[44px] bg-[#171717] border border-[#303030] rounded-[8px] text-[13px] font-sans text-[#D6D6D6] px-3 focus:outline-none focus:border-[#0066FF] uppercase"
            >
              {services.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-sans uppercase font-semibold tracking-[0.08em] text-[#7A7A7A]">ACTOR:</span>
            <select
              value={selectedActorType}
              onChange={(e) => setSelectedActorType(e.target.value)}
              className="h-[44px] min-h-[44px] bg-[#171717] border border-[#303030] rounded-[8px] text-[13px] font-sans text-[#D6D6D6] px-3 focus:outline-none focus:border-[#0066FF] uppercase"
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-[20px]">
        {/* Left/Center Event Table (8 Cols) */}
        <div className="lg:col-span-8 border border-[#3a3a3a] rounded-[10px] bg-[#1f1f1f] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#3a3a3a] bg-[#171717] flex items-center justify-between text-[13px]">
            <h2 className="font-semibold text-[#D6D6D6] text-[15px]">
              Events Stream ({filteredChanges.length})
            </h2>
            <span className="text-[#7A7A7A] text-[12px] font-sans">
              Click row to inspect event details
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] font-sans">
              <thead className="bg-[#171717] text-[#7A7A7A] uppercase text-[11px] font-semibold tracking-[0.08em] border-b border-[#3a3a3a]">
                <tr className="h-[44px]">
                  <th className="py-2.5 px-4 font-semibold">Action</th>
                  <th className="py-2.5 px-4 font-semibold">Service</th>
                  <th className="py-2.5 px-4 font-semibold">Resource</th>
                  <th className="py-2.5 px-4 font-semibold">Actor</th>
                  <th className="py-2.5 px-4 font-semibold">Type</th>
                  <th className="py-2.5 px-4 font-semibold">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2a2a]">
                {filteredChanges.map((chg) => {
                  const isSelected = selectedChange?.id === chg.id;

                  return (
                    <tr
                      key={chg.id}
                      onClick={() => setSelectedEventId(chg.id)}
                      className={`cursor-pointer transition-colors h-[52px] min-h-[52px] ${
                        isSelected
                          ? 'bg-[#1a2b42] border-l-[3px] border-[#0066FF] text-[#D6D6D6]'
                          : 'bg-transparent hover:bg-[#252525] text-[#A8A8A8]'
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-medium text-[#D6D6D6] text-[12px]">
                        {chg.action}
                      </td>
                      <td className="py-3 px-4">
                        <SourceBadge source={chg.service} />
                      </td>
                      <td className="py-3 px-4 font-mono text-[#D6D6D6] text-[12px] truncate max-w-[170px]" title={chg.resource_name}>
                        {chg.resource_name}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#7A7A7A] text-[12px] truncate max-w-[140px]" title={chg.actor_id}>
                        {chg.actor_id}
                      </td>
                      <td className="py-3 px-4 uppercase text-[10px]">
                        <span className={`px-2 py-0.5 rounded-full ${getActorBadge(chg.actor_type)}`}>
                          {chg.actor_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[#7A7A7A] text-[12px] tabular whitespace-nowrap">
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
        <div className="lg:col-span-4 space-y-[20px]">
          <div className="border border-[#3a3a3a] rounded-[10px] bg-[#1f1f1f] p-[20px] space-y-4 text-[13px] sticky top-6">
            <div className="flex items-center justify-between border-b border-[#3a3a3a] pb-3">
              <h3 className="font-semibold text-[#D6D6D6] text-[15px]">
                CloudTrail Inspector
              </h3>
              {selectedChange && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#171717] text-[#0066FF] border border-[#3a3a3a] uppercase font-bold">
                  {selectedChange.service}
                </span>
              )}
            </div>

            {selectedChange ? (
              <div className="space-y-4">
                <div>
                  <span className="text-[11px] font-sans uppercase tracking-[0.08em] font-semibold text-[#7A7A7A] block mb-1">
                    Action
                  </span>
                  <span className="font-mono font-bold text-[#D6D6D6] text-[14px] break-all">
                    {selectedChange.action}
                  </span>
                </div>

                <div className="p-3.5 rounded-[8px] bg-[#171717] border border-[#303030] text-[12px] space-y-2">
                  <div className="flex justify-between gap-2 border-b border-[#262626] pb-1.5">
                    <span className="text-[#7A7A7A] font-sans">Resource:</span>
                    <span className="text-[#D6D6D6] font-mono truncate font-bold" title={selectedChange.resource_name}>
                      {selectedChange.resource_name}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2 border-b border-[#262626] pb-1.5">
                    <span className="text-[#7A7A7A] font-sans">Actor Type:</span>
                    <span className="text-[#0066FF] font-semibold uppercase">
                      {selectedChange.actor_type}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2 border-b border-[#262626] pb-1.5">
                    <span className="text-[#7A7A7A] font-sans">Actor ID:</span>
                    <span className="text-[#D6D6D6] font-mono truncate" title={selectedChange.actor_id}>
                      {selectedChange.actor_id}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2 border-b border-[#262626] pb-1.5">
                    <span className="text-[#7A7A7A] font-sans">Region:</span>
                    <span className="text-[#D6D6D6] font-mono">{selectedChange.region}</span>
                  </div>
                  <div className="flex justify-between gap-2 border-b border-[#262626] pb-1.5">
                    <span className="text-[#7A7A7A] font-sans">Timestamp:</span>
                    <span className="text-[#D6D6D6] font-mono tabular">{new Date(selectedChange.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-[#7A7A7A] font-sans">Event ID:</span>
                    <span className="text-[#A8A8A8] font-mono truncate max-w-[190px]" title={selectedChange.raw_event_ref}>
                      {selectedChange.raw_event_ref || selectedChange.id}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-sans uppercase tracking-[0.08em] font-semibold text-[#7A7A7A] block">
                    Raw Evidence Reference
                  </span>
                  <div className="p-3 rounded-[8px] bg-[#171717] border border-[#303030] text-[11px] font-mono text-[#A8A8A8] break-all">
                    aws:cloudtrail:{selectedChange.region}:event:{selectedChange.raw_event_ref || selectedChange.id}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-[13px] text-[#7A7A7A] font-sans">
                Select an event from the stream to view full details.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
