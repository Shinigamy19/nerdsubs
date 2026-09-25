"use client";

import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef, type ReactNode } from "react";
import { autoSave } from "@/lib/subtitleStore";

// --- Types ---

/** @deprecated Use sourceLanguage and targetLanguage instead */
export type LanguageMode = "EN_TO_ES" | "ES_TO_EN";

export interface SubtitleEntry {
  id: string;
  original: string;
  translation?: string;
  timestamp: number;
}

export type ConnectionStatus = "connected" | "disconnected" | "connecting";

export type AppMode = "live" | "upload";

export interface TranscriptionState {
  sessionId: string;
  /** @deprecated Use sourceLanguage and targetLanguage instead */
  languageMode: LanguageMode;
  sourceLanguage: string;
  targetLanguage: string;
  subtitles: SubtitleEntry[];
  isListening: boolean;
  connectionStatus: ConnectionStatus;
  lastUpdate: number | null;
  latency: number | null;
  isProcessing: boolean;
  appMode: AppMode;
}

export type TranscriptionAction =
  | { type: "SET_SESSION"; sessionId: string }
  | { type: "SET_LANGUAGE_MODE"; mode: LanguageMode }
  | { type: "SET_SOURCE_LANGUAGE"; language: string }
  | { type: "SET_TARGET_LANGUAGE"; language: string }
  | { type: "ADD_SUBTITLE"; subtitle: SubtitleEntry }
  | { type: "LOAD_SUBTITLES"; subtitles: SubtitleEntry[]; sourceLanguage: string; targetLanguage: string }
  | { type: "CLEAR_SUBTITLES" }
  | { type: "START_LISTENING" }
  | { type: "STOP_LISTENING" }
  | { type: "SET_CONNECTION_STATUS"; status: ConnectionStatus }
  | { type: "SET_LATENCY"; latency: number }
  | { type: "SET_PROCESSING"; isProcessing: boolean }
  | { type: "SET_APP_MODE"; mode: AppMode };

// --- Reducer ---

const initialState: TranscriptionState = {
  sessionId: "main-stage",
  languageMode: "EN_TO_ES",
  sourceLanguage: "auto",
  targetLanguage: "es",
  subtitles: [],
  isListening: false,
  connectionStatus: "disconnected",
  lastUpdate: null,
  latency: null,
  isProcessing: false,
  appMode: "live",
};

function deriveLanguageMode(sourceLanguage: string, targetLanguage: string): LanguageMode {
  if (sourceLanguage === "en" || (sourceLanguage === "auto" && targetLanguage === "es")) {
    return "EN_TO_ES";
  }
  return "ES_TO_EN";
}

function transcriptionReducer(
  state: TranscriptionState,
  action: TranscriptionAction
): TranscriptionState {
  switch (action.type) {
    case "SET_SESSION":
      return { ...state, sessionId: action.sessionId, subtitles: [] };
    case "SET_LANGUAGE_MODE": {
      const newSource = action.mode === "EN_TO_ES" ? "en" : "es";
      const newTarget = action.mode === "EN_TO_ES" ? "es" : "en";
      return {
        ...state,
        languageMode: action.mode,
        sourceLanguage: newSource,
        targetLanguage: newTarget,
        subtitles: [],
      };
    }
    case "SET_SOURCE_LANGUAGE":
      return {
        ...state,
        sourceLanguage: action.language,
        languageMode: deriveLanguageMode(action.language, state.targetLanguage),
        subtitles: [],
      };
    case "SET_TARGET_LANGUAGE":
      return {
        ...state,
        targetLanguage: action.language,
        languageMode: deriveLanguageMode(state.sourceLanguage, action.language),
        subtitles: [],
      };
    case "ADD_SUBTITLE":
      return {
        ...state,
        subtitles: [...state.subtitles, action.subtitle],
        lastUpdate: action.subtitle.timestamp,
      };
    case "LOAD_SUBTITLES":
      return {
        ...state,
        subtitles: action.subtitles,
        sourceLanguage: action.sourceLanguage,
        targetLanguage: action.targetLanguage,
        languageMode: deriveLanguageMode(action.sourceLanguage, action.targetLanguage),
      };
    case "CLEAR_SUBTITLES":
      return { ...state, subtitles: [] };
    case "START_LISTENING":
      return { ...state, isListening: true, connectionStatus: "connecting" };
    case "STOP_LISTENING":
      return {
        ...state,
        isListening: false,
        connectionStatus: "disconnected",
        isProcessing: false,
      };
    case "SET_CONNECTION_STATUS":
      return { ...state, connectionStatus: action.status };
    case "SET_LATENCY":
      return { ...state, latency: action.latency };
    case "SET_PROCESSING":
      return { ...state, isProcessing: action.isProcessing };
    case "SET_APP_MODE":
      return {
        ...state,
        appMode: action.mode,
        isListening: false,
        isProcessing: false,
        connectionStatus: "disconnected",
        subtitles: [],
      };
    default:
      return state;
  }
}

// --- Context ---

interface TranscriptionContextValue {
  state: TranscriptionState;
  dispatch: React.Dispatch<TranscriptionAction>;
}

const TranscriptionContext = createContext<TranscriptionContextValue | null>(null);

export function TranscriptionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(transcriptionReducer, initialState);
  const prevSubtitleCountRef = useRef(0);

  // Auto-save when subtitles change
  useEffect(() => {
    if (state.subtitles.length > prevSubtitleCountRef.current) {
      autoSave(state.sessionId, state.subtitles, {
        sourceLanguage: state.sourceLanguage,
        targetLanguage: state.targetLanguage,
        mode: "translate",
      });
    }
    prevSubtitleCountRef.current = state.subtitles.length;
  }, [state.subtitles, state.sessionId, state.sourceLanguage, state.targetLanguage]);

  const value = React.useMemo(() => ({ state, dispatch }), [state]);

  return (
    <TranscriptionContext.Provider value={value}>
      {children}
    </TranscriptionContext.Provider>
  );
}

export function useTranscription(): TranscriptionContextValue {
  const context = useContext(TranscriptionContext);
  if (!context) {
    throw new Error("useTranscription must be used within a TranscriptionProvider");
  }
  return context;
}
