"use client";

import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { useAudioCapture } from "@/hooks/useAudioCapture";
import { getFontSettings, resolveFontFamily } from "@/lib/fontSettings";

// --- Types ---

interface OverlaySubtitle {
  id: string;
  text: string;
  timestamp: number;
  opacity: number;
}

interface OverlayParams {
  session: string;
  mode: "transcribe" | "translate";
  source: string;
  target: string;
  fontSize: number;
  maxLines: number;
  positionBottom: number;
}

// --- URL parameter parsing ---

function useSearchParams(): OverlayParams {
  return useMemo(() => {
    if (typeof window === "undefined") {
      return {
        session: "main-stage",
        mode: "translate",
        source: "auto",
        target: "es",
        fontSize: 48,
        maxLines: 3,
        positionBottom: 80,
      };
    }

    const params = new URLSearchParams(window.location.search);

    // Support both legacy "lang" param and new "source"/"target" params
    let source = params.get("source") || "auto";
    let target = params.get("target") || "es";

    // Backward compatibility: if "lang" is set (e.g. "en-es"), parse it
    const legacyLang = params.get("lang");
    if (legacyLang && !params.get("source")) {
      const parts = legacyLang.split("-");
      if (parts.length === 2) {
        source = parts[0];
        target = parts[1];
      }
    }

    return {
      session: params.get("session") || "main-stage",
      mode: (params.get("mode") as "transcribe" | "translate") || "translate",
      source,
      target,
      fontSize: parseInt(params.get("fontsize") || "48", 10) || 48,
      maxLines: parseInt(params.get("maxlines") || "3", 10) || 3,
      positionBottom: parseInt(params.get("positionbottom") || "80", 10) || 80,
    };
  }, []);
}

// --- Component ---

