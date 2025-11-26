import { addDays, isBefore, isWithinInterval } from "date-fns";
import { NextResponse } from "next/server";
import { requireApiUserRole } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    await requireApiUserRole("admin");
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const caregivers = await prisma.caregiver.findMany({
    orderBy: { lastName: "asc" },
    include: {
      compliance: true,
    },
  });

  const today = new Date();
  const soon = addDays(today, 30);

  return NextResponse.json(
    caregivers.map((caregiver) => {
      const expired = caregiver.compliance.filter((item) => {
        if (item.status.toLowerCase() === "expired") {
          return true;
        }
        if (item.expirationDate && isBefore(item.expirationDate, today)) {
          return true;
        }
        return false;
      }).length;

      const expiringSoon = caregiver.compliance.filter((item) => {
        if (!item.expirationDate) return false;
        return isWithinInterval(item.expirationDate, { start: today, end: soon });
      }).length;

      return {
        id: caregiver.id,
        firstName: caregiver.firstName,
        lastName: caregiver.lastName,
        city: caregiver.city,
        state: caregiver.state,
        status: caregiver.status,
        employeeCode: caregiver.employeeCode,
        sandataEvvId: caregiver.sandataEvvId,
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
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

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
  } = body as {
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
        dob: parsedDob,
        phone: phone ?? null,
        email: email ?? null,
        addressLine1: addressLine1 ?? null,
        addressLine2: addressLine2 ?? null,
        city: city ?? null,
        state: state ?? null,
        zip: zip ?? null,
        sandataEvvId: sandataEvvId ?? null,
        status,
      },
    });

    // you can return just the raw caregiver, or match the GET shape
    // for now, simple is fine – the AdminDashboard doesn't depend on this body
    return NextResponse.json(caregiver, { status: 201 });
  } catch (error) {
    console.error("Failed to create caregiver", error);
    return NextResponse.json(
      { error: "Unable to create caregiver" },
      { status: 500 }
    );
  }
}
