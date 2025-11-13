import { NextResponse } from "next/server";
import { requireApiUserRole } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    await requireApiUserRole("admin");
  } catch (error) {
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
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
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
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { clientId, caregiverId, startDate, endDate, isPrimary, notes } = body as {
    clientId?: string;
    caregiverId?: string;
    startDate?: string;
    endDate?: string | null;
    isPrimary?: boolean;
    notes?: string | null;
  };

  if (!clientId || !caregiverId || !startDate) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) {
    return NextResponse.json({ error: "Invalid startDate" }, { status: 400 });
  }

  const end = endDate ? new Date(endDate) : null;
  if (endDate && Number.isNaN(end!.getTime())) {
    return NextResponse.json({ error: "Invalid endDate" }, { status: 400 });
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
  } catch (error) {
    console.error("Failed to create assignment", error);
    return NextResponse.json({ error: "Unable to create assignment" }, { status: 500 });
  }
}
