export interface Language {
  code: string;
  name: string;
  nameEn: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: "auto", name: "Auto-detect", nameEn: "Auto-detect", flag: "🌐" },
  { code: "es", name: "Español", nameEn: "Spanish", flag: "🇪🇸" },
  { code: "en", name: "English", nameEn: "English", flag: "🇺🇸" },
  { code: "pt", name: "Português", nameEn: "Portuguese", flag: "🇧🇷" },
  { code: "it", name: "Italiano", nameEn: "Italian", flag: "🇮🇹" },
  { code: "fr", name: "Français", nameEn: "French", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", nameEn: "German", flag: "🇩🇪" },
  { code: "ja", name: "日本語", nameEn: "Japanese", flag: "🇯🇵" },
  { code: "zh", name: "中文", nameEn: "Chinese", flag: "🇨🇳" },
];

export function getLanguageName(code: string): string {
  if (code === "auto") return "Auto-detect";
  const lang = SUPPORTED_LANGUAGES.find((l) => l.code === code);
  return lang ? lang.nameEn : code;
}

export function getLanguageFlag(code: string): string {
  if (code === "auto") return "🌐";
  const lang = SUPPORTED_LANGUAGES.find((l) => l.code === code);
  return lang ? lang.flag : "🏳️";
}

export function getLanguageByCode(code: string): Language | undefined {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code);
}
