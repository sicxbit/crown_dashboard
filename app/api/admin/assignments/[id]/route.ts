import { NextResponse } from "next/server";
import { requireApiUserRole } from "@/lib/auth";
import prisma from "@/lib/prisma";

type AssignmentRouteContext = {
  params: Promise<{
    id: string; // from [id]
  }>;
};

type ClientPayload = {
  code?: string;
  firstName?: string;
  lastName?: string;
  dob?: string | null;
  phone?: string | null;
  email?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  emergencyName?: string | null;
  emergencyPhone?: string | null;
  primaryInsurance?: string | null;
  insuranceMemberId?: string | null;
  referralId?: string | null;
  assessmentDate?: string | null;
  riskLevel?: string | null;
  status?: string;
  notes?: string | null;
};

// ---------- POST: update client by id ----------
export async function POST(
  request: Request,
  { params }: AssignmentRouteContext
) {
  const { id } = await params; // 👈 await params (Next 15)

  try {
    await requireApiUserRole("admin");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as ClientPayload;

  if (!body.firstName || !body.lastName || !body.status || !body.code) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const data = {
    code: body.code,
    firstName: body.firstName,
    lastName: body.lastName,
    dob: body.dob ? new Date(body.dob) : null,
    phone: body.phone,
    email: body.email,
    addressLine1: body.addressLine1,
    addressLine2: body.addressLine2,
    city: body.city,
    state: body.state,
    zip: body.zip,
    emergencyName: body.emergencyName,
    emergencyPhone: body.emergencyPhone,
    primaryInsurance: body.primaryInsurance,
    insuranceMemberId: body.insuranceMemberId,
    referralId: body.referralId,
    assessmentDate: body.assessmentDate
      ? new Date(body.assessmentDate)
      : null,
    riskLevel: body.riskLevel,
    status: body.status,
    notes: body.notes,
  } as const;

  const client = await prisma.client.update({
    where: { id },
    data,
  });

  return NextResponse.json({ id: client.id });
}

// ---------- PATCH: update caregiverAssignment by id ----------
export async function PATCH(
  request: Request,
  { params }: AssignmentRouteContext
) {
  const { id } = await params; // 👈 await params (Next 15)

  if (!id) {
    return NextResponse.json(
      { error: "Missing assignment id" },
      { status: 400 }
    );
  }

  try {
    await requireApiUserRole("admin");
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.caregiverAssignment.findUnique({
    where: { id },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Assignment not found" },
      { status: 404 }
    );
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
        return NextResponse.json(
          { error: "Invalid endDate" },
          { status: 400 }
        );
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
    return NextResponse.json(
      { error: "Unable to update assignment" },
      { status: 500 }
    );
  }
}
