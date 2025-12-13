import { NextResponse } from "next/server";
import { requireApiUserRole } from "@/lib/auth";
import prisma from "@/lib/prisma";

type CaregiverRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type CaregiverPayload = {
  employeeCode?: string | null;
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
  sandataEvvId?: string | null;
  status?: string;
};

function parseCaregiverPayload(value: unknown): CaregiverPayload {
  if (!value || typeof value !== "object") return {};
  const obj = value as Record<string, unknown>;

  const getNullableString = (v: unknown): string | null | undefined =>
    v === null ? null : typeof v === "string" ? v : undefined;

  return {
    employeeCode: getNullableString(obj.employeeCode),
    firstName: typeof obj.firstName === "string" ? obj.firstName : undefined,
    lastName: typeof obj.lastName === "string" ? obj.lastName : undefined,
    dob: getNullableString(obj.dob),
    phone: getNullableString(obj.phone),
    email: getNullableString(obj.email),
    addressLine1: getNullableString(obj.addressLine1),
    addressLine2: getNullableString(obj.addressLine2),
    city: getNullableString(obj.city),
    state: getNullableString(obj.state),
    zip: getNullableString(obj.zip),
    sandataEvvId: getNullableString(obj.sandataEvvId),
    status: typeof obj.status === "string" ? obj.status : undefined,
  };
}

export async function POST(request: Request, { params }: CaregiverRouteContext) {
  const { id } = await params;

  try {
    await requireApiUserRole("admin");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw: unknown = await request.json().catch(() => null);
  const body = parseCaregiverPayload(raw);

  const data: Record<string, any> = {};

  if (body.employeeCode !== undefined) data.employeeCode = body.employeeCode;
  if (body.firstName !== undefined) data.firstName = body.firstName;
  if (body.lastName !== undefined) data.lastName = body.lastName;
  if (body.phone !== undefined) data.phone = body.phone;
  if (body.email !== undefined) data.email = body.email;
  if (body.addressLine1 !== undefined) data.address = body.addressLine1;
  if (body.addressLine2 !== undefined) data.addressLine2 = body.addressLine2;
  if (body.city !== undefined) data.city = body.city;
  if (body.state !== undefined) data.state = body.state;
  if (body.zip !== undefined) data.zip = body.zip;
  if (body.sandataEvvId !== undefined) data.sandataEvvId = body.sandataEvvId;

  if (body.dob !== undefined) {
    if (body.dob === null || body.dob === "") {
      data.dateOfBirth = null;
    } else {
      const d = new Date(body.dob);
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json({ error: "Invalid dob" }, { status: 400 });
      }
      data.dateOfBirth = d;
    }
  }

  if (body.status !== undefined) {
    data.status = body.status;
    data.isActive = body.status.toLowerCase() === "active";
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const caregiver = await prisma.caregiver.update({
    where: { id },
    data,
  });

  return NextResponse.json({ id: caregiver.id });
}

export async function DELETE(request: Request, { params }: CaregiverRouteContext) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Missing caregiver id" }, { status: 400 });
  }

  try {
    await requireApiUserRole("admin");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const purge = url.searchParams.get("purge") === "1";

  // Default behavior: archive (soft delete)
  if (!purge) {
    try {
      const caregiver = await prisma.caregiver.update({
        where: { id },
        data: { status: "inactive", isActive: false },
      });

      return NextResponse.json({ id: caregiver.id });
    } catch (error: unknown) {
      console.error("Failed to archive caregiver", error);
      return NextResponse.json({ error: "Unable to archive caregiver" }, { status: 500 });
    }
  }

  // Purge behavior: permanent delete (safe-mode: refuse if dependencies exist)
  try {
    const caregiver = await prisma.caregiver.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!caregiver) {
      return NextResponse.json({ error: "Caregiver not found" }, { status: 404 });
    }

    if (caregiver.status.toLowerCase() !== "inactive") {
      return NextResponse.json({ error: "Only archived caregivers can be deleted permanently" }, { status: 400 });
    }

    const [
      assignments,
      compliance,
      training,
      visitLogs,
      incidents,
      scheduleRules,
      linkedUsers,
    ] = await Promise.all([
      prisma.caregiverAssignment.count({ where: { caregiverId: id } }),
      prisma.complianceItem.count({ where: { caregiverId: id } }),
      prisma.trainingRecord.count({ where: { caregiverId: id } }),
      prisma.visitLog.count({ where: { caregiverId: id } }),
      prisma.incident.count({ where: { caregiverId: id } }),
      prisma.scheduleRule.count({ where: { caregiverId: id } }),
      prisma.user.count({ where: { caregiverId: id } }),
    ]);

    const blockers: string[] = [];
    if (linkedUsers > 0) blockers.push("linked user account");
    if (assignments > 0) blockers.push("assignments");
    if (scheduleRules > 0) blockers.push("schedule rules");
    if (visitLogs > 0) blockers.push("visit logs");
    if (incidents > 0) blockers.push("incidents");
    if (compliance > 0) blockers.push("compliance items");
    if (training > 0) blockers.push("training records");

    if (blockers.length > 0) {
      return NextResponse.json(
        { error: `Cannot delete permanently. Remove related data first: ${blockers.join(", ")}.` },
        { status: 400 }
      );
    }

    await prisma.caregiver.delete({ where: { id } });
    return NextResponse.json({ id });
  } catch (error: unknown) {
    console.error("Failed to purge caregiver", error);
    return NextResponse.json({ error: "Unable to delete caregiver permanently" }, { status: 500 });
  }
}
