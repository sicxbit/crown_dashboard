import { addDays, isBefore, isWithinInterval } from "date-fns";
import { NextResponse } from "next/server";
import { requireApiUserRole } from "@/lib/auth";
import prisma from "@/lib/prisma";

type CreateCaregiverBody = {
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

function parseCreateCaregiverBody(value: unknown): CreateCaregiverBody {
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

export async function GET() {
  try {
    await requireApiUserRole("admin");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const caregivers = await prisma.caregiver.findMany({
    orderBy: { lastName: "asc" },
    include: { compliance: true },
  });

  const today = new Date();
  const soon = addDays(today, 30);

  return NextResponse.json(
    caregivers.map((caregiver) => {
      const expired = caregiver.compliance.filter((item) => {
        if (item.status.toLowerCase() === "expired") return true;
        if (item.expirationDate && isBefore(item.expirationDate, today)) return true;
        return false;
      }).length;

      const expiringSoon = caregiver.compliance.filter((item) => {
        if (!item.expirationDate) return false;
        return isWithinInterval(item.expirationDate, { start: today, end: soon });
      }).length;

      return {
        id: caregiver.id,
        employeeCode: caregiver.employeeCode,
        firstName: caregiver.firstName,
        lastName: caregiver.lastName,
        dob: caregiver.dateOfBirth ? caregiver.dateOfBirth.toISOString() : null,
        phone: caregiver.phone,
        email: caregiver.email,
        addressLine1: caregiver.address,
        addressLine2: caregiver.addressLine2,
        city: caregiver.city,
        state: caregiver.state,
        zip: caregiver.zip,
        sandataEvvId: caregiver.sandataEvvId,
        status: caregiver.status,
        complianceSummary: expired
          ? `${expired} expired${expiringSoon ? ` / ${expiringSoon} expiring soon` : ""}`
          : expiringSoon
          ? `${expiringSoon} expiring soon`
          : "All valid",
      };
    })
  );
}

export async function POST(request: Request) {
  try {
    await requireApiUserRole("admin");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw: unknown = await request.json().catch(() => null);
  const {
    employeeCode,
    firstName,
    lastName,
    dob,
    phone,
    email,
    addressLine1,
    addressLine2,
    city,
    state,
    zip,
    sandataEvvId,
    status,
  } = parseCreateCaregiverBody(raw);

  if (!firstName || !lastName || !status) {
    return NextResponse.json(
      { error: "firstName, lastName and status are required" },
      { status: 400 }
    );
  }

  let parsedDob: Date | null = null;
  if (dob) {
    const d = new Date(dob);
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json({ error: "Invalid dob" }, { status: 400 });
    }
    parsedDob = d;
  }

  try {
    const caregiver = await prisma.caregiver.create({
      data: {
        employeeCode: employeeCode ?? null,
        firstName,
        lastName,
        dateOfBirth: parsedDob,
        phone: phone ?? null,
        email: email ?? null,
        address: addressLine1 ?? null,
        addressLine2: addressLine2 ?? null,
        city: city ?? null,
        state: state ?? null,
        zip: zip ?? null,
        sandataEvvId: sandataEvvId ?? null,
        status,
      },
    });

    // Return a consistent shape (optional but nice)
    return NextResponse.json(
      {
        id: caregiver.id,
        employeeCode: caregiver.employeeCode,
        firstName: caregiver.firstName,
        lastName: caregiver.lastName,
        dob: caregiver.dateOfBirth ? caregiver.dateOfBirth.toISOString() : null,
        phone: caregiver.phone,
        email: caregiver.email,
        addressLine1: caregiver.address,
        addressLine2: caregiver.addressLine2,
        city: caregiver.city,
        state: caregiver.state,
        zip: caregiver.zip,
        sandataEvvId: caregiver.sandataEvvId,
        status: caregiver.status,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Failed to create caregiver", error);
    return NextResponse.json({ error: "Unable to create caregiver" }, { status: 500 });
  }
}
