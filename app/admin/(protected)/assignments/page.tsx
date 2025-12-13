import prisma from "@/lib/prisma";
import AssignmentManager from "@/components/admin/AssignmentManager";

export default async function AssignmentsPage() {
  const [clients, caregivers] = await Promise.all([
    prisma.client.findMany({
      where: { status: "active" },
      orderBy: { lastName: "asc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        code: true,
        city: true,
        state: true,
      },
    }),
    prisma.caregiver.findMany({
      where: { status: "active" },
      orderBy: { lastName: "asc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        city: true,
        state: true,
        status: true,
      },
    }),
  ]);

  return (
    <AssignmentManager
      clients={clients.map((client) => ({
        id: client.id,
        code: client.code,
        name: `${client.firstName} ${client.lastName}`,
        city: client.city,
        state: client.state,
      }))}
      caregivers={caregivers.map((caregiver) => ({
        id: caregiver.id,
        name: `${caregiver.firstName} ${caregiver.lastName}`,
        phone: caregiver.phone,
        city: caregiver.city,
        state: caregiver.state,
      }))}
    />
  );
}
