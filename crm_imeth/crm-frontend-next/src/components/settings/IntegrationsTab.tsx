"use client";

import {
  Smartphone,
  Calendar,
  Webhook,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

interface IntegrationsTabProps {
  onNavigateToMeta?: () => void;
}

export default function IntegrationsTab({ onNavigateToMeta }: IntegrationsTabProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center gap-2.5 pb-6 border-b border-slate-200">
        <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
          <Webhook className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Connected Accounts & Integrations
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage external service connections, WhatsApp Business API endpoints, and calendar synchronization.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* WhatsApp Business Cloud API */}
        <div className="rounded-2xl border border-slate-200 p-5 bg-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
                <Smartphone className="h-5 w-5" />
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="h-3 w-3" />
                Active / Ready
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Meta WhatsApp Cloud API
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Enables live 2-way WhatsApp chats, automated drip messaging, and quick template delivery directly to prospect phones.
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">
              Permanent Token Active
            </span>
            {onNavigateToMeta ? (
              <button
                type="button"
                onClick={onNavigateToMeta}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 cursor-pointer"
              >
                Configure Meta API <ExternalLink className="h-3 w-3" />
              </button>
            ) : (
              <span className="text-xs font-bold text-blue-600">Configured</span>
            )}
          </div>
        </div>

        {/* Google Calendar Sync */}
        <div className="rounded-2xl border border-slate-200 p-5 bg-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
                <Calendar className="h-5 w-5" />
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                Optional
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Google Calendar Sync
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Automatically sync CRM follow-ups, calls, and customer demos directly with your personal Google Calendar account.
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">
              Not connected
            </span>
            <button
              type="button"
              onClick={() => alert("Google Calendar integration is scheduled for your tenant domain.")}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer"
            >
              Connect Calendar
            </button>
          </div>
        </div>

        {/* Webhooks & Outbound Dispatch */}
        <div className="rounded-2xl border border-slate-200 p-5 bg-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shadow-xs">
                <Webhook className="h-5 w-5" />
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200">
                Webhook v2
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Outbound Webhooks
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Stream live CRM events (Lead Created, Stage Changed, Win Celebrations) to your backend or Zapier.
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">
              https://crm.api/webhook/meta
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
              <ShieldCheck className="h-3.5 w-3.5" /> Verified
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
