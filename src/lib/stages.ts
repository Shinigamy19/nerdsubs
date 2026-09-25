// Stage management — predefined conference sessions
export interface Stage {
  id: string;
  name: string;
  description: string;
  sourceLang: "en" | "es";
  live: boolean;
  glossary: string;
}

export const STAGES: Stage[] = [
  {
    id: "main-stage",
    name: "Main Stage",
    description: "Keynotes & opening talks",
    sourceLang: "en",
    live: false,
    glossary: "Nerdearla, Kubernetes, Docker, TypeScript, React, Next.js, Gemini, AI, machine learning, open source",
  },
  {
    id: "track-a",
    name: "Track A — Frontend",
    description: "Frontend & UX",
    sourceLang: "en",
    live: false,
    glossary: "React, Vue, Angular, Svelte, CSS, Tailwind, Next.js, Vite, webpack, TypeScript, JavaScript",
  },
  {
    id: "track-b",
    name: "Track B — Backend",
    description: "Backend & Infrastructure",
    sourceLang: "en",
    live: false,
    glossary: "Node.js, Python, Go, Rust, PostgreSQL, MongoDB, Redis, Docker, Kubernetes, AWS, GCP",
  },
  {
    id: "track-c",
    name: "Track C — AI & Data",
    description: "AI & Data Science",
    sourceLang: "en",
    live: false,
    glossary: "Gemini, GPT, BERT, transformer, neural network, machine learning, deep learning, LLM, RAG, fine-tuning",
  },
];

// In-memory stage status (resets on server restart)
const stageStatus = new Map<string, boolean>();

export function getStageStatus(): Array<{ id: string; live: boolean }> {
  return STAGES.map((s) => ({
    id: s.id,
    live: stageStatus.get(s.id) || false,
  }));
}

export function setStageLive(stageId: string, live: boolean): void {
  stageStatus.set(stageId, live);
}

export function getStageById(id: string): Stage | undefined {
  return STAGES.find((s) => s.id === id);
}

export const LANG_NAMES: Record<string, string> = {
  auto: "Auto-detect",
  en: "English",
  es: "Español",
  pt: "Português",
  it: "Italiano",
  fr: "Français",
  de: "Deutsch",
  ja: "日本語",
  zh: "中文",
};

export const LANG_FLAGS: Record<string, string> = {
  auto: "🌐",
  en: "🇺🇸",
  es: "🇪🇸",
  pt: "🇧🇷",
  it: "🇮🇹",
  fr: "🇫🇷",
  de: "🇩🇪",
  ja: "🇯🇵",
  zh: "🇨🇳",
};

export const ALL_LANGS = Object.keys(LANG_NAMES).filter((l) => l !== "auto");
