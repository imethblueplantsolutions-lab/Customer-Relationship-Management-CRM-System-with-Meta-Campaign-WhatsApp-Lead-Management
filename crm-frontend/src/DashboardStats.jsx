import { useState, useEffect } from 'react';
import { apiClient } from './api/client';

export default function DashboardStats() {
  const [stats, setStats] = useState({ totalLeads: 0, statusBreakdown: {}, pendingFollowups: 0, recentLeads: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const json = await apiClient('/dashboard/stats');
        setStats(json.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center space-x-3 text-slate-500 font-medium">
          <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          <span>Loading dashboard analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-6 border border-red-200 text-red-700 max-w-xl mx-auto my-12 text-center">
        <h3 className="text-base font-semibold mb-1">Failed to Load Dashboard</h3>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'NEW': return 'bg-blue-100 text-blue-700 border border-blue-200';
      case 'CONTACTED': return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'QUALIFIED': return 'bg-purple-100 text-purple-700 border border-purple-200';
      case 'CONVERTED': return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 'LOST': return 'bg-rose-100 text-rose-700 border border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Total Leads</span>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg text-lg">👥</span>
          </div>
          <p className="text-3xl font-bold text-slate-900 mt-3">{stats.totalLeads}</p>
          <span className="text-xs text-emerald-600 font-medium mt-1 inline-block">Real-time synced</span>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">New Inquiries</span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg text-lg">📥</span>
          </div>
          <p className="text-3xl font-bold text-slate-900 mt-3">{stats.statusBreakdown?.NEW || 0}</p>
          <span className="text-xs text-slate-500 font-medium mt-1 inline-block">Awaiting response</span>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Converted</span>
            <span className="p-2 bg-purple-50 text-purple-600 rounded-lg text-lg">🎉</span>
          </div>
          <p className="text-3xl font-bold text-slate-900 mt-3">{stats.statusBreakdown?.CONVERTED || 0}</p>
          <span className="text-xs text-purple-600 font-medium mt-1 inline-block">Closed deals</span>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Pending Follow-ups</span>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-lg text-lg">⏰</span>
          </div>
          <p className="text-3xl font-bold text-slate-900 mt-3">{stats.pendingFollowups}</p>
          <span className="text-xs text-amber-600 font-medium mt-1 inline-block">Due for review</span>
        </div>
      </div>

      {/* Pipeline Status Breakdown & Recent Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Status Pipeline */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
            Pipeline Distribution
          </h2>
          <div className="space-y-4">
            {Object.entries(stats.statusBreakdown || {}).map(([status, count]) => {
              const percentage = stats.totalLeads > 0 ? Math.round((count / stats.totalLeads) * 100) : 0;
              return (
                <div key={status}>
                  <div className="flex justify-between items-center text-sm mb-1">
                    <span className="font-semibold text-slate-800">{status}</span>
                    <span className="text-slate-500 font-medium">{count} ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        status === 'NEW' ? 'bg-blue-500' :
                        status === 'CONTACTED' ? 'bg-amber-500' :
                        status === 'QUALIFIED' ? 'bg-purple-500' :
                        status === 'CONVERTED' ? 'bg-emerald-500' : 'bg-rose-400'
                      }`}
                      style={{ width: `${Math.max(percentage, 4)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Leads Table */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
            Recent Meta Leads
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Channel / Ad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {stats.recentLeads?.length > 0 ? (
                  stats.recentLeads.map(lead => (
                    <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">{lead.name || 'Unknown'}</td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-xs">{lead.phoneNumber}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusBadgeClass(lead.status)}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-xs">{lead.category || 'Meta Ad'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      No leads captured yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
