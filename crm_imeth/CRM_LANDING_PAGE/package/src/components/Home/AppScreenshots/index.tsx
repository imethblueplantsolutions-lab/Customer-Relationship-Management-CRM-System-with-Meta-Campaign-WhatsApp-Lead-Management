"use client";

import React, { useState } from "react";
import Image from "next/image";
import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";
import { Icon } from "@iconify/react";

export interface AppScreenshotItem {
  id: string;
  title: string;
  badge: string;
  role: string;
  description: string;
  imageSrc?: string; // Users can plug in real screenshots (e.g. "/images/screenshots/admin-dashboard.png")
  fallbackMock: {
    accentColor: string;
    metrics: { label: string; value: string; trend?: string }[];
    tablePreview: { col1: string; col2: string; col3: string; status: string }[];
  };
}

// FUTURE SCREENSHOT REPOSITORY:
// Simply drop your PNG/JPG screenshots into /public/images/screenshots/
// and provide the imageSrc property on any item below.
const APP_SCREENSHOTS: AppScreenshotItem[] = [
  {
    id: "admin-overview",
    title: "Centralized Visual Command Dashboard",
    badge: "Super Admin View",
    role: "System Authority & Governance",
    description:
      "Global command center displaying tenant isolation security health, cross-branch lead velocity, real-time closure rates, and team capacity allocation at a glance.",
    fallbackMock: {
      accentColor: "#1B7BED",
      metrics: [
        { label: "Active Tenant Leads", value: "1,420", trend: "+18.4%" },
        { label: "Unassigned Queue", value: "12 Leads", trend: "-65% drop" },
        { label: "Closure Rate", value: "74.8%", trend: "+12.2%" },
        { label: "Data Isolation", value: "100% Locked", trend: "Verified" },
      ],
      tablePreview: [
        { col1: "Apex Logistics Ltd", col2: "Marcus Vance", col3: "$18,500", status: "Assigned" },
        { col1: "Horizon Retail Tech", col2: "Elena Rostova", col3: "$9,200", status: "Negotiation" },
        { col1: "Quantum Cloud Labs", col2: "Jordan Hayes", col3: "$34,000", status: "Closed Won" },
      ],
    },
  },
  {
    id: "team-lead-delegation",
    title: "1-Click Dynamic Lead Assignment Matrix",
    badge: "Team Lead View",
    role: "Workload Balancing & Supervision",
    description:
      "Team Leads can evaluate live sales agent capacity, spot incoming unassigned inquiries instantly, and reassign deals in one click to keep response times under 5 minutes.",
    fallbackMock: {
      accentColor: "#18DBF5",
      metrics: [
        { label: "Maya Patel (Senior)", value: "14 Leads", trend: "Capacity 93%" },
        { label: "David Miller (Closer)", value: "9 Leads", trend: "Capacity 60%" },
        { label: "Sarah Chen (Rep)", value: "6 Leads", trend: "Capacity 40%" },
        { label: "James Wilson (Specialist)", value: "4 Leads", trend: "Available" },
      ],
      tablePreview: [
        { col1: "Inbound Website Form", col2: "Pacific Dynamics", col3: "$22,000", status: "Instant Reassigned" },
        { col1: "Direct Referral", col2: "BioGen Innovations", col3: "$15,400", status: "Assigned to Maya" },
        { col1: "Enterprise Request", col2: "Atlas Industrial", col3: "$48,000", status: "Assigned to David" },
      ],
    },
  },
  {
    id: "sales-agent-focus",
    title: "Agent High-Velocity Deal Terminal",
    badge: "Sales Agent View",
    role: "Direct Prospect Execution",
    description:
      "A distraction-free workspace dedicated to customer interaction. Reps track daily overdue follow-ups, update lead stages, schedule calls, and record interaction logs.",
    fallbackMock: {
      accentColor: "#10B981",
      metrics: [
        { label: "Today's Follow-ups", value: "8 Pending", trend: "Due Today" },
        { label: "Overdue Alerts", value: "0 Deals", trend: "Zero backlog" },
        { label: "Calls Scheduled", value: "5 Calls", trend: "Next in 25m" },
        { label: "Closed This Month", value: "$64,200", trend: "+28% vs avg" },
      ],
      tablePreview: [
        { col1: "Call with CFO (Apex)", col2: "Marcus Vance", col3: "Today 2:30 PM", status: "Confirmed" },
        { col1: "Send Proposal (Horizon)", col2: "Elena Rostova", col3: "Tomorrow 10 AM", status: "High Priority" },
        { col1: "Final Contract Review", col2: "Jordan Hayes", col3: "Friday 4 PM", status: "Ready to Sign" },
      ],
    },
  },
  {
    id: "analytics-performance",
    title: "Executive Revenue & Lead Velocity Analytics",
    badge: "Performance Intelligence",
    role: "Visual Conversion Metrics",
    description:
      "Deep actionable analytics on lead stage conversion funnel, agent closure velocity, drop-off reduction, and multi-tenant department benchmarks.",
    fallbackMock: {
      accentColor: "#F59E0B",
      metrics: [
        { label: "Avg Response Time", value: "4.2 mins", trend: "3x faster" },
        { label: "Lead-to-Won Ratio", value: "32.6%", trend: "+8.4%" },
        { label: "Total Deal Volume", value: "$482,000", trend: "Active Pipeline" },
        { label: "Lost Opportunity Rate", value: "1.8%", trend: "-84% leak fix" },
      ],
      tablePreview: [
        { col1: "Stage 1: Inbound Lead Intake", col2: "100% Captured", col3: "0 Dropped", status: "Optimal" },
        { col1: "Stage 2: 1-Click Assignment", col2: "98% Handled < 10m", col3: "100% Assigned", status: "Peak" },
        { col1: "Stage 3: Decision & Contract", col2: "74% Conversion", col3: "Live Sync", status: "Closed Won" },
      ],
    },
  },
  {
    id: "multi-device-sync",
    title: "Simultaneous Multi-Device Cloud Sync",
    badge: "Mobile & Tablet Terminal",
    role: "Desktop, iPad & Phone Concurrency",
    description:
      "Seamless real-time synchronization across web browsers, iPad tablets, and mobile devices. Zero session collisions or concurrent login overwrites.",
    fallbackMock: {
      accentColor: "#8B5CF6",
      metrics: [
        { label: "Web Desktop Login", value: "Active", trend: "HQ Office" },
        { label: "iPad Field Terminal", value: "Active", trend: "Sales Rep" },
        { label: "Mobile Web App", value: "Active", trend: "On-the-go" },
        { label: "Sync Latency", value: "< 120ms", trend: "Real-time" },
      ],
      tablePreview: [
        { col1: "Device Session: Desktop (Chrome)", col2: "Admin Terminal", col3: "Connected", status: "Secure" },
        { col1: "Device Session: iPad Pro (Safari)", col2: "Team Lead Matrix", col3: "Connected", status: "Secure" },
        { col1: "Device Session: iPhone 15 Pro", col2: "Agent Mobile Feed", col3: "Connected", status: "Secure" },
      ],
    },
  },
];

