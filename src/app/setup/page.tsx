"use client";

import { useState, useEffect, useCallback } from "react";
import { getSessions, type Session } from "@/lib/sessionStore";
import { SUPPORTED_LANGUAGES } from "@/lib/languages";

// --- Types ---

interface CopyButtonProps {
  text: string;
  id: string;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
  label?: string;
  className?: string;
}

// --- Components ---

function CopyButton({ text, id, copiedId, onCopy, label = "Copy URL", className = "" }: CopyButtonProps) {
  const isCopied = copiedId === id;

  return (
    <button
      onClick={() => onCopy(text, id)}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 min-h-[44px] ${
        isCopied
          ? "bg-nerd-success/20 text-nerd-success border border-nerd-success/30"
          : "bg-nerd-accent/10 text-nerd-accent border border-nerd-accent/30 hover:bg-nerd-accent/20 hover:border-nerd-accent/50"
      } ${className}`}
    >
      {isCopied ? (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>
          {label}
        </>
      )}
    </button>
  );
}

function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-nerd-card border border-nerd-border rounded-2xl p-6 sm:p-8 ${className}`}>
      {children}
    </div>
  );
}

function LanguageSelector({
  value,
  onChange,
  label,
  includeAuto = false,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  includeAuto?: boolean;
}) {
  const languages = includeAuto ? SUPPORTED_LANGUAGES : SUPPORTED_LANGUAGES.filter((l) => l.code !== "auto");

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-nerd-muted uppercase tracking-wider">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-nerd-bg border border-nerd-border rounded-lg px-3 py-2.5 text-sm text-nerd-text focus:outline-none focus:border-nerd-accent transition-colors min-h-[44px]"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name} ({lang.code})
          </option>
        ))}
      </select>
    </div>
  );
}

// --- Main Page ---

