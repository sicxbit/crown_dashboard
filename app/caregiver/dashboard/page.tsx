import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import CaregiverDashboard from "@/components/caregiver/CaregiverDashboard";

function safeToString(input: unknown): string {
  if (input == null) return "";

  if (typeof input === "string") return input;

  if (
    typeof input === "number" ||
    typeof input === "boolean" ||
    typeof input === "bigint"
  ) {
    return String(input);
  }

  if (typeof input === "symbol") return input.description ?? "";
  if (typeof input === "function")
    return input.name ? `[function ${input.name}]` : "[function]";

  // Objects (including arrays, dates, etc.)
  try {
    return JSON.stringify(input);
  } catch {
    return "[unserializable]";
  }
}

function normalizeTasks(tasksJson: unknown): string[] {
  if (tasksJson == null) return [];

  if (Array.isArray(tasksJson)) {
    return tasksJson
      .map((task) => safeToString(task))
      .filter((t) => t.trim().length > 0);
  }

  if (typeof tasksJson === "object") {
    return Object.values(tasksJson as Record<string, unknown>)
      .map((value) => safeToString(value))
      .filter((t) => t.trim().length > 0);
  }

  const one = safeToString(tasksJson);
  return one.trim().length > 0 ? [one] : [];
}

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

  const data = assignments.map((assignment) => {
    const plan = assignment.client.servicePlans[0] ?? null;

    return {
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
      servicePlan: plan
        ? {
            id: plan.id,
            hoursPerWeek: plan.hoursPerWeek,
            tasks: normalizeTasks(plan.tasksJson),
          }
        : null,
      recentVisits: assignment.client.visitLogs.map((visit) => ({
        id: visit.id,
        actualStart: visit.actualStart?.toISOString() ?? null,
        actualEnd: visit.actualEnd?.toISOString() ?? null,
        serviceCode: visit.serviceCode,
        hasIncident: visit.hasIncident,
      })),
    };
  });

  return <CaregiverDashboard clients={data} />;
}
