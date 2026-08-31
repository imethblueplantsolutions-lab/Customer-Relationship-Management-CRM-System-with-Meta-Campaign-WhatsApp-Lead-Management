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
    return <div className="p-8 text-center text-slate-600 font-medium">Loading organization configuration...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 border border-slate-200 rounded-xl shadow-sm">
        <div className="mb-6 pb-4 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">Organization & Meta API Settings</h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure your WhatsApp Cloud API credentials to enable outbound messaging and verify webhook routing.
          </p>
        </div>

        {message && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm font-medium">
            ✅ {message}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Organization Name
              </label>
              <input
                type="text"
                required
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium text-sm focus:ring-2 focus:ring-blue-500 shadow-sm"
                placeholder="e.g. Acme Agency Corp"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                WhatsApp Business Account ID (WABA ID)
              </label>
              <input
                type="text"
                value={settings.wabaId}
                onChange={(e) => setSettings({ ...settings, wabaId: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono text-sm focus:ring-2 focus:ring-blue-500 shadow-sm"
                placeholder="e.g. WABA_ID_TEST"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Used to identify tenant on incoming webhooks.</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Meta Phone Number ID
              </label>
              <input
                type="text"
                value={settings.metaPhoneNumberId}
                onChange={(e) => setSettings({ ...settings, metaPhoneNumberId: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono text-sm focus:ring-2 focus:ring-blue-500 shadow-sm"
                placeholder="e.g. 104829104928192"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Found in Meta App Dashboard → WhatsApp → API Setup.</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Permanent System User Access Token
              </label>
              <input
                type="password"
                value={settings.metaAccessToken}
                onChange={(e) => setSettings({ ...settings, metaAccessToken: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono text-sm focus:ring-2 focus:ring-blue-500 shadow-sm"
                placeholder="EAAG..."
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Requires `whatsapp_business_messaging` permission.</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? 'Saving Configuration...' : 'Save Meta Credentials'}
            </button>
          </div>
        </form>
      </div>

      {/* Webhook Configuration Guide Card */}
      <div className="bg-slate-900 text-white p-6 rounded-xl shadow-sm border border-slate-800 space-y-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <span>📡</span> Meta Webhook Configuration Details
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          In your Meta Developer App, configure your Webhook URL with the endpoint below and subscribe to the <code className="bg-slate-800 text-blue-300 px-1.5 py-0.5 rounded text-xs">messages</code> field:
        </p>
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs text-slate-200 break-all space-y-1">
          <p><span className="text-slate-400">Callback URL:</span> https://your-domain.com/api/webhook</p>
          <p><span className="text-slate-400">Verify Token:</span> test_token</p>
        </div>
      </div>
    </div>
  );
}
