"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import type { Lead, Message, Followup } from "@/types";
import {
  ArrowLeft,
  Phone,
  MessageSquare,
  Calendar,
  Clock,
  Tag,
  User as UserIcon,
  ExternalLink,
  Send,
  Loader2,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  Layers,
  Check,
  Megaphone,
} from "lucide-react";

const STATUS_OPTIONS = [
  { value: "NEW", label: "New Lead", color: "bg-blue-500", text: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  { value: "CONTACTED", label: "Contacted", color: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  { value: "QUALIFIED", label: "Qualified", color: "bg-purple-500", text: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
  { value: "CONVERTED", label: "Converted", color: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  { value: "LOST", label: "Lost", color: "bg-red-500", text: "text-red-700", bg: "bg-red-50 border-red-200" },
];

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Messaging state
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Status dropdown state
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Follow-up form state
  const [showFollowupForm, setShowFollowupForm] = useState(false);
  const [followupType, setFollowupType] = useState("CALL");
  const [followupNote, setFollowupNote] = useState("");
  const [followupDueAt, setFollowupDueAt] = useState("");
  const [addingFollowup, setAddingFollowup] = useState(false);

  // ─── Fetch Lead Details ──────────────────────────────────────
  const fetchLead = useCallback(async () => {
    if (!params.id) return;
    try {
      const res = await apiClient<Lead>(`/leads/${params.id}`);
      if (res.success && res.data) {
        setLead(res.data);
      } else {
        setError("Lead details not found.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load lead details");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchLead();
  }, [fetchLead]);

  // Scroll to bottom of chat when new messages appear
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lead?.messages]);

  // ─── Update Lead Status ──────────────────────────────────────
  const handleUpdateStatus = async (newStatus: string) => {
    if (!lead || lead.status === newStatus) {
      setStatusMenuOpen(false);
      return;
    }

    setStatusUpdating(true);
    // Optimistic update
    setLead((prev) => (prev ? { ...prev, status: newStatus } : null));
    setStatusMenuOpen(false);

    try {
      await apiClient(`/leads/${lead.id}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      // Revert on failure
      fetchLead();
    } finally {
      setStatusUpdating(false);
    }
  };

  // ─── Send Outbound WhatsApp Message ──────────────────────────
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead || !messageText.trim() || sendingMessage) return;

    const textToSend = messageText.trim();
    setSendingMessage(true);

    try {
      const res = await apiClient<Message>(`/leads/${lead.id}/messages`, {
        method: "POST",
        body: JSON.stringify({ body: textToSend }),
      });

      if (res.success && res.data) {
        const newMsg = res.data;
        setLead((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: [...(prev.messages || []), newMsg],
          };
        });
        setMessageText("");
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSendingMessage(false);
    }
  };

  // ─── Add Followup Task ───────────────────────────────────────
  const handleAddFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead || addingFollowup) return;

    setAddingFollowup(true);
    try {
      const res = await apiClient<Followup>(`/leads/${lead.id}/followups`, {
        method: "POST",
        body: JSON.stringify({
          type: followupType,
          note: followupNote.trim(),
          dueAt: followupDueAt ? new Date(followupDueAt).toISOString() : null,
        }),
      });

      if (res.success && res.data) {
        const newFollowup = res.data;
        setLead((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            followups: [...(prev.followups || []), newFollowup],
          };
        });
        setFollowupNote("");
        setFollowupDueAt("");
        setShowFollowupForm(false);
      }
    } catch (err) {
      console.error("Failed to schedule follow-up:", err);
    } finally {
      setAddingFollowup(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-9 w-9 animate-spin text-[#128c7e]" />
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center max-w-lg mx-auto mt-12">
        <h3 className="font-bold text-red-800 text-base">Unable to Load Lead</h3>
        <p className="text-sm text-red-600 mt-2">{error || "Lead does not exist."}</p>
        <button
          onClick={() => router.push("/leads")}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Leads
        </button>
      </div>
    );
  }

  const currentStatusObj =
    STATUS_OPTIONS.find((s) => s.value === lead.status) || STATUS_OPTIONS[0];

  return (
    <div className="space-y-6 pb-12">
      {/* ─── Top Header & Breadcrumb ─────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <Link
            href="/leads"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-xs"
            title="Back to Leads"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 truncate">
                {lead.name || "Unknown Customer"}
              </h1>
              {lead.category && (
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 border border-slate-200">
                  {lead.category}
                </span>
              )}
            </div>
            <p className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 mt-1">
              <Phone className="h-3.5 w-3.5 text-slate-400" />
              <span>{lead.phoneNumber}</span>
              <span className="text-slate-300">•</span>
              <span>Created {new Date(lead.createdAt).toLocaleDateString()}</span>
            </p>
          </div>
        </div>

        {/* Quick Actions & Status Badge Dropdown */}
        <div className="flex items-center gap-3">
          {/* WhatsApp Direct Link */}
          <a
            href={`https://wa.me/${lead.phoneNumber.replace(/[^0-9]/g, "")}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors shadow-xs"
          >
            <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
            <span className="hidden sm:inline">WhatsApp Web</span>
          </a>

          {/* Interactive Status Selector */}
          <div className="relative">
            <button
              onClick={() => setStatusMenuOpen(!statusMenuOpen)}
              disabled={statusUpdating}
              className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all shadow-xs cursor-pointer ${currentStatusObj.bg} ${currentStatusObj.text}`}
            >
              <span className={`h-2 w-2 rounded-full ${currentStatusObj.color}`} />
              <span>{currentStatusObj.label}</span>
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </button>

            {statusMenuOpen && (
              <div className="absolute right-0 top-11 z-30 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Change Lead Status
                </p>
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleUpdateStatus(opt.value)}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${opt.color}`} />
                      <span>{opt.label}</span>
                    </div>
                    {lead.status === opt.value && (
                      <Check className="h-3.5 w-3.5 text-[#128c7e]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Main 2-Column Grid Layout ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── Left Column (2 Cols): WhatsApp Conversation & Tasks ─── */}
        <div className="lg:col-span-2 space-y-6">
          {/* WhatsApp Conversation Box */}
          <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden h-[540px]">
            {/* Chat Box Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-[#f8fafc] px-5 py-3.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#128c7e] text-white shadow-xs">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800">
                    WhatsApp Live Thread
                  </h3>
                  <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Real-time Meta Webhook Connected
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-medium text-slate-400">
                {lead.messages?.length || 0} messages
              </span>
            </div>

            {/* Chat Messages Stream */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3.5 bg-[#f0f2f5] bg-opacity-60">
              {(!lead.messages || lead.messages.length === 0) ? (
                <div className="flex h-full flex-col items-center justify-center text-center p-6 text-slate-400">
                  <MessageSquare className="h-10 w-10 text-slate-300 mb-2" />
                  <p className="text-xs font-semibold text-slate-600">No message history yet</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                    Inbound messages from Meta ads or direct WhatsApp chats will appear here automatically.
                  </p>
                </div>
              ) : (
                lead.messages.map((msg) => {
                  const isOutbound = msg.direction === "OUTBOUND";
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isOutbound ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-xs shadow-xs leading-relaxed ${
                          isOutbound
                            ? "bg-[#d9fdd3] text-slate-900 rounded-tr-none"
                            : "bg-white text-slate-900 border border-slate-200/50 rounded-tl-none"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                        <div
                          className={`flex items-center gap-1 text-[9px] mt-1 text-slate-400 ${
                            isOutbound ? "justify-end text-emerald-700/60" : "justify-start"
                          }`}
                        >
                          <Clock className="h-2.5 w-2.5" />
                          <span>
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Outbound Message Composer */}
            <form
              onSubmit={handleSendMessage}
              className="flex items-center gap-2.5 border-t border-slate-200 bg-white p-3.5"
            >
              <input
                type="text"
                placeholder="Type a WhatsApp message to reply..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                disabled={sendingMessage}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-[#128c7e] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#128c7e]/20 transition-all"
              />
              <button
                type="submit"
                disabled={sendingMessage || !messageText.trim()}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-[#128c7e] px-4 text-xs font-bold text-white shadow-sm hover:bg-[#075e54] disabled:opacity-50 transition-all cursor-pointer"
              >
                {sendingMessage ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span className="hidden sm:inline mr-1">Send</span>
                    <Send className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Follow-up Reminders & Tasks */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-500" />
                <h3 className="text-sm font-bold text-slate-800">
                  Follow-ups & Reminders
                </h3>
              </div>
              <button
                onClick={() => setShowFollowupForm(!showFollowupForm)}
                className="text-xs font-bold text-[#128c7e] hover:text-[#075e54] hover:underline cursor-pointer"
              >
                {showFollowupForm ? "Cancel" : "+ Schedule Task"}
              </button>
            </div>

            {/* Add Follow-up Form */}
            {showFollowupForm && (
              <form onSubmit={handleAddFollowup} className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Task Type
                    </label>
                    <select
                      value={followupType}
                      onChange={(e) => setFollowupType(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-[#128c7e] focus:outline-none"
                    >
                      <option value="CALL">Phone Call</option>
                      <option value="MEETING">Video / Live Meeting</option>
                      <option value="DEMO">Product Demo</option>
                      <option value="NOTE">General Note</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Due Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={followupDueAt}
                      onChange={(e) => setFollowupDueAt(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-[#128c7e] focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Notes / Next Action
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Call to discuss Enterprise tier pricing proposal"
                    value={followupNote}
                    onChange={(e) => setFollowupNote(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-[#128c7e] focus:outline-none"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={addingFollowup}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#128c7e] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#075e54] disabled:opacity-50 cursor-pointer"
                  >
                    {addingFollowup ? "Saving..." : "Save Reminder"}
                  </button>
                </div>
              </form>
            )}

            {/* Follow-up List */}
            {(!lead.followups || lead.followups.length === 0) ? (
              <p className="text-xs text-slate-400 py-3 text-center">
                No follow-ups scheduled. Click &quot;+ Schedule Task&quot; above to set reminders.
              </p>
            ) : (
              <div className="space-y-2.5">
                {lead.followups.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700 text-xs font-bold">
                        {item.type.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{item.note || item.type}</p>
                        <p className="text-[10px] text-slate-400">
                          {item.dueAt ? `Due: ${new Date(item.dueAt).toLocaleString()}` : "No due date set"}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                      {item.type}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── Right Column (1 Col): Attribution & Lead Info ─────────── */}
        <div className="space-y-6">
          {/* Meta Campaign Attribution Card */}
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
                    className="inline-flex items-center gap-1.5 text-xs text-[#128c7e] hover:underline font-semibold mt-1"
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

          {/* Lead Details & Metadata Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-slate-500" /> Lead Overview
            </h3>

            <div className="space-y-3.5 text-xs">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-0.5">
                  Assigned Agent
                </span>
                <p className="font-semibold text-slate-800">
                  {lead.assignedTo?.email || "Unassigned"}
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-0.5">
                  Phone Number
                </span>
                <p className="font-mono text-slate-800">{lead.phoneNumber}</p>
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-0.5">
                  Tags
                </span>
                {(!lead.tags || lead.tags.length === 0) ? (
                  <p className="text-slate-400">No tags assigned</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {lead.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
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
          </div>
        </div>
      </div>
    </div>
  );
}
