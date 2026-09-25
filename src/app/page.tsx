"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TranscriptionProvider, useTranscription } from "@/context/TranscriptionContext";
import { useAudioCapture } from "@/hooks/useAudioCapture";
import { useAudioUpload } from "@/hooks/useAudioUpload";
import { SessionSelector } from "@/components/SessionSelector";
import { LanguageSelector } from "@/components/LanguageSelector";
import { StatusIndicator } from "@/components/StatusIndicator";
import { SubtitleDisplay } from "@/components/SubtitleDisplay";
import { SessionManager } from "@/components/SessionManager";
import { SettingsPanel } from "@/components/SettingsPanel";
import { LanguageProvider } from "@/context/LanguageContext";
import { useLanguage } from "@/context/LanguageContext";
import { t } from "@/lib/i18n";
import { addLog } from "@/components/DebugConsole";

function TranscriptionApp() {
  const { state, dispatch } = useTranscription();
  const { locale } = useLanguage();
  const {
    isRecording,
    error: audioError,
    startRecording,
    stopRecording,
    audioChunks,
    clearChunks,
    isSupported,
  } = useAudioCapture(15000);

  const { isUploading, error: uploadError, progress, uploadFile } = useAudioUpload();
  const [dragOver, setDragOver] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sessionManagerOpen, setSessionManagerOpen] = useState(false);
  const [sessionRefreshKey, setSessionRefreshKey] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processingRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Keep chunksRef in sync with audioChunks state
  useEffect(() => {
    chunksRef.current = audioChunks;
  }, [audioChunks]);

  // Read settings from localStorage
  const getSettings = useCallback(() => {
    try {
      const keySource = localStorage.getItem("nerdsubs_key_source");
      const apiKey = keySource === "custom"
        ? localStorage.getItem("nerdsubs_api_key") || undefined
        : undefined;
      const model = localStorage.getItem("nerdsubs_model") || undefined;
      return { apiKey, model };
    } catch {
      return { apiKey: undefined, model: undefined };
    }
  }, []);

  // Process audio chunks — only send the most recent chunk
  const processAudio = useCallback(async () => {
    if (processingRef.current || chunksRef.current.length === 0) return;

    processingRef.current = true;
    dispatch({ type: "SET_PROCESSING", isProcessing: true });

    // Only take the LAST chunk — old audio is irrelevant for real-time
    const lastChunk = chunksRef.current[chunksRef.current.length - 1];
    chunksRef.current = [];
    clearChunks();

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(lastChunk);
      });

      const audioBase64 = await base64Promise;

      // Determine mode
      const src = state.sourceLanguage;
      const tgt = state.targetLanguage;
      const isSame = src !== "auto" && tgt !== "auto" && src === tgt;
      const mode = isSame ? "transcribe" : "translate";

      const { apiKey } = getSettings();
      const startTime = Date.now();

      const response = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audio: audioBase64,
          sessionId: state.sessionId,
          mode,
          mimeType: lastChunk.type || "audio/webm;codecs=opus",
          apiKey,
          sourceLanguage: src,
          targetLanguage: tgt,
        }),
      });

      const data = await response.json();

      if (response.ok && data.text) {
        const latency = data.latency || Date.now() - startTime;
        dispatch({ type: "SET_LATENCY", latency });

        let original = data.text;
        let translation: string | undefined;

        if (mode === "translate" && data.text.includes("---")) {
          const parts = data.text.split("---");
          original = parts[0].trim();
          translation = parts.slice(1).join("---").trim();
        }

        addLog("success", `Subtitle: ${original.substring(0, 80)}`);

        dispatch({
          type: "ADD_SUBTITLE",
          subtitle: {
            id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            original,
            translation,
            timestamp: data.timestamp || Date.now(),
          },
        });

        dispatch({ type: "SET_CONNECTION_STATUS", status: "connected" });
      } else if (data.error) {
        addLog("error", `API: ${data.error}`);
        dispatch({ type: "SET_CONNECTION_STATUS", status: "disconnected" });
      }
    } catch (err) {
      addLog("error", `Fetch failed: ${err instanceof Error ? err.message : "unknown"}`);
      dispatch({ type: "SET_CONNECTION_STATUS", status: "disconnected" });
    }

    processingRef.current = false;
    dispatch({ type: "SET_PROCESSING", isProcessing: false });
  }, [clearChunks, dispatch, state.sessionId, state.sourceLanguage, state.targetLanguage, getSettings]);

  // Poll for audio chunks — stable interval, no re-creation
  useEffect(() => {
    if (state.isListening) {
      addLog("info", "Starting poll interval");
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
  }, [state.isListening, processAudio]);

  // Sync recording state
  useEffect(() => {
    if (state.isListening && !isRecording) {
      startRecording();
    } else if (!state.isListening && isRecording) {
      stopRecording();
    }
  }, [state.isListening, isRecording, startRecording, stopRecording]);

  // Listen for upload chunk results
  useEffect(() => {
    const handleChunk = (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        original: string;
        translation?: string;
        timestamp: number;
      };
      dispatch({
        type: "ADD_SUBTITLE",
        subtitle: {
          id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          original: detail.original,
          translation: detail.translation,
          timestamp: detail.timestamp,
        },
      });
    };

    const handleLatency = (e: Event) => {
      const latency = (e as CustomEvent).detail as number;
      dispatch({ type: "SET_LATENCY", latency });
    };

    window.addEventListener("audio-upload-chunk", handleChunk);
    window.addEventListener("audio-upload-latency", handleLatency);
    return () => {
      window.removeEventListener("audio-upload-chunk", handleChunk);
      window.removeEventListener("audio-upload-latency", handleLatency);
    };
  }, [dispatch]);

  const handleToggleListening = () => {
    if (state.isListening) {
      dispatch({ type: "STOP_LISTENING" });
    } else {
      dispatch({ type: "START_LISTENING" });
    }
  };

  const handleFileSelect = useCallback(
    (file: File) => {
      dispatch({ type: "START_LISTENING" });
      uploadFile(file, state.sessionId, "translate", state.sourceLanguage, state.targetLanguage);
    },
    [uploadFile, state.sessionId, state.sourceLanguage, state.targetLanguage, dispatch]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileSelect(file);
      e.target.value = "";
    },
    [handleFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleSessionsChanged = useCallback(() => {
    setSessionRefreshKey((k) => k + 1);
  }, []);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  const hasApiKey = (() => {
    try {
      return !!(
        process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
        localStorage.getItem("nerdsubs_api_key")
      );
    } catch {
      return false;
    }
  })();

  return (
    <div className="h-screen flex flex-col bg-nerd-bg">
      {/* Top bar */}
      <header className="flex-shrink-0 border-b border-nerd-border bg-nerd-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Hamburger + Logo */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg text-nerd-muted hover:text-nerd-text hover:bg-nerd-border/50 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center lg:hidden"
                aria-label="Toggle sidebar"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-nerd-accent to-purple-600 flex items-center justify-center shadow-lg shadow-nerd-accent/25">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </div>
                <img src="/logos/n-icon.png" alt="Nerdearla" className="h-8 w-auto object-contain" width={32} height={32} />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-nerd-text tracking-tight">
                  {t(locale, "app.title")}
                </h1>
                <p className="text-xs text-nerd-muted">
                  {t(locale, "app.subtitle")}
                </p>
              </div>
            </div>

            {/* Center: Navigation */}
            <nav className="flex items-center gap-1">
              <a href="/dashboard" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-nerd-muted hover:text-nerd-text hover:bg-nerd-border/50 transition-all min-h-[44px]">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span className="hidden sm:inline">{t(locale, "nav.dashboard")}</span>
              </a>
              <a href="/editor"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-nerd-muted hover:text-nerd-text hover:bg-nerd-border/50 transition-all min-h-[44px]">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span className="hidden sm:inline">{t(locale, "nav.editor")}</span>
              </a>
              <a href="/watch"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-nerd-muted hover:text-nerd-text hover:bg-nerd-border/50 transition-all min-h-[44px]">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="hidden sm:inline">Ver</span>
              </a>
              <a href="/setup"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-nerd-muted hover:text-nerd-text hover:bg-nerd-border/50 transition-all min-h-[44px]">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="hidden sm:inline">{t(locale, "nav.setup")}</span>
              </a>
            </nav>

            {/* Right: Status + Settings */}
            <div className="flex items-center gap-1 sm:gap-2">
              <StatusIndicator />
              <button
                onClick={() => setSettingsOpen(true)}
                className="relative p-2 rounded-lg text-nerd-muted hover:text-nerd-text hover:bg-nerd-border/50 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                title={t(locale, "settings.title")}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {!hasApiKey && (
                  <span className="absolute top-1 right-1 w-3 h-3 bg-nerd-warning rounded-full animate-pulse" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 relative">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden" onClick={closeSidebar} />
        )}

        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-nerd-card border-r border-nerd-border transform transition-transform duration-300 ease-in-out overflow-y-auto lg:static lg:translate-x-0 lg:w-72 lg:flex-shrink-0 lg:border-r lg:border-b-0 lg:bg-nerd-card/30 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          {/* Mobile close */}
          <div className="flex items-center justify-between p-4 border-b border-nerd-border lg:hidden">
            <span className="text-sm font-medium text-nerd-muted uppercase tracking-wider">{t(locale, "sidebar.settings")}</span>
            <button onClick={closeSidebar} className="p-2 rounded-lg text-nerd-muted hover:text-nerd-text hover:bg-nerd-border/50 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Close sidebar">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="p-4 space-y-6">
            {/* Mode toggle */}
            <div className="flex rounded-lg bg-nerd-bg p-1">
              <button onClick={() => { dispatch({ type: "SET_APP_MODE", mode: "live" }); closeSidebar(); }}
                className={`flex-1 py-2.5 px-3 rounded-md text-sm font-medium transition-all min-h-[44px] ${state.appMode === "live" ? "bg-nerd-accent text-white shadow" : "text-nerd-muted hover:text-nerd-text"}`}>
                <span className="flex items-center justify-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                  {t(locale, "sidebar.liveMode")}
                </span>
              </button>
              <button onClick={() => { dispatch({ type: "SET_APP_MODE", mode: "upload" }); closeSidebar(); }}
                className={`flex-1 py-2.5 px-3 rounded-md text-sm font-medium transition-all min-h-[44px] ${state.appMode === "upload" ? "bg-nerd-accent text-white shadow" : "text-nerd-muted hover:text-nerd-text"}`}>
                <span className="flex items-center justify-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                  {t(locale, "sidebar.uploadMode")}
                </span>
              </button>
            </div>

            {/* Session selector */}
            <SessionSelector onOpenManager={() => setSessionManagerOpen(true)} refreshKey={sessionRefreshKey} />

            {/* Language selectors */}
            <LanguageSelector />

            {/* Live mode: Start/Stop */}
            {state.appMode === "live" && (
              <button onClick={() => { handleToggleListening(); closeSidebar(); }} disabled={!isSupported}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 min-h-[48px] ${state.isListening ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30" : "bg-nerd-accent text-white shadow-lg shadow-nerd-accent/25 hover:bg-nerd-accent-light hover:shadow-nerd-accent/40"} disabled:opacity-50 disabled:cursor-not-allowed`}>
                {state.isListening ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>
                    {t(locale, "sidebar.stopListening")}
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                    {t(locale, "sidebar.startListening")}
                  </span>
                )}
              </button>
            )}

            {/* Upload mode: Drop zone */}
            {state.appMode === "upload" && (
              <div className="space-y-3">
                <div onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${dragOver ? "border-nerd-accent bg-nerd-accent/10" : "border-nerd-border hover:border-nerd-accent/50 hover:bg-nerd-card"}`}>
                  <svg className="w-10 h-10 mx-auto mb-3 text-nerd-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                  <p className="text-sm text-nerd-muted">{dragOver ? "Drop audio file here" : "Drag & drop an audio file"}</p>
                  <p className="text-xs text-nerd-muted/60 mt-1">MP3, WAV, WebM, OGG (max 25MB)</p>
                </div>
                <input ref={fileInputRef} type="file" accept=".mp3,.wav,.webm,.ogg,audio/*" onChange={handleFileInputChange} className="hidden" />
                {progress && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-nerd-muted">
                      <span>Processing chunk {progress.current} of {progress.total}</span>
                      <span>{Math.round((progress.current / progress.total) * 100)}%</span>
                    </div>
                    <div className="w-full h-2 bg-nerd-bg rounded-full overflow-hidden">
                      <div className="h-full bg-nerd-accent transition-all duration-300 rounded-full" style={{ width: `${(progress.current / progress.total) * 100}%` }} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Errors */}
            {(audioError || uploadError) && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-400">{audioError || uploadError}</p>
              </div>
            )}

            {/* Unsupported */}
            {state.appMode === "live" && !isSupported && (
              <div className="p-3 bg-nerd-warning/10 border border-nerd-warning/30 rounded-lg">
                <p className="text-sm text-nerd-warning">Your browser doesn&apos;t support audio recording.</p>
              </div>
            )}

            {/* Stats */}
            <div className="space-y-2 pt-4 border-t border-nerd-border">
              <h3 className="text-xs font-medium text-nerd-muted uppercase tracking-wider">{t(locale, "sidebar.statistics")}</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-nerd-bg rounded-lg p-3">
                  <p className="text-2xl font-bold text-nerd-text font-mono">{state.subtitles.length}</p>
                  <p className="text-xs text-nerd-muted">{t(locale, "sidebar.subtitles")}</p>
                </div>
                <div className="bg-nerd-bg rounded-lg p-3">
                  <p className="text-2xl font-bold text-nerd-text font-mono">{state.latency !== null ? `${state.latency}` : "\u2014"}</p>
                  <p className="text-xs text-nerd-muted">{t(locale, "sidebar.latency")}</p>
                </div>
              </div>
            </div>

            {/* Browser info */}
            <div className="space-y-1 pt-2">
              <p className="text-xs text-nerd-muted">Browser: <strong className="text-nerd-text">{typeof navigator !== "undefined" ? navigator.userAgent.split(" ").pop()?.split("/")[0] : "?"}</strong></p>
            </div>

            {/* Clear history */}
            <button onClick={() => { if (confirm(t(locale, "sidebar.confirmClearHistory"))) { localStorage.removeItem("nerdsubs_sessions"); dispatch({ type: "CLEAR_SUBTITLES" }); } }}
              className="w-full py-2 px-4 rounded-lg text-sm font-medium text-nerd-muted border border-nerd-border hover:text-red-400 hover:border-red-500/30 transition-all">
              {t(locale, "sidebar.clearHistory")}
            </button>
          </div>
        </aside>

        {/* Main subtitle display */}
        <main className="flex-1 flex flex-col min-h-0">
          <SubtitleDisplay debugOpen={debugOpen} onToggleDebug={() => setDebugOpen(!debugOpen)} />
        </main>
      </div>

      {/* Modals */}
      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <SessionManager isOpen={sessionManagerOpen} onClose={() => setSessionManagerOpen(false)} onSessionsChanged={handleSessionsChanged} />
    </div>
  );
}

export default function Home() {
  return (
    <LanguageProvider>
      <TranscriptionProvider>
        <TranscriptionApp />
      </TranscriptionProvider>
    </LanguageProvider>
  );
}
