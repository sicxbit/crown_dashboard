import { addDays, endOfDay, startOfDay, startOfWeek } from "date-fns";
import { NextResponse } from "next/server";

import { requireApiUserRole } from "@/lib/auth";
import prisma from "@/lib/prisma";

type ScheduleVisit = {
  id: string;
  caregiverId: string;
  caregiverName: string;
  clientId: string;
  clientName: string;
  scheduledStart: string;
  scheduledEnd: string;
  serviceCode: string | null;
};

export async function GET(request: Request) {
  try {
    await requireApiUserRole("admin");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const weekStartParam = searchParams.get("weekStart");
  const dayIndexParam = searchParams.get("dayIndex");
  const caregiverId = searchParams.get("caregiverId");
  const clientId = searchParams.get("clientId");

  if (!weekStartParam || dayIndexParam === null) {
    return NextResponse.json({ error: "Missing required params" }, { status: 400 });
  }

  const weekStartDate = startOfWeek(new Date(weekStartParam), { weekStartsOn: 1 });
  const dayIndex = Number(dayIndexParam);

  if (Number.isNaN(weekStartDate.getTime()) || Number.isNaN(dayIndex) || dayIndex < 0 || dayIndex > 6) {
    return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
  }

  const dayDate = addDays(weekStartDate, dayIndex);
  const dayStart = startOfDay(dayDate);
  const dayEnd = endOfDay(dayDate);

  try {
    const visits = await prisma.visitLog.findMany({
      where: {
        ...(clientId ? { clientId } : {}),
        ...(caregiverId ? { caregiverId } : {}),
        scheduledStart: {
          not: null,
          lt: dayEnd,
        },
        scheduledEnd: {
          not: null,
          gt: dayStart,
        },
      },
      include: {
        caregiver: {
          select: { firstName: true, lastName: true },
        },
        client: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: { scheduledStart: "asc" },
    });

    const payload: ScheduleVisit[] = visits.flatMap((visit) => {
      if (!visit.scheduledStart || !visit.scheduledEnd) {
        return [];
      }

      const mappedVisit: ScheduleVisit = {
        id: visit.id,
        caregiverId: visit.caregiverId,
        caregiverName: `${visit.caregiver.firstName} ${visit.caregiver.lastName}`,
        clientId: visit.clientId,
        clientName: `${visit.client.firstName} ${visit.client.lastName}`,
        scheduledStart: visit.scheduledStart.toISOString(),
        scheduledEnd: visit.scheduledEnd.toISOString(),
        serviceCode: visit.serviceCode,
      };

      return [mappedVisit];
    });

    return NextResponse.json({ visits: payload });
  } catch (error: unknown) {
    console.error("Failed to load scheduled visits", error);
    return NextResponse.json({ error: "Unable to load scheduled visits" }, { status: 500 });
  }
}
