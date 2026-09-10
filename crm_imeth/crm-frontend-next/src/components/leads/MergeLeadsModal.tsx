"use client";

import { useState, useEffect, useMemo } from "react";
import { apiClient } from "@/lib/api-client";
import {
  GitMerge,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  X,
  Loader2,
  ShieldAlert,
  User,
  Phone,
  Calendar,
  Layers,
  ArrowDown,
} from "lucide-react";
import type { Lead } from "@/types";

interface MergeLeadsModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: Lead[];
  onSuccess?: () => void;
  initialPrimaryLeadId?: string;
  initialSecondaryLeadId?: string;
}

export default function MergeLeadsModal({
  isOpen,
  onClose,
  leads = [],
  onSuccess,
  initialPrimaryLeadId = "",
  initialSecondaryLeadId = "",
}: MergeLeadsModalProps) {
  const [primaryLeadId, setPrimaryLeadId] = useState<string>(initialPrimaryLeadId);
  const [secondaryLeadId, setSecondaryLeadId] = useState<string>(initialSecondaryLeadId);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setPrimaryLeadId(initialPrimaryLeadId);
      setSecondaryLeadId(initialSecondaryLeadId);
      setErrorMessage("");
      setSuccessMessage("");
    }
  }, [isOpen, initialPrimaryLeadId, initialSecondaryLeadId]);

  const primaryLead = useMemo(
    () => leads.find((l) => l.id === primaryLeadId),
    [leads, primaryLeadId]
  );

  const secondaryLead = useMemo(
    () => leads.find((l) => l.id === secondaryLeadId),
    [leads, secondaryLeadId]
  );

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!primaryLeadId || !secondaryLeadId) {
      setErrorMessage("Please select both a Primary Lead and a Secondary Lead.");
      return;
    }

    if (primaryLeadId === secondaryLeadId) {
      setErrorMessage("Primary and Secondary leads must be different. Please select two distinct leads.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiClient<Lead>("/leads/merge", {
        method: "POST",
        body: JSON.stringify({
          primaryLeadId,
          secondaryLeadId,
        }),
      });

      if (response.success) {
        setSuccessMessage(response.message || "Leads successfully merged!");
        if (onSuccess) {
          onSuccess();
        }
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setErrorMessage(response.error || "Failed to merge leads. Please try again.");
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "An unexpected error occurred while merging leads."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={!isSubmitting ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#128c7e]/10 text-[#128c7e] shadow-xs">
              <GitMerge className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                Merge Duplicate Leads
              </h2>
              <p className="text-xs text-slate-500">
                Consolidate conversations, activities, and tasks into a single primary record
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Alerts */}
          {errorMessage && (
            <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-xs font-medium text-red-700 flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <span className="flex-1">{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-medium text-emerald-800 flex items-start gap-3">
              <CheckCircle2 className="h-4 w-4 text-[#25d366] shrink-0 mt-0.5" />
              <span className="flex-1">{successMessage}</span>
            </div>
          )}

          {/* Warning Banner */}
          <div className="rounded-2xl bg-amber-50/70 border border-amber-200/80 p-4 text-xs text-amber-800 flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-amber-900">Important Merging Notice</p>
              <p className="leading-relaxed text-amber-700">
                All messages, follow-up tasks, timeline activities, and file attachments from the
                <strong> Secondary Lead</strong> will be transferred to the <strong>Primary Lead</strong>.
                The secondary lead will then be permanently deleted. This action cannot be reversed.
              </p>
            </div>
          </div>

          {/* Selection Dropdowns Grid */}
          <form id="merge-leads-form" onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Primary Lead Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>1. Select Primary Lead (Keep)</span>
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    Target
                  </span>
                </label>
                <select
                  value={primaryLeadId}
                  onChange={(e) => setPrimaryLeadId(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 p-2.5 text-xs text-slate-900 font-medium focus:border-[#128c7e] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#128c7e]/20 transition-all cursor-pointer disabled:opacity-50"
                  required
                >
                  <option value="">-- Choose Primary Lead --</option>
                  {leads.map((lead) => {
                    const isSecondary = lead.id === secondaryLeadId;
                    return (
                      <option key={lead.id} value={lead.id} disabled={isSecondary}>
                        {lead.name || "Unnamed"} ({lead.phoneNumber}) - {lead.status}
                        {isSecondary ? " [Selected as Secondary]" : ""}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Secondary Lead Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>2. Select Secondary Lead (Merge & Delete)</span>
                  <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                    Will Delete
                  </span>
                </label>
                <select
                  value={secondaryLeadId}
                  onChange={(e) => setSecondaryLeadId(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 p-2.5 text-xs text-slate-900 font-medium focus:border-red-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all cursor-pointer disabled:opacity-50"
                  required
                >
                  <option value="">-- Choose Secondary Lead --</option>
                  {leads.map((lead) => {
                    const isPrimary = lead.id === primaryLeadId;
                    return (
                      <option key={lead.id} value={lead.id} disabled={isPrimary}>
                        {lead.name || "Unnamed"} ({lead.phoneNumber}) - {lead.status}
                        {isPrimary ? " [Selected as Primary]" : ""}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Comparison / Flow Preview Cards */}
            {primaryLead && secondaryLead && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5" />
                  Merge Flow Preview
                </p>

                <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                  {/* Secondary Lead Card */}
                  <div className="w-full md:w-1/2 rounded-xl border border-red-200 bg-red-50/50 p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-red-800 truncate">
                        {secondaryLead.name || "Unnamed Lead"}
                      </span>
                      <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded">
                        Deletes
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                      <Phone className="h-3 w-3 text-slate-400" />
                      <span>{secondaryLead.phoneNumber}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                      <Calendar className="h-3 w-3" />
                      <span>Created {new Date(secondaryLead.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Direction Arrow */}
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-600">
                    <ArrowDown className="h-4 w-4 md:hidden" />
                    <ArrowRight className="h-4 w-4 hidden md:block" />
                  </div>

                  {/* Primary Lead Card */}
                  <div className="w-full md:w-1/2 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-900 truncate">
                        {primaryLead.name || "Unnamed Lead"}
                      </span>
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                        Preserved
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                      <Phone className="h-3 w-3 text-slate-400" />
                      <span>{primaryLead.phoneNumber}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                      <User className="h-3 w-3" />
                      <span>Assigned to: {primaryLead.assignedTo?.name || primaryLead.assignedTo?.email || "Unassigned"}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Action Buttons Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            form="merge-leads-form"
            disabled={isSubmitting || !primaryLeadId || !secondaryLeadId || primaryLeadId === secondaryLeadId}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#128c7e] hover:bg-[#075e54] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Merging Records...
              </>
            ) : (
              <>
                <GitMerge className="h-4 w-4" />
                Confirm & Merge Leads
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
