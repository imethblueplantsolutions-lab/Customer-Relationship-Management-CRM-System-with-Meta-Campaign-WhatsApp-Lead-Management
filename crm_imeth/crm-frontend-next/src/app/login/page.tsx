"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { apiClient, ApiError } from "@/lib/api-client";
import OtpLoginModal from "@/components/auth/OtpLoginModal";
import CredentialErrorModal from "@/components/auth/CredentialErrorModal";
import ForgotPasswordModal from "@/components/auth/ForgotPasswordModal";
import { applyTheme } from "@/lib/theme";
import type { User } from "@/types";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  User as UserIcon,
  Building2,
  AlertCircle,
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

function LoginPageContent() {
  const searchParams = useSearchParams();
  const returnUrlParam = searchParams.get("returnUrl");
  const isExpired = searchParams.get("expired") === "true";

  // Check for ?expired=true on mount and alert user
  useEffect(() => {
    if (isExpired) {
      toast.error("Your session expired due to inactivity. Please log in again.", {
        id: "session-expired-toast",
        duration: 5000,
      });
    }
  }, [isExpired]);

  // Helper to safely navigate to returnUrl or user role default
  const getDestination = useCallback(
    (user?: User | null) => {
      if (returnUrlParam && returnUrlParam.startsWith("/") && !returnUrlParam.startsWith("//")) {
        return returnUrlParam;
      }
      return user?.role === "SUPER_ADMIN" ? "/hierarchy" : "/dashboard";
    },
    [returnUrlParam]
  );

  // Mode toggle state
  const [isSignUpActive, setIsSignUpActive] = useState(false);

  // Sign In Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Credential Error Modal state & Brute-force Lockout state
  const [showCredentialModal, setShowCredentialModal] = useState(false);
  const [hasAuthError, setHasAuthError] = useState(false);
  const [authRemainingAttempts, setAuthRemainingAttempts] = useState<number | null>(null);
  const [authLockoutUntil, setAuthLockoutUntil] = useState<string | null>(null);
  const [authIsLocked, setAuthIsLocked] = useState(false);
  const [authErrorModalMessage, setAuthErrorModalMessage] = useState("");
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const lastAttemptedEmailRef = useRef("");
  const lastAttemptedPasswordRef = useRef("");

  const handleDismissCredentialModal = (focusField = true) => {
    setShowCredentialModal(false);
    if (focusField) {
      setTimeout(() => {
        passwordInputRef.current?.focus();
        passwordInputRef.current?.select();
      }, 100);
    }
  };

  // Sign Up Form state
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState("");
  const [signUpCompanyName, setSignUpCompanyName] = useState("");
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showSignUpConfirmPassword, setShowSignUpConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [signUpError, setSignUpError] = useState("");
  const [signUpSuccess, setSignUpSuccess] = useState("");
  const [signUpLoading, setSignUpLoading] = useState(false);

  // OTP Modal state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [otpPreview, setOtpPreview] = useState<string | undefined>(undefined);

  // Forgot Password Modal State
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  // Guarantee /login is strictly locked to its own clean, fixed default styling
  useEffect(() => {
    applyTheme("default-crm", null, false);
  }, []);

  // Pre-fill email on mount if user previously checked "Remember me"
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem("crm_remembered_email");
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    } catch {
      // Ignore localStorage access restrictions
    }
  }, []);

  const { login, setSession } = useAuth();
  const router = useRouter();

  // Sign In Form Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setHasAuthError(false);
    setLoading(true);
    lastAttemptedEmailRef.current = email;
    lastAttemptedPasswordRef.current = password;
    try {
      const res = await login(email, password);

      // Persist or remove remembered email based on Remember Me toggle
      if (rememberMe) {
        localStorage.setItem("crm_remembered_email", email.trim());
      } else {
        localStorage.removeItem("crm_remembered_email");
      }

      if (res?.requireOtp) {
        setIsFirstLogin(!!res.isFirstLogin);
        setOtpPreview(res.otpPreview);
        setShowOtpModal(true);
        setSuccessMsg(res.message || "OTP code dispatched to your email. Please verify to proceed.");
      } else {
        const storedUser = localStorage.getItem("user");
        const parsed = storedUser ? JSON.parse(storedUser) : null;
        router.push(getDestination(parsed));
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Authentication failed. Please check credentials or backend server.";
      setError(msg);
      setHasAuthError(true);

      if (err instanceof ApiError) {
        setAuthRemainingAttempts(err.remainingAttempts ?? null);
        setAuthLockoutUntil(err.lockoutUntil ?? null);
        setAuthIsLocked(Boolean(err.isLocked || err.statusCode === 423));
        setAuthErrorModalMessage(err.message || "The email and password you entered did not match our records.");
      } else {
        setAuthRemainingAttempts(null);
        setAuthLockoutUntil(null);
        setAuthIsLocked(false);
        setAuthErrorModalMessage(msg);
      }

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

    if (signUpPassword !== signUpConfirmPassword) {
      setSignUpError("Passwords do not match. Please re-enter your password.");
      return;
    }

    if (!agreedToTerms) {
      setSignUpError("Please accept the Terms of Service and Privacy Policy to continue.");
      return;
    }

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
        router.push(getDestination(res.data.user));
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
    router.push(getDestination(data.user));
  };

  const [googleInitialized, setGoogleInitialized] = useState(false);

  const handleGoogleResponse = useCallback(async (response: { credential?: string }) => {
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
      router.push(getDestination(user));
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Google login failed. Please ensure your enterprise email is registered."
      );
    } finally {
      setLoading(false);
    }
  }, [router, setSession, getDestination]);

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
  }, [handleGoogleResponse]);

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



  return (
    <div id="login-page-root" className="relative min-h-screen w-full bg-[#f4f9fd] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans overflow-x-hidden">
      {/* Decorative Ambient Background Glows */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#BBE1FA]/50 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />

      {/* Subtle Floating Shapes */}
      <div className="absolute top-12 left-1/4 w-10 h-10 bg-white/70 backdrop-blur-md rounded-2xl rotate-12 shadow-xs pointer-events-none" />
      <div className="absolute bottom-16 left-12 w-8 h-8 bg-[#BBE1FA]/40 backdrop-blur-md rounded-xl -rotate-12 shadow-xs pointer-events-none" />
      <div className="absolute top-20 right-16 w-12 h-12 bg-white/80 backdrop-blur-md rounded-2xl rotate-45 shadow-xs pointer-events-none" />
      <div className="absolute bottom-24 right-1/4 w-9 h-9 bg-blue-600/20 backdrop-blur-md rounded-xl rotate-6 shadow-xs pointer-events-none" />

      {/* Main Auth Card */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-[0_20px_60px_rgba(27,38,44,0.14)] border border-slate-100 overflow-hidden">
        {/* Auth Form Panel */}
        <div className="w-full p-6 sm:p-8 flex flex-col justify-between bg-white">
          <div className="w-full max-w-[360px] mx-auto flex flex-col gap-4">

            {/* Top Brand Logo */}
            <div className="flex items-center justify-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0F4C75] to-[#3282B8] flex items-center justify-center shadow-md shadow-[#3282B8]/20 shrink-0">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-extrabold text-[#0F4C75] tracking-tight">MyCRM</span>
            </div>

            {/* Segmented Two-Button Tab Control (Login / Sign Up) */}
            <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-100 border border-slate-200/80">
              <button
                type="button"
                onClick={() => {
                  setIsSignUpActive(false);
                  setError("");
                  setSuccessMsg("");
                }}
                className={`py-2 text-xs sm:text-sm font-bold rounded-lg transition-all duration-200 cursor-pointer ${!isSignUpActive
                  ? "bg-[#0F4C75] text-white shadow-md"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                  }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSignUpActive(true);
                  setSignUpError("");
                  setSignUpSuccess("");
                }}
                className={`py-2 text-xs sm:text-sm font-bold rounded-lg transition-all duration-200 cursor-pointer ${isSignUpActive
                  ? "bg-[#0F4C75] text-white shadow-md"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                  }`}
              >
                Sign Up
              </button>
            </div>

            {!isSignUpActive ? (
              /* ================= LOGIN FORM (Image 2) ================= */
              <div className="flex flex-col gap-3">
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

                <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
                  {/* Email / Username Input */}
                  <div
                    className={`flex rounded-xl border bg-white overflow-hidden transition-all focus-within:ring-2 focus-within:ring-blue-500/10 ${hasAuthError ? "border-red-500" : "border-slate-300 focus-within:border-blue-500"
                      }`}
                  >
                    <div className="w-10 bg-slate-50 border-r border-slate-200 flex items-center justify-center shrink-0 text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      ref={emailInputRef}
                      suppressHydrationWarning
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (hasAuthError && e.target.value !== lastAttemptedEmailRef.current) {
                          setHasAuthError(false);
                          setError("");
                        }
                      }}
                      required
                      placeholder="Username / Email"
                      className="w-full h-10 px-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                    />
                  </div>

                  {/* Password Input */}
                  <div
                    className={`flex rounded-xl border bg-white overflow-hidden transition-all focus-within:ring-2 focus-within:ring-blue-500/10 relative ${hasAuthError ? "border-red-500" : "border-slate-300 focus-within:border-blue-500"
                      }`}
                  >
                    <div className="w-10 bg-slate-50 border-r border-slate-200 flex items-center justify-center shrink-0 text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      ref={passwordInputRef}
                      suppressHydrationWarning
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (hasAuthError && e.target.value !== lastAttemptedPasswordRef.current) {
                          setHasAuthError(false);
                          setError("");
                        }
                      }}
                      required
                      placeholder="Password"
                      className="w-full h-10 pl-3 pr-10 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                    />
                    <button
                      suppressHydrationWarning
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {hasAuthError && (
                    <div className="flex items-center gap-1.5 px-1 py-0.5 text-[11px] text-red-600 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
                      <span>The email and password you entered did not match our records.</span>
                    </div>
                  )}

                  {/* Remember me & Forgot Password */}
                  <div className="flex items-center justify-between text-[11px] pt-0.5">
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-500 hover:text-slate-700 select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-3.5 h-3.5 rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                      />
                      <span>Remember me</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsForgotPasswordOpen(true)}
                      className="text-blue-600 hover:text-[#0F4C75] font-semibold hover:underline cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  {/* Submit Button */}
                  <button
                    suppressHydrationWarning
                    type="submit"
                    disabled={loading}
                    className="w-full h-10 rounded-xl bg-[#0F4C75] hover:bg-[#1B262C] text-white font-bold text-xs transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5 mt-1"
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
                        Sign in
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Google Sign In Divider */}
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
                      className="w-full h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs transition-all duration-150 shadow-xs hover:shadow flex items-center justify-center gap-2 focus:outline-hidden cursor-pointer"
                    >
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span>Sign in with Google</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* ================= SIGN UP FORM (Image 1) ================= */
              <div className="flex flex-col gap-3">
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
                  {/* Email */}
                  <div className="flex rounded-xl border border-slate-300 bg-white overflow-hidden transition-all focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10">
                    <div className="w-10 bg-slate-50 border-r border-slate-200 flex items-center justify-center shrink-0 text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      suppressHydrationWarning
                      type="email"
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      required
                      placeholder="Email"
                      className="w-full h-9.5 px-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                    />
                  </div>

                  {/* Full Name */}
                  <div className="flex rounded-xl border border-slate-300 bg-white overflow-hidden transition-all focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10">
                    <div className="w-10 bg-slate-50 border-r border-slate-200 flex items-center justify-center shrink-0 text-slate-400">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      suppressHydrationWarning
                      type="text"
                      value={signUpName}
                      onChange={(e) => setSignUpName(e.target.value)}
                      required
                      placeholder="Full Name (e.g. Sarah Jenkins)"
                      className="w-full h-9.5 px-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                    />
                  </div>

                  {/* Password */}
                  <div className="flex rounded-xl border border-slate-300 bg-white overflow-hidden transition-all focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10 relative">
                    <div className="w-10 bg-slate-50 border-r border-slate-200 flex items-center justify-center shrink-0 text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      suppressHydrationWarning
                      type={showSignUpPassword ? "text" : "password"}
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      required
                      placeholder="Password"
                      className="w-full h-9.5 pl-3 pr-10 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                    />
                    <button
                      suppressHydrationWarning
                      type="button"
                      onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      {showSignUpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Confirm Password */}
                  <div className="flex rounded-xl border border-slate-300 bg-white overflow-hidden transition-all focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10 relative">
                    <div className="w-10 bg-slate-50 border-r border-slate-200 flex items-center justify-center shrink-0 text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      suppressHydrationWarning
                      type={showSignUpConfirmPassword ? "text" : "password"}
                      value={signUpConfirmPassword}
                      onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                      required
                      placeholder="Confirm Password"
                      className="w-full h-9.5 pl-3 pr-10 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                    />
                    <button
                      suppressHydrationWarning
                      type="button"
                      onClick={() => setShowSignUpConfirmPassword(!showSignUpConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      {showSignUpConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Company / Organization (Optional) */}
                  <div className="flex rounded-xl border border-slate-300 bg-white overflow-hidden transition-all focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10">
                    <div className="w-10 bg-slate-50 border-r border-slate-200 flex items-center justify-center shrink-0 text-slate-400">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <input
                      suppressHydrationWarning
                      type="text"
                      value={signUpCompanyName}
                      onChange={(e) => setSignUpCompanyName(e.target.value)}
                      placeholder="Company / Organization (Optional)"
                      className="w-full h-9.5 px-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                    />
                  </div>

                  {/* Terms Checkbox (Image 1) */}
                  <label className="flex items-start gap-2 text-[11px] text-slate-600 pt-0.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="w-3.5 h-3.5 mt-0.5 rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600 shrink-0"
                    />
                    <span>I accept the Terms of Service and Privacy Policy</span>
                  </label>

                  {/* Submit Button */}
                  <button
                    suppressHydrationWarning
                    type="submit"
                    disabled={signUpLoading}
                    className="w-full h-10 rounded-xl bg-[#0F4C75] hover:bg-[#1B262C] text-white font-bold text-xs transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5 mt-1"
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
                        Sign Up
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
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

      {/* Incorrect Credential Alert & Brute-Force Lockout Modal */}
      <CredentialErrorModal
        isOpen={showCredentialModal}
        title={authIsLocked ? "Account Temporarily Locked" : "Authentication Failed"}
        message={authErrorModalMessage || "The email and password you entered did not match our records. Please double-check and try again."}
        remainingAttempts={authRemainingAttempts}
        lockoutUntil={authLockoutUntil}
        isLocked={authIsLocked}
        onClose={() => handleDismissCredentialModal(false)}
        onConfirm={() => handleDismissCredentialModal(true)}
        onResetPassword={() => {
          setShowCredentialModal(false);
          setIsForgotPasswordOpen(true);
        }}
      />

      {/* Self-Service Password Recovery Modal */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        initialEmail={email}
        onClose={() => setIsForgotPasswordOpen(false)}
        onSuccess={(recoveredEmail) => {
          setIsForgotPasswordOpen(false);
          setEmail(recoveredEmail);
          passwordInputRef.current?.focus();
        }}
      />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white" />}>
      <LoginPageContent />
    </Suspense>
  );
}