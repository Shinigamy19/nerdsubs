"use client";

import { useState, useRef, useCallback } from "react";
import { uploadCustomFont, getCustomFonts, saveCustomFonts, type FontFamily } from "@/lib/fonts";

interface FontUploaderProps {
  onFontUploaded: (font: FontFamily) => void;
}

export function FontUploader({ onFontUploaded }: FontUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFont, setUploadedFont] = useState<FontFamily | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setUploadedFont(null);

      try {
        const font = await uploadCustomFont(file);
        const existing = getCustomFonts();
        const updated = [...existing, font];
        saveCustomFonts(updated);
        setUploadedFont(font);
        onFontUploaded(font);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      }
    },
    [onFontUploaded]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = "";
    },
    [handleFile]
  );

  return (
    <div className="space-y-3">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
          isDragging
            ? "border-nerd-accent bg-nerd-accent/10"
            : "border-nerd-border hover:border-nerd-accent/50 hover:bg-nerd-card/50"
        }`}
      >
        <svg
          className="w-8 h-8 mx-auto mb-2 text-nerd-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <p className="text-sm text-nerd-muted">
          {isDragging ? "Drop font file here" : "Drag & drop a font file"}
        </p>
        <p className="text-xs text-nerd-muted/60 mt-1">
          Accepts .ttf, .otf, .woff, .woff2 (max 5MB)
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".ttf,.otf,.woff,.woff2"
        onChange={handleInputChange}
        className="hidden"
      />

      {error && (
        <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {uploadedFont && (
        <div className="p-3 bg-nerd-success/10 border border-nerd-success/30 rounded-lg">
          <p className="text-xs text-nerd-success font-medium">{uploadedFont.name}</p>
          <p
            className="text-sm text-nerd-text mt-1"
            style={{ fontFamily: `"${uploadedFont.name}", sans-serif` }}
          >
            Font uploaded successfully
          </p>
        </div>
      )}
    </div>
  );
}
