import { NextResponse } from "next/server";
import { requireApiUserRole } from "@/lib/auth";
import prisma from "@/lib/prisma";

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

export async function POST(
  request: Request,
   { params }: { params: Record<string, string> }
) {
  try {
    await requireApiUserRole("admin");
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as CaregiverPayload;

    if (!body.firstName || !body.lastName || !body.status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const data = {
      employeeCode: body.employeeCode,
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
      sandataEvvId: body.sandataEvvId,
      status: body.status,
    } as const;

    const caregiver = await prisma.caregiver.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json({ id: caregiver.id });
  } catch (error) {
    console.error("Failed to update caregiver", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
