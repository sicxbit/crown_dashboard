import { NextResponse } from "next/server";
import { requireApiUserRole } from "@/lib/auth";
import prisma from "@/lib/prisma";

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

function parseClientPayload(value: unknown): ClientPayload {
  if (!value || typeof value !== "object") return {};
  const obj = value as Record<string, unknown>;

  const getNullableString = (v: unknown): string | null | undefined =>
    v === null ? null : typeof v === "string" ? v : undefined;

  return {
    code: typeof obj.code === "string" ? obj.code : undefined,
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
    emergencyName: getNullableString(obj.emergencyName),
    emergencyPhone: getNullableString(obj.emergencyPhone),
    primaryInsurance: getNullableString(obj.primaryInsurance),
    insuranceMemberId: getNullableString(obj.insuranceMemberId),
    referralId: getNullableString(obj.referralId),
    assessmentDate: getNullableString(obj.assessmentDate),
    riskLevel: getNullableString(obj.riskLevel),
    status: typeof obj.status === "string" ? obj.status : undefined,
    notes: getNullableString(obj.notes),
  };
}

type ParsedOptionalDate =
  | { ok: true; value: Date | null | undefined }
  | { ok: false; error: string };

function parseOptionalDate(
  value: string | null | undefined,
  fieldName: string
): ParsedOptionalDate {
  if (value === undefined) return { ok: true, value: undefined };
  if (value === null || value === "") return { ok: true, value: null };

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return { ok: false, error: `Invalid ${fieldName}` };
  }
  return { ok: true, value: d };
}

export async function GET() {
  try {
    await requireApiUserRole("admin");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clients = await prisma.client.findMany({
    orderBy: { lastName: "asc" },
    include: {
      referral: { select: { id: true, source: true } },
      assignments: {
        where: { isPrimary: true, endDate: null },
        select: {
          caregiver: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      },
    },
  });

  const referrals = await prisma.referral.findMany({
    select: { id: true, source: true },
    orderBy: { source: "asc" },
  });

  return NextResponse.json({
    clients: clients.map((client) => ({
      id: client.id,
      code: client.code,
      firstName: client.firstName,
      lastName: client.lastName,
      dob: client.dob ? client.dob.toISOString() : null,
      phone: client.phone,
      email: client.email,
      addressLine1: client.addressLine1,
      addressLine2: client.addressLine2,
      city: client.city,
      state: client.state,
      zip: client.zip,
      emergencyName: client.emergencyName,
      emergencyPhone: client.emergencyPhone,
      primaryInsurance: client.primaryInsurance,
      insuranceMemberId: client.insuranceMemberId,
      referralId: client.referralId,
      referralSource: client.referral?.source ?? null,
      assessmentDate: client.assessmentDate ? client.assessmentDate.toISOString() : null,
      riskLevel: client.riskLevel,
      status: client.status,
      notes: client.notes,
      primaryCaregiver: client.assignments[0]?.caregiver
        ? `${client.assignments[0].caregiver.firstName} ${client.assignments[0].caregiver.lastName}`
        : null,
    })),
    referrals,
  });
}

export async function POST(request: Request) {
  try {
    await requireApiUserRole("admin");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw: unknown = await request.json().catch(() => null);
  const body = parseClientPayload(raw);

  if (!body.firstName || !body.lastName || !body.status || !body.code) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const parsedDob = parseOptionalDate(body.dob, "dob");
  if (!parsedDob.ok) {
    return NextResponse.json({ error: parsedDob.error }, { status: 400 });
  }

  const parsedAssessmentDate = parseOptionalDate(body.assessmentDate, "assessmentDate");
  if (!parsedAssessmentDate.ok) {
    return NextResponse.json({ error: parsedAssessmentDate.error }, { status: 400 });
  }

  try {
    const client = await prisma.client.create({
      data: {
        code: body.code,
        firstName: body.firstName,
        lastName: body.lastName,
        dob: parsedDob.value ?? null,
        phone: body.phone ?? null,
        email: body.email ?? null,
        addressLine1: body.addressLine1 ?? null,
        addressLine2: body.addressLine2 ?? null,
        city: body.city ?? null,
        state: body.state ?? null,
        zip: body.zip ?? null,
        emergencyName: body.emergencyName ?? null,
        emergencyPhone: body.emergencyPhone ?? null,
        primaryInsurance: body.primaryInsurance ?? null,
        insuranceMemberId: body.insuranceMemberId ?? null,
        referralId: body.referralId ?? null,
        assessmentDate: parsedAssessmentDate.value ?? null,
        riskLevel: body.riskLevel ?? null,
        status: body.status,
        notes: body.notes ?? null,
      },
    });

    return NextResponse.json({ id: client.id }, { status: 201 });
  } catch (error: unknown) {
    console.error("Failed to create client", error);
    return NextResponse.json({ error: "Unable to create client" }, { status: 500 });
  }
}
