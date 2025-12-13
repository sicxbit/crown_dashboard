import { NextResponse } from "next/server";
import { requireApiUserRole } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    await requireApiUserRole("admin");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  if (!clientId || !start || !end) {
    return NextResponse.json({ error: "Missing required params" }, { status: 400 });
  }

  const startDate = new Date(start);
  const endDate = new Date(end);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
  }

  try {
    const visits = await prisma.visitLog.findMany({
      where: {
        clientId,
        scheduledStart: {
          not: null,
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        caregiver: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: { scheduledStart: "asc" },
    });

    return NextResponse.json({
      visits: visits.map((visit) => ({
        id: visit.id,
        caregiverName: `${visit.caregiver.firstName} ${visit.caregiver.lastName}`,
        scheduledStart: visit.scheduledStart,
        scheduledEnd: visit.scheduledEnd,
        serviceCode: visit.serviceCode,
      })),
    });
  } catch (error: unknown) {
    console.error("Failed to load scheduled visits", error);
    return NextResponse.json({ error: "Unable to load scheduled visits" }, { status: 500 });
  }
}
