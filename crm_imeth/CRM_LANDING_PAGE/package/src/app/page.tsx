import React from "react";
import type { Metadata } from "next";
import PasSection from "@/components/PAS/PasSection";
import InteractiveDemo from "@/components/InteractiveDemo/InteractiveDemo";
import BentoFeatures from "@/components/Home/BentoFeatures/BentoFeatures";
import RoiCalculator from "@/components/PAS/RoiCalculator";
import Pricing from "@/components/Home/Pricing";
import FaqAccordion from "@/components/Home/FAQ/FaqAccordion";
import MobileStickyBar from "@/components/MobileStickyBar/MobileStickyBar";

export const metadata: Metadata = {
  title: "BluePlanet CRM | Convert Meta Ad Leads on WhatsApp in Under 60 Seconds",
  description:
    "Stop losing 70% of inbound Meta leads to delayed replies. Instant Facebook & Instagram webhook ingestion, automated WhatsApp drip sequences, and multi-agent Kanban tracking.",
};

const CRM_SIGNUP_URL =
  process.env.NEXT_PUBLIC_CRM_APP_URL ||
  "https://customer-relationship-management-cr-eight.vercel.app/login?mode=signup";

const TRUST_METRICS = [
  { value: "4.8M+", label: "WhatsApp Messages Automated" },
  { value: "98.4%", label: "Average 15-Min Open Rate" },
  { value: "3.4x", label: "Faster Lead-to-Deal Velocity" },
];

