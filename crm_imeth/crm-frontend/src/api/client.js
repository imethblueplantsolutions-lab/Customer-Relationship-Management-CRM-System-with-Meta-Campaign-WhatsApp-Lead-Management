export const apiClient = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const tenantId = localStorage.getItem('tenantId');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(tenantId ? { 'x-tenant-id': tenantId } : {}),
    ...options.headers,
  };

  const response = await fetch(`http://localhost:3000/api${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('tenantId');
    localStorage.removeItem('user');
    window.location.reload();
  }

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'API Request Failed');
  return data;
};
