"use client";

import { useMemo, useState } from "react";
import type { TicketResponse, TicketStatus } from "@/lib/tickets";
import type { TicketAssignmentMember } from "@/lib/ticketAssignment";

const STATUS_OPTIONS: Array<{ value: TicketStatus; label: string }> = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
];

type Props = {
  tickets: TicketResponse[];
  teamMembers: TicketAssignmentMember[];
};

type FilterStatus = TicketStatus | "all";

type TicketUpdatePayload = Partial<Pick<TicketResponse, "status" | "priority">> & {
  assigneeUserId?: string | null;
};

export default function AdminTicketsTable({ tickets, teamMembers }: Props) {
  const [ticketList, setTicketList] = useState<TicketResponse[]>(tickets);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingTicketId, setUpdatingTicketId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const filteredTickets = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return ticketList.filter((ticket) => {
      if (filterStatus !== "all" && ticket.status !== filterStatus) {
        return false;
      }
      if (!term) {
        return true;
      }
      return (
        ticket.title.toLowerCase().includes(term) ||
        ticket.description.toLowerCase().includes(term)
      );
    });
  }, [filterStatus, searchTerm, ticketList]);

  const handleTicketUpdate = async (id: string, updates: TicketUpdatePayload) => {
    setError(null);
    setSuccessMessage(null);
    setUpdatingTicketId(id);

    try {
      const response = await fetch(`/api/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error((payload as { error?: string }).error ?? "Unable to update ticket");
      }

      const payload = (await response.json()) as { ticket: TicketResponse };
      setTicketList((current) => current.map((item) => (item.id === id ? payload.ticket : item)));
      setSuccessMessage("Ticket updated successfully.");
    } catch (err) {
      console.error(err);
      setError((err as Error).message);
    } finally {
      setUpdatingTicketId(null);
    }
  };

  return (
    <section className="mx-auto flex max-w-7xl flex-col gap-6 px-6">
      <header className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-slate-900">Support Tickets</h1>
          <p className="text-sm text-slate-600">
            Track open issues, manage assignments, and resolve requests quickly.
          </p>
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-slate-700" htmlFor="ticket-status-filter">
              Status
            </label>
            <select
              id="ticket-status-filter"
              value={filterStatus}
              onChange={(event) => setFilterStatus(event.target.value as FilterStatus)}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            >
              <option value="all">All</option>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 md:max-w-sm">
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search tickets"
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {successMessage && <p className="text-sm text-green-600">{successMessage}</p>}
      </header>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Ticket</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Created By</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Assignee</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Priority</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No tickets found.
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => {
                  const isUpdating = updatingTicketId === ticket.id;
                  return (
                    <tr key={ticket.id} className="align-top">
                      <td className="px-4 py-4">
                        <p className="font-medium text-slate-900">{ticket.title}</p>
                        <p className="mt-1 text-xs text-slate-500">{ticket.description}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-slate-800">{ticket.createdBy.name}</p>
                        <p className="text-xs text-slate-500">{ticket.createdBy.email ?? "N/A"}</p>
                      </td>
                      <td className="px-4 py-4">
                        <select
                          value={ticket.assignee?.id ?? ""}
                          onChange={(event) =>
                            handleTicketUpdate(ticket.id, {
                              assigneeUserId: event.target.value ? event.target.value : null,
                            })
                          }
                          disabled={isUpdating}
                          className="w-full rounded-md border border-slate-200 px-2 py-1 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                        >
                          <option value="">Unassigned</option>
                          {teamMembers.map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-4">
                        <select
                          value={ticket.status}
                          onChange={(event) =>
                            handleTicketUpdate(ticket.id, {
                              status: event.target.value as TicketStatus,
                            })
                          }
                          disabled={isUpdating}
                          className="w-full rounded-md border border-slate-200 px-2 py-1 text-sm capitalize focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                        >
                          {STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            ticket.priority === "high"
                              ? "bg-red-100 text-red-700"
                              : ticket.priority === "medium"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-500">
                        {new Date(ticket.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
