"use client";

import { type EditorState, totalDuration, formatDuration } from "@/lib/editorState";

interface EditorToolbarProps {
  state: EditorState;
  onAddSubtitle: () => void;
  onDeleteSelected: () => void;
  onDuplicateSelected: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
}

export function EditorToolbar({
  state,
  onAddSubtitle,
  onDeleteSelected,
  onDuplicateSelected,
  onMoveUp,
  onMoveDown,
  onSelectAll,
  onDeselectAll,
  onUndo,
  onRedo,
  onSave,
}: EditorToolbarProps) {
  const hasSelection = state.selectedIds.size > 0;
  const canUndo = state.undoStack.length > 0;
  const canRedo = state.redoStack.length > 0;
  const total = totalDuration(state.subtitles);

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-nerd-card border border-nerd-border rounded-lg">
      {/* Navigation */}
      <a
        href="/"
        className="text-xs text-nerd-muted hover:text-nerd-accent transition-colors flex items-center gap-1 mr-2"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to NerdSubs
      </a>

      <div className="w-px h-5 bg-nerd-border" />

      {/* Add */}
      <button
        onClick={onAddSubtitle}
        className="px-3 py-1.5 text-xs font-medium bg-nerd-accent text-white rounded-md hover:bg-nerd-accent-light transition-colors"
      >
        + Add
      </button>

      {/* Selection actions */}
      <button
        onClick={onSelectAll}
        className="px-3 py-1.5 text-xs text-nerd-muted hover:text-nerd-text border border-nerd-border rounded-md hover:bg-nerd-border/50 transition-colors"
      >
        Select All
      </button>
      <button
        onClick={onDeselectAll}
        disabled={!hasSelection}
        className="px-3 py-1.5 text-xs text-nerd-muted hover:text-nerd-text border border-nerd-border rounded-md hover:bg-nerd-border/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Deselect
      </button>

      <div className="w-px h-5 bg-nerd-border" />

      {/* Edit actions */}
      <button
        onClick={onDeleteSelected}
        disabled={!hasSelection}
        className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 border border-red-500/30 rounded-md hover:bg-red-500/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Delete ({state.selectedIds.size})
      </button>
      <button
        onClick={onDuplicateSelected}
        disabled={!hasSelection}
        className="px-3 py-1.5 text-xs text-nerd-muted hover:text-nerd-text border border-nerd-border rounded-md hover:bg-nerd-border/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Duplicate
      </button>

      <div className="w-px h-5 bg-nerd-border" />

      {/* Move */}
      <button
        onClick={onMoveUp}
        disabled={!hasSelection}
        className="p-1.5 text-nerd-muted hover:text-nerd-text border border-nerd-border rounded-md hover:bg-nerd-border/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        title="Move up"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>
      <button
        onClick={onMoveDown}
        disabled={!hasSelection}
        className="p-1.5 text-nerd-muted hover:text-nerd-text border border-nerd-border rounded-md hover:bg-nerd-border/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        title="Move down"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div className="w-px h-5 bg-nerd-border" />

      {/* Undo/Redo */}
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className="p-1.5 text-nerd-muted hover:text-nerd-text border border-nerd-border rounded-md hover:bg-nerd-border/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        title="Undo (Ctrl+Z)"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a5 5 0 015 5v2M3 10l4-4M3 10l4 4" />
        </svg>
      </button>
      <button
        onClick={onRedo}
        disabled={!canRedo}
        className="p-1.5 text-nerd-muted hover:text-nerd-text border border-nerd-border rounded-md hover:bg-nerd-border/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        title="Redo (Ctrl+Shift+Z)"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a5 5 0 00-5 5v2M21 10l-4-4M21 10l-4 4" />
        </svg>
      </button>

      <div className="flex-1" />

      {/* Stats */}
      <div className="flex items-center gap-3 text-xs text-nerd-muted font-mono mr-2">
        <span>{state.subtitles.length} subs</span>
        <span>{formatDuration(total)}</span>
        {state.hasChanges && (
          <span className="w-2 h-2 rounded-full bg-nerd-warning" title="Unsaved changes" />
        )}
      </div>

      {/* Save */}
      <button
        onClick={onSave}
        className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${
          state.hasChanges
            ? "bg-nerd-success text-white hover:bg-nerd-success/80"
            : "bg-nerd-border text-nerd-muted"
        }`}
      >
        Save
      </button>
    </div>
  );
}
