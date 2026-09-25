"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  type EditorSubtitle,
  formatTimecode,
  parseTimecode,
  formatDuration,
  editSubtitle,
  deleteSubtitle,
  duplicateSubtitle,
  moveSubtitle,
  selectSubtitle,
  type EditorState,
} from "@/lib/editorState";

interface SubtitleRowProps {
  subtitle: EditorSubtitle;
  index: number;
  state: EditorState;
  onStateChange: (state: EditorState) => void;
  onScrollTo: (id: string) => void;
  dragHandleProps: {
    onMouseDown: (e: React.MouseEvent) => void;
  };
}

export function SubtitleRow({
  subtitle,
  index,
  state,
  onStateChange,
  dragHandleProps,
}: SubtitleRowProps) {
  const isSelected = state.selectedIds.has(subtitle.id);
  const [editingStart, setEditingStart] = useState(false);
  const [editingEnd, setEditingEnd] = useState(false);
  const [startValue, setStartValue] = useState(formatTimecode(subtitle.startTime));
  const [endValue, setEndValue] = useState(formatTimecode(subtitle.endTime));
  const startRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLInputElement>(null);
  const originalRef = useRef<HTMLTextAreaElement>(null);
  const translationRef = useRef<HTMLTextAreaElement>(null);

  const duration = subtitle.endTime - subtitle.startTime;

  // Auto-resize textarea
  const autoResize = useCallback((textarea: HTMLTextAreaElement) => {
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
  }, []);

  useEffect(() => {
    if (originalRef.current) autoResize(originalRef.current);
    if (translationRef.current) autoResize(translationRef.current);
  }, [subtitle.original, subtitle.translation, autoResize]);

  const commitStartTime = useCallback(() => {
    setEditingStart(false);
    const ms = parseTimecode(startValue);
    if (!isNaN(ms)) {
      const nextState = editSubtitle(state, subtitle.id, { startTime: ms });
      onStateChange(nextState);
    } else {
      setStartValue(formatTimecode(subtitle.startTime));
    }
  }, [startValue, state, subtitle.id, subtitle.startTime, onStateChange]);

  const commitEndTime = useCallback(() => {
    setEditingEnd(false);
    const ms = parseTimecode(endValue);
    if (!isNaN(ms)) {
      const nextState = editSubtitle(state, subtitle.id, { endTime: ms });
      onStateChange(nextState);
    } else {
      setEndValue(formatTimecode(subtitle.endTime));
    }
  }, [endValue, state, subtitle.id, subtitle.endTime, onStateChange]);

  // Sync timecode display when subtitle changes externally
  useEffect(() => {
    if (!editingStart) setStartValue(formatTimecode(subtitle.startTime));
    if (!editingEnd) setEndValue(formatTimecode(subtitle.endTime));
  }, [subtitle.startTime, subtitle.endTime, editingStart, editingEnd]);

  const handleOriginalChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const nextState = editSubtitle(state, subtitle.id, { original: e.target.value });
      onStateChange(nextState);
      autoResize(e.target);
    },
    [state, subtitle.id, onStateChange, autoResize]
  );

  const handleTranslationChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const nextState = editSubtitle(state, subtitle.id, { translation: e.target.value });
      onStateChange(nextState);
      autoResize(e.target);
    },
    [state, subtitle.id, onStateChange, autoResize]
  );

  const handleSelect = useCallback(
    (e: React.MouseEvent) => {
      const nextState = selectSubtitle(state, subtitle.id, e.shiftKey || e.ctrlKey || e.metaKey);
      onStateChange(nextState);
    },
    [state, subtitle.id, onStateChange]
  );

  return (
    <div
      className={`flex items-start gap-2 p-3 rounded-lg border transition-colors group ${
        isSelected
          ? "border-nerd-accent bg-nerd-accent/10"
          : "border-nerd-border bg-nerd-card/50 hover:bg-nerd-card hover:border-nerd-muted/30"
      }`}
    >
      {/* Drag handle */}
      <div
        {...dragHandleProps}
        className="mt-2 cursor-grab active:cursor-grabbing text-nerd-muted hover:text-nerd-text p-1 opacity-40 group-hover:opacity-100 transition-opacity select-none"
        title="Drag to reorder"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="9" cy="6" r="1.5" />
          <circle cx="15" cy="6" r="1.5" />
          <circle cx="9" cy="12" r="1.5" />
          <circle cx="15" cy="12" r="1.5" />
          <circle cx="9" cy="18" r="1.5" />
          <circle cx="15" cy="18" r="1.5" />
        </svg>
      </div>

      {/* Checkbox */}
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => {}}
        onClick={handleSelect}
        className="mt-2.5 accent-nerd-accent w-4 h-4 cursor-pointer"
      />

      {/* Index */}
      <div className="mt-2 text-xs font-mono text-nerd-muted w-8 text-center select-none">
        {index + 1}
      </div>

      {/* Content area */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Timecodes */}
        <div className="flex items-center gap-2 text-xs font-mono">
          {editingStart ? (
            <input
              ref={startRef}
              type="text"
              value={startValue}
              onChange={(e) => setStartValue(e.target.value)}
              onBlur={commitStartTime}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitStartTime();
                if (e.key === "Escape") {
                  setStartValue(formatTimecode(subtitle.startTime));
                  setEditingStart(false);
                }
              }}
              className="bg-nerd-bg border border-nerd-accent rounded px-2 py-1 text-nerd-text w-32 focus:outline-none focus:border-nerd-accent"
              autoFocus
            />
          ) : (
            <button
              onClick={() => setEditingStart(true)}
              className="bg-nerd-bg border border-nerd-border rounded px-2 py-1 text-nerd-text hover:border-nerd-muted w-32 text-left cursor-text"
            >
              {formatTimecode(subtitle.startTime)}
            </button>
          )}

          <span className="text-nerd-muted">→</span>

          {editingEnd ? (
            <input
              ref={endRef}
              type="text"
              value={endValue}
              onChange={(e) => setEndValue(e.target.value)}
              onBlur={commitEndTime}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitEndTime();
                if (e.key === "Escape") {
                  setEndValue(formatTimecode(subtitle.endTime));
                  setEditingEnd(false);
                }
              }}
              className="bg-nerd-bg border border-nerd-accent rounded px-2 py-1 text-nerd-text w-32 focus:outline-none focus:border-nerd-accent"
              autoFocus
            />
          ) : (
            <button
              onClick={() => setEditingEnd(true)}
              className="bg-nerd-bg border border-nerd-border rounded px-2 py-1 text-nerd-text hover:border-nerd-muted w-32 text-left cursor-text"
            >
              {formatTimecode(subtitle.endTime)}
            </button>
          )}

          <span className="text-nerd-muted/60 bg-nerd-bg rounded px-2 py-1">
            {formatDuration(duration)}
          </span>
        </div>

        {/* Original text */}
        <textarea
          ref={originalRef}
          value={subtitle.original}
          onChange={handleOriginalChange}
          placeholder="Original text..."
          rows={1}
          className="w-full bg-nerd-bg border border-nerd-border rounded-lg px-3 py-2 text-sm text-nerd-text resize-none overflow-hidden focus:outline-none focus:border-nerd-muted placeholder:text-nerd-muted/40"
        />

        {/* Translation text */}
        <textarea
          ref={translationRef}
          value={subtitle.translation}
          onChange={handleTranslationChange}
          placeholder="Translation (optional)..."
          rows={1}
          className="w-full bg-nerd-bg border border-nerd-border rounded-lg px-3 py-2 text-sm text-nerd-muted resize-none overflow-hidden focus:outline-none focus:border-nerd-muted placeholder:text-nerd-muted/30"
        />
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => {
            onStateChange(deleteSubtitle(state, subtitle.id));
          }}
          className="p-1 text-nerd-muted hover:text-red-400 transition-colors rounded"
          title="Delete"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
        <button
          onClick={() => {
            onStateChange(duplicateSubtitle(state, subtitle.id));
          }}
          className="p-1 text-nerd-muted hover:text-nerd-accent transition-colors rounded"
          title="Duplicate"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
        <button
          onClick={() => {
            onStateChange(moveSubtitle(state, subtitle.id, "up"));
          }}
          disabled={index === 0}
          className="p-1 text-nerd-muted hover:text-nerd-accent transition-colors rounded disabled:opacity-30 disabled:cursor-not-allowed"
          title="Move up"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
        <button
          onClick={() => {
            onStateChange(moveSubtitle(state, subtitle.id, "down"));
          }}
          disabled={index === state.subtitles.length - 1}
          className="p-1 text-nerd-muted hover:text-nerd-accent transition-colors rounded disabled:opacity-30 disabled:cursor-not-allowed"
          title="Move down"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
