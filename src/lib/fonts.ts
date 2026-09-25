export interface FontFamily {
  id: string;
  name: string;
  url?: string;
  base64?: string;
  format: "truetype" | "opentype" | "woff" | "woff2";
  weights: number[];
  isSystem: boolean;
}

export const SYSTEM_FONTS: FontFamily[] = [
  { id: "system-ui", name: "System UI", isSystem: true, format: "truetype", weights: [400, 700] },
  { id: "Arial", name: "Arial", isSystem: true, format: "truetype", weights: [400, 700] },
  { id: "Helvetica", name: "Helvetica", isSystem: true, format: "truetype", weights: [400, 700] },
  { id: "Georgia", name: "Georgia", isSystem: true, format: "truetype", weights: [400, 700] },
  { id: "Courier New", name: "Courier New", isSystem: true, format: "truetype", weights: [400, 700] },
  { id: "Verdana", name: "Verdana", isSystem: true, format: "truetype", weights: [400, 700] },
  { id: "Impact", name: "Impact", isSystem: true, format: "truetype", weights: [400] },
];

export const GOOGLE_FONTS: FontFamily[] = [
  { id: "roboto", name: "Roboto", url: "https://fonts.googleapis.com/css2?family=Roboto:wght@400;700", isSystem: false, format: "truetype", weights: [400, 700] },
  { id: "open-sans", name: "Open Sans", url: "https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700", isSystem: false, format: "truetype", weights: [400, 700] },
  { id: "montserrat", name: "Montserrat", url: "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700", isSystem: false, format: "truetype", weights: [400, 700] },
  { id: "source-code-pro", name: "Source Code Pro", url: "https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;700", isSystem: false, format: "truetype", weights: [400, 700] },
  { id: "lato", name: "Lato", url: "https://fonts.googleapis.com/css2?family=Lato:wght@400;700", isSystem: false, format: "truetype", weights: [400, 700] },
  { id: "oswald", name: "Oswald", url: "https://fonts.googleapis.com/css2?family=Oswald:wght@400;700", isSystem: false, format: "truetype", weights: [400, 700] },
  { id: "raleway", name: "Raleway", url: "https://fonts.googleapis.com/css2?family=Raleway:wght@400;700", isSystem: false, format: "truetype", weights: [400, 700] },
];

const CUSTOM_FONTS_KEY = "nerdsubs_custom_fonts";
const LOADED_FONTS_KEY = "nerdsubs_loaded_google_fonts";

/** Get all available fonts (system + google + custom). */
export function getAllFonts(): FontFamily[] {
  return [...SYSTEM_FONTS, ...GOOGLE_FONTS, ...getCustomFonts()];
}

/** Load a Google Font dynamically by inserting a <link> tag. */
export function loadGoogleFont(fontId: string): void {
  if (typeof document === "undefined") return;

  const font = GOOGLE_FONTS.find((f) => f.id === fontId);
  if (!font || !font.url) return;

  // Check if already loaded
  const loaded = getLoadedGoogleFonts();
  if (loaded.includes(fontId)) return;

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = font.url;
  document.head.appendChild(link);

  // Mark as loaded
  loaded.push(fontId);
  try {
    localStorage.setItem(LOADED_FONTS_KEY, JSON.stringify(loaded));
  } catch {
    // silently fail
  }
}

function getLoadedGoogleFonts(): string[] {
  try {
    const raw = localStorage.getItem(LOADED_FONTS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as string[];
  } catch {
    return [];
  }
}

/** Upload a custom font from a File object. */
export function uploadCustomFont(file: File): Promise<FontFamily> {
  return new Promise((resolve, reject) => {
    // Validate file type
    const validExtensions = [".ttf", ".otf", ".woff", ".woff2"];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!validExtensions.includes(ext)) {
      reject(new Error(`Invalid font format. Accepted: ${validExtensions.join(", ")}`));
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error("Font file exceeds 5MB limit."));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const formatMap: Record<string, FontFamily["format"]> = {
        ".ttf": "truetype",
        ".otf": "opentype",
        ".woff": "woff",
        ".woff2": "woff2",
      };

      const fontFamily: FontFamily = {
        id: `custom-${file.name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}-${Date.now()}`,
        name: file.name.replace(/\.[^.]+$/, ""),
        base64,
        format: formatMap[ext] || "truetype",
        weights: [400, 700],
        isSystem: false,
      };

      resolve(fontFamily);
    };
    reader.onerror = () => reject(new Error("Failed to read font file."));
    reader.readAsDataURL(file);
  });
}

/** Save custom fonts to localStorage. */
export function saveCustomFonts(fonts: FontFamily[]): void {
  try {
    localStorage.setItem(CUSTOM_FONTS_KEY, JSON.stringify(fonts));
  } catch {
    // silently fail
  }
}

/** Get custom fonts from localStorage. */
export function getCustomFonts(): FontFamily[] {
  try {
    const raw = localStorage.getItem(CUSTOM_FONTS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as FontFamily[];
  } catch {
    return [];
  }
}

/** Generate @font-face CSS for a custom font. */
export function generateFontFaceCSS(font: FontFamily): string {
  if (!font.base64) return "";
  const format = font.format === "truetype" ? "truetype"
    : font.format === "opentype" ? "opentype"
    : font.format === "woff2" ? "woff2"
    : "woff";
  return `@font-face {
  font-family: "${font.name}";
  src: url("${font.base64}") format("${format}");
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}`;
}

/** Apply font to the entire document for preview. */
export function applyFontToDocument(font: FontFamily): void {
  if (typeof document === "undefined") return;

  // Remove existing custom font style if any
  const existing = document.getElementById("nerdsubs-custom-font");
  if (existing) existing.remove();

  if (font.base64) {
    const style = document.createElement("style");
    style.id = "nerdsubs-custom-font";
    style.textContent = generateFontFaceCSS(font);
    document.head.appendChild(style);
  }

  // Load Google Font if needed
  if (!font.isSystem && font.url) {
    loadGoogleFont(font.id);
  }
}

/** Find a font by its id from all available fonts. */
export function findFontById(fontId: string): FontFamily | undefined {
  return getAllFonts().find((f) => f.id === fontId);
}
