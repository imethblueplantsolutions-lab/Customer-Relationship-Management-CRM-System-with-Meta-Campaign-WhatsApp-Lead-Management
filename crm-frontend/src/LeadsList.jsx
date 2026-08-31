import { useState, useEffect } from 'react';

export default function LeadsList() {
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const fetchLeads = async () => {
      setIsLoading(true);
      try {
        const query = statusFilter ? `?status=${statusFilter}` : '';
        const response = await fetch(`http://localhost:3000/api/leads${query}`, {
          headers: {
            'x-tenant-id': 'WABA_ID_TEST', 
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) throw new Error('Failed to fetch leads');
        
        const json = await response.json();
        setLeads(json.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeads();
  }, [statusFilter]);

  if (isLoading) return <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>Loading leads...</div>;
  if (error) return <div style={{ padding: '20px', color: 'red', fontFamily: 'sans-serif' }}>Error: {error}</div>;

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Lead Management</h2>
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }}
        >
          <option value="">All Statuses</option>
          <option value="NEW">New</option>
          <option value="CONTACTED">Contacted</option>
          <option value="QUALIFIED">Qualified</option>
          <option value="CONVERTED">Converted</option>
          <option value="LOST">Lost</option>
        </select>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <thead>
          <tr style={{ backgroundColor: '#f9f9f9' }}>
            <th style={{ borderBottom: '2px solid #ddd', padding: '12px 16px' }}>Name</th>
            <th style={{ borderBottom: '2px solid #ddd', padding: '12px 16px' }}>Phone</th>
            <th style={{ borderBottom: '2px solid #ddd', padding: '12px 16px' }}>Status</th>
            <th style={{ borderBottom: '2px solid #ddd', padding: '12px 16px' }}>Category</th>
            <th style={{ borderBottom: '2px solid #ddd', padding: '12px 16px' }}>Created</th>
          </tr>
        </thead>
        <tbody>
          {leads.length === 0 ? (
            <tr>
              <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#888' }}>No leads found for this tenant.</td>
            </tr>
          ) : (
            leads.map(lead => (
              <tr key={lead.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px 16px', fontWeight: '500' }}>{lead.name || 'Unknown'}</td>
                <td style={{ padding: '12px 16px' }}>{lead.phoneNumber}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ 
                    padding: '4px 10px', 
                    borderRadius: '12px', 
                    fontSize: '12px',
                    fontWeight: 'bold',
                    backgroundColor: lead.status === 'NEW' ? '#e3f2fd' : lead.status === 'CONVERTED' ? '#e8f5e9' : '#f5f5f5',
                    color: lead.status === 'NEW' ? '#1565c0' : lead.status === 'CONVERTED' ? '#2e7d32' : '#555'
                  }}>
                    {lead.status}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>{lead.category || 'Organic'}</td>
                <td style={{ padding: '12px 16px', color: '#666' }}>
                  {new Date(lead.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
