"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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
  History,
  ArrowLeft,
  Palette,
  Bell,
  Sliders,
  AlertTriangle,
  Webhook,
  Building2,
  ShieldAlert,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import ActivityFeed from "@/components/hierarchy/ActivityFeed";
import ThemeOptionsTab from "@/components/settings/ThemeOptionsTab";
import NotificationPreferencesTab from "@/components/settings/NotificationPreferencesTab";
import IntegrationsTab from "@/components/settings/IntegrationsTab";
import DangerZoneTab from "@/components/settings/DangerZoneTab";

// ─── Types ─────────────────────────────────────────────────
export type SettingsTab = "account" | "theme" | "meta" | "audit";
export type AccountSubTab = "profile" | "security" | "notifications" | "integrations" | "danger";

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
    user?.role === "SUPER_ADMIN"
      ? "Super Administrator"
      : user?.role === "ADMIN"
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
        <h3 className="text-lg font-bold text-brand-text">Edit your profile</h3>
        <p className="text-xs text-brand-muted mt-0.5">
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
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-4 rounded-2xl bg-brand-bg/50 border border-brand-muted/30">
          <div className="relative group shrink-0">
            {avatar ? (
              <img
                src={avatar}
                alt="Profile avatar"
                className="h-20 w-20 rounded-2xl object-cover ring-4 ring-brand-surface shadow-md"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-primary to-brand-accent text-2xl font-bold text-white shadow-md ring-4 ring-brand-surface">
                {userInitial}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-brand-primary text-white shadow-md hover:bg-brand-accent transition-colors cursor-pointer"
              title="Upload new picture"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div>
              <h4 className="text-xs font-bold text-brand-text">Profile Photo</h4>
              <p className="text-[11px] text-brand-muted">
                JPG, PNG, or WebP. Auto-scaled to 200×200px under 30KB.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-brand-muted/30 bg-brand-surface px-3 py-1.5 text-xs font-semibold text-brand-text shadow-xs hover:bg-brand-bg hover:border-brand-muted/50 transition-all cursor-pointer"
              >
                <Upload className="h-3 w-3 text-brand-muted" />
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
            <label className="text-xs font-bold text-brand-text block mb-1.5 flex items-center gap-1">
              <UserIcon className="h-3 w-3 text-brand-muted" />
              Full Name
            </label>
            <input
              type="text"
              required
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full rounded-xl border border-brand-muted/30 bg-brand-bg/40 px-4 py-2.5 text-sm font-medium text-brand-text placeholder-brand-muted focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-brand-text block mb-1.5 flex items-center gap-1">
              <Mail className="h-3 w-3 text-brand-muted" />
              Email Address
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-xl bg-brand-bg/60 border border-brand-muted/30 px-4 py-2.5 font-mono text-sm text-brand-muted truncate">
                {user?.email || "—"}
              </div>
              <span className="text-[10px] font-bold text-brand-muted bg-brand-bg rounded-lg px-2.5 py-1 shrink-0">
                Read-only
              </span>
            </div>
          </div>
        </div>

        {/* Phone and Bio */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-brand-text block mb-1.5 flex items-center gap-1">
              <Phone className="h-3 w-3 text-brand-muted" />
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +1 (555) 000-0000"
              className="w-full rounded-xl border border-brand-muted/30 bg-brand-bg/40 px-4 py-2.5 text-sm font-medium text-brand-text placeholder-brand-muted focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:outline-none transition-all"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-brand-text block">
                Bio / About
              </label>
              <span className="text-[11px] text-brand-muted font-mono">
                {bio.length}/250
              </span>
            </div>
            <textarea
              rows={3}
              maxLength={250}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A short description about yourself, your role, or expertise..."
              className="w-full rounded-xl border border-brand-muted/30 bg-brand-bg/40 px-4 py-2.5 text-sm font-medium text-brand-text placeholder-brand-muted focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:outline-none transition-all resize-none"
            />
          </div>
        </div>

        {/* Read-Only Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="rounded-xl bg-brand-bg/50 border border-brand-muted/30 p-3.5">
            <span className="text-[10px] uppercase tracking-wider font-bold text-brand-muted block mb-1 flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Role & Privileges
            </span>
            <p className="text-sm font-bold text-brand-text flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {roleLabel}
            </p>
          </div>
          <div className="rounded-xl bg-brand-bg/50 border border-brand-muted/30 p-3.5">
            <span className="text-[10px] uppercase tracking-wider font-bold text-brand-muted block mb-1 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Member Since
            </span>
            <p className="text-sm font-bold text-brand-text">{joinedDate}</p>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving || !hasChanges || !profileName.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-brand-accent active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>

      {/* ─── Company Organization Profile Section ─── */}
      <CompanyProfileSection user={user} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// COMPANY PROFILE SECTION (Organization Details & RBAC)
// ═══════════════════════════════════════════════════════════
function CompanyProfileSection({ user }: { user: User | null }) {
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [isCompanyLoading, setIsCompanyLoading] = useState(true);
  const [isCompanySaving, setIsCompanySaving] = useState(false);

  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(user?.role || "");

  useEffect(() => {
    let isMounted = true;
    const fetchCompanyProfile = async () => {
      setIsCompanyLoading(true);
      try {
        const res = await apiClient<{ companyName?: string; companyAddress?: string }>("/tenant/profile");
        if (res.success && res.data && isMounted) {
          setCompanyName(res.data.companyName || "");
          setCompanyAddress(res.data.companyAddress || "");
        }
      } catch (err) {
        console.error("Failed to load company profile:", err);
      } finally {
        if (isMounted) {
          setIsCompanyLoading(false);
        }
      }
    };

    fetchCompanyProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      toast.error("Company Name is required");
      return;
    }

    setIsCompanySaving(true);
    try {
      const res = await apiClient<{ companyName: string; companyAddress: string }>("/tenant/profile", {
        method: "PUT",
        body: JSON.stringify({
          companyName: companyName.trim(),
          companyAddress: companyAddress.trim() || null,
        }),
      });

      if (res.success) {
        toast.success("Company profile updated successfully!");
        if (res.data?.companyName) {
          setCompanyName(res.data.companyName);
        }
        if (res.data?.companyAddress !== undefined) {
          setCompanyAddress(res.data.companyAddress || "");
        }
      } else {
        toast.error(res.error || "Failed to update company profile");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error saving company profile");
    } finally {
      setIsCompanySaving(false);
    }
  };

  return (
    <div className="bg-brand-surface border border-brand-muted/30 rounded-xl p-6 space-y-5 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-brand-muted/20">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary shrink-0">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-brand-text">Company Organization Profile</h3>
            <p className="text-xs text-brand-muted mt-0.5">
              Workspace business identity, official title, and registered company address
            </p>
          </div>
        </div>

        {isAdmin ? (
          <span className="inline-flex items-center gap-1.5 self-start sm:self-center text-[10px] font-bold text-brand-primary bg-brand-primary/10 border border-brand-primary/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
            <Shield className="h-3 w-3" /> Admin Editable
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 self-start sm:self-center text-[10px] font-bold text-brand-muted bg-brand-bg border border-brand-muted/30 px-2.5 py-1 rounded-full uppercase tracking-wider">
            <Lock className="h-3 w-3" /> Read-Only Workspace
          </span>
        )}
      </div>

      {isCompanyLoading ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-brand-primary" />
        </div>
      ) : isAdmin ? (
        /* Admin View: Editable form */
        <form onSubmit={handleSaveCompany} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-brand-text block mb-1.5 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-brand-primary" />
              Company Name
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Acme Corporation Pvt Ltd"
              className="w-full rounded-xl border border-brand-muted/30 bg-brand-bg/40 px-4 py-2.5 text-sm font-medium text-brand-text placeholder-brand-muted focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-brand-text block mb-1.5 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-brand-primary" />
              Company Address
            </label>
            <textarea
              rows={3}
              value={companyAddress}
              onChange={(e) => setCompanyAddress(e.target.value)}
              placeholder="e.g. 123 Enterprise Blvd, Suite 400, New York, NY 10001"
              className="w-full rounded-xl border border-brand-muted/30 bg-brand-bg/40 px-4 py-2.5 text-sm font-medium text-brand-text placeholder-brand-muted focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:outline-none transition-all resize-none"
            />
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={isCompanySaving || !companyName.trim()}
              className="bg-brand-primary hover:bg-brand-accent text-white px-4 py-2 rounded-lg font-bold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 inline-flex items-center gap-2"
            >
              {isCompanySaving ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Saving Company Profile...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  Save Company Profile
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        /* Non-Admin View: Read-only display with amber banner */
        <div className="space-y-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50/90 dark:border-amber-800 dark:bg-amber-950/40 p-3.5 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
            <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <span>Company profile details are managed by your workspace Administrator. Contact an administrator to update this information.</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-xs font-bold text-brand-muted block mb-1.5 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-brand-muted" />
                Company Name
              </label>
              <div className="text-brand-text bg-brand-bg/50 border border-brand-muted/20 p-3 rounded-lg text-sm font-semibold">
                {companyName || "Not configured yet"}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-brand-muted block mb-1.5 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-brand-muted" />
                Company Address
              </label>
              <div className="text-brand-text bg-brand-bg/50 border border-brand-muted/20 p-3 rounded-lg text-sm whitespace-pre-wrap">
                {companyAddress || "No official address recorded"}
              </div>
            </div>
          </div>
        </div>
      )}
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
        <h3 className="text-lg font-bold text-brand-text">Security & Authentication</h3>
        <p className="text-xs text-brand-muted mt-0.5">
          Change your email address or password — both require OTP verification for security
        </p>
      </div>

      {error && <StatusBanner message={error} type="error" />}
      {success && <StatusBanner message={success} type="success" />}

      {/* Current Account Info */}
      <div className="rounded-xl bg-brand-bg/50 border border-brand-muted/30 p-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-primary to-brand-accent text-xs font-bold text-white shadow-sm">
          <Lock className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs font-bold text-brand-text">Current Email</p>
          <p className="font-mono text-sm text-brand-muted">{user?.email || "—"}</p>
        </div>
      </div>

      {otpStep === "IDLE" ? (
        <form onSubmit={handleRequestOtp} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-brand-text mb-1.5 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-brand-primary" />
              New Email Address
              <span className="text-brand-muted font-normal">(optional)</span>
            </label>
            <input
              type="email"
              value={targetEmail}
              onChange={(e) => setTargetEmail(e.target.value)}
              placeholder="Enter new email address"
              className="w-full rounded-xl border border-brand-muted/30 bg-brand-bg/40 px-4 py-2.5 text-sm font-medium text-brand-text placeholder-brand-muted focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:outline-none transition-all"
            />
            <p className="text-[11px] text-brand-muted mt-1">
              An OTP code will be sent to the new address to verify inbox ownership
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-brand-muted/30" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-brand-surface px-3 text-[10px] font-bold text-brand-muted uppercase tracking-wider">
                and / or
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-text mb-1.5 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-brand-primary" />
              New Password
              <span className="text-brand-muted font-normal">(optional)</span>
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (min 6 characters)"
              className="w-full rounded-xl border border-brand-muted/30 bg-brand-bg/40 px-4 py-2.5 text-sm font-medium text-brand-text placeholder-brand-muted focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:outline-none transition-all"
            />
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={requestingOtp || (!targetEmail.trim() && !newPassword.trim())}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-brand-accent active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
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
          <div className="p-4 rounded-xl bg-brand-primary/10 border border-brand-primary/20">
            <p className="text-xs font-bold text-brand-primary">Enter Verification Code</p>
            <p className="text-[11px] text-brand-muted mt-0.5">
              A 6-digit OTP code has been sent to your email. Enter it below to confirm changes.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-text uppercase tracking-wider mb-1.5">
              6-Digit Verification Code
            </label>
            <input
              type="text"
              maxLength={6}
              required
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="e.g. 123456"
              className="w-full rounded-xl border border-brand-muted/30 bg-brand-bg/40 px-4 py-3 text-center font-mono text-xl font-bold text-brand-text tracking-[0.3em] placeholder-brand-muted focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={verifying || otpCode.length !== 6}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-brand-accent active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
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
              className="px-4 py-2.5 rounded-xl border border-brand-muted/30 text-xs font-bold text-brand-muted hover:bg-brand-bg/60 hover:text-brand-text transition-colors cursor-pointer"
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
        <div className="h-7 w-7 animate-spin rounded-full border-3 border-brand-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-brand-text">Meta WhatsApp Business API</h3>
        <p className="text-xs text-brand-muted mt-0.5">
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
          <label className="flex items-center gap-2 text-xs font-bold text-brand-text mb-1.5">
            <Smartphone className="h-3.5 w-3.5 text-brand-primary" />
            WhatsApp Business Account ID (WABA)
          </label>
          <input
            type="text"
            value={wabaId}
            onChange={(e) => setWabaId(e.target.value)}
            placeholder="e.g. 123456789012345"
            className="w-full rounded-xl border border-brand-muted/30 bg-brand-bg/40 px-4 py-2.5 text-sm text-brand-text placeholder-brand-muted focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:outline-none transition-all"
          />
          <p className="mt-1 text-[11px] text-brand-muted">
            Found in Meta Business Suite → WhatsApp Manager → Business Account Settings
          </p>
        </div>

        {/* Access Token */}
        <div>
          <label className="flex items-center gap-2 text-xs font-bold text-brand-text mb-1.5">
            <Key className="h-3.5 w-3.5 text-brand-primary" />
            Meta Access Token
          </label>
          <input
            type="password"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            placeholder="••••••••••••••••"
            className="w-full rounded-xl border border-brand-muted/30 bg-brand-bg/40 px-4 py-2.5 text-sm text-brand-text placeholder-brand-muted focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:outline-none transition-all"
          />
          <p className="mt-1 text-[11px] text-brand-muted">
            Permanent system user token with whatsapp_business_messaging permission
          </p>
        </div>

        {/* Phone Number ID */}
        <div>
          <label className="flex items-center gap-2 text-xs font-bold text-brand-text mb-1.5">
            <Smartphone className="h-3.5 w-3.5 text-brand-primary" />
            Phone Number ID
          </label>
          <input
            type="text"
            value={phoneNumberId}
            onChange={(e) => setPhoneNumberId(e.target.value)}
            placeholder="e.g. 109876543210123"
            className="w-full rounded-xl border border-brand-muted/30 bg-brand-bg/40 px-4 py-2.5 text-sm text-brand-text placeholder-brand-muted focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:outline-none transition-all"
          />
        </div>
      </div>

      <div className="pt-1">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-brand-accent active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
        >
          <Save className="h-3.5 w-3.5" />
          {saving ? "Saving..." : "Save Meta Settings"}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ACCOUNT SETTINGS TAB CONTAINER (With Inner Sub-Tabs)
// ═══════════════════════════════════════════════════════════
function AccountSettingsTab({
  user,
  updateUser,
  setSession,
  onNavigateToMeta,
  onLogout,
  initialSubTab = "profile",
}: {
  user: User | null;
  updateUser: (data: Partial<User>) => void;
  setSession: (token: string, user: User) => void;
  onNavigateToMeta: () => void;
  onLogout: () => void;
  initialSubTab?: AccountSubTab;
}) {
  const [subTab, setSubTab] = useState<AccountSubTab>(initialSubTab);

  const subTabs: {
    id: AccountSubTab;
    label: string;
    icon: typeof UserIcon;
    badge?: string;
  }[] = [
    { id: "profile", label: "Profile Data", icon: UserIcon },
    { id: "security", label: "Security & Passwords", icon: Lock },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "integrations", label: "Connected Accounts", icon: Webhook },
    { id: "danger", label: "Danger Zone & Export", icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      {/* Sub-Tabs Pill Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 border-b border-brand-muted/30 -mx-1 px-1 scrollbar-none">
        {subTabs.map((t) => {
          const Icon = t.icon;
          const isActive = subTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setSubTab(t.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? "bg-brand-primary text-white shadow-xs shadow-brand-primary/20"
                  : "text-brand-muted hover:text-brand-text hover:bg-brand-surface bg-brand-bg/60 border border-brand-muted/30"
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${isActive ? "text-white" : "text-brand-muted"}`} />
              <span>{t.label}</span>
              {t.badge && (
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                    isActive ? "bg-white/20 text-white" : "bg-brand-primary/10 text-brand-primary"
                  }`}
                >
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Sub-tab view render */}
      <div className="pt-1">
        {subTab === "profile" && <ProfileTab user={user} updateUser={updateUser} />}
        {subTab === "security" && <SecurityTab user={user} setSession={setSession} />}
        {subTab === "notifications" && <NotificationPreferencesTab />}
        {subTab === "integrations" && <IntegrationsTab onNavigateToMeta={onNavigateToMeta} />}
        {subTab === "danger" && <DangerZoneTab user={user} onLogout={onLogout} />}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN SETTINGS PAGE (Account Settings + Theme Options Hub)
// ═══════════════════════════════════════════════════════════
export default function AccountSettingsPage() {
  const { user, updateUser, setSession, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam === "theme") {
        setActiveTab("theme");
      } else if (tabParam === "meta") {
        setActiveTab("meta");
      } else if (tabParam === "audit") {
        setActiveTab("audit");
      } else if (tabParam === "account" || tabParam === "profile" || tabParam === "security") {
        setActiveTab("account");
      }
    }
  }, []);

  const isPrivileged = ["SUPER_ADMIN", "ADMIN", "TEAM_LEAD"].includes(user?.role || "");

  const tabs: {
    id: SettingsTab;
    label: string;
    description: string;
    icon: typeof UserIcon;
    badge?: string;
    allowed: boolean;
  }[] = [
    {
      id: "account",
      label: "Account Settings",
      description: "Profile, Security & Preferences",
      icon: Sliders,
      allowed: true,
    },
    {
      id: "theme",
      label: "Theme Options",
      description: "Color schemes & styling",
      icon: Palette,
      allowed: true,
    },
    {
      id: "meta",
      label: "Meta Settings",
      description: "WhatsApp Business API",
      icon: Smartphone,
      allowed: isPrivileged,
    },
    {
      id: "audit",
      label: "Audit Logs",
      description: "Activity & Security Trail",
      icon: History,
      allowed: ["SUPER_ADMIN", "ADMIN"].includes(user?.role || ""),
    },
  ];

  const visibleTabs = tabs.filter((t) => t.allowed);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      logout();
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-16">
      {/* Mobile Contextual Back Button */}
      <div className="md:hidden mb-4">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-surface border border-brand-muted/30 text-xs font-semibold text-brand-text hover:bg-brand-bg active:scale-95 transition-all shadow-xs cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 text-brand-muted" />
          Back to Dashboard
        </button>
      </div>

      {/* Page Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-text tracking-tight flex items-center gap-2.5">
            <Shield className="h-6 w-6 text-brand-primary" />
            CRM Settings & Workspace Options
          </h1>
          <p className="text-sm text-brand-muted mt-1">
            Manage your account credentials, workspace color themes, and WhatsApp API configurations
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* ─── Left Sidebar Tab Navigation ─── */}
        <nav className="w-full md:w-64 flex-shrink-0">
          <div className="md:sticky md:top-8">
            {/* Desktop: Vertical tab list */}
            <div className="hidden md:block">
              <h2 className="text-[10px] font-bold text-brand-muted uppercase tracking-wider mb-3 px-3">
                Workspace Preferences
              </h2>
              <div className="space-y-1.5">
                {visibleTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center justify-between w-full gap-3 px-3.5 py-3 rounded-xl text-left transition-all group cursor-pointer ${
                        isActive
                          ? "bg-brand-primary/10 text-brand-primary border-l-[3px] border-brand-primary shadow-xs"
                          : "text-brand-muted border-l-[3px] border-transparent hover:bg-brand-surface/60 hover:text-brand-text"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon
                          className={`h-5 w-5 shrink-0 transition-colors ${
                            isActive ? "text-brand-primary" : "text-brand-muted group-hover:text-brand-text"
                          }`}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold truncate">{tab.label}</span>
                            {tab.badge && (
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider ${
                                  isActive
                                    ? "bg-brand-primary text-white"
                                    : "bg-brand-primary/20 text-brand-primary"
                                }`}
                              >
                                {tab.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-brand-muted truncate mt-0.5">
                            {tab.description}
                          </p>
                        </div>
                      </div>
                      <ChevronRight
                        className={`h-3.5 w-3.5 shrink-0 transition-all ${
                          isActive
                            ? "text-brand-primary opacity-100"
                            : "text-brand-muted opacity-0 group-hover:opacity-100"
                        }`}
                      />
                    </button>
                  );
                })}

                {/* Log Out Button */}
                <div className="pt-3 mt-3 border-t border-brand-muted/30">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-xl text-red-600 hover:bg-red-500/10 transition-all cursor-pointer group"
                  >
                    <LogOut className="h-[18px] w-[18px] shrink-0 text-red-400 group-hover:text-red-600 transition-colors" />
                    <span className="text-sm font-semibold">Log Out</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile: Horizontal scrollable pills */}
            <div className="md:hidden flex items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none">
              {visibleTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                      isActive
                        ? "bg-brand-primary text-white shadow-md shadow-brand-primary/20"
                        : "bg-brand-surface text-brand-muted border border-brand-muted/30 hover:bg-brand-bg hover:text-brand-text"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-white/20 text-white">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* ─── Right Content Panel ─── */}
        <main className="flex-1 min-w-0">
          <div className="bg-brand-surface rounded-2xl border border-brand-muted/30 shadow-sm p-6 sm:p-8">
            {activeTab === "account" && (
              <AccountSettingsTab
                user={user}
                updateUser={updateUser}
                setSession={setSession}
                onNavigateToMeta={() => setActiveTab("meta")}
                onLogout={handleLogout}
              />
            )}
            {activeTab === "theme" && <ThemeOptionsTab />}
            {activeTab === "meta" && <MetaSettingsTab />}
            {activeTab === "audit" && <ActivityFeed />}
          </div>
        </main>
      </div>
    </div>
  );
}
