"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranscription } from "@/context/TranscriptionContext";
import { useLanguage } from "@/context/LanguageContext";
import { t } from "@/lib/i18n";
import { getSessions, type Session } from "@/lib/sessionStore";

interface SessionSelectorProps {
  onOpenManager?: () => void;
  refreshKey?: number;
}

export function SessionSelector({ onOpenManager, refreshKey }: SessionSelectorProps) {
  const { state, dispatch } = useTranscription();
  const { locale } = useLanguage();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const loadSessions = useCallback(() => {
    setSessions(getSessions());
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions, refreshKey]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch({ type: "SET_SESSION", sessionId: e.target.value });
  };

  const copyObsUrl = useCallback(async () => {
    const url = `http://localhost:3000/overlay?session=${state.sessionId}&source=${state.sourceLanguage}&target=${state.targetLanguage}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      // Fallback: create temp input
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  }, [state.sessionId, state.sourceLanguage, state.targetLanguage]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-nerd-muted uppercase tracking-wider">
          {t(locale, "sidebar.session")}
        </label>
        {onOpenManager && (
          <button
            onClick={onOpenManager}
            className="p-1.5 rounded-lg text-nerd-muted hover:text-nerd-text hover:bg-nerd-border/50 transition-all min-w-[32px] min-h-[32px] flex items-center justify-center"
            title="Manage sessions"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        )}
      </div>
      <select
        value={state.sessionId}
        onChange={handleChange}
        disabled={state.isListening}
        className="w-full bg-nerd-card border border-nerd-border rounded-lg px-4 py-3 text-nerd-text
                   focus:outline-none focus:ring-2 focus:ring-nerd-accent focus:border-transparent
                   disabled:opacity-50 disabled:cursor-not-allowed
                   appearance-none cursor-pointer
                   bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%2364748b%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.168l3.71-3.938a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200l-4.25-4.5a.75.75%200%2001.02-1.06z%22%20clip-rule%3D%22evenodd%22%20%2F%3E%3C%2Fsvg%3E')]
                   bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat pr-10"
      >
        {sessions.map((session) => (
          <option key={session.id} value={session.id}>
            {session.name} — {session.description}
          </option>
        ))}
      </select>

      {/* Copy OBS URL button */}
      <button
        onClick={copyObsUrl}
        className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all min-h-[44px] ${
          copiedUrl
            ? "bg-nerd-success/20 text-nerd-success border border-nerd-success/30"
            : "bg-nerd-accent/10 text-nerd-accent border border-nerd-accent/20 hover:bg-nerd-accent/20 hover:border-nerd-accent/40"
        }`}
      >
        {copiedUrl ? (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {t(locale, "export.urlCopied")}
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            {t(locale, "export.copyObsUrl")}
          </>
        )}
      </button>

      {state.isListening && (
        <p className="text-xs text-nerd-muted">
          {t(locale, "session.stopToChange")}
        </p>
      )}
    </div>
  );
}