export default function SetupPage() {
  const [source, setSource] = useState("auto");
  const [target, setTarget] = useState("es");
  const [fontSize, setFontSize] = useState("48");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      setSessions(getSessions());
    } catch {
      // localStorage unavailable
    }
  }, []);

  const getUrl = useCallback(
    (sessionId: string) => {
      if (typeof window === "undefined") return "";
      // Always use localhost for OBS — mic/camera require secure context
      return `http://localhost:3000/overlay?session=${sessionId}&source=${source}&target=${target}&fontsize=${fontSize}`;
    },
    [source, target, fontSize]
  );

  const copyToClipboard = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }, []);

  const copyAllUrls = useCallback(() => {
    const allUrls = sessions.map((s) => `${s.name}: ${getUrl(s.id)}`).join("\n");
    copyToClipboard(allUrls, "copy-all");
  }, [sessions, getUrl, copyToClipboard]);

  const sessionIcons: Record<string, string> = {
    "main-stage": "🎤",
    "track-a": "🎨",
    "track-b": "⚙️",
    "track-c": "🧠",
  };

  const urlParams = [
    { param: "session", default: "main-stage", desc: "Which session to listen to" },
    { param: "source", default: "auto", desc: "Source language (auto-detect, en, es, pt, etc.)" },
    { param: "target", default: "es", desc: "Target language for translation" },
    { param: "fontsize", default: "48", desc: "Font size in pixels" },
    { param: "maxlines", default: "3", desc: "Max subtitle lines visible" },
    { param: "mode", default: "translate", desc: "transcribe or translate" },
  ];

  return (
    <div className="min-h-screen bg-nerd-bg">
      {/* Header */}
      <header className="border-b border-nerd-border bg-nerd-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <a
              href="/"
              className="flex items-center gap-2 text-nerd-muted hover:text-nerd-text transition-colors min-h-[44px]"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="text-sm font-medium hidden sm:inline">Back to App</span>
            </a>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-nerd-accent to-purple-600 flex items-center justify-center shadow-lg shadow-nerd-accent/25">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </div>
                <img src="/logos/n-icon.png" alt="Nerdearla" className="h-6 w-auto object-contain" width={24} height={24} />
              </div>
              <h1 className="text-lg font-bold text-nerd-text tracking-tight">Setup Guide</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 sm:space-y-12">
        {/* Hero */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl sm:text-5xl font-bold text-nerd-text tracking-tight">
            NerdSubs <span className="text-nerd-accent">+</span> OBS Setup Guide
          </h1>
          <p className="text-lg sm:text-xl text-nerd-muted max-w-2xl mx-auto">
            Add live subtitles to your stream in 5 minutes
          </p>
          <div className="flex justify-center gap-2 pt-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-nerd-accent/10 text-nerd-accent border border-nerd-accent/20">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Quick Setup
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-nerd-success/10 text-nerd-success border border-nerd-success/20">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              OBS Compatible
            </span>
          </div>
        </div>

        {/* Section 1: Prerequisites */}
        <SectionCard>
          <h2 className="text-xl sm:text-2xl font-bold text-nerd-text mb-6 flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-nerd-accent/20 text-nerd-accent flex items-center justify-center text-sm font-bold">
              1
            </span>
            Prerequisites
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                icon: "✅",
                text: "NerdSubs running",
                detail: "npm run dev",
                link: null,
              },
              {
                icon: "✅",
                text: "OBS Studio installed",
                detail: "v28 or later recommended",
                link: "https://obsproject.com/download",
              },
              {
                icon: "✅",
                text: "Microphone connected",
                detail: "For audio capture",
                link: null,
              },
              {
                icon: "✅",
                text: "Gemini API key configured",
                detail: "Open settings to add yours",
                link: "/",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-4 rounded-xl bg-nerd-bg/50 border border-nerd-border/50 hover:border-nerd-border transition-colors"
              >
                <span className="text-xl flex-shrink-0 mt-0.5">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-nerd-text">{item.text}</p>
                  <p className="text-xs text-nerd-muted mt-0.5">{item.detail}</p>
                </div>
                {item.link && (
                  <a
                    href={item.link}
                    target={item.link.startsWith("http") ? "_blank" : undefined}
                    rel={item.link.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="flex-shrink-0 p-2 rounded-lg text-nerd-accent hover:bg-nerd-accent/10 transition-colors"
                    title={item.link.startsWith("http") ? "Open download page" : "Open settings"}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Important note about localhost */}
        <div className="bg-nerd-warning/10 border border-nerd-warning/30 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">⚠️</span>
            <div>
              <h3 className="font-semibold text-nerd-warning mb-2">Important: Access via localhost</h3>
              <p className="text-sm text-nerd-muted leading-relaxed">
                For microphone and camera permissions to work, you <strong className="text-nerd-text">must access NerdSubs via <code className="bg-nerd-bg px-1.5 py-0.5 rounded text-nerd-accent">http://localhost:3000</code></strong> (not via IP address). Browsers only allow mic/camera access from secure contexts (localhost or HTTPS). If you access via <code className="bg-nerd-bg px-1.5 py-0.5 rounded text-nerd-text">http://192.168.x.x:3000</code>, the browser will block permissions.
              </p>
              <p className="text-sm text-nerd-muted mt-2">
                <strong className="text-nerd-text">Tip:</strong> Open OBS on the same computer running NerdSubs, and use <code className="bg-nerd-bg px-1.5 py-0.5 rounded text-nerd-accent">localhost</code> in the Browser Source URL.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Quick Start */}
        <SectionCard>
          <h2 className="text-xl sm:text-2xl font-bold text-nerd-text mb-6 flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-nerd-accent/20 text-nerd-accent flex items-center justify-center text-sm font-bold">
              2
            </span>
            Quick Start
          </h2>
          <div className="space-y-6">
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-nerd-accent/20 text-nerd-accent flex items-center justify-center text-xl font-bold">
                1
              </div>
              <div className="flex-1 pt-2">
                <h3 className="text-lg font-semibold text-nerd-text">Open OBS Studio</h3>
                <p className="text-sm text-nerd-muted mt-1">
                  Launch OBS Studio and open your scene collection. If you don&apos;t have one yet, create a new scene.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-nerd-accent/20 text-nerd-accent flex items-center justify-center text-xl font-bold">
                2
              </div>
              <div className="flex-1 pt-2">
                <h3 className="text-lg font-semibold text-nerd-text">Add Browser Source</h3>
                <p className="text-sm text-nerd-muted mt-1">
                  In the <strong className="text-nerd-text">Sources</strong> panel, click <strong className="text-nerd-text">+</strong> and select <strong className="text-nerd-text">Browser</strong>. Name it &quot;NerdSubs Subtitles&quot; and set the dimensions to <strong className="text-nerd-text">1920 x 1080</strong>.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-nerd-accent/20 text-nerd-accent flex items-center justify-center text-xl font-bold">
                3
              </div>
              <div className="flex-1 pt-2">
                <h3 className="text-lg font-semibold text-nerd-text">Paste the URL</h3>
                <p className="text-sm text-nerd-muted mt-1">
                  In the Browser Source properties, paste the overlay URL from the section below. Use <strong className="text-nerd-accent">localhost</strong> (not the IP) so the browser grants mic access.
                </p>
                {mounted && (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 bg-nerd-bg border border-nerd-border rounded-lg px-3 py-2.5 font-mono text-xs text-nerd-accent truncate">
                      {getUrl("main-stage")}
                    </div>
                    <CopyButton
                      text={getUrl("main-stage")}
                      id="quick-start-example"
                      copiedId={copiedId}
                      onCopy={copyToClipboard}
                      label="Copy"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Section 3: OBS URLs */}
        <SectionCard>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-nerd-text flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-nerd-accent/20 text-nerd-accent flex items-center justify-center text-sm font-bold">
                3
              </span>
              OBS Overlay URLs
            </h2>
            <CopyButton
              text={sessions.map((s) => `${s.name}: ${getUrl(s.id)}`).join("\n")}
              id="copy-all"
              copiedId={copiedId}
              onCopy={copyToClipboard}
              label="Copy All"
              className="self-start"
            />
          </div>

          {/* Global language/font settings */}
          <div className="bg-nerd-bg/50 border border-nerd-border/50 rounded-xl p-4 sm:p-5 mb-6">
            <p className="text-xs font-medium text-nerd-muted uppercase tracking-wider mb-3">
              Configure all URLs below
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <LanguageSelector value={source} onChange={setSource} label="Source Language" includeAuto />
              <LanguageSelector value={target} onChange={setTarget} label="Target Language" />
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-nerd-muted uppercase tracking-wider">Font Size</label>
                <select
                  value={fontSize}
                  onChange={(e) => setFontSize(e.target.value)}
                  className="bg-nerd-bg border border-nerd-border rounded-lg px-3 py-2.5 text-sm text-nerd-text focus:outline-none focus:border-nerd-accent transition-colors min-h-[44px]"
                >
                  {[24, 32, 36, 40, 48, 56, 64, 72].map((size) => (
                    <option key={size} value={size}>
                      {size}px
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Session URL grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="bg-nerd-bg/30 border border-nerd-border rounded-xl p-4 sm:p-5 hover:border-nerd-accent/30 transition-all duration-200 group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{sessionIcons[session.id] || "📌"}</span>
                  <div>
                    <h3 className="font-semibold text-nerd-text">{session.name}</h3>
                    {session.description && (
                      <p className="text-xs text-nerd-muted">{session.description}</p>
                    )}
                  </div>
                </div>

                <div className="bg-nerd-bg border border-nerd-border rounded-lg px-3 py-2.5 font-mono text-xs text-nerd-accent/80 break-all leading-relaxed mb-3">
                  {mounted ? getUrl(session.id) : (
                    <span className="text-nerd-muted">Loading...</span>
                  )}
                </div>

                {mounted && (
                  <CopyButton
                    text={getUrl(session.id)}
                    id={session.id}
                    copiedId={copiedId}
                    onCopy={copyToClipboard}
                  />
                )}
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Section 4: URL Configuration */}
        <SectionCard>
          <h2 className="text-xl sm:text-2xl font-bold text-nerd-text mb-6 flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-nerd-accent/20 text-nerd-accent flex items-center justify-center text-sm font-bold">
              4
            </span>
            URL Parameters
          </h2>
          <p className="text-sm text-nerd-muted mb-5">
            Customize the overlay behavior by adding these query parameters to the URL:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-nerd-border">
                  <th className="text-left py-3 px-4 text-xs font-medium text-nerd-muted uppercase tracking-wider">Parameter</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-nerd-muted uppercase tracking-wider">Default</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-nerd-muted uppercase tracking-wider">Description</th>
                </tr>
              </thead>
              <tbody>
                {urlParams.map((item, i) => (
                  <tr key={i} className="border-b border-nerd-border/50 hover:bg-nerd-bg/30 transition-colors">
                    <td className="py-3 px-4">
                      <code className="text-xs font-mono bg-nerd-accent/10 text-nerd-accent px-2 py-1 rounded">
                        {item.param}
                      </code>
                    </td>
                    <td className="py-3 px-4">
                      <code className="text-xs font-mono text-nerd-muted">{item.default}</code>
                    </td>
                    <td className="py-3 px-4 text-nerd-text/80">{item.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* Section 5: Multiple Scenes */}
        <SectionCard>
          <h2 className="text-xl sm:text-2xl font-bold text-nerd-text mb-6 flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-nerd-accent/20 text-nerd-accent flex items-center justify-center text-sm font-bold">
              5
            </span>
            Multiple Scenes
          </h2>
          <p className="text-sm text-nerd-muted mb-5">
            Set up different Browser Sources for each session to switch between them during your event:
          </p>
          <div className="space-y-3">
            {[
              { scene: 'Scene "Main Stage"', url: "main-stage URL", desc: "Keynotes & opening talks" },
              { scene: 'Scene "Track A"', url: "track-a URL", desc: "Frontend & UX sessions" },
              { scene: 'Scene "Track B"', url: "track-b URL", desc: "Backend & Infrastructure" },
              { scene: 'Scene "Track C"', url: "track-c URL", desc: "AI & Data Science" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-nerd-bg/50 border border-nerd-border/50">
                <div className="flex-shrink-0 w-6 h-6 rounded bg-nerd-accent/20 text-nerd-accent flex items-center justify-center text-xs font-bold mt-0.5">
                  {i + 1}
                </div>
                <div>
                  <p className="text-sm font-medium text-nerd-text">
                    {item.scene} <span className="text-nerd-muted font-normal">→</span>{" "}
                    <span className="text-nerd-accent font-mono text-xs">{item.url}</span>
                  </p>
                  <p className="text-xs text-nerd-muted mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 p-4 bg-nerd-accent/5 border border-nerd-accent/20 rounded-xl">
            <p className="text-sm text-nerd-text">
              <strong className="text-nerd-accent">Pro tip:</strong> Use OBS Studio Scene Transitions to smoothly switch between sessions. Each Browser Source maintains its own connection, so subtitles keep flowing even when switching scenes.
            </p>
          </div>
        </SectionCard>

        {/* Section 6: Custom Session URLs */}
        <SectionCard>
          <h2 className="text-xl sm:text-2xl font-bold text-nerd-text mb-6 flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-nerd-accent/20 text-nerd-accent flex items-center justify-center text-sm font-bold">
              6
            </span>
            Custom Sessions
          </h2>
          <p className="text-sm text-nerd-muted mb-5">
            If you created custom sessions in the Session Manager, they appear in the URL grid above alongside the default sessions. You can also construct URLs manually:
          </p>
          <div className="bg-nerd-bg border border-nerd-border rounded-xl p-4 font-mono text-xs text-nerd-accent/80 break-all">
            {mounted ? (
              <>{window.location.origin}/overlay?session=<span className="text-nerd-warning">your-session-id</span>&source=auto&target=es</>
            ) : (
              <span className="text-nerd-muted">Loading...</span>
            )}
          </div>
          <p className="text-xs text-nerd-muted mt-3">
            Replace <code className="bg-nerd-accent/10 text-nerd-accent px-1.5 py-0.5 rounded">your-session-id</code> with the ID from your Session Manager. Session IDs are URL-safe slugs of the session name.
          </p>
        </SectionCard>

        {/* Section 7: Tips */}
        <SectionCard className="border-nerd-success/20">
          <h2 className="text-xl sm:text-2xl font-bold text-nerd-text mb-6 flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-nerd-success/20 text-nerd-success flex items-center justify-center text-sm font-bold">
              7
            </span>
            Pro Tips
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                icon: "🔒",
                title: "Use HTTPS",
                desc: "Run npm run dev:https for secure connections. Required for microphone access on some networks.",
              },
              {
                icon: "📐",
                title: "Match Resolution",
                desc: "Adjust fontsize based on your stream resolution. 48px for 1080p, 72px for 4K.",
              },
              {
                icon: "📝",
                title: "Clean Subtitles",
                desc: "Use maxlines=2 for a minimal look, maxlines=3 for more content. Default is 3.",
              },
              {
                icon: "🧪",
                title: "Test First",
                desc: "Play a YouTube video with audio before going live to verify subtitles work correctly.",
              },
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-nerd-bg/50 border border-nerd-border/50">
                <span className="text-xl flex-shrink-0">{tip.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-nerd-text">{tip.title}</p>
                  <p className="text-xs text-nerd-muted mt-1">{tip.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Footer */}
        <div className="text-center py-8 border-t border-nerd-border">
          <p className="text-sm text-nerd-muted">
            Need help?{" "}
            <a href="/" className="text-nerd-accent hover:text-nerd-accent-light transition-colors">
              Open NerdSubs
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
