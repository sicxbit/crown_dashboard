import { NextResponse } from "next/server";
import { requireApiUserRole } from "@/lib/auth";
import prisma from "@/lib/prisma";

type AssignmentRouteContext = {
  params: Promise<{
    id: string; // from [id]
  }>;
};

type PatchAssignmentBody = {
  endDate?: string | null;
  isPrimary?: boolean;
};

function parsePatchAssignmentBody(value: unknown): PatchAssignmentBody {
  if (!value || typeof value !== "object") return {};
  const obj = value as Record<string, unknown>;

  return {
    endDate:
      obj.endDate === null
        ? null
        : typeof obj.endDate === "string"
        ? obj.endDate
        : undefined,
    isPrimary: typeof obj.isPrimary === "boolean" ? obj.isPrimary : undefined,
  };
}

// ---------- PATCH: update caregiverAssignment by id ----------
export async function PATCH(request: Request, { params }: AssignmentRouteContext) {
  const { id } = await params; // Next 15 params Promise

  if (!id) {
    return NextResponse.json({ error: "Missing assignment id" }, { status: 400 });
  }

  try {
    await requireApiUserRole("admin");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.caregiverAssignment.findUnique({
    where: { id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }

  const raw: unknown = await request.json().catch(() => null);
  const { endDate, isPrimary } = parsePatchAssignmentBody(raw);

  // Build Prisma update object with correct types
  const updateData: {
    endDate?: Date | null;
    isPrimary?: boolean;
  } = {};

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
      // If making this assignment primary, end any other primary assignment
      if (isPrimary === true) {
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
  } catch (error: unknown) {
    console.error("Failed to update assignment", error);
    return NextResponse.json({ error: "Unable to update assignment" }, { status: 500 });
  }
}
