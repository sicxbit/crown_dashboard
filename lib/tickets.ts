import type { Caregiver, Ticket, User } from "@prisma/client";
import { formatAssigneeName } from "./ticketAssignees";

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
  assignedTo: string;
  assignedToName: string;
  assignedReason: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  createdBy: TicketUserInfo;
};

type TicketWithRelations = Ticket & {
  createdBy: User & { caregiver?: Caregiver | null };
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
    assignedTo: ticket.assignedTo,
    assignedToName: formatAssigneeName(ticket.assignedTo),
    assignedReason: ticket.assignedReason,
    category: ticket.category,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    createdBy: formatUser(ticket.createdBy),
  };
}

export function serializeTickets(tickets: TicketWithRelations[]): TicketResponse[] {
  return tickets.map(serializeTicket);
}
