"use client";

import { Clock, ShieldAlert, LogOut, RefreshCw, Sparkles } from "lucide-react";

interface SessionTimeoutModalProps {
  isOpen: boolean;
  countdownSeconds: number;
  isExtending: boolean;
  onExtend: () => void;
  onLogout: () => void;
}

export default function SessionTimeoutModal({
  isOpen,
  countdownSeconds,
  isExtending,
  onExtend,
  onLogout,
}: SessionTimeoutModalProps) {
  if (!isOpen) return null;

  const minutes = Math.floor(countdownSeconds / 60);
  const seconds = countdownSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const isUrgent = countdownSeconds <= 30;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-timeout-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header Banner */}
        <div className={`p-6 text-white text-center relative transition-colors ${
          isUrgent
            ? "bg-gradient-to-r from-red-700 via-rose-600 to-amber-600"
            : "bg-gradient-to-r from-[#1B262C] via-[#0F4C75] to-[#3282B8]"
        }`}>
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg mb-3">
            <ShieldAlert className={`w-7 h-7 text-white ${isUrgent ? "animate-bounce" : "animate-pulse"}`} />
          </div>

          <h3 id="session-timeout-title" className="text-xl font-extrabold tracking-tight text-white">
            Session Expiring Soon
          </h3>
          <p className="text-xs text-white/80 mt-1 max-w-xs mx-auto">
            You have been inactive for an extended period. For security, your session will automatically terminate.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 space-y-6 text-center">
          
          {/* Countdown Clock Display */}
          <div className="flex flex-col items-center justify-center">
            <div className={`relative flex items-center justify-center w-28 h-28 rounded-full border-4 ${
              isUrgent
                ? "border-red-500 bg-red-50 text-red-600 animate-pulse"
                : "border-blue-500 bg-sky-50 text-brand-primary"
            }`}>
              <div className="flex flex-col items-center">
                <Clock className="w-4 h-4 mb-1 opacity-70" />
                <span className="font-mono text-3xl font-black tracking-tight">{formattedTime}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-75 mt-0.5">Remaining</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 mt-3 font-medium">
              Would you like to extend your active session?
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={onExtend}
              disabled={isExtending}
              className="w-full sm:flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isExtending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Refreshing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Stay Logged In</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onLogout}
              disabled={isExtending}
              className="w-full sm:w-auto h-12 px-5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <LogOut className="w-4 h-4 text-slate-500" />
              <span>Log Out Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
