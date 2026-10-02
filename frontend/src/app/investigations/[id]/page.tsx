'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  BrainCircuit,
  CheckCircle2,
  Clock,
  Download,
  Network,
  RotateCw,
  ShieldCheck,
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
        <RotateCw className="w-5 h-5 animate-spin mx-auto text-[#58A6FF]" />
        <p className="text-xs text-[#A1A1AA]">Synthesizing change-impact evidence...</p>
      </div>
    );
  }

  if (!inv) {
    return (
      <div className="py-24 text-center space-y-3 font-mono">
        <p className="text-sm text-[#A1A1AA]">Investigation {id} not found.</p>
        <Link href="/" className="text-xs text-[#58A6FF] underline">
          Return to Console
        </Link>
      </div>
    );
  }

  const isLive = inv.id === 'inv_live_001' || (inv.data_mode === 'live' && inv.id !== 'inv_demo_001');

  return (
    <div className="space-y-6">
      {/* Top Header Breadcrumb & Identity */}
      <div className="border border-[#2A2A2F] rounded-[10px] bg-[#17171A] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            {/* Breadcrumb Header */}
            <div className="flex items-center gap-2 text-[13px] font-sans text-[#A1A1AA]">
              <Link href="/" className="hover:text-[#ECECEC] transition-colors flex items-center gap-1.5">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Console</span>
              </Link>
              <span className="text-[#2A2A2F]">/</span>
              <span className="text-[#ECECEC] font-mono text-[12px] font-bold">{inv.id}</span>
              <span className="text-[#2A2A2F]">/</span>
              <span className={isLive ? 'text-[#3FB950] font-bold' : 'text-[#D29922] font-bold'}>
                {isLive ? 'LIVE AWS INCIDENT' : 'DEMO SCENARIO'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <h1 className="text-[24px] font-sans font-semibold text-[#ECECEC] leading-[1.3] tracking-[-0.015em]">
                {inv.title}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-sans font-bold uppercase border flex items-center gap-1.5 ${
                isLive
                  ? 'bg-[rgba(63,185,80,0.15)] text-[#3FB950] border-[rgba(63,185,80,0.3)]'
                  : 'bg-[rgba(210,153,34,0.15)] text-[#D29922] border-[rgba(210,153,34,0.3)]'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-[#3FB950]' : 'bg-[#D29922]'}`} />
                {isLive ? 'LIVE INCIDENT' : 'DEMO SCENARIO'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-sans font-semibold uppercase bg-[#232327] text-[#A1A1AA] border border-[#2A2A2F]">
                {inv.status}
              </span>
              {inv.impact_score && (
                <ConfidenceBadge confidence={inv.impact_score.confidence} />
              )}
            </div>

            <div className="text-[12px] text-[#71717A] font-sans flex items-center gap-2.5 flex-wrap pt-0.5">
              <span>Trigger: <strong className="text-[#ECECEC] font-mono">{inv.trigger_change_id}</strong></span>
              <span className="text-[#2A2A2F]">·</span>
              <span>Time: <strong className="text-[#ECECEC] font-mono tabular">{new Date(inv.created_at).toLocaleString()}</strong></span>
              <span className="text-[#2A2A2F]">·</span>
              <span>Region: <strong className="text-[#ECECEC] font-mono">us-east-2</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-stretch sm:self-auto">
            <button
              onClick={handleGeneratePack}
              disabled={generatingPack}
              className="flex-1 sm:flex-none h-[40px] px-4 rounded-[6px] text-[13px] font-sans font-medium bg-[#2F6FAD] hover:bg-[#3579BD] text-[#FFFFFF] flex items-center justify-center gap-2 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#58A6FF]"
            >
              <Download className="w-4 h-4" />
              <span>{generatingPack ? 'Generating Pack...' : 'Export Evidence Pack'}</span>
            </button>
            <button
              onClick={loadAll}
              disabled={loading}
              className="h-[40px] px-3.5 rounded-[6px] border border-[#3F3F46] bg-[#17171A] hover:bg-[#232327] text-[#ECECEC] transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#58A6FF]"
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
        <div className="p-5 rounded-[10px] border border-[rgba(63,185,80,0.4)] bg-[#17171A] space-y-2.5 font-sans text-[13px]">
          <div className="flex items-center justify-between">
            <span className="font-semibold uppercase text-[#3FB950] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#3FB950]" />
              Evidence Pack Exported (SHA-256 Tamper Evident)
            </span>
            <span className="text-xs font-mono text-[#3FB950]">
              S3: {pack.s3_key}
            </span>
          </div>
          <div className="p-3 bg-[#1E1E22] rounded-[6px] border border-[#2A2A2F] text-[12px] font-mono text-[#A1A1AA] break-all">
            <span className="text-[#3FB950] font-bold block mb-1">CONTENT HASH:</span>
            {pack.content_hash}
          </div>
        </div>
      )}

      {/* Control-Plane Tabs - Solid Blue When Active */}
      <div className="space-y-5">
        <div className="flex items-center gap-1.5 border-b border-[#2A2A2F] pb-px overflow-x-auto select-none">
          <button
            onClick={() => setActiveTab('graph')}
            className={`h-[40px] px-4 rounded-t-[6px] text-[13px] font-sans transition-colors duration-150 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#58A6FF] ${
              activeTab === 'graph'
                ? 'bg-[#2F6FAD] text-[#FFFFFF] font-semibold border-b-2 border-[#58A6FF]'
                : 'bg-transparent text-[#71717A] hover:text-[#ECECEC] hover:bg-[#232327]'
            }`}
          >
            <Network className={`w-4 h-4 ${activeTab === 'graph' ? 'text-[#FFFFFF]' : 'text-[#58A6FF]'}`} />
            <span>Blast-Radius Topology</span>
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`h-[40px] px-4 rounded-t-[6px] text-[13px] font-sans transition-colors duration-150 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#58A6FF] ${
              activeTab === 'timeline'
                ? 'bg-[#2F6FAD] text-[#FFFFFF] font-semibold border-b-2 border-[#58A6FF]'
                : 'bg-transparent text-[#71717A] hover:text-[#ECECEC] hover:bg-[#232327]'
            }`}
          >
            <Clock className={`w-4 h-4 ${activeTab === 'timeline' ? 'text-[#FFFFFF]' : 'text-[#58A6FF]'}`} />
            <span>Evidence Timeline ({timeline.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('evidence')}
            className={`h-[40px] px-4 rounded-t-[6px] text-[13px] font-sans transition-colors duration-150 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#58A6FF] ${
              activeTab === 'evidence'
                ? 'bg-[#2F6FAD] text-[#FFFFFF] font-semibold border-b-2 border-[#58A6FF]'
                : 'bg-transparent text-[#71717A] hover:text-[#ECECEC] hover:bg-[#232327]'
            }`}
          >
            <ShieldCheck className={`w-4 h-4 ${activeTab === 'evidence' ? 'text-[#FFFFFF]' : 'text-[#3FB950]'}`} />
            <span>Verified Evidence ({evidence.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('memory')}
            className={`h-[40px] px-4 rounded-t-[6px] text-[13px] font-sans transition-colors duration-150 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#58A6FF] ${
              activeTab === 'memory'
                ? 'bg-[#2F6FAD] text-[#FFFFFF] font-semibold border-b-2 border-[#58A6FF]'
                : 'bg-transparent text-[#71717A] hover:text-[#ECECEC] hover:bg-[#232327]'
            }`}
          >
            <BrainCircuit className={`w-4 h-4 ${activeTab === 'memory' ? 'text-[#FFFFFF]' : 'text-[#D29922]'}`} />
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
        <div className="border border-[#2A2A2F] rounded-[10px] bg-[#17171A] p-5 space-y-3">
          <h2 className="text-[14px] font-sans font-semibold text-[#ECECEC] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#58A6FF]" />
            <span>Recommended Investigation & Remediation Steps</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px]">
            {inv.recommended_actions.map((act, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-[6px] bg-[#1E1E22] border border-[#2A2A2F] flex items-start gap-3 text-[#A1A1AA] font-sans"
              >
                <span className="w-5 h-5 rounded bg-[#121214] text-[11px] font-mono font-bold flex items-center justify-center shrink-0 text-[#ECECEC] mt-0.5 border border-[#2A2A2F]">
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
