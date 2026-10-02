'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  Layers,
  Zap,
  Server,
  Database,
  ExternalLink,
  ShieldCheck,
  BrainCircuit,
  Terminal,
} from 'lucide-react';
import { ModeBadge } from '@/components/ModeBadge';

interface Props {
  children: React.ReactNode;
}

export const ConsoleShell: React.FC<Props> = ({ children }) => {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#000000] text-[#FFFFFF] flex flex-col font-sans selection:bg-[#0066FF] selection:text-white">
      {/* Top Engineering Control-Plane Header */}
      <header className="h-[44px] min-h-[44px] border-b border-[#2a2a2a] bg-[#000000] px-5 flex items-center justify-between shrink-0 z-40 select-none">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-5 h-5 rounded-[4px] bg-[#0066FF] flex items-center justify-center text-white font-mono font-bold text-xs shadow-sm">
              CL
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono font-bold text-xs text-[#FFFFFF] tracking-wider">
                CHANGELENS
              </span>
              <span className="text-[11px] font-mono text-[#666666]">
                / CONTROL-PLANE
              </span>
            </div>
          </Link>
          <span className="text-[#333333]">|</span>
          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-[#A0A0A0]">
            <span className="text-[#666666]">ACCOUNT:</span>
            <span className="text-[#FFFFFF]">979244568165</span>
            <span className="text-[#333333]">·</span>
            <span className="text-[#666666]">REGION:</span>
            <span className="text-[#FFFFFF]">us-east-2</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-[6px] bg-[#0a0a0a] border border-[#2a2a2a] text-[11px] font-mono text-[#A0A0A0]">
            <span className="w-2 h-2 rounded-full bg-[#00FF88]" />
            <span>HINDSIGHT: ACTIVE</span>
          </div>
          <ModeBadge mode={process.env.NEXT_PUBLIC_APP_MODE || 'live'} />
        </div>
      </header>

      {/* Main Container: Sidebar + Content */}
      <div className="flex-1 flex min-h-0">
        {/* Left Control-Plane Sidebar Navigation (280px) */}
        <aside className="w-[280px] min-w-[280px] max-w-[280px] border-r border-[#2a2a2a] bg-[#000000] flex flex-col justify-between shrink-0 select-none">
          <div className="p-4 space-y-6">
            {/* Primary Console Navigation */}
            <div className="space-y-1.5">
              <div className="px-3 pb-1 text-[11px] font-mono uppercase tracking-[1px] text-[#666666] font-semibold">
                Console Navigation
              </div>
              <Link
                href="/"
                className={`flex items-center justify-between px-3 py-2.5 rounded-[8px] text-xs font-medium transition-colors ${
                  pathname === '/'
                    ? 'bg-[#0066FF] text-[#FFFFFF] font-semibold'
                    : 'text-[#A0A0A0] hover:text-[#FFFFFF] hover:bg-[#111111]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Activity className="w-4 h-4" />
                  <span>Overview</span>
                </div>
              </Link>
              <Link
                href="/investigations/inv_live_001"
                className={`flex items-center justify-between px-3 py-2.5 rounded-[8px] text-xs font-medium transition-colors ${
                  pathname.includes('inv_live_001')
                    ? 'bg-[#0066FF] text-[#FFFFFF] font-semibold'
                    : 'text-[#A0A0A0] hover:text-[#FFFFFF] hover:bg-[#111111]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-[#00FF88] shrink-0" />
                  <span>Live Investigation</span>
                </div>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-[#00FF88] text-[#000000]">
                  LIVE
                </span>
              </Link>
              <Link
                href="/investigations/inv_demo_001"
                className={`flex items-center justify-between px-3 py-2.5 rounded-[8px] text-xs font-medium transition-colors ${
                  pathname.includes('inv_demo_001')
                    ? 'bg-[#0066FF] text-[#FFFFFF] font-semibold'
                    : 'text-[#A0A0A0] hover:text-[#FFFFFF] hover:bg-[#111111]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4" />
                  <span>Demo Investigation</span>
                </div>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-[#FFB800] text-[#000000]">
                  DEMO
                </span>
              </Link>
              <Link
                href="/changes"
                className={`flex items-center justify-between px-3 py-2.5 rounded-[8px] text-xs font-medium transition-colors ${
                  pathname.startsWith('/changes')
                    ? 'bg-[#0066FF] text-[#FFFFFF] font-semibold'
                    : 'text-[#A0A0A0] hover:text-[#FFFFFF] hover:bg-[#111111]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Zap className="w-4 h-4" />
                  <span>CloudTrail Changes</span>
                </div>
              </Link>
            </div>

            {/* Monitored AWS Workload Topology */}
            <div className="space-y-2">
              <div className="px-3 pb-1 text-[11px] font-mono uppercase tracking-[1px] text-[#666666] font-semibold">
                Monitored Topology
              </div>
              <div className="space-y-1.5 text-xs font-mono">
                <div className="p-2.5 rounded-[8px] bg-[#0a0a0a] border border-[#2a2a2a] text-[#A0A0A0]">
                  <div className="text-[10px] uppercase text-[#666666]">API Gateway</div>
                  <div className="truncate text-[#FFFFFF] font-medium">changelens-checkout-api</div>
                </div>
                <div className="p-2.5 rounded-[8px] bg-[#0a0a0a] border border-[#2a2a2a] text-[#A0A0A0]">
                  <div className="text-[10px] uppercase text-[#666666]">Lambda Function</div>
                  <div className="truncate text-[#0066FF] font-semibold">checkout-function</div>
                </div>
                <div className="p-2.5 rounded-[8px] bg-[#0a0a0a] border border-[#2a2a2a] text-[#A0A0A0]">
                  <div className="text-[10px] uppercase text-[#666666]">DynamoDB Table</div>
                  <div className="truncate text-[#FFFFFF] font-medium">checkout-table</div>
                </div>
              </div>
            </div>

            {/* Evidence & Memory Subsystems */}
            <div className="space-y-1.5 text-xs font-mono">
              <div className="px-3 pb-1 text-[11px] font-mono uppercase tracking-[1px] text-[#666666] font-semibold">
                Intelligence Feeds
              </div>
              <div className="px-3 py-1.5 text-[#A0A0A0] flex items-center justify-between border-b border-[#1a1a1a]">
                <span>CloudTrail:</span>
                <span className="text-[#00FF88] font-bold">LOOKUP</span>
              </div>
              <div className="px-3 py-1.5 text-[#A0A0A0] flex items-center justify-between border-b border-[#1a1a1a]">
                <span>CloudWatch:</span>
                <span className="text-[#00FF88] font-bold">METRICS</span>
              </div>
              <div className="px-3 py-1.5 text-[#A0A0A0] flex items-center justify-between">
                <span>Hindsight:</span>
                <span className="text-[#00FF88] font-bold">RECALL</span>
              </div>
            </div>
          </div>

          {/* Sidebar Footer info */}
          <div className="p-4 border-t border-[#2a2a2a] text-[11px] font-mono text-[#666666] space-y-1">
            <div className="text-[#A0A0A0] font-semibold">CHANGELENS v1.0.0</div>
            <div>AWS BUILDER CENTER</div>
          </div>
        </aside>

        {/* Primary Operational Workspace */}
        <main className="flex-1 min-w-0 overflow-y-auto bg-[#000000]">
          <div className="p-[32px] max-w-[1600px] mx-auto space-y-[32px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
