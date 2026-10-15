"use client";

import React, { useState } from "react";
import { Icon } from "@iconify/react";

type BillingCycle = "monthly" | "annual";
type PricingTierId = "free" | "growth" | "agency";

interface PricingPlan {
  id: PricingTierId;
  name: string;
  badge?: string;
  description: string;
  monthlyPriceFormatted: string;
  annualPriceFormatted: string;
  periodLabel: string;
  isCustom?: boolean;
  highlighted?: boolean;
  ctaText: string;
  ctaSubtext: string;
  features: string[];
  metaHighlight: string;
}

const SHARED_CORE_FEATURES = [
  "Full 3-Tier RBAC (Admins, Leads, Sales Agents)",
  "Add Multiple Team Leads & Sales Agents",
  "Live Agent Activity & Capacity Monitoring",
  "Instant 1-Click Lead Reassignment Rules",
  "Cross-Platform Desktop, Tablet & Mobile Sync",
  "Advanced Visual Analytics & Conversion Metrics",
  "Strict Multi-Tenant Database Isolation",
];

const PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Free Access",
    badge: "FREE FOREVER",
    description: "Start instantly by creating your login account. Perfect for small businesses testing visual lead assignment.",
    monthlyPriceFormatted: "Rs. 0",
    annualPriceFormatted: "Rs. 0",
    periodLabel: "/ forever",
    ctaText: "Create Free Account →",
    ctaSubtext: "100% Free forever • Instant access",
    metaHighlight: "1 Team Lead + 1 Sales Agent Only",
    features: [
      "Instant Free Account Creation (No Credit Card)",
      "1 Admin + 1 Team Lead + 1 Sales Agent Only",
      "Centralized Visual Command Dashboard",
      "Manual Lead Assignment & Follow-Up Tracking",
      "Simultaneous Multi-Device Login (Web & Mobile)",
      "100% Cryptographic Tenant Data Isolation",
    ],
  },
  {
    id: "growth",
    name: "Professional",
    badge: "MOST POPULAR",
    highlighted: true,
    description: "Built for scaling businesses requiring full 3-tier role hierarchy, live agent tracking, and higher team limits.",
    monthlyPriceFormatted: "Rs. 3,000",
    annualPriceFormatted: "Rs. 2,400",
    periodLabel: "/ month",
    ctaText: "Claim Professional Plan →",
    ctaSubtext: "Instant setup • Cancel anytime",
    metaHighlight: "Up to 20 Team Members",
    features: SHARED_CORE_FEATURES,
  },
  {
    id: "agency",
    name: "Enterprise",
    badge: "CUSTOM SCALE",
    description: "For multi-branch companies, large sales floors, and organizations needing dedicated custom enterprise capacity.",
    monthlyPriceFormatted: "Custom",
    annualPriceFormatted: "Custom",
    periodLabel: "",
    isCustom: true,
    ctaText: "Contact for Custom Plan →",
    ctaSubtext: "Tailored contract • Dedicated onboarding",
    metaHighlight: "Unlimited Members & Devices",
    features: SHARED_CORE_FEATURES,
  },
];

