"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/api-client";
import OtpLoginModal from "@/components/auth/OtpLoginModal";
import CredentialErrorModal from "@/components/auth/CredentialErrorModal";
import type { User } from "@/types";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Sparkles,
  MessageSquare,
  ArrowRight,
  Database,
  CheckCircle2,
  Layers,
  ChevronDown,
  User as UserIcon,
  Building2,
  KeyRound,
  ShieldCheck,
  X,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement | null,
            options: {
              theme?: string;
              size?: string;
              width?: number | string;
              text?: string;
              shape?: string;
            }
          ) => void;
          prompt: (momentListener?: (notification: unknown) => void) => void;
        };
      };
    };
  }
}

export default function LoginPage() {
  // Mode toggle state
  const [isSignUpActive, setIsSignUpActive] = useState(false);

  // Sign In Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Credential Error Modal state & Input Error state
  const [showCredentialModal, setShowCredentialModal] = useState(false);
  const [hasAuthError, setHasAuthError] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const handleDismissCredentialModal = (focusField = true) => {
    setShowCredentialModal(false);
    if (focusField) {
      setTimeout(() => {
        passwordInputRef.current?.focus();
        passwordInputRef.current?.select();
      }, 50);
    }
  };

  // Sign Up Form state
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpCompanyName, setSignUpCompanyName] = useState("");
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [signUpError, setSignUpError] = useState("");
  const [signUpSuccess, setSignUpSuccess] = useState("");
  const [signUpLoading, setSignUpLoading] = useState(false);

  // General State
  const [seeding, setSeeding] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  // OTP Modal state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [otpPreview, setOtpPreview] = useState<string | undefined>(undefined);

  // Forgot Password Modal State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetStep, setResetStep] = useState<"EMAIL" | "OTP" | "SUCCESS">("EMAIL");
  const [resetEmail, setResetEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewResetPassword, setShowNewResetPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetCooldown, setResetCooldown] = useState(0);

  // Resend cooldown timer for password recovery
  useEffect(() => {
    if (resetCooldown <= 0) return;
    const timer = setInterval(() => {
      setResetCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resetCooldown]);

  const { login, setSession } = useAuth();
  const router = useRouter();

  const slides = [
    {
      title: "Lead Management with Role-Based System",
      description:
        "Comprehensive lead tracking with multi-tier role-based hierarchy, scheduled follow-ups, smart reminders, and pipeline supervision.",
      tag: "Lead Management",
    },
    {
      title: "Real-time Omnichannel WhatsApp Inbox (Coming Soon)",
      description:
        "Manage two-way customer conversations with live socket synchronization and instant webhook responses.",
      tag: "Live Inbox",
    },
    {
      title: "Enterprise Multi-Tenant & Node Flow Engine (Coming Soon)",
      description:
        "Drag-and-drop visual workflow builders, conditional branching, and role-based permissions for teams.",
      tag: "Flow Engine",
    },
  ];

  // Auto-advance slides every 6 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [slides.length]);

  // Sign In Form Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setHasAuthError(false);
    setLoading(true);
    try {
      const res = await login(email, password);
      if (res?.requireOtp) {
        setIsFirstLogin(!!res.isFirstLogin);
        setOtpPreview(res.otpPreview);
        setShowOtpModal(true);
        setSuccessMsg(res.message || "OTP code dispatched to your email. Please verify to proceed.");
      } else {
        const storedUser = localStorage.getItem("user");
        const parsed = storedUser ? JSON.parse(storedUser) : null;
        router.push(parsed?.role === "SUPER_ADMIN" ? "/hierarchy" : "/dashboard");
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Authentication failed. Please check credentials or backend server.";
      setError(msg);
      setHasAuthError(true);
      setShowCredentialModal(true);
    } finally {
      setLoading(false);
    }
  };

  // Sign Up Form Handler
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpError("");
    setSignUpSuccess("");
    setSignUpLoading(true);
    const cleanedEmail = signUpEmail.trim().toLowerCase().replace(/\.+@/, '@');
    try {
      const res = await apiClient<{ token: string; user: User }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: signUpName.trim(),
          email: cleanedEmail,
          password: signUpPassword,
          companyName: signUpCompanyName.trim() || undefined,
        }),
      });

      if (res.success && res.data) {
        toast.success("Account & Organization created successfully!");
        setSession(res.data.token, res.data.user);
        router.push(res.data.user.role === "SUPER_ADMIN" ? "/hierarchy" : "/dashboard");
      } else {
        setSignUpError(res.error || "Registration failed. Please try again.");
      }
    } catch (err: unknown) {
      setSignUpError(
        err instanceof Error ? err.message : "Registration failed. Please try again."
      );
    } finally {
      setSignUpLoading(false);
    }
  };

  const handleOtpSuccess = (data: { token: string; user: User }) => {
    setShowOtpModal(false);
    setSession(data.token, data.user);
    router.push(data.user?.role === "SUPER_ADMIN" ? "/hierarchy" : "/dashboard");
  };

  const handleSeedDatabase = async () => {
    setSeeding(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await apiClient<{ message?: string }>("/auth/seed", {
        method: "POST",
      });
      setSuccessMsg(
        res.message || "Admin account & demo organization created successfully!"
      );
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Database seeding failed. Ensure backend & Postgres are running."
      );
    } finally {
      setSeeding(false);
    }
  };

  const [googleInitialized, setGoogleInitialized] = useState(false);

  const handleGoogleResponse = async (response: { credential?: string }) => {
    if (!response?.credential) {
      setError("No authentication credential received from Google.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await apiClient<{ token: string; user: User }>("/auth/google", {
        method: "POST",
        body: JSON.stringify({ credential: response.credential }),
      });

      const token = res.data?.token;
      const user = res.data?.user;

      if (!token || !user) {
        throw new Error(
          res.error || res.message || "Google authentication failed. Please contact your administrator."
        );
      }

      setSession(token, user);
      router.push(user.role === "SUPER_ADMIN" ? "/hierarchy" : "/dashboard");
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Google login failed. Please ensure your enterprise email is registered."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const scriptId = "google-jssdk";
    const initGsi = () => {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleResponse,
        auto_select: false,
      });

      const btnMount = document.getElementById("google-signin-btn");
      if (btnMount) {
        window.google.accounts.id.renderButton(btnMount, {
          theme: "outline",
          size: "large",
          width: 380,
          text: "signin_with",
          shape: "pill",
        });
      }
      setGoogleInitialized(true);
    };

    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initGsi;
      document.body.appendChild(script);
    } else {
      initGsi();
    }
  }, []);

  const handleGoogleSignIn = () => {
    setError("");
    setSuccessMsg("");
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (clientId && window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification: unknown) => {
        const notif = notification as { isNotDisplayed?: () => boolean; isSkippedMoment?: () => boolean };
        if (notif?.isNotDisplayed?.() || notif?.isSkippedMoment?.()) {
          const btn = document.querySelector("#google-signin-btn div[role=button]") as HTMLElement;
          if (btn) btn.click();
        }
      });
      return;
    }

    setSuccessMsg(
      "Google Sign-In button is live on your UI! Live OAuth authentication will activate when your Google Cloud Client ID is added."
    );
  };

  // Forgot Password Flow Handlers
  const handleOpenResetModal = () => {
    setIsResetModalOpen(true);
    setResetStep("EMAIL");
    setResetEmail(email.trim() || "");
    setResetOtp("");
    setNewPassword("");
    setResetError("");
  };

  const handleCloseResetModal = () => {
    setIsResetModalOpen(false);
    setResetStep("EMAIL");
    setResetOtp("");
    setNewPassword("");
    setResetError("");
    setResetLoading(false);
  };

  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setResetError("Please enter your account email address");
      return;
    }
    setResetLoading(true);
    setResetError("");

    try {
      await apiClient<{ message?: string }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: resetEmail.trim() }),
      });
      toast.success("Reset code sent! Check your inbox.");
      setResetStep("OTP");
      setResetCooldown(60);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send reset code";
      setResetError(msg);
      toast.error(msg);
    } finally {
      setResetLoading(false);
    }
  };

  const handleResendResetOtp = async () => {
    if (resetCooldown > 0 || resetLoading) return;
    setResetLoading(true);
    setResetError("");

    try {
      await apiClient<{ message?: string }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: resetEmail.trim() }),
      });
      toast.success("A fresh 6-digit verification code has been dispatched.");
      setResetCooldown(60);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to resend code";
      setResetError(msg);
      toast.error(msg);
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetOtp.trim() || resetOtp.trim().length !== 6) {
      setResetError("Please enter the complete 6-digit OTP code");
      return;
    }
    if (!newPassword.trim() || newPassword.trim().length < 6) {
      setResetError("New password must be at least 6 characters long");
      return;
    }

    setResetLoading(true);
    setResetError("");

    try {
      await apiClient<{ message?: string }>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          email: resetEmail.trim(),
          otp: resetOtp.trim(),
          newPassword: newPassword.trim(),
        }),
      });
      toast.success("Password updated successfully!");
      setResetStep("SUCCESS");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid or expired OTP";
      setResetError(msg);
      toast.error(msg);
    } finally {
      setResetLoading(false);
    }
  };

  const handleFinishReset = () => {
    setEmail(resetEmail);
    setPassword("");
    handleCloseResetModal();
  };

  return (
    <div className="relative min-h-screen w-full bg-[#f4f9fd] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans overflow-x-hidden">
      {/* Decorative Ambient Background Glows */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#BBE1FA]/50 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />

      {/* Subtle Floating Shapes */}
      <div className="absolute top-12 left-1/4 w-10 h-10 bg-white/70 backdrop-blur-md rounded-2xl rotate-12 shadow-xs pointer-events-none" />
      <div className="absolute bottom-16 left-12 w-8 h-8 bg-[#BBE1FA]/40 backdrop-blur-md rounded-xl -rotate-12 shadow-xs pointer-events-none" />
      <div className="absolute top-20 right-16 w-12 h-12 bg-white/80 backdrop-blur-md rounded-2xl rotate-45 shadow-xs pointer-events-none" />
      <div className="absolute bottom-24 right-1/4 w-9 h-9 bg-blue-600/20 backdrop-blur-md rounded-xl rotate-6 shadow-xs pointer-events-none" />

      {/* Main Sliding Dual-Auth Container (Natural Auto-Height) */}
      <div className="relative z-10 w-full max-w-4xl bg-white rounded-2xl shadow-[0_20px_60px_rgba(27,38,44,0.12)] border border-slate-100 overflow-hidden">

        {/* Mobile Sliding Track / Desktop Dual Grid */}
        <div
          className={`flex w-[200%] md:w-full transition-transform duration-500 ease-in-out items-stretch ${
            isSignUpActive ? "-translate-x-1/2 md:translate-x-0" : "translate-x-0"
          }`}
        >
          {/* ================= 1. SIGN IN FORM PANEL (Left 50% Desktop) ================= */}
          <div
            className={`w-1/2 md:w-1/2 p-6 flex flex-col justify-between gap-4 bg-white transition-opacity duration-700 ease-in-out ${
              isSignUpActive
                ? "md:opacity-0 md:z-10 md:pointer-events-none"
                : "md:opacity-100 md:z-20 md:pointer-events-auto"
            }`}
          >
          {/* Top Bar */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0F4C75] to-[#3282B8] flex items-center justify-center shadow-md shadow-[#3282B8]/20 shrink-0">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <div className="flex items-baseline gap-0.5">
                <span className="text-lg font-bold text-blue-600 tracking-tight">MyCRM</span>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="w-full max-w-[360px] mx-auto flex flex-col gap-2.5">
            <div className="w-full flex flex-col items-center justify-center text-center">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight text-center">
                Welcome Back!
              </h1>
              <p className="mt-0.5 text-xs text-slate-500 max-w-xs text-center leading-relaxed">
                Log in to your account to manage your WhatsApp leads, pipelines & automations.
              </p>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-2 text-[11px] text-red-700 font-medium flex items-start gap-2">
                <span className="shrink-0 text-red-500 font-bold">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="rounded-lg bg-sky-50 border border-[#BBE1FA] p-2 text-[11px] text-[#0F4C75] font-medium flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-2">
              <div className="relative flex items-center w-full">
                <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none z-10 transition-colors ${
                  hasAuthError ? "text-red-400" : "text-slate-400"
                }`} />
                <input
                  ref={emailInputRef}
                  suppressHydrationWarning
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (hasAuthError) setHasAuthError(false);
                    if (error) setError("");
                  }}
                  required
                  placeholder="Your email address"
                  style={{ paddingLeft: "38px", paddingRight: "12px" }}
                  className={`w-full h-10 rounded-xl text-xs transition-all focus:bg-white focus:outline-hidden ${
                    hasAuthError
                      ? "bg-red-50/30 border border-red-500 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/15"
                      : "bg-[#f4f7f6] border border-transparent text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  }`}
                />
              </div>

              <div className="relative flex items-center w-full">
                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none z-10 transition-colors ${
                  hasAuthError ? "text-red-400" : "text-slate-400"
                }`} />
                <input
                  ref={passwordInputRef}
                  suppressHydrationWarning
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (hasAuthError) setHasAuthError(false);
                    if (error) setError("");
                  }}
                  required
                  placeholder="Your password"
                  style={{ paddingLeft: "38px", paddingRight: "38px" }}
                  className={`w-full h-10 rounded-xl text-xs transition-all focus:bg-white focus:outline-hidden ${
                    hasAuthError
                      ? "bg-red-50/30 border border-red-500 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/15"
                      : "bg-[#f4f7f6] border border-transparent text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  }`}
                />
                <button
                  suppressHydrationWarning
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer z-10"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {hasAuthError && (
                <div className="flex items-center gap-1.5 px-1 py-0.5 text-[11px] text-red-600 font-medium animate-in fade-in slide-in-from-top-1 duration-150">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
                  <span>The email and password you entered did not match our records.</span>
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] px-0.5">
                <span className="text-slate-400">Protected by Role Auth</span>
                <button
                  type="button"
                  onClick={handleOpenResetModal}
                  className="text-blue-600 hover:text-[#0F4C75] font-semibold hover:underline cursor-pointer"
                >
                  Need password reset?
                </button>
              </div>

              <button
                suppressHydrationWarning
                type="submit"
                disabled={loading}
                className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all duration-200 shadow-md hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5 mt-0.5 group"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Signing In...
                  </span>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            <div className="relative flex items-center justify-center my-0.5">
              <div className="w-full border-t border-slate-200" />
              <span className="absolute bg-white px-2 text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                Or continue with
              </span>
            </div>

            <div className="w-full flex flex-col items-center justify-center min-h-[40px]">
              <div id="google-signin-btn" className="w-full flex justify-center" />
              {!googleInitialized && (
                <button
                  suppressHydrationWarning
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs transition-all duration-150 shadow-xs hover:shadow flex items-center justify-center gap-2 focus:outline-hidden cursor-pointer group"
                >
                  <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Sign in with Google</span>
                </button>
              )}
            </div>

            <div className="text-center pt-0.5">
              <button
                suppressHydrationWarning
                type="button"
                onClick={handleSeedDatabase}
                disabled={seeding}
                className="inline-flex items-center gap-1.5 text-[10px] font-medium text-slate-400 hover:text-blue-600 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Database className="w-3 h-3 text-blue-600" />
                {seeding ? "Initializing database..." : "First time setup? Seed default database"}
              </button>
            </div>

            {/* Mobile-only toggle link */}
            <div className="md:hidden text-center pt-1.5 border-t border-slate-100">
              <p className="text-xs text-slate-500">
                New to MyCRM?{" "}
                <button
                  type="button"
                  onClick={() => setIsSignUpActive(true)}
                  className="text-blue-600 font-bold hover:underline cursor-pointer"
                >
                  Create an account
                </button>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-1.5 text-center border-t border-slate-100">
            <p className="text-[10px] text-slate-400">
              Need assistance?{" "}
              <a href="mailto:imethblueplantsolutions@gmail.com" className="text-blue-600 font-semibold hover:underline">
                imethblueplantsolutions@gmail.com
              </a>
            </p>
          </div>
        </div>

          {/* ================= 2. SIGN UP FORM PANEL (Right 50% Desktop) ================= */}
          <div
            className={`w-1/2 md:w-1/2 p-6 flex flex-col justify-between gap-4 bg-white transition-opacity duration-700 ease-in-out ${
              isSignUpActive
                ? "md:opacity-100 md:z-20 md:pointer-events-auto"
                : "md:opacity-0 md:z-10 md:pointer-events-none"
            }`}
          >
          {/* Top Bar */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0F4C75] to-[#3282B8] flex items-center justify-center shadow-md shadow-[#3282B8]/20 shrink-0">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <div className="flex items-baseline gap-0.5">
                <span className="text-lg font-bold text-blue-600 tracking-tight">MyCRM</span>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-[10px] font-semibold text-purple-700 shrink-0">
              <Sparkles className="w-3 h-3 text-purple-600" />
              <span>SaaS Onboarding</span>
            </div>
          </div>

          {/* Form Content */}
          <div className="w-full max-w-[360px] mx-auto flex flex-col gap-2">
            <div className="w-full flex flex-col items-center justify-center text-center">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight text-center">
                Create Account
              </h1>
              <p className="mt-0.5 text-xs text-slate-500 max-w-xs text-center leading-relaxed">
                Join MyCRM to launch lead pipelines, automated follow-ups & team hierarchy.
              </p>
            </div>

            {signUpError && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-2 text-[11px] text-red-700 font-medium flex items-start gap-2">
                <span className="shrink-0 text-red-500 font-bold">⚠️</span>
                <span>{signUpError}</span>
              </div>
            )}

            {signUpSuccess && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2 text-[11px] text-emerald-800 font-medium flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>{signUpSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSignUpSubmit} className="flex flex-col gap-2">
              {/* Full Name Input */}
              <div className="relative flex items-center w-full">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                <input
                  suppressHydrationWarning
                  type="text"
                  value={signUpName}
                  onChange={(e) => setSignUpName(e.target.value)}
                  required
                  placeholder="Full name (e.g. Sarah Jenkins)"
                  style={{ paddingLeft: "38px", paddingRight: "12px" }}
                  className="w-full h-9.5 rounded-xl bg-[#f4f7f6] border border-transparent text-xs text-slate-800 placeholder-slate-400 transition-all focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-hidden"
                />
              </div>

              {/* Email Input */}
              <div className="relative flex items-center w-full">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                <input
                  suppressHydrationWarning
                  type="email"
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  required
                  placeholder="Work email address"
                  style={{ paddingLeft: "38px", paddingRight: "12px" }}
                  className="w-full h-9.5 rounded-xl bg-[#f4f7f6] border border-transparent text-xs text-slate-800 placeholder-slate-400 transition-all focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-hidden"
                />
              </div>

              {/* Password Input */}
              <div className="relative flex items-center w-full">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                <input
                  suppressHydrationWarning
                  type={showSignUpPassword ? "text" : "password"}
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  required
                  placeholder="Create a password"
                  style={{ paddingLeft: "38px", paddingRight: "38px" }}
                  className="w-full h-9.5 rounded-xl bg-[#f4f7f6] border border-transparent text-xs text-slate-800 placeholder-slate-400 transition-all focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-hidden"
                />
                <button
                  suppressHydrationWarning
                  type="button"
                  onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer z-10"
                >
                  {showSignUpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Company / Organization Name (Optional) */}
              <div className="relative flex items-center w-full">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                <input
                  suppressHydrationWarning
                  type="text"
                  value={signUpCompanyName}
                  onChange={(e) => setSignUpCompanyName(e.target.value)}
                  placeholder="Company / Organization (Optional)"
                  style={{ paddingLeft: "38px", paddingRight: "12px" }}
                  className="w-full h-9.5 rounded-xl bg-[#f4f7f6] border border-transparent text-xs text-slate-800 placeholder-slate-400 transition-all focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-hidden"
                />
              </div>

              {/* Submit Button */}
              <button
                suppressHydrationWarning
                type="submit"
                disabled={signUpLoading}
                className="w-full h-9.5 rounded-xl bg-gradient-to-r from-[#0F4C75] to-[#3282B8] hover:from-[#1B262C] hover:to-[#0F4C75] text-white font-semibold text-xs transition-all duration-200 shadow-md hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5 mt-0.5 group"
              >
                {signUpLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Creating Account...
                  </span>
                ) : (
                  <>
                    <span>Create Organization Account</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            {/* Mobile-only toggle link */}
            <div className="md:hidden text-center pt-1.5 border-t border-slate-100">
              <p className="text-xs text-slate-500">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setIsSignUpActive(false)}
                  className="text-blue-600 font-bold hover:underline cursor-pointer"
                >
                  Sign in instead
                </button>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-1.5 text-center border-t border-slate-100">
            <p className="text-[10px] text-slate-400">
              Need assistance?{" "}
              <a href="mailto:imethblueplantsolutions@gmail.com" className="text-blue-600 font-semibold hover:underline">
                imethblueplantsolutions@gmail.com
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* ================= 3. DARK BLUE SLIDING OVERLAY PANEL (`.toggle-container`) ================= */}
        <div
          className={`hidden md:flex absolute top-0 left-1/2 w-1/2 h-full z-30 transition-transform duration-700 ease-in-out overflow-hidden bg-gradient-to-br from-[#1B262C] via-[#0F4C75] to-[#3282B8] flex-col justify-between p-6 ${
            isSignUpActive ? "-translate-x-full" : "translate-x-0"
          }`}
        >
          {/* Background Lighting & Grid Effects */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_30%,rgba(187,225,250,0.35),transparent_65%)] pointer-events-none" />
          <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#ffffff15_1px,transparent_1px),linear-gradient(to_bottom,#ffffff15_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

          {/* Top Header Badge */}
          <div className="w-full flex items-center justify-between z-10">
            <div className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-semibold text-white/90 flex items-center gap-1.5 shadow-lg">
              <Layers className="w-3 h-3 text-[#BBE1FA]" />
              Enterprise Edition
            </div>
          </div>

          {/* Center Showcase Card (Preserved Feature Carousel with Dots) */}
          <div className="relative z-10 w-full max-w-[380px] mx-auto rounded-xl bg-white/15 backdrop-blur-2xl border border-white/30 p-5 text-white shadow-2xl flex flex-col gap-3 my-auto">
            {/* Header Icon Ring */}
            <div className="w-8.5 h-8.5 rounded-xl border-2 border-white/40 border-t-white flex items-center justify-center bg-white/10 backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-[#BBE1FA]" />
            </div>

            {/* Content Text */}
            <div className="flex flex-col gap-1">
              <span className="self-start px-2 py-0.5 rounded-full bg-[#BBE1FA]/20 border border-[#BBE1FA]/40 text-[9px] font-bold tracking-wider text-[#BBE1FA] uppercase">
                {slides[activeSlide].tag}
              </span>
              <h2 className="text-base sm:text-lg font-bold leading-snug tracking-tight text-white drop-shadow-xs">
                {slides[activeSlide].title}
              </h2>
              <p className="text-[11px] text-white/90 leading-relaxed font-normal">
                {slides[activeSlide].description}
              </p>
            </div>

            {/* Slider Dots */}
            <div className="flex items-center gap-1.5 pt-2 border-t border-white/20">
              {slides.map((_, idx) => (
                <button
                  suppressHydrationWarning
                  key={idx}
                  type="button"
                  onClick={() => setActiveSlide(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    activeSlide === idx ? "w-7 bg-[#BBE1FA]" : "w-1.5 bg-white/40 hover:bg-white/70"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Bottom Toggle Control Action Box */}
          <div className="relative z-10 w-full max-w-[380px] mx-auto rounded-xl bg-white/10 backdrop-blur-md border border-white/20 px-3.5 py-2.5 text-white flex items-center justify-between shadow-lg">
            {!isSignUpActive ? (
              <>
                <div>
                  <p className="text-xs font-semibold text-white">New to MyCRM?</p>
                  <p className="text-[10px] text-white/70">Create your tenant organization account</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSignUpActive(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-white text-[#0F4C75] hover:bg-[#BBE1FA] font-bold text-xs transition-all cursor-pointer shadow-md hover:shadow-lg"
                >
                  Sign Up
                </button>
              </>
            ) : (
              <>
                <div>
                  <p className="text-xs font-semibold text-white">Already have an account?</p>
                  <p className="text-[10px] text-white/70">Sign in to your CRM workspace</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSignUpActive(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-white text-[#0F4C75] hover:bg-[#BBE1FA] font-bold text-xs transition-all cursor-pointer shadow-md hover:shadow-lg"
                >
                  Sign In
                </button>
              </>
            )}
          </div>
        </div>

      </div>

      {/* OTP Login Modal */}
      <OtpLoginModal
        isOpen={showOtpModal}
        email={email}
        isFirstLogin={isFirstLogin}
        otpPreview={otpPreview}
        onSuccess={handleOtpSuccess}
        onCancel={() => setShowOtpModal(false)}
      />

      {/* Incorrect Credential Alert Modal (matching screenshot) */}
      <CredentialErrorModal
        isOpen={showCredentialModal}
        onClose={() => handleDismissCredentialModal(false)}
        onConfirm={() => handleDismissCredentialModal(true)}
      />

      {/* Self-Service Password Recovery Modal */}
      {isResetModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseResetModal();
          }}
        >
          <div
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header Gradient */}
            <div className="bg-gradient-to-r from-[#1B262C] via-[#0F4C75] to-[#3282B8] p-6 text-white text-center relative">
              <button
                type="button"
                onClick={handleCloseResetModal}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-12 h-12 mx-auto rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg mb-3">
                {resetStep === "SUCCESS" ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                ) : resetStep === "OTP" ? (
                  <KeyRound className="w-6 h-6 text-[#BBE1FA]" />
                ) : (
                  <ShieldCheck className="w-6 h-6 text-[#BBE1FA]" />
                )}
              </div>

              <h3 className="text-xl font-bold tracking-tight">
                {resetStep === "SUCCESS"
                  ? "Password Updated!"
                  : resetStep === "OTP"
                  ? "Enter Verification Code"
                  : "Reset Your Password"}
              </h3>
              <p className="text-xs text-white/80 mt-1 max-w-xs mx-auto">
                {resetStep === "SUCCESS"
                  ? "Your account password has been securely updated."
                  : resetStep === "OTP"
                  ? `Enter the 6-digit code sent to ${resetEmail} and choose a new password.`
                  : "Enter your registered email address and we'll send you a 6-digit verification code."}
              </p>
            </div>

            {/* Step 'EMAIL' */}
            {resetStep === "EMAIL" && (
              <form onSubmit={handleSendResetCode} className="p-6 sm:p-7 space-y-4">
                {resetError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span>{resetError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Account Email Address
                  </label>
                  <div className="relative flex items-center w-full">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => {
                        setResetEmail(e.target.value);
                        setResetError("");
                      }}
                      required
                      placeholder="name@company.com"
                      style={{ paddingLeft: "38px", paddingRight: "12px" }}
                      className="w-full h-10 rounded-xl bg-[#f4f7f6] border border-transparent text-xs text-slate-800 placeholder-slate-400 transition-all focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-hidden"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all duration-200 shadow-md hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {resetLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Sending Reset Code...
                    </span>
                  ) : (
                    <>
                      <span>Send Reset Code</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={handleCloseResetModal}
                    className="text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors cursor-pointer"
                  >
                    Remember your password? Back to Login
                  </button>
                </div>
              </form>
            )}

            {/* Step 'OTP' */}
            {resetStep === "OTP" && (
              <form onSubmit={handleResetPassword} className="p-6 sm:p-7 space-y-4">
                {resetError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span>{resetError}</span>
                  </div>
                )}

                {/* Target Email Banner */}
                <div className="p-3 rounded-xl bg-[#BBE1FA]/20 border border-[#BBE1FA]/70 flex items-center justify-between text-xs text-[#0F4C75] font-medium">
                  <div className="flex items-center gap-2 truncate">
                    <KeyRound className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="truncate">Sent to: <strong>{resetEmail}</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setResetStep("EMAIL");
                      setResetError("");
                    }}
                    className="text-[11px] text-blue-600 hover:text-blue-800 underline font-semibold shrink-0 cursor-pointer ml-2"
                  >
                    Change
                  </button>
                </div>

                {/* OTP Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      6-Digit Security Code
                    </label>
                    <button
                      type="button"
                      onClick={handleResendResetOtp}
                      disabled={resetCooldown > 0 || resetLoading}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${resetLoading ? "animate-spin" : ""}`} />
                      {resetCooldown > 0 ? `Resend (${resetCooldown}s)` : "Resend Code"}
                    </button>
                  </div>
                  <div className="relative flex items-center w-full">
                    <input
                      type="text"
                      maxLength={6}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={resetOtp}
                      onChange={(e) => {
                        setResetOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                        setResetError("");
                      }}
                      required
                      placeholder="000000"
                      className="w-full h-11 rounded-xl bg-[#f4f7f6] border border-transparent text-center text-lg font-mono font-bold tracking-[0.4em] text-slate-900 placeholder-slate-300 transition-all focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* New Password Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    New Password
                  </label>
                  <div className="relative flex items-center w-full">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                    <input
                      type={showNewResetPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setResetError("");
                      }}
                      required
                      minLength={6}
                      placeholder="At least 6 characters"
                      style={{ paddingLeft: "38px", paddingRight: "38px" }}
                      className="w-full h-10 rounded-xl bg-[#f4f7f6] border border-transparent text-xs text-slate-800 placeholder-slate-400 transition-all focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewResetPassword(!showNewResetPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer z-10"
                    >
                      {showNewResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={resetLoading || resetOtp.length !== 6 || newPassword.length < 6}
                  className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all duration-200 shadow-md hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5 mt-2"
                >
                  {resetLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Updating Password...
                    </span>
                  ) : (
                    <>
                      <span>Reset Password</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Step 'SUCCESS' */}
            {resetStep === "SUCCESS" && (
              <div className="p-7 text-center space-y-5">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center text-emerald-600 animate-in zoom-in-75 duration-300">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-base font-bold text-slate-900">
                    Password Successfully Reset!
                  </h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                    Your password has been securely updated. You can now sign in with your new password.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleFinishReset}
                  className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all duration-200 shadow-md hover:shadow-xl cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Back to Login</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}