"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import { apiClient } from "@/lib/api-client";
import { useSocket } from "@/hooks/use-socket";
import type { User } from "@/types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ requireOtp?: boolean; isFirstLogin?: boolean; message?: string }>;
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

    socket.on("user_updated", handleUserUpdated);
    return () => {
      socket.off("user_updated", handleUserUpdated);
    };
  }, [socket, user?.id]);

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

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiClient<{ token?: string; user?: User; requireOtp?: boolean; isFirstLogin?: boolean; message?: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (res.success) {
      if (res.data?.requireOtp) {
        return {
          requireOtp: true,
          isFirstLogin: res.data.isFirstLogin,
          message: res.data.message,
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

  const logout = useCallback(() => {
    localStorage.clear();
    setToken(null);
    setUser(null);
    window.location.href = "/login";
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
