"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/api-client";
import { RoleGuard } from "@/components/RoleGuard";
import {
  AlertOctagon,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Code,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Database,
  Layers,
  Check,
  Copy,
} from "lucide-react";

interface FailedJob {
  id: string;
  jobId: string;
  queueName: string;
  jobName: string;
  payload: Record<string, unknown>;
  error: string;
  status: "FAILED" | "REPLAYED" | string;
  createdAt: string;
  updatedAt: string;
}

export default function DeadLetterQueuePage() {
  const { isLoading } = useAuth();
  const [jobs, setJobs] = useState<FailedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [replayingIds, setReplayingIds] = useState<Record<string, boolean>>({});
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "FAILED" | "REPLAYED">("ALL");
  const [expandedPayloadIds, setExpandedPayloadIds] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchFailedJobs = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await apiClient<FailedJob[]>("/admin-jobs");
      if (res.success && res.data) {
        setJobs(res.data);
      } else {
        setErrorMsg(res.error || "Failed to load dead leads records.");
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error fetching dead leads");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFailedJobs();
  }, [fetchFailedJobs]);

  const handleReplay = async (id: string) => {
    if (replayingIds[id]) return;

    const previousJobs = [...jobs];

    // Optimistic UI update: mark row as REPLAYED immediately
    setJobs((prev) =>
      prev.map((job) =>
        job.id === id ? { ...job, status: "REPLAYED", updatedAt: new Date().toISOString() } : job
      )
    );
    setReplayingIds((prev) => ({ ...prev, [id]: true }));
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await apiClient<FailedJob>(`/admin-jobs/${id}/replay`, {
        method: "POST",
      });

      if (res.success && res.data) {
        setSuccessMsg(res.message || "Job re-queued successfully.");
        setJobs((prev) =>
          prev.map((job) => (job.id === id ? { ...job, ...res.data } : job))
        );
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        // Revert on failure
        setJobs(previousJobs);
        setErrorMsg(res.error || "Failed to replay job.");
      }
    } catch (err) {
      // Revert on exception
      setJobs(previousJobs);
      setErrorMsg(err instanceof Error ? err.message : "Error replaying job.");
    } finally {
      setReplayingIds((prev) => ({ ...prev, [id]: false }));
    }
  };

  const togglePayloadExpand = (id: string) => {
    setExpandedPayloadIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopyPayload = (id: string, payload: Record<string, unknown>) => {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesFilter =
      statusFilter === "ALL" ? true : job.status.toUpperCase() === statusFilter;
    const matchesSearch =
      job.jobName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.jobId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.error.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.queueName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalCount = jobs.length;
  const failedCount = jobs.filter((j) => j.status.toUpperCase() === "FAILED").length;
  const replayedCount = jobs.filter((j) => j.status.toUpperCase() === "REPLAYED").length;

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary shadow-xs shrink-0">
            <AlertOctagon className="h-5 w-5" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-brand-text tracking-tight">
            Dead Leads
          </h1>
        </div>

        <button
          type="button"
          onClick={fetchFailedJobs}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-surface border border-brand-muted/30 hover:bg-brand-bg text-brand-text hover:text-brand-primary hover:border-brand-primary/40 px-4 py-2.5 text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 text-brand-primary ${loading ? "animate-spin" : ""}`} />
          Refresh Jobs
        </button>
      </div>

      {/* Alert Banners */}
      {errorMsg && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-xs font-medium text-red-700 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
          <span className="flex-1">{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-medium text-emerald-800 flex items-start gap-3">
          <CheckCircle2 className="h-4 w-4 text-brand-primary shrink-0 mt-0.5" />
          <span className="flex-1">{successMsg}</span>
        </div>
      )}

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-brand-muted/30 bg-brand-surface p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-brand-muted">Total Failed Jobs</p>
            <p className="text-2xl font-black text-brand-text mt-1">{totalCount}</p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
            <Database className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-brand-muted/30 bg-brand-surface p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-brand-muted">Awaiting Replay</p>
            <p className="text-2xl font-black text-brand-text mt-1">{failedCount}</p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
            <AlertOctagon className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-brand-muted/30 bg-brand-surface p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-brand-muted">Replayed to Queue</p>
            <p className="text-2xl font-black text-brand-text mt-1">{replayedCount}</p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-brand-accent/10 flex items-center justify-center text-brand-accent">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-brand-surface p-4 rounded-2xl border border-brand-muted/30 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-muted" />
          <input
            type="text"
            placeholder="Search by job name, ID, error..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-brand-muted/30 bg-brand-bg/40 pl-10 pr-4 py-2 text-xs text-brand-text placeholder-brand-muted focus:border-brand-primary focus:bg-brand-surface focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto self-end">
          <button
            type="button"
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === "ALL"
                ? "bg-brand-primary text-white shadow-xs"
                : "bg-brand-bg text-brand-muted hover:text-brand-text"
            }`}
          >
            All ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("FAILED")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === "FAILED"
                ? "bg-brand-primary text-white shadow-xs"
                : "bg-brand-bg text-brand-muted hover:text-brand-text"
            }`}
          >
            Failed ({failedCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("REPLAYED")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === "REPLAYED"
                ? "bg-brand-primary text-white shadow-xs"
                : "bg-brand-bg text-brand-muted hover:text-brand-text"
            }`}
          >
            Replayed ({replayedCount})
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-2xl border border-brand-muted/30 bg-brand-surface shadow-xs overflow-hidden">
        {loading && jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-brand-primary mb-3" />
            <p className="text-xs font-semibold text-brand-muted">Loading dead leads...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="h-14 w-14 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary mb-3">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h3 className="text-sm font-bold text-brand-text">Dead Leads Queue is Clean</h3>
            <p className="text-xs text-brand-muted mt-1 max-w-sm">
              {searchQuery || statusFilter !== "ALL"
                ? "No failed jobs match your current search and filter criteria."
                : "All Meta webhook leads and messages have been processed cleanly without exhausting retry limits."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[680px]">
              <thead>
                <tr className="border-b border-brand-muted/20 bg-brand-bg/30 text-[11px] font-bold text-brand-muted uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Job Name & ID</th>
                  <th className="py-3.5 px-4 sm:px-6">Error Reason</th>
                  <th className="py-3.5 px-4 sm:px-6">Status</th>
                  <th className="py-3.5 px-4 sm:px-6">Created At</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-muted/10 text-xs">
                {filteredJobs.map((job) => {
                  const isFailed = job.status.toUpperCase() === "FAILED";
                  const isReplaying = !!replayingIds[job.id];
                  const isPayloadExpanded = !!expandedPayloadIds[job.id];

                  return (
                    <tr key={job.id} className="hover:bg-brand-bg/30 transition-colors group">
                      <td className="py-4 px-4 sm:px-6 align-top">
                        <div className="flex flex-col gap-1">
                          <span className="font-mono font-bold text-brand-text bg-brand-bg px-2 py-0.5 rounded text-[11px] w-fit border border-brand-muted/20">
                            {job.jobName}
                          </span>
                          <div className="flex items-center gap-1.5 text-[10px] text-brand-muted font-mono">
                            <Layers className="h-3 w-3 text-brand-muted" />
                            <span>Queue: {job.queueName}</span>
                          </div>
                          <span className="text-[10px] text-brand-muted font-mono">
                            ID: {job.jobId}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4 sm:px-6 align-top max-w-xs md:max-w-md">
                        <div className="flex flex-col gap-2">
                          <div className="p-2.5 rounded-xl bg-red-50/70 border border-red-100 font-mono text-[11px] text-red-700 leading-relaxed break-words whitespace-pre-wrap">
                            {job.error}
                          </div>

                          {/* Collapsible Payload Viewer */}
                          <div>
                            <button
                              type="button"
                              onClick={() => togglePayloadExpand(job.id)}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-muted hover:text-brand-primary transition-colors cursor-pointer"
                            >
                              <Code className="h-3 w-3" />
                              {isPayloadExpanded ? "Hide Payload" : "View Stored Payload"}
                              {isPayloadExpanded ? (
                                <ChevronUp className="h-3 w-3" />
                              ) : (
                                <ChevronDown className="h-3 w-3" />
                              )}
                            </button>

                            {isPayloadExpanded && (
                              <div className="mt-2 relative rounded-xl bg-brand-bg border border-brand-muted/20 p-3 font-mono text-[10px] text-brand-text overflow-x-auto shadow-inner">
                                <button
                                  type="button"
                                  onClick={() => handleCopyPayload(job.id, job.payload)}
                                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-brand-surface hover:bg-brand-bg text-brand-muted hover:text-brand-text border border-brand-muted/30 transition-colors"
                                  title="Copy JSON Payload"
                                >
                                  {copiedId === job.id ? (
                                    <Check className="h-3 w-3 text-brand-primary" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </button>
                                <pre className="pr-8">
                                  {JSON.stringify(job.payload, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 sm:px-6 align-top">
                        {isFailed ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 font-bold text-[10px]">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                            FAILED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-[10px]">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            REPLAYED
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 sm:px-6 align-top whitespace-nowrap">
                        <div className="flex flex-col text-brand-text">
                          <span className="font-medium text-[11px]">
                            {new Date(job.createdAt).toLocaleDateString()}
                          </span>
                          <span className="text-[10px] text-brand-muted flex items-center gap-1 mt-0.5">
                            <Clock className="h-2.5 w-2.5" />
                            {new Date(job.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4 sm:px-6 align-top text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleReplay(job.id)}
                          disabled={!isFailed || isReplaying}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                            isFailed
                              ? "bg-brand-primary hover:bg-brand-accent text-white disabled:opacity-50"
                              : "bg-brand-bg text-brand-muted border border-brand-muted/30 cursor-not-allowed"
                          }`}
                          title={isFailed ? "Replay job to BullMQ queue" : "Job already replayed"}
                        >
                          <RotateCcw
                            className={`h-3.5 w-3.5 ${isReplaying ? "animate-spin" : ""}`}
                          />
                          {isReplaying ? "Replaying..." : isFailed ? "Replay" : "Replayed"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
    </RoleGuard>
  );
}
