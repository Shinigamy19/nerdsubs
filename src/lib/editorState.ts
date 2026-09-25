import { type SubtitleEntry } from "@/context/TranscriptionContext";

/** Extended subtitle entry for the editor with explicit start/end times. */
export interface EditorSubtitle {
  id: string;
  original: string;
  translation: string;
  startTime: number; // ms
  endTime: number; // ms
}

export interface EditorState {
  subtitles: EditorSubtitle[];
  selectedIds: Set<string>;
  undoStack: EditorSubtitle[][];
  redoStack: EditorSubtitle[][];
  hasChanges: boolean;
}

const MAX_UNDO_LEVELS = 20;

/** Convert a SubtitleEntry (from the transcription system) to an EditorSubtitle. */
export function toEditorSubtitle(
  sub: SubtitleEntry,
  index: number,
  allSubs: SubtitleEntry[]
): EditorSubtitle {
  const startTime = sub.timestamp;
  const next = allSubs[index + 1];
  const endTime = next ? next.timestamp : startTime + 3000;
  return {
    id: sub.id,
    original: sub.original,
    translation: sub.translation ?? "",
    startTime,
    endTime,
  };
}

/** Convert a list of SubtitleEntries to EditorSubtitles. */
export function toEditorSubtitles(subs: SubtitleEntry[]): EditorSubtitle[] {
  return subs.map((sub, i) => toEditorSubtitle(sub, i, subs));
}

/** Convert EditorSubtitles back to SubtitleEntries. */
export function fromEditorSubtitles(editorSubs: EditorSubtitle[]): SubtitleEntry[] {
  return editorSubs.map((sub) => ({
    id: sub.id,
    original: sub.original,
    translation: sub.translation || undefined,
    timestamp: sub.startTime,
  }));
}

function pushUndo(state: EditorState): EditorState {
  const snapshot = state.subtitles.map((s) => ({ ...s }));
  const undoStack = [...state.undoStack, snapshot];
  if (undoStack.length > MAX_UNDO_LEVELS) {
    undoStack.shift();
  }
  return { ...state, undoStack, redoStack: [], hasChanges: true };
}

export function createEditorState(subtitles: EditorSubtitle[]): EditorState {
  return {
    subtitles: subtitles.map((s) => ({ ...s })),
    selectedIds: new Set<string>(),
    undoStack: [],
    redoStack: [],
    hasChanges: false,
  };
}

export function editSubtitle(
  state: EditorState,
  id: string,
  changes: Partial<EditorSubtitle>
): EditorState {
  const next = pushUndo(state);
  return {
    ...next,
    subtitles: next.subtitles.map((sub) =>
      sub.id === id ? { ...sub, ...changes } : sub
    ),
  };
}

export function deleteSubtitle(state: EditorState, id: string): EditorState {
  const next = pushUndo(state);
  const newSelected = new Set(next.selectedIds);
  newSelected.delete(id);
  return {
    ...next,
    subtitles: next.subtitles.filter((sub) => sub.id !== id),
    selectedIds: newSelected,
  };
}

export function deleteSelected(state: EditorState): EditorState {
  if (state.selectedIds.size === 0) return state;
  const next = pushUndo(state);
  return {
    ...next,
    subtitles: next.subtitles.filter((sub) => !next.selectedIds.has(sub.id)),
    selectedIds: new Set<string>(),
  };
}

export function addSubtitle(state: EditorState, afterId?: string): EditorState {
  const next = pushUndo(state);
  const newId = `sub-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const newSub: EditorSubtitle = {
    id: newId,
    original: "",
    translation: "",
    startTime: 0,
    endTime: 3000,
  };

  if (afterId) {
    const idx = next.subtitles.findIndex((s) => s.id === afterId);
    if (idx >= 0) {
      const after = next.subtitles[idx];
      newSub.startTime = after.endTime;
      newSub.endTime = after.endTime + 3000;
      const updated = [...next.subtitles];
      updated.splice(idx + 1, 0, newSub);
      return { ...next, subtitles: updated };
    }
  }

  // Append at the end
  if (next.subtitles.length > 0) {
    const last = next.subtitles[next.subtitles.length - 1];
    newSub.startTime = last.endTime;
    newSub.endTime = last.endTime + 3000;
  }

  return { ...next, subtitles: [...next.subtitles, newSub] };
}

export function duplicateSubtitle(state: EditorState, id: string): EditorState {
  const next = pushUndo(state);
  const idx = next.subtitles.findIndex((s) => s.id === id);
  if (idx < 0) return next;

  const original = next.subtitles[idx];
  const newId = `sub-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const duration = original.endTime - original.startTime;
  const duplicate: EditorSubtitle = {
    id: newId,
    original: original.original,
    translation: original.translation,
    startTime: original.endTime,
    endTime: original.endTime + duration,
  };

  const updated = [...next.subtitles];
  updated.splice(idx + 1, 0, duplicate);
  return { ...next, subtitles: updated };
}

export function moveSubtitle(
  state: EditorState,
  id: string,
  direction: "up" | "down"
): EditorState {
  const next = pushUndo(state);
  const idx = next.subtitles.findIndex((s) => s.id === id);
  if (idx < 0) return next;

  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= next.subtitles.length) return next;

  const updated = [...next.subtitles];
  const temp = updated[idx];
  updated[idx] = updated[swapIdx];
  updated[swapIdx] = temp;

  // Fix timestamps after swap to maintain order
  return { ...next, subtitles: fixTimestamps(updated) };
}

