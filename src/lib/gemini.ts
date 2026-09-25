import { GoogleGenAI, Modality } from "@google/genai";
import { getLanguageName } from "@/lib/languages";

const TRANSCRIBE_MODEL = "gemini-3.5-transcribe-live";
const TRANSLATE_MODEL = "gemini-3.5-flash-lite";
const SAMPLE_RATE = 16000;
const MIME_TYPE = `audio/pcm;rate=${SAMPLE_RATE}`;

interface TranscribeOptions {
  audioBase64: string;
  mimeType: string;
  mode: "transcribe" | "translate";
  apiKey?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
}

function getApiKey(override?: string): string {
  const key = override || process.env.GEMINI_API_KEY;
  if (!key) throw new Error("No Gemini API key configured");
  return key;
}

// --- Segmenter (from alf-transcription) ---
// Cuts sentences from interim transcription text using punctuation boundaries
const SENTENCE_CUT = /([.!?…])\s*(?=[A-ZÁÉÍÓÚÑ¿¡])/g;
const CLAUSE_CUT = /([,;:—])\s+(?=\S)/g;

class Segmenter {
  private buffer = "";
  private interimCommittedChars = 0;
  private lastInterimText = "";
  private lastFinalText = "";
  private seq = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private minChars = 10;
  private maxChars = 140;
  private silenceMs = 1200;

  pushInterim(text: string): string | null {
    if (text.length < this.interimCommittedChars) {
      this.interimCommittedChars = 0;
    }
    this.lastInterimText = text;

    while (this.interimCommittedChars < text.length) {
      const uncommitted = text.slice(this.interimCommittedChars).trim();
      if (!uncommitted) break;

      let cutFound = false;

      // 1. Natural sentence end followed by next word
      for (const m of uncommitted.matchAll(SENTENCE_CUT)) {
        const cutIdx = m.index! + 1;
        const sentence = uncommitted.slice(0, cutIdx).trim();
        if (sentence.length >= this.minChars) {
          this.interimCommittedChars += uncommitted.slice(0, cutIdx + m[0].length - 1).length;
          cutFound = true;
          if (sentence !== this.lastFinalText) {
            this.lastFinalText = sentence;
            this.seq++;
            return sentence;
          }
          break;
        }
      }

      // 2. Clause cut for run-on speech (>70 chars)
      if (!cutFound && uncommitted.length >= 70) {
        for (const m of uncommitted.matchAll(CLAUSE_CUT)) {
          const cutIdx = m.index! + 1;
          const clause = uncommitted.slice(0, cutIdx).trim();
          if (clause.length >= 25) {
            this.interimCommittedChars += uncommitted.slice(0, cutIdx + m[0].length - 1).length;
            cutFound = true;
            if (clause !== this.lastFinalText) {
              this.lastFinalText = clause;
              this.seq++;
              return clause;
            }
            break;
          }
        }
      }

      // 3. Fallback: max chars with word boundary
      if (!cutFound && uncommitted.length >= this.maxChars) {
        const space = uncommitted.lastIndexOf(" ", this.maxChars);
        const cutIdx = space > 0 ? space : this.maxChars;
        const chunk = uncommitted.slice(0, cutIdx).trim();
        if (chunk.length >= this.minChars) {
          this.interimCommittedChars += cutIdx;
          if (chunk !== this.lastFinalText) {
            this.lastFinalText = chunk;
            this.seq++;
            return chunk;
          }
        }
      }

      if (!cutFound) break;
    }

    return null;
  }

  dispose() {
    if (this.timer) clearTimeout(this.timer);
  }
}

// --- Translation prompt (from alf-transcription) ---
function buildTranslatePrompt(
  sourceLang: string,
  targetLang: string,
  glossary?: string,
  context?: string[]
): string {
  const sourceName = sourceLang === "auto" ? "the detected language" : getLanguageName(sourceLang);
  const targetName = getLanguageName(targetLang);

  const parts = [
    `You are a professional simultaneous interpreter at a software conference.`,
    `Translate the user's text from ${sourceName} to ${targetName}.`,
    "Keep technical terms, product names and code identifiers the way practitioners say them",
    "(e.g. Kubernetes, pull request, deploy, cluster). The text is a live transcript: it may be",
    "a sentence fragment and may contain recognition errors; fix obvious ones.",
    "Output only the translation, with no quotes, notes or explanations.",
  ];

  if (glossary?.trim()) {
    parts.push(`Glossary / names for this talk: ${glossary.trim()}`);
  }

  if (context && context.length > 0) {
    parts.push(`Previous sentences (context only, do not translate):\n${context.join("\n")}`);
  }

  return parts.join(" ");
}

// --- Live API session (simplified for Next.js) ---
class LiveSession {
  public session: any = null;
  public genai: GoogleGenAI;
  public segmenter = new Segmenter();
  public connected = false;
  public transcripts: string[] = [];
  private onTranscript: (text: string, isFinal: boolean) => void;

  constructor(apiKey: string, onTranscript: (text: string, isFinal: boolean) => void) {
    this.genai = new GoogleGenAI({ apiKey });
    this.onTranscript = onTranscript;
  }

