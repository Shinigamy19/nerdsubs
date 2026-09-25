"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  type EditorSubtitle,
  type EditorState,
  toEditorSubtitles,
  fromEditorSubtitles,
  createEditorState,
  addSubtitle,
  deleteSelected,
  duplicateSubtitle as duplicateSub,
  moveSelected,
  undo as undoAction,
  redo as redoAction,
  selectAll as selectAllAction,
  deselectAll as deselectAllAction,
  saveEditorStateToStorage,
  loadEditorStateFromStorage,
  totalDuration,
  formatDuration,
  reorderSubtitle,
} from "@/lib/editorState";
import { type SubtitleEntry } from "@/context/TranscriptionContext";
import { useLanguage } from "@/context/LanguageContext";
import { t } from "@/lib/i18n";
import { getAllSessions, saveSessionSubtitles, type StoredSession } from "@/lib/subtitleStore";
import { LanguageProvider } from "@/context/LanguageContext";
import { getFontSettings, saveFontSettings, type FontSettings } from "@/lib/fontSettings";
import { applyFontToDocument, findFontById } from "@/lib/fonts";
import { SubtitleRow } from "@/components/editor/SubtitleRow";
import { Timeline } from "@/components/editor/Timeline";
import { EditorToolbar } from "@/components/editor/EditorToolbar";
import { FontPicker } from "@/components/editor/FontPicker";
import { SubtitlePreview } from "@/components/editor/SubtitlePreview";

const DEFAULT_SESSION = "main-stage";

export default function EditorPageWrapper() {
  return (
    <LanguageProvider>
      <EditorPage />
    </LanguageProvider>
  );
}

