export interface Session {
  id: string;
  name: string;
  description: string;
  order: number;
  createdAt: number;
}

const STORAGE_KEY = "nerdsubs_sessions_config";

const DEFAULT_SESSIONS: Session[] = [
  { id: "main-stage", name: "Main Stage", description: "Keynotes & opening talks", order: 0, createdAt: 1 },
  { id: "track-a", name: "Track A", description: "Frontend & UX", order: 1, createdAt: 1 },
  { id: "track-b", name: "Track B", description: "Backend & Infrastructure", order: 2, createdAt: 1 },
  { id: "track-c", name: "Track C", description: "AI & Data Science", order: 3, createdAt: 1 },
];

export function generateSessionId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || `session-${Date.now()}`;
}

function uniqueId(base: string, existing: string[]): string {
  let candidate = base;
  let suffix = 1;
  while (existing.includes(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix++;
  }
  return candidate;
}

function sortSessions(sessions: Session[]): Session[] {
  return [...sessions].sort((a, b) => a.order - b.order);
}

export function getSessions(): Session[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SESSIONS;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_SESSIONS;
    const sessions = parsed as Session[];
    // Ensure all sessions have required fields and fix order
    return sortSessions(
      sessions.map((s, i) => ({
        id: s.id,
        name: s.name || `Session ${i + 1}`,
        description: s.description || "",
        order: s.order ?? i,
        createdAt: s.createdAt ?? Date.now(),
      }))
    );
  } catch {
    return DEFAULT_SESSIONS;
  }
}

export function saveSessions(sessions: Session[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    // localStorage unavailable
  }
}

export function addSession(name: string, description: string = ""): Session {
  const sessions = getSessions();
  const existingIds = sessions.map((s) => s.id);
  const id = uniqueId(generateSessionId(name), existingIds);
  const newSession: Session = {
    id,
    name,
    description,
    order: sessions.length,
    createdAt: Date.now(),
  };
  saveSessions([...sessions, newSession]);
  return newSession;
}

export function updateSession(
  id: string,
  changes: Partial<Pick<Session, "name" | "description">>
): void {
  const sessions = getSessions();
  const updated = sessions.map((s) =>
    s.id === id ? { ...s, ...changes } : s
  );
  saveSessions(updated);
}

export function deleteSession(id: string): void {
  const sessions = getSessions();
  const filtered = sessions.filter((s) => s.id !== id);
  // Re-index order
  const reordered = filtered.map((s, i) => ({ ...s, order: i }));
  saveSessions(reordered);
}

export function reorderSessions(orderedIds: string[]): void {
  const sessions = getSessions();
  const orderMap = new Map(orderedIds.map((id, i) => [id, i]));
  const reordered = sessions.map((s) => ({
    ...s,
    order: orderMap.get(s.id) ?? s.order,
  }));
  saveSessions(sortSessions(reordered));
}
