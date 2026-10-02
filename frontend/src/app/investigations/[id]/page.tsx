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

export default function InvestigationDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || 'inv_demo_001';

  const [inv, setInv] = useState<InvestigationCase | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [graph, setGraph] = useState<GraphType | null>(null);
  const [evidence, setEvidence] = useState<EvidenceArtifact[]>([]);
  const [memories, setMemories] = useState<OperationalMemory[]>([]);
  const [activeTab, setActiveTab] = useState<'timeline' | 'graph' | 'evidence' | 'memory'>('graph');
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
      <div className="py-24 text-center space-y-3">
        <RotateCw className="w-6 h-6 animate-spin mx-auto text-indigo-400" />
        <p className="text-xs text-slate-400 font-mono">Synthesizing change-impact evidence...</p>
      </div>
    );
  }

  if (!inv) {
    return (
      <div className="py-24 text-center space-y-4">
        <p className="text-sm text-slate-400">Investigation {id} not found.</p>
        <Link href="/" className="text-xs text-indigo-400 underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Header Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-400 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Operational Dashboard
          </Link>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {inv.title}
            </h1>
            <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              {inv.status}
            </span>
          </div>
          <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
            <span>Case ID: {inv.id}</span>
            <span>·</span>
            <span>Trigger: {inv.trigger_change_id}</span>
            <span>·</span>
            <span>Created: {new Date(inv.created_at).toLocaleString()}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleGeneratePack}
            disabled={generatingPack}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            {generatingPack ? 'Generating Pack...' : 'Generate Evidence Pack'}
          </button>
        </div>
      </div>

      {/* Impact Score Breakdown Card */}
      {inv.impact_score && <ImpactScoreDisplay score={inv.impact_score} />}

      {/* Evidence Pack Modal Banner if generated */}
      {pack && (
        <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-950/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Evidence Pack Exported Successfully (SHA-256 Tamper Evident)
            </span>
            <span className="text-[11px] font-mono text-emerald-400">
              S3: {pack.s3_key}
            </span>
          </div>
          <div className="p-3 bg-slate-950/80 rounded border border-emerald-500/20 font-mono text-[11px] text-slate-300 break-all">
            <span className="text-emerald-400 font-bold block mb-1">Content Hash:</span>
            {pack.content_hash}
          </div>
        </div>
      )}

      {/* Interactive Tabs */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-px overflow-x-auto">
          <button
            onClick={() => setActiveTab('graph')}
            className={`px-4 py-2.5 rounded-t-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all border-b-2 ${
              activeTab === 'graph'
                ? 'border-indigo-500 text-indigo-400 bg-slate-900/80'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Network className="w-4 h-4" />
            Blast-Radius Graph
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-4 py-2.5 rounded-t-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all border-b-2 ${
              activeTab === 'timeline'
                ? 'border-indigo-500 text-indigo-400 bg-slate-900/80'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            Multi-Lane Timeline
          </button>
          <button
            onClick={() => setActiveTab('evidence')}
            className={`px-4 py-2.5 rounded-t-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all border-b-2 ${
              activeTab === 'evidence'
                ? 'border-indigo-500 text-indigo-400 bg-slate-900/80'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Evidence Panel ({evidence.length})
          </button>
          <button
            onClick={() => setActiveTab('memory')}
            className={`px-4 py-2.5 rounded-t-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all border-b-2 ${
              activeTab === 'memory'
                ? 'border-amber-500 text-amber-400 bg-slate-900/80'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BrainCircuit className="w-4 h-4 text-amber-400" />
            Operational Memory ({memories.length})
          </button>
        </div>

        {/* Tab Content Display */}
        <div>
          {activeTab === 'graph' && graph && <BlastRadiusGraph graph={graph} />}
          {activeTab === 'timeline' && <TimelineView events={timeline} />}
          {activeTab === 'evidence' && <EvidencePanel evidence={evidence} />}
          {activeTab === 'memory' && <MemoryPanel memories={memories} />}
        </div>
      </div>

      {/* Recommended Next Actions Checklist */}
      {inv.recommended_actions.length > 0 && (
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-400" />
            Recommended Investigation & Remediation Steps
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {inv.recommended_actions.map((act, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-start gap-2 text-slate-300"
              >
                <span className="w-4 h-4 rounded-full bg-slate-800 text-[10px] font-mono flex items-center justify-center shrink-0 mt-0.5 text-slate-400">
                  {idx + 1}
                </span>
                <span>{act}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
