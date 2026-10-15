"use client";

import React, { useState } from "react";
import { Icon } from "@iconify/react";

type PipelineStage = "New Lead" | "Contacted" | "Won";

interface Scenario {
  id: string;
  label: string;
  leadMessage: string;
  aiReply: string;
  targetStage: PipelineStage;
  dealValue: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: "quote",
    label: "Request Quote",
    leadMessage: "Hi! Saw your Meta ad. How much for a custom solar setup?",
    aiReply: "⚡ Instant Reply (0.4s): Hi Alex! Based on your roof size form, estimates start at $4,800. Want me to send the PDF breakdown?",
    targetStage: "Contacted",
    dealValue: "$4,800",
  },
  {
    id: "catalog",
    label: "Send Catalog",
    leadMessage: "Can you share your wholesale product catalog and MOQ?",
    aiReply: "⚡ Instant Reply (0.3s): Here is our 2026 Catalog PDF 📦. Minimum order is 25 units. Assigning senior rep Maya to your chat now!",
    targetStage: "Contacted",
    dealValue: "$3,200",
  },
  {
    id: "book",
    label: "Book Appointment",
    leadMessage: "Let's lock in the consultation call for tomorrow at 2 PM.",
    aiReply: "⚡ Instant Reply (0.5s): Confirmed! 📅 Calendar invite sent and deposit link verified. Moving your deal to Won!",
    targetStage: "Won",
    dealValue: "$6,500",
  },
];

export default function InteractiveDemo() {
  const [activeScenario, setActiveScenario] = useState<Scenario>(SCENARIOS[0]);
  const [mobileTab, setMobileTab] = useState<"chat" | "pipeline">("chat");

  const stages: PipelineStage[] = ["New Lead", "Contacted", "Won"];

  return (
    <section id="demo" className="scroll-mt-24 py-16 md:py-24 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-8 md:mb-12">
        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-3">
          <Icon icon="solar:bolt-circle-bold" className="w-4 h-4" />
          Interactive Live Sandbox
        </span>
        <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
          Tap a Trigger Below to Test 0-Second Lead Routing
        </h2>
        <p className="text-slate-400 text-sm sm:text-base mt-2">
          Click any customer action to watch BluePlanet CRM fire an automated WhatsApp response and update the Kanban board simultaneously.
        </p>
      </div>

      {/* Interactive Scenario Trigger Pills (Thumb-Friendly on Mobile) */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-6">
        {SCENARIOS.map((item) => {
          const isSelected = activeScenario.id === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveScenario(item)}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                isSelected
                  ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25 scale-[1.02]"
                  : "bg-slate-800/90 text-slate-300 hover:bg-slate-800 border border-slate-700"
              }`}
            >
              <Icon
                icon={isSelected ? "solar:check-circle-bold" : "solar:play-circle-linear"}
                className="w-4 h-4"
              />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Mobile-Only View Switcher (< 1024px) to Prevent Cramped Columns */}
      <div className="grid grid-cols-2 p-1 bg-slate-900 border border-slate-800 rounded-xl max-w-xs mx-auto mb-6 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileTab("chat")}
          className={`py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
            mobileTab === "chat" ? "bg-blue-600 text-white" : "text-slate-400"
          }`}
        >
          1. WhatsApp Chat
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("pipeline")}
          className={`py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileTab === "pipeline" ? "bg-blue-600 text-white" : "text-slate-400"
          }`}
        >
          2. Kanban Board
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </button>
      </div>

      {/* Main Demo Container */}
      <div className="demo-preview-card grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-8 shadow-2xl">
        
        {/* Left Column: WhatsApp Live Chat Simulator (5 cols on Desktop) */}
        <div
          className={`lg:col-span-5 flex flex-col justify-between bg-slate-950 border border-slate-800/80 rounded-2xl overflow-hidden ${
            mobileTab === "pipeline" ? "hidden lg:flex" : "flex"
          }`}
        >
          {/* Phone Header */}
          <div className="bg-emerald-950/60 border-b border-emerald-500/20 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-sm">
                AL
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-white">Alex (Meta Lead Ad)</p>
                <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Webhook Synced • Online
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono bg-slate-900 text-slate-300 px-2.5 py-1 rounded-md border border-slate-800">
              {activeScenario.dealValue}
            </span>
          </div>

          {/* Chat Messages Stream */}
          <div className="p-4 space-y-4 min-h-[240px] flex flex-col justify-center bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
            <div className="self-start max-w-[85%] bg-slate-800 text-slate-100 text-xs sm:text-sm p-3 rounded-2xl rounded-tl-sm border border-slate-700">
              {activeScenario.leadMessage}
              <span className="block text-[10px] text-slate-400 mt-1 text-right">10:42 AM</span>
            </div>

            <div className="self-end max-w-[88%] bg-emerald-600/20 border border-emerald-500/30 text-emerald-50 text-xs sm:text-sm p-3.5 rounded-2xl rounded-tr-sm shadow-md">
              {activeScenario.aiReply}
              <span className="block text-[10px] text-emerald-300 mt-1.5 text-right">
                10:42 AM ✓✓ Automated by BluePlanet
              </span>
            </div>
          </div>

          {/* Mobile Pipeline Sync Banner inside Phone Footer */}
          <div className="bg-slate-900/90 border-t border-slate-800 px-4 py-2.5 flex items-center justify-between">
            <span className="text-xs text-slate-300 flex items-center gap-1.5">
              <Icon icon="solar:routing-2-bold" className="text-blue-400 w-4 h-4" />
              Stage moved to <strong className="text-emerald-400">{activeScenario.targetStage}</strong>
            </span>
            <button
              type="button"
              onClick={() => setMobileTab("pipeline")}
              className="lg:hidden text-xs font-semibold text-blue-400 underline cursor-pointer"
            >
              View Board →
            </button>
          </div>
        </div>

        {/* Right Column: CRM Pipeline Kanban Preview (7 cols on Desktop) */}
        <div
          className={`lg:col-span-7 flex flex-col justify-between bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 ${
            mobileTab === "chat" ? "hidden lg:flex" : "flex"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">Live Multi-Agent Pipeline</h3>
              <p className="text-xs text-slate-400">Zero manual data entry — webhook updates stage automatically</p>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Auto-Synced
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
            {stages.map((stage) => {
              const isCurrentStage = activeScenario.targetStage === stage;
              return (
                <div
                  key={stage}
                  className={`rounded-xl p-3 border transition-all flex flex-col ${
                    isCurrentStage
                      ? "bg-slate-900 border-blue-500/50 shadow-lg shadow-blue-500/10"
                      : "bg-slate-900/40 border-slate-800/80 opacity-70"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-slate-200">{stage}</span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {isCurrentStage ? "1" : "0"}
                    </span>
                  </div>

                  {isCurrentStage ? (
                    <div className="bg-slate-800/90 border border-emerald-500/40 rounded-lg p-3 shadow-md transition-all">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                          Meta Lead Ad
                        </span>
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          {activeScenario.dealValue}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-white">Alex — Inbound Campaign</p>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                        Trigger: &ldquo;{activeScenario.label}&rdquo;
                      </p>
                    </div>
                  ) : (
                    <div className="flex-1 min-h-[84px] border border-dashed border-slate-800 rounded-lg flex items-center justify-center text-[11px] text-slate-600">
                      Empty Stage
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
