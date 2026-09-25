"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { detectBrowser } from "@/lib/browser";
import { addLog } from "@/components/DebugConsole";

interface UseAudioCaptureReturn {
  isRecording: boolean;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  audioChunks: Blob[];
  clearChunks: () => void;
  isSupported: boolean;
  hasCameraPermission: boolean;
  hasAudioPermission: boolean;
}

const MIME_FALLBACK = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
  "audio/wav",
];

function pickMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  for (const mime of MIME_FALLBACK) {
    try {
      if (MediaRecorder.isTypeSupported(mime)) return mime;
    } catch {
      // ignore
    }
  }
  return "";
}

export function useAudioCapture(chunkIntervalMs = 2000): UseAudioCaptureReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [hasAudioPermission, setHasAudioPermission] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chunkAccumulatorRef = useRef<Blob[]>([]);

  const isSupported =
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    navigator.mediaDevices !== undefined &&
    typeof MediaRecorder !== "undefined";

  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // Already stopped
      }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
  }, []);

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      setError("MediaRecorder is not supported in this browser");
      return;
    }

    setError(null);
    chunkAccumulatorRef.current = [];

    // Try to get audio stream with progressive fallback
    let stream: MediaStream | null = null;

    // Attempt 1: audio only (simplest, most compatible)
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      setHasAudioPermission(true);
      setHasCameraPermission(false);
      addLog("success", "Audio permission granted");
    } catch (err) {
      addLog("error", "Audio permission denied");
      setError("Microphone permission denied. Please allow microphone access.");
      return;
    }

    streamRef.current = stream;

    // Pick MIME type
    const mimeType = pickMimeType();
    addLog("info", `MIME type: ${mimeType}`);

    // Create MediaRecorder with fallback options
    let recorder: MediaRecorder;
    try {
      if (mimeType) {
        recorder = new MediaRecorder(stream, { mimeType });
      } else {
        recorder = new MediaRecorder(stream);
      }
    } catch (err) {
      addLog("error", "MediaRecorder creation failed");
      // Last resort: no options at all
      try {
        recorder = new MediaRecorder(stream);
      } catch (err2) {
        addLog("error", "MediaRecorder fallback failed");
        setError("Your browser cannot record audio. Please try Chrome or Firefox.");
        cleanup();
        return;
      }
    }

    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        addLog("info", `Audio chunk: ${event.data.size} bytes`);
        chunkAccumulatorRef.current.push(event.data);
      }
    };

    recorder.onerror = (event) => {
      addLog("error", "MediaRecorder error");
      setError("Recording error occurred. Try refreshing the page.");
      setIsRecording(false);
      cleanup();
    };

    recorder.onstop = () => {
      addLog("info", "Recording stopped");
    };

    try {
      recorder.start(chunkIntervalMs);
    } catch (err) {
      addLog("error", "recorder.start() failed");
      setError("Failed to start recording. Please try again.");
      cleanup();
      return;
    }

    // Periodically collect chunks
    intervalRef.current = setInterval(() => {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === "recording"
      ) {
        try {
          mediaRecorderRef.current.requestData();
        } catch {
          // ignore
        }

        if (chunkAccumulatorRef.current.length > 0) {
          setAudioChunks((prev) => [...prev, ...chunkAccumulatorRef.current]);
          chunkAccumulatorRef.current = [];
        }
      }
    }, chunkIntervalMs);

    setIsRecording(true);
    addLog("success", "Recording started");
  }, [isSupported, chunkIntervalMs, cleanup]);

  const stopRecording = useCallback(() => {
    if (chunkAccumulatorRef.current.length > 0) {
      setAudioChunks((prev) => [...prev, ...chunkAccumulatorRef.current]);
      chunkAccumulatorRef.current = [];
    }

    cleanup();
    setIsRecording(false);
  }, [cleanup]);

  const clearChunks = useCallback(() => {
    setAudioChunks([]);
    chunkAccumulatorRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    isRecording,
    error,
    startRecording,
    stopRecording,
    audioChunks,
    clearChunks,
    isSupported,
    hasCameraPermission,
    hasAudioPermission,
  };
}
