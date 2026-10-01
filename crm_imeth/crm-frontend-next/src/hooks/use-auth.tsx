"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import { apiClient } from "@/lib/api-client";
import { useSocket } from "@/hooks/use-socket";
import { toast } from "sonner";
import type { User } from "@/types";

export interface LoginResult {
  requireOtp?: boolean;
  isFirstLogin?: boolean;
  message?: string;
  otpPreview?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  updateUser: (updatedData: Partial<User>) => void;
  setSession: (token: string, user: User) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { socket } = useSocket();

  const logout = useCallback(() => {
    localStorage.clear();
    setToken(null);
    setUser(null);
    window.location.href = "/login";
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.clear();
      }
    }

    if (storedToken) {
      apiClient<User>("/users/me")
        .then((res) => {
          if (res.success && res.data) {
            setUser(res.data);
            localStorage.setItem("user", JSON.stringify(res.data));
          }
        })
        .catch(() => {})
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  // Live Socket synchronization for current authenticated user
  useEffect(() => {
    if (!socket || !user?.id) return;

    const handleUserUpdated = (updatedUser: Partial<User> & { id: string }) => {
      if (updatedUser.id === user.id) {
        setUser((prev) => {
          if (!prev) return null;
          const next = { ...prev, ...updatedUser };
          localStorage.setItem("user", JSON.stringify(next));
          return next;
        });
      }
    };

    const handleAccountBlocked = (data: { userId: string; message?: string }) => {
      if (data.userId === user.id) {
        toast.error(data.message || "Your account has been blocked by Super Admin.", {
          duration: 6000,
        });
        setTimeout(() => {
          logout();
        }, 1200);
      }
    };

    socket.on("user_updated", handleUserUpdated);
    socket.on("account_blocked", handleAccountBlocked);
    return () => {
      socket.off("user_updated", handleUserUpdated);
      socket.off("account_blocked", handleAccountBlocked);
    };
  }, [socket, user?.id, logout]);

  const setSession = useCallback((newToken: string, newUser: User) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    if (newUser.tenantId) {
      localStorage.setItem("tenantId", newUser.tenantId);
    }
    setToken(newToken);
    setUser(newUser);

    // Immediately fetch full profile (/users/me) so avatar, phone, and bio are hydrated
    apiClient<User>("/users/me")
      .then((res) => {
        if (res.success && res.data) {
          setUser(res.data);
          localStorage.setItem("user", JSON.stringify(res.data));
        }
      })
      .catch(() => {});
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    const res = await apiClient<{
      token?: string;
      user?: User;
      requireOtp?: boolean;
      isFirstLogin?: boolean;
      message?: string;
      otpPreview?: string;
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (res.success) {
      const rawRes = res as unknown as Record<string, unknown>;
      const requireOtp = res.data?.requireOtp ?? rawRes.requireOtp;
      const isFirstLogin = res.data?.isFirstLogin ?? rawRes.isFirstLogin;
      const otpPreview = (res.data?.otpPreview ?? rawRes.otpPreview) as string | undefined;

      if (requireOtp) {
        return {
          requireOtp: true,
          isFirstLogin: !!isFirstLogin,
          message: res.message || res.data?.message,
          otpPreview,
        };
      }
      if (res.data?.token && res.data?.user) {
        setSession(res.data.token, res.data.user);
        return { requireOtp: false };
      }
    } else {
      throw new Error(res.error || "Authentication failed");
    }
    return { requireOtp: false };
  }, [setSession]);

  const updateUser = useCallback((updatedData: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const next = { ...prev, ...updatedData };
      localStorage.setItem("user", JSON.stringify(next));
      return next;
    });
  }, []);

  const value = useMemo(() => ({
    user,
    token,
    isAuthenticated: !!token,
    isLoading,
    login,
    logout,
    updateUser,
    setSession,
  }), [user, token, isLoading, login, logout, updateUser, setSession]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
