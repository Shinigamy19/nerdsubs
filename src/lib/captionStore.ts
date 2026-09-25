// In-memory caption store (per session)
const captionStore = new Map<string, Array<{
  seq: number;
  text: string;
  isFinal: boolean;
  timestamp: number;
}>>();

const partialStore = new Map<string, string>();

// Add caption to store
export function addCaption(sessionId: string, text: string, isFinal: boolean) {
  if (!captionStore.has(sessionId)) {
    captionStore.set(sessionId, []);
  }

  const captions = captionStore.get(sessionId)!;
  const seq = captions.length + 1;

  captions.push({
    seq,
    text,
    isFinal,
    timestamp: Date.now(),
  });

  // Keep last 100 captions per session
  if (captions.length > 100) {
    captionStore.set(sessionId, captions.slice(-100));
  }

  if (!isFinal) {
    partialStore.set(sessionId, text);
  } else {
    partialStore.delete(sessionId);
  }
}

// Get captions for a session
export function getCaptions(sessionId: string) {
  const captions = captionStore.get(sessionId) || [];
  const partial = partialStore.get(sessionId) || null;

  return {
    captions: captions.slice(-20),
    partial,
    live: captions.length > 0 && Date.now() - captions[captions.length - 1].timestamp < 10000,
  };
}
