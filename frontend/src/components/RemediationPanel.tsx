'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  ExternalLink,
  RotateCcw,
  Shield,
  Terminal,
  Wrench,
} from 'lucide-react';
import { RemediationPlan } from '@/lib/types';

interface RemediationPanelProps {
  plan?: RemediationPlan;
  fallbackResource?: string;
}

export function RemediationPanel({ plan, fallbackResource = 'checkout-function' }: RemediationPanelProps) {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({
    0: true,
    1: true,
    2: true,
    3: true,
  });

  if (!plan) {
    return (
      <div className="rounded-[6px] border border-[#2A2A2F] bg-[#121214] p-5 text-center">
        <p className="text-[13px] font-sans text-[#71717A]">
          Remediation runbook generating for {fallbackResource}...
        </p>
      </div>
    );
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2500);
  };

  const toggleCheck = (idx: number) => {
    setCheckedItems((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const getRiskBadge = (level: string) => {
    switch (level.toUpperCase()) {
      case 'LOW':
        return (
          <span className="text-[11px] font-sans font-semibold px-2 py-0.5 rounded-full bg-[rgba(63,185,80,0.15)] text-[#3FB950] border border-[rgba(63,185,80,0.3)]">
            Risk: Low
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="text-[11px] font-sans font-semibold px-2 py-0.5 rounded-full bg-[rgba(210,153,34,0.15)] text-[#D29922] border border-[rgba(210,153,34,0.3)]">
            Risk: Medium
          </span>
        );
      default:
        return (
          <span className="text-[11px] font-sans font-semibold px-2 py-0.5 rounded-full bg-[rgba(248,81,73,0.15)] text-[#F85149] border border-[rgba(248,81,73,0.3)]">
            Risk: High
          </span>
        );
    }
  };

  return (
    <div className="rounded-[8px] border border-[#2A2A2F] bg-[#121214] overflow-hidden shadow-lg">
      {/* Panel Header */}
      <div className="px-5 py-4 border-b border-[#2A2A2F] flex flex-wrap items-center justify-between gap-3 bg-[#17171A]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[6px] bg-[rgba(88,166,255,0.12)] border border-[rgba(88,166,255,0.3)] flex items-center justify-center">
            <Wrench className="w-4 h-4 text-[#58A6FF]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[16px] font-sans font-semibold text-[#ECECEC] tracking-[-0.01em]">
                Actionable Remediation & Rollback Runbook
              </h3>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#232327] text-[#A1A1AA] border border-[#3F3F46]">
                v1.2.0
              </span>
            </div>
            <p className="text-[12px] font-sans text-[#A1A1AA] mt-0.5">
              Target Resource:{' '}
              <span className="font-mono text-[#58A6FF] font-medium">{plan.target_resource}</span>
              {' · '}Action:{' '}
              <span className="font-mono text-[#E4E4E7]">{plan.action_type}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {getRiskBadge(plan.risk_level)}
          <span className="text-[11px] font-sans text-[#71717A] hidden sm:inline">
            Automated Plan
          </span>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Primary Rollback Command Card */}
        <div className="rounded-[6px] border border-[rgba(88,166,255,0.25)] bg-[#0A0A0B] p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[12px] font-sans font-semibold text-[#58A6FF]">
              <Terminal className="w-3.5 h-3.5" />
              <span>Primary AWS CLI Rollback Command</span>
            </div>
            <button
              onClick={() => handleCopy(plan.primary_command, 'primary')}
              className="px-2.5 py-1 rounded-[4px] bg-[#232327] hover:bg-[#2A2A2F] border border-[#3F3F46] text-[11px] font-sans text-[#ECECEC] flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#58A6FF]"
              title="Copy rollback command"
            >
              {copiedCmd === 'primary' ? (
                <>
                  <Check className="w-3 h-3 text-[#3FB950]" />
                  <span className="text-[#3FB950]">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-[#A1A1AA]" />
                  <span>Copy CLI</span>
                </>
              )}
            </button>
          </div>
          <div className="font-mono text-[12px] text-[#7EE787] bg-[#121214] p-3 rounded-[4px] border border-[#2A2A2F] overflow-x-auto select-all">
            {plan.primary_command}
          </div>
          <p className="text-[12px] font-sans text-[#A1A1AA] leading-[1.5]">
            {plan.summary}
          </p>
        </div>

        {/* Step-by-Step Procedure */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-[13px] font-sans font-semibold text-[#ECECEC] uppercase tracking-[0.05em]">
              Execution Procedure ({plan.steps.length} Steps)
            </h4>
            <span className="text-[11px] font-sans text-[#71717A]">
              Follow in sequential order
            </span>
          </div>

          <div className="space-y-2.5">
            {plan.steps.map((step) => (
              <div
                key={step.step_number}
                className="rounded-[6px] border border-[#2A2A2F] bg-[#17171A] p-3.5 space-y-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#232327] border border-[#3F3F46] text-[11px] font-mono font-semibold text-[#ECECEC] flex items-center justify-center shrink-0">
                      {step.step_number}
                    </span>
                    <span className="text-[13px] font-sans font-semibold text-[#ECECEC]">
                      {step.title}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-[#A1A1AA] shrink-0">
                    {step.target_resource}
                  </span>
                </div>

                <p className="text-[12px] font-sans text-[#D4D4D8] pl-7">
                  {step.action}
                </p>

                {step.command && (
                  <div className="pl-7 pt-1">
                    <div className="flex items-center justify-between bg-[#0A0A0B] rounded-[4px] border border-[#2A2A2F] px-3 py-1.5 font-mono text-[11px] text-[#A1A1AA]">
                      <span className="truncate select-all">{step.command}</span>
                      <button
                        onClick={() => handleCopy(step.command!, `step_${step.step_number}`)}
                        className="ml-2 p-1 hover:text-[#ECECEC] text-[#71717A] shrink-0"
                        title="Copy command"
                      >
                        {copiedCmd === `step_${step.step_number}` ? (
                          <Check className="w-3 h-3 text-[#3FB950]" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <div className="pl-7 pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-sans text-[#71717A] border-t border-[#232327]">
                  <span className="text-[#3FB950]">
                    Expected: {step.expected_result}
                  </span>
                  <span className="text-[#A1A1AA] italic">
                    Safety: {step.safety_check}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pre-Flight Safety Checklist & AWS Console Deep-Links Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
          {/* Pre-flight checklist */}
          <div className="rounded-[6px] border border-[#2A2A2F] bg-[#17171A] p-4 space-y-3">
            <div className="flex items-center gap-2 text-[13px] font-sans font-semibold text-[#ECECEC]">
              <Shield className="w-4 h-4 text-[#3FB950]" />
              <span>Pre-Flight Safety Checklist</span>
            </div>
            <div className="space-y-2">
              {plan.safety_checklist.map((item, idx) => (
                <label
                  key={idx}
                  onClick={() => toggleCheck(idx)}
                  className="flex items-start gap-2.5 text-[12px] font-sans text-[#D4D4D8] cursor-pointer hover:text-[#ECECEC] select-none"
                >
                  <input
                    type="checkbox"
                    checked={!!checkedItems[idx]}
                    onChange={() => {}}
                    className="mt-0.5 rounded border-[#3F3F46] bg-[#0A0A0B] text-[#2F6FAD] focus:ring-0 cursor-pointer"
                  />
                  <span className={checkedItems[idx] ? 'text-[#ECECEC]' : 'text-[#71717A] line-through'}>
                    {item}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Direct AWS Console Deep-Links */}
          <div className="rounded-[6px] border border-[#2A2A2F] bg-[#17171A] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[13px] font-sans font-semibold text-[#ECECEC]">
                <ExternalLink className="w-4 h-4 text-[#58A6FF]" />
                <span>AWS Console Direct Launchers</span>
              </div>
              <span className="text-[10px] font-mono text-[#58A6FF] px-1.5 py-0.5 rounded bg-[rgba(88,166,255,0.1)] border border-[rgba(88,166,255,0.2)]">
                us-east-2
              </span>
            </div>

            <div className="space-y-1.5">
              {plan.console_links.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2 rounded-[4px] hover:bg-[#232327] border border-transparent hover:border-[#3F3F46] transition-colors group"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-[12px] font-sans font-medium text-[#ECECEC] group-hover:text-[#58A6FF] transition-colors truncate">
                      {link.title}
                    </p>
                    <p className="text-[11px] font-sans text-[#71717A] truncate">
                      {link.description}
                    </p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#71717A] group-hover:text-[#58A6FF] shrink-0" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
