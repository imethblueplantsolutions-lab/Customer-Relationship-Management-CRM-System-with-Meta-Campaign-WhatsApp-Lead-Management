"use client";

import React, { useState, useEffect } from "react";
import { CreditCard, RefreshCw, CheckCircle2, AlertCircle, ShieldCheck, ArrowRight, Ban } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { SubscriptionUpgradeModal } from "@/components/billing/SubscriptionUpgradeModal";

interface BillingData {
  planName: string;
  price: number;
  billingInterval: string;
  status: string;
  autoRenews: boolean;
  renewsUntilCancelled: boolean;
  nextBillingDate: string | null;
  canCancelOnline: boolean;
  cancellationPolicy: string;
}

export default function BillingTab() {
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const fetchBilling = async () => {
    try {
      const res = await apiClient<BillingData>("/settings/billing");
      if (res.success && res.data) {
        setBilling(res.data);
      }
    } catch (err: unknown) {
      console.warn("Could not load billing status:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBilling();
  }, []);

  const handleCancelSubscription = async () => {
    if (!window.confirm("Are you sure you want to cancel your recurring subscription? You will not be charged again.")) {
      return;
    }

    setCancelling(true);
    try {
      const res = await apiClient<{ status: string }>("/settings/billing/cancel", {
        method: "POST",
      });

      if (res.success) {
        toast.success("Subscription cancelled successfully. No further charges will occur.");
        fetchBilling();
      } else {
        toast.error(res.error || "Failed to cancel subscription.");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error cancelling subscription.");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-sm text-slate-500">
        Loading subscription and billing details...
      </div>
    );
  }

  const isActive = billing?.status === "ACTIVE";

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">
                  {billing?.planName || "Free Tier"}
                </h3>
                <span
                  className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}
                >
                  {billing?.status || "FREE"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isActive
                  ? "Active paid subscription with automatic monthly renewal."
                  : "Basic free quota (1 Team Lead, 1 Sales Agent)."}
              </p>
            </div>
          </div>

          <div>
            {isActive ? (
              <span className="text-xl font-bold text-[#0F4C75]">
                ${billing?.price?.toFixed(2)}
                <span className="text-xs font-normal text-slate-500"> / {billing?.billingInterval}</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setShowUpgradeModal(true)}
                className="px-4 py-2 bg-[#0F4C75] hover:bg-[#1B262C] text-white text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <span>Upgrade to Pro ($29/mo)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* California ARL Automatic Renewal Notice */}
        {isActive && (
          <div className="pt-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 block text-[11px] font-medium">Billing Frequency:</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                  Renews automatically every {billing?.billingInterval}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px] font-medium">Next Scheduled Charge:</span>
                <span className="font-semibold text-slate-800 block mt-0.5">
                  {billing?.nextBillingDate
                    ? new Date(billing.nextBillingDate).toLocaleDateString()
                    : "End of billing cycle"}
                </span>
              </div>
            </div>

            {/* California ARL Online Cancellation Button */}
            <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900">
              <div>
                <strong className="block text-amber-950 font-semibold mb-0.5">
                  Online Cancellation (California ARL Compliance)
                </strong>
                <p className="text-[11px] text-amber-800">
                  You can cancel your automatic renewal immediately at any time online without speaking to a representative.
                </p>
              </div>

              <button
                type="button"
                disabled={cancelling}
                onClick={handleCancelSubscription}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-medium text-xs rounded-xl transition-all shrink-0 cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>{cancelling ? "Cancelling..." : "Cancel Subscription"}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <SubscriptionUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onSuccess={fetchBilling}
      />
    </div>
  );
}
