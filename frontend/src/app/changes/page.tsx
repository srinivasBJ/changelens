'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, RotateCw, Search, Zap } from 'lucide-react';
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

  const isLiveChange = (chg: Change): boolean => {
    if (chg.is_live !== undefined) return chg.is_live;
    if (chg.account_id && chg.account_id !== 'XXXXXXXXXXXX') return true;
    if (chg.raw_event_ref && !chg.raw_event_ref.includes('demo') && !chg.id.includes('demo')) return true;
    if (chg.action === 'PutFunctionConcurrency') return true;
    return false;
  };

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

  const getActorBadge = (type: string, isSelected: boolean) => {
    if (isSelected) {
      return 'bg-white/20 text-white border border-white/30 font-semibold';
    }
    switch (type.toLowerCase()) {
      case 'human':
        return 'bg-[rgba(88,166,255,0.15)] text-[#58A6FF] border border-[rgba(88,166,255,0.3)] font-semibold';
      case 'automation':
        return 'bg-[#232327] text-[#A1A1AA] border border-[#2A2A2F] font-semibold';
      case 'ai_agent':
        return 'bg-[rgba(88,166,255,0.15)] text-[#58A6FF] border border-[rgba(88,166,255,0.3)] font-semibold';
      default:
        return 'bg-[#232327] text-[#A1A1AA] border border-[#2A2A2F]';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#2A2A2F]">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[13px] font-sans text-[#A1A1AA] hover:text-[#ECECEC] transition-colors mr-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Console</span>
            </Link>
            <span className="text-[#2A2A2F]">/</span>
            <h1 className="text-[24px] font-sans font-semibold text-[#ECECEC] leading-[1.3] tracking-[-0.015em] flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#58A6FF]" />
              <span>CloudTrail Infrastructure Changes</span>
            </h1>
          </div>
          <p className="text-[14px] font-sans font-normal text-[#A1A1AA] mt-1 leading-[1.55] prose-limit">
            Normalized configuration modification events across monitored AWS services in us-east-2.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="h-[40px] px-4 rounded-[6px] border border-[#3F3F46] bg-[#17171A] hover:bg-[#232327] text-[#ECECEC] font-sans text-[13px] font-medium flex items-center gap-2 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#58A6FF]"
          title="Refresh"
        >
          <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Sync Events</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 p-4 rounded-[10px] border border-[#2A2A2F] bg-[#17171A]">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#71717A] absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Filter by action, resource, or actor ARN..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full h-[40px] pl-10 pr-4 bg-[#1E1E22] border border-[#3F3F46] rounded-[6px] text-[13px] font-mono text-[#ECECEC] placeholder-[#71717A] focus:outline-none focus:border-[#58A6FF]"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-sans uppercase font-semibold tracking-[0.06em] text-[#71717A]">SERVICE:</span>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="h-[40px] bg-[#1E1E22] border border-[#3F3F46] rounded-[6px] text-[13px] font-sans text-[#ECECEC] px-3 focus:outline-none focus:border-[#58A6FF] uppercase"
            >
              {services.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-sans uppercase font-semibold tracking-[0.06em] text-[#71717A]">ACTOR:</span>
            <select
              value={selectedActorType}
              onChange={(e) => setSelectedActorType(e.target.value)}
              className="h-[40px] bg-[#1E1E22] border border-[#3F3F46] rounded-[6px] text-[13px] font-sans text-[#ECECEC] px-3 focus:outline-none focus:border-[#58A6FF] uppercase"
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left/Center Event Table (8 Cols) */}
        <div className="lg:col-span-8 border border-[#2A2A2F] rounded-[10px] bg-[#17171A] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#2A2A2F] bg-[#121214] flex items-center justify-between text-[13px]">
            <h2 className="font-semibold text-[#ECECEC] text-[14px]">
              Events Stream ({filteredChanges.length})
            </h2>
            <span className="text-[#71717A] text-[11px] font-sans">
              Click row to inspect event details
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] font-sans">
              <thead className="bg-[#121214] text-[#71717A] uppercase text-[11px] font-semibold tracking-[0.06em] border-b border-[#2A2A2F]">
                <tr className="h-[40px]">
                  <th className="py-2 px-4 font-semibold">Action</th>
                  <th className="py-2 px-4 font-semibold">Service</th>
                  <th className="py-2 px-4 font-semibold">Resource</th>
                  <th className="py-2 px-4 font-semibold">Actor</th>
                  <th className="py-2 px-4 font-semibold">Provenance</th>
                  <th className="py-2 px-4 font-semibold">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2F]">
                {filteredChanges.map((chg) => {
                  const isSelected = selectedChange?.id === chg.id;
                  const live = isLiveChange(chg);

                  return (
                    <tr
                      key={chg.id}
                      onClick={() => setSelectedEventId(chg.id)}
                      className={`cursor-pointer transition-colors duration-150 h-[48px] ${
                        isSelected
                          ? 'bg-[#2F6FAD] text-[#FFFFFF]'
                          : 'bg-[#17171A] hover:bg-[#232327] text-[#A1A1AA]'
                      }`}
                    >
                      <td className={`py-3 px-4 font-mono font-medium text-[12px] ${isSelected ? 'text-[#FFFFFF]' : 'text-[#ECECEC]'}`}>
                        {chg.action}
                      </td>
                      <td className="py-3 px-4">
                        <SourceBadge source={chg.service} />
                      </td>
                      <td className={`py-3 px-4 font-mono text-[12px] truncate max-w-[170px] ${isSelected ? 'text-[#FFFFFF]' : 'text-[#ECECEC]'}`} title={chg.resource_name}>
                        {chg.resource_name}
                      </td>
                      <td className={`py-3 px-4 font-mono text-[12px] truncate max-w-[140px] ${isSelected ? 'text-[#D9E6F2]' : 'text-[#71717A]'}`} title={chg.actor_id}>
                        {chg.actor_id}
                      </td>
                      <td className="py-3 px-4 uppercase text-[10px]">
                        {live ? (
                          <span className={`px-2 py-0.5 rounded-full font-mono font-bold inline-flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-white/20 text-white border border-white/30'
                              : 'bg-[rgba(63,185,80,0.15)] text-[#3FB950] border border-[rgba(63,185,80,0.3)]'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-[#3FB950]'}`} />
                            LIVE
                          </span>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-full font-mono font-bold inline-flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-white/20 text-white border border-white/30'
                              : 'bg-[#232327] text-[#71717A] border border-[#2A2A2F]'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-[#71717A]'}`} />
                            SEEDED
                          </span>
                        )}
                      </td>
                      <td className={`py-3 px-4 font-mono text-[12px] tabular whitespace-nowrap ${isSelected ? 'text-[#D9E6F2]' : 'text-[#71717A]'}`}>
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
        <div className="lg:col-span-4 space-y-5">
          <div className="border border-[#2A2A2F] rounded-[10px] bg-[#17171A] p-5 space-y-4 text-[13px] sticky top-6">
            <div className="flex items-center justify-between border-b border-[#2A2A2F] pb-3">
              <h3 className="font-semibold text-[#ECECEC] text-[15px]">
                CloudTrail Inspector
              </h3>
              {selectedChange && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1E1E22] text-[#58A6FF] border border-[#2A2A2F] uppercase font-bold">
                  {selectedChange.service}
                </span>
              )}
            </div>

            {selectedChange ? (
              <div className="space-y-4">
                <div>
                  <span className="text-[11px] font-sans uppercase tracking-[0.06em] font-semibold text-[#71717A] block mb-1">
                    Action
                  </span>
                  <span className="font-mono font-bold text-[#ECECEC] text-[14px] break-all">
                    {selectedChange.action}
                  </span>
                </div>

                <div className="p-3.5 rounded-[6px] bg-[#1E1E22] border border-[#2A2A2F] text-[12px] space-y-2">
                  <div className="flex justify-between gap-2 border-b border-[#2A2A2F] pb-1.5">
                    <span className="text-[#71717A] font-sans">Provenance:</span>
                    {isLiveChange(selectedChange) ? (
                      <span className="text-[#3FB950] font-mono font-bold text-[11px] inline-flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#3FB950]" />
                        LIVE AWS CLOUDTRAIL
                      </span>
                    ) : (
                      <span className="text-[#71717A] font-mono font-bold text-[11px] inline-flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#71717A]" />
                        SEEDED DEMO RECORD
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between gap-2 border-b border-[#2A2A2F] pb-1.5">
                    <span className="text-[#71717A] font-sans">Resource:</span>
                    <span className="text-[#ECECEC] font-mono truncate font-bold" title={selectedChange.resource_name}>
                      {selectedChange.resource_name}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2 border-b border-[#2A2A2F] pb-1.5">
                    <span className="text-[#71717A] font-sans">Actor Type:</span>
                    <span className="text-[#58A6FF] font-semibold uppercase">
                      {selectedChange.actor_type}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2 border-b border-[#2A2A2F] pb-1.5">
                    <span className="text-[#71717A] font-sans">Actor ID:</span>
                    <span className="text-[#ECECEC] font-mono truncate" title={selectedChange.actor_id}>
                      {selectedChange.actor_id}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2 border-b border-[#2A2A2F] pb-1.5">
                    <span className="text-[#71717A] font-sans">Region:</span>
                    <span className="text-[#ECECEC] font-mono">{selectedChange.region}</span>
                  </div>
                  <div className="flex justify-between gap-2 border-b border-[#2A2A2F] pb-1.5">
                    <span className="text-[#71717A] font-sans">Timestamp:</span>
                    <span className="text-[#ECECEC] font-mono tabular">{new Date(selectedChange.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-[#71717A] font-sans">Event ID:</span>
                    <span className="text-[#A1A1AA] font-mono truncate max-w-[190px]" title={selectedChange.raw_event_ref}>
                      {selectedChange.raw_event_ref || selectedChange.id}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-sans uppercase tracking-[0.06em] font-semibold text-[#71717A] block">
                    Raw Evidence Reference
                  </span>
                  <div className="p-3 rounded-[6px] bg-[#1E1E22] border border-[#2A2A2F] text-[11px] font-mono text-[#A1A1AA] break-all">
                    aws:cloudtrail:{selectedChange.region}:event:{selectedChange.raw_event_ref || selectedChange.id}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-[13px] text-[#71717A] font-sans">
                Select an event from the stream to view full details.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
