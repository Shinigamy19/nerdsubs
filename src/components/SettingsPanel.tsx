"use client";

import { useState, useCallback } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { t, type Locale } from "@/lib/i18n";

const STORAGE_KEY_API = "nerdsubs_api_key";
const STORAGE_KEY_MODEL = "nerdsubs_model";
const STORAGE_KEY_SOURCE = "nerdsubs_key_source";

const MODELS = [
  { id: "gemini-3.8-flash", name: "Gemini 3.8 Flash (Recommended)" },
  { id: "gemini-3.5-flash-lite", name: "Gemini 3.5 Flash Lite" },
  { id: "gemma-3", name: "Gemma 3 (Local/Edge)" },
] as const;

const UI_LANGUAGES: { code: Locale; label: string; flag: string }[] = [
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "pt", label: "Português", flag: "🇧🇷" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
];

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { locale, setLocale } = useLanguage();

  const [apiKey, setApiKey] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_API) || "";
    } catch {
      return "";
    }
  });

  const [model, setModel] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_MODEL) || "gemini-3.8-flash";
    } catch {
      return "gemini-3.8-flash";
    }
  });

  const [keySource, setKeySource] = useState<"env" | "custom">(() => {
    try {
      return (localStorage.getItem(STORAGE_KEY_SOURCE) as "env" | "custom") || "env";
    } catch {
      return "env";
    }
  });

  const handleSave = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY_API, apiKey);
      localStorage.setItem(STORAGE_KEY_MODEL, model);
      localStorage.setItem(STORAGE_KEY_SOURCE, keySource);
    } catch {
      // localStorage may be unavailable
    }
    onClose();
  }, [apiKey, model, keySource, onClose]);

  if (!isOpen) return null;

  const selectClasses =
    "w-full bg-nerd-bg border border-nerd-border rounded-lg px-4 py-3 text-nerd-text " +
    "focus:outline-none focus:ring-2 focus:ring-nerd-accent focus:border-transparent " +
    "appearance-none cursor-pointer min-h-[44px] " +
    "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%2364748b%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.168l3.71-3.938a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200l-4.25-4.5a.75.75%200%2001.02-1.06z%22%20clip-rule%3D%22evenodd%22%20%2F%3E%3C%2Fsvg%3E')] " +
    "bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat pr-10";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal — full-width bottom sheet on mobile, centered on desktop */}
      <div className="relative bg-nerd-card border border-nerd-border rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md sm:mx-4 max-h-[92vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-nerd-border sticky top-0 bg-nerd-card/95 backdrop-blur-sm z-10">
          <h2 className="text-base sm:text-lg font-bold text-nerd-text">
            {t(locale, "settings.title")}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-nerd-muted hover:text-nerd-text hover:bg-nerd-border/50 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
          {/* API Key source toggle */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-nerd-muted uppercase tracking-wider">
              {t(locale, "settings.apiKey")}
            </label>
            <div className="flex rounded-lg bg-nerd-bg border border-nerd-border p-1 gap-1">
              <button
                onClick={() => setKeySource("env")}
                className={`flex-1 py-2.5 px-3 rounded-md text-sm font-medium transition-all min-h-[44px] ${
                  keySource === "env"
                    ? "bg-nerd-accent text-white shadow"
                    : "text-nerd-muted hover:text-nerd-text"
                }`}
              >
                {t(locale, "settings.envKey")}
              </button>
              <button
                onClick={() => setKeySource("custom")}
                className={`flex-1 py-2.5 px-3 rounded-md text-sm font-medium transition-all min-h-[44px] ${
                  keySource === "custom"
                    ? "bg-nerd-accent text-white shadow"
                    : "text-nerd-muted hover:text-nerd-text"
                }`}
              >
                {t(locale, "settings.customKey")}
              </button>
            </div>
          </div>

          {/* Custom API key input */}
          {keySource === "custom" && (
            <div className="space-y-2">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIza..."
                className="w-full bg-nerd-bg border border-nerd-border rounded-lg px-4 py-3 text-nerd-text placeholder:text-nerd-muted/50 focus:outline-none focus:ring-2 focus:ring-nerd-accent focus:border-transparent font-mono text-sm min-h-[44px]"
              />
              {!apiKey && (
                <p className="text-xs text-nerd-warning">
                  ⚠ No API key configured. Transcription will not work without one.
                </p>
              )}
            </div>
          )}

          {/* Model selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-nerd-muted uppercase tracking-wider">
              {t(locale, "settings.model")}
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className={selectClasses}
            >
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* UI Language */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-nerd-muted uppercase tracking-wider">
              {t(locale, "settings.language")}
            </label>
            <div className="flex flex-wrap gap-2">
              {UI_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLocale(lang.code)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all border min-h-[44px] ${
                    locale === lang.code
                      ? "bg-nerd-accent text-white border-nerd-accent shadow-lg shadow-nerd-accent/25"
                      : "bg-nerd-bg text-nerd-muted border-nerd-border hover:border-nerd-accent/50 hover:text-nerd-text"
                  }`}
                  title={lang.label}
                >
                  <span className="emoji-flag">{lang.flag}</span>
                  <span className="hidden sm:inline">{lang.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 sm:p-6 border-t border-nerd-border sticky bottom-0 bg-nerd-card/95 backdrop-blur-sm">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg text-sm font-medium text-nerd-muted hover:text-nerd-text hover:bg-nerd-border/50 transition-all min-h-[44px]"
          >
            {t(locale, "settings.cancel")}
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-nerd-accent text-white shadow-lg shadow-nerd-accent/25 hover:bg-nerd-accent-light hover:shadow-nerd-accent/40 transition-all min-h-[44px]"
          >
            {t(locale, "settings.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
