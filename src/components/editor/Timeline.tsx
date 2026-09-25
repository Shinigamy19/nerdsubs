"use client";

import { useMemo, useState, useCallback, useRef } from "react";
import { type EditorSubtitle } from "@/lib/editorState";

interface TimelineProps {
  subtitles: EditorSubtitle[];
  totalDuration: number;
  onBlockClick: (subtitleId: string) => void;
}

export function Timeline({ subtitles, totalDuration, onBlockClick }: TimelineProps) {
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const width = useMemo(() => {
    if (totalDuration <= 0) return 1000;
    return Math.max(1000, totalDuration / 1000 * 50 * zoom);
  }, [totalDuration, zoom]);

  const formatTime = useCallback((ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  }, []);

  if (subtitles.length === 0) {
    return (
      <div className="bg-nerd-card border border-nerd-border rounded-lg p-4 text-center text-nerd-muted text-sm">
        No subtitles to display on timeline
      </div>
    );
  }

  const maxTime = totalDuration;

  return (
    <div className="bg-nerd-card border border-nerd-border rounded-lg overflow-hidden">
      {/* Zoom controls */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-nerd-border">
        <span className="text-xs text-nerd-muted font-medium">Timeline</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}
            className="p-1 text-nerd-muted hover:text-nerd-text transition-colors rounded"
            title="Zoom out"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <span className="text-xs text-nerd-muted font-mono w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(4, z + 0.25))}
            className="p-1 text-nerd-muted hover:text-nerd-text transition-colors rounded"
            title="Zoom in"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Timeline tracks */}
      <div
        ref={containerRef}
        className="overflow-x-auto overflow-y-hidden p-4"
        style={{ scrollbarWidth: "thin" }}
      >
        <div className="relative" style={{ width: `${width}px`, minHeight: "60px" }}>
          {/* Time ruler */}
          <div className="absolute inset-x-0 top-0 h-5 flex items-end">
            {Array.from({ length: Math.ceil(maxTime / 5000) + 1 }, (_, i) => {
              const time = i * 5000;
              const left = (time / maxTime) * 100;
              if (left > 100) return null;
              return (
                <div
                  key={i}
                  className="absolute text-[10px] text-nerd-muted font-mono"
                  style={{ left: `${left}%`, transform: "translateX(-50%)" }}
                >
                  {formatTime(time)}
                </div>
              );
            })}
          </div>

          {/* Subtitle blocks */}
          <div className="mt-6 relative h-10">
            {/* Track background */}
            <div className="absolute inset-0 bg-nerd-bg rounded" />

            {/* Subtitle blocks */}
            {subtitles.map((sub, i) => {
              const left = maxTime > 0 ? (sub.startTime / maxTime) * 100 : 0;
              const durationMs = sub.endTime - sub.startTime;
              const blockWidth = maxTime > 0 ? (durationMs / maxTime) * 100 : 0;

              return (
                <button
                  key={sub.id}
                  onClick={() => onBlockClick(sub.id)}
                  className="absolute top-1 bottom-1 rounded cursor-pointer transition-all hover:brightness-125 hover:ring-1 hover:ring-white/30 group"
                  style={{
                    left: `${left}%`,
                    width: `${Math.max(blockWidth, 0.3)}%`,
                    minWidth: "4px",
                  }}
                  title={`#${i + 1}: ${sub.original || "(empty)"}\n${formatTime(sub.startTime)} → ${formatTime(sub.endTime)}`}
                >
                  {/* Original text layer */}
                  <div className="absolute inset-0 bg-nerd-accent/70 rounded" />
                  {/* Translation text layer */}
                  {sub.translation && (
                    <div className="absolute inset-0 bg-purple-500/50 rounded" style={{ clipPath: "inset(0 0 50% 0)" }} />
                  )}
                  {/* Hover label */}
                  <div className="absolute -top-6 left-0 text-[10px] text-nerd-text bg-nerd-card border border-nerd-border rounded px-1.5 py-0.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    #{i + 1}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Grid lines */}
          <div className="absolute inset-x-0 top-5 bottom-0 pointer-events-none">
            {Array.from({ length: Math.ceil(maxTime / 5000) + 1 }, (_, i) => {
              const time = i * 5000;
              const left = (time / maxTime) * 100;
              if (left > 100) return null;
              return (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 w-px bg-nerd-border/50"
                  style={{ left: `${left}%` }}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2 border-t border-nerd-border text-[10px] text-nerd-muted">
        <div className="flex items-center gap-1">
          <div className="w-3 h-2 rounded-sm bg-nerd-accent/70" />
          <span>Original</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-2 rounded-sm bg-purple-500/50" />
          <span>Translation</span>
        </div>
      </div>
    </div>
  );
}
