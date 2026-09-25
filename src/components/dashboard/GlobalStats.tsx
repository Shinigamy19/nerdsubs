"use client";

import { useEffect, useState } from "react";
import type { SessionStats } from "@/lib/stats";

interface GlobalStatsProps {
  sessions: SessionStats[];
}

function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function GlobalStats({ sessions }: GlobalStatsProps) {
  const [pageLoadTime] = useState(() => Date.now());
  const [uptime, setUptime] = useState("00:00:00");

  useEffect(() => {
    const timer = setInterval(() => {
      setUptime(formatUptime(Date.now() - pageLoadTime));
    }, 1000);
    return () => clearInterval(timer);
  }, [pageLoadTime]);

  const activeSessions = sessions.filter((s) => s.status === "active").length;

  const allLatencies = sessions.flatMap((s) => s.latencies);
  const avgLatency =
    allLatencies.length > 0
      ? Math.round(allLatencies.reduce((a, b) => a + b, 0) / allLatencies.length)
      : 0;

  const totalSubtitles = sessions.reduce((sum, s) => sum + s.subtitleCount, 0);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <StatCard label="Active Sessions" value={`${activeSessions}/${sessions.length}`} icon="sessions" />
      <StatCard label="Avg Latency" value={avgLatency > 0 ? `${avgLatency}ms` : "\u2014"} icon="latency" />
      <StatCard label="Total Subtitles" value={String(totalSubtitles)} icon="subtitles" />
      <StatCard label="Uptime" value={uptime} icon="uptime" />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="bg-nerd-card border border-nerd-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <StatIcon name={icon} />
        <p className="text-xs text-nerd-muted uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-xl font-bold text-nerd-text font-mono">{value}</p>
    </div>
  );
}

function StatIcon({ name }: { name: string }) {
  switch (name) {
    case "sessions":
      return (
        <svg className="w-4 h-4 text-nerd-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      );
    case "latency":
      return (
        <svg className="w-4 h-4 text-nerd-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "subtitles":
      return (
        <svg className="w-4 h-4 text-nerd-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
      );
    case "uptime":
      return (
        <svg className="w-4 h-4 text-nerd-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return null;
  }
}
