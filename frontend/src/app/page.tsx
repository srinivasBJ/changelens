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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-[#2a2a2a]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg font-bold font-mono text-[#FFFFFF] uppercase tracking-wide">
              Operational Work Queue
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#0066FF]/15 text-[#0066FF] border border-[#0066FF]/30 font-bold">
              AWS us-east-2
            </span>
          </div>
          <p className="text-xs text-[#A0A0A0] mt-1">
            Real-time change impact synthesis linking CloudTrail, CloudWatch telemetry anomalies, and Hindsight operational memories.
          </p>
        </div>

        <div className="flex items-center gap-3 self-stretch sm:self-auto">
          <button
            onClick={handleInjectDemo}
            disabled={injecting}
            className="h-[44px] min-h-[44px] px-4 rounded-[8px] bg-[#0066FF] hover:bg-[#0052CC] text-[#FFFFFF] font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{injecting ? 'Injecting...' : 'Inject Demo Scenario'}</span>
          </button>
          <button
            onClick={loadData}
            disabled={loading}
            className="h-[44px] min-h-[44px] px-3.5 rounded-[8px] border border-[#2a2a2a] bg-transparent hover:bg-[#1a1a1a] text-[#A0A0A0] hover:text-[#FFFFFF] font-mono text-xs flex items-center gap-2 transition-colors disabled:opacity-50"
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
          <div className="border border-[#2a2a2a] rounded-[10px] bg-[#0a0a0a] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#2a2a2a] bg-[#111111] flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-[1px] text-[#666666] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#0066FF]" />
                Active Change-Impact Investigations ({investigations.length})
              </span>
              <span className="text-[11px] font-mono text-[#666666]">
                Click row to inspect
              </span>
            </div>

            <div className="divide-y divide-[#1a1a1a]">
              {investigations.map((inv) => {
                const isSelected = selectedInvId === inv.id;
                const isLive = inv.data_mode === 'live';

                return (
                  <div
                    key={inv.id}
                    onClick={() => setSelectedInvId(inv.id)}
                    className={`p-[20px] transition-colors cursor-pointer text-xs min-h-[52px] ${
                      isSelected
                        ? 'bg-[#0d1117] border-l-[3px] border-[#0066FF] text-[#FFFFFF]'
                        : 'bg-transparent hover:bg-[#0d1117] text-[#A0A0A0]'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider ${
                            isLive
                              ? 'bg-[#00FF88] text-[#000000]'
                              : 'bg-[#FFB800] text-[#000000]'
                          }`}
                        >
                          {isLive ? 'LIVE' : 'DEMO'}
                        </span>
                        <span className="font-mono font-bold text-[#FFFFFF]">
                          {inv.id}
                        </span>
                        <span className="text-[#333333]">·</span>
                        <span className="font-semibold text-[#FFFFFF] truncate max-w-[320px]">
                          {inv.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        {inv.impact_score && (
                          <ConfidenceBadge confidence={inv.impact_score.confidence} />
                        )}
                        <span className="font-mono text-[11px] text-[#666666]">
                          {new Date(inv.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#A0A0A0] font-mono">
                      <div className="flex items-center gap-4">
                        <span>
                          ANOMALIES:{' '}
                          <strong className="text-[#FFFFFF] font-mono">
                            {inv.anomalies.length}
                          </strong>
                        </span>
                        <span>
                          EVIDENCE:{' '}
                          <strong className="text-[#FFFFFF] font-mono">
                            {inv.evidence.length}
                          </strong>
                        </span>
                        <span>
                          HINDSIGHT:{' '}
                          <strong className="text-[#FFB800] font-mono">
                            {inv.historical_memories.length}
                          </strong>
                        </span>
                      </div>

                      <Link
                        href={`/investigations/${inv.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 text-xs font-mono text-[#0066FF] hover:underline font-semibold"
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
          <div className="border border-[#2a2a2a] rounded-[10px] bg-[#0a0a0a] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#2a2a2a] bg-[#111111] flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-[1px] text-[#666666] flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#0066FF]" />
                Recent CloudTrail Changes ({changes.length})
              </span>
              <Link
                href="/changes"
                className="text-xs font-mono text-[#0066FF] hover:underline transition-colors font-semibold"
              >
                View All Events →
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#111111] text-[#666666] uppercase text-[11px] tracking-[1px] border-b border-[#2a2a2a]">
                  <tr className="h-[44px]">
                    <th className="py-2.5 px-4 font-semibold">Action</th>
                    <th className="py-2.5 px-4 font-semibold">Service</th>
                    <th className="py-2.5 px-4 font-semibold">Resource</th>
                    <th className="py-2.5 px-4 font-semibold">Actor</th>
                    <th className="py-2.5 px-4 font-semibold">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a1a1a] text-[#A0A0A0]">
                  {changes.slice(0, 6).map((chg) => (
                    <tr
                      key={chg.id}
                      className="h-[52px] min-h-[52px] hover:bg-[#0d1117] transition-colors"
                    >
                      <td className="py-3 px-4 font-bold text-[#FFFFFF]">
                        {chg.action}
                      </td>
                      <td className="py-3 px-4">
                        <SourceBadge source={chg.service} />
                      </td>
                      <td className="py-3 px-4 text-[#A0A0A0] truncate max-w-[200px]" title={chg.resource_name}>
                        {chg.resource_name}
                      </td>
                      <td className="py-3 px-4 text-[#666666] truncate max-w-[160px]" title={chg.actor_id}>
                        {chg.actor_id}
                      </td>
                      <td className="py-3 px-4 text-[#666666] text-[11px]">
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
          <div className="border border-[#2a2a2a] rounded-[10px] bg-[#0a0a0a] p-[20px] space-y-[20px] sticky top-6">
            <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-3">
              <span className="text-[11px] font-mono font-bold uppercase tracking-[1px] text-[#666666]">
                Investigation Inspector
              </span>
              {selectedInvestigation && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#111111] text-[#A0A0A0] border border-[#2a2a2a]">
                  {selectedInvestigation.id}
                </span>
              )}
            </div>

            {selectedInvestigation ? (
              <div className="space-y-[20px] text-xs">
                {/* Identity & Status */}
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-[1px] text-[#666666]">
                    Incident Title
                  </div>
                  <div className="font-bold text-[#FFFFFF] mt-1 text-sm font-sans">
                    {selectedInvestigation.title}
                  </div>
                  <div className="flex items-center gap-2 mt-2.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#00FF88]/15 text-[#00FF88] border border-[#00FF88]/30 text-[10px] font-mono font-bold uppercase">
                      {selectedInvestigation.status}
                    </span>
                    {selectedInvestigation.impact_score && (
                      <ConfidenceBadge confidence={selectedInvestigation.impact_score.confidence} />
                    )}
                  </div>
                </div>

                {/* Score breakdown */}
                {selectedInvestigation.impact_score && (
                  <div className="p-3.5 rounded-[8px] bg-[#111111] border border-[#2a2a2a] space-y-2.5">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[11px] font-mono uppercase tracking-[1px] text-[#666666]">
                        Evidence Impact Score
                      </span>
                      <span className="text-lg font-bold font-mono text-[#0066FF]">
                        {selectedInvestigation.impact_score.overall.toFixed(2)}{' '}
                        <span className="text-[10px] text-[#666666] font-normal">/ 1.00</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-[#666666]">
                      <div className="flex justify-between border-b border-[#1a1a1a] pb-1">
                        <span>Metric (35%):</span>
                        <span className="text-[#FFFFFF] font-bold">
                          {selectedInvestigation.impact_score.metric_severity.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-[#1a1a1a] pb-1">
                        <span>Temporal (25%):</span>
                        <span className="text-[#FFFFFF] font-bold">
                          {selectedInvestigation.impact_score.temporal_proximity.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-[#1a1a1a] pb-1">
                        <span>Topology (20%):</span>
                        <span className="text-[#FFFFFF] font-bold">
                          {selectedInvestigation.impact_score.dependency_weight.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-[#1a1a1a] pb-1">
                        <span>Actor (10%):</span>
                        <span className="text-[#FFFFFF] font-bold">
                          {selectedInvestigation.impact_score.actor_context.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Hypothesis */}
                {selectedInvestigation.hypothesis && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-mono uppercase tracking-[1px] text-[#666666] font-semibold block">
                      Evidence-Supported Hypothesis
                    </span>
                    <p className="text-xs text-[#A0A0A0] leading-relaxed p-3 rounded-[8px] bg-[#111111] border border-[#2a2a2a] font-sans">
                      {selectedInvestigation.hypothesis}
                    </p>
                  </div>
                )}

                {/* Anomalies list */}
                <div className="space-y-2">
                  <span className="text-[11px] font-mono uppercase tracking-[1px] text-[#666666] font-semibold block">
                    Correlated Metric Anomalies ({selectedInvestigation.anomalies.length})
                  </span>
                  <div className="space-y-1.5 font-mono text-xs">
                    {selectedInvestigation.anomalies.slice(0, 4).map((a) => (
                      <div
                        key={a.id}
                        className="p-2.5 rounded-[8px] bg-[#111111] border border-[#2a2a2a] flex items-center justify-between"
                      >
                        <span className="text-[#A0A0A0] truncate max-w-[190px]">
                          {a.resource_name} · {a.metric_name}
                        </span>
                        <span className="text-[#FF3366] font-bold shrink-0">
                          {a.deviation_pct >= 0 ? `+${a.deviation_pct.toFixed(0)}%` : `${a.deviation_pct.toFixed(0)}%`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick actions */}
                <div className="pt-2 border-t border-[#2a2a2a]">
                  <Link
                    href={`/investigations/${selectedInvestigation.id}`}
                    className="w-full h-[44px] min-h-[44px] rounded-[8px] bg-[#0066FF] hover:bg-[#0052CC] text-[#FFFFFF] font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <span>Inspect Blast-Radius & Timeline</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-[#666666] font-mono">
                Select an investigation to inspect details.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
