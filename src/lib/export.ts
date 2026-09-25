import { SubtitleEntry } from "@/context/TranscriptionContext";
import { getFontSettings } from "@/lib/fontSettings";

function padTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/** Pad time into HH:MM:SS:FF format for EDL (30fps frames). */
function padTimecode(ms: number, fps: number = 30): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const frames = Math.floor((ms % 1000) / (1000 / fps));
  return (
    String(hours).padStart(2, "0") +
    ":" +
    String(minutes).padStart(2, "0") +
    ":" +
    String(seconds).padStart(2, "0") +
    ":" +
    String(frames).padStart(2, "0")
  );
}

/** Convert milliseconds to a duration string like "3s" or "1.5s" for XML. */
function msToDuration(ms: number): string {
  return (ms / 1000) + "s";
}

/** Escape special XML characters. */
function escapeXML(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildTimestamps(subtitles: SubtitleEntry[]): Array<{ start: number; end: number; index: number }> {
  return subtitles.map((sub, i) => {
    const start = sub.timestamp;
    const next = subtitles[i + 1];
    const end = next ? next.timestamp : start + 3000;
    return { start, end, index: i + 1 };
  });
}

export function generateSRT(subtitles: SubtitleEntry[]): string {
  if (subtitles.length === 0) return "";

  const timestamps = buildTimestamps(subtitles);
  return timestamps
    .map(({ start, end, index }, i) => {
      const sub = subtitles[i];
      const startStr = padTime(start) + ",000";
      const endStr = padTime(end) + ",000";
      const text = sub.translation ? `${sub.original}\n${sub.translation}` : sub.original;
      return `${index}\n${startStr} --> ${endStr}\n${text}`;
    })
    .join("\n\n") + "\n";
}

export function generateVTT(subtitles: SubtitleEntry[]): string {
  if (subtitles.length === 0) return "WEBVTT\n\n";

  const timestamps = buildTimestamps(subtitles);
  const body = timestamps
    .map(({ start, end }, i) => {
      const sub = subtitles[i];
      const startStr = padTime(start) + ".000";
      const endStr = padTime(end) + ".000";
      const text = sub.translation ? `${sub.original}\n${sub.translation}` : sub.original;
      return `${startStr} --> ${endStr}\n${text}`;
    })
    .join("\n\n");

  return `WEBVTT\n\n${body}\n`;
}

export function generateTXT(subtitles: SubtitleEntry[], includeTranslation: boolean = true): string {
  if (subtitles.length === 0) return "";

  return subtitles
    .map((sub) => {
      const ts = `[${padTime(sub.timestamp)}]`;
      const original = sub.original;
      if (includeTranslation && sub.translation) {
        return `${ts} ${original}\n          \u2192 ${sub.translation}`;
      }
      return `${ts} ${original}`;
    })
    .join("\n\n") + "\n";
}

export function generateJSON(
  subtitles: SubtitleEntry[],
  meta: { sessionId: string; sourceLanguage: string; targetLanguage: string; mode: string }
): string {
  return JSON.stringify(
    {
      meta,
      exportedAt: new Date().toISOString(),
      subtitleCount: subtitles.length,
      subtitles: subtitles.map((sub) => ({
        id: sub.id,
        original: sub.original,
        translation: sub.translation,
        timestamp: sub.timestamp,
        timecode: padTime(sub.timestamp),
      })),
    },
    null,
    2
  );
}

export function generateFCPXML(
  subtitles: SubtitleEntry[],
  title: string = "NerdSubs Transcript"
): string {
  const fontSettings = getFontSettings();

  const clips = subtitles
    .map((sub, i) => {
      const start = sub.timestamp;
      const next = subtitles[i + 1];
      const duration = next ? next.timestamp - start : 3000;
      const text = sub.translation
        ? `${sub.original}\n${sub.translation}`
        : sub.original;
      return `          <clip name="Subtitle ${i + 1}" offset="${msToDuration(start)}" duration="${msToDuration(duration)}">
            <text>
              <text-body>${escapeXML(text)}</text-body>
              <text-style font="${escapeXML(fontSettings.fontFamily)}" fontSize="${fontSettings.fontSize}" fontColor="${escapeXML(fontSettings.fontColor)}" bold="${fontSettings.fontWeight >= 700}"/>
            </text>
          </clip>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.9">
  <resources>
    <format id="r1" name="FFVideoFormat1080p30" frameDuration="1/30s" width="1920" height="1080"/>
    <effect id="nerdsubs-font" name="NerdSubs Font" uid="nerdsubs/custom-font">
      <param name="fontFamily" value="${escapeXML(fontSettings.fontFamily)}"/>
      <param name="fontSize" value="${fontSettings.fontSize}"/>
      <param name="fontColor" value="${escapeXML(fontSettings.fontColor)}"/>
      <param name="fontWeight" value="${fontSettings.fontWeight}"/>
    </effect>
  </resources>
  <library>
    <event name="NerdSubs">
      <project name="${escapeXML(title)}">
        <sequence>
          <spine>
${clips}
          </spine>
        </sequence>
      </project>
    </event>
  </library>
</fcpxml>`;
}

export function generatePremiereXML(
  subtitles: SubtitleEntry[],
  title: string = "NerdSubs Transcript"
): string {
  const fontSettings = getFontSettings();
  const clipItems = subtitles
    .map((sub, i) => {
      const start = sub.timestamp;
      const next = subtitles[i + 1];
      const end = next ? next.timestamp : start + 3000;
      const startFrames = Math.floor(start / (1000 / 30));
      const endFrames = Math.floor(end / (1000 / 30));
      const text = sub.translation
        ? `${sub.original}\n${sub.translation}`
        : sub.original;
      return `            <clipitem id="clipitem-${i + 1}">
              <name>Subtitle ${i + 1}</name>
              <rate>
                <timebase>30</timebase>
              </rate>
              <start>${startFrames}</start>
              <end>${endFrames}</end>
              <in>${startFrames}</in>
              <out>${endFrames}</out>
              <label>
                <comment>${escapeXML(text)}</comment>
              </label>
            </clipitem>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<xmeml version="5">
  <sequence>
    <name>${escapeXML(title)}</name>
    <media>
      <video>
        <format>
          <samplecharacteristics>
            <width>1920</width>
            <height>1080</height>
          </samplecharacteristics>
        </format>
        <track>
${clipItems}
        </track>
      </video>
    </media>
  </sequence>
</xmeml>`;
}

export function generateEDL(
  subtitles: SubtitleEntry[],
  title: string = "NerdSubs"
): string {
  const lines: string[] = [
    `TITLE: ${title}`,
    "FCM: NON-DROP FRAME",
    "",
  ];

  subtitles.forEach((sub, i) => {
    const start = sub.timestamp;
    const next = subtitles[i + 1];
    const end = next ? next.timestamp : start + 3000;
    const recStart = padTimecode(start);
    const recEnd = padTimecode(end);
    const srcStart = "00:00:00:00";
    // Source end is relative — use the same duration as recorded
    const srcEnd = padTimecode(end - start);
    const num = String(i + 1).padStart(3, "0");
    const text = sub.translation
      ? `${sub.original}\\n${sub.translation}`
      : sub.original;

    // CMX 3600: event# reel# type trans srcIn srcOut recIn recOut
    lines.push(
      `${num}  001  V  C  ${recStart} ${recEnd} ${srcStart} ${srcEnd}`,
      `* FROM CLIP NAME: Subtitle ${i + 1}`,
      `* SUBTITLE: ${text}`,
      ""
    );
  });

  return lines.join("\n");
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
