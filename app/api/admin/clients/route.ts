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

export async function GET() {
  try {
    await requireApiUserRole("admin");
  } catch (error) {
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
      city: client.city,
      state: client.state,
      status: client.status,
      riskLevel: client.riskLevel,
      referralId: client.referralId,
      referralSource: client.referral?.source ?? null,
      primaryCaregiver: client.assignments[0]?.caregiver
        ? `${client.assignments[0]?.caregiver.firstName} ${client.assignments[0]?.caregiver.lastName}`
        : null,
    })),
    referrals,
  });
}

export async function POST(request: Request) {
  try {
    await requireApiUserRole("admin");
  } catch (error) {
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
    assessmentDate: body.assessmentDate ? new Date(body.assessmentDate) : null,
    riskLevel: body.riskLevel ?? null,
    status: body.status,
    notes: body.notes ?? null,
  } as const;

  try {
    const client = await prisma.client.create({ data });

    // AdminDashboard doesn't actually use this body, but returning id is nice
    return NextResponse.json({ id: client.id }, { status: 201 });
  } catch (error) {
    console.error("Failed to create client", error);
    return NextResponse.json(
      { error: "Unable to create client" },
      { status: 500 }
    );
  }
}
