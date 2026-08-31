import { useState, useEffect } from 'react';
import { apiClient } from './api/client';

export default function Settings() {
  const [settings, setSettings] = useState({
    name: '',
    wabaId: '',
    metaPhoneNumberId: '',
    metaAccessToken: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await apiClient('/settings');
        setSettings({
          name: res.data.name || '',
          wabaId: res.data.wabaId || '',
          metaPhoneNumberId: res.data.metaPhoneNumberId || '',
          metaAccessToken: res.data.metaAccessToken || ''
        });
      } catch (err) {
        setError(err.message || 'Failed to load organization settings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);
    setError(null);

    try {
      await apiClient('/settings', {
        method: 'PUT',
        body: JSON.stringify(settings)
      });
      setMessage('Meta API credentials and organization settings updated successfully!');
    } catch (err) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-[#075e54] font-semibold">Loading organization configuration...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans">
      <div className="bg-white p-6 border border-slate-200/80 rounded-2xl shadow-sm">
        <div className="mb-6 pb-4 border-b border-slate-100">
          <h2 className="text-xl font-bold text-[#075e54] flex items-center gap-2">
            <span>⚙️</span> Organization & WhatsApp Cloud API Settings
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure your Meta WhatsApp Cloud API credentials to enable direct outbound messaging and verify webhook routing.
          </p>
        </div>

        {message && (
          <div className="mb-6 p-4 bg-[#dcf8c6] border border-[#25d366]/40 text-[#075e54] rounded-xl text-sm font-bold">
            ✅ {message}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Organization Name
              </label>
              <input
                type="text"
                required
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium text-sm focus:ring-2 focus:ring-[#128c7e] focus:outline-none shadow-2xs"
                placeholder="e.g. Acme Agency Corp"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                WhatsApp Business Account ID (WABA ID)
              </label>
              <input
                type="text"
                value={settings.wabaId}
                onChange={(e) => setSettings({ ...settings, wabaId: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono text-sm focus:ring-2 focus:ring-[#128c7e] focus:outline-none shadow-2xs"
                placeholder="e.g. WABA_ID_TEST"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Maps incoming Meta webhooks to your tenant.</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Meta Phone Number ID
              </label>
              <input
                type="text"
                value={settings.metaPhoneNumberId}
                onChange={(e) => setSettings({ ...settings, metaPhoneNumberId: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono text-sm focus:ring-2 focus:ring-[#128c7e] focus:outline-none shadow-2xs"
                placeholder="e.g. 104829104928192"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Found under Meta App Dashboard → WhatsApp → API Setup.</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                System User Permanent Access Token
              </label>
              <input
                type="password"
                value={settings.metaAccessToken}
                onChange={(e) => setSettings({ ...settings, metaAccessToken: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono text-sm focus:ring-2 focus:ring-[#128c7e] focus:outline-none shadow-2xs"
                placeholder="EAAG..."
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Requires `whatsapp_business_messaging` permission.</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-[#128c7e] hover:bg-[#075e54] text-white font-bold text-sm rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? 'Saving Configuration...' : 'Save Meta Credentials'}
            </button>
          </div>
        </form>
      </div>

      {/* Webhook Configuration Guide Card */}
      <div className="bg-[#075e54] text-white p-6 rounded-2xl shadow-sm border border-[#128c7e]/30 space-y-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <span>📡</span> Meta Webhook Ingestion Configuration
        </h3>
        <p className="text-xs text-emerald-100/90 leading-relaxed">
          Configure this Webhook Callback URL in Meta Developer Portal and subscribe to the <code className="bg-[#128c7e] text-white px-1.5 py-0.5 rounded text-xs font-mono">messages</code> field:
        </p>
        <div className="bg-black/20 p-3.5 rounded-xl border border-white/10 font-mono text-xs text-emerald-50 break-all space-y-1">
          <p><span className="text-emerald-300 font-semibold">Callback URL:</span> https://your-domain.com/api/webhook</p>
          <p><span className="text-emerald-300 font-semibold">Verify Token:</span> test_token</p>
        </div>
      </div>
    </div>
  );
}
