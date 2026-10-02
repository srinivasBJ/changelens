import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import { ModeBadge } from '@/components/ModeBadge';
import { Layers, Activity, ShieldCheck, History, ExternalLink } from 'lucide-react';

export const metadata: Metadata = {
  title: 'ChangeLens — AWS Change Impact & Operational Memory',
  description:
    'Evidence-driven operational intelligence layer above AWS observability connecting infrastructure changes, telemetry anomalies, and Hindsight operational memory.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased selection:bg-indigo-500 selection:text-white">
        {/* Top Operational Navigation Bar */}
        <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Brand Logo & Tagline */}
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                  <Activity className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
                    ChangeLens
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-normal bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      v1.0
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 -mt-0.5 hidden sm:block">
                    AWS Change Impact & Operational Memory
                  </div>
                </div>
              </Link>
            </div>

            {/* Navigation Links */}
            <nav className="flex items-center gap-1 sm:gap-4 text-xs font-semibold text-slate-300">
              <Link
                href="/"
                className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-slate-800/80 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/investigations/inv_demo_001"
                className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-slate-800/80 transition-colors flex items-center gap-1.5 text-indigo-300"
              >
                <Layers className="w-3.5 h-3.5" />
                Live Investigation
              </Link>
              <Link
                href="/changes"
                className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-slate-800/80 transition-colors"
              >
                Changes
              </Link>
            </nav>

            {/* Mode Indicator Badge */}
            <div className="flex items-center gap-3">
              <ModeBadge mode={process.env.NEXT_PUBLIC_APP_MODE || 'demo'} />
            </div>
          </div>
        </header>

        {/* Main Application Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        {/* Footer with Attribution */}
        <footer className="border-t border-slate-800/80 bg-slate-900/40 text-xs text-slate-400 py-6 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-300">ChangeLens</span>
              <span>· AWS Builder Center Hackathon (Zero to Shipped)</span>
            </div>
            <div className="flex items-center gap-4 text-slate-400 text-[11px]">
              <span>Telemetry: CloudTrail + CloudWatch</span>
              <span>·</span>
              <span>Memory: Hindsight™ Bank</span>
              <span>·</span>
              <span>Region: us-east-2</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
