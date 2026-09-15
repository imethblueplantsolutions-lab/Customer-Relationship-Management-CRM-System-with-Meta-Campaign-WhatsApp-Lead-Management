"use client";

import { useState } from "react";
import {
  Megaphone,
  User as UserIcon,
  Pencil,
  X,
  Save,
  Loader2,
  ExternalLink,
} from "lucide-react";
import type { Lead, Attachment } from "@/types";
import AttachmentUploader from "@/components/AttachmentUploader";

interface LeadInfoCardProps {
  lead: Lead;
  canManageAssignment: boolean;
  agents: { id: string; name?: string; email: string; role: string }[];
  assigningLead: boolean;
  onAssignLead: (agentId: string) => Promise<void>;
  onSaveDetails: (details: {
    name: string;
    displayName: string;
    whatsappNumber: string;
    email: string;
    notes: string;
  }) => Promise<void>;
  onAttachmentUploadSuccess: (attachment: Attachment) => void;
  onAttachmentDelete: (attachmentId: string) => void;
}

export default function LeadInfoCard({
  lead,
  canManageAssignment,
  agents,
  assigningLead,
  onAssignLead,
  onSaveDetails,
  onAttachmentUploadSuccess,
  onAttachmentDelete,
}: LeadInfoCardProps) {
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editWhatsappNumber, setEditWhatsappNumber] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [savingDetails, setSavingDetails] = useState(false);

  const enterEditMode = () => {
    setEditName(lead.name || "");
    setEditDisplayName(lead.displayName || "");
    setEditWhatsappNumber(lead.whatsappNumber || "");
    setEditEmail(lead.email || "");
    setEditNotes(lead.notes || "");
    setEditMode(true);
  };

  const handleSave = async () => {
    setSavingDetails(true);
    try {
      await onSaveDetails({
        name: editName,
        displayName: editDisplayName,
        whatsappNumber: editWhatsappNumber,
        email: editEmail,
        notes: editNotes,
      });
      setEditMode(false);
    } finally {
      setSavingDetails(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── Meta Campaign Attribution Card ─────────────────────── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Megaphone className="h-4 w-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-800">
            Meta Ad Attribution
          </h3>
        </div>

        {lead.attribution ? (
          <div className="space-y-3.5 text-xs">
            {lead.attribution.headline && (
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-0.5">
                  Ad Headline
                </span>
                <p className="font-semibold text-slate-800 bg-slate-50 rounded-lg p-2 border border-slate-100">
                  {lead.attribution.headline}
                </p>
              </div>
            )}

            {lead.attribution.body && (
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-0.5">
                  Ad Copy / Body
                </span>
                <p className="text-slate-600 leading-relaxed bg-slate-50 rounded-lg p-2 border border-slate-100">
                  {lead.attribution.body}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-0.5">
                  Ad ID
                </span>
                <p className="font-mono text-[11px] text-slate-700 truncate">
                  {lead.attribution.adId || "—"}
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-0.5">
                  Source
                </span>
                <p className="capitalize text-slate-700">
                  {lead.attribution.sourceType || "Click-to-WhatsApp"}
                </p>
              </div>
            </div>

            {lead.attribution.sourceUrl && (
              <a
                href={lead.attribution.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline font-semibold mt-1"
              >
                <span>View Landing Page / Ad</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center">
            <p className="text-xs font-medium text-slate-500">Organic WhatsApp Lead</p>
            <p className="text-[11px] text-slate-400 mt-1">
              This lead reached out directly without clicking a sponsored Meta Ad campaign.
            </p>
          </div>
        )}
      </div>

      {/* ─── Lead Details & Metadata Card ──────────────────────── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-slate-500" /> Lead Overview
          </h3>
          {!editMode ? (
            <button
              onClick={enterEditMode}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-[#0F4C75] hover:underline cursor-pointer transition-colors"
            >
              <Pencil className="h-3 w-3" />
              Edit Details
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditMode(false)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-3 w-3" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={savingDetails}
                className="inline-flex items-center gap-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg disabled:opacity-50 cursor-pointer transition-colors"
              >
                {savingDetails ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Save className="h-3 w-3" />
                )}
                Save
              </button>
            </div>
          )}
        </div>

        {editMode ? (
          /* ─── Edit Mode ─── */
          <div className="space-y-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
                Client Name
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="e.g. Katherine Lim"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
                placeholder="e.g. Katherine"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">Display name is what your clients will see</p>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
                WhatsApp Number
              </label>
              <input
                type="tel"
                value={editWhatsappNumber}
                onChange={(e) => setEditWhatsappNumber(e.target.value)}
                placeholder="e.g. +94 1234 5678"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 font-mono placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="e.g. katherine@example.com"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
                Notes
              </label>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={3}
                placeholder="Add notes about your client here..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all resize-none"
              />
            </div>
          </div>
        ) : (
          /* ─── Read Mode ─── */
          <div className="space-y-3.5 text-xs">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-0.5">
                Client Name
              </span>
              <p className="font-semibold text-slate-800">{lead.name || "—"}</p>
            </div>

            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-0.5">
                Display Name
              </span>
              <p className="font-semibold text-slate-800">{lead.displayName || "—"}</p>
            </div>

            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-0.5">
                Mobile Number
              </span>
              <p className="font-mono text-slate-800">{lead.phoneNumber}</p>
            </div>

            {lead.whatsappNumber && (
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-0.5">
                  WhatsApp Number
                </span>
                <p className="font-mono text-slate-800">{lead.whatsappNumber}</p>
              </div>
            )}

            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-0.5">
                Email Address
              </span>
              <p className="text-slate-800">{lead.email || "—"}</p>
            </div>

            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-0.5">
                Assigned Agent
              </span>
              {canManageAssignment ? (
                <div className="mt-1">
                  <select
                    value={lead.assignedToId || ""}
                    onChange={(e) => onAssignLead(e.target.value)}
                    disabled={assigningLead}
                    className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none cursor-pointer"
                  >
                    <option value="">Unassigned</option>
                    {agents.map((ag) => (
                      <option key={ag.id} value={ag.id}>
                        {ag.name
                          ? `${ag.name} (${ag.role === "ADMIN" ? "Admin" : ag.role === "TEAM_LEAD" ? "Team Lead" : "Sales Agent"})`
                          : `${ag.email} (${ag.role})`}
                      </option>
                    ))}
                  </select>
                  {assigningLead && (
                    <p className="text-[10px] text-blue-600 mt-0.5">Saving assignment...</p>
                  )}
                </div>
              ) : (
                <p className="font-semibold text-slate-800">
                  {lead.assignedTo?.name
                    ? `${lead.assignedTo.name} (${lead.assignedTo.role === "ADMIN" ? "Admin" : lead.assignedTo.role === "TEAM_LEAD" ? "Team Lead" : "Sales Agent"})`
                    : lead.assignedTo?.email || "Unassigned"}
                </p>
              )}
            </div>

            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-0.5">
                Tags
              </span>
              {!lead.tags || lead.tags.length === 0 ? (
                <p className="text-slate-400">No tags assigned</p>
              ) : (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {lead.tags.map((tag) => {
                    const tagKey = typeof tag === "string" ? tag : tag.id;
                    const tagName = typeof tag === "string" ? tag : tag.name;
                    const tagColor = typeof tag === "string" ? undefined : tag.color;
                    return (
                      <span
                        key={tagKey}
                        style={tagColor ? { borderColor: `${tagColor}60`, color: tagColor } : undefined}
                        className="inline-flex items-center rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"
                      >
                        #{tagName}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Notes Section */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-0.5">
                Notes
              </span>
              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                {lead.notes || "No notes added."}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400 block">Created</span>
                <span className="text-slate-700 font-medium">
                  {new Date(lead.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Last Active</span>
                <span className="text-slate-700 font-medium">
                  {new Date(lead.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Lead Documents & Attachments Card ─────────────────── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <AttachmentUploader
          leadId={lead.id}
          attachments={lead.attachments || []}
          title="Lead Documents & Attachments"
          onUploadSuccess={onAttachmentUploadSuccess}
          onDeleteAttachment={onAttachmentDelete}
        />
      </div>
    </div>
  );
}
