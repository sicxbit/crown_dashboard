import type { Caregiver, Ticket, User } from "@prisma/client";

export type TicketStatus = "open" | "in_progress" | "resolved";
export type TicketPriority = "low" | "medium" | "high";

export type TicketUserInfo = {
  id: string;
  name: string;
  email: string | null;
  role: string;
};

export type TicketResponse = {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  updatedAt: string;
  createdBy: TicketUserInfo;
  assignee: TicketUserInfo | null;
};

type TicketWithRelations = Ticket & {
  createdBy: User & { caregiver?: Caregiver | null };
  assignee: (User & { caregiver?: Caregiver | null }) | null;
};

function formatUser(user: User & { caregiver?: Caregiver | null }): TicketUserInfo {
  const name = user.caregiver
    ? `${user.caregiver.firstName} ${user.caregiver.lastName}`.trim()
    : user.email ?? "Team Member";
  return {
    id: user.id,
    name,
    email: user.email,
    role: user.role,
  };
}

export function serializeTicket(ticket: TicketWithRelations): TicketResponse {
  return {
    id: ticket.id,
    title: ticket.title,
    description: ticket.description,
    status: ticket.status as TicketStatus,
    priority: ticket.priority as TicketPriority,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    createdBy: formatUser(ticket.createdBy),
    assignee: ticket.assignee ? formatUser(ticket.assignee) : null,
  };
}

export function serializeTickets(tickets: TicketWithRelations[]): TicketResponse[] {
  return tickets.map(serializeTicket);
}
