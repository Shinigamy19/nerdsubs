import { NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/gemini";
import { updateSessionStats } from "@/lib/stats";
import { addCaption } from "@/lib/captionStore";

interface TranscribeRequest {
  audio: string;
  sessionId: string;
  mode: "transcribe" | "translate";
  mimeType?: string;
  apiKey?: string;
  model?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
}

export async function POST(request: Request) {
  let sessionId: string | undefined;

  try {
    const body: TranscribeRequest = await request.json();

    const {
      audio,
      mode,
      mimeType = "audio/webm;codecs=opus",
      apiKey,
      model,
      sourceLanguage = "auto",
      targetLanguage = "es",
    } = body;

    sessionId = body.sessionId;

    if (!audio) {
      return NextResponse.json(
        { error: "Audio data is required" },
        { status: 400 }
      );
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    const text = await transcribeAudio({
      audioBase64: audio,
      mimeType,
      mode,
      apiKey,
      sourceLanguage,
      targetLanguage,
    });

    const latency = Date.now() - startTime;

    updateSessionStats(sessionId, latency, true);

    // Store caption for audience view
    addCaption(sessionId, text, true);

    return NextResponse.json({
      text,
      timestamp: Date.now(),
      latency,
      sessionId,
      mode,
    });
  } catch (error) {
    console.error("Transcription error:", error);

    // Track the failed request for stats
    if (sessionId) {
      try {
        updateSessionStats(sessionId, 0, false);
      } catch {
        // Ignore stats update errors
      }
    }

    const message =
      error instanceof Error ? error.message : "Internal server error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