export function moveSelected(
  state: EditorState,
  direction: "up" | "down"
): EditorState {
  if (state.selectedIds.size === 0) return state;

  let next = state;
  // Move each selected subtitle one at a time
  const ids = direction === "up"
    ? [...state.selectedIds].reverse()
    : [...state.selectedIds];

  for (const id of ids) {
    next = moveSubtitle(next, id, direction);
  }

  return next;
}

/** Reorder subtitles by moving an item from one index to another (for drag-and-drop). */
export function reorderSubtitle(
  state: EditorState,
  fromIndex: number,
  toIndex: number
): EditorState {
  if (fromIndex === toIndex) return state;
  if (fromIndex < 0 || fromIndex >= state.subtitles.length) return state;
  if (toIndex < 0 || toIndex >= state.subtitles.length) return state;

  const next = pushUndo(state);
  const updated = [...next.subtitles];
  const [moved] = updated.splice(fromIndex, 1);
  updated.splice(toIndex, 0, moved);

  return { ...next, subtitles: fixTimestamps(updated) };
}

/** Fix timestamps so subtitles are sequential without gaps or overlaps. */
function fixTimestamps(subs: EditorSubtitle[]): EditorSubtitle[] {
  if (subs.length === 0) return subs;

  return subs.map((sub, i) => {
    if (i === 0) return sub;
    const prev = subs[i - 1];
    // If start time is before or equal to previous end, shift it
    if (sub.startTime <= prev.endTime) {
      const duration = sub.endTime - sub.startTime;
      return {
        ...sub,
        startTime: prev.endTime,
        endTime: prev.endTime + Math.max(duration, 500),
      };
    }
    return sub;
  });
}

export function undo(state: EditorState): EditorState {
  if (state.undoStack.length === 0) return state;

  const prevSubtitles = state.undoStack[state.undoStack.length - 1];
  const undoStack = state.undoStack.slice(0, -1);
  const redoStack = [...state.redoStack, state.subtitles.map((s) => ({ ...s }))];

  return {
    ...state,
    subtitles: prevSubtitles,
    undoStack,
    redoStack,
    hasChanges: true,
  };
}

export function redo(state: EditorState): EditorState {
  if (state.redoStack.length === 0) return state;

  const nextSubtitles = state.redoStack[state.redoStack.length - 1];
  const redoStack = state.redoStack.slice(0, -1);
  const undoStack = [...state.undoStack, state.subtitles.map((s) => ({ ...s }))];

  return {
    ...state,
    subtitles: nextSubtitles,
    undoStack,
    redoStack,
    hasChanges: true,
  };
}

export function selectSubtitle(
  state: EditorState,
  id: string,
  multi?: boolean
): EditorState {
  const newSelected = new Set(multi ? state.selectedIds : []);
  if (newSelected.has(id)) {
    newSelected.delete(id);
  } else {
    newSelected.add(id);
  }
  return { ...state, selectedIds: newSelected };
}

export function selectAll(state: EditorState): EditorState {
  const allIds = new Set(state.subtitles.map((s) => s.id));
  return { ...state, selectedIds: allIds };
}

export function deselectAll(state: EditorState): EditorState {
  return { ...state, selectedIds: new Set<string>() };
}

/** Save editor state back to localStorage. */
export function saveEditorStateToStorage(
  subtitles: EditorSubtitle[],
  sessionId: string
): void {
  const STORAGE_KEY = `nerdsubs_editor_${sessionId}`;
  try {
    const data = JSON.stringify(subtitles);
    localStorage.setItem(STORAGE_KEY, data);
  } catch {
    // localStorage may be unavailable
  }
}

/** Load editor state from localStorage. */
export function loadEditorStateFromStorage(
  sessionId: string
): EditorSubtitle[] | null {
  const STORAGE_KEY = `nerdsubs_editor_${sessionId}`;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed as EditorSubtitle[];
  } catch {
    return null;
  }
}

/** Format milliseconds to HH:MM:SS.mmm */
export function formatTimecode(ms: number): string {
  if (ms < 0) ms = 0;
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const millis = Math.floor(ms % 1000);
  return (
    String(hours).padStart(2, "0") +
    ":" +
    String(minutes).padStart(2, "0") +
    ":" +
    String(seconds).padStart(2, "0") +
    "." +
    String(millis).padStart(3, "0")
  );
}

/** Parse HH:MM:SS.mmm or HH:MM:SS,mmm to milliseconds. Returns NaN if invalid. */
export function parseTimecode(str: string): number {
  // Normalize comma to dot
  const normalized = str.replace(",", ".");
  const match = normalized.match(/^(\d{1,2}):(\d{2}):(\d{2})\.(\d{1,3})$/);
  if (!match) return NaN;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const seconds = parseInt(match[3], 10);
  const millis = parseInt(match[4].padEnd(3, "0"), 10);
  return hours * 3600000 + minutes * 60000 + seconds * 1000 + millis;
}

/** Format milliseconds as a human-readable duration (e.g. "2.5s"). */
export function formatDuration(ms: number): string {
  if (ms < 0) ms = 0;
  return (ms / 1000).toFixed(1) + "s";
}

/** Calculate total duration of all subtitles. */
export function totalDuration(subs: EditorSubtitle[]): number {
  if (subs.length === 0) return 0;
  const last = subs[subs.length - 1];
  return last.endTime;
}
