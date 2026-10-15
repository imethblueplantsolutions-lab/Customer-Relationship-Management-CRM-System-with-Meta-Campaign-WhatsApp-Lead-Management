import React from "react";
import type { Metadata } from "next";
import Image from "next/image";
import ThemeToggler from "@/components/Layout/Header/ThemeToggler";
import PasSection from "@/components/PAS/PasSection";
import DashboardPreview from "@/components/Home/VisualDashboard/DashboardPreview";
import BentoFeatures from "@/components/Home/BentoFeatures/BentoFeatures";
import RoiCalculator from "@/components/PAS/RoiCalculator";
import Pricing from "@/components/Home/Pricing";
import FaqAccordion from "@/components/Home/FAQ/FaqAccordion";
import MobileStickyBar from "@/components/MobileStickyBar/MobileStickyBar";

export const metadata: Metadata = {
  title: "MyCrm | Smart Lead Management Platform for Growing Businesses",
  description:
    "MyCrm is a smart lead management platform built specifically for businesses. Add lead details to a visual dashboard, handle leads instantly, and give managers a clear view of performance and agent activity.",
};

const CRM_SIGNUP_URL =
  process.env.NEXT_PUBLIC_CRM_APP_URL ||
  "https://customer-relationship-management-cr-eight.vercel.app/login?mode=signup";

const TRUST_METRICS = [
  { value: "100%", label: "Tenant Data Isolation", detail: "Cryptographic Row-Level Security" },
  { value: "3-Tier", label: "Role-Based Access Control", detail: "Admins, Team Leads & Sales Agents" },
  { value: "Simultaneous", label: "Multi-Device Concurrency", detail: "Desktop, Tablet & Mobile Sync" },
];

