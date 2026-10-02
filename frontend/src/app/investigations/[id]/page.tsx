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
      <div className="py-24 text-center space-y-3 font-mono">
        <RotateCw className="w-5 h-5 animate-spin mx-auto text-[#0066FF]" />
        <p className="text-xs text-[#A8A8A8]">Synthesizing change-impact evidence...</p>
      </div>
    );
  }

  if (!inv) {
    return (
      <div className="py-24 text-center space-y-3 font-mono">
        <p className="text-sm text-[#A8A8A8]">Investigation {id} not found.</p>
        <Link href="/" className="text-xs text-[#0066FF] underline">
          Return to Console
        </Link>
      </div>
    );
  }

  const isLive = inv.data_mode === 'live';

  return (
    <div className="space-y-[32px]">
      {/* Top Header Breadcrumb & Identity */}
      <div className="border border-[#3a3a3a] rounded-[10px] bg-[#1f1f1f] p-[20px] space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            {/* Breadcrumb Header */}
            <div className="flex items-center gap-2 text-[13px] font-sans text-[#A8A8A8]">
              <Link href="/" className="hover:text-[#D6D6D6] transition-colors flex items-center gap-1.5">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Console</span>
              </Link>
              <span className="text-[#444444]">/</span>
              <span className="text-[#D6D6D6] font-mono text-[12px] font-bold">{inv.id}</span>
              <span className="text-[#444444]">/</span>
              <span className={isLive ? 'text-[#00FF88] font-bold' : 'text-[#FFB800] font-bold'}>
                {isLive ? 'LIVE AWS INCIDENT' : 'DEMO SCENARIO'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <h1 className="text-[24px] font-sans font-semibold text-[#D6D6D6] leading-[1.3] tracking-[-0.015em]">
                {inv.title}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-sans font-bold uppercase bg-[#00FF88]/15 text-[#00FF88] border border-[#00FF88]/30">
                {inv.status}
              </span>
              {inv.impact_score && (
                <ConfidenceBadge confidence={inv.impact_score.confidence} />
              )}
            </div>

            <div className="text-[12px] text-[#7A7A7A] font-sans flex items-center gap-2.5 flex-wrap pt-0.5">
              <span>Trigger: <strong className="text-[#D6D6D6] font-mono">{inv.trigger_change_id}</strong></span>
              <span className="text-[#444444]">·</span>
              <span>Time: <strong className="text-[#D6D6D6] font-mono tabular">{new Date(inv.created_at).toLocaleString()}</strong></span>
              <span className="text-[#444444]">·</span>
              <span>Region: <strong className="text-[#D6D6D6] font-mono">us-east-2</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-stretch sm:self-auto">
            <button
              onClick={handleGeneratePack}
              disabled={generatingPack}
              className="flex-1 sm:flex-none h-[44px] min-h-[44px] px-4 rounded-[8px] text-[14px] font-sans font-medium bg-[#0066FF] hover:bg-[#0052CC] text-[#FFFFFF] flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{generatingPack ? 'Generating Pack...' : 'Export Evidence Pack'}</span>
            </button>
            <button
              onClick={loadAll}
              disabled={loading}
              className="h-[44px] min-h-[44px] px-3.5 rounded-[8px] border border-[#3a3a3a] bg-transparent hover:bg-[#333333] text-[#A8A8A8] hover:text-[#D6D6D6] transition-colors disabled:opacity-50"
              title="Refresh Investigation"
            >
              <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Impact Score Breakdown Card */}
      {inv.impact_score && <ImpactScoreDisplay score={inv.impact_score} />}

      {/* Evidence Pack Modal Banner if generated */}
      {pack && (
        <div className="p-[20px] rounded-[10px] border border-[#00FF88]/40 bg-[#1f1f1f] space-y-2.5 font-sans text-[13px]">
          <div className="flex items-center justify-between">
            <span className="font-semibold uppercase text-[#00FF88] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#00FF88]" />
              Evidence Pack Exported (SHA-256 Tamper Evident)
            </span>
            <span className="text-xs font-mono text-[#00FF88]">
              S3: {pack.s3_key}
            </span>
          </div>
          <div className="p-3 bg-[#171717] rounded-[8px] border border-[#303030] text-[12px] font-mono text-[#A8A8A8] break-all">
            <span className="text-[#00FF88] font-bold block mb-1">CONTENT HASH:</span>
            {pack.content_hash}
          </div>
        </div>
      )}

      {/* Control-Plane Tabs */}
      <div className="space-y-[20px]">
        <div className="flex items-center gap-2 border-b border-[#3a3a3a] pb-px overflow-x-auto select-none">
          <button
            onClick={() => setActiveTab('graph')}
            className={`h-[44px] min-h-[44px] px-4 rounded-t-[8px] text-[14px] font-sans font-medium flex items-center gap-2 transition-colors border-b-2 ${
              activeTab === 'graph'
                ? 'border-[#0066FF] text-[#D6D6D6] font-semibold bg-[#1f1f1f]'
                : 'border-transparent text-[#7A7A7A] hover:text-[#D6D6D6]'
            }`}
          >
            <Network className="w-4 h-4 text-[#0066FF]" />
            <span>Blast-Radius Topology</span>
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`h-[44px] min-h-[44px] px-4 rounded-t-[8px] text-[14px] font-sans font-medium flex items-center gap-2 transition-colors border-b-2 ${
              activeTab === 'timeline'
                ? 'border-[#0066FF] text-[#D6D6D6] font-semibold bg-[#1f1f1f]'
                : 'border-transparent text-[#7A7A7A] hover:text-[#D6D6D6]'
            }`}
          >
            <Clock className="w-4 h-4 text-[#0066FF]" />
            <span>Evidence Timeline ({timeline.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('evidence')}
            className={`h-[44px] min-h-[44px] px-4 rounded-t-[8px] text-[14px] font-sans font-medium flex items-center gap-2 transition-colors border-b-2 ${
              activeTab === 'evidence'
                ? 'border-[#00FF88] text-[#D6D6D6] font-semibold bg-[#1f1f1f]'
                : 'border-transparent text-[#7A7A7A] hover:text-[#D6D6D6]'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-[#00FF88]" />
            <span>Verified Evidence ({evidence.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('memory')}
            className={`h-[44px] min-h-[44px] px-4 rounded-t-[8px] text-[14px] font-sans font-medium flex items-center gap-2 transition-colors border-b-2 ${
              activeTab === 'memory'
                ? 'border-[#FFB800] text-[#D6D6D6] font-semibold bg-[#1f1f1f]'
                : 'border-transparent text-[#7A7A7A] hover:text-[#D6D6D6]'
            }`}
          >
            <BrainCircuit className="w-4 h-4 text-[#FFB800]" />
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
        <div className="border border-[#3a3a3a] rounded-[10px] bg-[#1f1f1f] p-[20px] space-y-3">
          <h2 className="text-[15px] font-sans font-semibold text-[#D6D6D6] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#0066FF]" />
            <span>Recommended Investigation & Remediation Steps</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[20px] text-[13px]">
            {inv.recommended_actions.map((act, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-[8px] bg-[#171717] border border-[#303030] flex items-start gap-3 text-[#A8A8A8] font-sans"
              >
                <span className="w-5 h-5 rounded bg-[#242424] text-[11px] font-mono font-bold flex items-center justify-center shrink-0 text-[#D6D6D6] mt-0.5 border border-[#3a3a3a]">
                  {idx + 1}
                </span>
                <span className="leading-[1.5]">{act}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
