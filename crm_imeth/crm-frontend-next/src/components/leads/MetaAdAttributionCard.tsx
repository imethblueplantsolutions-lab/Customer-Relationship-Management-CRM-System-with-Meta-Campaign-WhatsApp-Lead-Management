"use client";

import React, { memo } from "react";
import { Megaphone, ExternalLink } from "lucide-react";
import type { Lead } from "@/types";

interface MetaAdAttributionCardProps {
  /** The lead object with full details and attribution */
  lead: Lead;
  /** Optional custom class name */
  className?: string;
}

/**
 * MetaAdAttributionCard
 *
 * Standalone component for displaying Meta ad campaign attribution
 * details (Headline, Copy/Body, Ad ID, Source, Landing Page URL)
 * or the Organic Lead status box.
 */
export default memo(function MetaAdAttributionCard({
  lead,
  className = "",
}: MetaAdAttributionCardProps) {
  return (
    <div className={`rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Megaphone className="h-4 w-4 text-emerald-600" />
        <h3 className="text-sm font-bold text-slate-800">
          Meta Ad Attribution
        </h3>
      </div>

      {lead.attribution ? (
        <div className="space-y-3.5 text-xs">
          {lead.attribution.headline && (
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-0.5">
                Ad Headline
              </span>
              <p className="font-semibold text-slate-800 bg-slate-50 rounded-lg p-2 border border-slate-100">
                {lead.attribution.headline}
              </p>
            </div>
          )}

          {lead.attribution.body && (
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-0.5">
                Ad Copy / Body
              </span>
              <p className="text-slate-600 leading-relaxed bg-slate-50 rounded-lg p-2 border border-slate-100">
                {lead.attribution.body}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-0.5">
                Ad ID
              </span>
              <p className="font-mono text-[11px] text-slate-700 truncate">
                {lead.attribution.adId || "—"}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-0.5">
                Source
              </span>
              <p className="capitalize text-slate-700">
                {lead.attribution.sourceType || "Ad Campaign"}
              </p>
            </div>
          </div>

          {lead.attribution.sourceUrl && (
            <a
              href={lead.attribution.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline font-semibold mt-1"
            >
              <span>View Landing Page / Ad</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center">
          <p className="text-xs font-medium text-slate-500">Organic Lead</p>
          <p className="text-[11px] text-slate-400 mt-1">
            This lead reached out directly without clicking a sponsored Meta Ad campaign.
          </p>
        </div>
      )}
    </div>
  );
});
