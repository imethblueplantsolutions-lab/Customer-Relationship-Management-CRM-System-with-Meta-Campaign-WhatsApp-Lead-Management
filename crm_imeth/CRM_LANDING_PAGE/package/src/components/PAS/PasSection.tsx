import React from "react";
import { Icon } from "@iconify/react";

interface PasCard {
  badge: string;
  title: string;
  metric: string;
  description: string;
  icon: string;
  accentClass: string;
  borderClass: string;
}

const PAS_STEPS: PasCard[] = [
  {
    badge: "1. The Problem",
    title: "Passing Around Leads in Business Causes Costly Delays",
    metric: "68% Leads Unfollowed or Dropped",
    description:
      "When business leads are passed around through messy spreadsheets, email chains, and chat groups, ownership vanishes. By the time someone remembers to reach out, your buyer has already signed with a faster competitor.",
    icon: "solar:danger-triangle-bold-duotone",
    accentClass: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    borderClass: "border-rose-500/25",
  },
  {
    badge: "2. The Agitation",
    title: "Managers Have Zero Real-Time Visibility into Activity",
    metric: "0% Live Agent Tracking",
    description:
      "Without a unified visual dashboard, managers have no way to track agent activity, identify stalled deals, or balance team capacity. Customer data sits unprotected in personal inboxes with zero tenant security.",
    icon: "solar:eye-closed-bold-duotone",
    accentClass: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    borderClass: "border-amber-500/25",
  },
  {
    badge: "3. The MyCrm Solution",
    title: "Centralized Visual Dashboard & Instant Lead Assignment",
    metric: "3x Faster Response & Closure",
    description:
      "MyCrm gives managers a crystal-clear view of lead velocity, performance, and agent activity. Team Leads assign work in one click, customer data is locked by tenant, and agents log progress from any device.",
    icon: "solar:check-circle-bold-duotone",
    accentClass: "text-[#1B7BED] dark:text-[#18DBF5] bg-[#1B7BED]/10 dark:bg-[#18DBF5]/10 border-[#1B7BED]/25 dark:border-[#18DBF5]/25",
    borderClass: "border-[#1B7BED]/30 dark:border-[#18DBF5]/30",
  },
];

export default function PasSection() {
  return (
    <section id="problem" className="scroll-mt-24 py-16 md:py-24 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-10 md:mb-14">
        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20 mb-3">
          <Icon icon="solar:graph-down-new-bold" className="w-4 h-4 shrink-0" />
          The Lead Management Bottleneck
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0A2540] dark:text-white tracking-tight">
          Why Passing Around Leads Destroys Business Revenue
        </h2>
        <p className="text-[#476685] dark:text-slate-400 text-sm sm:text-base mt-3 leading-relaxed">
          Generating leads for your business is only half the battle. Handing them off seamlessly and maintaining visibility is where unorganized teams fail.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {PAS_STEPS.map((step) => (
          <div
            key={step.badge}
            className={`bento-card bg-[#DEEEFD]/70 dark:bg-slate-900/90 border ${step.borderClass} rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-sm`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-6">
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${step.accentClass}`}>
                  {step.badge}
                </span>
                <Icon icon={step.icon} className="w-7 h-7 text-[#0A2540] dark:text-slate-300 shrink-0" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-[#0A2540] dark:text-white leading-snug mb-3">
                {step.title}
              </h3>
              <p className="text-xs sm:text-sm text-[#476685] dark:text-slate-400 leading-relaxed">
                {step.description}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-[#C8E0F8] dark:border-slate-800/80 flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-[#476685] dark:text-slate-500">
                Performance Impact
              </span>
              <span className="text-xs sm:text-sm font-mono font-bold text-[#0A2540] dark:text-white">
                {step.metric}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
