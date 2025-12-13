import type { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

import { requireApiUserRole } from "@/lib/auth";
import prisma from "@/lib/prisma";

type Params = { params: { id?: string } };

export async function DELETE(_request: Request, context: Params) {
  try {
    await requireApiUserRole("admin");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db: PrismaClient = prisma;

  const ruleId = context.params.id;
  if (!ruleId) {
    return NextResponse.json({ error: "Missing schedule rule id" }, { status: 400 });
  }

  try {
    await db.scheduleRule.delete({ where: { id: ruleId } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Failed to delete schedule rule", error);
    return NextResponse.json({ error: "Unable to delete schedule rule" }, { status: 500 });
  }
}
