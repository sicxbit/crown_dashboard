import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { serializeTicket, TicketPriority, TicketStatus } from "@/lib/tickets";

const VALID_STATUS: TicketStatus[] = ["open", "in_progress", "resolved"];
const VALID_PRIORITIES: TicketPriority[] = ["low", "medium", "high"];

type PatchPayload = {
  status?: unknown;
  assigneeUserId?: unknown;
  priority?: unknown;
};

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id },
    include: {
      createdBy: { include: { caregiver: true } },
      assignee: { include: { caregiver: true } },
    },
  });

  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  if (user.role !== "admin" && ticket.createdByUserId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ ticket: serializeTicket(ticket) });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as PatchPayload | null;
  if (!payload) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const data: {
    status?: TicketStatus;
    assigneeUserId?: string | null;
    priority?: TicketPriority;
  } = {};

  if (payload.status !== undefined) {
    if (typeof payload.status !== "string" || !VALID_STATUS.includes(payload.status as TicketStatus)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 422 });
    }
    data.status = payload.status as TicketStatus;
  }

  if (payload.priority !== undefined) {
    if (typeof payload.priority !== "string" || !VALID_PRIORITIES.includes(payload.priority as TicketPriority)) {
      return NextResponse.json({ error: "Invalid priority" }, { status: 422 });
    }
    data.priority = payload.priority as TicketPriority;
  }

  if (payload.assigneeUserId !== undefined) {
    if (payload.assigneeUserId === null) {
      data.assigneeUserId = null;
    } else if (typeof payload.assigneeUserId === "string") {
      const targetUser = await prisma.user.findUnique({ where: { id: payload.assigneeUserId } });
      if (!targetUser) {
        return NextResponse.json({ error: "Assignee not found" }, { status: 404 });
      }
      data.assigneeUserId = targetUser.id;
    } else {
      return NextResponse.json({ error: "Invalid assignee" }, { status: 422 });
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No updates supplied" }, { status: 400 });
  }

  try {
    const ticket = await prisma.ticket.update({
      where: { id: params.id },
      data,
      include: {
        createdBy: { include: { caregiver: true } },
        assignee: { include: { caregiver: true } },
      },
    });

    return NextResponse.json({ ticket: serializeTicket(ticket) });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }
    console.error("Failed to update ticket", error);
    return NextResponse.json({ error: "Unable to update ticket" }, { status: 500 });
  }
}
