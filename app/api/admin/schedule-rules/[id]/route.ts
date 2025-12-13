import { NextResponse } from "next/server";

import { requireApiUserRole } from "@/lib/auth";
import prisma from "@/lib/prisma";

type ScheduleRuleRouteContext = { params: Promise<{ id: string }> };

export async function DELETE(
  _request: Request,
  { params }: ScheduleRuleRouteContext
) {
  try {
    await requireApiUserRole("admin");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: ruleId } = await params; // Next 15 params promise

  try {
    await prisma.scheduleRule.delete({ where: { id: ruleId } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Failed to delete schedule rule", error);
    return NextResponse.json({ error: "Unable to delete schedule rule" }, { status: 500 });
  }
}
