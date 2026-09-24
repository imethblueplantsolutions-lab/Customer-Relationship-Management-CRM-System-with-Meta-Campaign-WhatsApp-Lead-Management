"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { apiClient } from "@/lib/api-client";

interface Agent {
  id: string;
  name?: string;
  email: string;
  role: string;
  avatar?: string;
}

const STALE_TIME_MS = 5 * 60 * 1000; // 5 minutes

// Module-level cache shared across all hook instances
let cachedAgents: Agent[] = [];
let lastFetchedAt = 0;

/**
 * Caches the /users agent list at module level with a 5-minute stale time.
 * Prevents redundant fetches when navigating between lead detail pages.
 */
export function useAgentList(enabled: boolean) {
  const [agents, setAgents] = useState<Agent[]>(cachedAgents);
  const fetchedRef = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const res = await apiClient<Agent[]>("/users");
      if (res.success && res.data) {
        cachedAgents = res.data;
        lastFetchedAt = Date.now();
        setAgents(res.data);
      }
    } catch (err) {
      console.warn("Could not load users list:", err);
    }
  }, []);

  useEffect(() => {
    if (!enabled || fetchedRef.current) return;
    fetchedRef.current = true;

    const isStale = Date.now() - lastFetchedAt > STALE_TIME_MS;
    if (cachedAgents.length > 0 && !isStale) {
      setAgents(cachedAgents);
      return;
    }

    refresh();
  }, [enabled, refresh]);

  return { agents, setAgents, refreshAgents: refresh };
}
