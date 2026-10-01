"use client";

import React, { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

export interface RoleGuardProps {
  /** Array of permitted roles (e.g. ['SUPER_ADMIN', 'ADMIN']) */
  allowedRoles: string[];
  /** Elements to render if access is authorized */
  children: React.ReactNode;
  /** Optional fallback redirect destination (defaults to /dashboard) */
  redirectTo?: string;
  /** Optional custom loading placeholder */
  loadingFallback?: React.ReactNode;
}

/**
 * Client-side Route Guard component that enforces Role-Based Access Control (RBAC).
 *
 * Role Hierarchy: SUPER_ADMIN > ADMIN > TEAM_LEAD > AGENT
 *
 * - While authentication state is resolving, renders an elegant loading spinner.
 * - If the authenticated user's role is not authorized, triggers an immediate redirect.
 * - When authorization succeeds, mounts and renders child components safely.
 */
export function RoleGuard({
  allowedRoles,
  children,
  redirectTo = "/dashboard",
  loadingFallback,
}: RoleGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  // Stable evaluation of authorization status
  const isAuthorized = useMemo(() => {
    if (!user || !user.role) return false;
    return allowedRoles.includes(user.role);
  }, [user, allowedRoles]);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || !isAuthorized) {
        const destination =
          redirectTo === "/dashboard" && user?.role === "SUPER_ADMIN"
            ? "/hierarchy"
            : redirectTo;
        router.replace(destination);
      }
    }
  }, [isLoading, isAuthenticated, isAuthorized, router, redirectTo, user]);

  // Loading state gatekeeper
  if (isLoading) {
    if (loadingFallback) {
      return <>{loadingFallback}</>;
    }
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent shadow-lg" />
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Verifying access permissions...
          </p>
        </div>
      </div>
    );
  }

  // Not authorized: return null while redirect completes to prevent content flashing
  if (!isAuthenticated || !isAuthorized) {
    return null;
  }

  return <>{children}</>;
}

export default RoleGuard;
