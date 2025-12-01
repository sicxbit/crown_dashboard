import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { serializeTicket, serializeTickets, TicketPriority } from "@/lib/tickets";
import { routeTicket } from "@/lib/ticketRouting";

const VALID_PRIORITIES: TicketPriority[] = ["low", "medium", "high"];

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const where = user.role === "admin" ? {} : { createdByUserId: user.id };
  const tickets = await prisma.ticket.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: {
        include: { caregiver: true },
      },
    },
  });

  return NextResponse.json({ tickets: serializeTickets(tickets) });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as {
    title?: unknown;
    description?: unknown;
    priority?: unknown;
  } | null;

  if (!payload || typeof payload.title !== "string" || typeof payload.description !== "string") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const title = payload.title.trim();
  const description = payload.description.trim();
  const priorityValue = typeof payload.priority === "string" ? payload.priority : "medium";

  if (title.length === 0 || description.length === 0) {
    return NextResponse.json({ error: "Title and description are required" }, { status: 422 });
  }

  if (!VALID_PRIORITIES.includes(priorityValue as TicketPriority)) {
    return NextResponse.json({ error: "Invalid priority" }, { status: 422 });
  }

  const routing = await routeTicket(title, description);

  const ticket = await prisma.ticket.create({
    data: {
      title,
      description,
      priority: priorityValue as TicketPriority,
      createdByUserId: user.id,
      assignedTo: routing.assignee,
      assignedReason: routing.reason,
      category: routing.category,
    },
    include: {
      createdBy: { include: { caregiver: true } },
    },
  });

  return NextResponse.json({ ticket: serializeTicket(ticket), source: routing.source }, { status: 201 });
}
