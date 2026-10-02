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
  ChevronRight,
  ExternalLink,
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
    <div className="space-y-4">
      {/* Top Operational Status Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#222733]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold font-mono text-slate-100 uppercase tracking-wide">
              Operational Work Queue
            </h1>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#161a24] text-blue-400 border border-blue-900/50">
              AWS us-east-2
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time change impact synthesis linking CloudTrail, CloudWatch telemetry anomalies, and Hindsight operational memories.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={handleInjectDemo}
            disabled={injecting}
            className="flex-1 sm:flex-none px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Play className="w-3 h-3 fill-current" />
            {injecting ? 'Injecting...' : 'Inject Demo Scenario'}
          </button>
          <button
            onClick={loadData}
            disabled={loading}
            className="px-2.5 py-1.5 rounded border border-[#222733] bg-[#13161c] hover:bg-[#1a1e27] text-slate-300 font-mono text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title="Refresh Telemetry"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Dense Operational Statistics Strip */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
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

      {/* Main Control-Plane Split: Investigations Table/List + Selected Inspector Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left/Center Column: Active Investigations & Recent Changes (7 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Active Investigations Section */}
          <div className="border border-[#222733] rounded bg-[#13161c] overflow-hidden">
            <div className="px-3 py-2 border-b border-[#222733] bg-[#0e1116] flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                Active Change-Impact Investigations ({investigations.length})
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Click row to inspect
              </span>
            </div>

            <div className="divide-y divide-[#1e232d]">
              {investigations.map((inv) => {
                const isSelected = selectedInvId === inv.id;
                const isLive = inv.data_mode === 'live';

                return (
                  <div
                    key={inv.id}
                    onClick={() => setSelectedInvId(inv.id)}
                    className={`p-3 transition-colors cursor-pointer text-xs ${
                      isSelected
                        ? 'bg-[#1a2b4c] border-l-4 border-blue-500 text-white'
                        : 'hover:bg-[#181c24] text-slate-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold tracking-wider ${
                            isLive
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                              : 'bg-amber-950 text-amber-300 border border-amber-700'
                          }`}
                        >
                          {isLive ? 'LIVE AWS' : 'DEMO'}
                        </span>
                        <span className="font-mono font-bold text-slate-200">
                          {inv.id}
                        </span>
                        <span className="text-slate-500">·</span>
                        <span className="font-semibold text-slate-100 truncate max-w-[280px]">
                          {inv.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {inv.impact_score && (
                          <ConfidenceBadge confidence={inv.impact_score.confidence} />
                        )}
                        <span className="font-mono text-[10px] text-slate-400">
                          {new Date(inv.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 font-mono">
                      <div className="flex items-center gap-3">
                        <span>
                          ANOMALIES:{' '}
                          <strong className="text-slate-200 font-mono">
                            {inv.anomalies.length}
                          </strong>
                        </span>
                        <span>
                          EVIDENCE:{' '}
                          <strong className="text-slate-200 font-mono">
                            {inv.evidence.length}
                          </strong>
                        </span>
                        <span>
                          HINDSIGHT:{' '}
                          <strong className="text-amber-400 font-mono">
                            {inv.historical_memories.length}
                          </strong>
                        </span>
                      </div>

                      <Link
                        href={`/investigations/${inv.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-[11px] font-mono text-blue-400 hover:text-blue-300 hover:underline"
                      >
                        <span>Open Console</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent CloudTrail Changes Table */}
          <div className="border border-[#222733] rounded bg-[#13161c] overflow-hidden">
            <div className="px-3 py-2 border-b border-[#222733] bg-[#0e1116] flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-blue-400" />
                Recent CloudTrail Changes ({changes.length})
              </span>
              <Link
                href="/changes"
                className="text-[11px] font-mono text-blue-400 hover:text-blue-300 transition-colors"
              >
                View All Events →
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#0a0c0f] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#222733]">
                  <tr>
                    <th className="py-2 px-3">Action</th>
                    <th className="py-2 px-3">Service</th>
                    <th className="py-2 px-3">Resource</th>
                    <th className="py-2 px-3">Actor</th>
                    <th className="py-2 px-3">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e232d] text-slate-300">
                  {changes.slice(0, 6).map((chg) => (
                    <tr key={chg.id} className="hover:bg-[#181c24] transition-colors">
                      <td className="py-2 px-3 font-bold text-slate-100">
                        {chg.action}
                      </td>
                      <td className="py-2 px-3">
                        <SourceBadge source={chg.service} />
                      </td>
                      <td className="py-2 px-3 text-slate-300 truncate max-w-[180px]" title={chg.resource_name}>
                        {chg.resource_name}
                      </td>
                      <td className="py-2 px-3 text-slate-400 truncate max-w-[140px]" title={chg.actor_id}>
                        {chg.actor_id}
                      </td>
                      <td className="py-2 px-3 text-slate-400 text-[10px]">
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
        <div className="lg:col-span-4 space-y-4">
          <div className="border border-[#222733] rounded bg-[#13161c] overflow-hidden sticky top-4">
            <div className="px-3 py-2 border-b border-[#222733] bg-[#0e1116] flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                Investigation Inspector
              </span>
              {selectedInvestigation && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#1e232d] text-slate-300">
                  {selectedInvestigation.id}
                </span>
              )}
            </div>

            {selectedInvestigation ? (
              <div className="p-3.5 space-y-4 text-xs">
                {/* Identity & Status */}
                <div>
                  <div className="text-[10px] font-mono uppercase text-slate-400">
                    Incident Title
                  </div>
                  <div className="font-bold text-slate-100 mt-0.5 text-sm">
                    {selectedInvestigation.title}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800 text-[10px] font-mono font-bold uppercase">
                      {selectedInvestigation.status}
                    </span>
                    {selectedInvestigation.impact_score && (
                      <ConfidenceBadge confidence={selectedInvestigation.impact_score.confidence} />
                    )}
                  </div>
                </div>

                {/* Score breakdown */}
                {selectedInvestigation.impact_score && (
                  <div className="p-2.5 rounded bg-[#0d0f12] border border-[#222733] space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[10px] font-mono uppercase text-slate-400">
                        Evidence Impact Score
                      </span>
                      <span className="text-base font-bold font-mono text-blue-400">
                        {selectedInvestigation.impact_score.overall.toFixed(2)}{' '}
                        <span className="text-[10px] text-slate-400 font-normal">/ 1.00</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono text-slate-400">
                      <div className="flex justify-between border-b border-[#1f242e] pb-0.5">
                        <span>Metric Sev (35%):</span>
                        <span className="text-slate-200 font-bold">
                          {selectedInvestigation.impact_score.metric_severity.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-[#1f242e] pb-0.5">
                        <span>Temporal (25%):</span>
                        <span className="text-slate-200 font-bold">
                          {selectedInvestigation.impact_score.temporal_proximity.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-[#1f242e] pb-0.5">
                        <span>Topology (20%):</span>
                        <span className="text-slate-200 font-bold">
                          {selectedInvestigation.impact_score.dependency_weight.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-[#1f242e] pb-0.5">
                        <span>Actor (10%):</span>
                        <span className="text-slate-200 font-bold">
                          {selectedInvestigation.impact_score.actor_context.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Hypothesis */}
                {selectedInvestigation.hypothesis && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold block">
                      Evidence-Supported Hypothesis
                    </span>
                    <p className="text-[11px] text-slate-300 leading-relaxed p-2.5 rounded bg-[#0d0f12] border border-[#222733]">
                      {selectedInvestigation.hypothesis}
                    </p>
                  </div>
                )}

                {/* Anomalies list */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold block">
                    Correlated Metric Anomalies ({selectedInvestigation.anomalies.length})
                  </span>
                  <div className="space-y-1 font-mono text-[11px]">
                    {selectedInvestigation.anomalies.slice(0, 4).map((a) => (
                      <div
                        key={a.id}
                        className="p-1.5 rounded bg-[#0d0f12] border border-[#1f242e] flex items-center justify-between"
                      >
                        <span className="text-slate-300 truncate max-w-[180px]">
                          {a.resource_name} · {a.metric_name}
                        </span>
                        <span className="text-rose-400 font-bold shrink-0">
                          {a.deviation_pct >= 0 ? `+${a.deviation_pct.toFixed(0)}%` : `${a.deviation_pct.toFixed(0)}%`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick actions */}
                <div className="pt-2 border-t border-[#222733]">
                  <Link
                    href={`/investigations/${selectedInvestigation.id}`}
                    className="w-full py-2 px-3 rounded bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Inspect Blast-Radius & Timeline</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 font-mono">
                Select an investigation to inspect details.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
