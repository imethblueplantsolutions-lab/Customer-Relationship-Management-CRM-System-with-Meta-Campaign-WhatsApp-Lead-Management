"use client";

import { useState } from "react";
import {
  Download,
  AlertTriangle,
  Trash2,
  ShieldAlert,
  LogOut,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import type { User } from "@/types";

interface DangerZoneTabProps {
  user: User | null;
  onLogout: () => void;
}

export default function DangerZoneTab({ user, onLogout }: DangerZoneTabProps) {
  const [downloading, setDownloading] = useState(false);
  const [exportedSuccess, setExportedSuccess] = useState(false);

  const handleExportData = () => {
    setDownloading(true);
    setTimeout(() => {
      const exportPayload = {
        exportedAt: new Date().toISOString(),
        user: {
          id: user?.id,
          name: user?.name,
          email: user?.email,
          role: user?.role,
          phone: user?.phone,
          bio: user?.bio,
          tenantId: user?.tenantId,
        },
        exportFormat: "CRM_ACCOUNT_EXPORT_v1",
      };

      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `crm-account-export-${user?.id || "data"}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloading(false);
      setExportedSuccess(true);
      setTimeout(() => setExportedSuccess(false), 4000);
    }, 600);
  };

  const handleClearCache = () => {
    if (window.confirm("This will clear local storage cached tokens and reload the CRM. Proceed?")) {
      try {
        const theme = localStorage.getItem("crm_active_theme");
        localStorage.clear();
        if (theme) localStorage.setItem("crm_active_theme", theme);
        window.location.reload();
      } catch {
        window.location.reload();
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center gap-2.5 pb-6 border-b border-slate-200">
        <div className="h-9 w-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shadow-xs">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Account Preferences & Danger Zone
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Export your personal CRM records, invalidate active sessions, or reset browser tokens.
          </p>
        </div>
      </div>

      {exportedSuccess && (
        <div className="rounded-xl p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Your CRM account data has been compiled and downloaded as JSON.</span>
        </div>
      )}

      {/* Export Data Card */}
      <div className="rounded-2xl border border-slate-200 p-5 bg-white space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Download className="h-4 w-4 text-blue-600" />
              Export My Account Data
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Generate a secure JSON archive containing your profile details, assigned lead IDs, settings, and authorization history.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportData}
            disabled={downloading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shrink-0 cursor-pointer shadow-xs active:scale-95 transition-all disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            {downloading ? "Exporting..." : "Download JSON"}
          </button>
        </div>
      </div>

      {/* Clear Cache Card */}
      <div className="rounded-2xl border border-slate-200 p-5 bg-white space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-amber-600" />
              Reset Local Workspace Cache
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Clears stale UI cache, temporary pipeline board filters, and resets WebSocket listener sockets.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClearCache}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold shrink-0 cursor-pointer transition-all active:scale-95"
          >
            Purge Cache
          </button>
        </div>
      </div>

      {/* Danger Zone: Log Out / Deactivation */}
      <div className="rounded-2xl border border-red-200 p-5 bg-red-50/40 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-red-700 uppercase tracking-wider">
          <ShieldAlert className="h-4 w-4 text-red-600" />
          Critical Security Actions
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-red-100">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Revoke Session & Log Out Everywhere
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Invalidates your current JWT token on this device and logs you out immediately.
            </p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shrink-0 cursor-pointer shadow-xs active:scale-95 transition-all"
          >
            <LogOut className="h-3.5 w-3.5" />
            Log Out Now
          </button>
        </div>
      </div>
    </div>
  );
}
