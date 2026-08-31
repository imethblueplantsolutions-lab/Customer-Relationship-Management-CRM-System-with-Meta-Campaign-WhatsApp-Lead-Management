import { useState } from 'react';
import { apiClient } from './api/client';

export default function AddLeadForm({ onLeadAdded }) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [category, setCategory] = useState('Manual Entry');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await apiClient('/leads', {
        method: 'POST',
        body: JSON.stringify({
          name,
          phoneNumber,
          category
        })
      });

      setName('');
      setPhoneNumber('');
      setCategory('Manual Entry');
      setIsOpen(false);
      if (onLeadAdded) onLeadAdded();
    } catch (err) {
      setError(err.message || 'Failed to create lead');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mb-6 bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-5 flex justify-between items-center bg-slate-50/70 border-b border-slate-200/80">
        <div>
          <h3 className="text-base font-bold text-[#075e54] flex items-center gap-2">
            <span>➕</span> Manual Lead Injection
          </h3>
          <p className="text-xs text-slate-500">Insert a customer phone contact or organic sales prospect into the pipeline.</p>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`px-4 py-2 text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer ${
            isOpen
              ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              : 'bg-[#128c7e] hover:bg-[#075e54] text-white'
          }`}
        >
          {isOpen ? '✕ Close Form' : '+ Add Manual Lead'}
        </button>
      </div>

      {isOpen && (
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Contact Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-[#128c7e] focus:outline-none shadow-2xs"
                placeholder="e.g. Alice Smith"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                WhatsApp Phone Number
              </label>
              <input
                type="tel"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono text-sm focus:ring-2 focus:ring-[#128c7e] focus:outline-none shadow-2xs"
                placeholder="e.g. 15551234567"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Source Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-[#128c7e] focus:outline-none shadow-2xs cursor-pointer"
              >
                <option value="Manual Entry">Manual Entry</option>
                <option value="Direct Call">Direct Call</option>
                <option value="Referral">Referral</option>
                <option value="Event / Expo">Event / Expo</option>
                <option value="Website Form">Website Form</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[#25d366] hover:bg-[#128c7e] text-white font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Saving Lead...' : 'Save & Inject Lead'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