export default function LandingPage() {
  return (
    <main className="min-h-[100dvh] bg-[#F3F8FE] text-[#0A2540] dark:bg-[#07090E] dark:text-slate-100 pb-24 md:pb-0 transition-colors duration-200 selection:bg-[#1B7BED] selection:text-white">
      {/* 1. Fixed Glassmorphic Navigation with Left ThemeToggler */}
      <header className="glass-nav fixed top-0 inset-x-0 z-40 bg-[#F3F8FE]/85 dark:bg-[#07090E]/85 backdrop-blur-md border-b border-[#C8E0F8] dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto h-16 sm:h-20 px-4 sm:px-6 flex items-center justify-between">
          {/* Left Brand Container + ThemeToggler */}
          <div className="flex items-center gap-3 sm:gap-4">
            <a href="#" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1B7BED] to-[#18DBF5] flex items-center justify-center shadow-md shadow-[#1B7BED]/25 shrink-0">
                {/* Zero-CLS Inline SVG for Brand Logo */}
                <svg className="w-5 h-5 text-white shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
              </div>
              <span className="text-base sm:text-lg font-black tracking-tight text-[#0A2540] dark:text-white">
                My<span className="text-[#1B7BED] dark:text-[#18DBF5]">Crm</span>
              </span>
            </a>

            {/* Prominent Theme Toggle Button on Navigation Bar (Desktop & Mobile) */}
            <div className="flex items-center pl-1 sm:pl-2 border-l border-[#C8E0F8] dark:border-slate-800">
              <ThemeToggler />
            </div>
          </div>

          {/* Desktop Center Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-xs xl:text-sm font-semibold text-[#476685] dark:text-slate-300">
            <a href="#problem" className="hover:text-[#1B7BED] dark:hover:text-white transition-colors">Why Leads Leak</a>
            <a href="#dashboard-preview" className="hover:text-[#1B7BED] dark:hover:text-white transition-colors">Visual Dashboard</a>
            <a href="#features" className="hover:text-[#1B7BED] dark:hover:text-white transition-colors">Features</a>
            <a href="#roi-calculator" className="hover:text-[#1B7BED] dark:hover:text-white transition-colors">ROI Calculator</a>
            <a href="#pricing" className="hover:text-[#1B7BED] dark:hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-[#1B7BED] dark:hover:text-white transition-colors">FAQ</a>
          </nav>

          {/* Right Header CTAs */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <a
              href="https://customer-relationship-management-cr-eight.vercel.app/login"
              className="hidden sm:inline-flex text-xs sm:text-sm font-semibold text-[#476685] hover:text-[#0A2540] dark:text-slate-300 dark:hover:text-white px-3 py-2 transition-colors"
            >
              Sign In
            </a>
            <a
              href={CRM_SIGNUP_URL}
              className="cta-primary-btn h-9 sm:h-10 px-3.5 sm:px-4.5 rounded-xl bg-gradient-to-r from-[#1B7BED] to-[#18DBF5] text-slate-950 text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md shadow-[#1B7BED]/25 cursor-pointer"
            >
              <span>Get Started</span>
              <span className="hidden sm:inline">Free</span> →
            </a>
          </div>
        </div>
      </header>

      {/* 2. Hero Section (Crypgo Visual Design: 2-Col Desktop / Stacked Mobile) */}
      <section className="pt-24 sm:pt-32 pb-14 sm:pb-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          
          {/* Left Column: Typography, Value Proposition & CTAs */}
          <div className="lg:col-span-7 text-center lg:text-left">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#DEEEFD] text-[#1B7BED] border border-[#C8E0F8] dark:bg-[#18DBF5]/10 dark:text-[#18DBF5] dark:border-[#18DBF5]/25 mb-6">
              <span className="w-2 h-2 rounded-full bg-[#1B7BED] dark:bg-[#18DBF5] animate-ping" />
              Smart Lead Management Platform for Growing Teams
            </div>

            {/* H1 Headline */}
            <h1 className="text-[clamp(2.1rem,4.5vw,3.6rem)] font-extrabold text-[#0A2540] dark:text-white tracking-tight leading-[1.14]">
              Stop Passing Around Leads in Spreadsheets. Manage, Assign &amp; Close on One{" "}
              <span className="bg-gradient-to-r from-[#1B7BED] via-[#18DBF5] to-blue-500 bg-clip-text text-transparent">
                Visual Dashboard
              </span>
            </h1>

            {/* Exact Core User Paragraph */}
            <p className="text-[#476685] dark:text-slate-400 text-sm sm:text-base lg:text-lg mt-5 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              MyCrm is a smart lead management platform built specifically for businesses. It acts like a platform for lead management for business adding lead details to a visual dashboard. Instead of passing around leads in business, your team can instantly handle leads while managers get a clear view of leads performance, and agent activity.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 max-w-md sm:max-w-none mx-auto lg:mx-0">
              <a
                href={CRM_SIGNUP_URL}
                className="cta-primary-btn w-full sm:w-auto h-12 px-7 rounded-xl bg-gradient-to-r from-[#1B7BED] to-[#18DBF5] text-slate-950 font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl shadow-[#1B7BED]/25 cursor-pointer"
              >
                <span>Explore MyCrm →</span>
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </a>

              <a
                href="#dashboard-preview"
                className="w-full sm:w-auto h-12 px-6 rounded-xl bg-[#DEEEFD] hover:bg-[#cbe2f8] text-[#0A2540] border border-[#C8E0F8] dark:bg-slate-900/90 dark:hover:bg-slate-800 dark:text-slate-200 dark:border-slate-700 font-semibold text-sm sm:text-base flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5 text-[#1B7BED] dark:text-[#18DBF5] shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M2.25 13.5a8.25 8.25 0 018.25-8.25.75.75 0 01.75.75v6.75H18a.75.75 0 01.75.75 8.25 8.25 0 01-16.5 0z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M12.75 3a.75.75 0 01.75-.75 8.25 8.25 0 018.25 8.25.75.75 0 01-.75.75h-7.5a.75.75 0 01-.75-.75V3z" clipRule="evenodd" />
                </svg>
                <span>Explore Visual Dashboard ↓</span>
              </a>
            </div>

            {/* Trust Mini Proof Points */}
            <p className="mt-5 text-xs text-[#476685] dark:text-slate-400 flex flex-wrap items-center justify-center lg:justify-start gap-x-4 gap-y-1.5">
              <span>⚡ 5-minute team setup</span>
              <span>•</span>
              <span>✓ 100% Multi-Tenant Data Isolation</span>
              <span>•</span>
              <span>✓ 3-Tier RBAC Access</span>
            </p>
          </div>

          {/* Right Column: Hand-Held Dashboard Mockup & Floating Glass Badges (Crypgo Style) */}
          <div className="lg:col-span-5 relative flex items-center justify-center pt-6 lg:pt-0">
            {/* Ambient Background Glow */}
            <div className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-gradient-to-tr from-[#1B7BED]/20 to-[#18DBF5]/20 blur-3xl pointer-events-none" />

            {/* Sparkle Starlight Accents */}
            <div className="absolute -top-3 left-6 text-[#18DBF5] animate-pulse pointer-events-none">
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path d="M12 2l2.4 7.6H22l-6.2 4.5 2.4 7.6-6.2-4.5-6.2 4.5 2.4-7.6L2 9.6h7.6z" />
              </svg>
            </div>

            <div className="relative z-10 max-w-[340px] sm:max-w-[420px] w-full">
              {/* Hand-Held Smartphone Graphic */}
              <div className="relative mx-auto drop-shadow-2xl">
                <Image
                  src="/images/hero/hero-crypgo-mockup.png"
                  alt="MyCrm Visual Lead Management Mobile Dashboard"
                  width={420}
                  height={560}
                  priority
                  className="w-full h-auto object-contain select-none"
                />

                {/* Floating Frosted Glass Badge 1: +75% Lead Conversion Lift */}
                <div className="absolute top-10 -right-2 sm:-right-6 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-[#C8E0F8] dark:border-slate-700/80 rounded-2xl p-3 sm:p-4 shadow-xl flex items-center gap-3 animate-float">
                  <div className="relative w-11 h-11 flex items-center justify-center">
                    <svg className="w-11 h-11 -rotate-90 text-[#C8E0F8] dark:text-slate-800" viewBox="0 0 36 36">
                      <path
                        className="stroke-current fill-none"
                        strokeWidth="3.5"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="stroke-[#18DBF5] fill-none"
                        strokeDasharray="75, 100"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <span className="absolute text-[11px] font-extrabold text-[#0A2540] dark:text-white font-mono">
                      +75%
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-[#0A2540] dark:text-white block">
                      Conversion Lift
                    </span>
                    <span className="text-[10px] text-[#476685] dark:text-slate-400">
                      Zero dropped leads
                    </span>
                  </div>
                </div>

                {/* Floating Frosted Glass Badge 2: Live Activity */}
                <div className="absolute bottom-6 -left-2 sm:-left-6 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-[#C8E0F8] dark:border-slate-700/80 rounded-2xl p-3 sm:p-3.5 shadow-xl flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-[#0A2540] dark:text-white block">
                      1,420 Active Leads Assigned
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      98% Handled • Real-time Sync
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Business Trust Metrics Bar */}
      <section className="py-8 border-y border-[#C8E0F8] dark:border-slate-800/80 bg-[#DEEEFD]/40 dark:bg-slate-950/50 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          {TRUST_METRICS.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-[#1B7BED] dark:text-[#18DBF5]">
                {stat.value}
              </span>
              <span className="text-xs sm:text-sm font-bold text-[#0A2540] dark:text-white mt-1">
                {stat.label}
              </span>
              <span className="text-[11px] text-[#476685] dark:text-slate-400 mt-0.5">
                {stat.detail}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 4. PAS (Problem - Agitation - Solution) */}
      <PasSection />

      {/* 5. Interactive 3-Tier RBAC & Visual Command Center (Replaces old WhatsApp demo) */}
      <DashboardPreview />

      {/* 6. 4-Pillar Bento Feature Breakdown (The 5 User Goals) */}
      <BentoFeatures />

      {/* 7. Sticky-Top Mobile ROI & Capacity Calculator */}
      <RoiCalculator />

      {/* 8. Segmented Mobile Pricing Table (Free of WhatsApp/Meta fees) */}
      <Pricing />

      {/* 9. Zero-Jank CSS Grid FAQ Accordion */}
      <FaqAccordion />

      {/* 10. High-Urgency Bottom Conversion Banner */}
      <section className="py-16 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="bg-gradient-to-br from-[#1B7BED] via-[#0F4C75] to-slate-950 border border-[#18DBF5]/30 rounded-3xl p-8 sm:p-12 text-center shadow-2xl text-white">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Ready to Stop Passing Around Leads and Start Closing?
          </h2>
          <p className="text-slate-200 text-sm sm:text-base max-w-xl mx-auto mt-3 leading-relaxed">
            Configure your employee roster, assign work seamlessly, and gain clear visibility into your team&apos;s performance today.
          </p>
          <div className="mt-7 flex justify-center">
            <a
              href={CRM_SIGNUP_URL}
              className="cta-primary-btn h-12 px-8 rounded-xl bg-gradient-to-r from-[#18DBF5] to-white text-slate-950 font-bold text-sm sm:text-base inline-flex items-center gap-2 shadow-xl shadow-[#18DBF5]/25 cursor-pointer"
            >
              Launch Your 14-Day Free Trial →
            </a>
          </div>
        </div>
      </section>

      {/* 11. Minimal Enterprise Footer */}
      <footer className="border-t border-[#C8E0F8] dark:border-slate-800/80 py-10 px-4 sm:px-6 text-center text-xs text-[#476685] dark:text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 MyCrm Solutions. All rights reserved. Multi-Tenant Enterprise Lead Management Platform.</p>
          <div className="flex items-center gap-6">
            <a href="https://customer-relationship-management-cr-eight.vercel.app/privacy" className="hover:text-[#1B7BED] dark:hover:text-slate-300 transition-colors">Privacy Policy</a>
            <a href="https://customer-relationship-management-cr-eight.vercel.app/terms" className="hover:text-[#1B7BED] dark:hover:text-slate-300 transition-colors">Terms of Service</a>
            <a href="https://customer-relationship-management-cr-eight.vercel.app/status" className="hover:text-[#1B7BED] dark:hover:text-slate-300 transition-colors">System Status</a>
          </div>
        </div>
      </footer>

      {/* 12. Collision-Free Mobile Sticky Bar (< 768px) */}
      <MobileStickyBar />
    </main>
  );
}
