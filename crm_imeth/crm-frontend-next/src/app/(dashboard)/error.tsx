"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Dashboard Error Boundary Caught]:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600 ring-8 ring-red-50">
        <AlertTriangle className="h-8 w-8" />
      </div>

      <h2 className="mt-6 text-xl font-bold text-slate-900 tracking-tight">
        Something went wrong
      </h2>
      <p className="mt-2 max-w-md text-xs text-slate-500 leading-relaxed">
        {error?.message || "An unexpected error occurred while loading this view. Our team has been notified."}
      </p>

      {error?.digest && (
        <code className="mt-3 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-mono text-slate-400">
          ID: {error.digest}
        </code>
      )}

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-all cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Try Again
        </button>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <Home className="h-3.5 w-3.5" /> Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
