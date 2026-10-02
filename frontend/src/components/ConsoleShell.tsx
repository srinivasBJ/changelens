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
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import { ModeBadge } from '@/components/ModeBadge';

interface Props {
  children: React.ReactNode;
}

export const ConsoleShell: React.FC<Props> = ({ children }) => {
  const pathname = usePathname();

  const isRouteActive = (route: string) => {
    if (route === '/' && pathname === '/') return true;
    if (route !== '/' && pathname.startsWith(route)) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-[#0d0f12] text-slate-200 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Engineering Control-Plane Header */}
      <header className="h-11 border-b border-[#222733] bg-[#0e1116] px-4 flex items-center justify-between shrink-0 z-40 select-none">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center text-white font-mono font-bold text-xs shadow-sm">
              CL
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono font-bold text-xs text-slate-100 tracking-wider">
                CHANGELENS
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                / CONTROL-PLANE
              </span>
            </div>
          </Link>
          <span className="text-slate-600">|</span>
          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <span className="text-slate-400">ACCOUNT:</span>
            <span className="text-slate-200">979244568165</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400">REGION:</span>
            <span className="text-slate-200">us-east-2</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-2 py-0.5 rounded bg-[#13161c] border border-[#222733] text-[10px] font-mono text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>HINDSIGHT: ACTIVE</span>
          </div>
          <ModeBadge mode={process.env.NEXT_PUBLIC_APP_MODE || 'live'} />
        </div>
      </header>

      {/* Main Container: Sidebar + Content */}
      <div className="flex-1 flex min-h-0">
        {/* Left Control-Plane Sidebar Navigation */}
        <aside className="w-56 border-r border-[#222733] bg-[#0e1116] flex flex-col justify-between shrink-0 select-none">
          <div className="p-3 space-y-5">
            {/* Primary Console Navigation */}
            <div className="space-y-1">
              <div className="px-2 pb-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Console
              </div>
              <Link
                href="/"
                className={`flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                  pathname === '/'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-[#161a22]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Overview</span>
                </div>
              </Link>
              <Link
                href="/investigations/inv_live_001"
                className={`flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                  pathname.includes('inv_live_001')
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-[#161a22]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span>Live Investigation</span>
                </div>
                <span className="text-[9px] font-mono font-bold px-1 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  LIVE
                </span>
              </Link>
              <Link
                href="/investigations/inv_demo_001"
                className={`flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                  pathname.includes('inv_demo_001')
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-[#161a22]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Demo Investigation</span>
                </div>
                <span className="text-[9px] font-mono font-bold px-1 py-0.2 rounded bg-amber-950 text-amber-400 border border-amber-800">
                  DEMO
                </span>
              </Link>
              <Link
                href="/changes"
                className={`flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                  pathname.startsWith('/changes')
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-[#161a22]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5" />
                  <span>CloudTrail Changes</span>
                </div>
              </Link>
            </div>

            {/* Monitored AWS Workload Topology */}
            <div className="space-y-1.5">
              <div className="px-2 pb-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Monitored Topology
              </div>
              <div className="space-y-1 text-[11px] font-mono">
                <div className="px-2 py-1 rounded bg-[#13161c] border border-[#1f242e] text-slate-300">
                  <div className="text-[9px] uppercase text-slate-400">API Gateway</div>
                  <div className="truncate text-slate-200">changelens-checkout-api</div>
                </div>
                <div className="px-2 py-1 rounded bg-[#13161c] border border-[#1f242e] text-slate-300">
                  <div className="text-[9px] uppercase text-slate-400">Lambda Function</div>
                  <div className="truncate text-blue-300 font-semibold">checkout-function</div>
                </div>
                <div className="px-2 py-1 rounded bg-[#13161c] border border-[#1f242e] text-slate-300">
                  <div className="text-[9px] uppercase text-slate-400">DynamoDB Table</div>
                  <div className="truncate text-slate-200">checkout-table</div>
                </div>
              </div>
            </div>

            {/* Evidence & Memory Subsystems */}
            <div className="space-y-1 text-[11px] font-mono">
              <div className="px-2 pb-1 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                Intelligence Feeds
              </div>
              <div className="px-2 py-1 text-slate-400 flex items-center justify-between">
                <span>CloudTrail:</span>
                <span className="text-emerald-400">LOOKUP</span>
              </div>
              <div className="px-2 py-1 text-slate-400 flex items-center justify-between">
                <span>CloudWatch:</span>
                <span className="text-emerald-400">METRICS</span>
              </div>
              <div className="px-2 py-1 text-slate-400 flex items-center justify-between">
                <span>Hindsight:</span>
                <span className="text-emerald-400">RECALL</span>
              </div>
            </div>
          </div>

          {/* Sidebar Footer info */}
          <div className="p-3 border-t border-[#222733] text-[10px] font-mono text-slate-400 space-y-0.5">
            <div>CHANGELENS v1.0.0</div>
            <div>AWS BUILDER CENTER</div>
          </div>
        </aside>

        {/* Primary Operational Workspace */}
        <main className="flex-1 min-w-0 overflow-y-auto bg-[#0d0f12]">
          <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
