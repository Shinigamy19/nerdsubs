"use client";

import { useState, useCallback } from "react";

interface UploadChunkResult {
  original: string;
  translation?: string;
  timestamp: number;
}

interface UseAudioUploadReturn {
  isUploading: boolean;
  error: string | null;
  progress: { current: number; total: number } | null;
  uploadFile: (
    file: File,
    sessionId: string,
    mode: "transcribe" | "translate",
    sourceLanguage?: string,
    targetLanguage?: string,
  ) => Promise<void>;
}

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB Gemini limit
const CHUNK_DURATION_MS = 10_000; // 10 second chunks
const SUPPORTED_TYPES = ["audio/mpeg", "audio/wav", "audio/webm", "audio/ogg", "audio/mp3", "audio/x-wav"];

function getMimeType(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "mp3": return "audio/mpeg";
    case "wav": return "audio/wav";
    case "webm": return "audio/webm";
    case "ogg": return "audio/ogg";
    default: return "audio/webm";
  }
}

async function decodeAudioToAudioBuffer(file: File): Promise<AudioBuffer> {
  const arrayBuffer = await file.arrayBuffer();
  const audioContext = new AudioContext();
  try {
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    return audioBuffer;
  } finally {
    await audioContext.close();
  }
}

function audioBufferToWavBase64(buffer: AudioBuffer): string {
  const numChannels = 1;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitsPerSample = 16;

  const samples = buffer.getChannelData(0);
  const dataLength = samples.length * (bitsPerSample / 8);
  const headerLength = 44;
  const totalLength = headerLength + dataLength;

  const arrayBuffer = new ArrayBuffer(totalLength);
  const view = new DataView(arrayBuffer);

  // WAV header
  writeString(view, 0, "RIFF");
  view.setUint32(4, totalLength - 8, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true);
  view.setUint16(32, numChannels * (bitsPerSample / 8), true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataLength, true);

  // Write samples
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
    offset += 2;
  }

  // Convert to base64
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

export function useAudioUpload(): UseAudioUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

  const uploadFile = useCallback(
    async (
      file: File,
      sessionId: string,
      mode: "transcribe" | "translate",
      sourceLanguage = "auto",
      targetLanguage = "es",
    ) => {
      // Validate file
      if (!SUPPORTED_TYPES.includes(file.type) && !file.name.match(/\.(mp3|wav|webm|ogg)$/i)) {
        setError("Unsupported file format. Please use MP3, WAV, WebM, or OGG.");
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        setError(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 25MB.`);
        return;
      }

      setError(null);
      setIsUploading(true);
      setProgress({ current: 0, total: 0 });

      try {
        // Decode audio
        const audioBuffer = await decodeAudioToAudioBuffer(file);
        const sampleRate = audioBuffer.sampleRate;
        const totalSamples = audioBuffer.length;
        const chunkSamples = Math.floor((CHUNK_DURATION_MS / 1000) * sampleRate);
        const totalChunks = Math.ceil(totalSamples / chunkSamples);

        setProgress({ current: 0, total: totalChunks });

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

        for (let i = 0; i < totalChunks; i++) {
          setProgress({ current: i + 1, total: totalChunks });

          const startSample = i * chunkSamples;
          const endSample = Math.min(startSample + chunkSamples, totalSamples);

          // Encode chunk to WAV base64
          const chunkLength = endSample - startSample;
          const chunkBuffer = new AudioBuffer({ length: chunkLength, sampleRate, numberOfChannels: 1 });
          const sourceData = audioBuffer.getChannelData(0);
          chunkBuffer.copyToChannel(sourceData.subarray(startSample, endSample), 0);
          const chunkBase64 = audioBufferToWavBase64(chunkBuffer);

          const startTime = Date.now();

          const response = await fetch("/api/transcribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              audio: chunkBase64,
              sessionId,
              mode,
              mimeType: "audio/wav",
              apiKey,
              model,
              sourceLanguage,
              targetLanguage,
            }),
          });

          const data = await response.json();

          if (response.ok && data.text) {
            const latency = data.latency || Date.now() - startTime;

            let original = data.text;
            let translation: string | undefined;

            if (mode === "translate" && data.text.includes("|")) {
              const parts = data.text.split("|");
              original = parts[0].trim();
              translation = parts.slice(1).join("|").trim();
            }

            // Return result via custom event so page.tsx can dispatch
            window.dispatchEvent(
              new CustomEvent<UploadChunkResult>("audio-upload-chunk", {
                detail: {
                  original,
                  translation,
                  timestamp: data.timestamp || Date.now(),
                },
              })
            );

            window.dispatchEvent(
              new CustomEvent<number>("audio-upload-latency", {
                detail: latency,
              })
            );
          } else if (data.error) {
            console.error("API error on chunk", i + 1, ":", data.error);
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to process audio file";
        setError(message);
        console.error("Upload processing error:", err);
      } finally {
        setIsUploading(false);
        setProgress(null);
      }
    },
    []
  );

  return { isUploading, error, progress, uploadFile };
}
