import { NextResponse } from "next/server";
import { requireApiUserRole } from "@/lib/auth";
import prisma from "@/lib/prisma";

type CreateAssignmentBody = {
  clientId?: string;
  caregiverId?: string;
  startDate?: string;
  endDate?: string | null;
  isPrimary?: boolean;
  notes?: string | null;
};

function parseCreateAssignmentBody(value: unknown): CreateAssignmentBody {
  if (!value || typeof value !== "object") return {};
  const obj = value as Record<string, unknown>;

  return {
    clientId: typeof obj.clientId === "string" ? obj.clientId : undefined,
    caregiverId: typeof obj.caregiverId === "string" ? obj.caregiverId : undefined,
    startDate: typeof obj.startDate === "string" ? obj.startDate : undefined,
    endDate: obj.endDate === null ? null : typeof obj.endDate === "string" ? obj.endDate : undefined,
    isPrimary: typeof obj.isPrimary === "boolean" ? obj.isPrimary : undefined,
    notes: obj.notes === null ? null : typeof obj.notes === "string" ? obj.notes : undefined,
  };
}

export async function GET(request: Request) {
  try {
    await requireApiUserRole("admin");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");

  if (!clientId) {
    return NextResponse.json({ error: "Missing clientId" }, { status: 400 });
  }

  const assignments = await prisma.caregiverAssignment.findMany({
    where: { clientId },
    include: {
      caregiver: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
    orderBy: [{ endDate: "asc" }, { startDate: "desc" }],
  });

  return NextResponse.json({
    assignments: assignments.map((assignment) => ({
      id: assignment.id,
      caregiverId: assignment.caregiverId,
      caregiverName: `${assignment.caregiver.firstName} ${assignment.caregiver.lastName}`,
      startDate: assignment.startDate,
      endDate: assignment.endDate,
      isPrimary: assignment.isPrimary,
      notes: assignment.notes,
    })),
  });
}

export async function POST(request: Request) {
  try {
    await requireApiUserRole("admin");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw: unknown = await request.json().catch(() => null);
  const { clientId, caregiverId, startDate, endDate, isPrimary, notes } =
    parseCreateAssignmentBody(raw);

  if (!clientId || !caregiverId || !startDate) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) {
    return NextResponse.json({ error: "Invalid startDate" }, { status: 400 });
  }

  let end: Date | null = null;
  if (endDate) {
    const parsedEnd = new Date(endDate);
    if (Number.isNaN(parsedEnd.getTime())) {
      return NextResponse.json({ error: "Invalid endDate" }, { status: 400 });
    }
    end = parsedEnd;
  }

  try {
    const assignment = await prisma.$transaction(async (tx) => {
      if (isPrimary) {
        const existingPrimary = await tx.caregiverAssignment.findFirst({
          where: { clientId, isPrimary: true, endDate: null },
        });

        if (existingPrimary) {
          await tx.caregiverAssignment.update({
            where: { id: existingPrimary.id },
            data: { endDate: start },
          });
        }
      }

      return tx.caregiverAssignment.create({
        data: {
          clientId,
          caregiverId,
          startDate: start,
          endDate: end,
          isPrimary: Boolean(isPrimary),
          notes: notes ?? null,
        },
      });
    });

    return NextResponse.json({ id: assignment.id });
  } catch (error: unknown) {
    console.error("Failed to create assignment", error);
    return NextResponse.json({ error: "Unable to create assignment" }, { status: 500 });
  }
}