export default function LandingPage() {
  return (
    <main className="min-h-[100dvh] bg-[#07090E] text-slate-100 pb-24 md:pb-0 selection:bg-emerald-500 selection:text-slate-950">
      {/* 1. Fixed Glassmorphic Navigation */}
      <header className="glass-nav fixed top-0 inset-x-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto h-16 sm:h-20 px-4 sm:px-6 flex items-center justify-between">
          <a href="#" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0F4C75] to-[#2F73F2] flex items-center justify-center shadow-md shrink-0">
              {/* Zero-CLS Inline SVG for Brand Logo */}
              <svg className="w-5 h-5 text-white shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 1.821.487 3.53 1.338 5L2.5 21.5l4.646-.826A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm-3.5 11.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm3.5 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm3.5 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
              </svg>
            </div>
            <span className="text-base sm:text-lg font-extrabold tracking-tight text-white">
              BluePlanet <span className="text-emerald-400">CRM</span>
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
            <a href="#problem" className="hover:text-white transition-colors">Why Leads Leak</a>
            <a href="#demo" className="hover:text-white transition-colors">Live Sandbox</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#roi-calculator" className="hover:text-white transition-colors">ROI Calculator</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="https://customer-relationship-management-cr-eight.vercel.app/login"
              className="hidden sm:inline-flex text-xs sm:text-sm font-semibold text-slate-300 hover:text-white px-3 py-2"
            >
              Sign In
            </a>
            <a
              href={CRM_SIGNUP_URL}
              className="cta-primary-btn h-10 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
            >
              Start Free Trial →
            </a>
          </div>
        </div>
      </header>

      {/* 2. Above-the-Fold Hero Section */}
      <section className="pt-28 sm:pt-36 pb-14 sm:pb-20 px-4 sm:px-6 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          Zero-Latency Meta Lead Routing for WhatsApp Sales Teams
        </div>

        <h1 className="text-[clamp(2rem,5.5vw,3.75rem)] font-extrabold text-white tracking-tight leading-[1.12] max-w-4xl mx-auto">
          Turn Meta Ad Leads into{" "}
          <span className="bg-gradient-to-r from-emerald-400 via-sky-400 to-blue-500 bg-clip-text text-transparent">
            WhatsApp Sales
          </span>{" "}
          in Under 60 Seconds
        </h1>

        <p className="text-slate-400 text-sm sm:text-lg max-w-2xl mx-auto mt-5 leading-relaxed">
          Stop losing 70% of inbound leads to delayed replies. BluePlanet CRM automatically captures Facebook &amp; Instagram leads, triggers instant WhatsApp drip workflows, and routes chats to your sales team with zero manual effort.
        </p>

        {/* Mobile-First Stacked CTA Trio -> Desktop Inline */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md sm:max-w-none mx-auto">
          <a
            href={CRM_SIGNUP_URL}
            className="cta-primary-btn w-full sm:w-auto h-12 px-7 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20"
          >
            <span>Get Started Free (No Credit Card)</span>
            {/* Zero-CLS Inline SVG for Arrow */}
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </a>
          <a
            href="#demo"
            className="w-full sm:w-auto h-12 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm sm:text-base flex items-center justify-center gap-2 transition-colors"
          >
            {/* Zero-CLS Inline SVG for Play */}
            <svg className="w-5 h-5 text-blue-400 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM9.548 8.653A.75.75 0 0110.375 8.2l6 4a.75.75 0 010 1.25l-6 4a.75.75 0 01-1.127-.625v-8a.75.75 0 01.3-.672z" clipRule="evenodd" />
            </svg>
            <span>Test Live Sandbox Demo</span>
          </a>
        </div>

        <p className="mt-4 text-xs text-slate-400 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <span>⚡ 5-minute setup</span>
          <span>•</span>
          <span>✓ Official Meta Cloud API Ready</span>
          <span>•</span>
          <span>✓ 100% Client Sub-Account Isolation</span>
        </p>
      </section>

      {/* 3. Social Proof Metric Bar */}
      <section className="py-8 border-y border-slate-800/80 bg-slate-950/50 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          {TRUST_METRICS.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
                {stat.value}
              </span>
              <span className="text-xs sm:text-sm text-slate-400 mt-1">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 4. PAS (Problem - Agitation - Solution) */}
      <PasSection />

      {/* 5. Interactive WhatsApp & Kanban Sandbox */}
      <InteractiveDemo />

      {/* 6. 4-Pillar Bento Feature Breakdown */}
      <BentoFeatures />

      {/* 7. Sticky-Top Mobile ROI Calculator */}
      <RoiCalculator />

      {/* 8. Segmented Mobile Pricing Table */}
      <Pricing />

      {/* 9. Zero-Jank CSS Grid FAQ Accordion */}
      <FaqAccordion />

      {/* 10. High-Urgency Bottom Conversion Banner */}
      <section className="py-16 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="bg-gradient-to-br from-[#0F4C75] via-slate-900 to-slate-950 border border-blue-500/30 rounded-3xl p-8 sm:p-12 text-center shadow-2xl">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Ready to Stop Wasting Your Meta Ad Spend?
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto mt-3">
            Connect your Facebook Page and WhatsApp number in under 5 minutes. Lock in your 14-day risk-free trial today.
          </p>
          <div className="mt-7 flex justify-center">
            <a
              href={CRM_SIGNUP_URL}
              className="cta-primary-btn h-12 px-8 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm sm:text-base inline-flex items-center gap-2 shadow-xl shadow-emerald-500/25"
            >
              Launch Your 14-Day Free Trial →
            </a>
          </div>
        </div>
      </section>

      {/* 11. Minimal Enterprise Footer */}
      <footer className="border-t border-slate-800/80 py-10 px-4 sm:px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 BluePlanet Solutions. All rights reserved. Meta Tech Provider API Partner.</p>
          <div className="flex items-center gap-6">
            <a href="https://customer-relationship-management-cr-eight.vercel.app/privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
            <a href="https://customer-relationship-management-cr-eight.vercel.app/terms" className="hover:text-slate-300 transition-colors">Terms of Service</a>
            <a href="https://customer-relationship-management-cr-eight.vercel.app/status" className="hover:text-slate-300 transition-colors">System Status</a>
          </div>
        </div>
      </footer>

      {/* 12. Collision-Free Mobile Sticky Bar (< 768px) */}
      <MobileStickyBar />
    </main>
  );
}
