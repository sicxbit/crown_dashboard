import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { serializeTickets } from "@/lib/tickets";
import AdminShell from "@/components/admin/AdminShell";
import AdminTicketsTable from "@/components/admin/AdminTicketsTable";

export default async function AdminTicketsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    redirect("/admin/login");
  }

  const tickets = await prisma.ticket.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { include: { caregiver: true } },
    },
  });

  return (
    <AdminShell user={user} active="tickets">
      <AdminTicketsTable tickets={serializeTickets(tickets)} />
    </AdminShell>
  );
}
