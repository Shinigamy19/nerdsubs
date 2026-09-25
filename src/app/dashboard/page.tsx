"use client";

import { useEffect, useState, useCallback } from "react";
import { SessionCard } from "@/components/dashboard/SessionCard";
import { GlobalStats } from "@/components/dashboard/GlobalStats";
import type { SessionStats } from "@/lib/stats";

export default function DashboardPage() {
  const [sessions, setSessions] = useState<SessionStats[]>([]);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/stats");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: SessionStats[] = await res.json();
      setSessions(data);
      setLastFetch(new Date());
      setFetchError(null);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Failed to fetch");
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  return (
    <div className="min-h-screen bg-nerd-bg p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-nerd-text tracking-tight">
              NerdSubs Dashboard
            </h1>
            <p className="text-sm text-nerd-muted mt-1">Production monitoring</p>
          </div>
          <div className="flex items-center gap-3">
            {fetchError && (
              <span className="text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded">
                {fetchError}
              </span>
            )}
            <a
              href="/"
              className="text-sm text-nerd-muted hover:text-nerd-accent transition-colors"
            >
              &larr; Back to app
            </a>
          </div>
        </div>
        {lastFetch && (
          <p className="text-xs text-nerd-muted/60 mt-2">
            Last updated: {lastFetch.toLocaleTimeString()} &middot; Auto-refreshes every 5s
          </p>
        )}
      </header>

      {/* Global stats */}
      <GlobalStats sessions={sessions} />

      {/* Session grid */}
      <h2 className="text-sm font-medium text-nerd-muted uppercase tracking-wider mb-3">
        Sessions
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {sessions.length > 0 ? (
          sessions.map((session) => (
            <SessionCard key={session.sessionId} stats={session} />
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-nerd-muted">
            <p>No sessions available</p>
          </div>
        )}
      </div>
    </div>
  );
}
