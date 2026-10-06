"use client";

import { useEffect, useRef, useState } from "react";
import { ShieldAlert, ShieldX, KeyRound, AlertTriangle, ArrowRight, Lock, Clock } from "lucide-react";

interface CredentialErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title?: string;
  message?: string;
  remainingAttempts?: number | null;
  lockoutUntil?: string | null;
  isLocked?: boolean;
  onResetPassword?: () => void;
}

export default function CredentialErrorModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Authentication Failed",
  message = "The email and password you entered did not match our records. Please double-check and try again.",
  remainingAttempts,
  lockoutUntil,
  isLocked = false,
  onResetPassword,
}: CredentialErrorModalProps) {
  const okButtonRef = useRef<HTMLButtonElement>(null);
  const openTimestampRef = useRef<number>(0);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

  // Calculate live countdown timer if locked out
  useEffect(() => {
    if (!isOpen || !lockoutUntil) return;

    const calculateRemaining = () => {
      const diff = Math.ceil((new Date(lockoutUntil).getTime() - Date.now()) / 1000);
      return Math.max(0, diff);
    };

    setSecondsRemaining(calculateRemaining());

    const interval = setInterval(() => {
      const rem = calculateRemaining();
      setSecondsRemaining(rem);
      if (rem <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, lockoutUntil]);

  useEffect(() => {
    if (!isOpen) return;

    openTimestampRef.current = Date.now();

    // Delay focusing button to prevent form Enter key bleed-through
    const timer = setTimeout(() => {
      okButtonRef.current?.focus();
    }, 350);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (Date.now() - openTimestampRef.current < 350) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (isLocked && onResetPassword) {
          onResetPassword();
        } else if (onConfirm) {
          onConfirm();
        } else {
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, onConfirm, isLocked, onResetPassword]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (Date.now() - openTimestampRef.current < 250) return;
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  const handleResetPassword = () => {
    if (Date.now() - openTimestampRef.current < 250) return;
    onClose();
    if (onResetPassword) {
      onResetPassword();
    }
  };

  const formatCountdown = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${String(remainingSecs).padStart(2, "0")}`;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="credential-error-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div
        className={`relative w-full max-w-sm sm:max-w-md rounded-2xl sm:rounded-3xl bg-white shadow-2xl border overflow-hidden text-center transition-all animate-in zoom-in-95 duration-200 ${
          isLocked
            ? "border-red-200 ring-2 ring-red-500/20"
            : remainingAttempts !== undefined && remainingAttempts !== null && remainingAttempts <= 2
            ? "border-amber-200 ring-2 ring-amber-500/20"
            : "border-slate-100"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Visual Banner */}
        <div
          className={`p-6 text-white text-center relative ${
            isLocked
              ? "bg-gradient-to-r from-red-800 via-rose-700 to-red-600"
              : remainingAttempts !== undefined && remainingAttempts !== null && remainingAttempts <= 2
              ? "bg-gradient-to-r from-amber-700 via-amber-600 to-orange-500"
              : "bg-gradient-to-r from-[#1B262C] via-[#0F4C75] to-[#3282B8]"
          }`}
        >
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg mb-3">
            {isLocked ? (
              <ShieldAlert className="w-7 h-7 text-white animate-bounce" />
            ) : remainingAttempts !== undefined && remainingAttempts !== null && remainingAttempts <= 2 ? (
              <AlertTriangle className="w-7 h-7 text-white animate-pulse" />
            ) : (
              <ShieldX className="w-7 h-7 text-white" />
            )}
          </div>

          <h3 id="credential-error-title" className="text-xl font-extrabold tracking-tight text-white">
            {isLocked ? "Account Temporarily Locked" : title}
          </h3>
          <p className="text-xs text-white/85 mt-1 max-w-xs mx-auto">
            {isLocked
              ? "Security protection engaged due to consecutive failed sign-in attempts."
              : "Please verify your login credentials and try again."}
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 space-y-4">
          
          {/* Main Error Message */}
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
            {message}
          </p>

          {/* Locked Out Live Countdown Alert */}
          {isLocked && secondsRemaining > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-red-700 text-xs font-bold uppercase tracking-wider mb-1">
                <Clock className="w-4 h-4 text-red-600" />
                <span>Lockout Time Remaining</span>
              </div>
              <div className="font-mono text-2xl font-black text-red-900 tracking-tight">
                {formatCountdown(secondsRemaining)}
              </div>
              <p className="text-[11px] text-red-600/90 mt-1">
                You can reset your password immediately below to bypass this waiting period.
              </p>
            </div>
          )}

          {/* Remaining Attempts Warning Badge */}
          {!isLocked && remainingAttempts !== undefined && remainingAttempts !== null && remainingAttempts <= 2 && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3.5 flex items-center justify-center gap-2 text-xs font-bold text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                {remainingAttempts === 1
                  ? "Only 1 attempt remaining before 15-minute account lock"
                  : `Only ${remainingAttempts} attempts remaining before 15-minute account lock`}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 space-y-2.5">
            {isLocked ? (
              <>
                {onResetPassword && (
                  <button
                    ref={okButtonRef}
                    type="button"
                    onClick={handleResetPassword}
                    className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 group"
                  >
                    <KeyRound className="w-4 h-4 text-white" />
                    <span>Reset Password Now</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
              </>
            ) : (
              <>
                <button
                  ref={okButtonRef}
                  type="button"
                  onClick={handleConfirm}
                  className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Try Again</span>
                </button>

                {onResetPassword && (
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline pt-1 transition-colors cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5 text-blue-500" />
                    <span>Forgot password? Reset it now</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