function EditorPage() {
  const { locale } = useLanguage();
  const [state, setState] = useState<EditorState>(() =>
    createEditorState([])
  );
  const [sessionId, setSessionId] = useState(DEFAULT_SESSION);
  const [fontSettings, setFontSettings] = useState<FontSettings>(() => getFontSettings());
  const [showPreview, setShowPreview] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<{
    fromIndex: number;
    startY: number;
    items: { id: string; top: number }[];
  } | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);

  // Load subtitles from localStorage on mount
  useEffect(() => {
    try {
      const sessions = getAllSessions();
      let loadedSubs: EditorSubtitle[] = [];

      if (sessions.length > 0) {
        const sorted = [...sessions].sort((a, b) => b.lastUpdated - a.lastUpdated);
        const session = sorted[0];
        setSessionId(session.sessionId);
        loadedSubs = toEditorSubtitles(session.subtitles);
      } else {
        const saved = loadEditorStateFromStorage(DEFAULT_SESSION);
        if (saved) loadedSubs = saved;
      }

      setState(createEditorState(loadedSubs));
    } catch (err) {
      console.error("Editor load error:", err);
    } finally {
      setLoaded(true);
    }
  }, []);

  // Load font settings
  useEffect(() => {
    setFontSettings(getFontSettings());
  }, []);

  // Apply font settings when they change
  useEffect(() => {
    saveFontSettings(fontSettings);
    // Find and apply the font if it's a custom font
    if (fontSettings.fontFamily.startsWith("custom-")) {
      const font = findFontById(fontSettings.fontFamily);
      if (font) applyFontToDocument(font);
    }
  }, [fontSettings]);

  // Auto-save every 5 seconds if there are unsaved changes
  useEffect(() => {
    if (state.hasChanges && state.subtitles.length > 0) {
      autoSaveTimerRef.current = setInterval(() => {
        const current = stateRef.current;
        saveEditorStateToStorage(current.subtitles, sessionId);
        const editorSubs: SubtitleEntry[] = fromEditorSubtitles(current.subtitles);
        const session: StoredSession = {
          sessionId,
          sourceLanguage: "auto",
          targetLanguage: "es",
          mode: "translate",
          subtitles: editorSubs,
          startedAt: Date.now(),
          lastUpdated: Date.now(),
        };
        saveSessionSubtitles(session);
        setState((prev) => ({ ...prev, hasChanges: false }));
      }, 5000);
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    };
  }, [state.hasChanges, state.subtitles.length, sessionId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S: Save
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
      // Ctrl+Z: Undo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Ctrl+Shift+Z: Redo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        handleRedo();
      }
      // Ctrl+Y: Redo (alternative)
      if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        handleRedo();
      }
      // Delete: Delete selected
      if (e.key === "Delete" && state.selectedIds.size > 0) {
        e.preventDefault();
        handleDeleteSelected();
      }
      // Ctrl+D: Duplicate selected
      if ((e.ctrlKey || e.metaKey) && e.key === "d" && !(e.target instanceof HTMLElement && e.target.closest("textarea, input"))) {
        e.preventDefault();
        handleDuplicateSelected();
      }
      // Ctrl+A: Select all
      if ((e.ctrlKey || e.metaKey) && e.key === "a" && !(e.target instanceof HTMLElement && e.target.closest("textarea, input"))) {
        e.preventDefault();
        handleSelectAll();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Handlers ---

  const handleSave = useCallback(() => {
    saveEditorStateToStorage(state.subtitles, sessionId);
    const editorSubs: SubtitleEntry[] = fromEditorSubtitles(state.subtitles);
    const session: StoredSession = {
      sessionId,
      sourceLanguage: "auto",
      targetLanguage: "es",
      mode: "translate",
      subtitles: editorSubs,
      startedAt: Date.now(),
      lastUpdated: Date.now(),
    };
    saveSessionSubtitles(session);
    setState((prev) => ({ ...prev, hasChanges: false }));
  }, [state.subtitles, sessionId]);

  const handleAddSubtitle = useCallback(() => {
    setState((prev) => addSubtitle(prev));
  }, []);

  const handleDeleteSelected = useCallback(() => {
    setState((prev) => deleteSelected(prev));
  }, []);

  const handleDuplicateSelected = useCallback(() => {
    setState((prev) => {
      let next = prev;
      for (const id of prev.selectedIds) {
        next = duplicateSub(next, id);
      }
      return next;
    });
  }, []);

  const handleMoveUp = useCallback(() => {
    setState((prev) => moveSelected(prev, "up"));
  }, []);

  const handleMoveDown = useCallback(() => {
    setState((prev) => moveSelected(prev, "down"));
  }, []);

  const handleSelectAll = useCallback(() => {
    setState((prev) => selectAllAction(prev));
  }, []);

  const handleDeselectAll = useCallback(() => {
    setState((prev) => deselectAllAction(prev));
  }, []);

  const handleUndo = useCallback(() => {
    setState((prev) => undoAction(prev));
  }, []);

  const handleRedo = useCallback(() => {
    setState((prev) => redoAction(prev));
  }, []);

  // --- Drag and drop ---

  const handleDragStart = useCallback(
    (e: React.MouseEvent, index: number) => {
      e.preventDefault();
      const listEl = listRef.current;
      if (!listEl) return;

      const rows = listEl.querySelectorAll("[data-subtitle-row]");
      const items = Array.from(rows).map((row, i) => ({
        id: state.subtitles[i]?.id || `idx-${i}`,
        top: row.getBoundingClientRect().top,
      }));

      dragStateRef.current = {
        fromIndex: index,
        startY: e.clientY,
        items,
      };

      const handleMove = (me: MouseEvent) => {
        if (!dragStateRef.current) return;
        const { items: dragItems, fromIndex } = dragStateRef.current;

        let closestIndex = fromIndex;
        let closestDist = Infinity;

        dragItems.forEach((item, i) => {
          if (i === fromIndex) return;
          const dist = Math.abs(me.clientY - item.top - 20);
          if (dist < closestDist) {
            closestDist = dist;
            closestIndex = i;
          }
        });

        if (closestIndex !== fromIndex) {
          setDragOverIndex(closestIndex);
        }
      };

      const handleUp = () => {
        if (dragStateRef.current && dragOverIndex !== null && dragOverIndex !== dragStateRef.current.fromIndex) {
          setState((prev) => reorderSubtitle(prev, dragStateRef.current!.fromIndex, dragOverIndex!));
        }
        dragStateRef.current = null;
        setDragOverIndex(null);
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", handleUp);
      };

      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
    },
    [state.subtitles, dragOverIndex]
  );

  const handleBlockClick = useCallback((subtitleId: string) => {
    setSelectedSubId(subtitleId);
    // Scroll to the subtitle
    const el = document.getElementById(`subtitle-${subtitleId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  // Selected subtitle for preview
  const selectedSubtitle = useMemo(() => {
    if (selectedSubId) {
      return state.subtitles.find((s) => s.id === selectedSubId) || null;
    }
    // If exactly one selected, show that
    if (state.selectedIds.size === 1) {
      const id = [...state.selectedIds][0];
      return state.subtitles.find((s) => s.id === id) || null;
    }
    return null;
  }, [selectedSubId, state.selectedIds, state.subtitles]);

  const total = totalDuration(state.subtitles);

  if (!loaded) {
    return (
      <div className="h-screen flex items-center justify-center bg-nerd-bg">
        <div className="text-nerd-muted">Loading editor...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-nerd-bg">
      {/* Toolbar */}
      <div className="flex-shrink-0 p-3 border-b border-nerd-border">
        <EditorToolbar
          state={state}
          onAddSubtitle={handleAddSubtitle}
          onDeleteSelected={handleDeleteSelected}
          onDuplicateSelected={handleDuplicateSelected}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onSave={handleSave}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex min-h-0">
        {/* Left: Subtitle list + Timeline */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Timeline */}
          <div className="flex-shrink-0 p-3 border-b border-nerd-border">
            <Timeline
              subtitles={state.subtitles}
              totalDuration={total}
              onBlockClick={handleBlockClick}
            />
          </div>

          {/* Subtitle list */}
          <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-2">
            {state.subtitles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-nerd-muted">
                <svg
                  className="w-16 h-16 mb-4 opacity-30"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                  />
                </svg>
                <p className="text-sm">{t(locale, "editor.noSubtitles")}</p>
                <p className="text-xs mt-1 opacity-60">
                  {t(locale, "editor.addFirst")}
                </p>
              </div>
            ) : (
              state.subtitles.map((sub, index) => (
                <div
                  key={sub.id}
                  id={`subtitle-${sub.id}`}
                  data-subtitle-row
                  className={`${dragOverIndex === index ? "border-t-2 border-nerd-accent" : ""}`}
                >
                  <SubtitleRow
                    subtitle={sub}
                    index={index}
                    state={state}
                    onStateChange={setState}
                    onScrollTo={handleBlockClick}
                    dragHandleProps={{
                      onMouseDown: (e: React.MouseEvent) => handleDragStart(e, index),
                    }}
                  />
                </div>
              ))
            )}

            {/* Add subtitle button at bottom */}
            {state.subtitles.length > 0 && (
              <button
                onClick={handleAddSubtitle}
                className="w-full py-3 border-2 border-dashed border-nerd-border rounded-lg text-sm text-nerd-muted hover:text-nerd-accent hover:border-nerd-accent/50 transition-colors"
              >
                + Add Subtitle
              </button>
            )}
          </div>
        </div>

        {/* Right sidebar: Font picker + Preview */}
        <div className="w-72 flex-shrink-0 border-l border-nerd-border overflow-y-auto bg-nerd-card/30">
          <div className="p-4 space-y-4">
            {/* Preview toggle */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-nerd-muted uppercase tracking-wider">
                Settings
              </span>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="text-xs text-nerd-muted hover:text-nerd-accent transition-colors"
              >
                {showPreview ? "Hide" : "Show"} Preview
              </button>
            </div>

            {/* Preview */}
            <SubtitlePreview
              subtitle={selectedSubtitle}
              settings={fontSettings}
              visible={showPreview}
            />

            {/* Font picker */}
            <div className="border-t border-nerd-border pt-4">
              <FontPicker
                settings={fontSettings}
                onSettingsChange={setFontSettings}
                previewText={selectedSubtitle?.original || "The quick brown fox"}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex-shrink-0 px-4 py-2 border-t border-nerd-border bg-nerd-card/50 flex items-center justify-between text-[10px] text-nerd-muted font-mono">
        <div className="flex items-center gap-3">
          <span>Session: {sessionId}</span>
          <span>{state.subtitles.length} subtitles</span>
          <span>{formatDuration(total)} total</span>
        </div>
        <div className="flex items-center gap-3">
          <span>
            Undo: {state.undoStack.length} / Redo: {state.redoStack.length}
          </span>
          {state.hasChanges && <span className="text-nerd-warning">Unsaved</span>}
        </div>
      </div>
    </div>
  );
}
