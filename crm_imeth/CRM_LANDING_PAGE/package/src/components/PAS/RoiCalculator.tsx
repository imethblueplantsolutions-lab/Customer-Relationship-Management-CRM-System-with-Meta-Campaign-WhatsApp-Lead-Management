"use client";

import React, { useState, useMemo } from "react";
import { Icon } from "@iconify/react";

export default function RoiCalculator() {
  const [monthlyLeads, setMonthlyLeads] = useState<number>(450);
  const [currentCloseRate, setCurrentCloseRate] = useState<number>(6);
  const [avgDealValue, setAvgDealValue] = useState<number>(650);

  const metrics = useMemo(() => {
    const currentRevenue = monthlyLeads * (currentCloseRate / 100) * avgDealValue;
    // Fast visual assignment & direct accountability conservatively lifts close rate by 1.8x to 2.2x
    const boostedCloseRate = Math.min(currentCloseRate * 1.9, 50);
    const projectedRevenue = monthlyLeads * (boostedCloseRate / 100) * avgDealValue;
    const monthlyLift = Math.round(projectedRevenue - currentRevenue);
    return {
      currentRevenue: Math.round(currentRevenue),
      projectedRevenue: Math.round(projectedRevenue),
      monthlyLift,
      boostedCloseRate: boostedCloseRate.toFixed(1),
    };
  }, [monthlyLeads, currentCloseRate, avgDealValue]);

  return (
    <section id="roi-calculator" className="scroll-mt-24 py-16 md:py-24 px-4 sm:px-6 max-w-6xl mx-auto">
      <div className="bg-[#DEEEFD]/60 dark:bg-slate-900 border border-[#C8E0F8] dark:border-slate-800 rounded-3xl p-5 sm:p-10 shadow-xl backdrop-blur-sm">
        
        {/* Output Header */}
        <div className="sticky top-16 z-20 lg:static bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border border-[#1B7BED]/30 dark:border-[#18DBF5]/30 rounded-2xl p-4 sm:p-6 mb-6 lg:mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#1B7BED] dark:text-[#18DBF5] flex items-center gap-1.5">
              <Icon icon="solar:chart-2-bold" className="w-4 h-4" />
              Projected Revenue Lift from Zero Dropped Leads
            </span>
            <p className="text-2xl sm:text-4xl font-extrabold text-[#0A2540] dark:text-white mt-0.5">
              +${metrics.monthlyLift.toLocaleString()}
              <span className="text-sm sm:text-base font-normal text-[#476685] dark:text-slate-400"> / month</span>
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs sm:text-sm text-[#476685] dark:text-slate-300 border-t sm:border-t-0 border-[#C8E0F8] dark:border-slate-800 pt-2 sm:pt-0 w-full sm:w-auto justify-between sm:justify-end">
            <div>
              <span className="block text-[#476685] dark:text-slate-500 text-[11px]">Current Baseline</span>
              <strong className="font-mono text-[#0A2540] dark:text-white">${metrics.currentRevenue.toLocaleString()}/mo</strong>
            </div>
            <div className="text-[#1B7BED] dark:text-[#18DBF5]">
              <span className="block text-[#1B7BED]/80 dark:text-[#18DBF5]/80 text-[11px]">With MyCrm Visual Speed</span>
              <strong className="font-mono">${metrics.projectedRevenue.toLocaleString()}/mo</strong>
            </div>
          </div>
        </div>

        {/* 3 Ergonomic Touch Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <div className="bg-white/70 dark:bg-slate-950/60 border border-[#C8E0F8] dark:border-slate-800/80 p-4.5 rounded-2xl">
            <div className="flex justify-between items-center mb-3">
              <label htmlFor="leads-slider" className="text-xs sm:text-sm font-semibold text-[#0A2540] dark:text-slate-300">
                Monthly Inbound Leads
              </label>
              <span className="text-sm sm:text-base font-mono font-bold text-[#1B7BED] dark:text-[#18DBF5]">
                {monthlyLeads} leads
              </span>
            </div>
            <input
              id="leads-slider"
              type="range"
              min="50"
              max="5000"
              step="50"
              value={monthlyLeads}
              onChange={(e) => setMonthlyLeads(Number(e.target.value))}
              className="roi-slider"
              aria-label="Monthly Inbound Leads"
            />
            <span className="text-[11px] text-[#476685] dark:text-slate-500 mt-2 block">
              Inquiries captured across all business channels
            </span>
          </div>

          <div className="bg-white/70 dark:bg-slate-950/60 border border-[#C8E0F8] dark:border-slate-800/80 p-4.5 rounded-2xl">
            <div className="flex justify-between items-center mb-3">
              <label htmlFor="close-rate-slider" className="text-xs sm:text-sm font-semibold text-[#0A2540] dark:text-slate-300">
                Current Close Rate
              </label>
              <span className="text-sm sm:text-base font-mono font-bold text-[#1B7BED] dark:text-[#18DBF5]">
                {currentCloseRate}%
              </span>
            </div>
            <input
              id="close-rate-slider"
              type="range"
              min="1"
              max="25"
              step="1"
              value={currentCloseRate}
              onChange={(e) => setCurrentCloseRate(Number(e.target.value))}
              className="roi-slider"
              aria-label="Current Close Rate"
            />
            <span className="text-[11px] text-[#476685] dark:text-slate-500 mt-2 block">
              Projected to reach <strong className="text-[#1B7BED] dark:text-[#18DBF5] font-mono">{metrics.boostedCloseRate}%</strong> with instant assignment
            </span>
          </div>

          <div className="bg-white/70 dark:bg-slate-950/60 border border-[#C8E0F8] dark:border-slate-800/80 p-4.5 rounded-2xl">
            <div className="flex justify-between items-center mb-3">
              <label htmlFor="deal-value-slider" className="text-xs sm:text-sm font-semibold text-[#0A2540] dark:text-slate-300">
                Average Deal Value ($)
              </label>
              <span className="text-sm sm:text-base font-mono font-bold text-[#1B7BED] dark:text-[#18DBF5]">
                ${avgDealValue}
              </span>
            </div>
            <input
              id="deal-value-slider"
              type="range"
              min="100"
              max="10000"
              step="50"
              value={avgDealValue}
              onChange={(e) => setAvgDealValue(Number(e.target.value))}
              className="roi-slider"
              aria-label="Average Deal Value"
            />
            <span className="text-[11px] text-[#476685] dark:text-slate-500 mt-2 block">
              Average closed revenue per successful client contract
            </span>
          </div>
        </div>

        <p className="text-xs text-center text-[#476685] dark:text-slate-400 mt-6">
          *Estimates modeled on reducing lead handoff latency from hours to minutes, preventing dropped leads, and real-time agent accountability.
        </p>
      </div>
    </section>
  );
}
