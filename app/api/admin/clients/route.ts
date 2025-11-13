import { NextResponse } from "next/server";
import { requireApiUserRole } from "@/lib/auth";
import prisma from "@/lib/prisma";

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
