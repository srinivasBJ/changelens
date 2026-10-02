'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Activity,
  ArrowLeft,
  BrainCircuit,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Layers,
  Network,
  RotateCw,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  createEvidencePack,
  getEvidence,
  getGraph,
  getInvestigation,
  getMemory,
  getTimeline,
} from '@/lib/api';
import {
  BlastRadiusGraph as GraphType,
  EvidenceArtifact,
  EvidencePack,
  InvestigationCase,
  OperationalMemory,
  TimelineEvent,
} from '@/lib/types';
import { ConfidenceBadge } from '@/components/ConfidenceBadge';
import { ImpactScoreDisplay } from '@/components/ImpactScoreDisplay';
import { TimelineView } from '@/components/TimelineView';
import { BlastRadiusGraph } from '@/components/BlastRadiusGraph';
import { EvidencePanel } from '@/components/EvidencePanel';
import { MemoryPanel } from '@/components/MemoryPanel';
import { ModeBadge } from '@/components/ModeBadge';

export default function InvestigationDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || 'inv_live_001';

  const [inv, setInv] = useState<InvestigationCase | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [graph, setGraph] = useState<GraphType | null>(null);
  const [evidence, setEvidence] = useState<EvidenceArtifact[]>([]);
  const [memories, setMemories] = useState<OperationalMemory[]>([]);
  const [activeTab, setActiveTab] = useState<'graph' | 'timeline' | 'evidence' | 'memory'>('graph');
  const [loading, setLoading] = useState(true);
  const [pack, setPack] = useState<EvidencePack | null>(null);
  const [generatingPack, setGeneratingPack] = useState(false);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [i, t, g, e, m] = await Promise.all([
        getInvestigation(id),
        getTimeline(id),
        getGraph(id),
        getEvidence(id),
        getMemory(id),
      ]);
      setInv(i);
      setTimeline(t);
      setGraph(g);
      setEvidence(e);
      setMemories(m);
    } catch (err) {
      console.error('Failed to load investigation details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [id]);

  const handleGeneratePack = async () => {
    try {
      setGeneratingPack(true);
      const generated = await createEvidencePack(id);
      setPack(generated);
    } catch (err) {
      console.error('Failed to generate evidence pack:', err);
    } finally {
      setGeneratingPack(false);
    }
  };

  if (loading && !inv) {
    return (
      <div className="py-24 text-center space-y-2">
        <RotateCw className="w-5 h-5 animate-spin mx-auto text-blue-400" />
        <p className="text-xs text-slate-400 font-mono">Synthesizing change-impact evidence...</p>
      </div>
    );
  }

  if (!inv) {
    return (
      <div className="py-24 text-center space-y-3 font-mono">
        <p className="text-sm text-slate-400">Investigation {id} not found.</p>
        <Link href="/" className="text-xs text-blue-400 underline">
          Return to Console
        </Link>
      </div>
    );
  }

  const isLive = inv.data_mode === 'live';

  return (
    <div className="space-y-4">
      {/* Top Header Breadcrumb & Identity */}
      <div className="border border-[#222733] rounded bg-[#13161c] p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
              <Link href="/" className="hover:text-blue-400 transition-colors flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" />
                <span>Console</span>
              </Link>
              <span>/</span>
              <span className="text-slate-300 font-bold">{inv.id}</span>
              <span>/</span>
              <span className={isLive ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                {isLive ? 'LIVE AWS INCIDENT' : 'DEMO SCENARIO'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <h1 className="text-lg sm:text-xl font-bold font-mono text-slate-100 tracking-tight">
                {inv.title}
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-950/60 text-emerald-400 border border-emerald-800">
                {inv.status}
              </span>
              {inv.impact_score && (
                <ConfidenceBadge confidence={inv.impact_score.confidence} />
              )}
            </div>

            <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2 flex-wrap pt-0.5">
              <span>TRIGGER: <strong className="text-slate-200">{inv.trigger_change_id}</strong></span>
              <span className="text-slate-600">·</span>
              <span>TIME: <strong className="text-slate-200">{new Date(inv.created_at).toLocaleString()}</strong></span>
              <span className="text-slate-600">·</span>
              <span>REGION: <strong className="text-slate-200">us-east-2</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-stretch sm:self-auto">
            <button
              onClick={handleGeneratePack}
              disabled={generatingPack}
              className="flex-1 sm:flex-none px-3 py-1.5 rounded text-xs font-mono font-semibold bg-emerald-700 hover:bg-emerald-600 text-white flex items-center justify-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{generatingPack ? 'Generating Pack...' : 'Export Evidence Pack'}</span>
            </button>
            <button
              onClick={loadAll}
              disabled={loading}
              className="p-1.5 rounded border border-[#222733] bg-[#0d0f12] hover:bg-[#1a1e27] text-slate-300 transition-colors disabled:opacity-50"
              title="Refresh Investigation"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Impact Score Breakdown Card */}
      {inv.impact_score && <ImpactScoreDisplay score={inv.impact_score} />}

      {/* Evidence Pack Modal Banner if generated */}
      {pack && (
        <div className="p-3.5 rounded border border-emerald-600/50 bg-[#0f1f18] space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold uppercase text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Evidence Pack Exported (SHA-256 Tamper Evident)
            </span>
            <span className="text-[11px] text-emerald-400">
              S3: {pack.s3_key}
            </span>
          </div>
          <div className="p-2.5 bg-[#0d0f12] rounded border border-emerald-900/60 text-[11px] text-slate-300 break-all">
            <span className="text-emerald-400 font-bold block mb-0.5">CONTENT HASH:</span>
            {pack.content_hash}
          </div>
        </div>
      )}

      {/* Control-Plane Tabs */}
      <div className="space-y-4">
        <div className="flex items-center gap-1 border-b border-[#222733] pb-px overflow-x-auto select-none">
          <button
            onClick={() => setActiveTab('graph')}
            className={`px-3 py-2 rounded-t text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 transition-colors border-b-2 ${
              activeTab === 'graph'
                ? 'border-blue-500 text-white bg-[#13161c]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Network className="w-3.5 h-3.5 text-blue-400" />
            <span>Blast-Radius Topology</span>
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-3 py-2 rounded-t text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 transition-colors border-b-2 ${
              activeTab === 'timeline'
                ? 'border-blue-500 text-white bg-[#13161c]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>Evidence Timeline ({timeline.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('evidence')}
            className={`px-3 py-2 rounded-t text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 transition-colors border-b-2 ${
              activeTab === 'evidence'
                ? 'border-emerald-500 text-white bg-[#13161c]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Verified Evidence ({evidence.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('memory')}
            className={`px-3 py-2 rounded-t text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 transition-colors border-b-2 ${
              activeTab === 'memory'
                ? 'border-amber-500 text-white bg-[#13161c]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BrainCircuit className="w-3.5 h-3.5 text-amber-400" />
            <span>Operational Memory ({memories.length})</span>
          </button>
        </div>

        {/* Tab Workspace */}
        <div>
          {activeTab === 'graph' && graph && <BlastRadiusGraph graph={graph} />}
          {activeTab === 'timeline' && <TimelineView events={timeline} />}
          {activeTab === 'evidence' && <EvidencePanel evidence={evidence} />}
          {activeTab === 'memory' && <MemoryPanel memories={memories} />}
        </div>
      </div>

      {/* Recommended Remediation Steps Checklist */}
      {inv.recommended_actions.length > 0 && (
        <div className="border border-[#222733] rounded bg-[#13161c] p-4 space-y-2.5">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
            Recommended Investigation & Remediation Steps
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {inv.recommended_actions.map((act, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded bg-[#0d0f12] border border-[#1f242e] flex items-start gap-2.5 text-slate-300 font-sans"
              >
                <span className="w-4 h-4 rounded bg-[#1e232d] text-[10px] font-mono font-bold flex items-center justify-center shrink-0 text-slate-300 mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{act}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
