"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import { Save, Shield, Smartphone, Key } from "lucide-react";

interface TenantSettings {
  id: string;
  name: string;
  wabaId: string | null;
  metaAccessToken: string | null;
  metaPhoneNumberId: string | null;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<TenantSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [wabaId, setWabaId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");

  const isPrivileged = ["ADMIN", "TEAM_LEAD"].includes(user?.role || "");

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient<TenantSettings>("/settings");
        if (res.success && res.data) {
          setSettings(res.data);
          setWabaId(res.data.wabaId || "");
          setAccessToken(res.data.metaAccessToken || "");
          setPhoneNumberId(res.data.metaPhoneNumberId || "");
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
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
      setMessage("Settings saved successfully!");
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#128c7e] border-t-transparent" />
      </div>
    );
  }

  if (!isPrivileged) {
    return (
      <div className="rounded-2xl bg-amber-50 border border-amber-200 p-8 text-center max-w-lg mx-auto mt-12">
        <Shield className="mx-auto h-10 w-10 text-amber-500" />
        <h3 className="mt-3 text-lg font-bold text-amber-800">Access Restricted</h3>
        <p className="mt-1 text-sm text-amber-600">
          Only Admin and Team Lead roles can access settings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Settings</h2>
        <p className="text-sm text-slate-500 mt-1">
          Configure Meta WhatsApp Business API credentials
        </p>
      </div>

      {message && (
        <div
          className={`rounded-xl p-3 text-sm font-medium ${
            message.includes("success")
              ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      <div className="rounded-2xl bg-white border border-slate-200/60 shadow-sm divide-y divide-slate-100">
        {/* WABA ID */}
        <div className="p-6">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Smartphone className="h-4 w-4 text-[#128c7e]" />
            WhatsApp Business Account ID (WABA)
          </label>
          <input
            type="text"
            value={wabaId}
            onChange={(e) => setWabaId(e.target.value)}
            placeholder="e.g. 123456789012345"
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:border-[#128c7e] focus:ring-2 focus:ring-[#128c7e]/20 focus:outline-none"
          />
          <p className="mt-1.5 text-xs text-slate-400">
            Found in Meta Business Suite → WhatsApp Manager → Business Account Settings
          </p>
        </div>

        {/* Access Token */}
        <div className="p-6">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Key className="h-4 w-4 text-[#128c7e]" />
            Meta Access Token
          </label>
          <input
            type="password"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            placeholder="••••••••••••••••"
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:border-[#128c7e] focus:ring-2 focus:ring-[#128c7e]/20 focus:outline-none"
          />
          <p className="mt-1.5 text-xs text-slate-400">
            Permanent system user token with whatsapp_business_messaging permission
          </p>
        </div>

        {/* Phone Number ID */}
        <div className="p-6">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Smartphone className="h-4 w-4 text-[#128c7e]" />
            Phone Number ID
          </label>
          <input
            type="text"
            value={phoneNumberId}
            onChange={(e) => setPhoneNumberId(e.target.value)}
            placeholder="e.g. 109876543210123"
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:border-[#128c7e] focus:ring-2 focus:ring-[#128c7e]/20 focus:outline-none"
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-xl bg-[#128c7e] px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-[#075e54] transition-all disabled:opacity-50 cursor-pointer"
      >
        <Save className="h-4 w-4" />
        {saving ? "Saving..." : "Save Settings"}
      </button>
    </div>
  );
}
