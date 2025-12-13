import { addDays, addMinutes, endOfDay, startOfDay, startOfWeek } from "date-fns";
import { NextResponse } from "next/server";

import { requireApiUserRole } from "@/lib/auth";
import prisma from "@/lib/prisma";

type ScheduleRuleEvent = {
  id: string;
  clientId: string;
  clientName: string;
  caregiverId: string;
  caregiverName: string;
  scheduledStart: string;
  scheduledEnd: string;
  serviceCode: string | null;
  notes: string | null;
};

type CreateScheduleRuleBody = {
  clientId?: unknown;
  caregiverId?: unknown;
  dayOfWeek?: unknown;
  startTime?: unknown;
  endTime?: unknown;
  effectiveStartDate?: unknown;
  effectiveEndDate?: unknown;
  serviceCode?: unknown;
  notes?: unknown;
};

function parseTimeToMinutes(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const [hourPart, minutePart] = value.split(":");
  const hours = Number.parseInt(hourPart, 10);
  const minutes = Number.parseInt(minutePart, 10);
  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }
  return hours * 60 + minutes;
}

function parseDateOnly(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function buildPersonName(firstName: string, middleName: string | null, lastName: string): string {
  return [firstName, middleName, lastName]
    .filter((part) => !!part && part.trim().length > 0)
    .join(" ");
}

export async function GET(request: Request) {
  try {
    await requireApiUserRole("admin");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const weekStartParam = searchParams.get("weekStart");
  const dayIndexParam = searchParams.get("dayIndex");
  const clientId = searchParams.get("clientId");
  const caregiverId = searchParams.get("caregiverId");

  if (!weekStartParam || dayIndexParam === null) {
    return NextResponse.json({ error: "Missing required params" }, { status: 400 });
  }

  const weekStartDate = startOfWeek(new Date(weekStartParam), { weekStartsOn: 1 });
  const dayIndex = Number.parseInt(dayIndexParam, 10);

  if (
    Number.isNaN(weekStartDate.getTime()) ||
    Number.isNaN(dayIndex) ||
    dayIndex < 0 ||
    dayIndex > 6
  ) {
    return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
  }

  const dayDate = addDays(weekStartDate, dayIndex);
  const dayStart = startOfDay(dayDate);
  const dayEnd = endOfDay(dayDate);
  const dayOfWeek = dayStart.getDay();

  try {
    const rules = await prisma.scheduleRule.findMany({
      where: {
        dayOfWeek,
        effectiveStartDate: { lte: dayEnd },
        OR: [{ effectiveEndDate: null }, { effectiveEndDate: { gte: dayStart } }],
        ...(clientId ? { clientId } : {}),
        ...(caregiverId ? { caregiverId } : {}),
      },
      include: {
        client: { select: { firstName: true, lastName: true } },
        caregiver: { select: { firstName: true, middleName: true, lastName: true } },
      },
      orderBy: { startTimeMinutes: "asc" },
    });

    const events: ScheduleRuleEvent[] = rules.map((rule) => {
      const startDateTime = addMinutes(dayStart, rule.startTimeMinutes);
      const endDateTime = addMinutes(dayStart, rule.endTimeMinutes);

      return {
        id: rule.id,
        clientId: rule.clientId,
        clientName: `${rule.client.firstName} ${rule.client.lastName}`,
        caregiverId: rule.caregiverId,
        caregiverName: buildPersonName(
          rule.caregiver.firstName,
          rule.caregiver.middleName,
          rule.caregiver.lastName
        ),
        scheduledStart: startDateTime.toISOString(),
        scheduledEnd: endDateTime.toISOString(),
        serviceCode: rule.serviceCode,
        notes: rule.notes,
      };
    });

    return NextResponse.json({ events });
  } catch (error: unknown) {
    console.error("Failed to load schedule rules", error);
    return NextResponse.json({ error: "Unable to load schedule rules" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireApiUserRole("admin");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rawBody: unknown = await request.json().catch(() => null);
  const {
    clientId,
    caregiverId,
    dayOfWeek,
    startTime,
    endTime,
    effectiveStartDate,
    effectiveEndDate,
    serviceCode,
    notes,
  } = (rawBody as CreateScheduleRuleBody) ?? {};

  if (typeof clientId !== "string" || typeof caregiverId !== "string") {
    return NextResponse.json({ error: "clientId and caregiverId are required" }, { status: 400 });
  }

  const parsedDayOfWeek =
    typeof dayOfWeek === "number"
      ? dayOfWeek
      : typeof dayOfWeek === "string"
      ? Number.parseInt(dayOfWeek, 10)
      : Number.NaN;

  if (Number.isNaN(parsedDayOfWeek) || parsedDayOfWeek < 0 || parsedDayOfWeek > 6) {
    return NextResponse.json({ error: "dayOfWeek must be between 0 and 6" }, { status: 400 });
  }

  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);

  if (startMinutes === null || endMinutes === null) {
    return NextResponse.json({ error: "Invalid start or end time" }, { status: 400 });
  }

  if (endMinutes <= startMinutes) {
    return NextResponse.json({ error: "endTime must be after startTime" }, { status: 400 });
  }

  const parsedEffectiveStart = parseDateOnly(effectiveStartDate);
  if (!parsedEffectiveStart) {
    return NextResponse.json({ error: "Invalid effectiveStartDate" }, { status: 400 });
  }

  const parsedEffectiveEnd =
    effectiveEndDate === null || effectiveEndDate === undefined || effectiveEndDate === ""
      ? null
      : parseDateOnly(effectiveEndDate);

  if (effectiveEndDate && !parsedEffectiveEnd) {
    return NextResponse.json({ error: "Invalid effectiveEndDate" }, { status: 400 });
  }

  if (parsedEffectiveEnd && parsedEffectiveEnd < parsedEffectiveStart) {
    return NextResponse.json(
      { error: "effectiveEndDate cannot be before effectiveStartDate" },
      { status: 400 }
    );
  }

  try {
    const rule = await prisma.scheduleRule.create({
      data: {
        clientId,
        caregiverId,
        dayOfWeek: parsedDayOfWeek,
        startTimeMinutes: startMinutes,
        endTimeMinutes: endMinutes,
        effectiveStartDate: startOfDay(parsedEffectiveStart),
        effectiveEndDate: parsedEffectiveEnd ? startOfDay(parsedEffectiveEnd) : null,
        serviceCode: typeof serviceCode === "string" && serviceCode.trim() ? serviceCode.trim() : null,
        notes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
      },
    });

    return NextResponse.json({ rule }, { status: 201 });
  } catch (error: unknown) {
    console.error("Failed to create schedule rule", error);
    return NextResponse.json({ error: "Unable to create schedule rule" }, { status: 500 });
  }
}
