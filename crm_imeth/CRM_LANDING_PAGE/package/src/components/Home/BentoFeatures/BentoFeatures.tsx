"use client";

import React from "react";
import { motion } from "motion/react";
import { Icon } from "@iconify/react";

interface BentoItem {
  id: string;
  tag: string;
  title: string;
  description: string;
  metricBadge: string;
  icon: string;
  colSpan: string;
}

const BENTO_FEATURES: BentoItem[] = [
  {
    id: "manual-assignment",
    tag: "Lead Intake & Assignment",
    title: "Direct Lead Intake & Instant 1-Click Assignment",
    description:
      "Never let valuable inquiries sit unattended. Incoming leads land in a dedicated unassigned queue where Team Leads can assign or reassign them to specific sales reps in one click with instant notification.",
    metricBadge: "Zero Dropped Leads",
    icon: "solar:user-hand-up-bold-duotone",
    colSpan: "lg:col-span-6",
  },
  {
    id: "followups-tasks",
    tag: "Task Management",
    title: "Scheduled Follow-ups with Overdue Task Alerts",
    description:
      "Keep every deal moving forward. Set exact follow-up dates, assign task priorities (High, Medium, Low), and receive clear alerts on overdue leads so prospects are never forgotten or neglected.",
    metricBadge: "Never Miss a Follow-up",
    icon: "solar:calendar-date-bold-duotone",
    colSpan: "lg:col-span-6",
  },
  {
    id: "activity-timeline",
    tag: "Customer History",
    title: "Chronological Lead Timeline & Activity History",
    description:
      "Maintain a unified audit of every prospect interaction. Log call summaries, meeting outcomes, stage transitions, and internal sales notes in a permanent chronological feed accessible to the team.",
    metricBadge: "Full Interaction Context",
    icon: "solar:document-text-bold-duotone",
    colSpan: "lg:col-span-6",
  },
  {
    id: "rbac-dashboard",
    tag: "Role Governance",
    title: "3-Tier Access Hierarchy: Admins, Leads & Agents",
    description:
      "Clear operational boundaries across your organization: Admins manage accounts and tenant settings; Team Leads supervise agent capacity and lead distribution; Sales Agents focus on direct client discussions.",
    metricBadge: "Tailored Role Permissions",
    icon: "solar:users-group-two-rounded-bold-duotone",
    colSpan: "lg:col-span-6",
  },
  {
    id: "tenant-security",
    tag: "Data Confidentiality",
    title: "Strict Multi-Tenant Customer Data Protection",
    description:
      "Keep your customer records and business details safe. Strict tenant-level boundaries ensure client data, deals, and team notes are completely isolated and confidential from any other organization.",
    metricBadge: "100% Data Confidentiality",
    icon: "solar:shield-keyhole-bold-duotone",
    colSpan: "lg:col-span-6",
  },
  {
    id: "multi-device",
    tag: "Cross-Platform Access",
    title: "Concurrent Team Logins on Desktop, Tablet & Mobile",
    description:
      "Enable your entire team to work together simultaneously. Access MyCrm smoothly across desktop web browsers, iPad/tablets, and mobile web with real-time sync and zero login session conflicts.",
    metricBadge: "Simultaneous Team Access",
    icon: "solar:devices-bold-duotone",
    colSpan: "lg:col-span-6",
  },
];

export default function BentoFeatures() {
  return (
    <section id="features" className="scroll-mt-24 py-16 md:py-24 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-10 md:mb-14">
        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#1B7BED]/10 text-[#1B7BED] dark:bg-[#18DBF5]/10 dark:text-[#18DBF5] border border-[#1B7BED]/20 dark:border-[#18DBF5]/25 mb-3">
          <Icon icon="solar:widget-5-bold" className="w-4 h-4" />
          Complete Business CRM Capabilities
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0A2540] dark:text-white tracking-tight">
          Everything Your Sales Team Needs to Manage &amp; Close Leads
        </h2>
        <p className="text-[#476685] dark:text-slate-400 text-sm sm:text-base mt-3 leading-relaxed">
          From direct lead intake and instant assignment to scheduled follow-ups, activity history, and role-based access control.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {BENTO_FEATURES.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.4, delay: idx * 0.06 }}
            className={item.colSpan}
          >
            {/* Inner div isolates CSS hover transitions from outer Motion transforms */}
            <div className="bento-card h-full bg-[#DEEEFD]/70 dark:bg-slate-900/90 border border-[#C8E0F8] dark:border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center justify-between gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#1B7BED]/15 border border-[#1B7BED]/25 flex items-center justify-center text-[#1B7BED] dark:text-[#18DBF5]">
                    <Icon icon={item.icon} className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[#1B7BED]/10 text-[#1B7BED] dark:bg-[#18DBF5]/10 dark:text-[#18DBF5] border border-[#1B7BED]/20 dark:border-[#18DBF5]/30">
                    {item.metricBadge}
                  </span>
                </div>

                <span className="text-xs font-bold uppercase tracking-wider text-[#1B7BED] dark:text-[#18DBF5]">
                  {item.tag}
                </span>

                <h3 className="text-lg sm:text-xl font-bold text-[#0A2540] dark:text-white mt-1.5 mb-3 leading-snug">
                  {item.title}
                </h3>

                <p className="text-xs sm:text-sm text-[#476685] dark:text-slate-400 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#C8E0F8] dark:border-slate-800/80 flex items-center justify-between text-xs text-[#476685] dark:text-slate-400">
                <span className="flex items-center gap-1.5 font-semibold text-[#1B7BED] dark:text-[#18DBF5]">
                  <Icon icon="solar:check-circle-bold" className="w-4 h-4" />
                  Active Feature
                </span>
                <span className="font-mono text-[11px] opacity-75">Team Protected</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
