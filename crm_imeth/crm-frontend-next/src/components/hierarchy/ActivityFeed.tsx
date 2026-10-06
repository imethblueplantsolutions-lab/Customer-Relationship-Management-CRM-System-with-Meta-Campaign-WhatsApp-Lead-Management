"use client";

import React, { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import { useSocket } from "@/hooks/use-socket";
import type { AuditLog, User } from "@/types";
import {
  History,
  RefreshCw,
  Search,
  Filter,
  UserPlus,
  ArrowRightLeft,
  UserCheck,
  UserX,
  Trash2,
  Layers,
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles,
} from "lucide-react";

interface ActivityFeedProps {
  /** Optional preloaded users list to resolve manager IDs to human names */
  users?: User[];
  /** Optional custom title */
  title?: string;
  /** Optional subtitle */
  subtitle?: string;
}

function formatTimestamp(dateStr: string) {
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: true,
    }).format(date);
  } catch {
    return dateStr;
  }
}

function getRelativeTime(dateStr: string) {
  try {
    const now = Date.now();
    const past = new Date(dateStr).getTime();
    const diffMs = now - past;
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    return `${diffDays}d ago`;
  } catch {
    return "";
  }
}

export function ActivityFeed({ users = [], title = "Enterprise Audit Trail", subtitle = "Immutable record of organization hierarchy, user provisioning, and role modifications" }: ActivityFeedProps) {
  const { socket } = useSocket();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [expandedLogIds, setExpandedLogIds] = useState<Record<string, boolean>>({});

  // Helper map from userId to Name
  const userMap = React.useMemo(() => {
    const map = new Map<string, string>();
    users.forEach((u) => {
      map.set(u.id, u.name || u.email);
    });
    return map;
  }, [users]);

  const resolveUserName = useCallback((userId?: string | null, fallback = "None") => {
    if (!userId) return fallback;
    return userMap.get(userId) || `User (${userId.slice(0, 8)}...)`;
  }, [userMap]);

  // Fetch Audit Logs from backend
  const fetchLogs = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);

      const res = await apiClient<AuditLog[]>("/audit-logs?limit=100");
      if (res.success && res.data) {
        setLogs(res.data);
      }
    } catch (err) {
      console.error("[ActivityFeed] Error fetching audit logs:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Real-time Socket.IO listener for live audit events
  useEffect(() => {
    if (!socket) return;

    const handleAuditLogged = (newEntry: AuditLog) => {
      setLogs((prev) => [newEntry, ...prev.filter((l) => l.id !== newEntry.id)]);
    };

    socket.on("audit_logged", handleAuditLogged);
    return () => {
      socket.off("audit_logged", handleAuditLogged);
    };
  }, [socket]);

  const toggleExpand = (id: string) => {
    setExpandedLogIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter logs by search and action category
  const filteredLogs = logs.filter((log) => {
    const matchesAction = actionFilter === "ALL" || log.action === actionFilter;
    const actorName = log.performedBy?.name || log.performedBy?.email || "";
    const targetName = log.targetUser?.name || log.targetUser?.email || "";
    const detailsStr = JSON.stringify(log.details || {}).toLowerCase();
    const query = searchQuery.toLowerCase();

    const matchesSearch =
      !query ||
      actorName.toLowerCase().includes(query) ||
      targetName.toLowerCase().includes(query) ||
      log.action.toLowerCase().includes(query) ||
      detailsStr.includes(query);

    return matchesAction && matchesSearch;
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case "USER_CREATED":
        return {
          icon: UserPlus,
          bg: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
          label: "User Provisioned",
        };
      case "HIERARCHY_REASSIGNED":
        return {
          icon: ArrowRightLeft,
          bg: "bg-blue-500/10 text-blue-600 border-blue-500/20",
          label: "Hierarchy Reassigned",
        };
      case "HIERARCHY_BULK_REASSIGNED":
        return {
          icon: Layers,
          bg: "bg-purple-500/10 text-purple-600 border-purple-500/20",
          label: "Bulk Reassigned",
        };
      case "USER_DEACTIVATED":
        return {
          icon: UserX,
          bg: "bg-rose-500/10 text-rose-600 border-rose-500/20",
          label: "User Deactivated",
        };
      case "USER_ACTIVATED":
        return {
          icon: UserCheck,
          bg: "bg-teal-500/10 text-teal-600 border-teal-500/20",
          label: "User Activated",
        };
      case "USER_ROLE_CHANGED":
        return {
          icon: Sparkles,
          bg: "bg-amber-500/10 text-amber-600 border-amber-500/20",
          label: "Role Modified",
        };
      case "USER_DELETED":
        return {
          icon: Trash2,
          bg: "bg-red-500/10 text-red-600 border-red-500/20",
          label: "User Deleted",
        };
      default:
        return {
          icon: History,
          bg: "bg-slate-500/10 text-slate-600 border-slate-500/20",
          label: action,
        };
    }
  };



  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <History className="h-5 w-5 text-purple-600" />
            {title}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchLogs(true)}
            disabled={refreshing || loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-purple-600" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-brand-surface border border-brand-muted/30 p-3.5 rounded-2xl shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by actor, target user, or action details..."
            className="w-full h-9 pl-9 pr-3 rounded-xl bg-brand-bg/60 border border-brand-muted/30 text-xs text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-3.5 w-3.5 text-brand-muted shrink-0" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="h-9 px-3 rounded-xl bg-brand-bg/60 border border-brand-muted/30 text-xs font-semibold text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary cursor-pointer"
          >
            <option value="ALL" className="bg-brand-surface text-brand-text">All Actions ({logs.length})</option>
            <option value="HIERARCHY_REASSIGNED" className="bg-brand-surface text-brand-text">Hierarchy Reassignments</option>
            <option value="HIERARCHY_BULK_REASSIGNED" className="bg-brand-surface text-brand-text">Bulk Reassignments</option>
            <option value="USER_CREATED" className="bg-brand-surface text-brand-text">User Provisioning</option>
            <option value="USER_DEACTIVATED" className="bg-brand-surface text-brand-text">Deactivations</option>
            <option value="USER_ACTIVATED" className="bg-brand-surface text-brand-text">Activations</option>
            <option value="USER_ROLE_CHANGED" className="bg-brand-surface text-brand-text">Role Updates</option>
            <option value="USER_DELETED" className="bg-brand-surface text-brand-text">Deletions</option>
          </select>
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="bg-brand-surface border border-brand-muted/30 rounded-2xl shadow-xs p-6">
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <RefreshCw className="mx-auto h-8 w-8 text-purple-600 animate-spin" />
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Loading audit timeline...
            </p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <History className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              No audit logs found
            </p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {logs.length === 0
                ? "No hierarchy or user management changes have been recorded in this tenant yet."
                : "No log entries match your filter or search query."}
            </p>
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {filteredLogs.map((log) => {
              const badge = getActionBadge(log.action);
              const Icon = badge.icon;
              const isExpanded = !!expandedLogIds[log.id];
              const details = log.details || {};

              const actorName = log.performedBy?.name || log.performedBy?.email || "System Admin";
              const actorRole = log.performedBy?.role || "ADMIN";
              const targetName = log.targetUser?.name || log.targetUser?.email || details.userName || details.deletedUserName || "User";

              return (
                <div key={log.id} className="relative group">
                  {/* Timeline Node Icon */}
                  <div className="absolute -left-6 sm:-left-8 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white dark:bg-slate-900 ring-4 ring-white dark:ring-slate-900">
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full ${badge.bg}`}>
                      <Icon className="h-3 w-3" />
                    </span>
                  </div>

                  {/* Card Container */}
                  <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}>
                          <Icon className="h-2.5 w-2.5" />
                          {badge.label}
                        </span>

                        <span className="text-[11px] font-semibold text-slate-400">
                          •
                        </span>

                        <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {getRelativeTime(log.createdAt)}
                        </span>
                      </div>

                      <span className="text-[11px] text-slate-400 font-mono">
                        {formatTimestamp(log.createdAt)}
                      </span>
                    </div>

                    {/* Human Narrative Sentence */}
                    <div className="mt-2 text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                      {log.action === "USER_CREATED" && (
                        <p>
                          <span className="font-bold text-slate-900 dark:text-white">{actorName}</span>
                          {" provisioned a new "}
                          <span className="font-semibold text-emerald-600">{details.role || log.targetUser?.role || "user"}</span>
                          {" account for "}
                          <span className="font-bold text-slate-900 dark:text-white">{targetName}</span>
                          {details.reportsToId && (
                            <>
                              {" reporting to "}
                              <span className="font-semibold text-blue-600">
                                {resolveUserName(details.reportsToId)}
                              </span>
                            </>
                          )}
                          {"."}
                        </p>
                      )}

                      {log.action === "HIERARCHY_REASSIGNED" && (
                        <p>
                          <span className="font-bold text-slate-900 dark:text-white">{actorName}</span>
                          {" reassigned "}
                          <span className="font-bold text-slate-900 dark:text-white">{targetName}</span>
                          {" from "}
                          <span className="font-semibold text-slate-600 dark:text-slate-400">
                            {resolveUserName(details.previousManagerId, "Unassigned")}
                          </span>
                          {" to "}
                          <span className="font-semibold text-blue-600">
                            {resolveUserName(details.newManagerId, "Unassigned")}
                          </span>
                          {"."}
                        </p>
                      )}

                      {log.action === "HIERARCHY_BULK_REASSIGNED" && (
                        <p>
                          <span className="font-bold text-slate-900 dark:text-white">{actorName}</span>
                          {" bulk reassigned "}
                          <span className="font-bold text-purple-600">{details.affectedCount || details.userIds?.length || 0} user(s)</span>
                          {" to new manager "}
                          <span className="font-semibold text-blue-600">
                            {resolveUserName(details.newManagerId, "Unassigned")}
                          </span>
                          {"."}
                        </p>
                      )}

                      {log.action === "USER_DEACTIVATED" && (
                        <p>
                          <span className="font-bold text-slate-900 dark:text-white">{actorName}</span>
                          {" deactivated account "}
                          <span className="font-bold text-rose-600">{targetName}</span>
                          {" and auto-healed reporting tree subordinates."}
                        </p>
                      )}

                      {log.action === "USER_ACTIVATED" && (
                        <p>
                          <span className="font-bold text-slate-900 dark:text-white">{actorName}</span>
                          {" reactivated account "}
                          <span className="font-bold text-teal-600">{targetName}</span>
                          {"."}
                        </p>
                      )}

                      {log.action === "USER_ROLE_CHANGED" && (
                        <p>
                          <span className="font-bold text-slate-900 dark:text-white">{actorName}</span>
                          {" updated role for "}
                          <span className="font-bold text-slate-900 dark:text-white">{targetName}</span>
                          {" from "}
                          <span className="font-semibold text-slate-500">{details.previousRole}</span>
                          {" to "}
                          <span className="font-semibold text-purple-600">{details.newRole}</span>
                          {"."}
                        </p>
                      )}

                      {log.action === "USER_DELETED" && (
                        <p>
                          <span className="font-bold text-slate-900 dark:text-white">{actorName}</span>
                          {" permanently deleted "}
                          <span className="font-bold text-red-600">{targetName}</span>
                          {" and performed cascade relationship cleanup."}
                        </p>
                      )}

                      {!["USER_CREATED", "HIERARCHY_REASSIGNED", "HIERARCHY_BULK_REASSIGNED", "USER_DEACTIVATED", "USER_ACTIVATED", "USER_ROLE_CHANGED", "USER_DELETED"].includes(log.action) && (
                        <p>
                          <span className="font-bold text-slate-900 dark:text-white">{actorName}</span>
                          {" executed "}
                          <span className="font-semibold">{log.action}</span>
                          {targetName && ` on ${targetName}`}
                          {"."}
                        </p>
                      )}
                    </div>

                    {/* Metadata & Details Inspector Toggle */}
                    <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
                      <div className="flex items-center gap-3">
                        <span>
                          Actor Role: <strong className="text-slate-700 dark:text-slate-300">{actorRole}</strong>
                        </span>
                        {log.targetUser?.role && (
                          <span>
                            Target Role: <strong className="text-slate-700 dark:text-slate-300">{log.targetUser.role}</strong>
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleExpand(log.id)}
                        className="inline-flex items-center gap-1 font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 cursor-pointer"
                      >
                        {isExpanded ? (
                          <>
                            Hide Raw JSON <ChevronUp className="h-3 w-3" />
                          </>
                        ) : (
                          <>
                            View Payload <ChevronDown className="h-3 w-3" />
                          </>
                        )}
                      </button>
                    </div>

                    {/* Collapsible Raw JSON Details */}
                    {isExpanded && (
                      <div className="mt-3 p-3 rounded-lg bg-slate-900 text-slate-200 text-[11px] font-mono overflow-x-auto border border-slate-800 shadow-inner">
                        <pre>{JSON.stringify(details, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default ActivityFeed;
