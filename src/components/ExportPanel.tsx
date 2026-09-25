"use client";

import { useState, useCallback } from "react";
import { useTranscription, type SubtitleEntry } from "@/context/TranscriptionContext";
import { useLanguage } from "@/context/LanguageContext";
import { t } from "@/lib/i18n";
import {
  generateSRT,
  generateVTT,
  generateTXT,
  generateJSON,
  generateFCPXML,
  generatePremiereXML,
  generateEDL,
  downloadFile,
} from "@/lib/export";
import {
  getAllSessions,
  deleteSession,
  clearAllSessions,
  type StoredSession,
} from "@/lib/subtitleStore";
import { getLanguageFlag } from "@/lib/languages";

interface ExportPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadSession?: (session: StoredSession) => void;
}

type Tab = "export" | "history";
type ExportFormat = "srt" | "vtt" | "txt" | "json" | "fcpxml" | "premiere" | "edl";

interface FormatOption {
  format: ExportFormat;
  label: string;
  mime: string;
  ext: string;
  description: string;
}

const FORMAT_OPTIONS: FormatOption[] = [
  { format: "srt", label: "SRT", mime: "application/x-subrip", ext: ".srt", description: "Universal subtitle format" },
  { format: "vtt", label: "VTT", mime: "text/vtt", ext: ".vtt", description: "Web standard" },
  { format: "txt", label: "TXT", mime: "text/plain", ext: ".txt", description: "Plain text" },
  { format: "json", label: "JSON", mime: "application/json", ext: ".json", description: "Raw data" },
  { format: "fcpxml", label: "FCPXML", mime: "application/xml", ext: ".fcpxml", description: "Final Cut Pro X" },
  { format: "premiere", label: "Premiere", mime: "application/xml", ext: ".xml", description: "Adobe Premiere Pro" },
  { format: "edl", label: "EDL", mime: "text/plain", ext: ".edl", description: "Edit Decision List" },
];

function getPreview(subtitles: SubtitleEntry[], format: ExportFormat): string {
  const preview = subtitles.slice(0, 10);
  switch (format) {
    case "srt":
      return generateSRT(preview);
    case "vtt":
      return generateVTT(preview);
    case "txt":
      return generateTXT(preview);
    case "json":
      return generateJSON(preview, {
        sessionId: "preview",
        sourceLanguage: "auto",
        targetLanguage: "es",
        mode: "translate",
      });
    case "fcpxml":
      return generateFCPXML(preview);
    case "premiere":
      return generatePremiereXML(preview);
    case "edl":
      return generateEDL(preview);
  }
}

function getFullContent(subtitles: SubtitleEntry[], format: ExportFormat, meta?: { sessionId: string; sourceLanguage: string; targetLanguage: string }): string {
  const m = meta ?? { sessionId: "unknown", sourceLanguage: "auto", targetLanguage: "es" };
  switch (format) {
    case "srt":
      return generateSRT(subtitles);
    case "vtt":
      return generateVTT(subtitles);
    case "txt":
      return generateTXT(subtitles);
    case "json":
      return generateJSON(subtitles, { ...m, mode: "translate" });
    case "fcpxml":
      return generateFCPXML(subtitles);
    case "premiere":
      return generatePremiereXML(subtitles);
    case "edl":
      return generateEDL(subtitles);
  }
}

function getFilename(sessionId: string, format: ExportFormat): string {
  const ts = new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-");
  const ext = FORMAT_OPTIONS.find((f) => f.format === format)?.ext ?? ".srt";
  return `nerdsubs-${sessionId}-${ts}${ext}`;
}

