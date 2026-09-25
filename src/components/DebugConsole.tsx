"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// --- Log Store (singleton) ---
export type LogLevel = "info" | "error" | "warn" | "success";

export interface LogEntry {
  id: number;
  timestamp: number;
  level: LogLevel;
  message: string;
}

const logs: LogEntry[] = [];
let nextId = 0;
let listeners: (() => void)[] = [];

export function addLog(level: LogLevel, message: string) {
  logs.push({ id: nextId++, timestamp: Date.now(), level, message });
  if (logs.length > 100) logs.shift();
  listeners.forEach((l) => l());
}

export function getLogs(): LogEntry[] {
  return logs;
}

export function clearLogs() {
  logs.length = 0;
  listeners.forEach((l) => l());
}

export function subscribeLogs(callback: () => void) {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter((l) => l !== callback);
  };
}

// --- Component ---
const MAX_VISIBLE = 50;

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

const LEVEL_COLORS: Record<LogLevel, string> = {
  info: "text-gray-400",
  error: "text-red-400",
  warn: "text-yellow-400",
  success: "text-green-400",
};

interface DebugConsoleProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DebugConsole({ isOpen, onClose }: DebugConsoleProps) {
  const [snapshot, setSnapshot] = useState<LogEntry[]>([]);
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return subscribeLogs(() => {
      setSnapshot([...getLogs()]);
    });
  }, []);

  const visible = snapshot.slice(-MAX_VISIBLE);

  // Auto-scroll to bottom on new entries
  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [snapshot.length, isOpen]);

  const errorCount = snapshot.filter((e) => e.level === "error").length;

  const handleClear = useCallback(() => {
    clearLogs();
  }, []);

  const handleCopy = useCallback(async () => {
    const text = snapshot
      .map((e) => `[${formatTime(e.timestamp)}] [${e.level.toUpperCase()}] ${e.message}`)
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [snapshot]);

  return (
    <div className="w-full overflow-hidden">
      {/* Panel */}
      <div
        className="transition-all duration-300 ease-in-out"
        style={{
          maxHeight: isOpen ? "200px" : "0px",
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div className="bg-gray-950 border-b border-nerd-border flex flex-col h-[200px]">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-800 flex-shrink-0">
            <div className="flex items-center gap-2">
              <svg
                className="w-3.5 h-3.5 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">
                Debug Console
              </span>
              {errorCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-red-500/20 text-red-400 rounded">
                  {errorCount} error{errorCount !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleCopy}
                className={`px-2 py-0.5 text-[10px] font-mono rounded transition-colors ${
                  copied
                    ? "text-green-400 bg-green-500/10"
                    : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
                }`}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
              <button
                onClick={handleClear}
                className="px-2 py-0.5 text-[10px] font-mono text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded transition-colors"
              >
                Clear
              </button>
              <button
                onClick={onClose}
                className="p-0.5 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded transition-colors"
                aria-label="Close debug console"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Log entries */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {visible.length === 0 ? (
              <p className="text-[11px] font-mono text-gray-600 px-1 py-2">
                No logs yet...
              </p>
            ) : (
              visible.map((entry) => (
                <div key={entry.id} className="flex gap-2 leading-tight">
                  <span className="text-[11px] font-mono text-gray-600 flex-shrink-0 select-all">
                    [{formatTime(entry.timestamp)}]
                  </span>
                  <span
                    className={`text-[11px] font-mono font-semibold uppercase flex-shrink-0 w-14 text-right ${LEVEL_COLORS[entry.level]}`}
                  >
                    {entry.level}
                  </span>
                  <span className="text-[11px] font-mono text-gray-300 break-all">
                    {entry.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Toggle button (placed in SubtitleDisplay header) ---
export function DebugConsoleButton({
  isOpen,
  onToggle,
  errorCount,
}: {
  isOpen: boolean;
  onToggle: () => void;
  errorCount: number;
}) {
  return (
    <button
      onClick={onToggle}
      className={`relative p-1.5 rounded-lg transition-all min-w-[36px] min-h-[36px] flex items-center justify-center ${
        isOpen
          ? "text-nerd-accent bg-nerd-accent/10"
          : "text-nerd-muted hover:text-nerd-text hover:bg-nerd-border/50"
      }`}
      title="Toggle debug console"
      aria-label="Toggle debug console"
    >
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      {errorCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
          {errorCount > 9 ? "9+" : errorCount}
        </span>
      )}
    </button>
  );
}
