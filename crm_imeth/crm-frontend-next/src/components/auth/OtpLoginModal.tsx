"use client";

import { useState, useEffect, useRef } from "react";
import { apiClient } from "@/lib/api-client";
import type { User } from "@/types";
import {
  ShieldCheck,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  RefreshCw,
  X,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface OtpLoginModalProps {
  email: string;
  isFirstLogin: boolean;
  isOpen: boolean;
  onSuccess: (data: { token: string; user: User }) => void;
  onCancel: () => void;
}

export default function OtpLoginModal({
  email,
  isFirstLogin,
  isOpen,
  onSuccess,
  onCancel,
}: OtpLoginModalProps) {
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first digit box when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!isOpen) return null;

  const handleDigitChange = (index: number, value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, "");
    if (!cleanValue) {
      const nextDigits = [...otpDigits];
      nextDigits[index] = "";
      setOtpDigits(nextDigits);
      return;
    }

    // Handle single digit input
    const nextDigits = [...otpDigits];
    nextDigits[index] = cleanValue.slice(-1);
    setOtpDigits(nextDigits);

    // Auto focus next input
    if (index < 5 && cleanValue) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 6);
    if (pastedData) {
      const nextDigits = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        nextDigits[i] = pastedData[i] || "";
      }
      setOtpDigits(nextDigits);
      const nextFocusIndex = Math.min(pastedData.length, 5);
      inputRefs.current[nextFocusIndex]?.focus();
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await apiClient<{ message?: string }>("/auth/resend-otp", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      if (res.success) {
        setSuccessMsg(res.data?.message || "A fresh 6-digit OTP code has been sent!");
        setResendCooldown(60); // 60s rate-limit cooldown
        setTimeout(() => setSuccessMsg(""), 5000);
      } else {
        setError(res.error || "Failed to resend OTP code");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to resend OTP");
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    const fullOtp = otpDigits.join("");
    if (fullOtp.length !== 6) {
      setError("Please enter all 6 digits of your OTP code");
      return;
    }

    if (isFirstLogin) {
      if (!newPassword.trim() || newPassword.trim().length < 6) {
        setError("New password must be at least 6 characters long");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("New password and confirm password do not match");
        return;
      }
    }

    setLoading(true);

    try {
      const res = await apiClient<{ token: string; user: User }>("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({
          email,
          otpCode: fullOtp,
          newPassword: isFirstLogin ? newPassword.trim() : undefined,
        }),
      });

      if (res.success && res.data) {
        setSuccessMsg("Verification successful!");
        onSuccess(res.data);
      } else {
        setError(res.error || "Invalid verification code");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        
        {/* Modal Top Header Gradient */}
        <div className="bg-gradient-to-r from-[#075e54] via-[#0d7467] to-[#128c7e] p-6 text-white text-center relative">
          <button
            type="button"
            onClick={onCancel}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="w-12 h-12 mx-auto rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg mb-3">
            <ShieldCheck className="w-6 h-6 text-[#25d366]" />
          </div>

          <h3 className="text-xl font-bold tracking-tight">Two-Factor OTP Security</h3>
          <p className="text-xs text-white/80 mt-1 max-w-xs mx-auto">
            {isFirstLogin
              ? "First-time login verification & mandatory password reset required"
              : `Security code sent to ${email}`}
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-5">
          
          {/* Email Target Indicator */}
          <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200/70 flex items-center justify-between text-xs text-emerald-900 font-medium">
            <div className="flex items-center gap-2 truncate">
              <KeyRound className="w-4 h-4 text-[#128c7e] shrink-0" />
              <span className="truncate">Sent to: <strong>{email}</strong></span>
            </div>
            {isFirstLogin && (
              <span className="px-2 py-0.5 rounded-md bg-[#128c7e] text-white text-[10px] font-bold shrink-0">
                First Login
              </span>
            )}
          </div>

          {/* Error & Success Alerts */}
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3.5 text-xs text-red-700 font-medium flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-800 font-medium flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#25d366] shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 6-Digit OTP Boxes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 text-center">
              Enter 6-Digit Code
            </label>
            <div className="flex items-center justify-between gap-2">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => { inputRefs.current[idx] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  onPaste={handlePaste}
                  className={`w-11 sm:w-12 h-13 rounded-xl border text-center text-xl font-bold font-mono transition-all focus:outline-none ${
                    digit
                      ? "border-[#128c7e] bg-emerald-50/50 text-[#075e54] ring-2 ring-[#128c7e]/20"
                      : "border-slate-200 bg-slate-50 text-slate-900 focus:border-[#128c7e] focus:ring-2 focus:ring-[#128c7e]/20"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Mandatory Password Reset Fields for First Login */}
          {isFirstLogin && (
            <div className="pt-2 space-y-3.5 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#128c7e]" />
                  Set New Secret Password
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Min 6 characters</span>
              </div>

              {/* New Password */}
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="New personal password"
                  className="w-full h-11 px-3.5 pr-10 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#128c7e] focus:ring-2 focus:ring-[#128c7e]/20 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Confirm Password */}
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirm new password"
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#128c7e] focus:ring-2 focus:ring-[#128c7e]/20 focus:outline-none transition-all"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || otpDigits.join("").length !== 6}
            className="w-full h-12 rounded-xl bg-[#075e54] hover:bg-[#128c7e] text-white font-bold text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 group"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Verifying OTP...
              </span>
            ) : (
              <>
                {isFirstLogin ? "Verify & Update Password" : "Complete Authentication"}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>

          {/* Resend OTP Section */}
          <div className="text-center pt-1 flex items-center justify-between text-xs text-slate-500">
            <span>Didn&apos;t receive code?</span>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendCooldown > 0 || resending}
              className="inline-flex items-center gap-1 font-bold text-[#128c7e] hover:text-[#075e54] hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} />
              {resending
                ? "Sending..."
                : resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : "Resend Code"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
