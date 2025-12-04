import { NextResponse } from "next/server";
import { requireApiUserRole } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: any
) {
  const { id } = params as { id: string };
  try {
    await requireApiUserRole("admin");
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.caregiverAssignment.findUnique({
    where: { id: params.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }

  const body = await request.json();
  const { endDate, isPrimary } = body as {
    endDate?: string | null;
    isPrimary?: boolean;
  };

  const updateData: Record<string, unknown> = {};

  if (typeof isPrimary === "boolean") {
    updateData.isPrimary = isPrimary;
  }

  if (endDate !== undefined) {
    if (endDate === null) {
      updateData.endDate = null;
    } else {
      const parsed = new Date(endDate);
      if (Number.isNaN(parsed.getTime())) {
        return NextResponse.json({ error: "Invalid endDate" }, { status: 400 });
      }
      updateData.endDate = parsed;
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (isPrimary) {
        const otherPrimary = await tx.caregiverAssignment.findFirst({
          where: {
            clientId: existing.clientId,
            isPrimary: true,
            endDate: null,
            NOT: { id: existing.id },
          },
        });

        if (otherPrimary) {
          await tx.caregiverAssignment.update({
            where: { id: otherPrimary.id },
            data: { endDate: new Date() },
          });
        }
      }

      await tx.caregiverAssignment.update({
        where: { id: existing.id },
        data: updateData,
      });
    });

    return NextResponse.json({ id: existing.id });
  } catch (error) {
    console.error("Failed to update assignment", error);
    return NextResponse.json({ error: "Unable to update assignment" }, { status: 500 });
  }
}
