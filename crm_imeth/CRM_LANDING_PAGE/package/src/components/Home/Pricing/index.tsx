"use client";

import React, { useState } from "react";
import { Icon } from "@iconify/react";

type BillingCycle = "monthly" | "annual";
type PricingTierId = "starter" | "growth" | "agency";

interface PricingPlan {
  id: PricingTierId;
  name: string;
  badge?: string;
  description: string;
  monthlyPrice: number;
  annualMonthlyPrice: number;
  highlighted?: boolean;
  ctaText: string;
  features: string[];
  metaHighlight: string;
}

const PLANS: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter Team",
    description: "Ideal for growing businesses organizing their first visual lead pipeline and employee roles.",
    monthlyPrice: 29,
    annualMonthlyPrice: 23,
    ctaText: "Start 14-Day Free Trial",
    metaHighlight: "Up to 5 Team Members",
    features: [
      "1 Admin + 1 Team Lead + 3 Sales Agents",
      "Manual Lead Assignment & Rebalancing",
      "Centralized Visual Dashboard",
      "Simultaneous Multi-Device Login",
      "Tenant-Level Data Encryption",
      "Standard Email & Community Support",
    ],
  },
  {
    id: "growth",
    name: "Professional",
    badge: "MOST POPULAR",
    highlighted: true,
    description: "Built for scaling businesses requiring full 3-tier role hierarchy, live agent tracking, and high lead volumes.",
    monthlyPrice: 79,
    annualMonthlyPrice: 63,
    ctaText: "Claim Professional Free Trial",
    metaHighlight: "Up to 20 Team Members",
    features: [
      "Full 3-Tier RBAC (Admins, Leads, Sales Agents)",
      "Live Agent Activity & Capacity Monitoring",
      "Instant 1-Click Lead Reassignment Rules",
      "Cross-Platform Desktop, Tablet & Mobile Sync",
      "Advanced Visual Analytics & Conversion Metrics",
      "Strict Multi-Tenant Database Isolation",
      "CSV Lead Export & Custom Fields",
      "Priority Live Chat Support",
    ],
  },
  {
    id: "agency",
    name: "Enterprise",
    badge: "SCALING BUSINESSES",
    description: "For multi-branch companies, large sales floors, and organizations needing dedicated tenant infrastructure.",
    monthlyPrice: 199,
    annualMonthlyPrice: 159,
    ctaText: "Get Started as Enterprise",
    metaHighlight: "Unlimited Members & Devices",
    features: [
      "Unlimited Concurrent Logins & Team Members",
      "Custom Role Permissions & Security Audit Logs",
      "Dedicated Multi-Tenant Instance with Custom SLA",
      "Automated Workload Balancing Rules",
      "Executive Multi-Department Dashboards",
      "Direct API Integrations & Webhook Sync",
      "Dedicated Account Manager & Live Setup",
    ],
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
          Priced to Pay for Itself in a Single Converted Deal
        </h2>
        <p className="text-[#476685] dark:text-slate-400 text-sm sm:text-base mt-3 max-w-2xl mx-auto leading-relaxed">
          No hidden fees or surprise costs. Every plan includes visual dashboard tracking, role-based access, and simultaneous multi-device logins.
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
                {plan.highlighted && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? "bg-white/20 text-white" : "bg-[#18DBF5]/20 text-[#1B7BED] dark:text-[#18DBF5]"}`}>
                    Popular ★
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
          const displayPrice = billingCycle === "annual" ? plan.annualMonthlyPrice : plan.monthlyPrice;

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
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-gradient-to-r from-[#1B7BED] to-[#18DBF5] text-slate-950 shadow-md">
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
                    <span className="text-4xl sm:text-5xl font-extrabold text-[#0A2540] dark:text-white tracking-tight">
                      ${displayPrice}
                    </span>
                    <span className="text-[#476685] dark:text-slate-400 text-sm font-medium">/ month</span>
                  </div>
                  <p className="text-[11px] text-[#476685] dark:text-slate-500 mt-1">
                    {billingCycle === "annual" ? `Billed annually ($${displayPrice * 12}/yr)` : "Billed monthly, cancel anytime"}
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
                  14 days free • No credit card required
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Trust & Compliance Row (Zero Meta/WhatsApp specifics) */}
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
