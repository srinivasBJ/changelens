'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Clock,
  Cpu,
  Layers,
  Play,
  RotateCw,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import { getChanges, getInvestigations, getStats, injectDemoChange } from '@/lib/api';
import { Change, DashboardStats, InvestigationCase } from '@/lib/types';
import { StatCard } from '@/components/StatCard';
import { ConfidenceBadge } from '@/components/ConfidenceBadge';
import { SourceBadge } from '@/components/SourceBadge';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [investigations, setInvestigations] = useState<InvestigationCase[]>([]);
  const [changes, setChanges] = useState<Change[]>([]);
  const [loading, setLoading] = useState(true);
  const [injecting, setInjecting] = useState(false);
  const [selectedInvId, setSelectedInvId] = useState<string>('inv_live_001');

  const loadData = async () => {
    try {
      setLoading(true);
      const [s, invs, chgs] = await Promise.all([
        getStats(),
        getInvestigations(),
        getChanges(),
      ]);
      setStats(s);
      setInvestigations(invs);
      setChanges(chgs);
      if (invs.length > 0 && !invs.some((i) => i.id === selectedInvId)) {
        setSelectedInvId(invs[0].id);
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

  const handleInjectDemo = async () => {
    try {
      setInjecting(true);
      await injectDemoChange();
      await loadData();
    } catch (e) {
      console.error('Failed to inject demo change:', e);
    } finally {
      setInjecting(false);
    }
  };

  const selectedInvestigation =
    investigations.find((i) => i.id === selectedInvId) || investigations[0];

  return (
    <div className="space-y-[32px]">
      {/* Top Operational Status Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-[#3a3a3a]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[24px] font-sans font-semibold text-[#D6D6D6] leading-[1.3] tracking-[-0.015em]">
              Operational Work Queue
            </h1>
            <span className="text-[11px] font-sans font-bold px-2 py-0.5 rounded-full bg-[#0066FF]/15 text-[#0066FF] border border-[#0066FF]/30">
              AWS us-east-2
            </span>
          </div>
          <p className="text-[14px] font-sans font-normal text-[#A8A8A8] mt-1 leading-[1.55] prose-limit">
            Real-time change impact synthesis linking CloudTrail, CloudWatch telemetry anomalies, and Hindsight operational memories.
          </p>
        </div>

        <div className="flex items-center gap-3 self-stretch sm:self-auto">
          <button
            onClick={handleInjectDemo}
            disabled={injecting}
            className="h-[44px] min-h-[44px] px-4 rounded-[8px] bg-[#0066FF] hover:bg-[#0052CC] text-[#FFFFFF] font-sans text-[14px] font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{injecting ? 'Injecting...' : 'Inject Demo Scenario'}</span>
          </button>
          <button
            onClick={loadData}
            disabled={loading}
            className="h-[44px] min-h-[44px] px-3.5 rounded-[8px] border border-[#3a3a3a] bg-transparent hover:bg-[#333333] text-[#A8A8A8] hover:text-[#D6D6D6] font-sans text-[14px] font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
            title="Refresh Telemetry"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Dense Operational Statistics Strip (20px gap, 20px padding) */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-[20px]">
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

      {/* Main Control-Plane Split: Investigations Table/List + Selected Inspector Panel (gap 20px) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-[20px]">
        {/* Left/Center Column: Active Investigations & Recent Changes (8 Cols) */}
        <div className="lg:col-span-8 space-y-[32px]">
          {/* Active Investigations Section */}
          <div className="border border-[#3a3a3a] rounded-[10px] bg-[#1f1f1f] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#3a3a3a] bg-[#171717] flex items-center justify-between">
              <h2 className="text-[15px] font-sans font-semibold text-[#D6D6D6] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#0066FF]" />
                Active Change-Impact Investigations ({investigations.length})
              </h2>
              <span className="text-[12px] font-sans text-[#7A7A7A]">
                Click row to inspect
              </span>
            </div>

            <div className="divide-y divide-[#2a2a2a]">
              {investigations.map((inv) => {
                const isSelected = selectedInvId === inv.id;
                const isLive = inv.data_mode === 'live';

                return (
                  <div
                    key={inv.id}
                    onClick={() => setSelectedInvId(inv.id)}
                    className={`p-[20px] transition-colors cursor-pointer text-[13px] min-h-[52px] ${
                      isSelected
                        ? 'bg-[#1a2b42] border-l-[3px] border-[#0066FF] text-[#D6D6D6]'
                        : 'bg-transparent hover:bg-[#252525] text-[#A8A8A8]'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-sans font-bold tracking-wider ${
                            isLive
                              ? 'bg-[#00FF88] text-[#000000]'
                              : 'bg-[#FFB800] text-[#000000]'
                          }`}
                        >
                          {isLive ? 'LIVE' : 'DEMO'}
                        </span>
                        <span className="font-mono text-[12px] font-bold text-[#D6D6D6]">
                          {inv.id}
                        </span>
                        <span className="text-[#444444]">·</span>
                        <span className="font-sans font-semibold text-[14px] text-[#D6D6D6] truncate max-w-[320px]">
                          {inv.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        {inv.impact_score && (
                          <ConfidenceBadge confidence={inv.impact_score.confidence} />
                        )}
                        <span className="font-mono text-[12px] text-[#7A7A7A] tabular">
                          {new Date(inv.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 text-[12px] text-[#A8A8A8] font-sans">
                      <div className="flex items-center gap-4">
                        <span>
                          Anomalies:{' '}
                          <strong className="text-[#D6D6D6] font-mono tabular">
                            {inv.anomalies.length}
                          </strong>
                        </span>
                        <span>
                          Evidence:{' '}
                          <strong className="text-[#D6D6D6] font-mono tabular">
                            {inv.evidence.length}
                          </strong>
                        </span>
                        <span>
                          Hindsight:{' '}
                          <strong className="text-[#FFB800] font-mono tabular">
                            {inv.historical_memories.length}
                          </strong>
                        </span>
                      </div>

                      <Link
                        href={`/investigations/${inv.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 text-[13px] font-sans text-[#0066FF] hover:underline font-semibold"
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
          <div className="border border-[#3a3a3a] rounded-[10px] bg-[#1f1f1f] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#3a3a3a] bg-[#171717] flex items-center justify-between">
              <h2 className="text-[15px] font-sans font-semibold text-[#D6D6D6] flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#0066FF]" />
                Recent CloudTrail Changes ({changes.length})
              </h2>
              <Link
                href="/changes"
                className="text-[13px] font-sans text-[#0066FF] hover:underline transition-colors font-semibold"
              >
                View All Events →
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px] font-sans">
                <thead className="bg-[#171717] text-[#7A7A7A] uppercase text-[11px] font-semibold tracking-[0.08em] border-b border-[#3a3a3a]">
                  <tr className="h-[44px]">
                    <th className="py-2.5 px-4 font-semibold">Action</th>
                    <th className="py-2.5 px-4 font-semibold">Service</th>
                    <th className="py-2.5 px-4 font-semibold">Resource</th>
                    <th className="py-2.5 px-4 font-semibold">Actor</th>
                    <th className="py-2.5 px-4 font-semibold">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a2a2a] text-[#A8A8A8]">
                  {changes.slice(0, 6).map((chg) => (
                    <tr
                      key={chg.id}
                      className="h-[52px] min-h-[52px] hover:bg-[#252525] transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-medium text-[#D6D6D6] text-[12px]">
                        {chg.action}
                      </td>
                      <td className="py-3 px-4">
                        <SourceBadge source={chg.service} />
                      </td>
                      <td className="py-3 px-4 font-mono text-[#D6D6D6] text-[12px] truncate max-w-[200px]" title={chg.resource_name}>
                        {chg.resource_name}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#7A7A7A] text-[12px] truncate max-w-[160px]" title={chg.actor_id}>
                        {chg.actor_id}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#7A7A7A] text-[12px] tabular">
                        {new Date(chg.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Inspector Panel: Selected Investigation Details (4 Cols) */}
        <div className="lg:col-span-4 space-y-[20px]">
          <div className="border border-[#3a3a3a] rounded-[10px] bg-[#1f1f1f] p-[20px] space-y-[20px] sticky top-6">
            <div className="flex items-center justify-between border-b border-[#3a3a3a] pb-3">
              <h3 className="text-[15px] font-sans font-semibold text-[#D6D6D6]">
                Investigation Inspector
              </h3>
              {selectedInvestigation && (
                <span className="text-[12px] font-mono px-2 py-0.5 rounded-[4px] bg-[#171717] text-[#A8A8A8] border border-[#3a3a3a]">
                  {selectedInvestigation.id}
                </span>
              )}
            </div>

            {selectedInvestigation ? (
              <div className="space-y-[20px] text-[13px]">
                {/* Identity & Status */}
                <div>
                  <div className="text-[11px] font-sans uppercase tracking-[0.08em] font-semibold text-[#7A7A7A]">
                    Incident Title
                  </div>
                  <div className="font-sans font-semibold text-[#D6D6D6] mt-1 text-[15px]">
                    {selectedInvestigation.title}
                  </div>
                  <div className="flex items-center gap-2 mt-2.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#00FF88]/15 text-[#00FF88] border border-[#00FF88]/30 text-[10px] font-sans font-bold uppercase">
                      {selectedInvestigation.status}
                    </span>
                    {selectedInvestigation.impact_score && (
                      <ConfidenceBadge confidence={selectedInvestigation.impact_score.confidence} />
                    )}
                  </div>
                </div>

                {/* Score breakdown */}
                {selectedInvestigation.impact_score && (
                  <div className="p-3.5 rounded-[8px] bg-[#171717] border border-[#303030] space-y-2.5">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[11px] font-sans uppercase tracking-[0.08em] font-semibold text-[#7A7A7A]">
                        Evidence Impact Score
                      </span>
                      <span className="text-[18px] font-sans font-bold text-[#0066FF] tabular">
                        {selectedInvestigation.impact_score.overall.toFixed(2)}{' '}
                        <span className="text-[12px] text-[#7A7A7A] font-normal">/ 1.00</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[12px] font-sans text-[#7A7A7A]">
                      <div className="flex justify-between border-b border-[#262626] pb-1">
                        <span>Metric (35%):</span>
                        <span className="text-[#D6D6D6] font-mono font-bold tabular">
                          {selectedInvestigation.impact_score.metric_severity.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-[#262626] pb-1">
                        <span>Temporal (25%):</span>
                        <span className="text-[#D6D6D6] font-mono font-bold tabular">
                          {selectedInvestigation.impact_score.temporal_proximity.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-[#262626] pb-1">
                        <span>Topology (20%):</span>
                        <span className="text-[#D6D6D6] font-mono font-bold tabular">
                          {selectedInvestigation.impact_score.dependency_weight.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-[#262626] pb-1">
                        <span>Actor (10%):</span>
                        <span className="text-[#D6D6D6] font-mono font-bold tabular">
                          {selectedInvestigation.impact_score.actor_context.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Hypothesis */}
                {selectedInvestigation.hypothesis && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-sans uppercase tracking-[0.08em] text-[#7A7A7A] font-semibold block">
                      Evidence-Supported Hypothesis
                    </span>
                    <p className="text-[13px] text-[#A8A8A8] leading-[1.55] p-3 rounded-[8px] bg-[#171717] border border-[#303030] font-sans">
                      {selectedInvestigation.hypothesis}
                    </p>
                  </div>
                )}

                {/* Anomalies list */}
                <div className="space-y-2">
                  <span className="text-[11px] font-sans uppercase tracking-[0.08em] text-[#7A7A7A] font-semibold block">
                    Correlated Metric Anomalies ({selectedInvestigation.anomalies.length})
                  </span>
                  <div className="space-y-1.5 text-[12px]">
                    {selectedInvestigation.anomalies.slice(0, 4).map((a) => (
                      <div
                        key={a.id}
                        className="p-2.5 rounded-[8px] bg-[#171717] border border-[#303030] flex items-center justify-between"
                      >
                        <span className="text-[#A8A8A8] truncate max-w-[190px] font-mono">
                          {a.resource_name} · {a.metric_name}
                        </span>
                        <span className="text-[#FF3366] font-bold font-mono shrink-0 tabular">
                          {a.deviation_pct >= 0 ? `+${a.deviation_pct.toFixed(0)}%` : `${a.deviation_pct.toFixed(0)}%`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick actions */}
                <div className="pt-2 border-t border-[#3a3a3a]">
                  <Link
                    href={`/investigations/${selectedInvestigation.id}`}
                    className="w-full h-[44px] min-h-[44px] rounded-[8px] bg-[#0066FF] hover:bg-[#0052CC] text-[#FFFFFF] font-sans text-[14px] font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <span>Inspect Blast-Radius & Timeline</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-[13px] text-[#7A7A7A] font-sans">
                Select an investigation to inspect details.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