const responsive = {
  superLargeDesktop: {
    breakpoint: { max: 4000, min: 1440 },
    items: 2,
    partialVisibilityGutter: 30,
  },
  desktop: {
    breakpoint: { max: 1440, min: 1024 },
    items: 2,
    partialVisibilityGutter: 20,
  },
  tablet: {
    breakpoint: { max: 1024, min: 640 },
    items: 1,
    partialVisibilityGutter: 15,
  },
  mobile: {
    breakpoint: { max: 640, min: 0 },
    items: 1,
    partialVisibilityGutter: 0,
  },
};

export default function AppScreenshots() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <section id="screenshots" className="scroll-mt-24 py-16 md:py-24 px-4 sm:px-6 max-w-7xl mx-auto overflow-hidden">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-10 md:mb-14">
        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#1B7BED]/10 text-[#1B7BED] dark:bg-[#18DBF5]/10 dark:text-[#18DBF5] border border-[#1B7BED]/20 dark:border-[#18DBF5]/25 mb-3">
          <Icon icon="solar:gallery-wide-bold" className="w-4 h-4" />
          Interactive Product Gallery
        </span>
        <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-[#0A2540] dark:text-white tracking-tight">
          Explore the Real MyCrm User Interface
        </h2>
        <p className="text-[#476685] dark:text-slate-400 text-sm sm:text-base mt-3 leading-relaxed">
          Hover over any app screen to inspect details and pause the automated tour. Built specifically for clean visual lead assignment, 3-tier role governance, and high-velocity deal tracking.
        </p>
      </div>

      {/* Carousel Container with Hover Detection */}
      <div
        className="relative group pb-10"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Hover Pause Status Indicator */}
        <div className="flex items-center justify-end mb-3 pr-2">
          <span className={`inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-full transition-all duration-300 ${
            isHovered
              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-semibold"
              : "bg-[#DEEEFD] text-[#476685] dark:bg-slate-800 dark:text-slate-400 border border-[#C8E0F8] dark:border-slate-700"
          }`}>
            <span className={`w-2 h-2 rounded-full ${isHovered ? "bg-amber-500" : "bg-emerald-500 animate-pulse"}`} />
            {isHovered ? "Autoplay Paused (Inspecting)" : "Autoplay Active (Hover to pause & scale)"}
          </span>
        </div>

        <Carousel
          responsive={responsive}
          infinite={true}
          autoPlay={!isHovered}
          autoPlaySpeed={3500}
          keyBoardControl={true}
          showDots={true}
          pauseOnHover={true}
          arrows={true}
          draggable={true}
          swipeable={true}
          minimumTouchDrag={80}
          containerClass="carousel-container -mx-3"
          itemClass="px-3"
          renderDotsOutside={true}
          dotListClass="custom-carousel-dots flex items-center justify-center gap-2 mt-6"
        >
          {APP_SCREENSHOTS.map((item) => (
            <div
              key={item.id}
              className="group/card h-full flex flex-col transition-all duration-300 ease-out transform scale-100 hover:scale-[1.03] cursor-pointer"
            >
              {/* Outer Card Frame */}
              <div className="h-full bg-white dark:bg-slate-900/90 border border-[#C8E0F8] dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-md hover:shadow-2xl hover:shadow-[#1B7BED]/15 dark:hover:border-[#18DBF5]/50 transition-all duration-300 flex flex-col justify-between">
                
                {/* Header Information */}
                <div className="mb-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-[#1B7BED]/10 text-[#1B7BED] dark:bg-[#18DBF5]/10 dark:text-[#18DBF5] border border-[#1B7BED]/25 dark:border-[#18DBF5]/30">
                      {item.badge}
                    </span>
                    <span className="text-[11px] text-[#476685] dark:text-slate-400 font-medium">
                      {item.role}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-[#0A2540] dark:text-white group-hover/card:text-[#1B7BED] dark:group-hover/card:text-[#18DBF5] transition-colors leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#476685] dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
                    {item.description}
                  </p>
                </div>

                {/* Screenshot Display Window (Browser / Application Window Frame) */}
                <div className="relative rounded-2xl overflow-hidden border border-[#C8E0F8] dark:border-slate-800 bg-[#F3F8FE] dark:bg-slate-950 shadow-inner group-hover/card:border-[#1B7BED]/40 transition-colors">
                  
                  {/* Window Chrome Titlebar */}
                  <div className="h-8 px-3.5 bg-[#DEEEFD]/70 dark:bg-slate-900 border-b border-[#C8E0F8] dark:border-slate-800 flex items-center justify-between text-xs text-[#476685] dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-mono px-3 py-0.5 rounded-md bg-white/70 dark:bg-slate-950/70 border border-[#C8E0F8] dark:border-slate-800 text-[#0A2540] dark:text-slate-300">
                      <Icon icon="solar:shield-check-bold" className="w-3 h-3 text-[#1B7BED] dark:text-[#18DBF5]" />
                      <span>app.mycrm.io/{item.id}</span>
                    </div>
                    <Icon icon="solar:maximize-square-minimalistic-linear" className="w-3.5 h-3.5 opacity-60" />
                  </div>

                  {/* Screenshot Content Area */}
                  {item.imageSrc ? (
                    /* Actual Real Screenshot Image */
                    <div className="relative w-full aspect-16/10">
                      <Image
                        src={item.imageSrc}
                        alt={item.title}
                        fill
                        className="object-cover object-top transition-transform duration-500 group-hover/card:scale-105"
                      />
                    </div>
                  ) : (
                    /* Rich High-Fidelity UI Mock Screen (Ready for screenshot replacement) */
                    <div className="p-4 sm:p-5 aspect-16/10 flex flex-col justify-between text-left select-none">
                      
                      {/* Metric Badges Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                        {item.fallbackMock.metrics.map((m, mIdx) => (
                          <div
                            key={mIdx}
                            className="p-2 sm:p-2.5 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-[#C8E0F8] dark:border-slate-800 shadow-2xs"
                          >
                            <span className="text-[10px] text-[#476685] dark:text-slate-400 block truncate">
                              {m.label}
                            </span>
                            <span className="text-xs sm:text-sm font-bold text-[#0A2540] dark:text-white block mt-0.5 font-mono">
                              {m.value}
                            </span>
                            {m.trend && (
                              <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 block truncate">
                                {m.trend}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Mini Data Table Representation */}
                      <div className="flex-1 bg-white/90 dark:bg-slate-900/90 rounded-xl border border-[#C8E0F8] dark:border-slate-800 p-2.5 sm:p-3 overflow-hidden flex flex-col justify-between">
                        <div className="space-y-1.5">
                          <div className="grid grid-cols-4 text-[10px] font-bold uppercase tracking-wider text-[#476685] dark:text-slate-500 pb-1 border-b border-[#C8E0F8] dark:border-slate-800">
                            <span>Client / Lead</span>
                            <span>Contact</span>
                            <span>Value</span>
                            <span className="text-right">Action Stage</span>
                          </div>
                          {item.fallbackMock.tablePreview.map((row, rIdx) => (
                            <div
                              key={rIdx}
                              className="grid grid-cols-4 text-[11px] items-center text-[#0A2540] dark:text-slate-300 py-1 border-b border-[#C8E0F8]/50 dark:border-slate-800/40 last:border-none"
                            >
                              <span className="font-semibold truncate">{row.col1}</span>
                              <span className="text-[#476685] dark:text-slate-400 truncate">{row.col2}</span>
                              <span className="font-mono font-bold text-[#1B7BED] dark:text-[#18DBF5] truncate">{row.col3}</span>
                              <span className="text-right">
                                <span className="inline-block text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#DEEEFD] dark:bg-slate-800 text-[#1B7BED] dark:text-[#18DBF5] border border-[#C8E0F8] dark:border-slate-700">
                                  {row.status}
                                </span>
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Interactive Overlay Prompt */}
                        <div className="mt-2 pt-1.5 border-t border-[#C8E0F8] dark:border-slate-800/80 flex items-center justify-between text-[10px] text-[#476685] dark:text-slate-400">
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-ping" />
                            Live Tenant Sync Active
                          </span>
                          <span className="font-mono text-[10px] group-hover/card:text-[#1B7BED] dark:group-hover/card:text-[#18DBF5] transition-colors">
                            Hover to inspect →
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Quick Action */}
                <div className="mt-4 pt-3 border-t border-[#C8E0F8] dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-[#476685] dark:text-slate-400 flex items-center gap-1.5">
                    <Icon icon="solar:cursor-bold" className="w-3.5 h-3.5 text-[#1B7BED] dark:text-[#18DBF5]" />
                    Scale up on hover • Autoplay paused
                  </span>
                  <span className="font-bold text-[#1B7BED] dark:text-[#18DBF5] text-xs flex items-center gap-1 group-hover/card:translate-x-1 transition-transform">
                    <span>View Screen</span>
                    <Icon icon="solar:arrow-right-linear" className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </Carousel>
      </div>
    </section>
  );
}
