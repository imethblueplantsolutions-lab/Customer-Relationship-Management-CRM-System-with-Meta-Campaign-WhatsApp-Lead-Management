"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import type { User } from "@/types";
import { Save, Shield, Smartphone, Key, User as UserIcon, CheckCircle2 } from "lucide-react";

interface TenantSettings {
  id: string;
  name: string;
  wabaId: string | null;
  metaAccessToken: string | null;
  metaPhoneNumberId: string | null;
}

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [settings, setSettings] = useState<TenantSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState("");

  // Profile Form State
  const [profileName, setProfileName] = useState(user?.name || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");

  // Meta Credentials State
  const [wabaId, setWabaId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");

  const isPrivileged = ["ADMIN", "TEAM_LEAD"].includes(user?.role || "");

  useEffect(() => {
    if (user?.name) {
      setProfileName(user.name);
    }
  }, [user?.name]);

  useEffect(() => {
    (async () => {
      try {
        if (isPrivileged) {
          const res = await apiClient<TenantSettings>("/settings");
          if (res.success && res.data) {
            setSettings(res.data);
            setWabaId(res.data.wabaId || "");
            setAccessToken(res.data.metaAccessToken || "");
            setPhoneNumberId(res.data.metaPhoneNumberId || "");
          }
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [isPrivileged]);

  // Handle Profile Name Update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) return;

    setSavingProfile(true);
    setProfileMessage("");

    try {
      const res = await apiClient<User>("/users/profile", {
        method: "PUT",
        body: JSON.stringify({ name: profileName.trim() }),
      });

      if (res.success && res.data) {
        updateUser({ name: res.data.name });
        setProfileMessage("Account name updated successfully in real time!");
        setTimeout(() => setProfileMessage(""), 4000);
      } else {
        setProfileMessage("Failed to update profile name");
      }
    } catch (err: unknown) {
      setProfileMessage(err instanceof Error ? err.message : "Error saving profile");
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Meta WhatsApp API Settings Save
  const handleSaveSettings = async () => {
    setSavingSettings(true);
    setSettingsMessage("");
    try {
      await apiClient("/settings", {
        method: "PUT",
        body: JSON.stringify({
          wabaId: wabaId || null,
          metaAccessToken: accessToken || null,
          metaPhoneNumberId: phoneNumberId || null,
        }),
      });
      setSettingsMessage("Meta credentials saved successfully!");
      setTimeout(() => setSettingsMessage(""), 4000);
    } catch (err: unknown) {
      setSettingsMessage(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#128c7e] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl pb-16">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Account & Settings</h2>
        <p className="text-sm text-slate-500 mt-1">
          Manage your account profile and Meta WhatsApp CRM configurations
        </p>
      </div>

      {/* ─── 1. Account & Profile Section (Real-Time Updatable) ─── */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/70 px-7 py-4.5">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-[#128c7e]" />
            Account Profile
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Your name will be displayed on all timeline activities and assignment audits
          </p>
        </div>

        <form onSubmit={handleSaveProfile} className="p-7 space-y-4">
          {profileMessage && (
            <div
              className={`rounded-xl p-3 text-xs font-semibold flex items-center gap-2 ${
                profileMessage.includes("success")
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                  : "bg-red-50 border border-red-200 text-red-700"
              }`}
            >
              {profileMessage.includes("success") && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />}
              <span>{profileMessage}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Your Full Name / Account Name
            </label>
            <input
              type="text"
              required
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="e.g. Imeth Dewmina Rathnayaka"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-800 focus:border-[#128c7e] focus:ring-2 focus:ring-[#128c7e]/20 focus:outline-none transition-all"
            />
            <p className="text-[11px] text-slate-400 mt-1.5">
              This replaces generic placeholders like &quot;Jennifer&quot; with your actual account name across the timeline and CRM.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
                Account Email
              </span>
              <p className="font-mono text-xs text-slate-700 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                {user?.email || "—"}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
                Role & Privileges
              </span>
              <p className="text-xs font-bold text-slate-700 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                {user?.role === "ADMIN" ? "Administrator" : user?.role === "TEAM_LEAD" ? "Team Leader" : "Sales Agent"}
              </p>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={savingProfile}
              className="inline-flex items-center gap-2 rounded-xl bg-[#128c7e] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#075e54] transition-all disabled:opacity-50 cursor-pointer"
            >
              <Save className="h-3.5 w-3.5" />
              {savingProfile ? "Updating Profile..." : "Update Account Name"}
            </button>
          </div>
        </form>
      </div>

      {/* ─── 2. Meta WhatsApp API Credentials (Admin & Team Lead) ─── */}
      {isPrivileged ? (
        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden divide-y divide-slate-100">
          <div className="bg-slate-50/70 px-7 py-4.5">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-[#128c7e]" />
              Meta WhatsApp Business API Settings
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Connect your Meta Cloud API account to send & receive official WhatsApp messages
            </p>
          </div>

          {settingsMessage && (
            <div className="p-5">
              <div
                className={`rounded-xl p-3 text-xs font-semibold flex items-center gap-2 ${
                  settingsMessage.includes("success")
                    ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                    : "bg-red-50 border border-red-200 text-red-700"
                }`}
              >
                {settingsMessage.includes("success") && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />}
                <span>{settingsMessage}</span>
              </div>
            </div>
          )}

          {/* WABA ID */}
          <div className="p-7">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Smartphone className="h-4 w-4 text-[#128c7e]" />
              WhatsApp Business Account ID (WABA)
            </label>
            <input
              type="text"
              value={wabaId}
              onChange={(e) => setWabaId(e.target.value)}
              placeholder="e.g. 123456789012345"
              className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-[#128c7e] focus:ring-2 focus:ring-[#128c7e]/20 focus:outline-none"
            />
            <p className="mt-1.5 text-xs text-slate-400">
              Found in Meta Business Suite → WhatsApp Manager → Business Account Settings
            </p>
          </div>

          {/* Access Token */}
          <div className="p-7">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Key className="h-4 w-4 text-[#128c7e]" />
              Meta Access Token
            </label>
            <input
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="••••••••••••••••"
              className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-[#128c7e] focus:ring-2 focus:ring-[#128c7e]/20 focus:outline-none"
            />
            <p className="mt-1.5 text-xs text-slate-400">
              Permanent system user token with whatsapp_business_messaging permission
            </p>
          </div>

          {/* Phone Number ID */}
          <div className="p-7">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Smartphone className="h-4 w-4 text-[#128c7e]" />
              Phone Number ID
            </label>
            <input
              type="text"
              value={phoneNumberId}
              onChange={(e) => setPhoneNumberId(e.target.value)}
              placeholder="e.g. 109876543210123"
              className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-[#128c7e] focus:ring-2 focus:ring-[#128c7e]/20 focus:outline-none"
            />
          </div>

          <div className="p-7 bg-slate-50/50">
            <button
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="inline-flex items-center gap-2 rounded-xl bg-[#128c7e] px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#075e54] transition-all disabled:opacity-50 cursor-pointer"
            >
              <Save className="h-3.5 w-3.5" />
              {savingSettings ? "Saving Settings..." : "Save Meta Settings"}
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-6 text-center">
          <Shield className="mx-auto h-8 w-8 text-slate-400" />
          <h4 className="mt-2 text-sm font-bold text-slate-700">Meta API Settings Restricted</h4>
          <p className="mt-1 text-xs text-slate-500">
            Only Administrators and Team Leaders have access to Meta WhatsApp Business API credentials.
          </p>
        </div>
      )}
    </div>
  );
}
