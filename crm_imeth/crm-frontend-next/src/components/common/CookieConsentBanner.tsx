"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Shield, Check, X, Settings2 } from "lucide-react";

export interface CookiePreferences {
  essential: boolean; // Always true
  analytics: boolean;
  thirdParty: boolean;
  decided: boolean;
}

const STORAGE_KEY = "gdpr_cookie_consent";

export function getStoredConsent(): CookiePreferences {
  if (typeof window === "undefined") {
    return { essential: true, analytics: false, thirdParty: false, decided: false };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return { essential: true, analytics: false, thirdParty: false, decided: false };
}

export function CookieConsentBanner() {
  const [isOpen, setIsOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [thirdParty, setThirdParty] = useState(false);

  useEffect(() => {
    const consent = getStoredConsent();
    if (!consent.decided) {
      setIsOpen(true);
    } else {
      setAnalytics(consent.analytics);
      setThirdParty(consent.thirdParty);
    }
  }, []);

  const savePreferences = (prefs: CookiePreferences) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
      window.dispatchEvent(new CustomEvent("consent_updated", { detail: prefs }));
    } catch (_) {}
    setIsOpen(false);
  };

  const handleAcceptAll = () => {
    savePreferences({
      essential: true,
      analytics: true,
      thirdParty: true,
      decided: true,
    });
  };

  const handleRejectNonEssential = () => {
    savePreferences({
      essential: true,
      analytics: false,
      thirdParty: false,
      decided: true,
    });
  };

  const handleSaveCustom = () => {
    savePreferences({
      essential: true,
      analytics,
      thirdParty,
      decided: true,
    });
  };

  if (!isOpen) return null;

  return (
    <div
      role="region"
      aria-label="Cookie and Privacy Consent"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-5 shadow-2xl border border-slate-200/90 text-slate-800 text-xs sm:text-sm">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0 mt-0.5">
            <Shield className="w-5 h-5" />
          </div>
          <div className="flex-1 space-y-2">
            <h3 className="font-semibold text-slate-900 text-sm">
              Your Privacy & Cookie Choices (GDPR & ePrivacy)
            </h3>
            <p className="text-slate-600 text-xs leading-relaxed">
              We respect your privacy. We use essential storage for authentication and session integrity. 
              Non-essential scripts (such as Google OAuth telemetry) load only after your consent. 
              Review our{" "}
              <Link href="/privacy" className="text-blue-600 underline font-medium hover:text-blue-700">
                Privacy Policy
              </Link>.
            </p>

            {showDetails && (
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between text-xs py-1">
                  <div>
                    <span className="font-semibold text-slate-800">Essential Sessions & Tokens</span>
                    <p className="text-[11px] text-slate-500">Required for login, routing, and CSRF protection.</p>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    Always Active
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs py-1">
                  <div>
                    <span className="font-semibold text-slate-800">Third-Party Scripts & OAuth</span>
                    <p className="text-[11px] text-slate-500">Google GSI client and external partner widgets.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={thirdParty}
                      onChange={(e) => setThirdParty(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between text-xs py-1">
                  <div>
                    <span className="font-semibold text-slate-800">Analytics & Telemetry</span>
                    <p className="text-[11px] text-slate-500">Aggregate performance monitoring.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={analytics}
                      onChange={(e) => setAnalytics(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            )}

            <div className="pt-2 flex flex-wrap items-center gap-2">
              {!showDetails ? (
                <>
                  <button
                    type="button"
                    onClick={handleAcceptAll}
                    className="flex-1 min-w-[100px] px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl transition-all shadow-xs text-center cursor-pointer"
                  >
                    Accept All
                  </button>
                  <button
                    type="button"
                    onClick={handleRejectNonEssential}
                    className="flex-1 min-w-[100px] px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-xl transition-all text-center cursor-pointer"
                  >
                    Essential Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDetails(true)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Customize Preferences"
                  >
                    <Settings2 className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleSaveCustom}
                    className="flex-1 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Save Preferences
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDetails(false)}
                    className="px-3 py-1.5 text-slate-600 hover:text-slate-900 font-medium text-xs cursor-pointer"
                  >
                    Back
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
