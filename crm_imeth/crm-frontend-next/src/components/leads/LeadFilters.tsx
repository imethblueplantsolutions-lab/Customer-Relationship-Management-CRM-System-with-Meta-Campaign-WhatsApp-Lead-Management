"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import type { Tag } from "@/types";
import {
  Search,
  Tag as TagIcon,
  Filter,
  X,
  RotateCcw,
  Loader2,
} from "lucide-react";

interface LeadFiltersProps {
  tags?: Tag[];
  placeholder?: string;
  className?: string;
}

const STATUS_OPTIONS = [
  { value: "ALL", label: "All Statuses" },
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "QUALIFIED", label: "Qualified" },
  { value: "CONVERTED", label: "Converted" },
  { value: "LOST", label: "Lost" },
];

export default function LeadFilters({
  tags: initialTags,
  placeholder = "Search by name or phone number...",
  className = "",
}: LeadFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isPending, startTransition] = useTransition();
  const [tags, setTags] = useState<Tag[]>(initialTags || []);
  const [isLoadingTags, setIsLoadingTags] = useState<boolean>(false);

  // Extract current values from URL query parameters
  const currentSearch = searchParams.get("search") || "";
  const currentStatus = searchParams.get("status") || "ALL";
  const currentTagId = searchParams.get("tagId") || "ALL";

  // Local state for immediate typing responsiveness
  const [searchTerm, setSearchTerm] = useState<string>(currentSearch);

  // Sync search input if URL changes externally
  useEffect(() => {
    setSearchTerm(currentSearch);
  }, [currentSearch]);

  // Fetch tags if not provided via props
  useEffect(() => {
    if (initialTags && initialTags.length > 0) {
      setTags(initialTags);
      return;
    }

    let isSubscribed = true;
    setIsLoadingTags(true);

    apiClient<Tag[]>("/leads/tags")
      .then((res) => {
        if (isSubscribed && res.success && res.data) {
          setTags(res.data);
        }
      })
      .catch((err) => {
        console.warn("[LeadFilters] Could not load tags:", err);
      })
      .finally(() => {
        if (isSubscribed) {
          setIsLoadingTags(false);
        }
      });

    return () => {
      isSubscribed = false;
    };
  }, [initialTags]);

  // Unified function to update URL query parameters and trigger re-fetch
  const updateUrlParams = useCallback(
    (updates: { search?: string; status?: string; tagId?: string }) => {
      const params = new URLSearchParams(searchParams.toString());

      // Reset page back to 1 whenever filters change
      params.delete("page");

      if (updates.search !== undefined) {
        const trimmed = updates.search.trim();
        if (trimmed) {
          params.set("search", trimmed);
        } else {
          params.delete("search");
        }
      }

      if (updates.status !== undefined) {
        if (updates.status && updates.status !== "ALL") {
          params.set("status", updates.status);
        } else {
          params.delete("status");
        }
      }

      if (updates.tagId !== undefined) {
        if (updates.tagId && updates.tagId !== "ALL") {
          params.set("tagId", updates.tagId);
        } else {
          params.delete("tagId");
        }
      }

      const queryString = params.toString();
      const targetUrl = queryString ? `${pathname}?${queryString}` : pathname;

      startTransition(() => {
        router.push(targetUrl);
      });
    },
    [router, pathname, searchParams]
  );

  // Debounced search input handler (400ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim() !== currentSearch.trim()) {
        updateUrlParams({ search: searchTerm });
      }
    }, 400);

    return () => {
      clearTimeout(timer);
    };
  }, [searchTerm, currentSearch, updateUrlParams]);

  const handleClearSearch = () => {
    setSearchTerm("");
    updateUrlParams({ search: "" });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateUrlParams({ status: e.target.value });
  };

  const handleTagChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateUrlParams({ tagId: e.target.value });
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");
    params.delete("status");
    params.delete("tagId");
    params.delete("page");

    const queryString = params.toString();
    const targetUrl = queryString ? `${pathname}?${queryString}` : pathname;

    startTransition(() => {
      router.push(targetUrl);
    });
  };

  const hasActiveFilters =
    Boolean(currentSearch.trim()) ||
    (currentStatus && currentStatus !== "ALL") ||
    (currentTagId && currentTagId !== "ALL");

  const selectedTag = tags.find((t) => t.id === currentTagId);

  return (
    <div
      className={`flex flex-col md:flex-row items-stretch md:items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all ${className}`}
    >
      {/* Search Input */}
      <div className="relative flex-1 min-w-[220px]">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-9 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            title="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Select Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Status Dropdown */}
        <div className="relative min-w-[140px] flex-1 sm:flex-initial">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
            <Filter className="w-3.5 h-3.5" />
          </div>
          <select
            value={currentStatus}
            onChange={handleStatusChange}
            className="w-full pl-8 pr-8 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors cursor-pointer appearance-none"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

        {/* Tag Dropdown */}
        <div className="relative min-w-[150px] flex-1 sm:flex-initial">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
            {selectedTag ? (
              <span
                className="w-2.5 h-2.5 rounded-full ring-1 ring-slate-300 dark:ring-slate-600"
                style={{ backgroundColor: selectedTag.color || "#6366f1" }}
              />
            ) : (
              <TagIcon className="w-3.5 h-3.5" />
            )}
          </div>
          <select
            value={currentTagId}
            onChange={handleTagChange}
            disabled={isLoadingTags}
            className="w-full pl-8 pr-8 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors cursor-pointer appearance-none disabled:opacity-60"
          >
            <option value="ALL">All Tags</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
            {isLoadingTags ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            )}
          </div>
        </div>

        {/* Reset Filters Button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title="Reset all filters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
}