  async connect(sourceLang: string): Promise<void> {
    if (this.connected) return;

    const langName = sourceLang === "auto" ? "the detected language" : getLanguageName(sourceLang);

    this.session = await this.genai.live.connect({
      model: TRANSCRIBE_MODEL,
      config: {
        inputAudioTranscription: {},
        systemInstruction: [
          `You are a passive listener at a tech conference talk in ${langName}.`,
          "Transcribe accurately. Never reply, never speak, never produce any output.",
        ].join("\n"),
        contextWindowCompression: { slidingWindow: {} },
      },
      callbacks: {
        onmessage: (msg: any) => {
          const interim = msg?.serverContent?.interimInputTranscription?.text;
          if (interim) {
            const sentence = this.segmenter.pushInterim(interim);
            if (sentence) {
              this.transcripts.push(sentence);
              this.onTranscript(sentence, false);
            }
          }

          const fragment = msg?.serverContent?.inputTranscription?.text;
          if (fragment && fragment !== this.segmenter["lastFinalText"]) {
            this.transcripts.push(fragment);
            this.onTranscript(fragment, true);
          }
        },
        onerror: (e: any) => {
          console.error("[NerdSubs] Live error:", e);
          this.connected = false;
        },
        onclose: () => {
          this.connected = false;
        },
      },
    });

    this.connected = true;
    console.log("[NerdSubs] Live connected");
  }

  sendAudio(base64Data: string): void {
    if (!this.session || !this.connected) return;
    this.session.sendRealtimeInput({
      audio: { data: base64Data, mimeType: MIME_TYPE },
    });
  }

  disconnect(): void {
    if (this.session) {
      this.session.close();
      this.session = null;
      this.connected = false;
    }
    this.segmenter.dispose();
  }

  getRecentContext(n = 3): string[] {
    return this.transcripts.slice(-n);
  }
}

const sessions = new Map<string, LiveSession>();

function getSession(apiKey: string, onTranscript: (text: string, isFinal: boolean) => void): LiveSession {
  let session = sessions.get(apiKey);
  if (!session || !session.connected) {
    session = new LiveSession(apiKey, onTranscript);
    sessions.set(apiKey, session);
  }
  return session;
}

// --- Translation with retry (from alf-transcription) ---
async function translateText(
  text: string,
  prompt: string,
  apiKey: string,
  glossary?: string,
  context?: string[]
): Promise<string> {
  const genai = new GoogleGenAI({ apiKey });
  const fullPrompt = buildTranslatePrompt("auto", "es", glossary, context);

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await genai.models.generateContent({
        model: TRANSLATE_MODEL,
        contents: text,
        config: {
          systemInstruction: fullPrompt,
          temperature: 0.2,
          maxOutputTokens: 512,
        },
      });
      return (res.text ?? "").trim();
    } catch (err: any) {
      if (err?.status === 429 || err?.message?.includes("429")) {
        const delay = 5000 * (attempt + 1);
        console.warn(`[NerdSubs] Rate limited, waiting ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
  throw new Error("Translation failed after retries");
}

// --- Main export ---
let activeRequests = 0;

export async function transcribeAudio({
  audioBase64,
  mimeType,
  mode,
  apiKey,
  sourceLanguage = "auto",
  targetLanguage = "es",
}: TranscribeOptions): Promise<string> {
  while (activeRequests >= 2) await new Promise((r) => setTimeout(r, 500));
  activeRequests++;

  try {
    const key = getApiKey(apiKey);

    // Try Live API first
    const session = getSession(key, () => {});

    try {
      await session.connect(sourceLanguage);
      const { data } = prepareAudio(audioBase64, mimeType);
      session.sendAudio(data);

      // Wait for transcription via Live API
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Live API timeout"));
        }, 15000);

        const origCb = (session as any).onTranscript;
        (session as any).onTranscript = (text: string, isFinal: boolean) => {
          if (isFinal) {
            clearTimeout(timeout);
            (session as any).onTranscript = origCb;

            if (mode === "transcribe") {
              resolve(text);
            } else {
              const glossary = "Nerdearla, Kubernetes, Docker, TypeScript, React, Gemini, AI, open source";
              const context = session.getRecentContext(3);
              translateText(text, "", key, glossary, context)
                .then(resolve)
                .catch(reject);
            }
          }
        };
      });
    } catch (err) {
      console.warn("[NerdSubs] Live failed, using generateContent:", err);
      return await fallbackTranscribe(audioBase64, mimeType, mode, key, sourceLanguage, targetLanguage);
    }
  } finally {
    activeRequests--;
  }
}

// --- Fallback: generateContent ---
async function fallbackTranscribe(
  audioBase64: string,
  mimeType: string,
  mode: string,
  apiKey: string,
  sourceLanguage: string,
  targetLanguage: string
): Promise<string> {
  const genai = new GoogleGenAI({ apiKey });

  const prompt = mode === "translate"
    ? buildTranslatePrompt(sourceLanguage, targetLanguage)
    : "Transcribe this audio. Output only the spoken text, accurately. Use proper casing for technical terms.";

  const response = await genai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          { inlineData: { mimeType: mapMime(mimeType), data: audioBase64 } },
        ],
      },
    ],
  });

  const text = response.text;
  if (!text) throw new Error("No text returned");
  return text.trim();
}

function prepareAudio(audioBase64: string, _mimeType: string): { data: string; mimeType: string } {
  return { data: audioBase64, mimeType: MIME_TYPE };
}

function mapMime(mt: string): string {
  if (mt.includes("wav")) return "audio/wav";
  if (mt.includes("mp3") || mt.includes("mpeg")) return "audio/mpeg";
  if (mt.includes("ogg") || mt.includes("opus")) return "audio/ogg";
  return "audio/webm";
}
