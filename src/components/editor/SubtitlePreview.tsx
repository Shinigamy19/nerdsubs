"use client";

import { type FontSettings, resolveFontFamily } from "@/lib/fontSettings";
import { type EditorSubtitle, formatTimecode } from "@/lib/editorState";

interface SubtitlePreviewProps {
  subtitle: EditorSubtitle | null;
  settings: FontSettings;
  visible: boolean;
}

export function SubtitlePreview({ subtitle, settings, visible }: SubtitlePreviewProps) {
  if (!visible) return null;

  const fontFamilyValue = resolveFontFamily(settings.fontFamily);

  return (
    <div className="bg-nerd-card border border-nerd-border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-nerd-border">
        <span className="text-xs font-medium text-nerd-muted">Preview</span>
        {subtitle && (
          <span className="text-[10px] text-nerd-muted font-mono">
            {formatTimecode(subtitle.startTime)} → {formatTimecode(subtitle.endTime)}
          </span>
        )}
      </div>

      <div className="relative bg-black/60 min-h-[120px] flex items-center justify-center p-6">
        {subtitle ? (
          <div className="text-center max-w-full">
            {/* Original text */}
            {subtitle.original && (
              <div
                className="whitespace-pre-wrap break-words"
                style={{
                  fontFamily: fontFamilyValue,
                  fontSize: `${Math.min(settings.fontSize, 40)}px`,
                  fontWeight: settings.fontWeight,
                  color: settings.fontColor,
                  lineHeight: 1.3,
                  textShadow: "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000",
                }}
              >
                {subtitle.original}
              </div>
            )}

            {/* Translation text */}
            {subtitle.translation && (
              <div
                className="whitespace-pre-wrap break-words mt-2 opacity-80"
                style={{
                  fontFamily: fontFamilyValue,
                  fontSize: `${Math.min(settings.fontSize - 4, 36)}px`,
                  fontWeight: settings.fontWeight,
                  color: settings.fontColor,
                  lineHeight: 1.3,
                  textShadow: "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000",
                }}
              >
                {subtitle.translation}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-nerd-muted/50">Select a subtitle to preview</p>
        )}
      </div>
    </div>
  );
}
