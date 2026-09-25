"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { STAGES, LANG_NAMES, LANG_FLAGS, ALL_LANGS, type Stage } from "@/lib/stages";

type FontSize = "sm" | "md" | "lg" | "xl";

const FONT_CLASSES: Record<FontSize, string> = {
  sm: "text-lg md:text-xl",
  md: "text-2xl md:text-3xl",
  lg: "text-3xl md:text-4xl font-medium",
  xl: "text-4xl md:text-5xl font-medium",
};

interface Caption {
  seq: number;
  text: string;
  isFinal: boolean;
  timestamp: number;
}

export default function WatchStagePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const stageId = params.id as string;

  const langParam = searchParams.get("lang");
  const currentLang = ALL_LANGS.includes(langParam || "") ? langParam! : "es";

  const [fontSize, setFontSize] = useState<FontSize>("md");
  const [autoScroll, setAutoScroll] = useState(true);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [partial, setPartial] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const stage = STAGES.find((s) => s.id === stageId);

  // Poll for captions
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/captions/${stageId}?lang=${currentLang}`);
        if (res.ok) {
          const data = await res.json();
          if (data.captions && data.captions.length > 0) {
            setCaptions((prev) => {
              const existing = new Set(prev.map((c) => c.seq));
              const newCaptions = data.captions.filter((c: Caption) => !existing.has(c.seq));
              return [...prev, ...newCaptions].slice(-50);
            });
            setPartial(data.partial || null);
            setIsLive(data.live || false);
          }
        }
      } catch {}
    };
    poll();
    const interval = setInterval(poll, 1000);
    return () => clearInterval(interval);
  }, [stageId, currentLang]);

  // Auto-scroll
  useEffect(() => {
    if (autoScroll && endRef.current) {
      endRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [captions, partial, autoScroll]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    if (scrollHeight - (scrollTop + clientHeight) > 80) {
      setUserScrolledUp(true);
      setAutoScroll(false);
    } else {
      setUserScrolledUp(false);
      setAutoScroll(true);
    }
  }, []);

  const setLanguage = (lang: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("lang", lang);
    window.location.href = url.toString();
  };

  return (
    <div className="flex h-screen flex-col bg-nerd-bg text-nerd-text overflow-hidden select-text">
      {/* Top Bar */}
      <header className="flex shrink-0 flex-wrap items-center justify-between border-b border-nerd-border bg-nerd-card/90 px-4 py-3 backdrop-blur-md z-20 sm:px-8">
        <div className="flex items-center gap-3">
          <Link href="/watch" className="rounded-full border border-nerd-border p-2 text-xs text-nerd-muted hover:text-nerd-text transition">
            ←
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="font-mono text-sm font-semibold tracking-wide uppercase sm:text-base">
              {stage?.name || stageId}
            </h1>
            {isLive ? (
              <span className="flex items-center gap-1.5 rounded-full bg-red-500/10 border border-red-500/30 px-2.5 py-0.5 font-mono text-[10px] font-bold text-red-400">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                EN VIVO
              </span>
            ) : (
              <span className="rounded-full bg-nerd-border/50 border border-nerd-border px-2.5 py-0.5 font-mono text-[10px] text-nerd-muted">
                EN ESPERA
              </span>
            )}
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          {/* Language Selector — all supported languages */}
          <div className="relative" ref={useRef<HTMLDivElement>(null)}>
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-2 rounded-full border border-nerd-border bg-nerd-bg px-3 py-1.5 text-xs font-semibold transition hover:border-nerd-accent/50"
            >
              <span>{LANG_FLAGS[currentLang]}</span>
              <span>{LANG_NAMES[currentLang]}</span>
              <svg className={`w-3 h-3 text-nerd-muted transition-transform ${langOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {langOpen && (
              <div className="absolute right-0 mt-1 w-48 bg-nerd-card border border-nerd-border rounded-xl shadow-xl overflow-hidden z-50">
                {ALL_LANGS.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => { setLanguage(lang); setLangOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition text-left ${
                      currentLang === lang
                        ? "bg-nerd-accent/20 text-nerd-accent"
                        : "text-nerd-text hover:bg-nerd-border/50"
                    }`}
                  >
                    <span className="text-lg">{LANG_FLAGS[lang]}</span>
                    <span>{LANG_NAMES[lang]}</span>
                    {currentLang === lang && <span className="ml-auto text-nerd-accent">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Font Size */}
          <div className="flex items-center rounded-full border border-nerd-border bg-nerd-bg p-0.5">
            {(["sm", "md", "lg", "xl"] as FontSize[]).map((size) => (
              <button
                key={size}
                onClick={() => setFontSize(size)}
                className={`rounded-full px-2 py-1 text-[11px] font-mono uppercase transition ${
                  fontSize === size ? "bg-nerd-accent/25 text-nerd-accent font-bold" : "text-nerd-muted hover:text-nerd-text"
                }`}
              >
                {size}
              </button>
            ))}
          </div>

          {/* OBS Link */}
          <Link
            href={`/overlay/${stageId}?target=${currentLang === "en" ? "es" : "en"}`}
            target="_blank"
            title="Overlay OBS"
            className="rounded-full border border-nerd-border p-2 text-xs text-nerd-muted hover:text-nerd-text transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </Link>
        </div>
      </header>

      {/* Main Subtitles */}
      <main ref={containerRef} onScroll={handleScroll} className="relative flex-1 overflow-y-auto px-6 py-10 md:px-16 lg:px-24">
        <div className="mx-auto max-w-4xl space-y-6">
          {captions.length === 0 && !partial && (
            <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
              <span className="font-mono text-xs uppercase tracking-[0.25em] text-nerd-muted">
                {isLive ? "Esperando audio..." : "Escenario en espera"}
              </span>
              <p className="mt-3 text-sm text-nerd-muted max-w-md">
                {isLive ? "El audio está siendo procesado en vivo por Gemini." : "Cuando el orador comience a hablar, los subtítulos aparecerán automáticamente."}
              </p>
            </div>
          )}
          {captions.map((c) => (
            <p key={c.seq} className={`${FONT_CLASSES[fontSize]} text-nerd-text tracking-normal`}>
              {c.text}
            </p>
          ))}
          {partial && (
            <p className={`${FONT_CLASSES[fontSize]} text-nerd-muted/65 italic animate-pulse`}>
              {partial}
            </p>
          )}
          <div ref={endRef} className="h-6" />
        </div>
        {userScrolledUp && (
          <button onClick={() => { setAutoScroll(true); setUserScrolledUp(false); endRef.current?.scrollIntoView({ behavior: "smooth" }); }}
            className="fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-full bg-nerd-accent px-4 py-2 text-xs font-semibold text-white shadow-2xl transition hover:bg-nerd-accent-light">
            ↓ Reanudar auto-scroll
          </button>
        )}
      </main>
    </div>
  );
}
