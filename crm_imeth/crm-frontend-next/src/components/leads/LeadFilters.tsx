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
  FolderOpen,
  Check,
  SlidersHorizontal,
} from "lucide-react";

interface LeadFiltersProps {
  tags?: Tag[];
  placeholder?: string;
  className?: string;
}

const STATUS_OPTIONS = [
  { value: "ALL", label: "All Statuses", color: "#64748b" },
  { value: "NEW", label: "New", color: "#3b82f6" },
  { value: "CONTACTED", label: "Contacted", color: "#eab308" },
  { value: "QUALIFIED", label: "Qualified", color: "#8b5cf6" },
  { value: "CONVERTED", label: "Converted", color: "#22c55e" },
  { value: "LOST", label: "Lost", color: "#ef4444" },
];

const CATEGORY_OPTIONS = [
  { value: "ALL", label: "All Sources" },
  { value: "Manual Entry", label: "Manual Entry" },
  { value: "Direct Call", label: "Direct Call" },
  { value: "Referral", label: "Referral" },
  { value: "Event / Expo", label: "Event / Expo" },
  { value: "Website Form", label: "Website Form" },
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
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Extract current values from URL query parameters
  const currentSearch = searchParams.get("search") || "";
  const currentStatus = searchParams.get("status") || "ALL";
  const currentTagId = searchParams.get("tagId") || "ALL";
  const currentCategory = searchParams.get("category") || "ALL";

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
    (updates: { search?: string; status?: string; tagId?: string; category?: string }) => {
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

      if (updates.category !== undefined) {
        if (updates.category && updates.category !== "ALL") {
          params.set("category", updates.category);
        } else {
          params.delete("category");
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

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateUrlParams({ category: e.target.value });
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");
    params.delete("status");
    params.delete("tagId");
    params.delete("category");
    params.delete("page");

    const queryString = params.toString();
    const targetUrl = queryString ? `${pathname}?${queryString}` : pathname;

    startTransition(() => {
      router.push(targetUrl);
    });
  };

  const activeFilterCount =
    (currentStatus && currentStatus !== "ALL" ? 1 : 0) +
    (currentTagId && currentTagId !== "ALL" ? 1 : 0) +
    (currentCategory && currentCategory !== "ALL" ? 1 : 0);

  const hasActiveFilters = Boolean(currentSearch.trim()) || activeFilterCount > 0;
  const selectedTag = tags.find((t) => t.id === currentTagId);

  return (
    <>
      <div
        className={`flex items-center gap-2 p-2.5 sm:p-3 bg-brand-surface rounded-2xl border border-brand-muted/30 shadow-xs transition-all ${className}`}
      >
        {/* Search Input */}
        <div className="relative flex-1 min-w-[180px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-muted">
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-9 pr-9 py-2 text-sm bg-brand-bg/60 border border-brand-muted/30 rounded-xl text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors text-base sm:text-sm"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-brand-muted hover:text-brand-text transition-colors cursor-pointer"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Mobile Filters Drawer Trigger Button (< md screens) */}
        <button
          type="button"
          onClick={() => setIsMobileDrawerOpen(true)}
          className={`md:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer shrink-0 min-h-[40px] ${
            activeFilterCount > 0
              ? "bg-blue-50 border-blue-200 text-blue-700"
              : "bg-brand-bg/70 border-brand-muted/30 text-slate-700 hover:bg-brand-bg"
          }`}
          title="Open filters"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Desktop Inline Controls (md: screens and up) */}
        <div className="hidden md:flex items-center gap-2">
          {/* Status Dropdown */}
          <div className="relative min-w-[130px]">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-brand-muted">
              <Filter className="w-3.5 h-3.5" />
            </div>
            <select
              value={currentStatus}
              onChange={handleStatusChange}
              className="w-full pl-8 pr-7 py-2 text-xs font-semibold bg-brand-bg/60 border border-brand-muted/30 rounded-xl text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors cursor-pointer appearance-none"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-brand-surface text-brand-text">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Category Dropdown */}
          <div className="relative min-w-[130px]">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-brand-muted">
              <FolderOpen className="w-3.5 h-3.5" />
            </div>
            <select
              value={currentCategory}
              onChange={handleCategoryChange}
              className="w-full pl-8 pr-7 py-2 text-xs font-semibold bg-brand-bg/60 border border-brand-muted/30 rounded-xl text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors cursor-pointer appearance-none"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-brand-surface text-brand-text">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tag Dropdown */}
          <div className="relative min-w-[130px]">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-brand-muted">
              {selectedTag ? (
                <span
                  className="w-2.5 h-2.5 rounded-full ring-1 ring-brand-muted/40"
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
              className="w-full pl-8 pr-7 py-2 text-xs font-semibold bg-brand-bg/60 border border-brand-muted/30 rounded-xl text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors cursor-pointer appearance-none disabled:opacity-60"
            >
              <option value="ALL" className="bg-brand-surface text-brand-text">All Tags</option>
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id} className="bg-brand-surface text-brand-text">
                  {tag.name}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-brand-muted hover:text-brand-text bg-brand-bg/80 hover:bg-brand-bg border border-brand-muted/30 rounded-xl transition-colors cursor-pointer shadow-xs"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── Mobile Slide-Up Filter Drawer (< md screens) ───────────── */}
      {isMobileDrawerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200 md:hidden"
          onClick={() => setIsMobileDrawerOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-t-3xl p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <h4 className="text-sm font-bold text-slate-900">Filter Leads</h4>
                {activeFilterCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
                    {activeFilterCount} Active
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-xs text-slate-500 hover:text-red-600 font-semibold cursor-pointer px-2 py-1"
                  >
                    Reset
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Status Section */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Pipeline Status
              </label>
              <div className="grid grid-cols-3 gap-2">
                {STATUS_OPTIONS.map((st) => {
                  const isSelected = currentStatus === st.value;
                  return (
                    <button
                      key={st.value}
                      type="button"
                      onClick={() => updateUrlParams({ status: st.value })}
                      className={`flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                      <span className="truncate">{st.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Source Category Section */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Lead Source Category
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORY_OPTIONS.map((cat) => {
                  const isSelected = currentCategory === cat.value;
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => updateUrlParams({ category: cat.value })}
                      className={`flex items-center justify-start gap-1.5 p-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                      <span className="truncate">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tags Section */}
            {tags.length > 0 && (
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => updateUrlParams({ tagId: "ALL" })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      currentTagId === "ALL"
                        ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    All Tags
                  </button>
                  {tags.map((t) => {
                    const isSelected = currentTagId === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => updateUrlParams({ tagId: t.id })}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                        <span>#{t.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Close / Apply CTA */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer"
              >
                Apply Filters ({activeFilterCount} active)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
