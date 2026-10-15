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
    name: "Starter",
    description: "Ideal for solo consultants & local businesses automating their first Meta ad campaign.",
    monthlyPrice: 29,
    annualMonthlyPrice: 23,
    ctaText: "Start 14-Day Free Trial",
    metaHighlight: "1,000 Meta Leads / mo",
    features: [
      "1 Connected WhatsApp Business Number",
      "Instant Meta Lead Ads Webhook Ingestion (< 60s)",
      "Up to 2 Sales Agent Seats",
      "Standard WhatsApp Message Templates",
      "Basic Kanban Pipeline Management",
      "Community & Email Support",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    badge: "MOST POPULAR",
    highlighted: true,
    description: "Built for scaling e-commerce, real estate, and service businesses requiring automated drip funnels.",
    monthlyPrice: 79,
    annualMonthlyPrice: 63,
    ctaText: "Claim Growth Plan Free Trial",
    metaHighlight: "10,000 Meta Leads / mo",
    features: [
      "3 Connected WhatsApp Business Numbers",
      "Multi-Agent Shared Inbox with Auto-Routing",
      "Automated Time-Delayed Drip Sequences",
      "0-Second Instant AI Auto-Responder",
      "Up to 8 Sales Agent Seats with Role Permissions",
      "Smart Lead Scoring & Intent Tagging",
      "Direct CSV Phonebook & Contact Importer",
      "Priority WhatsApp & Live Chat Support",
    ],
  },
  {
    id: "agency",
    name: "Agency / Enterprise",
    badge: "SCALING PARTNERS",
    description: "For marketing agencies, franchises, and high-volume media buyers running multi-client accounts.",
    monthlyPrice: 199,
    annualMonthlyPrice: 159,
    ctaText: "Get Started as Agency",
    metaHighlight: "Unlimited Leads & Clients",
    features: [
      "Unlimited WhatsApp Numbers & Sub-Accounts",
      "Multi-Tenant Agency Portal with Client Isolation",
      "25+ Team Seats with Granular Audit Logs",
      "Custom Webhook Ingestion & Rest APIs",
      "White-Label Client Reporting Dashboard",
      "Dedicated High-Throughput WhatsApp API Server",
      "Custom SLA & Dedicated Account Manager",
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
        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-3">
          <Icon icon="solar:tag-price-bold" className="w-4 h-4" />
          Predictable & Transparent ROI
        </span>
        <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
          Priced to Pay for Itself in a Single Converted Lead
        </h2>
        <p className="text-slate-400 text-sm sm:text-base mt-3 max-w-2xl mx-auto">
          No hidden setup fees, no per-seat penalties. Every plan includes official Meta Cloud API integration and full pipeline automation.
        </p>

        {/* Monthly / Annual Billing Toggle */}
        <div className="mt-8 flex items-center justify-center gap-3">
          <span className={`text-xs sm:text-sm font-semibold transition-colors ${billingCycle === "monthly" ? "text-white" : "text-slate-500"}`}>
            Monthly Billing
          </span>

          <button
            type="button"
            role="switch"
            aria-checked={billingCycle === "annual"}
            onClick={() => setBillingCycle(billingCycle === "monthly" ? "annual" : "monthly")}
            className="w-14 h-8 bg-slate-800 rounded-full p-1 cursor-pointer border border-slate-700 relative transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <div
              className={`w-6 h-6 rounded-full bg-blue-500 shadow-md transition-transform duration-300 ease-out flex items-center justify-center ${
                billingCycle === "annual" ? "translate-x-6 bg-emerald-400" : "translate-x-0"
              }`}
            >
              <Icon
                icon={billingCycle === "annual" ? "solar:check-read-linear" : "solar:calendar-linear"}
                className="w-3.5 h-3.5 text-slate-950"
              />
            </div>
          </button>

          <span className={`text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 ${billingCycle === "annual" ? "text-emerald-400" : "text-slate-500"}`}>
            Annual Billing
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Save 20%
            </span>
          </span>
        </div>

        {/* Mobile Segmented Tier Switcher (< 1024px) - Eliminates 2,500px of Vertical Scroll Fatigue */}
        <div className="mt-6 grid grid-cols-3 p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl max-w-md mx-auto lg:hidden">
          {PLANS.map((plan) => {
            const isSelected = mobileTier === plan.id;
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => setMobileTier(plan.id)}
                className={`py-2 px-1 text-xs font-bold rounded-xl transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>{plan.name}</span>
                {plan.highlighted && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? "bg-white/20 text-white" : "bg-emerald-500/20 text-emerald-400"}`}>
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
                  ? "bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-blue-500/60 shadow-2xl shadow-blue-500/15 lg:-translate-y-2"
                  : "bg-slate-900/70 border border-slate-800 hover:border-slate-700"
              } ${isMobileVisible ? "flex" : "hidden lg:flex"}`}
            >
              {/* Highlighted Ribbon Badge */}
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-gradient-to-r from-blue-500 to-emerald-400 text-slate-950 shadow-md">
                  {plan.badge}
                </div>
              )}

              {/* Card Header & Price */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  <span className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                    {plan.metaHighlight}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 min-h-[40px] leading-relaxed">
                  {plan.description}
                </p>

                {/* Price Display */}
                <div className="my-6 pb-6 border-b border-slate-800">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                      ${displayPrice}
                    </span>
                    <span className="text-slate-400 text-sm font-medium">/ month</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {billingCycle === "annual" ? `Billed annually ($${displayPrice * 12}/yr)` : "Billed monthly, cancel anytime"}
                  </p>
                </div>

                {/* Features List */}
                <div className="space-y-3 mb-8">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Included Capabilities:
                  </p>
                  <ul className="space-y-2.5">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300">
                        <Icon
                          icon="solar:check-circle-bold"
                          className={`w-4 h-4 shrink-0 mt-0.5 ${plan.highlighted ? "text-emerald-400" : "text-blue-400"}`}
                        />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Card Action Button */}
              <div className="pt-4 border-t border-slate-800/80">
                <a
                  href={SIGNUP_URL}
                  className={`w-full h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                    plan.highlighted
                      ? "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/25 hover:scale-[1.02]"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700"
                  }`}
                >
                  <span>{plan.ctaText}</span>
                  <Icon icon="solar:arrow-right-linear" className="w-4 h-4" />
                </a>
                <p className="text-center text-[11px] text-slate-500 mt-2.5">
                  14 days free • No credit card required
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Trust & Compliance Guarantee Row */}
      <div className="mt-14 pt-8 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="p-3">
          <Icon icon="solar:shield-check-bold" className="w-6 h-6 text-emerald-400 mx-auto mb-1.5" />
          <p className="text-xs font-bold text-white">Meta Verified Partner API</p>
          <p className="text-[11px] text-slate-400">Official WhatsApp Cloud APIs</p>
        </div>
        <div className="p-3">
          <Icon icon="solar:lock-keyhole-minimalistic-bold" className="w-6 h-6 text-blue-400 mx-auto mb-1.5" />
          <p className="text-xs font-bold text-white">256-Bit Data Encryption</p>
          <p className="text-[11px] text-slate-400">Strict GDPR & privacy rules</p>
        </div>
        <div className="p-3">
          <Icon icon="solar:card-2-linear" className="w-6 h-6 text-emerald-400 mx-auto mb-1.5" />
          <p className="text-xs font-bold text-white">Zero Lock-In Contracts</p>
          <p className="text-[11px] text-slate-400">Cancel or upgrade in 1 click</p>
        </div>
        <div className="p-3">
          <Icon icon="solar:headphones-round-sound-bold" className="w-6 h-6 text-blue-400 mx-auto mb-1.5" />
          <p className="text-xs font-bold text-white">24/7 Human Onboarding</p>
          <p className="text-[11px] text-slate-400">Live setup on Google Meet</p>
        </div>
      </div>
    </section>
  );
}
