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
    id: "webhook-sync",
    tag: "Zero-Latency Ingestion",
    title: "Instant Meta Ads Webhook Sync",
    description:
      "Eliminate paid Zapier and Make.com subscriptions. Native webhook listeners capture Facebook and Instagram Lead Ad payloads in real time with full campaign, ad-set, and creative attribution.",
    metricBadge: "< 400ms Ingestion Speed",
    icon: "solar:bolt-bold-duotone",
    colSpan: "lg:col-span-7",
  },
  {
    id: "team-inbox",
    tag: "Multi-Agent Collaboration",
    title: "Role-Based WhatsApp Team Inbox",
    description:
      "Route inbound WhatsApp chats across your sales reps with round-robin assignment, collision detection, canned quick-replies, and internal team notes.",
    metricBadge: "Unlimited Agent Seats",
    icon: "solar:users-group-two-rounded-bold-duotone",
    colSpan: "lg:col-span-5",
  },
  {
    id: "drip-sequences",
    tag: "BullMQ Automation Engine",
    title: "Automated WhatsApp Drip Sequences",
    description:
      "Trigger immediate welcome templates, 24-hour follow-up nudges, and appointment reminders that automatically pause the moment a lead replies.",
    metricBadge: "3.4x Deal Velocity",
    icon: "solar:clock-circle-bold-duotone",
    colSpan: "lg:col-span-5",
  },
  {
    id: "lead-scoring",
    tag: "Pipeline Intelligence",
    title: "Smart Lead Scoring & Kanban Forecasting",
    description:
      "Automatically tag high-intent prospects based on form answers and WhatsApp reply speed. Drag deals across custom pipeline stages with live revenue attribution.",
    metricBadge: "100% Tenant RLS Isolation",
    icon: "solar:chart-2-bold-duotone",
    colSpan: "lg:col-span-7",
  },
];

export default function BentoFeatures() {
  return (
    <section id="features" className="scroll-mt-24 py-16 md:py-24 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-10 md:mb-14">
        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-3">
          <Icon icon="solar:widget-5-bold" className="w-4 h-4" />
          Enterprise CRM Architecture
        </span>
        <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
          Built to Convert High-Volume Meta Traffic
        </h2>
        <p className="text-slate-400 text-sm sm:text-base mt-3">
          Every tool your media buyers and sales closers need in one unified workspace.
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
            <div className="bento-card h-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <Icon icon={item.icon} className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {item.metricBadge}
                  </span>
                </div>

                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                  {item.tag}
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-white mt-1.5 mb-3">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1.5 font-medium">
                  <Icon icon="solar:check-circle-bold" className="text-emerald-400 w-4 h-4" />
                  Included in all 14-day trials
                </span>
                <a
                  href="#pricing"
                  className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
                >
                  Compare Tiers →
                </a>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
