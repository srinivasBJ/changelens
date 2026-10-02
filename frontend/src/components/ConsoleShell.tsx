'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  Layers,
  Zap,
} from 'lucide-react';
import { ModeBadge } from '@/components/ModeBadge';

interface Props {
  children: React.ReactNode;
}

export const ConsoleShell: React.FC<Props> = ({ children }) => {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#ECECEC] flex flex-col font-sans selection:bg-[#2F6FAD] selection:text-white">
      {/* Top Engineering Control-Plane Header */}
      <header className="h-[44px] min-h-[44px] border-b border-[#2A2A2F] bg-[#121214] px-5 flex items-center justify-between shrink-0 z-40 select-none">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-5 h-5 rounded-[4px] bg-[#2F6FAD] flex items-center justify-center text-white font-sans font-bold text-xs shadow-sm">
              CL
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-sans font-semibold text-[15px] text-[#ECECEC] tracking-[0.02em]">
                ChangeLens
              </span>
              <span className="text-[12px] font-sans font-medium text-[#71717A]">
                / Control-Plane
              </span>
            </div>
          </Link>
          <span className="text-[#2A2A2F]">|</span>
          <div className="hidden sm:flex items-center gap-2 text-[12px] font-sans text-[#A1A1AA]">
            <span className="text-[#71717A] font-medium">Account:</span>
            <span className="text-[#ECECEC] font-mono text-[12px] tabular">979244568165</span>
            <span className="text-[#2A2A2F]">·</span>
            <span className="text-[#71717A] font-medium">Region:</span>
            <span className="text-[#ECECEC] font-mono text-[12px]">us-east-2</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-[6px] bg-[#17171A] border border-[#2A2A2F] text-[12px] font-sans text-[#A1A1AA]">
            <span className="w-2 h-2 rounded-full bg-[#D29922]" />
            <span className="font-medium text-[#ECECEC]">Memory: Local Fallback</span>
          </div>
          <ModeBadge mode={process.env.NEXT_PUBLIC_APP_MODE || 'live'} />
        </div>
      </header>

      {/* Main Container: Sidebar + Content */}
      <div className="flex-1 flex min-h-0">
        {/* Left Control-Plane Sidebar Navigation (260px) */}
        <aside className="w-[260px] min-w-[260px] max-w-[260px] border-r border-[#2A2A2F] bg-[#121214] flex flex-col justify-between shrink-0 select-none">
          <div className="p-3.5 space-y-5">
            {/* Primary Console Navigation */}
            <div className="space-y-1">
              <div className="px-2.5 pb-1 text-[11px] font-sans font-semibold uppercase tracking-[0.06em] text-[#71717A]">
                Console Navigation
              </div>
              <Link
                href="/investigations/inv_live_001"
                className={`flex items-center justify-between h-[40px] px-3 rounded-[6px] text-[13px] font-sans font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#58A6FF] ${
                  pathname.includes('inv_live_001')
                    ? 'bg-[#2F6FAD] hover:bg-[#3579BD] text-[#FFFFFF] font-semibold'
                    : 'text-[#A1A1AA] hover:text-[#ECECEC] hover:bg-[#232327]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-[#3FB950] shrink-0" />
                  <span className="font-semibold">Live Investigation</span>
                </div>
                <span className="text-[10px] font-sans font-semibold tracking-[0.06em] px-2 py-0.5 rounded-full bg-[rgba(63,185,80,0.15)] text-[#3FB950] uppercase border border-[rgba(63,185,80,0.3)]">
                  LIVE
                </span>
              </Link>
              <Link
                href="/"
                className={`flex items-center justify-between h-[40px] px-3 rounded-[6px] text-[13px] font-sans font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#58A6FF] ${
                  pathname === '/'
                    ? 'bg-[#2F6FAD] hover:bg-[#3579BD] text-[#FFFFFF] font-semibold'
                    : 'text-[#A1A1AA] hover:text-[#ECECEC] hover:bg-[#232327]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Activity className="w-4 h-4" />
                  <span>Overview</span>
                </div>
              </Link>
              <Link
                href="/changes"
                className={`flex items-center justify-between h-[40px] px-3 rounded-[6px] text-[13px] font-sans font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#58A6FF] ${
                  pathname.startsWith('/changes')
                    ? 'bg-[#2F6FAD] hover:bg-[#3579BD] text-[#FFFFFF] font-semibold'
                    : 'text-[#A1A1AA] hover:text-[#ECECEC] hover:bg-[#232327]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Zap className="w-4 h-4" />
                  <span>CloudTrail Changes</span>
                </div>
              </Link>
            </div>

            {/* Secondary / Simulated Sandboxes */}
            <div className="space-y-1 pt-2 border-t border-[#2A2A2F]">
              <div className="px-2.5 pb-1 text-[11px] font-sans font-semibold uppercase tracking-[0.06em] text-[#71717A]">
                Simulated Sandbox
              </div>
              <Link
                href="/investigations/inv_demo_001"
                className={`flex items-center justify-between h-[40px] px-3 rounded-[6px] text-[13px] font-sans font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#58A6FF] ${
                  pathname.includes('inv_demo_001')
                    ? 'bg-[#2F6FAD] hover:bg-[#3579BD] text-[#FFFFFF] font-semibold'
                    : 'text-[#A1A1AA] hover:text-[#ECECEC] hover:bg-[#232327]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-[#71717A]" />
                  <span>Demo Investigation</span>
                </div>
                <span className="text-[10px] font-sans font-semibold tracking-[0.06em] px-2 py-0.5 rounded-full bg-[rgba(210,153,34,0.15)] text-[#D29922] uppercase border border-[rgba(210,153,34,0.3)]">
                  DEMO
                </span>
              </Link>
            </div>

            {/* Monitored AWS Workload Topology */}
            <div className="space-y-2">
              <div className="px-2.5 pb-1 text-[11px] font-sans font-semibold uppercase tracking-[0.06em] text-[#71717A]">
                Monitored Topology
              </div>
              <div className="space-y-1.5">
                <div className="p-2.5 rounded-[6px] bg-[#17171A] border border-[#2A2A2F]">
                  <div className="text-[11px] font-sans font-medium text-[#71717A]">API Gateway</div>
                  <div className="truncate font-mono text-[12px] text-[#ECECEC] tabular">changelens-checkout-api</div>
                </div>
                <div className="p-2.5 rounded-[6px] bg-[#17171A] border border-[#2A2A2F]">
                  <div className="text-[11px] font-sans font-medium text-[#71717A]">Lambda Function</div>
                  <div className="truncate font-mono text-[12px] text-[#58A6FF] font-semibold tabular">checkout-function</div>
                </div>
                <div className="p-2.5 rounded-[6px] bg-[#17171A] border border-[#2A2A2F]">
                  <div className="text-[11px] font-sans font-medium text-[#71717A]">DynamoDB Table</div>
                  <div className="truncate font-mono text-[12px] text-[#ECECEC] tabular">checkout-table</div>
                </div>
              </div>
            </div>

            {/* Evidence & Memory Subsystems */}
            <div className="space-y-1.5 font-sans">
              <div className="px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#71717A]">
                Intelligence Feeds
              </div>
              <div className="px-2.5 py-1.5 text-[12px] text-[#A1A1AA] flex items-center justify-between border-b border-[#2A2A2F]">
                <span>CloudTrail</span>
                <span className="font-mono text-[11px] text-[#3FB950] font-medium">LOOKUP</span>
              </div>
              <div className="px-2.5 py-1.5 text-[12px] text-[#A1A1AA] flex items-center justify-between border-b border-[#2A2A2F]">
                <span>CloudWatch</span>
                <span className="font-mono text-[11px] text-[#3FB950] font-medium">METRICS</span>
              </div>
              <div className="px-2.5 py-1.5 text-[12px] text-[#A1A1AA] flex items-center justify-between">
                <span>Memory Bank</span>
                <span className="font-mono text-[11px] text-[#D29922] font-medium">FALLBACK</span>
              </div>
            </div>
          </div>

          {/* Sidebar Footer info */}
          <div className="p-3.5 border-t border-[#2A2A2F] text-[11px] font-sans text-[#71717A] space-y-0.5">
            <div className="text-[#A1A1AA] font-medium">ChangeLens v1.0.0</div>
            <div>AWS Builder Center</div>
          </div>
        </aside>

        {/* Primary Operational Workspace (#0A0A0B background, 24px padding) */}
        <main className="flex-1 min-w-0 overflow-y-auto bg-[#0A0A0B]">
          <div className="p-6 max-w-[1600px] mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
