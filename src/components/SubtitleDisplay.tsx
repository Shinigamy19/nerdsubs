"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useTranscription } from "@/context/TranscriptionContext";
import { useLanguage } from "@/context/LanguageContext";
import { t } from "@/lib/i18n";
import { ExportPanel } from "@/components/ExportPanel";
import { DebugConsole, DebugConsoleButton, getLogs, subscribeLogs } from "@/components/DebugConsole";
import type { StoredSession } from "@/lib/subtitleStore";

export function SubtitleDisplay({
  debugOpen,
  onToggleDebug,
}: {
  debugOpen: boolean;
  onToggleDebug: () => void;
}) {
  const { state, dispatch } = useTranscription();
  const { locale } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [errorCount, setErrorCount] = useState(0);

  // Subscribe to log updates for error badge
  useEffect(() => {
    return subscribeLogs(() => {
      const errors = getLogs().filter((e) => e.level === "error").length;
      setErrorCount(errors);
    });
  }, []);

  // Auto-scroll to bottom when new subtitles arrive
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [state.subtitles.length]);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const handleLoadSession = useCallback(
    (session: StoredSession) => {
      dispatch({
        type: "LOAD_SUBTITLES",
        subtitles: session.subtitles,
        sourceLanguage: session.sourceLanguage,
        targetLanguage: session.targetLanguage,
      });
      setExportOpen(false);
    },
    [dispatch]
  );

  const isUploadMode = state.appMode === "upload";

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b border-nerd-border">
        <h2 className="text-xs sm:text-sm font-medium text-nerd-muted uppercase tracking-wider">
          {isUploadMode ? t(locale, "subtitle.fileTranscription") : t(locale, "subtitle.liveSubtitles")}
        </h2>
        <div className="flex items-center gap-2">
          {state.subtitles.length > 0 && (
            <button
              onClick={() => setExportOpen(true)}
              className="p-1.5 rounded-lg text-nerd-muted hover:text-nerd-accent hover:bg-nerd-border/50 transition-all min-w-[36px] min-h-[36px] flex items-center justify-center"
              title={t(locale, "export.title")}
              aria-label="Export subtitles"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          )}
          <DebugConsoleButton
            isOpen={debugOpen}
            onToggle={onToggleDebug}
            errorCount={errorCount}
          />
          <span className="text-xs text-nerd-muted font-mono">
            {state.subtitles.length} {t(locale, "subtitle.entries")}
          </span>
        </div>
      </div>

      {/* Debug console panel */}
      <DebugConsole isOpen={debugOpen} onClose={onToggleDebug} />

      {/* Subtitle list */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 sm:space-y-3"
      >
        {state.subtitles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8 sm:py-12">
            {state.isListening ? (
              <>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-nerd-accent/20 flex items-center justify-center mb-3 sm:mb-4">
                  <div className="w-3 h-3 rounded-full bg-nerd-accent animate-pulse" />
                </div>
                <p className="text-nerd-muted text-base sm:text-lg">
                  {isUploadMode ? t(locale, "subtitle.processingAudio") : t(locale, "subtitle.listeningForAudio")}
                </p>
                <p className="text-nerd-muted/60 text-xs sm:text-sm mt-1">
                  {isUploadMode
                    ? t(locale, "subtitle.processingAudioHint")
                    : t(locale, "subtitle.listeningHint")}
                </p>
              </>
            ) : (
              <>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-nerd-border flex items-center justify-center mb-3 sm:mb-4">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 text-nerd-muted"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d={
                        isUploadMode
                          ? "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          : "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                      }
                    />
                  </svg>
                </div>
                <p className="text-nerd-muted text-base sm:text-lg">
                  {isUploadMode ? t(locale, "subtitle.noTranscription") : t(locale, "subtitle.noSubtitles")}
                </p>
                <p className="text-nerd-muted/60 text-xs sm:text-sm mt-1">
                  {isUploadMode
                    ? t(locale, "subtitle.uploadHint")
                    : t(locale, "subtitle.selectSessionHint")}
                </p>
              </>
            )}
          </div>
        ) : (
          state.subtitles.map((subtitle, index) => (
            <div
              key={subtitle.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${Math.min(index * 50, 200)}ms` }}
            >
              <div className="bg-nerd-card border border-nerd-border rounded-lg p-3 sm:p-4 hover:border-nerd-accent/30 transition-colors">
                {/* Timestamp */}
                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                  <span className="text-xs text-nerd-muted font-mono">
                    {formatTimestamp(subtitle.timestamp)}
                  </span>
                  {subtitle.translation && (
                    <span className="text-xs text-nerd-accent font-medium">
                      {t(locale, "subtitle.translated")}
                    </span>
                  )}
                </div>

                {/* Original text */}
                <p className="text-base sm:text-lg leading-relaxed text-nerd-text">
                  {subtitle.original}
                </p>

                {/* Translation */}
                {subtitle.translation && (
                  <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-nerd-border">
                    <p className="text-base sm:text-lg leading-relaxed text-nerd-accent-light">
                      {subtitle.translation}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Processing indicator */}
        {state.isProcessing && state.subtitles.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-nerd-muted py-2">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-nerd-accent animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-1.5 h-1.5 rounded-full bg-nerd-accent animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-1.5 h-1.5 rounded-full bg-nerd-accent animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <span>{isUploadMode ? t(locale, "subtitle.processingChunkFile") : t(locale, "subtitle.processingChunkLive")}</span>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>

      {/* Export panel */}
      <ExportPanel isOpen={exportOpen} onClose={() => setExportOpen(false)} onLoadSession={handleLoadSession} />
    </div>
  );
}
