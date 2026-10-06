function getApiBase(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!envUrl) return 'http://localhost:4000/api';
  const trimmed = envUrl.trim().replace(/\/+$/, '');
  if (trimmed.startsWith('http') && !trimmed.endsWith('/api')) {
    return `${trimmed}/api`;
  }
  return trimmed;
}

const API_BASE = getApiBase();

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
  title?: string;
  quota?: Record<string, unknown>;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class ApiError extends Error {
  code?: string;
  title?: string;
  quota?: Record<string, unknown>;
  statusCode?: number;
  remainingAttempts?: number;
  lockoutUntil?: string;
  isLocked?: boolean;
  data?: Record<string, unknown>;

  constructor(
    message: string,
    options?: {
      code?: string;
      title?: string;
      quota?: Record<string, unknown>;
      statusCode?: number;
      remainingAttempts?: number;
      lockoutUntil?: string;
      isLocked?: boolean;
      data?: Record<string, unknown>;
    }
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = options?.code;
    this.title = options?.title;
    this.quota = options?.quota;
    this.statusCode = options?.statusCode;
    this.remainingAttempts = options?.remainingAttempts;
    this.lockoutUntil = options?.lockoutUntil;
    this.isLocked = options?.isLocked;
    this.data = options?.data;
  }
}

export async function apiClient<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenantId') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(tenantId ? { 'x-tenant-id': tenantId } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const response = await fetch(`${API_BASE}${cleanEndpoint}`, {
    cache: 'no-store',
    ...options,
    headers,
  });

  // Only redirect to /login on 401 if it's a protected session endpoint (not /auth/* endpoints like login/register)
  // and the user is not already on the login page
  const isAuthEndpoint = cleanEndpoint.startsWith('/auth/') && cleanEndpoint !== '/auth/refresh';
  const isAlreadyOnLoginPage = typeof window !== 'undefined' && window.location.pathname === '/login';

  if (response.status === 401 && !isAuthEndpoint && !isAlreadyOnLoginPage) {
    if (typeof window !== 'undefined') {
      const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      localStorage.removeItem('token');
      localStorage.removeItem('tenantId');
      localStorage.removeItem('user');
      
      const safeReturnUrl = currentPath && currentPath !== '/' && currentPath !== '/login'
        ? `&returnUrl=${encodeURIComponent(currentPath)}`
        : '';
      window.location.href = `/login?expired=true${safeReturnUrl}`;
    }
    // Return early — do not attempt to parse body after redirect
    return { success: false, error: 'Session expired. Please log in again.' } as ApiResponse<T>;
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(data.error || 'API Request Failed', {
      code: data.code,
      title: data.title,
      quota: data.quota,
      statusCode: response.status,
      remainingAttempts: typeof data.remainingAttempts === 'number' ? data.remainingAttempts : undefined,
      lockoutUntil: typeof data.lockoutUntil === 'string' ? data.lockoutUntil : undefined,
      isLocked: Boolean(data.isLocked || response.status === 423),
      data,
    });
  }
  return data as ApiResponse<T>;
}
