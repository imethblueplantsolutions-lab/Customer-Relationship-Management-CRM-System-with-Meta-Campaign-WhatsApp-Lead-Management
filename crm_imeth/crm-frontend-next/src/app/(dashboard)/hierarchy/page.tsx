"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

export default function UserHierarchyPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Security barrier: Kick out anyone who isn't a Super Admin
  useEffect(() => {
    if (!isLoading && user?.role !== "SUPER_ADMIN") {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  if (isLoading || user?.role !== "SUPER_ADMIN") {
    return null; // Prevent UI flicker while checking permissions
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">User Hierarchy</h1>
      <p className="text-slate-500 dark:text-slate-400">
        Super Admin organizational chart and management controls will be implemented here.
      </p>
    </div>
  );
}
