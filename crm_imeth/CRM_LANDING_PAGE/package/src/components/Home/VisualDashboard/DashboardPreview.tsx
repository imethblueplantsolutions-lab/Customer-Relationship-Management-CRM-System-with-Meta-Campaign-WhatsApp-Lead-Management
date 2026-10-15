"use client";

import React, { useState } from "react";
import { Icon } from "@iconify/react";

type RoleType = "admin" | "team_lead" | "sales_agent";

interface Agent {
  id: string;
  name: string;
  role: string;
  avatar: string;
  activeLeads: number;
  status: "online" | "in-call" | "offline";
  closedWon: number;
}

const INITIAL_AGENTS: Agent[] = [
  { id: "1", name: "Maya Patel", role: "Senior Sales Closer", avatar: "MP", activeLeads: 14, status: "online", closedWon: 38 },
  { id: "2", name: "David Miller", role: "Lead Sales Rep", avatar: "DM", activeLeads: 9, status: "online", closedWon: 24 },
  { id: "3", name: "Sarah Chen", role: "Account Executive", avatar: "SC", activeLeads: 6, status: "in-call", closedWon: 19 },
  { id: "4", name: "James Wilson", role: "Sales Specialist", avatar: "JW", activeLeads: 4, status: "online", closedWon: 12 },
];

interface Lead {
  id: string;
  company: string;
  contact: string;
  value: string;
  source: string;
  assignedTo: string | null;
  stage: "New Unassigned" | "Assigned" | "In Negotiation" | "Closed Won";
  urgency: "High" | "Medium";
  device: "Desktop Web" | "iPad Tablet" | "Mobile App";
}

const INITIAL_LEADS: Lead[] = [
  { id: "L-101", company: "Apex Logistics Ltd", contact: "Marcus Vance", value: "$18,500", source: "Direct Inbound", assignedTo: null, stage: "New Unassigned", urgency: "High", device: "Desktop Web" },
  { id: "L-102", company: "Horizon Retail Tech", contact: "Elena Rostova", value: "$9,200", source: "Website Form", assignedTo: "Maya Patel", stage: "Assigned", urgency: "Medium", device: "iPad Tablet" },
  { id: "L-103", company: "Quantum Cloud Labs", contact: "Jordan Hayes", value: "$34,000", source: "Partner Referral", assignedTo: "David Miller", stage: "In Negotiation", urgency: "High", device: "Mobile App" },
];

