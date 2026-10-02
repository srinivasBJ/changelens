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
    <div className="min-h-screen bg-[#292929] text-[#D6D6D6] flex flex-col font-sans selection:bg-[#0066FF] selection:text-white">
      {/* Top Engineering Control-Plane Header */}
      <header className="h-[44px] min-h-[44px] border-b border-[#3a3a3a] bg-[#242424] px-5 flex items-center justify-between shrink-0 z-40 select-none">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-5 h-5 rounded-[4px] bg-[#0066FF] flex items-center justify-center text-white font-sans font-bold text-xs shadow-sm">
              CL
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-sans font-semibold text-[15px] text-[#D6D6D6] tracking-[0.02em]">
                ChangeLens
              </span>
              <span className="text-[12px] font-sans font-medium text-[#7A7A7A]">
                / Control-Plane
              </span>
            </div>
          </Link>
          <span className="text-[#444444]">|</span>
          <div className="hidden sm:flex items-center gap-2 text-[12px] font-sans text-[#A8A8A8]">
            <span className="text-[#7A7A7A] font-medium">Account:</span>
            <span className="text-[#D6D6D6] font-mono text-[12px] tabular">979244568165</span>
            <span className="text-[#444444]">·</span>
            <span className="text-[#7A7A7A] font-medium">Region:</span>
            <span className="text-[#D6D6D6] font-mono text-[12px]">us-east-2</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-[6px] bg-[#1f1f1f] border border-[#3a3a3a] text-[12px] font-sans text-[#A8A8A8]">
            <span className="w-2 h-2 rounded-full bg-[#00FF88]" />
            <span className="font-medium">Hindsight: Active</span>
          </div>
          <ModeBadge mode={process.env.NEXT_PUBLIC_APP_MODE || 'live'} />
        </div>
      </header>

      {/* Main Container: Sidebar + Content */}
      <div className="flex-1 flex min-h-0">
        {/* Left Control-Plane Sidebar Navigation (280px) */}
        <aside className="w-[280px] min-w-[280px] max-w-[280px] border-r border-[#3a3a3a] bg-[#222222] flex flex-col justify-between shrink-0 select-none">
          <div className="p-4 space-y-6">
            {/* Primary Console Navigation */}
            <div className="space-y-1">
              <div className="px-3 pb-1 text-[11px] font-sans font-semibold uppercase tracking-[0.08em] text-[#7A7A7A]">
                Console Navigation
              </div>
              <Link
                href="/"
                className={`flex items-center justify-between px-3 py-2.5 rounded-[8px] text-[14px] font-sans font-medium transition-colors ${
                  pathname === '/'
                    ? 'bg-[#0066FF] text-[#FFFFFF] font-semibold'
                    : 'text-[#A8A8A8] hover:text-[#D6D6D6] hover:bg-[#2d2d2d]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Activity className="w-4 h-4" />
                  <span>Overview</span>
                </div>
              </Link>
              <Link
                href="/investigations/inv_live_001"
                className={`flex items-center justify-between px-3 py-2.5 rounded-[8px] text-[14px] font-sans font-medium transition-colors ${
                  pathname.includes('inv_live_001')
                    ? 'bg-[#0066FF] text-[#FFFFFF] font-semibold'
                    : 'text-[#A8A8A8] hover:text-[#D6D6D6] hover:bg-[#2d2d2d]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-[#00FF88] shrink-0" />
                  <span>Live Investigation</span>
                </div>
                <span className="text-[10px] font-sans font-semibold tracking-[0.06em] px-2 py-0.5 rounded-full bg-[#00FF88] text-[#000000] uppercase">
                  LIVE
                </span>
              </Link>
              <Link
                href="/investigations/inv_demo_001"
                className={`flex items-center justify-between px-3 py-2.5 rounded-[8px] text-[14px] font-sans font-medium transition-colors ${
                  pathname.includes('inv_demo_001')
                    ? 'bg-[#0066FF] text-[#FFFFFF] font-semibold'
                    : 'text-[#A8A8A8] hover:text-[#D6D6D6] hover:bg-[#2d2d2d]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4" />
                  <span>Demo Investigation</span>
                </div>
                <span className="text-[10px] font-sans font-semibold tracking-[0.06em] px-2 py-0.5 rounded-full bg-[#FFB800] text-[#000000] uppercase">
                  DEMO
                </span>
              </Link>
              <Link
                href="/changes"
                className={`flex items-center justify-between px-3 py-2.5 rounded-[8px] text-[14px] font-sans font-medium transition-colors ${
                  pathname.startsWith('/changes')
                    ? 'bg-[#0066FF] text-[#FFFFFF] font-semibold'
                    : 'text-[#A8A8A8] hover:text-[#D6D6D6] hover:bg-[#2d2d2d]'
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
              <div className="px-3 pb-1 text-[11px] font-sans font-semibold uppercase tracking-[0.08em] text-[#7A7A7A]">
                Monitored Topology
              </div>
              <div className="space-y-1.5">
                <div className="p-2.5 rounded-[8px] bg-[#1a1a1a] border border-[#333333]">
                  <div className="text-[12px] font-sans font-medium text-[#7A7A7A]">API Gateway</div>
                  <div className="truncate font-mono text-[12px] text-[#D6D6D6] tabular">changelens-checkout-api</div>
                </div>
                <div className="p-2.5 rounded-[8px] bg-[#1a1a1a] border border-[#333333]">
                  <div className="text-[12px] font-sans font-medium text-[#7A7A7A]">Lambda Function</div>
                  <div className="truncate font-mono text-[12px] text-[#0066FF] font-semibold tabular">checkout-function</div>
                </div>
                <div className="p-2.5 rounded-[8px] bg-[#1a1a1a] border border-[#333333]">
                  <div className="text-[12px] font-sans font-medium text-[#7A7A7A]">DynamoDB Table</div>
                  <div className="truncate font-mono text-[12px] text-[#D6D6D6] tabular">checkout-table</div>
                </div>
              </div>
            </div>

            {/* Evidence & Memory Subsystems */}
            <div className="space-y-1.5 font-sans">
              <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7A7A7A]">
                Intelligence Feeds
              </div>
              <div className="px-3 py-1.5 text-[13px] text-[#A8A8A8] flex items-center justify-between border-b border-[#2d2d2d]">
                <span>CloudTrail</span>
                <span className="font-mono text-[12px] text-[#00FF88] font-medium">LOOKUP</span>
              </div>
              <div className="px-3 py-1.5 text-[13px] text-[#A8A8A8] flex items-center justify-between border-b border-[#2d2d2d]">
                <span>CloudWatch</span>
                <span className="font-mono text-[12px] text-[#00FF88] font-medium">METRICS</span>
              </div>
              <div className="px-3 py-1.5 text-[13px] text-[#A8A8A8] flex items-center justify-between">
                <span>Hindsight</span>
                <span className="font-mono text-[12px] text-[#00FF88] font-medium">RECALL</span>
              </div>
            </div>
          </div>

          {/* Sidebar Footer info */}
          <div className="p-4 border-t border-[#3a3a3a] text-[12px] font-sans text-[#7A7A7A] space-y-0.5">
            <div className="text-[#A8A8A8] font-medium">ChangeLens v1.0.0</div>
            <div>AWS Builder Center</div>
          </div>
        </aside>

        {/* Primary Operational Workspace (#292929 background) */}
        <main className="flex-1 min-w-0 overflow-y-auto bg-[#292929]">
          <div className="p-[32px] max-w-[1600px] mx-auto space-y-[32px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
