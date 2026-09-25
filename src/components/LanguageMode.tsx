"use client";

import { useTranscription, type LanguageMode } from "@/context/TranscriptionContext";
import { useLanguage } from "@/context/LanguageContext";
import { t } from "@/lib/i18n";

const MODES: { value: LanguageMode; label: string }[] = [
  { value: "EN_TO_ES", label: "EN → ES" },
  { value: "ES_TO_EN", label: "ES → EN" },
];

export function LanguageMode() {
  const { state, dispatch } = useTranscription();
  const { locale } = useLanguage();

  const handleModeChange = (mode: LanguageMode) => {
    if (!state.isListening) {
      dispatch({ type: "SET_LANGUAGE_MODE", mode });
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-nerd-muted uppercase tracking-wider">
        {t(locale, "language.modeTitle")}
      </label>
      <div className="flex bg-nerd-card border border-nerd-border rounded-lg p-1 gap-1">
        {MODES.map((mode) => (
          <button
            key={mode.value}
            onClick={() => handleModeChange(mode.value)}
            disabled={state.isListening}
            className={`flex-1 py-2.5 px-4 rounded-md text-sm font-semibold transition-all duration-200
              ${
                state.languageMode === mode.value
                  ? "bg-nerd-accent text-white shadow-lg shadow-nerd-accent/25"
                  : "text-nerd-muted hover:text-nerd-text hover:bg-nerd-border/50"
              }
              disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {mode.label}
          </button>
        ))}
      </div>
      {state.isListening && (
        <p className="text-xs text-nerd-muted">
          {t(locale, "language.stopToChangeMode")}
        </p>
      )}
    </div>
  );
}
