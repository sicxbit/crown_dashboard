import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import CaregiverDashboard from "@/components/caregiver/CaregiverDashboard";

export default async function CaregiverDashboardPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "caregiver" || !user.caregiverId) {
    redirect("/caregiver/login");
  }

  const assignments = await prisma.caregiverAssignment.findMany({
    where: {
      caregiverId: user.caregiverId,
      endDate: null,
    },
    orderBy: { startDate: "asc" },
    include: {
      client: {
        include: {
          servicePlans: {
            where: { isActive: true },
            orderBy: { effectiveDate: "desc" },
            take: 1,
          },
          visitLogs: {
            where: { caregiverId: user.caregiverId },
            orderBy: { actualStart: "desc" },
            take: 5,
          },
        },
      },
    },
  });

  const data = assignments.map((assignment) => ({
    id: assignment.id,
    startDate: assignment.startDate.toISOString(),
    client: {
      id: assignment.client.id,
      name: `${assignment.client.firstName} ${assignment.client.lastName}`,
      city: assignment.client.city,
      state: assignment.client.state,
      riskLevel: assignment.client.riskLevel,
      status: assignment.client.status,
    },
    servicePlan: assignment.client.servicePlans[0]
      ? {
          id: assignment.client.servicePlans[0].id,
          hoursPerWeek: assignment.client.servicePlans[0].hoursPerWeek,
          tasks: Array.isArray(assignment.client.servicePlans[0].tasksJson)
            ? (assignment.client.servicePlans[0].tasksJson as unknown[]).map((task) => String(task))
            : typeof assignment.client.servicePlans[0].tasksJson === "string"
            ? [assignment.client.servicePlans[0].tasksJson as string]
            : Object.values(assignment.client.servicePlans[0].tasksJson as Record<string, unknown>).map((value) =>
                typeof value === "string" ? value : JSON.stringify(value)
              ),
        }
      : null,
    recentVisits: assignment.client.visitLogs.map((visit) => ({
      id: visit.id,
      actualStart: visit.actualStart?.toISOString() ?? null,
      actualEnd: visit.actualEnd?.toISOString() ?? null,
      serviceCode: visit.serviceCode,
      hasIncident: visit.hasIncident,
    })),
  }));

  return <CaregiverDashboard clients={data} />;
}
