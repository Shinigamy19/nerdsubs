"use client";

import { useMemo } from "react";
import type { SessionStats } from "@/lib/stats";
import { getSessions } from "@/lib/sessionStore";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-nerd-success",
  idle: "bg-nerd-muted",
  error: "bg-red-500",
};

interface SessionCardProps {
  stats: SessionStats;
}

export function SessionCard({ stats }: SessionCardProps) {
  const name = useMemo(() => {
    const sessions = getSessions();
    const found = sessions.find((s) => s.id === stats.sessionId);
    return found?.name ?? stats.sessionId;
  }, [stats.sessionId]);
  const avgLatency =
    stats.latencies.length > 0
      ? Math.round(stats.latencies.reduce((a, b) => a + b, 0) / stats.latencies.length)
      : 0;

  const currentLatency = stats.latencies.length > 0 ? stats.latencies[stats.latencies.length - 1] : 0;

  const recentLatencies = stats.latencies.slice(-10);
  const maxLatency = Math.max(...recentLatencies, 1);

  return (
    <div className="bg-nerd-card border border-nerd-border rounded-xl p-4 hover:border-nerd-accent/30 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${STATUS_COLORS[stats.status]} ${stats.status === "active" ? "animate-pulse-dot" : ""}`} />
          <h3 className="text-sm font-semibold text-nerd-text">{name}</h3>
        </div>
        {stats.errorCount > 0 && (
          <span className="px-2 py-0.5 text-xs font-mono bg-red-500/15 text-red-400 rounded-full">
            {stats.errorCount} errors
          </span>
        )}
      </div>

      {/* Latency */}
      <div className="mb-3">
        <p className="text-2xl font-bold text-nerd-text font-mono">
          {currentLatency > 0 ? `${currentLatency}ms` : "\u2014"}
        </p>
        <p className="text-xs text-nerd-muted">
          avg {avgLatency > 0 ? `${avgLatency}ms` : "\u2014"}
        </p>
      </div>

      {/* Subtitle count */}
      <div className="flex items-center gap-1.5 mb-3">
        <svg className="w-3.5 h-3.5 text-nerd-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
        <span className="text-sm font-mono text-nerd-text">{stats.subtitleCount}</span>
        <span className="text-xs text-nerd-muted">subs</span>
      </div>

      {/* Mini latency chart */}
      <div className="flex items-end gap-0.5 h-8">
        {recentLatencies.length > 0 ? (
          recentLatencies.map((lat, i) => {
            const height = Math.max(2, (lat / maxLatency) * 100);
            return (
              <div
                key={i}
                className="flex-1 bg-nerd-accent/60 rounded-t-sm min-w-[2px]"
                style={{ height: `${height}%` }}
                title={`${lat}ms`}
              />
            );
          })
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs text-nerd-muted/40">
            No data
          </div>
        )}
      </div>
    </div>
  );
}
