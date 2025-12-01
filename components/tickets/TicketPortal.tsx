
import { FormEvent, useState } from "react";
import type { TicketPriority, TicketResponse } from "@/lib/tickets";

const PRIORITY_OPTIONS: Array<{ value: TicketPriority; label: string }> = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

type Props = {
  currentUserName: string;
  initialTickets: TicketResponse[];
};

type CreateTicketResponse = {
  ticket: TicketResponse;
  source?: "ai" | "fallback";
};

export default function TicketPortal({ currentUserName, initialTickets }: Props) {
  const [tickets, setTickets] = useState<TicketResponse[]>(initialTickets);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, priority }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error((payload as { error?: string }).error ?? "Unable to create ticket");
      }

      const payload = (await response.json()) as CreateTicketResponse;
      setTickets((current) => [payload.ticket, ...current]);
      setTitle("");
      setDescription("");
      setPriority("medium");

      const assigneeName = payload.ticket.assignedToName;
      setSuccessMessage(
        payload.source === "ai"
          ? `Ticket created and routed to ${assigneeName}.`
          : `Ticket created and routed via fallback to ${assigneeName}.`
      );
    } catch (err) {
      console.error(err);
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 bg-transparent p-6 text-slate-900 transition-colors dark:text-slate-100">
      <header className="rounded-xl border border-slate-200 bg-white p-6 shadow transition-colors dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-3xl font-semibold">Need a hand?</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          Hi {currentUserName}! Create a ticket for the operations team and we’ll route it to the best teammate to help.
        </p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow transition-colors dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-xl font-semibold">Create a ticket</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Share a clear title and description so we can triage your request quickly.
        </p>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="ticket-title">
              Title
            </label>
            <input
              id="ticket-title"
              name="ticket-title"
              type="text"
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="ticket-description">
              Description
            </label>
            <textarea
              id="ticket-description"
              name="ticket-description"
              required
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={5}
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="ticket-priority">
              Priority
            </label>
            <select
              id="ticket-priority"
              value={priority}
              onChange={(event) => setPriority(event.target.value as TicketPriority)}
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              {PRIORITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-300">{error}</p>}
          {successMessage && <p className="text-sm text-green-600 dark:text-green-300">{successMessage}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-300 disabled:cursor-not-allowed disabled:bg-brand-400"
          >
            {isSubmitting ? "Submitting..." : "Submit Ticket"}
          </button>
        </form>
      </section>

      <section className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow transition-colors dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-xl font-semibold">My tickets</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Track progress on your requests and see who is assigned.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="ticket-assignee-filter">
            Filter by assignee
          </label>
          <select
            id="ticket-assignee-filter"
            value={assigneeFilter}
            onChange={(event) => setAssigneeFilter(event.target.value)}
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 sm:w-64"
          >
            <option value="all">All</option>
            <option value="jemond">Jemond (CEO)</option>
            <option value="natasha">Natasha (HR Head)</option>
            <option value="jithu">Jithu (Tech Head)</option>
            <option value="janice">Janice (Onboarding & Accounts)</option>
          </select>
        </div>
        <div className="mt-5 grid gap-4">
          {tickets.filter((ticket) => assigneeFilter === "all" || ticket.assignedTo === assigneeFilter).length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              You have not submitted any tickets yet.
            </div>
          ) : (
              tickets
                .filter((ticket) => assigneeFilter === "all" || ticket.assignedTo === assigneeFilter)
                .map((ticket) => (
                  <article
                    key={ticket.id}
                    className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="text-lg font-semibold">{ticket.title}</h3>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          ticket.status === "resolved"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200"
                            : ticket.status === "in_progress"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-200"
                            : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        }`}
                      >
                        {ticket.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{ticket.description}</p>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-300">
                      <span className="rounded-md bg-slate-100 px-2 py-1 font-medium dark:bg-slate-800 dark:text-slate-200">
                        Priority: {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                      </span>
                      <span className="rounded-md bg-slate-100 px-2 py-1 font-medium dark:bg-slate-800 dark:text-slate-200">
                        Assigned to: {ticket.assignedToName}
                      </span>
                      <span className="rounded-md bg-slate-100 px-2 py-1 font-medium dark:bg-slate-800 dark:text-slate-200">
                        Category: {ticket.category}
                      </span>
                      <span className="rounded-md bg-slate-100 px-2 py-1 font-medium dark:bg-slate-800 dark:text-slate-200">
                        Reason: {ticket.assignedReason}
                      </span>
                      <span>Created {new Date(ticket.createdAt).toLocaleString()}</span>
                    </div>
                  </article>
                ))
            )}
          </div>
        </section>
    </main>
  );
}
