"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { STAGES, ALL_LANGS, LANG_FLAGS, LANG_NAMES, type Stage } from "@/lib/stages";

export default function WatchListPage() {
  const [stages, setStages] = useState<Stage[]>(STAGES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/stats");
        if (res.ok) {
          const data = await res.json();
          setStages((prev) =>
            prev.map((s) => ({
              ...s,
              live: data.some((d: { sessionId: string; status: string }) => d.sessionId === s.id && d.status === "active"),
            }))
          );
        }
      } catch {} finally {
        setLoading(false);
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-nerd-bg text-nerd-text">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <header className="mb-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="h-2 w-2 rounded-full bg-nerd-success animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-nerd-muted">NerdSubs — Subtítulos en Vivo</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Salas y Escenarios</h1>
          <p className="mt-2 text-nerd-muted">Elegí una sala y el idioma de traducción.</p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          {stages.map((stage) => (
            <div key={stage.id} className="flex flex-col justify-between rounded-2xl border border-nerd-border bg-nerd-card p-6 transition hover:border-nerd-accent/30">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-semibold tracking-wider text-nerd-muted uppercase">{stage.id}</span>
                  {stage.live ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 border border-red-500/30 px-3 py-1 font-mono text-xs font-medium text-red-400">
                      <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />EN VIVO
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-nerd-border/50 border border-nerd-border px-3 py-1 font-mono text-xs text-nerd-muted">EN ESPERA</span>
                  )}
                </div>
                <h2 className="text-2xl font-semibold text-nerd-text">{stage.name}</h2>
                <p className="mt-1 text-sm text-nerd-muted">{stage.description}</p>
                <p className="mt-2 font-mono text-xs text-nerd-muted">
                  Audio original: <span className="uppercase text-nerd-text font-bold">{stage.sourceLang}</span>
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-nerd-border">
                <p className="text-xs uppercase tracking-wider font-mono text-nerd-muted mb-3">
                  Traducir a:
                </p>
                <div className="flex flex-wrap gap-2">
                  {ALL_LANGS.map((lang) => (
                    <Link
                      key={lang}
                      href={`/watch/${stage.id}?lang=${lang}`}
                      className="flex items-center gap-1.5 rounded-full border border-nerd-border bg-nerd-bg px-3 py-1.5 text-xs font-medium text-nerd-text transition hover:bg-nerd-border/50 hover:border-nerd-accent/50"
                    >
                      <span>{LANG_FLAGS[lang]}</span>
                      <span>{LANG_NAMES[lang]}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
