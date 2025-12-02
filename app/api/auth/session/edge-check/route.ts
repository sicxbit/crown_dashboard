import { NextResponse } from "next/server";

export const runtime = "edge";  // must run on Edge
export const dynamic = "force-static";

// Only checks for cookie presence — no Prisma, no Firebase
export async function GET(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const hasSession = cookieHeader.includes("session=");

  if (!hasSession) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
