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
  const { id } = await params; // Next 15 params promise

  try {
    await requireApiUserRole("admin");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw: unknown = await request.json().catch(() => null);
  const body = parseCaregiverPayload(raw);

  if (!body.firstName || !body.lastName || !body.status) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  let parsedDob: Date | null = null;
  if (body.dob) {
    const d = new Date(body.dob);
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json({ error: "Invalid dob" }, { status: 400 });
    }
    parsedDob = d;
  }

  const caregiver = await prisma.caregiver.update({
    where: { id },
    data: {
      employeeCode: body.employeeCode ?? null,
      firstName: body.firstName,
      lastName: body.lastName,
      dateOfBirth: parsedDob,
      phone: body.phone ?? null,
      email: body.email ?? null,
      address: body.addressLine1 ?? null,
      addressLine2: body.addressLine2 ?? null,
      city: body.city ?? null,
      state: body.state ?? null,
      zip: body.zip ?? null,
      sandataEvvId: body.sandataEvvId ?? null,
      status: body.status,
    },
  });

  return NextResponse.json({ id: caregiver.id });
}
