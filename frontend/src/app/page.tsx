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

  return (
    <div className="space-y-8">
      {/* Hero / Operational Context Banner */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/40 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Zap className="w-3.5 h-3.5" />
              Evidence-Driven Intelligence Layer
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              AWS Change Impact & Operational Memory
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Connects AWS infrastructure modifications, CloudWatch metric deviations, topological blast radius, and historical operational memories recalled via Hindsight™ into an explainable causal graph.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <button
              onClick={handleInjectDemo}
              disabled={injecting}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl font-semibold text-xs tracking-wide bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {injecting ? 'Injecting Change...' : 'Inject Demo Scenario'}
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors disabled:opacity-50"
              title="Refresh Telemetry"
            >
              <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 7 Core Operational Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
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

      {/* Main Grid: Active Investigations & Recent Changes Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Investigations (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Active Change-Impact Investigations
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              {investigations.length} Tracked
            </span>
          </div>

          <div className="space-y-4">
            {investigations.map((inv) => (
              <div
                key={inv.id}
                className="p-5 rounded-xl border border-slate-800 bg-slate-900/80 hover:border-slate-700 transition-all space-y-4 shadow-lg"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[11px] font-mono text-indigo-400 uppercase tracking-wider font-semibold">
                      {inv.id}
                    </span>
                    <h3 className="text-base font-bold text-slate-100">
                      {inv.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {inv.impact_score && (
                      <ConfidenceBadge confidence={inv.impact_score.confidence} />
                    )}
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {inv.status}
                    </span>
                  </div>
                </div>

                {inv.hypothesis && (
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                    <span className="font-semibold text-indigo-300 uppercase text-[10px] tracking-wider block mb-1">
                      Evidence-Supported Hypothesis:
                    </span>
                    {inv.hypothesis}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
                  <div className="flex items-center gap-4">
                    <span>
                      <strong className="text-slate-200 font-mono">
                        {inv.anomalies.length}
                      </strong>{' '}
                      Anomalies
                    </span>
                    <span>
                      <strong className="text-slate-200 font-mono">
                        {inv.evidence.length}
                      </strong>{' '}
                      Evidence Items
                    </span>
                    <span>
                      <strong className="text-amber-300 font-mono">
                        {inv.historical_memories.length}
                      </strong>{' '}
                      Memories
                    </span>
                  </div>

                  <Link
                    href={`/investigations/${inv.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30 transition-colors"
                  >
                    View Investigation Graph
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent AWS Changes Stream (1 Col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-400" />
              CloudTrail Changes
            </h2>
            <Link
              href="/changes"
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {changes.slice(0, 5).map((chg) => (
              <div
                key={chg.id}
                className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 transition-all space-y-2"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono font-bold text-slate-300">
                    {chg.action}
                  </span>
                  <SourceBadge source={chg.service} />
                </div>
                <div className="text-xs text-slate-400 font-mono truncate">
                  {chg.resource_name}
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                  <span className="capitalize">Actor: {chg.actor_type}</span>
                  <span>{new Date(chg.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
