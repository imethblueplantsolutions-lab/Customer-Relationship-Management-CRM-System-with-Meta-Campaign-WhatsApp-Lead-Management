import { useState, useEffect } from 'react';
import Login from './Login';
import DashboardStats from './DashboardStats';
import LeadsList from './LeadsList';
import Settings from './Settings';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token) {
      setIsAuthenticated(true);
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {}
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setIsAuthenticated(false);
    setUser(null);
  };

  if (!isAuthenticated) {
    return (
      <Login 
        onLoginSuccess={() => {
          setIsAuthenticated(true);
          const storedUser = localStorage.getItem('user');
          if (storedUser) setUser(JSON.parse(storedUser));
        }} 
      />
    );
  }

  const isPrivileged = ['ADMIN', 'TEAM_LEAD'].includes(user?.role);

  return (
    <div className="min-h-screen bg-[#ece5dd] text-slate-800 font-sans">
      {/* WhatsApp Deep Teal Header */}
      <header className="sticky top-0 z-50 bg-[#075e54] text-white shadow-md border-b border-[#128c7e]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#25d366] text-white text-xl shadow-inner font-bold">
              💬
            </span>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white leading-tight">
                WhatsApp Meta CRM
              </h1>
              <p className="text-xs text-emerald-100/80">
                {user ? `${user.email} • ${user.role}` : 'Connected'}
              </p>
            </div>
          </div>

          <nav className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-[#128c7e] text-white shadow-sm ring-1 ring-white/20'
                  : 'text-emerald-100 hover:text-white hover:bg-[#128c7e]/50'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('leads')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'leads'
                  ? 'bg-[#128c7e] text-white shadow-sm ring-1 ring-white/20'
                  : 'text-emerald-100 hover:text-white hover:bg-[#128c7e]/50'
              }`}
            >
              Leads Pipeline
            </button>
            {isPrivileged && (
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-[#128c7e] text-white shadow-sm ring-1 ring-white/20'
                    : 'text-emerald-100 hover:text-white hover:bg-[#128c7e]/50'
                }`}
              >
                ⚙️ Settings
              </button>
            )}
            <button
              onClick={handleLogout}
              className="ml-3 px-3 py-1.5 text-xs font-semibold text-rose-200 hover:text-white hover:bg-rose-900/60 rounded-lg border border-rose-400/30 transition-all cursor-pointer"
            >
              Logout
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area with Cream Background */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && <DashboardStats />}
        {activeTab === 'leads' && <LeadsList />}
        {activeTab === 'settings' && isPrivileged && <Settings />}
      </main>
    </div>
  );
}
