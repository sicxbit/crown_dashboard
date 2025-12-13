import { NextResponse } from "next/server";
import { requireApiUserRole } from "@/lib/auth";
import prisma from "@/lib/prisma";

type ClientRouteContext = {
  params: Promise<{
    id: string;
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

type ParsedNullableDate =
  | { ok: true; value: Date | null | undefined }
  | { ok: false; error: string };

function parseNullableDate(value: string | null | undefined, fieldName: string): ParsedNullableDate {
  if (value === undefined) return { ok: true, value: undefined };
  if (value === null || value === "") return { ok: true, value: null };

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return { ok: false, error: `Invalid ${fieldName}` };
  }

  return { ok: true, value: d };
}

export async function POST(request: Request, { params }: ClientRouteContext) {
  const { id } = await params; // Next 15 params promise

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

  const parsedDob = parseNullableDate(body.dob, "dob");
  if (!parsedDob.ok) {
    return NextResponse.json({ error: parsedDob.error }, { status: 400 });
  }

  const parsedAssessment = parseNullableDate(body.assessmentDate, "assessmentDate");
  if (!parsedAssessment.ok) {
    return NextResponse.json({ error: parsedAssessment.error }, { status: 400 });
  }

  const client = await prisma.client.update({
    where: { id },
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
      assessmentDate: parsedAssessment.value ?? null,
      riskLevel: body.riskLevel ?? null,
      status: body.status,
      notes: body.notes ?? null,
    },
  });

  return NextResponse.json({ id: client.id });
}

export async function DELETE(_request: Request, { params }: ClientRouteContext) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Missing client id" }, { status: 400 });
  }

  try {
    await requireApiUserRole("admin");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const client = await prisma.client.update({
      where: { id },
      data: { status: "inactive" },
    });

    return NextResponse.json({ id: client.id });
  } catch (error: unknown) {
    console.error("Failed to archive client", error);
    return NextResponse.json({ error: "Unable to archive client" }, { status: 500 });
  }
}
