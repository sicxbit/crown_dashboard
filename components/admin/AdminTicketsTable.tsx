"use client";

import { useMemo, useState } from "react";
import type { TicketResponse, TicketStatus } from "@/lib/tickets";
import { ASSIGNEE_DIRECTORY } from "@/lib/ticketAssignees";

const STATUS_OPTIONS: Array<{ value: TicketStatus; label: string }> = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
];

type Props = {
  tickets: TicketResponse[];
};

type FilterStatus = TicketStatus | "all";
type FilterAssignee = keyof typeof ASSIGNEE_DIRECTORY | "all";

type TicketUpdatePayload = Partial<Pick<TicketResponse, "status" | "priority">>;

const inputClasses =
  "rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

const labelClasses = "text-sm font-medium text-slate-700 dark:text-slate-200";

export default function AdminTicketsTable({ tickets }: Props) {
  const [ticketList, setTicketList] = useState<TicketResponse[]>(tickets);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterAssignee, setFilterAssignee] = useState<FilterAssignee>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingTicketId, setUpdatingTicketId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // create-ticket state
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPriority, setNewPriority] = useState<TicketResponse["priority"]>("medium");
  const [isCreating, setIsCreating] = useState(false);

  const filteredTickets = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return ticketList.filter((ticket) => {
      if (filterStatus !== "all" && ticket.status !== filterStatus) {
        return false;
      }
      if (filterAssignee !== "all" && ticket.assignedTo !== filterAssignee) {
        return false;
      }
      if (!term) return true;
      return (
        ticket.title.toLowerCase().includes(term) ||
        ticket.description.toLowerCase().includes(term)
      );
    });
  }, [filterAssignee, filterStatus, searchTerm, ticketList]);

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

  const resetCreateForm = () => {
    setNewTitle("");
    setNewDescription("");
    setNewPriority("medium");
  };

  const handleCreateTicket = async () => {
    if (!newTitle.trim() || !newDescription.trim()) {
      setError("Title and description are required to create a ticket.");
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setIsCreating(true);

    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim(),
          priority: newPriority, // "low" | "medium" | "high" -> matches VALID_PRIORITIES
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error((payload as { error?: string }).error ?? "Unable to create ticket");
      }

      const payload = (await response.json()) as { ticket: TicketResponse };
      setTicketList((current) => [payload.ticket, ...current]);
      setSuccessMessage("Ticket created successfully.");
      resetCreateForm();
    } catch (err) {
      console.error(err);
      setError((err as Error).message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <section className="mx-auto flex max-w-7xl flex-col gap-6 px-6">
      <header className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow transition-colors dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Support Tickets</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Track open issues, manage assignments, and resolve requests quickly.
          </p>
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <label className={labelClasses} htmlFor="ticket-status-filter">
              Status
            </label>
            <select
              id="ticket-status-filter"
              value={filterStatus}
              onChange={(event) => setFilterStatus(event.target.value as FilterStatus)}
              className={inputClasses}
            >
              <option value="all">All</option>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <label className={labelClasses} htmlFor="ticket-assignee-filter">
              Assignee
            </label>
            <select
              id="ticket-assignee-filter"
              value={filterAssignee}
              onChange={(event) => setFilterAssignee(event.target.value as FilterAssignee)}
              className={inputClasses}
            >
              <option value="all">All</option>
              {Object.entries(ASSIGNEE_DIRECTORY).map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
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
              className={`w-full ${inputClasses}`}
            />
          </div>
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-300">{error}</p>}
        {successMessage && <p className="text-sm text-green-600 dark:text-green-300">{successMessage}</p>}
      </header>

      {/* Create Ticket Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow transition-colors dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">Create Ticket</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className={labelClasses} htmlFor="new-title">
              Title
            </label>
            <input
              id="new-title"
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className={`mt-1 w-full ${inputClasses}`}
              placeholder="Short summary of the issue"
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelClasses} htmlFor="new-description">
              Description
            </label>
            <textarea
              id="new-description"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={3}
              className={`mt-1 w-full ${inputClasses}`}
              placeholder="Include relevant details, steps to reproduce, etc."
            />
          </div>
          <div>
            <label className={labelClasses} htmlFor="new-priority">
              Priority
            </label>
            <select
              id="new-priority"
              value={newPriority}
              onChange={(e) =>
                setNewPriority(e.target.value as TicketResponse["priority"])
              }
              className={`mt-1 w-full ${inputClasses}`}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={resetCreateForm}
            disabled={isCreating}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={handleCreateTicket}
            disabled={isCreating}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-300 disabled:cursor-not-allowed disabled:bg-brand-400"
          >
            {isCreating ? "Creating…" : "Create Ticket"}
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow transition-colors dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-200">Ticket</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-200">Created By</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-200">Category</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-200">Assignee</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-200">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-200">Priority</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-200">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No tickets found.
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => {
                  const isUpdating = updatingTicketId === ticket.id;
                  return (
                    <tr key={ticket.id} className="align-top">
                      <td className="px-4 py-4">
                        <p className="font-medium text-slate-900 dark:text-slate-100">{ticket.title}</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">{ticket.description}</p>
                        <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                          <span className="font-semibold">Routing reason:</span> {ticket.assignedReason}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-slate-800 dark:text-slate-200">{ticket.createdBy.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-300">
                          {ticket.createdBy.email ?? "N/A"}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs font-medium uppercase text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          {ticket.category}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {ticket.assignedToName}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-300">Assigned to: {ticket.assignedTo}</p>
                        </div>
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
                          {ticket.priority.charAt(0).toUpperCase() +
                            ticket.priority.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-500 dark:text-slate-300">
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
