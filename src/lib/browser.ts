export interface BrowserInfo {
  name: string;
  isChromium: boolean;
  isFirefox: boolean;
  isSafari: boolean;
  isEdge: boolean;
  isBrave: boolean;
  mediaRecorderSupported: boolean;
  preferredMimeType: string;
}

const MIME_FALLBACK_CHAIN = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4;codecs=mp4a.40.2",
  "audio/ogg;codecs=opus",
] as const;

function selectPreferredMimeType(): string {
  if (typeof MediaRecorder === "undefined") return MIME_FALLBACK_CHAIN[0];
  for (const mime of MIME_FALLBACK_CHAIN) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return "";
}

export function detectBrowser(): BrowserInfo {
  if (typeof navigator === "undefined") {
    return {
      name: "Unknown (SSR)", isChromium: false, isFirefox: false,
      isSafari: false, isEdge: false, isBrave: false,
      mediaRecorderSupported: false, preferredMimeType: "",
    };
  }

  const ua = navigator.userAgent;
  const uaLower = ua.toLowerCase();

  // === Brave detection (multiple methods) ===
  let isBrave = false;

  // Method 1: navigator.brave API (most reliable)
  try {
    const braveObj = (navigator as any).brave;
    if (braveObj && typeof braveObj.isBrave === "function") {
      isBrave = true;
    }
  } catch {}

  // Method 2: User-Agent Client Hints
  if (!isBrave) {
    try {
      const uaData = (navigator as any).userAgentData;
      if (uaData?.brands) {
        isBrave = uaData.brands.some((b: any) =>
          b.brand.toLowerCase().includes("brave")
        );
      }
    } catch {}
  }

  // Method 3: Check UA for "Brave" or "Brave/"
  if (!isBrave) {
    isBrave = uaLower.includes("brave/") || uaLower.includes("brave ");
  }

  // Method 4: Brave removes "Chrome" from UA but keeps "Safari"
  // If UA has "Safari" but NOT "Chrome" and NOT real Safari, it's likely Brave
  // Real Safari has a very specific UA pattern that we can distinguish
  if (!isBrave && uaLower.includes("safari") && !uaLower.includes("chrome")) {
    // Check if it's NOT real Safari by looking for Brave-specific indicators
    // Real Safari UA: "Mozilla/5.0 (Macintosh; Intel Mac OS X ...) Safari/605.1.15"
    // Brave UA: similar but without "Chrome" and may have "Brave" somewhere
    const hasWebkitVersion = /webkit\/\d+/i.test(ua);
    const hasSafariVersion = /version\/\d+/i.test(ua);
    // If it has webkit version but looks like it's mimicking Safari, it's probably Brave
    if (hasWebkitVersion && !hasSafariVersion) {
      isBrave = true;
    }
  }

  // === Other browser detection ===
  const isEdge = uaLower.includes("edg/") && !isBrave;
  const isOpera = uaLower.includes("opr/") || uaLower.includes("opera");
  const isVivaldi = uaLower.includes("vivaldi");
  const isSamsung = uaLower.includes("samsungbrowser");
  const isFirefox = uaLower.includes("firefox") && !isBrave;

  // Safari: has "safari" but NOT "chrome" and NOT Brave
  const isSafari =
    uaLower.includes("safari") && !uaLower.includes("chrome") && !isBrave;

  // Chromium-based
  const isChromiumBased =
    isBrave || isEdge || isOpera || isVivaldi || isSamsung ||
    (uaLower.includes("chrome") && !isFirefox && !isSafari);

  const mediaRecorderSupported =
    typeof MediaRecorder !== "undefined" &&
    navigator.mediaDevices !== undefined;

  const preferredMimeType = selectPreferredMimeType();

  let name = "Unknown";
  if (isBrave) name = "Brave";
  else if (isVivaldi) name = "Vivaldi";
  else if (isEdge) name = "Microsoft Edge";
  else if (isOpera) name = "Opera";
  else if (isSamsung) name = "Samsung Internet";
  else if (isChromiumBased) name = "Chrome";
  else if (isFirefox) name = "Firefox";
  else if (isSafari) name = "Safari";

  return {
    name, isChromium: isChromiumBased, isFirefox, isSafari,
    isEdge, isBrave, mediaRecorderSupported, preferredMimeType,
  };
}
