"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/api-client";
import OtpLoginModal from "@/components/auth/OtpLoginModal";
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
} from "lucide-react";

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  // OTP Modal state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [otpPreview, setOtpPreview] = useState<string | undefined>(undefined);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);
    try {
      const res = await login(email, password);
      if (res?.requireOtp) {
        setIsFirstLogin(!!res.isFirstLogin);
        setOtpPreview(res.otpPreview);
        setShowOtpModal(true);
        setSuccessMsg(res.message || "OTP code dispatched to your email. Please verify to proceed.");
      } else {
        // Redirect based on role — Super Admin goes to hierarchy, others to dashboard
        const storedUser = localStorage.getItem("user");
        const parsed = storedUser ? JSON.parse(storedUser) : null;
        router.push(parsed?.role === "SUPER_ADMIN" ? "/hierarchy" : "/dashboard");
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Authentication failed. Please check credentials or backend server."
      );
    } finally {
      setLoading(false);
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

    // If client ID is set and Google GSI is loaded, trigger Google prompt
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

    // Friendly UI notice (Google Cloud credentials can be configured later)
    setSuccessMsg(
      "Google Sign-In button is live on your UI! Live OAuth authentication will activate when your Google Cloud Client ID is added."
    );
  };

  return (
    <div className="relative min-h-screen w-full bg-[#f4f9fd] flex items-center justify-center p-5 sm:p-6 lg:p-8 font-sans overflow-x-hidden">
      {/* Decorative Ambient Background Glows */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#BBE1FA]/50 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />

      {/* Subtle Floating Shapes */}
      <div className="absolute top-12 left-1/4 w-10 h-10 bg-white/70 backdrop-blur-md rounded-2xl rotate-12 shadow-sm pointer-events-none" />
      <div className="absolute bottom-16 left-12 w-8 h-8 bg-[#BBE1FA]/40 backdrop-blur-md rounded-xl -rotate-12 shadow-sm pointer-events-none" />
      <div className="absolute top-20 right-16 w-12 h-12 bg-white/80 backdrop-blur-md rounded-2xl rotate-45 shadow-sm pointer-events-none" />
      <div className="absolute bottom-24 right-1/4 w-9 h-9 bg-blue-600/20 backdrop-blur-md rounded-xl rotate-6 shadow-sm pointer-events-none" />

      {/* Main Split Container (50/50 Grid) - Enlarged & Spacious */}
      <div className="relative z-10 w-full max-w-6xl min-h-[720px] bg-white rounded-xl shadow-[0_25px_70px_rgba(27,38,44,0.12)] border border-slate-100 overflow-hidden grid grid-cols-1 md:grid-cols-2">

        {/* ================= LEFT HALF: Form & Clean Inputs ================= */}
        <div className="min-w-0 p-6 sm:p-10 lg:p-12 flex flex-col justify-between bg-white">

          {/* Top Bar: Brand & Status Pill */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0F4C75] to-[#3282B8] flex items-center justify-center shadow-md shadow-[#3282B8]/20 shrink-0">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div className="flex items-baseline gap-0.5">
                <span className="text-2xl font-bold text-blue-600 tracking-tight">MyCRM</span>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#BBE1FA]/30 border border-[#BBE1FA] text-xs font-semibold text-[#0F4C75] shrink-0">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span>v1.0 Live</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
            </div>
          </div>

          {/* Center Form Section (Properly centered horizontally and vertically) */}
          <div className="w-full max-w-[400px] mx-auto my-auto py-4 flex flex-col gap-5">

            {/* Greeting Header */}
            <div className="w-full flex flex-col items-center justify-center text-center">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight text-center">
                Welcome Back!
              </h1>
              <p className="mt-2 text-sm text-slate-500 max-w-sm text-center leading-relaxed">
                Log in to your account to manage your WhatsApp leads, pipelines & automations.
              </p>
            </div>

            {/* Error & Success Alerts */}
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-xs sm:text-sm text-red-700 font-medium flex items-start gap-2.5">
                <span className="shrink-0 text-red-500 font-bold">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="rounded-xl bg-sky-50 border border-[#BBE1FA] p-4 text-xs sm:text-sm text-[#0F4C75] font-medium flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

              {/* Email Input */}
              <div className="relative flex items-center w-full">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none z-10" />
                <input
                  suppressHydrationWarning
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Your email address"
                  style={{ paddingLeft: "48px", paddingRight: "16px" }}
                  className="w-full h-12 rounded-xl bg-[#f4f7f6] border border-transparent text-sm text-slate-800 placeholder-slate-400 transition-all focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
                />
              </div>

              {/* Password Input */}
              <div className="relative flex items-center w-full">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none z-10" />
                <input
                  suppressHydrationWarning
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Your password"
                  style={{ paddingLeft: "48px", paddingRight: "48px" }}
                  className="w-full h-12 rounded-xl bg-[#f4f7f6] border border-transparent text-sm text-slate-800 placeholder-slate-400 transition-all focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
                />
                <button
                  suppressHydrationWarning
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer z-10"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Role Auth / Reset Link */}
              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-slate-400">Protected by Role Auth</span>
                <a
                  href="mailto:imethblueplantsolutions@gmail.com?subject=Password%20Reset%20Request"
                  className="text-blue-600 hover:text-[#0F4C75] font-semibold hover:underline"
                >
                  Need password reset?
                </a>
              </div>

              {/* Submit Button */}
              <button
                suppressHydrationWarning
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm sm:text-base transition-all duration-200 shadow-md hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 mt-1 group"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Signing In...
                  </span>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            {/* Subtle Horizontal Divider */}
            <div className="relative flex items-center justify-center my-0.5">
              <div className="w-full border-t border-[#155DFC]" />
              <span className="absolute bg-white dark:bg-slate-900 px-3 text-xs text-slate-400 font-medium uppercase tracking-wider">
                Or continue with
              </span>
            </div>

            {/* Google Sign-In Mount Point & Action Button */}
            <div className="w-full flex flex-col items-center justify-center min-h-[48px]">
              <div id="google-signin-btn" className="w-full flex justify-center" />

              {!googleInitialized && (
                <button
                  suppressHydrationWarning
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium text-sm sm:text-base transition-all duration-150 shadow-sm hover:shadow flex items-center justify-center gap-3 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer group"
                >
                  <svg className="w-5 h-5 shrink-0 transition-transform group-hover:scale-105" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Sign in with Google</span>
                </button>
              )}
            </div>

            {/* Seed Database Option */}
            <div className="text-center pt-1">
              <button
                suppressHydrationWarning
                type="button"
                onClick={handleSeedDatabase}
                disabled={seeding}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-blue-600 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Database className="w-4 h-4 text-blue-600" />
                {seeding ? "Initializing database..." : "First time setup? Seed default database"}
              </button>
            </div>
          </div>

          {/* Bottom Footer Section */}
          <div className="mt-6 pt-4 text-center border-t border-slate-100">
            <p className="text-xs text-slate-400">
              Need assistance?{" "}
              <a href="mailto:imethblueplantsolutions@gmail.com" className="text-blue-600 font-semibold hover:underline">
                imethblueplantsolutions@gmail.com
              </a>
            </p>
            <p className="text-[11px] text-slate-300 mt-1">
              All rights reserved blueplantsolutions.PVT Ltd
            </p>
          </div>
        </div>

        {/* ================= RIGHT HALF: Immersive Visual with Centered Frosted Glass Card ================= */}
        <div className="hidden md:flex relative min-w-0 p-10 lg:p-14 flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#1B262C] via-[#0F4C75] to-[#3282B8]">

          {/* Background Lighting & Grid Effects */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_30%,rgba(187,225,250,0.35),transparent_65%)] pointer-events-none" />
          <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#ffffff15_1px,transparent_1px),linear-gradient(to_bottom,#ffffff15_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

          {/* Top Right Floating Badge */}
          <div className="absolute top-8 right-8 z-10">
            <div className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-white/90 flex items-center gap-2 shadow-lg">
              <Layers className="w-4 h-4 text-[#BBE1FA]" />
              Enterprise Edition
            </div>
          </div>

          {/* Central Frosted Glass Showcase Card (Enlarged) */}
          <div className="relative z-10 w-full max-w-[490px] rounded-xl bg-white/15 backdrop-blur-2xl border border-white/30 p-10 lg:p-11 text-white shadow-2xl flex flex-col gap-7">

            {/* Header Icon Ring */}
            <div className="w-14 h-14 rounded-xl border-2 border-white/40 border-t-white flex items-center justify-center bg-white/10 backdrop-blur-md">
              <Sparkles className="w-6 h-6 text-[#BBE1FA]" />
            </div>

            {/* Content Text (spacious & bold) */}
            <div className="flex flex-col gap-4">
              <span className="self-start px-3.5 py-1 rounded-full bg-[#BBE1FA]/20 border border-[#BBE1FA]/40 text-xs font-bold tracking-wider text-[#BBE1FA] uppercase">
                {slides[activeSlide].tag}
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold leading-snug tracking-tight text-white drop-shadow-sm">
                {slides[activeSlide].title}
              </h2>
              <p className="text-sm sm:text-base text-white/90 leading-relaxed font-normal">
                {slides[activeSlide].description}
              </p>
            </div>

            {/* Slider Dots */}
            <div className="flex items-center gap-2.5 pt-5 border-t border-white/20">
              {slides.map((_, idx) => (
                <button
                  suppressHydrationWarning
                  key={idx}
                  type="button"
                  onClick={() => setActiveSlide(idx)}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${activeSlide === idx ? "w-10 bg-[#BBE1FA]" : "w-2.5 bg-white/40 hover:bg-white/70"
                    }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
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
    </div>
  );
}