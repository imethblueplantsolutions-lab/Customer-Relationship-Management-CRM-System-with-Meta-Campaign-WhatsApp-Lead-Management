"use client";

import React, { useState } from "react";
import { X, CheckCircle2, ShieldCheck, ArrowRight, RefreshCw, AlertCircle } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

interface SubscriptionUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function SubscriptionUpgradeModal({
  isOpen,
  onClose,
  onSuccess,
}: SubscriptionUpgradeModalProps) {
  const [affirmativeConsent, setAffirmativeConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const planName = "Enterprise Pro Plan";
  const price = 29.00;
  const billingInterval = "monthly";

  const handleUpgrade = async () => {
    if (!affirmativeConsent) {
      setError("Please confirm your affirmative consent to the recurring renewal terms to proceed.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await apiClient<{ status: string; nextBillingDate: string }>(
        "/settings/billing/upgrade",
        {
          method: "POST",
          body: JSON.stringify({
            planName,
            price,
            affirmativeConsent: true,
          }),
        }
      );

      if (res.success) {
        toast.success("Successfully upgraded! Confirmation email sent with renewal details.");
        onSuccess?.();
        onClose();
      } else {
        setError(res.error || "Failed to process upgrade. Please try again.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to process upgrade.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-headline"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-[#0F4C75] to-[#3282B8] text-white flex items-start justify-between">
          <div>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/20 text-white mb-2">
              Enterprise Upgrade
            </span>
            <h2 id="modal-headline" className="text-xl font-bold">
              Upgrade to {planName}
            </h2>
            <p className="text-xs text-white/80 mt-1">
              Unlock unlimited sales agents, campaign broadcasts, and priority queues.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Plan Details & California ARL Required Disclosures */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Pricing Box */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4">
            <div className="flex items-baseline justify-between mb-2">
              <span className="font-semibold text-sm text-slate-900">Subscription Price:</span>
              <div className="text-right">
                <span className="text-2xl font-extrabold text-[#0F4C75]">${price.toFixed(2)}</span>
                <span className="text-xs text-slate-500"> / month</span>
              </div>
            </div>
            <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-200">
              <div className="flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="font-semibold text-slate-800">Renews automatically every month until cancelled</span>
              </div>
              <p className="text-[11px] text-slate-500 pl-5">
                First recurring charge today (${price.toFixed(2)}). Renews monthly on the same calendar day.
              </p>
            </div>
          </div>

          {/* Statutory Cancellation Disclosure (California ARL) */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 text-xs text-amber-900 leading-relaxed space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              Online Cancellation Policy (California ARL Compliance)
            </p>
            <p>
              You may cancel your subscription at any time online without fees or speaking to an agent. 
              Simply go to <strong>Settings &gt; Billing &gt; Cancel Subscription</strong>. 
              Upon subscription, an acknowledgment email detailing these renewal terms will be sent to your account email.
            </p>
          </div>

          {/* Affirmative Consent Checkbox (Directly above Pay button) */}
          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-blue-200 bg-blue-50/40 text-xs text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={affirmativeConsent}
              onChange={(e) => setAffirmativeConsent(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer shrink-0"
            />
            <span className="leading-snug">
              <strong>I agree to the automatic renewal terms above.</strong> I authorize recurring monthly charges of ${price.toFixed(2)} to my payment method until I cancel. I understand I can cancel online at any time in Settings.
            </span>
          </label>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={loading || !affirmativeConsent}
              onClick={handleUpgrade}
              className="flex-1 h-11 bg-[#0F4C75] hover:bg-[#1B262C] disabled:opacity-50 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              {loading ? (
                "Processing..."
              ) : (
                <>
                  <span>Confirm &amp; Subscribe</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
