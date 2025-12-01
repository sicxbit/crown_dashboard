import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { serializeTickets } from "@/lib/tickets";
import TicketPortal from "@/components/tickets/TicketPortal";

export default async function TicketPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/caregiver/login");
  }

  if (user.role === "admin") {
    redirect("/admin/tickets");
  }

  const tickets = await prisma.ticket.findMany({
    where: { createdByUserId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { include: { caregiver: true } },
    },
  });

  const displayName = user.caregiver
    ? `${user.caregiver.firstName} ${user.caregiver.lastName}`.trim()
    : user.email ?? "there";

  return <TicketPortal currentUserName={displayName} initialTickets={serializeTickets(tickets)} />;
}
