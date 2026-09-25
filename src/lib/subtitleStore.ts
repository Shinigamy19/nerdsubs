import { type SubtitleEntry } from "@/context/TranscriptionContext";

export interface StoredSession {
  sessionId: string;
  sourceLanguage: string;
  targetLanguage: string;
  mode: "transcribe" | "translate";
  subtitles: SubtitleEntry[];
  startedAt: number;
  lastUpdated: number;
}

const STORAGE_KEY = "nerdsubs_sessions";
const MAX_SESSIONS = 50;
const AUTO_SAVE_INTERVAL = 10; // save every N new subtitles
const AUTO_SAVE_SECONDS = 30; // or every N seconds

let lastAutoSaveCount = 0;
let lastAutoSaveTime = Date.now();

function readAllSessions(): StoredSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as StoredSession[];
  } catch {
    return [];
  }
}

function writeAllSessions(sessions: StoredSession[]): void {
  try {
    // If over quota, evict oldest sessions first
    let serialized: string;
    try {
      serialized = JSON.stringify(sessions);
      localStorage.setItem(STORAGE_KEY, serialized);
      return;
    } catch {
      // quota exceeded — trim oldest and retry
      while (sessions.length > 1) {
        sessions.shift();
        try {
          serialized = JSON.stringify(sessions);
          localStorage.setItem(STORAGE_KEY, serialized);
          return;
        } catch {
          // still too big, keep trimming
        }
      }
      // last resort: store only one session
      serialized = JSON.stringify(sessions);
      localStorage.setItem(STORAGE_KEY, serialized);
    }
  } catch {
    // localStorage completely unavailable — silently fail
  }
}

/** Save subtitles for a session (upserts by sessionId). */
export function saveSessionSubtitles(session: StoredSession): void {
  const sessions = readAllSessions();
  const idx = sessions.findIndex((s) => s.sessionId === session.sessionId);

  if (idx >= 0) {
    sessions[idx] = session;
  } else {
    sessions.push(session);
    // Enforce max sessions — drop oldest first
    while (sessions.length > MAX_SESSIONS) {
      sessions.sort((a, b) => a.lastUpdated - b.lastUpdated);
      sessions.shift();
    }
  }

  writeAllSessions(sessions);
}

/** Get subtitles for a single session. */
export function getSessionSubtitles(sessionId: string): StoredSession | null {
  const sessions = readAllSessions();
  return sessions.find((s) => s.sessionId === sessionId) ?? null;
}

/** Get all stored sessions. */
export function getAllSessions(): StoredSession[] {
  return readAllSessions();
}

/** Delete a single session. */
export function deleteSession(sessionId: string): void {
  const sessions = readAllSessions();
  const filtered = sessions.filter((s) => s.sessionId !== sessionId);
  writeAllSessions(filtered);
}

/** Clear all stored sessions. */
export function clearAllSessions(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // silently fail
  }
}

/** Export all sessions as a single pretty-printed JSON string. */
export function exportAllSessionsJSON(): string {
  const sessions = readAllSessions();
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      sessionCount: sessions.length,
      sessions,
    },
    null,
    2
  );
}

/**
 * Auto-save: triggers when the subtitle count increases by AUTO_SAVE_INTERVAL
 * or when AUTO_SAVE_SECONDS seconds have elapsed since the last save.
 * Deduplicates — won't save if nothing changed.
 */
export function autoSave(
  sessionId: string,
  subtitles: SubtitleEntry[],
  meta: {
    sourceLanguage: string;
    targetLanguage: string;
    mode: "transcribe" | "translate";
  }
): void {
  const now = Date.now();
  const subtitleDelta = subtitles.length - lastAutoSaveCount;
  const timeDelta = (now - lastAutoSaveTime) / 1000;

  if (subtitleDelta < AUTO_SAVE_INTERVAL && timeDelta < AUTO_SAVE_SECONDS) {
    return;
  }

  if (subtitles.length === 0) return;

  // Check if anything actually changed
  const existing = getSessionSubtitles(sessionId);
  if (existing && existing.subtitles.length === subtitles.length) {
    return;
  }

  const existingSession = getSessionSubtitles(sessionId);

  const session: StoredSession = {
    sessionId,
    sourceLanguage: meta.sourceLanguage,
    targetLanguage: meta.targetLanguage,
    mode: meta.mode,
    subtitles,
    startedAt: existingSession?.startedAt ?? now,
    lastUpdated: now,
  };

  saveSessionSubtitles(session);
  lastAutoSaveCount = subtitles.length;
  lastAutoSaveTime = now;
}

/** Reset auto-save counters (useful when switching sessions). */
export function resetAutoSaveCounters(): void {
  lastAutoSaveCount = 0;
  lastAutoSaveTime = Date.now();
}
