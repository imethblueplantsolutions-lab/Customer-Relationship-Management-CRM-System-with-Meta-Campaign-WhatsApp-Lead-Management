import { useState } from 'react';
import { apiClient } from './api/client';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('admin@crm.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('tenantId', response.data.user.tenantId);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      onLoginSuccess();
    } catch (err) {
      setError(err.message || 'Invalid credentials or connection error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeed = async () => {
    setIsSeeding(true);
    setSeedMessage(null);
    setError(null);
    try {
      const res = await apiClient('/auth/seed', { method: 'POST' });
      setSeedMessage('Admin account seeded! (admin@crm.com / admin123)');
      setEmail('admin@crm.com');
      setPassword('admin123');
    } catch (err) {
      setError('Seed failed: ' + err.message);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 py-12">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white text-2xl shadow-md">
            ⚡
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Meta CRM Portal</h2>
          <p className="text-sm text-slate-500">Sign in to your organization dashboard</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium">
            {error}
          </div>
        )}

        {seedMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm font-medium">
            {seedMessage}
          </div>
        )}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              placeholder="admin@crm.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? 'Authenticating...' : 'Sign In to CRM'}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 flex flex-col items-center gap-2">
          <p className="text-xs text-slate-400">First time setup?</p>
          <button
            type="button"
            onClick={handleSeed}
            disabled={isSeeding}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer underline disabled:opacity-50"
          >
            {isSeeding ? 'Creating admin...' : '⚡ Seed Initial Admin User (admin@crm.com / admin123)'}
          </button>
        </div>
      </div>
    </div>
  );
}
