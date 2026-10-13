"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { MailCheck, MailX, AlertCircle, ArrowLeft, CheckCircle2 } from "lucide-react";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";
  const initialToken = searchParams.get("token") || "";

  const [email, setEmail] = useState(initialEmail);
  const [token, setToken] = useState(initialToken);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Auto-trigger unsubscribe if email is provided in URL query parameters
  useEffect(() => {
    if (initialEmail) {
      handleUnsubscribe(initialEmail, initialToken);
    }
  }, [initialEmail, initialToken]);

  const handleUnsubscribe = async (targetEmail: string, targetToken?: string) => {
    if (!targetEmail) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/auth/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: targetEmail.trim().toLowerCase(),
          token: targetToken || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message || "You have successfully unsubscribed from marketing communications.");
      } else {
        setErrorMsg(data.error || "Unable to process unsubscribe request. Please verify the email address.");
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Network error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleUnsubscribe(email, token);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-slate-200/90 p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
            <MailX className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Email Preferences &amp; Opt-Out</h1>
            <p className="text-xs text-slate-500">CAN-SPAM Act Marketing Suppression</p>
          </div>
        </div>

        {successMsg ? (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-900 text-sm flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Unsubscribe Confirmed</p>
                <p className="text-xs text-emerald-800 mt-1">{successMsg}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Your opt-out has been recorded. You will not receive promotional or marketing emails from us. 
              Transactional emails (such as security OTPs or billing receipts) may still be sent if you maintain an active account.
            </p>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-semibold"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Return to MyCRM
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Enter your email address below to opt out of marketing messages, newsletters, and promotional announcements.
            </p>

            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@company.com"
                className="w-full h-10 px-3.5 rounded-xl border border-slate-300 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-medium text-xs sm:text-sm rounded-xl transition-all cursor-pointer shadow-xs"
            >
              {loading ? "Processing Opt-Out..." : "Unsubscribe from Marketing"}
            </button>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <Link href="/privacy" className="hover:underline">
                Privacy Policy
              </Link>
              <Link href="/login" className="hover:underline">
                Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">Loading...</div>}>
      <UnsubscribeContent />
    </Suspense>
  );
}
