export interface SessionStats {
  sessionId: string;
  subtitleCount: number;
  latencies: number[];
  lastUpdate: number | null;
  errorCount: number;
  status: "active" | "idle" | "error";
}

// In-memory stats store (resets on server restart)
const stats = new Map<string, SessionStats>();

const DEFAULT_SESSIONS = ["main-stage", "track-a", "track-b", "track-c"];

for (const id of DEFAULT_SESSIONS) {
  stats.set(id, {
    sessionId: id,
    subtitleCount: 0,
    latencies: [],
    lastUpdate: null,
    errorCount: 0,
    status: "idle",
  });
}

export function updateSessionStats(
  sessionId: string,
  latency: number,
  success: boolean
): void {
  if (!stats.has(sessionId)) {
    stats.set(sessionId, {
      sessionId,
      subtitleCount: 0,
      latencies: [],
      lastUpdate: null,
      errorCount: 0,
      status: "active",
    });
  }

  const session = stats.get(sessionId)!;
  session.lastUpdate = Date.now();
  session.status = "active";

  if (success) {
    session.subtitleCount += 1;
    session.latencies.push(latency);
    if (session.latencies.length > 50) {
      session.latencies = session.latencies.slice(-50);
    }
  } else {
    session.errorCount += 1;
    session.status = "error";
  }
}

export function getSessionStats(sessionId: string): SessionStats | undefined {
  return stats.get(sessionId);
}

export function getAllStats(): SessionStats[] {
  return Array.from(stats.values());
}
