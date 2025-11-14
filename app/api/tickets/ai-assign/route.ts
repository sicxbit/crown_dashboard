import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSuggestedTicketAssignee } from "@/lib/aiTicketAssignment";
import { findTeamMemberById } from "@/lib/ticketAssignment";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as {
    title?: unknown;
    description?: unknown;
  } | null;

  if (!payload || typeof payload.title !== "string" || typeof payload.description !== "string") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const title = payload.title.trim();
  const description = payload.description.trim();

  if (!title || !description) {
    return NextResponse.json({ error: "Title and description are required" }, { status: 422 });
  }

  const suggestion = await getSuggestedTicketAssignee(title, description);
  const member = findTeamMemberById(suggestion.members, suggestion.assigneeId) ?? null;

  return NextResponse.json({
    assigneeId: member?.id ?? null,
    member,
    source: suggestion.source,
  });
}
