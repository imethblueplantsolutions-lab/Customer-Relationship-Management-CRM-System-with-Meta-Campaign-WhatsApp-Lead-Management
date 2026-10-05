"use client";

import { useState } from "react";
import {
  Bell,
  Mail,
  Smartphone,
  Volume2,
  CheckCircle2,
  Save,
  Shield,
  Clock,
  Sparkles,
} from "lucide-react";

export default function NotificationPreferencesTab() {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [leadAssignment, setLeadAssignment] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(false);
  const [waNotifications, setWaNotifications] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 3000);
    }, 600);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center gap-2.5 pb-6 border-b border-slate-200">
        <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
          <Bell className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Notification Preferences
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure how and when you receive lead updates, deal celebrations, and system alerts.
          </p>
        </div>
      </div>

      {savedMessage && (
        <div className="rounded-xl p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Notification preferences have been successfully updated!</span>
        </div>
      )}

      {/* Sections */}
      <div className="space-y-6">
        {/* Email Alerts */}
        <div className="rounded-2xl border border-slate-200 p-5 bg-white space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
            <Mail className="h-4 w-4 text-blue-600" />
            Email Notifications
          </div>

          <div className="divide-y divide-slate-100">
            <label className="flex items-center justify-between py-3 cursor-pointer">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  New Lead Assigned
                </p>
                <p className="text-xs text-slate-500">
                  Receive an immediate email alert when an incoming lead is assigned to you
                </p>
              </div>
              <input
                type="checkbox"
                checked={leadAssignment}
                onChange={(e) => setLeadAssignment(e.target.checked)}
                className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between py-3 cursor-pointer">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Hot Lead Activity Alerts
                </p>
                <p className="text-xs text-slate-500">
                  Notify when a high-value prospect responds or views quote details
                </p>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between py-3 cursor-pointer">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Daily Pipeline Summary
                </p>
                <p className="text-xs text-slate-500">
                  A morning briefing of upcoming follow-ups and scheduled reminders
                </p>
              </div>
              <input
                type="checkbox"
                checked={dailyDigest}
                onChange={(e) => setDailyDigest(e.target.checked)}
                className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* WhatsApp & In-App Alerts */}
        <div className="rounded-2xl border border-slate-200 p-5 bg-white space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
            <Smartphone className="h-4 w-4 text-emerald-600" />
            WhatsApp & Real-Time In-App Alerts
          </div>

          <div className="divide-y divide-slate-100">
            <label className="flex items-center justify-between py-3 cursor-pointer">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  WhatsApp Cloud Inbound Notifications
                </p>
                <p className="text-xs text-slate-500">
                  Notify instantly when customers reply to your Meta template messages
                </p>
              </div>
              <input
                type="checkbox"
                checked={waNotifications}
                onChange={(e) => setWaNotifications(e.target.checked)}
                className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between py-3 cursor-pointer">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Browser Push Notifications
                </p>
                <p className="text-xs text-slate-500">
                  Show desktop banner alerts even when the CRM tab is in the background
                </p>
              </div>
              <input
                type="checkbox"
                checked={pushAlerts}
                onChange={(e) => setPushAlerts(e.target.checked)}
                className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between py-3 cursor-pointer">
              <div>
                <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                  <Volume2 className="h-4 w-4 text-amber-500" />
                  Deal Win Audio Celebration
                </p>
                <p className="text-xs text-slate-500">
                  Play cheerful audio chime and launch confetti when a deal is closed won
                </p>
              </div>
              <input
                type="checkbox"
                checked={soundEffects}
                onChange={(e) => setSoundEffects(e.target.checked)}
                className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
        >
          <Save className="h-3.5 w-3.5" />
          {saving ? "Saving Preferences..." : "Save Preferences"}
        </button>
      </div>
    </div>
  );
}
