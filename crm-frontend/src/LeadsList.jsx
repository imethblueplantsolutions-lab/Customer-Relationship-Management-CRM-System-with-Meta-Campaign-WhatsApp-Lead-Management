import { useState, useEffect, useCallback } from 'react';
import { apiClient } from './api/client';
import AddLeadForm from './AddLeadForm';
import LeadDetail from './LeadDetail';

export default function LeadsList() {
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState(null);

  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    try {
      const query = statusFilter ? `?status=${statusFilter}` : '';
      const response = await apiClient(`/leads${query}`);
      setLeads(response.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'NEW': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CONTACTED': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'QUALIFIED': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'CONVERTED': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'LOST': return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  if (selectedLeadId) {
    return <LeadDetail leadId={selectedLeadId} onBack={() => { setSelectedLeadId(null); fetchLeads(); }} />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-sans">
      <AddLeadForm onLeadAdded={fetchLeads} />

      <div className="bg-white p-6 border border-slate-200 rounded-xl shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Lead Management</h2>
            <p className="text-xs text-slate-500 mt-0.5">Filter by pipeline stage or click a contact to view interaction history.</p>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="status-filter" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Status:</label>
            <select 
              id="status-filter"
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white font-medium text-sm focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer"
            >
              <option value="" className="text-slate-900">All Statuses</option>
              <option value="NEW" className="text-slate-900">New</option>
              <option value="CONTACTED" className="text-slate-900">Contacted</option>
              <option value="QUALIFIED" className="text-slate-900">Qualified</option>
              <option value="CONVERTED" className="text-slate-900">Converted</option>
              <option value="LOST" className="text-slate-900">Lost</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center p-12 text-slate-500 font-medium">Loading leads...</div>
        ) : error ? (
          <div className="text-center p-6 text-red-600 bg-red-50 rounded-lg text-sm">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Name</th>
                  <th className="py-3.5 px-4">WhatsApp Phone</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Created Date</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {leads.length === 0 ? (
                  <tr><td colSpan="6" className="p-12 text-center text-slate-400">No leads recorded yet.</td></tr>
                ) : (
                  leads.map(lead => (
                    <tr 
                      key={lead.id} 
                      onClick={() => setSelectedLeadId(lead.id)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <td className="py-4 px-4 font-semibold text-blue-600 hover:underline">{lead.name || 'Unknown'}</td>
                      <td className="py-4 px-4 text-slate-600 font-mono text-xs">{lead.phoneNumber}</td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusBadgeClass(lead.status)}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-600">{lead.category || 'Organic'}</td>
                      <td className="py-4 px-4 text-slate-500 text-xs">{new Date(lead.createdAt).toLocaleDateString()}</td>
                      <td className="py-4 px-4 text-right">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLeadId(lead.id);
                          }}
                          className="px-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
                        >
                          View Details &rarr;
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
