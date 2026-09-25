import { NextResponse } from "next/server";
import { getCaptions } from "@/lib/captionStore";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const data = getCaptions(id);
  return NextResponse.json(data);
}
