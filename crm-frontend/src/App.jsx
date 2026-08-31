import { useState } from 'react';
import DashboardStats from './DashboardStats';
import LeadsList from './LeadsList';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f6f8', color: '#333', fontFamily: 'sans-serif' }}>
      {/* Navigation Header */}
      <header style={{ 
        backgroundColor: '#1e293b', 
        color: '#fff', 
        padding: '16px 24px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '22px' }}>⚡</span>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Meta WhatsApp CRM</h1>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('dashboard')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '500',
              backgroundColor: activeTab === 'dashboard' ? '#3b82f6' : 'transparent',
              color: '#fff'
            }}
          >
            Dashboard Analytics
          </button>
          <button
            onClick={() => setActiveTab('leads')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '500',
              backgroundColor: activeTab === 'leads' ? '#3b82f6' : 'transparent',
              color: '#fff'
            }}
          >
            Leads Management
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ padding: '24px' }}>
        {activeTab === 'dashboard' ? <DashboardStats /> : <LeadsList />}
      </main>
    </div>
  );
}

export default App;
