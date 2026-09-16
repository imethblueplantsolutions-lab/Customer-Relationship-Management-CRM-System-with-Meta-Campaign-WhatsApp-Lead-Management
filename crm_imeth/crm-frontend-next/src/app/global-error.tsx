"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Global Error Boundary Caught]:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-slate-50 p-6 font-sans">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl border border-slate-200/80 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600 ring-8 ring-red-50">
            <AlertTriangle className="h-8 w-8" />
          </div>

          <h1 className="mt-6 text-xl font-bold text-slate-900 tracking-tight">
            Application Error
          </h1>
          <p className="mt-2 text-xs text-slate-500 leading-relaxed">
            A critical error interrupted the CRM application. Please refresh or try again.
          </p>

          <div className="mt-6">
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-all cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reload Application
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
