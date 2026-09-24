"use client";

import { useState, useEffect, useRef } from "react";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import type { User } from "@/types";
import {
  Save,
  Shield,
  Smartphone,
  Key,
  User as UserIcon,
  CheckCircle2,
  Lock,
  Mail,
  RefreshCw,
  AlertCircle,
  KeyRound,
  LogOut,
  Calendar,
  ChevronRight,
  Camera,
  Trash2,
  Phone,
  Upload,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────
type SettingsTab = "profile" | "security" | "meta";

interface TenantSettings {
  id: string;
  name: string;
  wabaId: string | null;
  metaAccessToken: string | null;
  metaPhoneNumberId: string | null;
}

// ─── Status Banner Component ───────────────────────────────
function StatusBanner({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div
      className={`rounded-xl p-3.5 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in slide-in-from-top-1 duration-300 ${
        type === "success"
          ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
          : "bg-red-50 border border-red-200 text-red-700"
      }`}
    >
      {type === "success" ? (
        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
      ) : (
        <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
      )}
      <span>{message}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PROFILE TAB
// ═══════════════════════════════════════════════════════════
function ProfileTab({
  user,
  updateUser,
}: {
  user: User | null;
  updateUser: (data: Partial<User>) => void;
}) {
  const [profileName, setProfileName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatar, setAvatar] = useState<string | null>(user?.avatar || null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setProfileName(user.name || "");
      setPhone(user.phone || "");
      setBio(user.bio || "");
      setAvatar(user.avatar || null);
    }
  }, [user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("error:Please select a valid image file (JPG, PNG, WebP)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setMessage("error:Image file is too large (maximum 10MB)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_DIM = 200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setMessage("error:Failed to process image canvas");
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Compress to 80% JPEG quality to guarantee Base64 stays under 30KB
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        setAvatar(dataUrl);
        setMessage("");
      };
      img.onerror = () => {
        setMessage("error:Could not load selected image");
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleRemoveAvatar = () => {
    setAvatar(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      setMessage("error:Full Name is required");
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      const res = await apiClient<User>("/users/profile", {
        method: "PUT",
        body: JSON.stringify({
          name: profileName.trim(),
          phone: phone.trim() || null,
          bio: bio.trim() || null,
          avatar: avatar || null,
        }),
      });
      if (res.success && res.data) {
        updateUser({
          name: res.data.name,
          phone: res.data.phone,
          bio: res.data.bio,
          avatar: res.data.avatar,
        });
        setMessage("success:Profile updated successfully!");
        setTimeout(() => setMessage(""), 4000);
      } else {
        setMessage(`error:${res.error || "Failed to update profile"}`);
      }
    } catch (err: unknown) {
      setMessage(`error:${err instanceof Error ? err.message : "Error saving profile"}`);
    } finally {
      setSaving(false);
    }
  };

  const userInitial = user?.name
    ? user.name.charAt(0).toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || "U";

  const roleLabel =
    user?.role === "ADMIN"
      ? "Administrator"
      : user?.role === "TEAM_LEAD"
      ? "Team Leader"
      : "Sales Agent";

  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  const hasChanges =
    profileName.trim() !== (user?.name || "") ||
    phone.trim() !== (user?.phone || "") ||
    bio.trim() !== (user?.bio || "") ||
    (avatar || null) !== (user?.avatar || null);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900">Edit your profile</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Your profile details are displayed across all CRM activities and audit logs
        </p>
      </div>

      {message && (
        <StatusBanner
          message={message.split(":").slice(1).join(":")}
          type={message.startsWith("success") ? "success" : "error"}
        />
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Avatar Section */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
          <div className="relative group shrink-0">
            {avatar ? (
              <img
                src={avatar}
                alt="Profile avatar"
                className="h-20 w-20 rounded-2xl object-cover ring-4 ring-white shadow-md"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0F4C75] to-[#3282B8] text-2xl font-bold text-white shadow-md ring-4 ring-white">
                {userInitial}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-blue-600 text-white shadow-md hover:bg-blue-700 transition-colors cursor-pointer"
              title="Upload new picture"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div>
              <h4 className="text-xs font-bold text-slate-800">Profile Photo</h4>
              <p className="text-[11px] text-slate-500">
                JPG, PNG, or WebP. Auto-scaled to 200×200px under 30KB.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer"
              >
                <Upload className="h-3 w-3 text-slate-500" />
                Upload Photo
              </button>
              {avatar && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50/60 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100/60 transition-all cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" />
                  Remove
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Name and Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1">
              <UserIcon className="h-3 w-3 text-slate-400" />
              Full Name
            </label>
            <input
              type="text"
              required
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1">
              <Mail className="h-3 w-3 text-slate-400" />
              Email Address
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-xl bg-slate-50 border border-slate-100 px-4 py-2.5 font-mono text-sm text-slate-600 truncate">
                {user?.email || "—"}
              </div>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 rounded-lg px-2.5 py-1 shrink-0">
                Read-only
              </span>
            </div>
          </div>
        </div>

        {/* Phone and Bio */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1">
              <Phone className="h-3 w-3 text-slate-400" />
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +1 (555) 000-0000"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Bio / About
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                {bio.length}/250
              </span>
            </div>
            <textarea
              rows={3}
              maxLength={250}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A short description about yourself, your role, or expertise..."
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all resize-none placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Read-Only Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="rounded-xl bg-slate-50/80 border border-slate-100 p-3.5">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1 flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Role & Privileges
            </span>
            <p className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {roleLabel}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50/80 border border-slate-100 p-3.5">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Member Since
            </span>
            <p className="text-sm font-bold text-slate-700">{joinedDate}</p>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving || !hasChanges || !profileName.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SECURITY TAB (Unified Email + Password OTP Flow)
// ═══════════════════════════════════════════════════════════
function SecurityTab({
  user,
  setSession,
}: {
  user: User | null;
  setSession: (token: string, user: User) => void;
}) {
  const [targetEmail, setTargetEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpStep, setOtpStep] = useState<"IDLE" | "OTP_SENT">("IDLE");
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Step 1: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!targetEmail.trim() && !newPassword.trim()) {
      setError("Please enter a new email or new password to proceed");
      return;
    }

    setRequestingOtp(true);
    try {
      const res = await apiClient<{ message?: string; targetEmail?: string }>(
        "/users/profile/request-otp",
        {
          method: "POST",
          body: JSON.stringify({
            newEmail: targetEmail.trim() || undefined,
          }),
        }
      );
      if (res.success) {
        setOtpStep("OTP_SENT");
        setSuccess(res.data?.message || "OTP verification code sent! Check your email inbox.");
      } else {
        setError(res.error || "Failed to request security OTP");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "OTP request failed");
    } finally {
      setRequestingOtp(false);
    }
  };

  // Step 2: Verify OTP and commit changes
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!otpCode.trim()) {
      setError("Please enter the 6-digit OTP code");
      return;
    }

    setVerifying(true);
    try {
      const res = await apiClient<{ token: string; user: User }>("/users/profile/security", {
        method: "PUT",
        body: JSON.stringify({
          otpCode: otpCode.trim(),
          newPassword: newPassword.trim() || undefined,
        }),
      });
      if (res.success && res.data) {
        setSession(res.data.token, res.data.user);
        setOtpStep("IDLE");
        setOtpCode("");
        setNewPassword("");
        setTargetEmail("");
        setSuccess("Security credentials updated successfully!");
        setTimeout(() => setSuccess(""), 5000);
      } else {
        setError(res.error || "Failed to verify OTP");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900">Security & Authentication</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Change your email address or password — both require OTP verification for security
        </p>
      </div>

      {error && <StatusBanner message={error} type="error" />}
      {success && <StatusBanner message={success} type="success" />}

      {/* Current Account Info */}
      <div className="rounded-xl bg-slate-50/80 border border-slate-100 p-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#0F4C75] to-[#3282B8] text-xs font-bold text-white shadow-sm">
          <Lock className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-700">Current Email</p>
          <p className="font-mono text-sm text-slate-600">{user?.email || "—"}</p>
        </div>
      </div>

      {otpStep === "IDLE" ? (
        <form onSubmit={handleRequestOtp} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-blue-600" />
              New Email Address
              <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="email"
              value={targetEmail}
              onChange={(e) => setTargetEmail(e.target.value)}
              placeholder="Enter new email address"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              An OTP code will be sent to the new address to verify inbox ownership
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                and / or
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-blue-600" />
              New Password
              <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (min 6 characters)"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
            />
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={requestingOtp || (!targetEmail.trim() && !newPassword.trim())}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
            >
              {requestingOtp ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Sending OTP...
                </>
              ) : (
                <>
                  <KeyRound className="h-3.5 w-3.5" />
                  Request Security OTP
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-5">
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100">
            <p className="text-xs font-bold text-blue-800">Enter Verification Code</p>
            <p className="text-[11px] text-blue-600 mt-0.5">
              A 6-digit OTP code has been sent to your email. Enter it below to confirm changes.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              6-Digit Verification Code
            </label>
            <input
              type="text"
              maxLength={6}
              required
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="e.g. 123456"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-center font-mono text-xl font-bold text-slate-900 tracking-[0.3em] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={verifying || otpCode.length !== 6}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
            >
              {verifying ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Verify & Commit
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setOtpStep("IDLE");
                setOtpCode("");
                setError("");
                setSuccess("");
              }}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// META SETTINGS TAB (Admin & Team Lead only)
// ═══════════════════════════════════════════════════════════
function MetaSettingsTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [wabaId, setWabaId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient<TenantSettings>("/settings");
        if (res.success && res.data) {
          setWabaId(res.data.wabaId || "");
          setAccessToken(res.data.metaAccessToken || "");
          setPhoneNumberId(res.data.metaPhoneNumberId || "");
        }
      } catch (err) {
        console.error("Failed to load Meta settings:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      await apiClient("/settings", {
        method: "PUT",
        body: JSON.stringify({
          wabaId: wabaId || null,
          metaAccessToken: accessToken || null,
          metaPhoneNumberId: phoneNumberId || null,
        }),
      });
      setMessage("success:Meta API credentials saved successfully!");
      setTimeout(() => setMessage(""), 4000);
    } catch (err: unknown) {
      setMessage(`error:${err instanceof Error ? err.message : "Failed to save settings"}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-7 w-7 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900">Meta WhatsApp Business API</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Connect your Meta Cloud API account to send & receive official WhatsApp messages
        </p>
      </div>

      {message && (
        <StatusBanner
          message={message.split(":").slice(1).join(":")}
          type={message.startsWith("success") ? "success" : "error"}
        />
      )}

      <div className="space-y-5">
        {/* WABA ID */}
        <div>
          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-1.5">
            <Smartphone className="h-3.5 w-3.5 text-blue-600" />
            WhatsApp Business Account ID (WABA)
          </label>
          <input
            type="text"
            value={wabaId}
            onChange={(e) => setWabaId(e.target.value)}
            placeholder="e.g. 123456789012345"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
          />
          <p className="mt-1 text-[11px] text-slate-400">
            Found in Meta Business Suite → WhatsApp Manager → Business Account Settings
          </p>
        </div>

        {/* Access Token */}
        <div>
          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-1.5">
            <Key className="h-3.5 w-3.5 text-blue-600" />
            Meta Access Token
          </label>
          <input
            type="password"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            placeholder="••••••••••••••••"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
          />
          <p className="mt-1 text-[11px] text-slate-400">
            Permanent system user token with whatsapp_business_messaging permission
          </p>
        </div>

        {/* Phone Number ID */}
        <div>
          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-1.5">
            <Smartphone className="h-3.5 w-3.5 text-blue-600" />
            Phone Number ID
          </label>
          <input
            type="text"
            value={phoneNumberId}
            onChange={(e) => setPhoneNumberId(e.target.value)}
            placeholder="e.g. 109876543210123"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
          />
        </div>
      </div>

      <div className="pt-1">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
        >
          <Save className="h-3.5 w-3.5" />
          {saving ? "Saving..." : "Save Meta Settings"}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN ACCOUNT SETTINGS PAGE (Tabbed Sidebar Layout)
// ═══════════════════════════════════════════════════════════
export default function AccountSettingsPage() {
  const { user, updateUser, setSession, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  const isPrivileged = ["ADMIN", "TEAM_LEAD"].includes(user?.role || "");

  const tabs: {
    id: SettingsTab;
    label: string;
    icon: typeof UserIcon;
    allowed: boolean;
  }[] = [
    { id: "profile", label: "Profile Data", icon: UserIcon, allowed: true },
    { id: "security", label: "Security", icon: Lock, allowed: true },
    { id: "meta", label: "Meta Settings", icon: Smartphone, allowed: isPrivileged },
  ];

  const visibleTabs = tabs.filter((t) => t.allowed);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      logout();
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-16">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Shield className="h-6 w-6 text-blue-600" />
          Account Settings
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your profile, security credentials, and CRM configurations
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* ─── Left Sidebar Tab Navigation ─── */}
        <nav className="w-full md:w-56 flex-shrink-0">
          <div className="md:sticky md:top-8">
            {/* Desktop: Vertical tab list */}
            <div className="hidden md:block">
              <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-3">
                Account
              </h2>
              <div className="space-y-1">
                {visibleTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center justify-between w-full gap-3 px-3 py-2.5 rounded-xl text-left transition-all group cursor-pointer ${
                        isActive
                          ? "bg-blue-50 text-blue-700 border-l-[3px] border-blue-600 shadow-sm"
                          : "text-slate-600 border-l-[3px] border-transparent hover:bg-slate-50 hover:text-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={`h-[18px] w-[18px] shrink-0 transition-colors ${
                            isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                          }`}
                        />
                        <span className="text-sm font-semibold">{tab.label}</span>
                      </div>
                      <ChevronRight
                        className={`h-3.5 w-3.5 shrink-0 transition-all ${
                          isActive
                            ? "text-blue-500 opacity-100"
                            : "text-slate-300 opacity-0 group-hover:opacity-100"
                        }`}
                      />
                    </button>
                  );
                })}

                {/* Log Out Button (separate styling) */}
                <div className="pt-3 mt-3 border-t border-slate-100">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-all cursor-pointer group"
                  >
                    <LogOut className="h-[18px] w-[18px] shrink-0 text-red-400 group-hover:text-red-600 transition-colors" />
                    <span className="text-sm font-semibold">Log Out</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile: Horizontal scrollable pills */}
            <div className="md:hidden flex items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1">
              {visibleTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                      isActive
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                );
              })}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap bg-white text-red-600 border border-red-200 hover:bg-red-50 transition-all shrink-0 cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                Log Out
              </button>
            </div>
          </div>
        </nav>

        {/* ─── Right Content Panel ─── */}
        <main className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
            {activeTab === "profile" && (
              <ProfileTab user={user} updateUser={updateUser} />
            )}
            {activeTab === "security" && (
              <SecurityTab user={user} setSession={setSession} />
            )}
            {activeTab === "meta" && <MetaSettingsTab />}
          </div>
        </main>
      </div>
    </div>
  );
}