export default function DashboardPreview() {
  const [activeRole, setActiveRole] = useState<RoleType>("team_lead");
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [assignedNotification, setAssignedNotification] = useState<string | null>(null);

  const handleAssignLead = (leadId: string, agentName: string) => {
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? { ...l, assignedTo: agentName, stage: "Assigned" }
          : l
      )
    );
    setAgents((prev) =>
      prev.map((a) =>
        a.name === agentName ? { ...a, activeLeads: a.activeLeads + 1 } : a
      )
    );
    setAssignedNotification(`Lead ${leadId} instantly assigned to ${agentName}`);
    setTimeout(() => setAssignedNotification(null), 3500);
  };

  return (
    <section id="dashboard-preview" className="scroll-mt-24 py-16 md:py-24 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-10 md:mb-14">
        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#1B7BED]/10 text-[#1B7BED] dark:bg-[#18DBF5]/10 dark:text-[#18DBF5] border border-[#1B7BED]/20 dark:border-[#18DBF5]/25 mb-3">
          <Icon icon="solar:shield-user-bold-duotone" className="w-4 h-4 shrink-0" />
          Interactive 3-Tier RBAC &amp; Visual Command Center
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0A2540] dark:text-white tracking-tight">
          One Centralized Dashboard. Tailored for Every Role.
        </h2>
        <p className="text-[#476685] dark:text-slate-400 text-sm sm:text-base mt-3 leading-relaxed">
          Switch roles below to experience how Admins, Team Leads, and Sales Agents securely collaborate with dedicated views, instant manual lead assignment, and zero cross-tenant data leakage.
        </p>
      </div>

      {/* Role Switcher Controls */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 p-1.5 max-w-2xl mx-auto rounded-2xl bg-[#DEEEFD]/70 dark:bg-slate-900/90 border border-[#C8E0F8] dark:border-slate-800 shadow-sm mb-8">
        <button
          type="button"
          onClick={() => setActiveRole("admin")}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeRole === "admin"
              ? "bg-[#1B7BED] text-white shadow-md shadow-[#1B7BED]/25"
              : "text-[#476685] hover:text-[#0A2540] dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <Icon icon="solar:crown-bold-duotone" className="w-4 h-4" />
          <span>Admin View</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveRole("team_lead")}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeRole === "team_lead"
              ? "bg-[#1B7BED] text-white shadow-md shadow-[#1B7BED]/25"
              : "text-[#476685] hover:text-[#0A2540] dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <Icon icon="solar:users-group-two-rounded-bold-duotone" className="w-4 h-4" />
          <span>Team Lead View</span>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-md bg-[#18DBF5]/20 text-[#0A2540] dark:text-[#18DBF5] font-extrabold">
            Interactive
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveRole("sales_agent")}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeRole === "sales_agent"
              ? "bg-[#1B7BED] text-white shadow-md shadow-[#1B7BED]/25"
              : "text-[#476685] hover:text-[#0A2540] dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <Icon icon="solar:user-check-bold-duotone" className="w-4 h-4" />
          <span>Sales Agent View</span>
        </button>
      </div>

      {/* Live Assignment Toast Notification */}
      {assignedNotification && (
        <div className="max-w-md mx-auto mb-6 p-3 rounded-xl bg-[#1B7BED] text-white text-xs font-semibold flex items-center justify-between shadow-lg shadow-[#1B7BED]/25 animate-fade-in">
          <div className="flex items-center gap-2">
            <Icon icon="solar:check-circle-bold" className="w-4 h-4 text-[#18DBF5]" />
            <span>{assignedNotification}</span>
          </div>
          <span className="text-[10px] opacity-80 font-mono">Real-time sync</span>
        </div>
      )}

      {/* Main Interactive Screen Container */}
      <div className="bg-[#DEEEFD]/40 dark:bg-slate-900/80 border border-[#C8E0F8] dark:border-slate-800 rounded-3xl p-4 sm:p-7 shadow-2xl backdrop-blur-md">
        {/* Top Window Bar */}
        <div className="flex items-center justify-between border-b border-[#C8E0F8] dark:border-slate-800/80 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-400/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-400/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-400/80 inline-block" />
            <span className="ml-3 text-xs font-mono font-medium text-[#476685] dark:text-slate-400">
              tenant://acme-corp.mycrm.cloud / {activeRole.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-[#1B7BED] dark:text-[#18DBF5]">
            <span className="w-2 h-2 rounded-full bg-[#18DBF5] animate-pulse" />
            <span className="hidden sm:inline">Multi-Device Live Sync</span>
          </div>
        </div>

        {/* 1. ADMIN ROLE VIEW */}
        {activeRole === "admin" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-[#DEEEFD]/80 dark:bg-slate-800/70 border border-[#C8E0F8] dark:border-slate-700/60">
                <span className="text-xs text-[#476685] dark:text-slate-400 font-medium">Tenant Security Status</span>
                <p className="text-xl font-bold text-[#0A2540] dark:text-white mt-1 flex items-center gap-1.5">
                  <Icon icon="solar:shield-check-bold" className="text-emerald-500 w-5 h-5" />
                  100% Isolated
                </p>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 block">Zero Cross-Tenant Leakage</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#DEEEFD]/80 dark:bg-slate-800/70 border border-[#C8E0F8] dark:border-slate-700/60">
                <span className="text-xs text-[#476685] dark:text-slate-400 font-medium">Total Configured Users</span>
                <p className="text-xl font-bold text-[#0A2540] dark:text-white mt-1">64 Team Members</p>
                <span className="text-[11px] text-[#476685] dark:text-slate-400 mt-1 block">4 Admins • 12 Leads • 48 Reps</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#DEEEFD]/80 dark:bg-slate-800/70 border border-[#C8E0F8] dark:border-slate-700/60">
                <span className="text-xs text-[#476685] dark:text-slate-400 font-medium">Concurrent Active Sessions</span>
                <p className="text-xl font-bold text-[#1B7BED] dark:text-[#18DBF5] mt-1">38 Live Devices</p>
                <span className="text-[11px] text-[#476685] dark:text-slate-400 mt-1 block">Web, Tablet &amp; Mobile</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#DEEEFD]/80 dark:bg-slate-800/70 border border-[#C8E0F8] dark:border-slate-700/60">
                <span className="text-xs text-[#476685] dark:text-slate-400 font-medium">Platform Health</span>
                <p className="text-xl font-bold text-emerald-500 mt-1">99.98% Uptime</p>
                <span className="text-[11px] text-[#476685] dark:text-slate-400 mt-1 block">Global Redundant Clusters</span>
              </div>
            </div>

            {/* Admin RBAC Matrix */}
            <div className="p-5 rounded-2xl bg-[#DEEEFD]/50 dark:bg-slate-800/40 border border-[#C8E0F8] dark:border-slate-700/50">
              <h4 className="text-sm font-bold text-[#0A2540] dark:text-white mb-3 flex items-center gap-2">
                <Icon icon="solar:settings-bold" className="text-[#1B7BED]" />
                RBAC Access Control &amp; Hierarchy Authority
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#C8E0F8] dark:border-slate-700 text-[#476685] dark:text-slate-400">
                      <th className="pb-2">Role Tier</th>
                      <th className="pb-2">Authority Scope</th>
                      <th className="pb-2">Lead Assignment</th>
                      <th className="pb-2">Tenant Config</th>
                      <th className="pb-2">Device Limit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#C8E0F8]/60 dark:divide-slate-800 text-[#0A2540] dark:text-slate-200">
                    <tr>
                      <td className="py-2.5 font-bold text-[#1B7BED]">Admin</td>
                      <td>Full System, Tenant Isolation, Integrations</td>
                      <td>All Teams &amp; Territories</td>
                      <td>Full Read/Write</td>
                      <td>Unlimited Concurrent</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-bold text-[#18DBF5]">Team Lead</td>
                      <td>Supervise Assigned Sales Agents, Monitor Queues</td>
                      <td>Assign &amp; Reassign within Team</td>
                      <td>Read Team Profiles</td>
                      <td>Simultaneous Multi-Device</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-bold text-slate-400">Sales Agent</td>
                      <td>Direct Inbound Interaction &amp; Follow-ups</td>
                      <td>Work Assigned Leads Only</td>
                      <td>No Access</td>
                      <td>Web &amp; Mobile App</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 2. TEAM LEAD ROLE VIEW (INTERACTIVE ASSIGNMENT) */}
        {activeRole === "team_lead" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Unassigned Inbound Queue */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#0A2540] dark:text-white flex items-center gap-2">
                  <Icon icon="solar:inbox-line-bold" className="text-[#1B7BED]" />
                  Incoming Lead Queue (Manual Assignment)
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#1B7BED]/10 text-[#1B7BED] dark:text-[#18DBF5] font-semibold">
                  {leads.filter((l) => !l.assignedTo).length} Unassigned
                </span>
              </div>

              <div className="space-y-3">
                {leads.map((lead) => (
                  <div
                    key={lead.id}
                    className="p-4 rounded-2xl bg-[#DEEEFD]/70 dark:bg-slate-800/80 border border-[#C8E0F8] dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#1B7BED] dark:text-[#18DBF5]">
                          {lead.id}
                        </span>
                        <span className="text-sm font-bold text-[#0A2540] dark:text-white">
                          {lead.company}
                        </span>
                        <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {lead.value}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-[#476685] dark:text-slate-400">
                        <span>Contact: {lead.contact}</span>
                        <span>•</span>
                        <span>Via {lead.device}</span>
                      </div>
                    </div>

                    <div>
                      {lead.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 flex items-center gap-1">
                            <Icon icon="solar:check-circle-bold" className="w-3.5 h-3.5" />
                            Assigned to {lead.assignedTo}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleAssignLead(lead.id, "Maya Patel")}
                            className="px-3 py-1.5 rounded-xl bg-[#1B7BED] hover:bg-[#1569cb] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
                          >
                            <span>Assign to Maya</span>
                            <Icon icon="solar:arrow-right-linear" className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAssignLead(lead.id, "David Miller")}
                            className="px-3 py-1.5 rounded-xl bg-[#DEEEFD] hover:bg-[#cbe2f8] text-[#0A2540] dark:bg-slate-700 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer"
                          >
                            To David
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Real-time Sales Agent Activity & Load Monitor */}
            <div className="lg:col-span-5 p-5 rounded-2xl bg-[#DEEEFD]/50 dark:bg-slate-800/50 border border-[#C8E0F8] dark:border-slate-700/50">
              <h3 className="text-sm font-bold text-[#0A2540] dark:text-white mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Icon icon="solar:chart-square-bold" className="text-[#18DBF5]" />
                  Agent Capacity &amp; Activity
                </span>
                <span className="text-[11px] text-[#476685] dark:text-slate-400 font-mono">Live Sync</span>
              </h3>

              <div className="space-y-3.5">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-[#C8E0F8]/80 dark:border-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#1B7BED]/15 text-[#1B7BED] dark:text-[#18DBF5] flex items-center justify-center font-bold text-xs">
                        {agent.avatar}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-[#0A2540] dark:text-white">
                            {agent.name}
                          </span>
                          <span
                            className={`w-2 h-2 rounded-full ${
                              agent.status === "online"
                                ? "bg-emerald-400"
                                : agent.status === "in-call"
                                ? "bg-amber-400"
                                : "bg-slate-400"
                            }`}
                          />
                        </div>
                        <span className="text-[11px] text-[#476685] dark:text-slate-400">
                          {agent.role}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-[#1B7BED] dark:text-[#18DBF5]">
                        {agent.activeLeads} Active Leads
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-mono">
                        {agent.closedWon} Deals Closed
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. SALES AGENT ROLE VIEW */}
        {activeRole === "sales_agent" && (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-[#1B7BED]/10 dark:bg-[#18DBF5]/10 border border-[#1B7BED]/25 dark:border-[#18DBF5]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-[#0A2540] dark:text-white">
                  Welcome back, Maya Patel (Senior Sales Closer)
                </h4>
                <p className="text-xs text-[#476685] dark:text-slate-400 mt-0.5">
                  Your work queue is synchronized across your Desktop Web and Mobile App sessions.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-[#1B7BED] text-white text-xs font-bold shadow-xs">
                  14 Active Leads
                </span>
                <span className="px-3 py-1 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 text-xs font-bold">
                  3 Follow-ups Today
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-[#DEEEFD]/70 dark:bg-slate-800/70 border border-[#C8E0F8] dark:border-slate-700/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase text-[#1B7BED]">Step 1: Contacted</span>
                  <span className="text-xs font-mono font-semibold text-slate-400">10:45 AM</span>
                </div>
                <h5 className="text-sm font-bold text-[#0A2540] dark:text-white">Marcus Vance • Apex Logistics</h5>
                <p className="text-xs text-[#476685] dark:text-slate-400 mt-1">
                  Budget $18,500. Requested proposal review for multi-branch deployment.
                </p>
                <div className="mt-3 pt-3 border-t border-[#C8E0F8] dark:border-slate-700/60 flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">Proposal Sent</span>
                  <button type="button" className="text-[#1B7BED] dark:text-[#18DBF5] font-bold hover:underline">Log Call</button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#DEEEFD]/70 dark:bg-slate-800/70 border border-[#C8E0F8] dark:border-slate-700/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase text-amber-500">Step 2: Follow-Up</span>
                  <span className="text-xs font-mono font-semibold text-slate-400">Today 2:00 PM</span>
                </div>
                <h5 className="text-sm font-bold text-[#0A2540] dark:text-white">Elena Rostova • Horizon Tech</h5>
                <p className="text-xs text-[#476685] dark:text-slate-400 mt-1">
                  Demo scheduled with Technical VP. Custom integration checklist prepared.
                </p>
                <div className="mt-3 pt-3 border-t border-[#C8E0F8] dark:border-slate-700/60 flex items-center justify-between text-xs">
                  <span className="font-semibold text-amber-500">Demo Prepared</span>
                  <button type="button" className="text-[#1B7BED] dark:text-[#18DBF5] font-bold hover:underline">Launch Meet</button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#DEEEFD]/70 dark:bg-slate-800/70 border border-[#C8E0F8] dark:border-slate-700/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase text-emerald-500">Step 3: Closing</span>
                  <span className="text-xs font-mono font-semibold text-slate-400">Verifying Contract</span>
                </div>
                <h5 className="text-sm font-bold text-[#0A2540] dark:text-white">Jordan Hayes • Quantum Cloud</h5>
                <p className="text-xs text-[#476685] dark:text-slate-400 mt-1">
                  Enterprise 48-seat contract signed. Final security clearance pending.
                </p>
                <div className="mt-3 pt-3 border-t border-[#C8E0F8] dark:border-slate-700/60 flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-500">$34,000 Won</span>
                  <span className="text-[10px] font-mono text-slate-400">Auto-synced</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
