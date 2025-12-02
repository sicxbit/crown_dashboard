import prisma from "@/lib/prisma";
import { serializeTickets } from "@/lib/tickets";
import AdminTicketsTable from "@/components/admin/AdminTicketsTable";

export default async function AdminTicketsPage() {
  const tickets = await prisma.ticket.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { include: { caregiver: true } },
    },
  });

  return <AdminTicketsTable tickets={serializeTickets(tickets)} />;
}