function estimateDuration(subtitles: SubtitleEntry[]): string {
  if (subtitles.length < 2) return "< 1s";
  const first = subtitles[0].timestamp;
  const last = subtitles[subtitles.length - 1].timestamp;
  const seconds = Math.round((last - first) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remain = seconds % 60;
  return `${minutes}m ${remain}s`;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ExportPanel({ isOpen, onClose, onLoadSession }: ExportPanelProps) {
  const { state } = useTranscription();
  const { locale } = useLanguage();
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("srt");
  const [activeTab, setActiveTab] = useState<Tab>("export");
  const [sessions, setSessions] = useState<StoredSession[]>(() => getAllSessions());
  const [confirmClear, setConfirmClear] = useState(false);

  const refreshSessions = useCallback(() => {
    setSessions(getAllSessions());
  }, []);

  const handleDeleteSession = useCallback(
    (sessionId: string) => {
      deleteSession(sessionId);
      refreshSessions();
    },
    [refreshSessions]
  );

  const handleClearAll = useCallback(() => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    clearAllSessions();
    setConfirmClear(false);
    refreshSessions();
  }, [confirmClear, refreshSessions]);

  const handleDownloadSession = useCallback(
    (session: StoredSession) => {
      const content = getFullContent(session.subtitles, selectedFormat, {
        sessionId: session.sessionId,
        sourceLanguage: session.sourceLanguage,
        targetLanguage: session.targetLanguage,
      });
      const opt = FORMAT_OPTIONS.find((f) => f.format === selectedFormat);
      const filename = getFilename(session.sessionId, selectedFormat);
      downloadFile(content, filename, opt?.mime ?? "text/plain");
    },
    [selectedFormat]
  );

  if (!isOpen) return null;

  const hasCurrentSubtitles = state.subtitles.length > 0;
  const preview = hasCurrentSubtitles ? getPreview(state.subtitles, selectedFormat) : "";
  const duration = hasCurrentSubtitles ? estimateDuration(state.subtitles) : "0s";

  const handleDownload = (format: ExportFormat) => {
    if (!hasCurrentSubtitles) return;
    const content = getFullContent(state.subtitles, format, {
      sessionId: state.sessionId,
      sourceLanguage: state.sourceLanguage,
      targetLanguage: state.targetLanguage,
    });
    const opt = FORMAT_OPTIONS.find((f) => f.format === format);
    const filename = getFilename(state.sessionId, format);
    downloadFile(content, filename, opt?.mime ?? "text/plain");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel — full-width bottom sheet on mobile, centered modal on desktop */}
      <div className="relative w-full sm:max-w-lg sm:mx-4 bg-nerd-card border border-nerd-border rounded-t-2xl sm:rounded-xl shadow-2xl max-h-[90vh] sm:max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 border-b border-nerd-border">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-nerd-text">
              {t(locale, "export.title")}
            </h3>
            {hasCurrentSubtitles && (
              <p className="text-xs text-nerd-muted mt-0.5">
                {state.subtitles.length} {t(locale, "subtitle.entries")} &middot; ~{duration}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-nerd-muted hover:text-nerd-text hover:bg-nerd-border/50 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-nerd-border">
          <button
            onClick={() => setActiveTab("export")}
            className={`flex-1 py-2.5 text-sm font-medium transition-all border-b-2 min-h-[44px] ${
              activeTab === "export"
                ? "border-nerd-accent text-nerd-accent"
                : "border-transparent text-nerd-muted hover:text-nerd-text"
            }`}
          >
            {t(locale, "export.export")}
          </button>
          <button
            onClick={() => { setActiveTab("history"); refreshSessions(); }}
            className={`flex-1 py-2.5 text-sm font-medium transition-all border-b-2 min-h-[44px] ${
              activeTab === "history"
                ? "border-nerd-accent text-nerd-accent"
                : "border-transparent text-nerd-muted hover:text-nerd-text"
            }`}
          >
            {t(locale, "export.sessionHistory")} ({sessions.length})
          </button>
        </div>

        {activeTab === "export" && hasCurrentSubtitles && (
          <>
            {/* Format selector */}
            <div className="px-4 sm:px-5 pt-3 sm:pt-4">
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {FORMAT_OPTIONS.map((opt) => (
                  <button
                    key={opt.format}
                    onClick={() => setSelectedFormat(opt.format)}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all min-h-[36px] ${
                      selectedFormat === opt.format
                        ? "bg-nerd-accent text-white shadow"
                        : "bg-nerd-bg text-nerd-muted hover:text-nerd-text border border-nerd-border hover:border-nerd-accent/50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-nerd-muted mt-2">
                {FORMAT_OPTIONS.find((f) => f.format === selectedFormat)?.description}
              </p>
            </div>

            {/* Preview */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-3 sm:py-4">
              <p className="text-xs text-nerd-muted uppercase tracking-wider mb-2">
                {t(locale, "export.preview")}
              </p>
              <pre className="bg-nerd-bg border border-nerd-border rounded-lg p-3 text-xs text-nerd-text/80 font-mono whitespace-pre-wrap overflow-x-auto max-h-40 sm:max-h-48">
                {preview}
              </pre>
            </div>

            {/* Download buttons — single selected format on mobile, grid on desktop */}
            <div className="px-4 sm:px-5 pb-4 flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => handleDownload(selectedFormat)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-nerd-accent text-white text-sm font-medium hover:bg-nerd-accent-light transition-all shadow shadow-nerd-accent/25 min-h-[44px]"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download {selectedFormat.toUpperCase()}
              </button>
              <div className="hidden sm:flex sm:flex-wrap sm:gap-2">
                {FORMAT_OPTIONS.filter((f) => f.format !== selectedFormat).map((opt) => (
                  <button
                    key={opt.format}
                    onClick={() => handleDownload(opt.format)}
                    className="flex items-center justify-center gap-1 py-2 px-3 rounded-lg bg-nerd-border/50 text-nerd-text text-xs font-medium hover:bg-nerd-border transition-all min-h-[40px]"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === "export" && !hasCurrentSubtitles && (
          <div className="flex-1 flex items-center justify-center px-4 sm:px-5 py-8 sm:py-12">
            <p className="text-sm text-nerd-muted text-center">
              {t(locale, "export.noSubtitles")}
            </p>
          </div>
        )}

        {activeTab === "history" && (
          <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-3 sm:py-4 space-y-3">
            {sessions.length === 0 ? (
              <p className="text-sm text-nerd-muted text-center py-6 sm:py-8">
                {t(locale, "export.noSessions")}
              </p>
            ) : (
              <>
                {/* Clear all button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleClearAll}
                    className={`text-xs px-3 py-1.5 rounded-lg transition-all min-h-[36px] ${
                      confirmClear
                        ? "bg-red-500 text-white hover:bg-red-600"
                        : "text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    }`}
                  >
                    {confirmClear ? t(locale, "export.confirmClearAll") : t(locale, "export.clearAllHistory")}
                  </button>
                </div>

                {sessions
                  .sort((a, b) => b.lastUpdated - a.lastUpdated)
                  .map((session) => (
                    <div
                      key={session.sessionId}
                      className="bg-nerd-bg border border-nerd-border rounded-lg p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-nerd-text font-mono truncate">
                            {session.sessionId}
                          </p>
                          <p className="text-xs text-nerd-muted">
                            {formatDate(session.lastUpdated)} &middot; {session.subtitles.length} subtitles &middot; {getLanguageFlag(session.sourceLanguage)} {session.sourceLanguage} → {getLanguageFlag(session.targetLanguage)} {session.targetLanguage}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {onLoadSession && (
                          <button
                            onClick={() => onLoadSession(session)}
                            className="flex-1 py-2 px-3 text-xs font-medium rounded-lg bg-nerd-accent text-white hover:bg-nerd-accent-light transition-all min-h-[36px]"
                          >
                            {t(locale, "export.load")}
                          </button>
                        )}
                        <button
                          onClick={() => handleDownloadSession(session)}
                          className="flex-1 py-2 px-3 text-xs font-medium rounded-lg bg-nerd-border/50 text-nerd-text hover:bg-nerd-border transition-all min-h-[36px]"
                        >
                          Export ({selectedFormat.toUpperCase()})
                        </button>
                        <button
                          onClick={() => handleDeleteSession(session.sessionId)}
                          className="py-2 px-3 text-xs font-medium rounded-lg text-red-400 hover:bg-red-500/10 transition-all min-h-[36px]"
                          >
                            {t(locale, "export.delete")}
                          </button>
                      </div>
                    </div>
                  ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
