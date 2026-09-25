"use client";

import { useTranscription } from "@/context/TranscriptionContext";
import { useLanguage } from "@/context/LanguageContext";
import { t } from "@/lib/i18n";

export function StatusIndicator() {
  const { state } = useTranscription();
  const { locale } = useLanguage();

  const statusColor =
    state.connectionStatus === "connected"
      ? "bg-nerd-success"
      : state.connectionStatus === "connecting"
      ? "bg-nerd-warning"
      : "bg-red-500";

  const statusText =
    state.connectionStatus === "connected"
      ? t(locale, "status.connected")
      : state.connectionStatus === "connecting"
      ? t(locale, "status.connecting")
      : t(locale, "status.disconnected");

  const formatTime = (timestamp: number | null) => {
    if (!timestamp) return "\u2014";
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="flex items-center gap-2 sm:gap-4 text-sm">
      {/* Connection status — dot always visible, text hidden on mobile */}
      <div className="flex items-center gap-2">
        <div
          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${statusColor} ${
            state.connectionStatus === "connected"
              ? "animate-pulse-dot"
              : ""
          }`}
        />
        <span className="text-nerd-muted hidden sm:inline">{statusText}</span>
      </div>

      {/* Separator — hidden on mobile */}
      <div className="w-px h-4 bg-nerd-border hidden sm:block" />

      {/* Current session — hidden on mobile */}
      <div className="text-nerd-muted hidden sm:block">
        <span className="text-nerd-accent-light font-medium">
          {state.sessionId.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
        </span>
      </div>

      {/* Separator */}
      <div className="w-px h-4 bg-nerd-border hidden md:block" />

      {/* Latency */}
      <div className="text-nerd-muted hidden md:block">
        {state.latency !== null ? (
          <span>
            <span className={`font-mono ${state.latency < 1000 ? "text-nerd-success" : state.latency < 2000 ? "text-nerd-warning" : "text-red-400"}`}>
              {state.latency}ms
            </span>
          </span>
        ) : (
          <span className="font-mono">\u2014</span>
        )}
      </div>

      {/* Last update */}
      <div className="text-nerd-muted hidden lg:block">
        {t(locale, "status.last")}: {formatTime(state.lastUpdate)}
      </div>

      {/* Processing indicator */}
      {state.isProcessing && (
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-nerd-accent animate-pulse" />
          <span className="text-nerd-accent text-xs hidden sm:inline">{t(locale, "status.processing")}</span>
        </div>
      )}
    </div>
  );
}
