export interface FontSettings {
  fontFamily: string;
  fontSize: number; // px
  fontWeight: number; // 400 or 700
  fontColor: string; // hex color
}

const STORAGE_KEY_FAMILY = "nerdsubs_font_family";
const STORAGE_KEY_SIZE = "nerdsubs_font_size";
const STORAGE_KEY_WEIGHT = "nerdsubs_font_weight";
const STORAGE_KEY_COLOR = "nerdsubs_font_color";

const DEFAULT_SETTINGS: FontSettings = {
  fontFamily: "system-ui",
  fontSize: 48,
  fontWeight: 600,
  fontColor: "#ffffff",
};

/** Get font settings from localStorage with defaults. */
export function getFontSettings(): FontSettings {
  try {
    const family = localStorage.getItem(STORAGE_KEY_FAMILY);
    const sizeRaw = localStorage.getItem(STORAGE_KEY_SIZE);
    const weightRaw = localStorage.getItem(STORAGE_KEY_WEIGHT);
    const color = localStorage.getItem(STORAGE_KEY_COLOR);

    return {
      fontFamily: family || DEFAULT_SETTINGS.fontFamily,
      fontSize: sizeRaw ? parseInt(sizeRaw, 10) || DEFAULT_SETTINGS.fontSize : DEFAULT_SETTINGS.fontSize,
      fontWeight: weightRaw ? parseInt(weightRaw, 10) || DEFAULT_SETTINGS.fontWeight : DEFAULT_SETTINGS.fontWeight,
      fontColor: color || DEFAULT_SETTINGS.fontColor,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/** Save font settings to localStorage. */
export function saveFontSettings(settings: FontSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY_FAMILY, settings.fontFamily);
    localStorage.setItem(STORAGE_KEY_SIZE, String(settings.fontSize));
    localStorage.setItem(STORAGE_KEY_WEIGHT, String(settings.fontWeight));
    localStorage.setItem(STORAGE_KEY_COLOR, settings.fontColor);
  } catch {
    // localStorage may be unavailable
  }
}

/** Get the CSS font-family value for a font id. */
export function resolveFontFamily(fontId: string): string {
  if (fontId === "system-ui") return "system-ui, -apple-system, sans-serif";
  // System fonts use their name directly
  if (["Arial", "Helvetica", "Georgia", "Courier New", "Verdana", "Impact"].includes(fontId)) {
    return `"${fontId}", sans-serif`;
  }
  // Google fonts and custom fonts use their name
  return `"${fontId}", sans-serif`;
}
