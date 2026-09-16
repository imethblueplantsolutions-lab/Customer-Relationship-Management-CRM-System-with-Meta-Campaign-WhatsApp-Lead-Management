"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-slate-200/70",
        className
      )}
      {...props}
    />
  );
}

/**
 * Table skeleton with pulsing header and rows
 */
export function TableSkeleton({
  rows = 6,
  columns = 5,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="w-full rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
      {/* Table Header */}
      <div className="flex items-center gap-4 border-b border-slate-100 bg-slate-50/50 px-6 py-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton
            key={`th-${i}`}
            className={cn("h-4", i === 0 ? "w-40" : i === 1 ? "w-28" : "w-20")}
          />
        ))}
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={`tr-${r}`} className="flex items-center gap-4 px-6 py-4.5">
            {/* Avatar / Name */}
            <div className="flex items-center gap-3 w-40 shrink-0">
              <Skeleton className="h-9 w-9 rounded-full shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-2.5 w-16" />
              </div>
            </div>

            {/* Other columns */}
            {Array.from({ length: columns - 1 }).map((_, c) => (
              <Skeleton
                key={`td-${r}-${c}`}
                className={cn(
                  "h-4",
                  c === 0 ? "w-28" : c === 1 ? "w-20 rounded-full" : "w-24"
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Card grid skeleton (e.g. Stat cards or Flow cards)
 */
export function CardGridSkeleton({
  count = 4,
  columns = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
}: {
  count?: number;
  columns?: string;
}) {
  return (
    <div className={cn("grid gap-4", columns)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={`card-skel-${i}`}
          className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-3"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-8 rounded-xl" />
          </div>
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

/**
 * Kanban Pipeline skeleton
 */
export function PipelineSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {Array.from({ length: columns }).map((_, col) => (
        <div
          key={`col-skel-${col}`}
          className="w-80 shrink-0 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-3"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-7 rounded-full" />
          </div>
          {Array.from({ length: 3 }).map((_, card) => (
            <div
              key={`col-${col}-card-${card}`}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3.5 w-12 rounded-full" />
              </div>
              <Skeleton className="h-3 w-36" />
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-6 w-6 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Lead Detail Page skeleton
 */
export function LeadDetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-1.5">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-3.5 w-32" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24 rounded-xl" />
            <Skeleton className="h-9 w-28 rounded-xl" />
          </div>
        </div>
        {/* Stepper bar */}
        <div className="grid grid-cols-4 gap-2 pt-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={`step-${i}`} className="h-10 rounded-xl" />
          ))}
        </div>
      </div>

      {/* 2-Column Body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs h-96 space-y-4">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-full w-full rounded-xl" />
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
            <Skeleton className="h-5 w-28" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
