"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import type { Flow } from "@/types";
import Link from "next/link";
import {
  Workflow,
  Plus,
  Zap,
  FileEdit,
  Trash2,
  Play,
  Pause,
  Loader2,
  MoreVertical,
} from "lucide-react";

export default function FlowsPage() {
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newTrigger, setNewTrigger] = useState("keyword");
  const [creating, setCreating] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const fetchFlows = useCallback(async () => {
    try {
      const res = await apiClient<Flow[]>("/flows");
      if (res.success && res.data) setFlows(res.data);
    } catch (err) {
      console.error("Failed to fetch flows:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlows();
  }, [fetchFlows]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await apiClient("/flows", {
        method: "POST",
        body: JSON.stringify({
          name: newName.trim(),
          description: newDescription.trim() || null,
          triggerType: newTrigger,
        }),
      });
      setNewName("");
      setNewDescription("");
      setNewTrigger("keyword");
      setShowCreate(false);
      await fetchFlows();
    } catch (err) {
      console.error("Failed to create flow:", err);
    } finally {
      setCreating(false);
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await apiClient(`/flows/${id}/activate`, { method: "POST" });
      await fetchFlows();
    } catch (err) {
      console.error("Failed to activate:", err);
    }
    setOpenMenu(null);
  };

  const handleDeactivate = async (id: string) => {
    try {
      await apiClient(`/flows/${id}/deactivate`, { method: "POST" });
      await fetchFlows();
    } catch (err) {
      console.error("Failed to deactivate:", err);
    }
    setOpenMenu(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this flow? This cannot be undone.")) return;
    try {
      await apiClient(`/flows/${id}`, { method: "DELETE" });
      await fetchFlows();
    } catch (err) {
      console.error("Failed to delete:", err);
    }
    setOpenMenu(null);
  };

  const triggerLabel = (t: string) => {
    switch (t) {
      case "keyword": return "Keyword";
      case "first_inbound": return "First Message";
      case "manual": return "Manual";
      default: return t;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#128c7e]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Automation Flows</h2>
          <p className="text-sm text-slate-500 mt-2">
            {flows.length} flow{flows.length !== 1 ? "s" : ""} configured
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#128c7e] px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#075e54] transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" /> New Flow
        </button>
      </div>

      {flows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-20">
          <Workflow className="h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-lg font-semibold text-slate-600">No flows yet</h3>
          <p className="mt-2 text-sm text-slate-400">
            Create an automation flow to auto-respond to WhatsApp messages
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#128c7e] px-4 py-2.5 text-sm font-bold text-white cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Create Flow
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {flows.map((flow) => (
            <div
              key={flow.id}
              className="rounded-2xl bg-white border border-slate-200/60 shadow-sm hover:shadow-md transition-all overflow-hidden"
            >
              {/* Status bar */}
              <div
                className={`h-1 ${
                  flow.status === "active" ? "bg-emerald-500" : flow.status === "archived" ? "bg-slate-400" : "bg-amber-400"
                }`}
              />

              <div className="p-6">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        flow.status === "active" ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <Zap className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-800 truncate">{flow.name}</h3>
                      {flow.description && (
                        <p className="text-xs text-slate-400 truncate mt-1">{flow.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenu(openMenu === flow.id ? null : flow.id)}
                      className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {openMenu === flow.id && (
                      <div className="absolute right-0 top-8 z-10 w-40 rounded-xl bg-white border border-slate-200 shadow-lg py-1">
                        {flow.status === "active" ? (
                          <button
                            onClick={() => handleDeactivate(flow.id)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
                          >
                            <Pause className="h-3.5 w-3.5" /> Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivate(flow.id)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
                          >
                            <Play className="h-3.5 w-3.5" /> Activate
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(flow.id)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Meta row */}
                <div className="mt-5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        flow.status === "active"
                          ? "bg-emerald-100 text-emerald-700"
                          : flow.status === "archived"
                          ? "bg-slate-100 text-slate-500"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {flow.status}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {triggerLabel(flow.triggerType)}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {flow.executionCount} runs
                  </span>
                </div>

                {/* Edit button */}
                <Link
                  href={`/flows/${flow.id}`}
                  className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-white hover:border-[#128c7e] hover:text-[#128c7e] transition-all"
                >
                  <FileEdit className="h-3.5 w-3.5" /> Open Editor
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Flow Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-800">New Automation Flow</h3>
            <div className="mt-4 space-y-3">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Flow name"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-[#128c7e] focus:ring-2 focus:ring-[#128c7e]/20 focus:outline-none"
                autoFocus
              />
              <input
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Description (optional)"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-[#128c7e] focus:ring-2 focus:ring-[#128c7e]/20 focus:outline-none"
              />
              <select
                value={newTrigger}
                onChange={(e) => setNewTrigger(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-[#128c7e] focus:ring-2 focus:ring-[#128c7e]/20 focus:outline-none cursor-pointer"
              >
                <option value="keyword">Keyword trigger</option>
                <option value="first_inbound">First inbound message</option>
                <option value="manual">Manual trigger</option>
              </select>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowCreate(false)}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !newName.trim()}
                className="rounded-xl bg-[#128c7e] px-4 py-2 text-sm font-bold text-white hover:bg-[#075e54] disabled:opacity-50 cursor-pointer"
              >
                {creating ? "Creating..." : "Create Flow"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
