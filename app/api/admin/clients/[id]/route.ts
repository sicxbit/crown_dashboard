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

export async function POST(
  request: Request,
  { params }: ClientRouteContext
) {
  const { id } = await params; // 👈 key change: await params

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
