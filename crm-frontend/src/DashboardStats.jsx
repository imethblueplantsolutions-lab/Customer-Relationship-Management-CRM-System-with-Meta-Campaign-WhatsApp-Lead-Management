import { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { apiClient } from './api/client';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function DashboardStats() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiClient('/dashboard/stats');
        setStats(response.data);
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
        <div className="flex items-center space-x-3 text-[#075e54] font-semibold">
          <svg className="animate-spin h-6 w-6 text-[#128c7e]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
      <div className="rounded-2xl bg-red-50 p-6 border border-red-200 text-red-700 max-w-xl mx-auto my-12 text-center shadow-sm">
        <h3 className="text-base font-bold mb-1">Failed to Load Dashboard</h3>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (!stats) return <div className="p-8 text-center text-slate-500 font-medium">No analytics data available.</div>;

  const chartLabels = Object.keys(stats.statusBreakdown || {});
  const chartValues = Object.values(stats.statusBreakdown || {});

  const chartData = {
    labels: chartLabels.length > 0 ? chartLabels : ['No Leads'],
    datasets: [
      {
        label: 'Prospects',
        data: chartValues.length > 0 ? chartValues : [1],
        backgroundColor: [
          '#128c7e', // Teal Green
          '#25d366', // WhatsApp Green
          '#075e54', // Dark Teal
          '#f59e0b', // Amber
          '#f43f5e', // Rose
          '#8b5cf6', // Violet
        ],
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  };

  const chartOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 12,
          padding: 16,
          font: { size: 12, weight: '600' },
          color: '#1e293b'
        }
      },
      tooltip: {
        backgroundColor: '#075e54',
        padding: 10,
        cornerRadius: 8,
        titleFont: { size: 13, weight: 'bold' },
        bodyFont: { size: 12 }
      }
    },
    cutout: '70%'
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'NEW': return 'bg-[#dcf8c6] text-[#075e54] border border-[#25d366]/40 font-bold';
      case 'CONTACTED': return 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold';
      case 'QUALIFIED': return 'bg-teal-100 text-teal-900 border border-[#128c7e]/40 font-semibold';
      case 'CONVERTED': return 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold';
      case 'LOST': return 'bg-rose-100 text-rose-800 border border-rose-200 font-medium';
      default: return 'bg-slate-100 text-slate-700 border border-slate-200 font-medium';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 font-sans">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Leads</span>
            <span className="p-2.5 bg-[#dcf8c6] text-[#075e54] rounded-xl text-lg shadow-2xs">👥</span>
          </div>
          <p className="text-3xl font-extrabold text-[#075e54] mt-3">{stats.totalLeads}</p>
          <span className="text-xs text-[#128c7e] font-semibold mt-1 inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#25d366]"></span> Active Ingestion
          </span>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">New Inquiries</span>
            <span className="p-2.5 bg-emerald-50 text-[#128c7e] rounded-xl text-lg shadow-2xs">📥</span>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-3">{stats.statusBreakdown?.NEW || 0}</p>
          <span className="text-xs text-slate-500 font-medium mt-1 inline-block">Awaiting reply</span>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Converted</span>
            <span className="p-2.5 bg-[#dcf8c6] text-[#075e54] rounded-xl text-lg shadow-2xs">🎉</span>
          </div>
          <p className="text-3xl font-extrabold text-[#075e54] mt-3">{stats.statusBreakdown?.CONVERTED || 0}</p>
          <span className="text-xs text-emerald-700 font-semibold mt-1 inline-block">Closed conversions</span>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Tasks</span>
            <span className="p-2.5 bg-amber-50 text-amber-700 rounded-xl text-lg shadow-2xs">⏰</span>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-3">{stats.pendingFollowups}</p>
          <span className="text-xs text-amber-700 font-semibold mt-1 inline-block">Follow-ups scheduled</span>
        </div>
      </div>

      {/* Chart & Recent Leads Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Doughnut Chart Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col items-center justify-between">
          <div className="w-full mb-4 pb-2 border-b border-slate-100">
            <h3 className="text-base font-bold text-[#075e54] flex items-center gap-2">
              <span>📊</span> Pipeline Distribution
            </h3>
            <p className="text-xs text-slate-500">Live breakdown of lead statuses</p>
          </div>
          
          <div className="w-64 h-64 my-auto relative flex items-center justify-center">
            <Doughnut data={chartData} options={chartOptions} />
          </div>

          <div className="w-full pt-4 border-t border-slate-100 text-center">
            <span className="text-xs text-slate-500 font-medium">
              Total Captured: <strong className="text-[#075e54]">{stats.totalLeads}</strong> contacts
            </span>
          </div>
        </div>

        {/* Recent Leads Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
          <h2 className="text-base font-bold text-[#075e54] mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <span>⚡</span> Recent WhatsApp Prospects
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50/70">
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {stats.recentLeads?.length > 0 ? (
                  stats.recentLeads.map(lead => (
                    <tr key={lead.id} className="hover:bg-[#dcf8c6]/20 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">{lead.name || 'Unknown'}</td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-xs">{lead.phoneNumber}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${getStatusBadgeClass(lead.status)}`}>
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
