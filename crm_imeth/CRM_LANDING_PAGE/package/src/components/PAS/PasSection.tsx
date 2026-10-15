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
    title: "70% of Meta Leads Go Cold in 15 Minutes",
    metric: "4h 12m Avg. Agency Reply",
    description:
      "Prospects submit a Facebook or Instagram Lead Form while high-intent, then immediately keep scrolling. By the time your team exports a CSV or checks email notifications, the buyer has forgotten your brand.",
    icon: "solar:danger-triangle-bold-duotone",
    accentClass: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    borderClass: "border-rose-500/25",
  },
  {
    badge: "2. The Agitation",
    title: "Emails Get Ignored & Cold Calls Go to Voicemail",
    metric: "78% Wasted Ad Spend",
    description:
      "Email open rates sit below 19%, unknown phone numbers are blocked by iOS call screening, and fragile Zapier-to-spreadsheet zaps silently fail—burning thousands in monthly Meta ad budget.",
    icon: "solar:flame-bold-duotone",
    accentClass: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    borderClass: "border-amber-500/25",
  },
  {
    badge: "3. The BluePlanet Cure",
    title: "0-Second Webhook to Automated WhatsApp Chat",
    metric: "98.4% Read Rate in < 60s",
    description:
      "BluePlanet CRM ingests Meta Lead Ads via direct webhook, fires a personalized WhatsApp message within 0.4 seconds, and routes live replies to your multi-agent Kanban board automatically.",
    icon: "solar:shield-check-bold-duotone",
    accentClass: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    borderClass: "border-emerald-500/35",
  },
];

export default function PasSection() {
  return (
    <section id="problem" className="scroll-mt-24 py-16 md:py-24 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-10 md:mb-14">
        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-3">
          <Icon icon="solar:graph-down-new-bold" className="w-4 h-4 shrink-0" />
          The Speed-to-Lead Crisis
        </span>
        <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
          Why Your Meta Ad Campaigns Are Leaking Revenue
        </h2>
        <p className="text-slate-400 text-sm sm:text-base mt-3">
          Generating leads on Facebook and Instagram is easy. Contacting them before they go cold is where 90% of teams fail.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {PAS_STEPS.map((step) => (
          <div
            key={step.badge}
            className={`bento-card bg-slate-900/90 border ${step.borderClass} rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-xl`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-6">
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${step.accentClass}`}>
                  {step.badge}
                </span>
                <Icon icon={step.icon} className="w-7 h-7 text-slate-300 shrink-0" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white leading-snug mb-3">
                {step.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                {step.description}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">
                Benchmark Impact
              </span>
              <span className="text-xs sm:text-sm font-mono font-bold text-white">
                {step.metric}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
