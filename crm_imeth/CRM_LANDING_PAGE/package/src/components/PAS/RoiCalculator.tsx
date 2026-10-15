"use client";

import React, { useState, useMemo } from "react";

export default function RoiCalculator() {
  const [monthlyLeads, setMonthlyLeads] = useState<number>(450);
  const [currentCloseRate, setCurrentCloseRate] = useState<number>(6);
  const [avgDealValue, setAvgDealValue] = useState<number>(650);

  const metrics = useMemo(() => {
    const currentRevenue = monthlyLeads * (currentCloseRate / 100) * avgDealValue;
    // Instant <60s WhatsApp response conservatively boosts contact-to-close velocity by 2.1x
    const boostedCloseRate = Math.min(currentCloseRate * 2.1, 45);
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
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-10 shadow-2xl">
        
        {/* Mobile-First Sticky Output Header: Pinned on small screens so dragging sliders shows instant feedback */}
        <div className="sticky top-16 z-20 lg:static bg-slate-950/95 backdrop-blur-md border border-emerald-500/30 rounded-2xl p-4 sm:p-6 mb-6 lg:mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Projected Recovered Pipeline
            </span>
            <p className="text-2xl sm:text-4xl font-extrabold text-white mt-0.5">
              +${metrics.monthlyLift.toLocaleString()}
              <span className="text-sm sm:text-base font-normal text-slate-400"> / month</span>
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs sm:text-sm text-slate-300 border-t sm:border-t-0 border-slate-800 pt-2 sm:pt-0 w-full sm:w-auto justify-between sm:justify-end">
            <div>
              <span className="block text-slate-500 text-[11px]">Current Revenue</span>
              <strong className="font-mono">${metrics.currentRevenue.toLocaleString()}/mo</strong>
            </div>
            <div className="text-emerald-400">
              <span className="block text-emerald-500/70 text-[11px]">With 60s WhatsApp Drip</span>
              <strong className="font-mono">${metrics.projectedRevenue.toLocaleString()}/mo</strong>
            </div>
          </div>
        </div>

        {/* 3 Ergonomic Touch Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl">
            <div className="flex justify-between items-center mb-3">
              <label htmlFor="leads-slider" className="text-xs sm:text-sm font-semibold text-slate-300">
                Monthly Inbound Leads
              </label>
              <span className="text-sm sm:text-base font-mono font-bold text-blue-400">
                {monthlyLeads} leads
              </span>
            </div>
            <input
              id="leads-slider"
              type="range"
              min={50}
              max={3000}
              step={50}
              value={monthlyLeads}
              onChange={(e) => setMonthlyLeads(Number(e.target.value))}
              className="roi-slider"
            />
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl">
            <div className="flex justify-between items-center mb-3">
              <label htmlFor="conversion-slider" className="text-xs sm:text-sm font-semibold text-slate-300">
                Current Close Rate
              </label>
              <span className="text-sm sm:text-base font-mono font-bold text-blue-400">
                {currentCloseRate}% ➔ <span className="text-emerald-400">{metrics.boostedCloseRate}%</span>
              </span>
            </div>
            <input
              id="conversion-slider"
              type="range"
              min={1}
              max={20}
              step={1}
              value={currentCloseRate}
              onChange={(e) => setCurrentCloseRate(Number(e.target.value))}
              className="roi-slider"
            />
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl">
            <div className="flex justify-between items-center mb-3">
              <label htmlFor="deal-slider" className="text-xs sm:text-sm font-semibold text-slate-300">
                Average Deal Value
              </label>
              <span className="text-sm sm:text-base font-mono font-bold text-blue-400">
                ${avgDealValue.toLocaleString()}
              </span>
            </div>
            <input
              id="deal-slider"
              type="range"
              min={100}
              max={5000}
              step={50}
              value={avgDealValue}
              onChange={(e) => setAvgDealValue(Number(e.target.value))}
              className="roi-slider"
            />
          </div>
        </div>

      </div>
    </section>
  );
}
