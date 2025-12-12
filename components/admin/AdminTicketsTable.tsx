"use client";

import { useMemo, useState } from "react";
import type { TicketResponse, TicketStatus } from "@/lib/tickets";
import { ASSIGNEE_DIRECTORY } from "@/lib/ticketAssignees";

/* -------------------- constants -------------------- */

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
] as const satisfies ReadonlyArray<{ value: TicketStatus; label: string }>;

const FILTER_ALL = "all" as const;

type Props = {
  tickets: TicketResponse[];
};

// ✅ Derive FilterStatus safely
const FILTER_STATUS_OPTIONS = [FILTER_ALL, ...STATUS_OPTIONS.map((s) => s.value)] as const;
type FilterStatus = (typeof FILTER_STATUS_OPTIONS)[number];

// ✅ Type guard to avoid `as` assertions
function isAssigneeId(value: string): value is keyof typeof ASSIGNEE_DIRECTORY {
  return Object.prototype.hasOwnProperty.call(ASSIGNEE_DIRECTORY, value);
}

// ✅ Build typed assignee list without `as Array<...>` (fixes your error)
const ASSIGNEE_IDS = Object.keys(ASSIGNEE_DIRECTORY).filter(isAssigneeId);
const FILTER_ASSIGNEE_OPTIONS = [FILTER_ALL, ...ASSIGNEE_IDS] as const;
type FilterAssignee = (typeof FILTER_ASSIGNEE_OPTIONS)[number];

type TicketUpdatePayload = Partial<Pick<TicketResponse, "status" | "priority">>;

type ApiErrorPayload = { error?: string };
type TicketOkPayload = { ticket: TicketResponse };

/* -------------------- helpers -------------------- */

function getApiErrorMessage(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  if ("error" in value && typeof (value as ApiErrorPayload).error === "string") {
    return (value as ApiErrorPayload).error ?? null;
  }
  return null;
}

function isTicketOkPayload(value: unknown): value is TicketOkPayload {
  if (!value || typeof value !== "object") return false;
  if (!("ticket" in value)) return false;

  const ticket = (value as { ticket?: unknown }).ticket;
  if (!ticket || typeof ticket !== "object") return false;

  return "id" in (ticket as Record<string, unknown>);
}

function isTicketStatus(value: string): value is TicketStatus {
  return (STATUS_OPTIONS as ReadonlyArray<{ value: TicketStatus }>).some((o) => o.value === value);
}

function isFilterStatus(value: string): value is FilterStatus {
  return (FILTER_STATUS_OPTIONS as readonly string[]).includes(value);
}

function isFilterAssignee(value: string): value is FilterAssignee {
  return (FILTER_ASSIGNEE_OPTIONS as readonly string[]).includes(value);
}

/* -------------------- styles -------------------- */

const inputClasses =
  "rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

const labelClasses = "text-sm font-medium text-slate-700 dark:text-slate-200";

/* ==================== component ==================== */

export default function AdminTicketsTable({ tickets }: Props) {
  const [ticketList, setTicketList] = useState<TicketResponse[]>(tickets);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>(FILTER_ALL);
  const [filterAssignee, setFilterAssignee] = useState<FilterAssignee>(FILTER_ALL);
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
      if (filterStatus !== FILTER_ALL && ticket.status !== filterStatus) return false;
      if (filterAssignee !== FILTER_ALL && ticket.assignedTo !== filterAssignee) return false;
      if (!term) return true;

      return (
        ticket.title.toLowerCase().includes(term) ||
        ticket.description.toLowerCase().includes(term)
      );
    });
  }, [filterAssignee, filterStatus, searchTerm, ticketList]);

  async function handleTicketUpdate(id: string, updates: TicketUpdatePayload) {
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
        const json: unknown = await response.json().catch(() => null);
        throw new Error(getApiErrorMessage(json) ?? "Unable to update ticket");
      }

      const json: unknown = await response.json().catch(() => null);
      if (!isTicketOkPayload(json)) {
        throw new Error("Invalid response from server");
      }

      setTicketList((current) => current.map((t) => (t.id === id ? json.ticket : t)));
      setSuccessMessage("Ticket updated successfully.");
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unable to update ticket");
    } finally {
      setUpdatingTicketId(null);
    }
  }

  function resetCreateForm() {
    setNewTitle("");
    setNewDescription("");
    setNewPriority("medium");
  }

  async function handleCreateTicket() {
    if (!newTitle.trim() || !newDescription.trim()) {
      setError("Title and description are required.");
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
          priority: newPriority,
        }),
      });

      if (!response.ok) {
        const json: unknown = await response.json().catch(() => null);
        throw new Error(getApiErrorMessage(json) ?? "Unable to create ticket");
      }

      const json: unknown = await response.json().catch(() => null);
      if (!isTicketOkPayload(json)) {
        throw new Error("Invalid response from server");
      }

      setTicketList((current) => [json.ticket, ...current]);
      setSuccessMessage("Ticket created successfully.");
      resetCreateForm();
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unable to create ticket");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <section className="mx-auto flex max-w-7xl flex-col gap-6 px-6">
      <header className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow transition-colors dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Support Tickets
          </h1>
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
              onChange={(event) => {
                const v = event.target.value;
                setFilterStatus(isFilterStatus(v) ? v : FILTER_ALL);
              }}
              className={inputClasses}
            >
              <option value={FILTER_ALL}>All</option>
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
              onChange={(event) => {
                const v = event.target.value;
                setFilterAssignee(isFilterAssignee(v) ? v : FILTER_ALL);
              }}
              className={inputClasses}
            >
              <option value={FILTER_ALL}>All</option>
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
        {successMessage && (
          <p className="text-sm text-green-600 dark:text-green-300">{successMessage}</p>
        )}
      </header>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow transition-colors dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">
          Create Ticket
        </h2>

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
              onChange={(e) => {
                const v = e.target.value;
                if (v === "low" || v === "medium" || v === "high") setNewPriority(v);
              }}
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
            onClick={() => void handleCreateTicket()}
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
                <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-200">
                  Ticket
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-200">
                  Created By
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-200">
                  Category
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-200">
                  Assignee
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-200">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-200">
                  Priority
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-200">
                  Created
                </th>
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
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {ticket.title}
                        </p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
                          {ticket.description}
                        </p>
                        <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                          <span className="font-semibold">Routing reason:</span>{" "}
                          {ticket.assignedReason}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <p className="font-medium text-slate-800 dark:text-slate-200">
                          {ticket.createdBy.name}
                        </p>
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
                          <p className="text-xs text-slate-500 dark:text-slate-300">
                            Assigned to: {ticket.assignedTo}
                          </p>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <select
                          value={ticket.status}
                          onChange={(event) => {
                            const v = event.target.value;
                            if (isTicketStatus(v)) void handleTicketUpdate(ticket.id, { status: v });
                          }}
                          disabled={isUpdating}
                          className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-sm capitalize text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
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
