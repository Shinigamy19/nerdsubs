"use client";

import { useState, useRef, useEffect } from "react";
import { useTranscription } from "@/context/TranscriptionContext";
import { useLanguage } from "@/context/LanguageContext";
import { t } from "@/lib/i18n";
import { SUPPORTED_LANGUAGES, type Language } from "@/lib/languages";

const SELECTABLE_LANGUAGES = SUPPORTED_LANGUAGES.filter((l) => l.code !== "auto");

function CustomSelect({
  value,
  onChange,
  options,
  disabled,
  placeholder,
}: {
  value: string;
  onChange: (code: string) => void;
  options: Language[];
  disabled: boolean;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((l) => l.code === value) || options[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className="w-full bg-nerd-card border border-nerd-border rounded-lg px-4 py-3 text-left text-nerd-text
          focus:outline-none focus:ring-2 focus:ring-nerd-accent focus:border-transparent
          disabled:opacity-50 disabled:cursor-not-allowed
          cursor-pointer flex items-center gap-3"
      >
        <span className="text-xl leading-none emoji-flag">{selected?.flag}</span>
        <span className="flex-1">{selected?.name}</span>
        <svg
          className={`w-4 h-4 text-nerd-muted transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-nerd-card border border-nerd-border rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto">
          {options.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => {
                onChange(lang.code);
                setOpen(false);
              }}
              className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors
                ${lang.code === value
                  ? "bg-nerd-accent/20 text-nerd-accent"
                  : "text-nerd-text hover:bg-nerd-border/50"
                }`}
            >
              <span className="text-xl leading-none emoji-flag">{lang.flag}</span>
              <span>{lang.name}</span>
              {lang.code === value && (
                <svg className="w-4 h-4 ml-auto text-nerd-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function LanguageSelector() {
  const { state, dispatch } = useTranscription();
  const { locale } = useLanguage();

  const handleSourceChange = (code: string) => {
    if (!state.isListening) {
      dispatch({ type: "SET_SOURCE_LANGUAGE", language: code });
    }
  };

  const handleTargetChange = (code: string) => {
    if (!state.isListening) {
      dispatch({ type: "SET_TARGET_LANGUAGE", language: code });
    }
  };

  const handleSwap = () => {
    if (!state.isListening && state.sourceLanguage !== "auto") {
      const newSource = state.targetLanguage;
      const newTarget = state.sourceLanguage;
      dispatch({ type: "SET_SOURCE_LANGUAGE", language: newSource });
      dispatch({ type: "SET_TARGET_LANGUAGE", language: newTarget });
    }
  };

  const targetOptions = SELECTABLE_LANGUAGES;

  return (
    <div className="space-y-3">
      {/* Source language */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-nerd-muted uppercase tracking-wider">
          {t(locale, "sidebar.sourceLanguage")}
        </label>
        <CustomSelect
          value={state.sourceLanguage}
          onChange={handleSourceChange}
          options={SUPPORTED_LANGUAGES}
          disabled={state.isListening}
        />
      </div>

      {/* Swap button */}
      <div className="flex justify-center">
        <button
          onClick={handleSwap}
          disabled={state.isListening || state.sourceLanguage === "auto"}
          className="p-2 rounded-lg border border-nerd-border text-nerd-muted hover:text-nerd-accent hover:border-nerd-accent/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          title="Swap languages"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </button>
      </div>

      {/* Target language */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-nerd-muted uppercase tracking-wider">
          {t(locale, "sidebar.targetLanguage")}
        </label>
        <CustomSelect
          value={state.targetLanguage}
          onChange={handleTargetChange}
          options={targetOptions}
          disabled={state.isListening}
        />
      </div>

      {/* Mode indicator */}
      {(() => {
        const sourceIsAuto = state.sourceLanguage === "auto";
        const targetIsAuto = state.targetLanguage === "auto";
        const isTranscribe = !sourceIsAuto && !targetIsAuto && state.sourceLanguage === state.targetLanguage;
        return (
          <div className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium ${
            isTranscribe
              ? "bg-nerd-success/10 text-nerd-success border border-nerd-success/20"
              : "bg-nerd-accent/10 text-nerd-accent border border-nerd-accent/20"
          }`}>
            {isTranscribe ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                {t(locale, "language.transcribeMode")}
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                {t(locale, "language.translateMode")}
              </>
            )}
          </div>
        );
      })()}

      {state.isListening && (
        <p className="text-xs text-nerd-muted">
          {t(locale, "language.stopToChange")}
        </p>
      )}
    </div>
  );
}
