"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/api-client";
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

export default function LoginPage() {
  const [email, setEmail] = useState("admin@crm.com");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  const { login } = useAuth();
  const router = useRouter();

  const slides = [
    {
      title: "Smart Meta Ads & WhatsApp Lead Automation",
      description:
        "Capture instant leads from Meta campaigns, trigger automated qualification flows, and close deals faster.",
      tag: "Lead Automation",
    },
    {
      title: "Real-time Omnichannel WhatsApp Inbox",
      description:
        "Manage two-way customer conversations with live socket synchronization and instant webhook responses.",
      tag: "Live Inbox",
    },
    {
      title: "Enterprise Multi-Tenant & Node Flow Engine",
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
      await login(email, password);
      router.push("/dashboard");
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

  const handleQuickFill = () => {
    setEmail("admin@crm.com");
    setPassword("admin123");
    setError("");
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
      setEmail("admin@crm.com");
      setPassword("admin123");
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

  return (
    <div className="relative min-h-screen w-full bg-[#edf8f2] flex items-center justify-center p-4 sm:p-6 md:p-10 font-sans overflow-hidden">
      {/* Decorative Ambient Background Glows */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#25d366]/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-[#128c7e]/20 blur-3xl pointer-events-none" />
      
      {/* Subtle Floating Shapes */}
      <div className="absolute top-12 left-1/4 w-10 h-10 bg-white/70 backdrop-blur-md rounded-2xl rotate-12 shadow-sm pointer-events-none" />
      <div className="absolute bottom-16 left-12 w-8 h-8 bg-[#25d366]/20 backdrop-blur-md rounded-xl -rotate-12 shadow-sm pointer-events-none" />
      <div className="absolute top-20 right-16 w-12 h-12 bg-white/80 backdrop-blur-md rounded-2xl rotate-45 shadow-sm pointer-events-none" />
      <div className="absolute bottom-24 right-1/4 w-9 h-9 bg-[#128c7e]/20 backdrop-blur-md rounded-xl rotate-6 shadow-sm pointer-events-none" />

      {/* Main Split Container */}
      <div className="relative z-10 w-full max-w-[1060px] min-h-[660px] bg-white rounded-[36px] shadow-[0_25px_70px_rgba(7,94,84,0.1)] border border-slate-100/90 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        
        {/* ================= LEFT HALF: Form & Clean Inputs ================= */}
        <div className="lg:col-span-6 p-8 sm:p-12 flex flex-col justify-between bg-white">
          
          {/* Top Bar: Brand & Language */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#128c7e] to-[#25d366] flex items-center justify-center shadow-md shadow-[#25d366]/20">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div className="flex items-baseline gap-0.5">
                <span className="text-xl font-bold text-slate-900 tracking-tight">Meta</span>
                <span className="text-xl font-bold text-[#128c7e] tracking-tight">CRM</span>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f4fbf7] border border-[#d1fae5] text-xs font-semibold text-[#075e54]">
              <span className="w-2 h-2 rounded-full bg-[#25d366] animate-pulse" />
              <span>v1.0 Live</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
            </div>
          </div>

          {/* Form Content Area */}
          <div className="my-auto py-6 flex flex-col gap-5">
            
            {/* Greeting */}
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Welcome Back!
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
                Log in to your account to manage your WhatsApp leads, pipelines and campaign automations.
              </p>
            </div>

            {/* Quick Demo Credentials Autofill Pill */}
            <div className="p-3 rounded-2xl bg-[#f0faf5] border border-[#d2f4e3] flex items-center justify-between">
              <div className="text-xs">
                <p className="text-[#075e54] font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#25d366]" /> Demo Admin
                </p>
                <p className="text-slate-500 text-[11px] mt-0.5">admin@crm.com • admin123</p>
              </div>
              <button
                type="button"
                onClick={handleQuickFill}
                className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-[#075e54] text-xs font-bold border border-[#a7f3d0] shadow-xs transition-all cursor-pointer hover:scale-105 active:scale-95"
              >
                Auto-fill
              </button>
            </div>

            {/* Error & Success Messages */}
            {error && (
              <div className="rounded-2xl bg-red-50 border border-red-200 p-3.5 text-xs text-red-700 font-medium flex items-start gap-2">
                <span className="shrink-0 text-red-500 font-bold">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-800 font-medium flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#25d366] shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Form Fields */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              
              {/* Email Input */}
              <div className="relative flex items-center">
                <Mail className="absolute left-4 w-4 h-4 text-slate-400 z-10 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Your email address"
                  className="w-full h-13 rounded-2xl bg-[#f4f7f6] border border-transparent pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 transition-all focus:bg-white focus:border-[#128c7e] focus:ring-4 focus:ring-[#128c7e]/10 focus:outline-none"
                />
              </div>

              {/* Password Input */}
              <div className="relative flex items-center">
                <Lock className="absolute left-4 w-4 h-4 text-slate-400 z-10 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Your password"
                  className="w-full h-13 rounded-2xl bg-[#f4f7f6] border border-transparent pl-11 pr-11 text-sm text-slate-800 placeholder-slate-400 transition-all focus:bg-white focus:border-[#128c7e] focus:ring-4 focus:ring-[#128c7e]/10 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer z-10"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Link */}
              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-slate-400 text-[11px]">Protected by Role Auth</span>
                <button
                  type="button"
                  onClick={handleQuickFill}
                  className="text-[#128c7e] hover:text-[#075e54] font-semibold hover:underline cursor-pointer"
                >
                  Need password reset?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-13 rounded-2xl bg-slate-950 hover:bg-[#075e54] text-white font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 mt-1 group"
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

            {/* Seed Database Option */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={handleSeedDatabase}
                disabled={seeding}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-[#128c7e] transition-colors cursor-pointer disabled:opacity-50"
              >
                <Database className="w-3.5 h-3.5 text-[#25d366]" />
                {seeding ? "Initializing database..." : "First time setup? Seed default database"}
              </button>
            </div>
          </div>

          {/* Bottom Footer Note */}
          <div className="pt-4 text-center border-t border-slate-100">
            <p className="text-xs text-slate-400">
              Need assistance?{" "}
              <a href="mailto:support@metacrm.io" className="text-[#128c7e] font-semibold hover:underline">
                support@metacrm.io
              </a>
            </p>
            <p className="text-[10px] text-slate-300 mt-1">
              All rights reserved Meta CRM Platform 2026
            </p>
          </div>
        </div>

        {/* ================= RIGHT HALF: Immersive Visual with Centered Frosted Glass Card ================= */}
        <div className="hidden lg:flex lg:col-span-6 relative p-10 flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#075e54] via-[#0d7467] to-[#128c7e]">
          
          {/* Background Lighting & Grid Effects */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_30%,rgba(37,211,102,0.3),transparent_65%)] pointer-events-none" />
          <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#ffffff15_1px,transparent_1px),linear-gradient(to_bottom,#ffffff15_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
          
          {/* Top Right Floating Badge */}
          <div className="absolute top-8 right-8 z-10">
            <div className="px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-white/90 flex items-center gap-2 shadow-lg">
              <Layers className="w-3.5 h-3.5 text-[#25d366]" />
              Enterprise Edition
            </div>
          </div>

          {/* Central Frosted Glass Showcase Card */}
          <div className="relative z-10 w-full max-w-[420px] rounded-[30px] bg-white/15 backdrop-blur-2xl border border-white/30 p-8 text-white shadow-[0_20px_50px_rgba(0,0,0,0.25)] flex flex-col gap-6">
            
            {/* Header Icon / Arc Ring */}
            <div className="w-12 h-12 rounded-full border-2 border-white/40 border-t-white flex items-center justify-center bg-white/10 backdrop-blur-md">
              <Sparkles className="w-5 h-5 text-[#25d366]" />
            </div>

            {/* Content Text (well-spaced and fully visible) */}
            <div className="flex flex-col gap-3">
              <span className="self-start px-3 py-1 rounded-full bg-[#25d366]/20 border border-[#25d366]/40 text-[11px] font-bold tracking-wider text-emerald-200 uppercase">
                {slides[activeSlide].tag}
              </span>
              <h2 className="text-2xl font-bold leading-snug tracking-tight text-white drop-shadow-sm">
                {slides[activeSlide].title}
              </h2>
              <p className="text-xs text-white/85 leading-relaxed font-normal">
                {slides[activeSlide].description}
              </p>
            </div>

            {/* Slider Dots */}
            <div className="flex items-center gap-2 pt-2 border-t border-white/15">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveSlide(idx)}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    activeSlide === idx ? "w-8 bg-[#25d366]" : "w-2 bg-white/40 hover:bg-white/70"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
