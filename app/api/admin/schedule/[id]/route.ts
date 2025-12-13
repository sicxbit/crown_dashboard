import { NextResponse } from "next/server";
import { requireApiUserRole } from "@/lib/auth";
import prisma from "@/lib/prisma";

type ScheduleRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(_request: Request, { params }: ScheduleRouteContext) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Missing visit id" }, { status: 400 });
  }

  try {
    await requireApiUserRole("admin");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.visitLog.delete({ where: { id } });
    return NextResponse.json({ id });
  } catch (error: unknown) {
    console.error("Failed to delete scheduled visit", error);
    return NextResponse.json({ error: "Unable to delete scheduled visit" }, { status: 500 });
  }
}
