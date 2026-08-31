import { useState, useEffect } from 'react';

export default function DashboardStats() {
  const [stats, setStats] = useState({ totalLeads: 0, statusBreakdown: {}, pendingFollowups: 0, recentLeads: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/dashboard/stats');
        if (!response.ok) throw new Error('Failed to fetch dashboard statistics');
        const json = await response.json();
        setStats(json.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) return <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>Loading dashboard...</div>;
  if (error) return <div style={{ padding: '20px', color: 'red', fontFamily: 'sans-serif' }}>Error: {error}</div>;

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Meta CRM Dashboard</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', background: '#fafafa' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#555' }}>Total Leads</h3>
          <p style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, color: '#111' }}>{stats.totalLeads}</p>
        </div>
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', background: '#fafafa' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#555' }}>Pending Follow-ups</h3>
          <p style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, color: '#e65100' }}>{stats.pendingFollowups}</p>
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h2>Leads by Status</h2>
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {Object.entries(stats.statusBreakdown || {}).map(([status, count]) => (
            <li key={status} style={{ padding: '8px 0', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
              <strong>{status}:</strong> <span>{count}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2>Recent Leads</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ borderBottom: '2px solid #ddd', padding: '10px' }}>Name</th>
              <th style={{ borderBottom: '2px solid #ddd', padding: '10px' }}>Phone</th>
              <th style={{ borderBottom: '2px solid #ddd', padding: '10px' }}>Status</th>
              <th style={{ borderBottom: '2px solid #ddd', padding: '10px' }}>Source</th>
            </tr>
          </thead>
          <tbody>
            {stats.recentLeads?.length > 0 ? (
              stats.recentLeads.map(lead => (
                <tr key={lead.id}>
                  <td style={{ borderBottom: '1px solid #eee', padding: '10px' }}>{lead.name}</td>
                  <td style={{ borderBottom: '1px solid #eee', padding: '10px' }}>{lead.phoneNumber}</td>
                  <td style={{ borderBottom: '1px solid #eee', padding: '10px' }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      background: lead.status === 'NEW' ? '#e3f2fd' : '#f5f5f5',
                      color: lead.status === 'NEW' ? '#1565c0' : '#333',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {lead.status}
                    </span>
                  </td>
                  <td style={{ borderBottom: '1px solid #eee', padding: '10px' }}>{lead.sourceChannel}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                  No leads recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
