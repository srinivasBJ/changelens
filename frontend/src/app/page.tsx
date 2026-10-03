'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Cpu,
  Layers,
  RotateCw,
  Zap,
} from 'lucide-react';
import { getChanges, getInvestigations, getStats } from '@/lib/api';
import { Change, DashboardStats, InvestigationCase } from '@/lib/types';
import { StatCard } from '@/components/StatCard';
import { ConfidenceBadge } from '@/components/ConfidenceBadge';
import { SourceBadge } from '@/components/SourceBadge';
import { HoverScrollText } from '@/components/HoverScrollText';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [investigations, setInvestigations] = useState<InvestigationCase[]>([]);
  const [changes, setChanges] = useState<Change[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvId, setSelectedInvId] = useState<string>('inv_live_001');
  const [hoveredInvId, setHoveredInvId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [s, invs, chgs] = await Promise.all([
        getStats(),
        getInvestigations(),
        getChanges(),
      ]);
      setStats(s);

      // Prioritize LIVE investigations first (inv_live_001 primary)
      const sortedInvs = [...invs].sort((a, b) => {
        if (a.id === 'inv_live_001') return -1;
        if (b.id === 'inv_live_001') return 1;
        const aIsLive = a.data_mode === 'live' && a.id !== 'inv_demo_001';
        const bIsLive = b.data_mode === 'live' && b.id !== 'inv_demo_001';
        if (aIsLive && !bIsLive) return -1;
        if (!aIsLive && bIsLive) return 1;
        return 0;
      });

      setInvestigations(sortedInvs);
      setChanges(chgs);

      // Default selection to inv_live_001 if available
      const liveCase = sortedInvs.find((i) => i.id === 'inv_live_001') || sortedInvs.find((i) => i.data_mode === 'live' && i.id !== 'inv_demo_001');
      if (liveCase && (!selectedInvId || selectedInvId === 'inv_demo_001' || !sortedInvs.some((i) => i.id === selectedInvId))) {
        setSelectedInvId(liveCase.id);
      } else if (sortedInvs.length > 0 && !sortedInvs.some((i) => i.id === selectedInvId)) {
        setSelectedInvId(sortedInvs[0].id);
      }
    } catch (e) {
      console.error('Failed to load dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedInvestigation =
    investigations.find((i) => i.id === selectedInvId) || investigations[0];

  const isLiveChange = (chg: Change): boolean => {
    if (chg.is_live !== undefined) return chg.is_live;
    if (chg.account_id && chg.account_id !== 'XXXXXXXXXXXX') return true;
    if (chg.raw_event_ref && !chg.raw_event_ref.includes('demo') && !chg.id.includes('demo')) return true;
    if (chg.action === 'PutFunctionConcurrency') return true;
    return false;
  };

  return (
    <div className="space-y-6">
      {/* Top Operational Status Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#2A2A2F]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[24px] font-sans font-semibold text-[#ECECEC] leading-[1.3] tracking-[-0.015em]">
              Operational Work Queue
            </h1>
            <span className="text-[11px] font-sans font-semibold px-2 py-0.5 rounded-full bg-[rgba(88,166,255,0.15)] text-[#58A6FF] border border-[rgba(88,166,255,0.3)]">
              AWS us-east-2
            </span>
          </div>
          <p className="text-[14px] font-sans font-normal text-[#A1A1AA] mt-1 leading-[1.55] prose-limit">
            Real-time change impact synthesis linking CloudTrail, CloudWatch telemetry anomalies, and Hindsight operational memories.
          </p>
        </div>

        <div className="flex items-center gap-3 self-stretch sm:self-auto">
          <button
            onClick={loadData}
            disabled={loading}
            className="h-[40px] px-3.5 rounded-[6px] border border-[#3F3F46] bg-[#17171A] hover:bg-[#232327] text-[#ECECEC] font-sans text-[13px] font-medium flex items-center gap-2 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#58A6FF]"
            title="Refresh Telemetry"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Telemetry</span>
          </button>
        </div>
      </div>

      {/* Dense Operational Statistics Strip (min-height 96px, 16px gap) */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
          <StatCard
            label="Active Invs"
            value={stats.active_investigations}
            icon={Layers}
            highlight={stats.active_investigations > 0}
          />
          <StatCard
            label="Recent Changes"
            value={stats.recent_changes}
            icon={Zap}
          />
          <StatCard
            label="Impact Events"
            value={stats.impact_events}
            icon={Activity}
          />
          <StatCard
            label="Hist Matches"
            value={stats.historical_matches}
            icon={BrainCircuit}
            subtext="Hindsight"
          />
          <StatCard
            label="Evidence"
            value={stats.evidence_count}
            icon={CheckCircle2}
            subtext="SHA-256"
          />
          <StatCard
            label="Agent Actions"
            value={stats.agent_actions}
            icon={Cpu}
          />
          <StatCard
            label="Approval Alerts"
            value={stats.approval_exceptions}
            icon={AlertTriangle}
            highlight={stats.approval_exceptions > 0}
          />
        </div>
      )}

      {/* Main Control-Plane Split: Investigations Table/List + Selected Inspector Panel (gap 16px) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left/Center Column: Active Investigations & Recent Changes (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Active Investigations Section */}
          <div className="border border-[#2A2A2F] rounded-[10px] bg-[#17171A] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#2A2A2F] bg-[#121214] flex items-center justify-between">
              <h2 className="text-[14px] font-sans font-semibold text-[#ECECEC] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#58A6FF]" />
                Active Change-Impact Investigations ({investigations.length})
              </h2>
              <span className="text-[11px] font-sans text-[#71717A]">
                Click row to inspect
              </span>
            </div>

            <div className="divide-y divide-[#2A2A2F]">
              {investigations.map((inv) => {
                const isSelected = selectedInvId === inv.id;
                const isLive = inv.id === 'inv_live_001' || (inv.data_mode === 'live' && inv.id !== 'inv_demo_001');

                return (
                  <div
                    key={inv.id}
                    onClick={() => setSelectedInvId(inv.id)}
                    onMouseEnter={() => setHoveredInvId(inv.id)}
                    onMouseLeave={() => setHoveredInvId(null)}
                    onFocus={() => setHoveredInvId(inv.id)}
                    onBlur={() => setHoveredInvId(null)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedInvId(inv.id);
                      }
                    }}
                    className={`p-4 transition-colors duration-150 cursor-pointer text-[13px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#58A6FF] ${
                      isSelected
                        ? 'bg-[#2F6FAD] text-[#FFFFFF]'
                        : 'bg-[#17171A] hover:bg-[#232327] text-[#A1A1AA]'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-sans font-bold tracking-wider border shrink-0 flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-white/20 text-white border-white/30'
                              : isLive
                              ? 'bg-[rgba(63,185,80,0.15)] text-[#3FB950] border-[rgba(63,185,80,0.3)]'
                              : 'bg-[rgba(210,153,34,0.15)] text-[#D29922] border-[rgba(210,153,34,0.3)]'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : isLive ? 'bg-[#3FB950]' : 'bg-[#D29922]'}`} />
                          {isLive ? 'LIVE' : 'DEMO'}
                        </span>
                        {isLive && inv.operational_state && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-sans font-bold uppercase border shrink-0 ${
                            isSelected
                              ? 'bg-white/20 text-white border-white/30'
                              : inv.operational_state === 'RESOLVED'
                              ? 'bg-[rgba(63,185,80,0.1)] text-[#3FB950] border-[rgba(63,185,80,0.25)]'
                              : 'bg-[rgba(210,153,34,0.15)] text-[#D29922] border-[rgba(210,153,34,0.3)]'
                          }`}>
                            {inv.operational_state}
                          </span>
                        )}
                        <span className={`font-mono text-[12px] font-bold shrink-0 ${isSelected ? 'text-[#FFFFFF]' : 'text-[#ECECEC]'}`}>
                          {inv.id}
                        </span>
                        <span className={`shrink-0 ${isSelected ? 'text-white/40' : 'text-[#71717A]'}`}>·</span>
                        <HoverScrollText
                          text={inv.title}
                          isSelected={isSelected}
                          isRowHovered={hoveredInvId === inv.id}
                          className={`font-sans font-semibold text-[14px] ${isSelected ? 'text-[#FFFFFF]' : 'text-[#ECECEC]'}`}
                        />
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        {inv.impact_score && (
                          <div className={isSelected ? 'brightness-125' : ''}>
                            <ConfidenceBadge confidence={inv.impact_score.confidence} />
                          </div>
                        )}
                        <span className={`font-mono text-[12px] tabular ${isSelected ? 'text-[#D9E6F2]' : 'text-[#71717A]'}`}>
                          {new Date(inv.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>

                    <div className={`flex flex-wrap items-center justify-between gap-3 text-[12px] font-sans ${isSelected ? 'text-[#D9E6F2]' : 'text-[#A1A1AA]'}`}>
                      <div className="flex items-center gap-4">
                        <span>
                          Anomalies:{' '}
                          <strong className={`font-mono tabular ${isSelected ? 'text-[#FFFFFF]' : 'text-[#ECECEC]'}`}>
                            {inv.anomalies.length}
                          </strong>
                          {isLive && <span className={isSelected ? 'text-white/70' : 'text-[#71717A]'}> (Verified)</span>}
                        </span>
                        <span>
                          Evidence:{' '}
                          <strong className={`font-mono tabular ${isSelected ? 'text-[#FFFFFF]' : 'text-[#ECECEC]'}`}>
                            {inv.evidence.length}
                          </strong>
                          <span className={isSelected ? 'text-white/70' : 'text-[#71717A]'}> (SHA-256)</span>
                        </span>
                        <span>
                          Hindsight:{' '}
                          <strong className={`font-mono tabular ${isSelected ? 'text-[#FFFFFF]' : 'text-[#D29922]'}`}>
                            {inv.historical_memories.length}
                          </strong>
                        </span>
                      </div>

                      <Link
                        href={`/investigations/${inv.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className={`inline-flex items-center gap-1.5 text-[13px] font-sans font-semibold hover:underline ${
                          isSelected ? 'text-[#FFFFFF]' : 'text-[#58A6FF]'
                        }`}
                      >
                        <span>Open Console</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent CloudTrail Changes Table */}
          <div className="border border-[#2A2A2F] rounded-[10px] bg-[#17171A] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#2A2A2F] bg-[#121214] flex items-center justify-between">
              <h2 className="text-[14px] font-sans font-semibold text-[#ECECEC] flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#58A6FF]" />
                Recent CloudTrail Changes ({changes.length})
              </h2>
              <Link
                href="/changes"
                className="text-[12px] font-sans text-[#58A6FF] hover:underline transition-colors font-medium"
              >
                View All Events →
              </Link>
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
                <tbody className="divide-y divide-[#2A2A2F] text-[#A1A1AA]">
                  {changes.slice(0, 6).map((chg) => {
                    const live = isLiveChange(chg);
                    return (
                      <tr
                        key={chg.id}
                        className="h-[48px] hover:bg-[#232327] transition-colors duration-150"
                      >
                        <td className="py-3 px-4 font-mono font-medium text-[#ECECEC] text-[12px]">
                          {chg.action}
                        </td>
                        <td className="py-3 px-4">
                          <SourceBadge source={chg.service} />
                        </td>
                        <td className="py-3 px-4 font-mono text-[#ECECEC] text-[12px] truncate max-w-[200px]" title={chg.resource_name}>
                          {chg.resource_name}
                        </td>
                        <td className="py-3 px-4 font-mono text-[#71717A] text-[12px] truncate max-w-[160px]" title={chg.actor_id}>
                          {chg.actor_id}
                        </td>
                        <td className="py-3 px-4 uppercase text-[10px]">
                          {live ? (
                            <span className="px-2 py-0.5 rounded-full font-mono font-bold inline-flex items-center gap-1.5 bg-[rgba(63,185,80,0.15)] text-[#3FB950] border border-[rgba(63,185,80,0.3)]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#3FB950]" />
                              LIVE
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full font-mono font-bold inline-flex items-center gap-1.5 bg-[#232327] text-[#71717A] border border-[#2A2A2F]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#71717A]" />
                              SEEDED
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-[#71717A] text-[12px] tabular">
                          {new Date(chg.timestamp).toLocaleTimeString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Inspector Panel: Selected Investigation Details (4 Cols) */}
        <div className="lg:col-span-4 space-y-5">
          <div className="border border-[#2A2A2F] rounded-[10px] bg-[#17171A] p-5 space-y-5 sticky top-6">
            <div className="flex items-center justify-between border-b border-[#2A2A2F] pb-3">
              <h3 className="text-[15px] font-sans font-semibold text-[#ECECEC]">
                Investigation Inspector
              </h3>
              {selectedInvestigation && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-[4px] bg-[#1E1E22] text-[#A1A1AA] border border-[#2A2A2F]">
                  {selectedInvestigation.id}
                </span>
              )}
            </div>

            {selectedInvestigation ? (
              <div className="space-y-4 text-[13px]">
                {/* Identity & Status */}
                <div>
                  <div className="text-[11px] font-sans uppercase tracking-[0.06em] font-semibold text-[#71717A]">
                    Incident Title
                  </div>
                  <div className="font-sans font-semibold text-[#ECECEC] mt-1 text-[14px]">
                    {selectedInvestigation.title}
                  </div>
                  {(() => {
                    const isSelectedLive = selectedInvestigation.id === 'inv_live_001' || (selectedInvestigation.data_mode === 'live' && selectedInvestigation.id !== 'inv_demo_001');
                    return (
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-sans font-bold uppercase border flex items-center gap-1.5 ${
                          isSelectedLive
                            ? 'bg-[rgba(63,185,80,0.15)] text-[#3FB950] border-[rgba(63,185,80,0.3)]'
                            : 'bg-[rgba(210,153,34,0.15)] text-[#D29922] border-[rgba(210,153,34,0.3)]'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isSelectedLive ? 'bg-[#3FB950]' : 'bg-[#D29922]'}`} />
                          {isSelectedLive ? 'LIVE AWS INCIDENT' : 'DEMO SCENARIO'}
                        </span>
                        {isSelectedLive && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-sans font-bold uppercase bg-[rgba(88,166,255,0.15)] text-[#58A6FF] border border-[rgba(88,166,255,0.3)]">
                            VERIFIED INCIDENT
                          </span>
                        )}
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-sans font-semibold uppercase bg-[#232327] text-[#A1A1AA] border border-[#2A2A2F]">
                          STATE: {selectedInvestigation.operational_state || selectedInvestigation.status}
                        </span>
                        {selectedInvestigation.impact_score && (
                          <ConfidenceBadge confidence={selectedInvestigation.impact_score.confidence} />
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Score breakdown */}
                {selectedInvestigation.impact_score && (
                  <div className="p-3.5 rounded-[6px] bg-[#1E1E22] border border-[#2A2A2F] space-y-2.5">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[11px] font-sans uppercase tracking-[0.06em] font-semibold text-[#71717A]">
                        Evidence Impact Score
                      </span>
                      <span className="text-[18px] font-sans font-bold text-[#58A6FF] tabular">
                        {selectedInvestigation.impact_score.overall.toFixed(2)}{' '}
                        <span className="text-[12px] text-[#71717A] font-normal">/ 1.00</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[12px] font-sans text-[#71717A]">
                      <div className="flex justify-between border-b border-[#2A2A2F] pb-1">
                        <span>Metric (35%):</span>
                        <span className="text-[#ECECEC] font-mono font-bold tabular">
                          {selectedInvestigation.impact_score.metric_severity.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-[#2A2A2F] pb-1">
                        <span>Temporal (25%):</span>
                        <span className="text-[#ECECEC] font-mono font-bold tabular">
                          {selectedInvestigation.impact_score.temporal_proximity.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-[#2A2A2F] pb-1">
                        <span>Topology (20%):</span>
                        <span className="text-[#ECECEC] font-mono font-bold tabular">
                          {selectedInvestigation.impact_score.dependency_weight.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-[#2A2A2F] pb-1">
                        <span>Actor (10%):</span>
                        <span className="text-[#ECECEC] font-mono font-bold tabular">
                          {selectedInvestigation.impact_score.actor_context.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Hypothesis */}
                {selectedInvestigation.hypothesis && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-sans uppercase tracking-[0.06em] text-[#71717A] font-semibold block">
                      Evidence-Supported Hypothesis
                    </span>
                    <p className="text-[13px] text-[#A1A1AA] leading-[1.55] p-3 rounded-[6px] bg-[#1E1E22] border border-[#2A2A2F] font-sans">
                      {selectedInvestigation.hypothesis}
                    </p>
                  </div>
                )}

                {/* Anomalies list */}
                <div className="space-y-2">
                  <span className="text-[11px] font-sans uppercase tracking-[0.06em] text-[#71717A] font-semibold block">
                    Correlated Metric Anomalies ({selectedInvestigation.anomalies.length})
                  </span>
                  <div className="space-y-1.5 text-[12px]">
                    {selectedInvestigation.anomalies.slice(0, 4).map((a) => (
                      <div
                        key={a.id}
                        className="p-2.5 rounded-[6px] bg-[#1E1E22] border border-[#2A2A2F] flex items-center justify-between"
                      >
                        <span className="text-[#A1A1AA] truncate max-w-[190px] font-mono text-[11px]">
                          {a.resource_name} · {a.metric_name}
                        </span>
                        <span className="text-[#F85149] font-bold font-mono shrink-0 tabular text-[11px]">
                          {a.deviation_pct >= 0 ? `+${a.deviation_pct.toFixed(0)}%` : `${a.deviation_pct.toFixed(0)}%`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick actions */}
                <div className="pt-2 border-t border-[#2A2A2F]">
                  <Link
                    href={`/investigations/${selectedInvestigation.id}`}
                    className="w-full h-[40px] rounded-[6px] bg-[#2F6FAD] hover:bg-[#3579BD] text-[#FFFFFF] font-sans text-[13px] font-medium flex items-center justify-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#58A6FF]"
                  >
                    <span>
                      {selectedInvestigation.id === 'inv_live_001' || (selectedInvestigation.data_mode === 'live' && selectedInvestigation.id !== 'inv_demo_001')
                        ? 'Inspect Live Blast-Radius & Timeline'
                        : 'Inspect Demo Blast-Radius & Timeline'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-[13px] text-[#71717A] font-sans">
                Select an investigation to inspect details.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