const SIGNUP_URL = "https://customer-relationship-management-cr-eight.vercel.app/login?mode=signup";

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [mobileTier, setMobileTier] = useState<PricingTierId>("growth");

  return (
    <section id="pricing" className="scroll-mt-24 py-20 md:py-28 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-10 md:mb-14">
        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#1B7BED]/10 text-[#1B7BED] dark:bg-[#18DBF5]/10 dark:text-[#18DBF5] border border-[#1B7BED]/20 dark:border-[#18DBF5]/25 mb-3">
          <Icon icon="solar:tag-price-bold" className="w-4 h-4" />
          Transparent Business Pricing
        </span>
        <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-[#0A2540] dark:text-white tracking-tight">
          Start Free Today. Upgrade as Your Team Scales.
        </h2>
        <p className="text-[#476685] dark:text-slate-400 text-sm sm:text-base mt-3 max-w-2xl mx-auto leading-relaxed">
          Create an account to start with our Free Access plan (1 Team Lead and 1 Sales Agent). Scale to Professional at Rs. 3,000/mo or Custom Enterprise.
        </p>

        {/* Monthly / Annual Billing Toggle */}
        <div className="mt-8 flex items-center justify-center gap-3">
          <span className={`text-xs sm:text-sm font-semibold transition-colors ${billingCycle === "monthly" ? "text-[#0A2540] dark:text-white" : "text-[#476685] dark:text-slate-500"}`}>
            Monthly Billing
          </span>

          <button
            type="button"
            role="switch"
            aria-checked={billingCycle === "annual"}
            onClick={() => setBillingCycle(billingCycle === "monthly" ? "annual" : "monthly")}
            className="w-14 h-8 bg-[#DEEEFD] dark:bg-slate-800 rounded-full p-1 cursor-pointer border border-[#C8E0F8] dark:border-slate-700 relative transition-colors focus:outline-hidden"
          >
            <div
              className={`w-6 h-6 rounded-full bg-[#1B7BED] shadow-md transition-transform duration-300 ease-out flex items-center justify-center ${
                billingCycle === "annual" ? "translate-x-6 bg-[#18DBF5]" : "translate-x-0"
              }`}
            >
              <Icon
                icon={billingCycle === "annual" ? "solar:check-read-linear" : "solar:calendar-linear"}
                className="w-3.5 h-3.5 text-white"
              />
            </div>
          </button>

          <span className={`text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 ${billingCycle === "annual" ? "text-[#1B7BED] dark:text-[#18DBF5]" : "text-[#476685] dark:text-slate-500"}`}>
            Annual Billing
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#1B7BED]/15 text-[#1B7BED] dark:bg-[#18DBF5]/15 dark:text-[#18DBF5] border border-[#1B7BED]/30 dark:border-[#18DBF5]/30">
              Save 20%
            </span>
          </span>
        </div>

        {/* Mobile Segmented Tier Switcher (< 1024px) */}
        <div className="mt-6 grid grid-cols-3 p-1.5 bg-[#DEEEFD]/80 dark:bg-slate-900/90 border border-[#C8E0F8] dark:border-slate-800 rounded-2xl max-w-md mx-auto lg:hidden">
          {PLANS.map((plan) => {
            const isSelected = mobileTier === plan.id;
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => setMobileTier(plan.id)}
                className={`py-2 px-1 text-xs font-bold rounded-xl transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                  isSelected
                    ? "bg-[#1B7BED] text-white shadow-md shadow-[#1B7BED]/25"
                    : "text-[#476685] dark:text-slate-400 hover:text-[#0A2540] dark:hover:text-white"
                }`}
              >
                <span>{plan.name}</span>
                {plan.badge && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${isSelected ? "bg-white/20 text-white" : "bg-[#18DBF5]/20 text-[#1B7BED] dark:text-[#18DBF5]"}`}>
                    {plan.id === "free" ? "Free" : plan.id === "growth" ? "Popular" : "Custom"}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Pricing Cards Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
        {PLANS.map((plan) => {
          const isMobileVisible = mobileTier === plan.id;
          const displayPrice = plan.isCustom
            ? "Custom"
            : billingCycle === "annual"
            ? plan.annualPriceFormatted
            : plan.monthlyPriceFormatted;

          return (
            <div
              key={plan.id}
              className={`rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 relative ${
                plan.highlighted
                  ? "bg-[#DEEEFD]/90 dark:bg-gradient-to-b dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 border-2 border-[#1B7BED] dark:border-[#18DBF5]/60 shadow-2xl shadow-[#1B7BED]/15 lg:-translate-y-2"
                  : "bg-white/80 dark:bg-slate-900/70 border border-[#C8E0F8] dark:border-slate-800 hover:border-[#1B7BED]/50 dark:hover:border-slate-700"
              } ${isMobileVisible ? "flex" : "hidden lg:flex"}`}
            >
              {/* Highlighted Ribbon Badge */}
              {plan.badge && (
                <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider shadow-md ${
                  plan.id === "free"
                    ? "bg-[#DEEEFD] text-[#1B7BED] border border-[#1B7BED]/30 dark:bg-slate-800 dark:text-[#18DBF5]"
                    : plan.isCustom
                    ? "bg-slate-800 text-slate-200 border border-slate-700"
                    : "bg-gradient-to-r from-[#1B7BED] to-[#18DBF5] text-slate-950"
                }`}>
                  {plan.badge}
                </div>
              )}

              {/* Card Header & Price */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-[#0A2540] dark:text-white">{plan.name}</h3>
                  <span className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-[#DEEEFD] dark:bg-slate-800 text-[#1B7BED] dark:text-slate-300 border border-[#C8E0F8] dark:border-slate-700">
                    {plan.metaHighlight}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#476685] dark:text-slate-400 min-h-[40px] leading-relaxed">
                  {plan.description}
                </p>

                {/* Price Display */}
                <div className="my-6 pb-6 border-b border-[#C8E0F8] dark:border-slate-800">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0A2540] dark:text-white tracking-tight">
                      {displayPrice}
                    </span>
                    {plan.periodLabel && (
                      <span className="text-[#476685] dark:text-slate-400 text-sm font-medium">
                        {plan.periodLabel}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#476685] dark:text-slate-500 mt-1">
                    {plan.isCustom
                      ? "Custom pricing tailored to your scale • Dedicated SLA"
                      : plan.id === "free"
                      ? "Start by creating an account • No credit card needed"
                      : billingCycle === "annual"
                      ? `Billed annually (${plan.annualPriceFormatted} × 12/yr • Save 20%)`
                      : `Billed monthly (${plan.monthlyPriceFormatted}), cancel anytime`}
                  </p>
                </div>

                {/* Features List */}
                <div className="space-y-3 mb-8">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#476685] dark:text-slate-400">
                    Included Capabilities:
                  </p>
                  <ul className="space-y-2.5">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#0A2540] dark:text-slate-300">
                        <Icon
                          icon="solar:check-circle-bold"
                          className={`w-4 h-4 shrink-0 mt-0.5 ${plan.highlighted ? "text-[#1B7BED] dark:text-[#18DBF5]" : "text-[#1B7BED]"}`}
                        />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Card Action Button */}
              <div className="pt-4 border-t border-[#C8E0F8] dark:border-slate-800/80">
                <a
                  href={SIGNUP_URL}
                  className={`w-full h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                    plan.highlighted
                      ? "bg-gradient-to-r from-[#1B7BED] to-[#18DBF5] text-slate-950 font-bold hover:opacity-95 shadow-lg shadow-[#1B7BED]/25 hover:scale-[1.02]"
                      : "bg-[#DEEEFD] hover:bg-[#cbe2f8] text-[#0A2540] dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 border border-[#C8E0F8] dark:border-slate-700"
                  }`}
                >
                  <span>{plan.ctaText}</span>
                  <Icon icon="solar:arrow-right-linear" className="w-4 h-4" />
                </a>
                <p className="text-center text-[11px] text-[#476685] dark:text-slate-500 mt-2.5">
                  {plan.ctaSubtext}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Trust & Compliance Row */}
      <div className="mt-14 pt-8 border-t border-[#C8E0F8] dark:border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="p-3">
          <Icon icon="solar:shield-check-bold" className="w-6 h-6 text-[#1B7BED] dark:text-[#18DBF5] mx-auto mb-1.5" />
          <p className="text-xs font-bold text-[#0A2540] dark:text-white">100% Tenant Isolation</p>
          <p className="text-[11px] text-[#476685] dark:text-slate-400">Strict cryptographic boundaries</p>
        </div>
        <div className="p-3">
          <Icon icon="solar:users-group-two-rounded-bold" className="w-6 h-6 text-[#1B7BED] dark:text-[#18DBF5] mx-auto mb-1.5" />
          <p className="text-xs font-bold text-[#0A2540] dark:text-white">3-Tier RBAC Access</p>
          <p className="text-[11px] text-[#476685] dark:text-slate-400">Admin, Lead &amp; Agent control</p>
        </div>
        <div className="p-3">
          <Icon icon="solar:devices-bold" className="w-6 h-6 text-[#1B7BED] dark:text-[#18DBF5] mx-auto mb-1.5" />
          <p className="text-xs font-bold text-[#0A2540] dark:text-white">Multi-Device Concurrency</p>
          <p className="text-[11px] text-[#476685] dark:text-slate-400">Web, tablet &amp; mobile sync</p>
        </div>
        <div className="p-3">
          <Icon icon="solar:headphones-round-sound-bold" className="w-6 h-6 text-[#1B7BED] dark:text-[#18DBF5] mx-auto mb-1.5" />
          <p className="text-xs font-bold text-[#0A2540] dark:text-white">24/7 Priority Support</p>
          <p className="text-[11px] text-[#476685] dark:text-slate-400">Human assistance anytime</p>
        </div>
      </div>
    </section>
  );
}
