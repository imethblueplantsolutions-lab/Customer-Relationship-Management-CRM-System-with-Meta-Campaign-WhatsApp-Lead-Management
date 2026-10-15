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
    tag: "Manual Lead Management",
    title: "Customize Your Employees & Assign Work Instantly",
    description:
      "Structure your sales roster your way. Customize employee profiles, balance workloads dynamically, and assign or reassign incoming leads in seconds so no customer inquiry ever slips through the cracks.",
    metricBadge: "Zero Dropped Leads",
    icon: "solar:user-hand-up-bold-duotone",
    colSpan: "lg:col-span-7",
  },
  {
    id: "tenant-security",
    tag: "Secure Team Management",
    title: "Strict Multi-Tenant Customer Data Isolation",
    description:
      "Keep customer records confidential and secure across organizations, Admins, Team Leads, and Sales Agents using strict tenant-level cryptographic boundaries and row-level security.",
    metricBadge: "100% Tenant Boundary",
    icon: "solar:shield-keyhole-bold-duotone",
    colSpan: "lg:col-span-5",
  },
  {
    id: "multi-device",
    tag: "Multi-Device & Concurrent Access",
    title: "Simultaneous Team Access Across All Devices",
    description:
      "Empower your entire sales force to collaborate concurrently. Seamlessly access MyCrm simultaneously across desktop web browsers, tablets, and mobile applications with instant real-time synchronization.",
    metricBadge: "Zero Session Conflicts",
    icon: "solar:devices-bold-duotone",
    colSpan: "lg:col-span-5",
  },
  {
    id: "rbac-dashboard",
    tag: "Visual Dashboard & 3-Tier RBAC",
    title: "Clear Performance Visibility with Role-Based Access",
    description:
      "Three distinct authority tiers: Admins manage user accounts and system configuration; Team Leads monitor live agent activity and distribute leads; Sales Agents manage interactions, logs, and scheduled follow-ups.",
    metricBadge: "Clear Hierarchy & Control",
    icon: "solar:chart-square-bold-duotone",
    colSpan: "lg:col-span-7",
  },
];

export default function BentoFeatures() {
  return (
    <section id="features" className="scroll-mt-24 py-16 md:py-24 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-10 md:mb-14">
        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#1B7BED]/10 text-[#1B7BED] dark:bg-[#18DBF5]/10 dark:text-[#18DBF5] border border-[#1B7BED]/20 dark:border-[#18DBF5]/25 mb-3">
          <Icon icon="solar:widget-5-bold" className="w-4 h-4" />
          Enterprise CRM Capabilities
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0A2540] dark:text-white tracking-tight">
          Engineered for High-Velocity Business Teams
        </h2>
        <p className="text-[#476685] dark:text-slate-400 text-sm sm:text-base mt-3 leading-relaxed">
          Everything managers and sales reps need to capture, organize, assign, and convert business leads with total visibility.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {BENTO_FEATURES.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.4, delay: idx * 0.08 }}
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
                  Built into Core Platform
                </span>
                <span className="font-mono text-[11px] opacity-75">Tenant Protected</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
