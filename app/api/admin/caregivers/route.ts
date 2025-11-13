import { addDays, isBefore, isWithinInterval } from "date-fns";
import { NextResponse } from "next/server";
import { requireApiUserRole } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    await requireApiUserRole("admin");
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const caregivers = await prisma.caregiver.findMany({
    orderBy: { lastName: "asc" },
    include: {
      compliance: true,
    },
  });

  const today = new Date();
  const soon = addDays(today, 30);

  return NextResponse.json(
    caregivers.map((caregiver) => {
      const expired = caregiver.compliance.filter((item) => {
        if (item.status.toLowerCase() === "expired") {
          return true;
        }
        if (item.expirationDate && isBefore(item.expirationDate, today)) {
          return true;
        }
        return false;
      }).length;

      const expiringSoon = caregiver.compliance.filter((item) => {
        if (!item.expirationDate) return false;
        return isWithinInterval(item.expirationDate, { start: today, end: soon });
      }).length;

      return {
        id: caregiver.id,
        firstName: caregiver.firstName,
        lastName: caregiver.lastName,
        city: caregiver.city,
        state: caregiver.state,
        status: caregiver.status,
        employeeCode: caregiver.employeeCode,
        sandataEvvId: caregiver.sandataEvvId,
        complianceSummary: expired
          ? `${expired} expired${expiringSoon ? ` / ${expiringSoon} expiring soon` : ""}`
          : expiringSoon
          ? `${expiringSoon} expiring soon`
          : "All valid",
      };
    })
  );
}