export default function OverlayPage() {
  const params = useSearchParams();

  const {
    isRecording,
    error: audioError,
    startRecording,
    stopRecording,
    audioChunks,
    clearChunks,
    isSupported,
  } = useAudioCapture(2000);

  const [subtitles, setSubtitles] = useState<OverlaySubtitle[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "connecting">("disconnected");
  const [fontSettings, setFontSettings] = useState(() => {
    if (typeof window === "undefined") return null;
    return getFontSettings();
  });
  const processingRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- Audio processing ---

  const processAudio = useCallback(async () => {
    if (processingRef.current || audioChunks.length === 0) return;

    processingRef.current = true;
    setConnectionStatus("connecting");

    const chunksToSend = [...audioChunks];
    clearChunks();

    for (const chunk of chunksToSend) {
      try {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(",")[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(chunk);
        });

        const audioBase64 = await base64Promise;

        // Read custom settings from localStorage
        let apiKey: string | undefined;
        let model: string | undefined;
        try {
          const keySource = localStorage.getItem("nerdsubs_key_source");
          if (keySource === "custom") {
            apiKey = localStorage.getItem("nerdsubs_api_key") || undefined;
          }
          model = localStorage.getItem("nerdsubs_model") || undefined;
        } catch {
          // localStorage may be unavailable
        }

        const response = await fetch("/api/transcribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            audio: audioBase64,
            sessionId: params.session,
            mode: params.mode,
            mimeType: chunk.type || "audio/webm;codecs=opus",
            apiKey,
            model,
            sourceLanguage: params.source,
            targetLanguage: params.target,
          }),
        });

        const data = await response.json();

        if (response.ok && data.text) {
          let displayText = data.text;

          // Parse translate mode: "original | translation"
          if (params.mode === "translate" && data.text.includes("---")) {
            const parts = data.text.split("---");
            const original = parts[0].trim();
            const translation = parts.slice(1).join("|").trim();
            displayText = `${original}\n${translation}`;
          }

          const newSub: OverlaySubtitle = {
            id: `ov-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            text: displayText,
            timestamp: data.timestamp || Date.now(),
            opacity: 1,
          };

          setSubtitles((prev) => {
            const updated = [...prev, newSub];
            // Keep only maxLines visible, older ones fade
            if (updated.length > params.maxLines * 2) {
              return updated.slice(-(params.maxLines * 2));
            }
            return updated;
          });

          setConnectionStatus("connected");
        } else if (data.error) {
          console.error("[Overlay] API error:", data.error);
          setConnectionStatus("disconnected");
        }
      } catch (err) {
        console.error("[Overlay] Failed to process audio chunk:", err);
        setConnectionStatus("disconnected");
      }
    }

    processingRef.current = false;
  }, [audioChunks, clearChunks, params.session, params.mode, params.source, params.target, params.maxLines]);

  // Poll for audio chunks
  useEffect(() => {
    if (isRecording) {
      intervalRef.current = setInterval(processAudio, 16000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRecording, processAudio]);

  // Sync recording state — auto-start
  useEffect(() => {
    if (isSupported && !isRecording) {
      startRecording();
    }

    return () => {
      if (isRecording) {
        stopRecording();
      }
    };
  }, [isSupported, isRecording, startRecording, stopRecording]);

  // Fade older subtitles
  useEffect(() => {
    if (subtitles.length <= params.maxLines) return;

    const fadeTimer = setTimeout(() => {
      setSubtitles((prev) =>
        prev.map((sub, i) => {
          const distanceFromEnd = prev.length - 1 - i;
          if (distanceFromEnd < params.maxLines) {
            return { ...sub, opacity: 1 };
          }
          const fadeSteps = distanceFromEnd - params.maxLines;
          const opacity = Math.max(0, 1 - fadeSteps * 0.25);
          return { ...sub, opacity };
        })
      );
    }, 300);

    return () => clearTimeout(fadeTimer);
  }, [subtitles.length, params.maxLines]);

  // Visible subtitles — only the last maxLines with opacity > 0
  const visibleSubtitles = useMemo(() => {
    return subtitles
      .filter((sub) => sub.opacity > 0)
      .slice(-params.maxLines);
  }, [subtitles, params.maxLines]);

  // --- Render ---

  const statusColor =
    connectionStatus === "connected"
      ? "#22c55e"
      : connectionStatus === "connecting"
      ? "#f59e0b"
      : "#ef4444";

  return (
    <>
      {/* Global styles for overlay mode */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            body {
              background: transparent !important;
              background-color: transparent !important;
              overflow: hidden;
              margin: 0;
              padding: 0;
            }
            html {
              background: transparent !important;
            }
          `,
        }}
      />

      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          alignItems: "center",
          paddingBottom: `${params.positionBottom}px`,
          pointerEvents: "none",
          fontFamily: fontSettings ? resolveFontFamily(fontSettings.fontFamily) : 'system-ui, -apple-system, "Segoe UI", sans-serif',
        }}
      >
        {/* Subtitle container */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            alignItems: "center",
            width: "100%",
            maxWidth: "90vw",
          }}
        >
          {visibleSubtitles.map((sub) => (
            <div
              key={sub.id}
              style={{
                fontSize: fontSettings ? `${fontSettings.fontSize}px` : `${params.fontSize}px`,
                lineHeight: "1.3",
                color: fontSettings ? fontSettings.fontColor : "#ffffff",
                textAlign: "center",
                opacity: sub.opacity,
                transition: "opacity 0.4s ease-out",
                whiteSpace: "pre-wrap",
                textShadow: `
                  -2px -2px 0 #000,
                   2px -2px 0 #000,
                  -2px  2px 0 #000,
                   2px  2px 0 #000,
                  -3px  0   0 #000,
                   3px  0   0 #000,
                   0   -3px 0 #000,
                   0    3px 0 #000,
                  -1px -1px 0 #000,
                   1px -1px 0 #000,
                  -1px  1px 0 #000,
                   1px  1px 0 #000
                `,
                WebkitTextStroke: "1px rgba(0, 0, 0, 0.6)",
                fontWeight: fontSettings ? fontSettings.fontWeight : 600,
                padding: "4px 12px",
                borderRadius: "4px",
              }}
            >
              {sub.text}
            </div>
          ))}
        </div>

        {/* Error message — only show if there's an error and nothing else visible */}
        {audioError && visibleSubtitles.length === 0 && (
          <div
            style={{
              position: "absolute",
              bottom: "50%",
              transform: "translateY(50%)",
              textAlign: "center",
              color: "rgba(255, 255, 255, 0.5)",
              fontSize: "14px",
              padding: "8px 16px",
            }}
          >
            {audioError}
          </div>
        )}
      </div>

      {/* Connection status indicator — top-right corner */}
      <div
        style={{
          position: "fixed",
          top: "12px",
          right: "12px",
          width: "10px",
          height: "10px",
          borderRadius: "50%",
          backgroundColor: statusColor,
          boxShadow: `0 0 6px ${statusColor}`,
          opacity: 0.8,
        }}
        title={`Status: ${connectionStatus}`}
      />
    </>
  );
}
