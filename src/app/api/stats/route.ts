import { NextResponse } from "next/server";
import { getAllStats, getSessionStats } from "@/lib/stats";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session");

  if (sessionId) {
    const session = getSessionStats(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: `Session "${sessionId}" not found` },
        { status: 404 }
      );
    }
    return NextResponse.json(session);
  }

  return NextResponse.json(getAllStats());
}
