"use client";

import { useState, useCallback, useRef } from "react";
import {
  type FontFamily,
  uploadCustomFont,
  getCustomFonts,
  saveCustomFonts,
} from "@/lib/fonts";
import { type FontSettings } from "@/lib/fontSettings";

const PRESET_COLORS = [
  "#ffffff",
  "#000000",
  "#ff0000",
  "#00ff00",
  "#0000ff",
  "#ffff00",
  "#ff00ff",
  "#00ffff",
  "#ff8800",
  "#88ff00",
  "#0088ff",
  "#ff0088",
];

interface FontPickerProps {
  settings: FontSettings;
  onSettingsChange: (settings: FontSettings) => void;
  previewText?: string;
}

export function FontPicker({
  settings,
  onSettingsChange,
  previewText = "The quick brown fox jumps over the lazy dog",
}: FontPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<"system" | "google" | "custom">("system");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [customFonts, setCustomFonts] = useState<FontFamily[]>(() => getCustomFonts());

  const handleFontChange = useCallback(
    (fontId: string) => {
      onSettingsChange({ ...settings, fontFamily: fontId });
      setIsOpen(false);
    },
    [settings, onSettingsChange]
  );

  const handleSizeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onSettingsChange({ ...settings, fontSize: parseInt(e.target.value, 10) });
    },
    [settings, onSettingsChange]
  );

  const handleWeightChange = useCallback(
    (weight: number) => {
      onSettingsChange({ ...settings, fontWeight: weight });
    },
    [settings, onSettingsChange]
  );

  const handleColorChange = useCallback(
    (color: string) => {
      onSettingsChange({ ...settings, fontColor: color });
    },
    [settings, onSettingsChange]
  );

  const handleFileUpload = useCallback(
    async (file: File) => {
      setUploadError(null);
      try {
        const font = await uploadCustomFont(file);
        const updated = [...customFonts, font];
        setCustomFonts(updated);
        saveCustomFonts(updated);
        onSettingsChange({ ...settings, fontFamily: font.id });
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : "Upload failed");
      }
    },
    [customFonts, settings, onSettingsChange]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileUpload(file);
      e.target.value = "";
    },
    [handleFileUpload]
  );

  const categories = {
    system: {
      label: "System Fonts",
      fonts: [
        { id: "system-ui", name: "System UI" },
        { id: "Arial", name: "Arial" },
        { id: "Helvetica", name: "Helvetica" },
        { id: "Georgia", name: "Georgia" },
        { id: "Courier New", name: "Courier New" },
        { id: "Verdana", name: "Verdana" },
        { id: "Impact", name: "Impact" },
      ],
    },
    google: {
      label: "Google Fonts",
      fonts: [
        { id: "roboto", name: "Roboto" },
        { id: "open-sans", name: "Open Sans" },
        { id: "montserrat", name: "Montserrat" },
        { id: "source-code-pro", name: "Source Code Pro" },
        { id: "lato", name: "Lato" },
        { id: "oswald", name: "Oswald" },
        { id: "raleway", name: "Raleway" },
      ],
    },
    custom: {
      label: "Custom Fonts",
      fonts: customFonts.map((f) => ({ id: f.id, name: f.name })),
    },
  };

  const currentFonts = categories[activeCategory].fonts;
  const currentFontName =
    categories.system.fonts.find((f) => f.id === settings.fontFamily)?.name ||
    categories.google.fonts.find((f) => f.id === settings.fontFamily)?.name ||
    customFonts.find((f) => f.id === settings.fontFamily)?.name ||
    settings.fontFamily;

  return (
    <div className="space-y-3">
      {/* Font family selector */}
      <div>
        <label className="block text-xs font-medium text-nerd-muted mb-1.5">Font Family</label>
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between bg-nerd-bg border border-nerd-border rounded-lg px-3 py-2 text-sm text-nerd-text hover:border-nerd-muted transition-colors"
          >
            <span style={{ fontFamily: `"${settings.fontFamily}", sans-serif` }}>
              {currentFontName}
            </span>
            <svg
              className={`w-4 h-4 text-nerd-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isOpen && (
            <div className="absolute z-20 mt-1 w-full bg-nerd-card border border-nerd-border rounded-lg shadow-lg max-h-64 overflow-hidden">
              {/* Category tabs */}
              <div className="flex border-b border-nerd-border">
                {(["system", "google", "custom"] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`flex-1 py-2 text-xs font-medium transition-colors ${
                      activeCategory === cat
                        ? "text-nerd-accent border-b-2 border-nerd-accent"
                        : "text-nerd-muted hover:text-nerd-text"
                    }`}
                  >
                    {categories[cat].label}
                  </button>
                ))}
              </div>

              {/* Font list */}
              <div className="overflow-y-auto max-h-48">
                {currentFonts.map((font) => (
                  <button
                    key={font.id}
                    onClick={() => handleFontChange(font.id)}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-nerd-border/50 ${
                      settings.fontFamily === font.id
                        ? "bg-nerd-accent/10 text-nerd-accent"
                        : "text-nerd-text"
                    }`}
                    style={{ fontFamily: `"${font.name}", sans-serif` }}
                  >
                    {font.name}
                  </button>
                ))}
                {activeCategory === "custom" && currentFonts.length === 0 && (
                  <div className="px-3 py-4 text-xs text-nerd-muted text-center">
                    No custom fonts uploaded
                  </div>
                )}
              </div>

              {/* Upload button for custom fonts */}
              {activeCategory === "custom" && (
                <div className="border-t border-nerd-border p-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2 text-xs font-medium text-nerd-accent hover:bg-nerd-accent/10 rounded-md transition-colors"
                  >
                    + Upload Custom Font
                  </button>
                  {uploadError && (
                    <p className="text-xs text-red-400 mt-1 text-center">{uploadError}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".ttf,.otf,.woff,.woff2"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>

      {/* Font size */}
      <div>
        <label className="block text-xs font-medium text-nerd-muted mb-1.5">
          Size: {settings.fontSize}px
        </label>
        <input
          type="range"
          min="12"
          max="72"
          value={settings.fontSize}
          onChange={handleSizeChange}
          className="w-full accent-nerd-accent"
        />
        <div className="flex justify-between text-[10px] text-nerd-muted">
          <span>12px</span>
          <span>72px</span>
        </div>
      </div>

      {/* Font weight */}
      <div>
        <label className="block text-xs font-medium text-nerd-muted mb-1.5">Weight</label>
        <div className="flex gap-2">
          {[
            { value: 400, label: "Normal" },
            { value: 700, label: "Bold" },
          ].map((w) => (
            <button
              key={w.value}
              onClick={() => handleWeightChange(w.value)}
              className={`flex-1 py-1.5 text-xs rounded-md border transition-colors ${
                settings.fontWeight === w.value
                  ? "border-nerd-accent bg-nerd-accent/10 text-nerd-accent"
                  : "border-nerd-border text-nerd-muted hover:text-nerd-text"
              }`}
              style={{ fontWeight: w.value }}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      {/* Font color */}
      <div>
        <label className="block text-xs font-medium text-nerd-muted mb-1.5">Color</label>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => handleColorChange(color)}
              className={`w-6 h-6 rounded-md border-2 transition-transform hover:scale-110 ${
                settings.fontColor === color ? "border-nerd-accent scale-110" : "border-nerd-border"
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
          <input
            type="color"
            value={settings.fontColor}
            onChange={(e) => handleColorChange(e.target.value)}
            className="w-6 h-6 rounded-md border border-nerd-border cursor-pointer"
            title="Custom color"
          />
        </div>
      </div>

      {/* Preview */}
      <div>
        <label className="block text-xs font-medium text-nerd-muted mb-1.5">Preview</label>
        <div
          className="bg-black/50 rounded-lg p-4 text-center border border-nerd-border"
          style={{
            fontFamily: `"${settings.fontFamily}", sans-serif`,
            fontSize: `${Math.min(settings.fontSize, 36)}px`,
            fontWeight: settings.fontWeight,
            color: settings.fontColor,
          }}
        >
          {previewText}
        </div>
      </div>
    </div>
  );
}
