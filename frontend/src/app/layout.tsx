import type { Metadata } from 'next';
import './globals.css';
import { ConsoleShell } from '@/components/ConsoleShell';

export const metadata: Metadata = {
  title: 'ChangeLens — AWS Engineering Control-Plane',
  description:
    'Evidence-driven operational intelligence layer connecting infrastructure changes, telemetry anomalies, and Hindsight operational memory.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0d0f12] text-slate-200 min-h-screen antialiased">
        <ConsoleShell>{children}</ConsoleShell>
      </body>
    </html>
  );
}
