"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";

type ClientOption = {
  id: string;
  name: string;
  code: string;
  city: string | null;
  state: string | null;
};

type CaregiverOption = {
  id: string;
  name: string;
  phone: string | null;
  city: string | null;
  state: string | null;
};

type Assignment = {
  id: string;
  caregiverId: string;
  caregiverName: string;
  startDate: string;
  endDate: string | null;
  isPrimary: boolean;
  notes: string | null;
};

type Props = {
  clients: ClientOption[];
  caregivers: CaregiverOption[];
};

type ApiErrorPayload = { error?: string };

function getApiErrorMessage(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  if ("error" in value && typeof (value as ApiErrorPayload).error === "string") {
    return (value as ApiErrorPayload).error ?? null;
  }
  return null;
}

function isAssignmentsPayload(value: unknown): value is { assignments: Assignment[] } {
  if (!value || typeof value !== "object") return false;
  return "assignments" in value;
}

export default function AssignmentManager({ clients, caregivers }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(clients[0]?.id ?? null);

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  const [selectedCaregiverId, setSelectedCaregiverId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [notes, setNotes] = useState<string>("");

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const filteredClients = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return clients.filter((client) => {
      const nameMatch = client.name.toLowerCase().includes(term);
      const codeMatch = client.code.toLowerCase().includes(term);
      return nameMatch || codeMatch;
    });
  }, [clients, searchTerm]);

  const activeCaregivers = useMemo(() => caregivers, [caregivers]);

  useEffect(() => {
    if (selectedClientId) {
      void loadAssignments(selectedClientId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClientId]);

  async function loadAssignments(clientId: string) {
    try {
      setLoadingAssignments(true);

      const response = await fetch(`/api/admin/assignments?clientId=${clientId}`);
      if (!response.ok) {
        const json: unknown = await response.json().catch(() => null);
        const apiError = getApiErrorMessage(json);
        throw new Error(apiError ?? "Unable to load assignments");
      }

      const json: unknown = await response.json().catch(() => null);
      if (!isAssignmentsPayload(json) || !Array.isArray(json.assignments)) {
        throw new Error("Invalid response from server");
      }

      setAssignments(
        json.assignments.map((assignment) => ({
          ...assignment,
          startDate: assignment.startDate,
          endDate: assignment.endDate,
        }))
      );
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unable to load assignments");
    } finally {
      setLoadingAssignments(false);
    }
  }

  function resetForm() {
    setSelectedCaregiverId(null);
    setStartDate("");
    setEndDate("");
    setIsPrimary(false);
    setNotes("");
  }

  async function doCreateAssignment() {
    if (!selectedClientId || !selectedCaregiverId || !startDate) {
      setError("Please select a client, caregiver, and start date.");
      return;
    }

    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/admin/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClientId,
          caregiverId: selectedCaregiverId,
          startDate,
          endDate: endDate || null,
          isPrimary,
          notes: notes || null,
        }),
      });

      if (!response.ok) {
        const json: unknown = await response.json().catch(() => null);
        const apiError = getApiErrorMessage(json);
        throw new Error(apiError ?? "Unable to create assignment");
      }

      setSuccessMessage("Assignment saved successfully.");
      resetForm();
      await loadAssignments(selectedClientId);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unable to create assignment");
    }
  }

  function handleCreateAssignment(event: FormEvent) {
    event.preventDefault();
    void doCreateAssignment();
  }

  async function doEndAssignment(assignmentId: string) {
    if (!selectedClientId) return;

    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/admin/assignments/${assignmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endDate: new Date().toISOString() }),
      });

      if (!response.ok) {
        const json: unknown = await response.json().catch(() => null);
        const apiError = getApiErrorMessage(json);
        throw new Error(apiError ?? "Unable to end assignment");
      }

      setSuccessMessage("Assignment ended.");
      await loadAssignments(selectedClientId);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unable to end assignment");
    }
  }

  async function doMakePrimary(assignmentId: string) {
    if (!selectedClientId) return;

    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/admin/assignments/${assignmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPrimary: true }),
      });

      if (!response.ok) {
        const json: unknown = await response.json().catch(() => null);
        const apiError = getApiErrorMessage(json);
        throw new Error(apiError ?? "Unable to update primary assignment");
      }

      setSuccessMessage("Primary caregiver updated.");
      await loadAssignments(selectedClientId);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unable to update primary assignment");
    }
  }

  async function doDeleteAssignment(assignmentId: string) {
    if (!selectedClientId) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this assignment? This action cannot be undone."
    );

    if (!confirmed) return;

    setError(null);
    setSuccessMessage(null);
    setAssignments((prev) => prev.filter((assignment) => assignment.id !== assignmentId));

    try {
      const response = await fetch(`/api/admin/assignments/${assignmentId}`, { method: "DELETE" });

      if (!response.ok) {
        const json: unknown = await response.json().catch(() => null);
        const apiError = getApiErrorMessage(json);
        throw new Error(apiError ?? "Unable to delete assignment");
      }

      setSuccessMessage("Assignment deleted.");
      await loadAssignments(selectedClientId);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unable to delete assignment");
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-50">Caregiver Assignments</h1>
        <p className="text-slate-600 dark:text-slate-300">
          Match clients with caregivers and keep assignment history accurate.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-xl border border-slate-200 bg-white shadow transition-colors dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Clients</h2>
            <div className="mt-3">
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by name or code"
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="max-h-[520px] overflow-y-auto">
            {filteredClients.map((client) => {
              const isSelected = client.id === selectedClientId;
              return (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => setSelectedClientId(client.id)}
                  className={`flex w-full items-start justify-between border-b border-slate-100 px-6 py-4 text-left transition hover:bg-brand-50 dark:border-slate-800 dark:hover:bg-brand-900/30 ${
                    isSelected ? "bg-brand-50 dark:bg-brand-900/30" : "bg-white dark:bg-slate-900"
                  }`}
                >
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {client.name}
                      <span className="ml-2 text-xs font-semibold text-brand-600">{client.code}</span>
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-300">
                      {client.city}, {client.state}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow transition-colors dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Active Caregivers</h2>
            <p className="text-sm text-slate-500 dark:text-slate-300">
              Select a caregiver to include them in the assignment form.
            </p>
          </div>

          <div className="max-h-[520px] overflow-y-auto">
            {activeCaregivers.map((caregiver) => {
              const isSelected = caregiver.id === selectedCaregiverId;
              return (
                <button
                  key={caregiver.id}
                  type="button"
                  onClick={() => setSelectedCaregiverId(caregiver.id)}
                  className={`flex w-full items-start justify-between border-b border-slate-100 px-6 py-4 text-left transition hover:bg-brand-50 dark:border-slate-800 dark:hover:bg-brand-900/30 ${
                    isSelected ? "bg-brand-50 dark:bg-brand-900/30" : "bg-white dark:bg-slate-900"
                  }`}
                >
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{caregiver.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-300">
                      {caregiver.city}, {caregiver.state} • {caregiver.phone ?? "No phone"}
                    </p>
                  </div>
                  {isSelected && <span className="text-xs font-semibold uppercase text-brand-600">Selected</span>}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-xl border border-slate-200 bg-white shadow transition-colors dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Assignment History</h2>
            <p className="text-sm text-slate-500 dark:text-slate-300">
              Active assignments appear at the top. End assignments when coverage changes.
            </p>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {loadingAssignments ? (
              <div className="px-6 py-8 text-sm text-slate-500 dark:text-slate-300">Loading assignments…</div>
            ) : assignments.length === 0 ? (
              <div className="px-6 py-8 text-sm text-slate-500 dark:text-slate-300">No assignments yet.</div>
            ) : (
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                <thead className="bg-slate-50 text-left text-sm font-semibold text-slate-600 dark:bg-slate-800/50 dark:text-slate-200">
                  <tr>
                    <th className="px-4 py-3">Caregiver</th>
                    <th className="px-4 py-3">Start</th>
                    <th className="px-4 py-3">End</th>
                    <th className="px-4 py-3">Primary</th>
                    <th className="px-4 py-3">Notes</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-sm dark:divide-slate-800">
                  {assignments.map((assignment) => {
                    const isActive = !assignment.endDate;
                    return (
                      <tr
                        key={assignment.id}
                        className={
                          isActive ? "bg-brand-50/30 dark:bg-brand-900/30" : "bg-white dark:bg-slate-900"
                        }
                      >
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                          {assignment.caregiverName}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          {format(new Date(assignment.startDate), "MMM d, yyyy")}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          {assignment.endDate ? format(new Date(assignment.endDate), "MMM d, yyyy") : "Active"}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          {assignment.isPrimary ? (
                            <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
                              Primary
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{assignment.notes ?? ""}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            {isActive && (
                              <>
                                {!assignment.isPrimary && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      void doMakePrimary(assignment.id);
                                    }}
                                    className="rounded-md border border-emerald-300 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-200 dark:hover:bg-emerald-900/40"
                                  >
                                    Make Primary
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    void doEndAssignment(assignment.id);
                                  }}
                                  className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                                >
                                  End Today
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                void doDeleteAssignment(assignment.id);
                              }}
                              className="rounded-md border border-red-300 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-200 dark:hover:bg-red-900/40"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow transition-colors dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Create Assignment</h2>
            <p className="text-sm text-slate-500 dark:text-slate-300">
              Choose a caregiver from the list and define the coverage details.
            </p>
          </div>

          <form className="space-y-4 px-6 py-6" onSubmit={handleCreateAssignment}>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Selected Caregiver</label>
              <div className="rounded-md border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-200">
                {selectedCaregiverId
                  ? activeCaregivers.find((c) => c.id === selectedCaregiverId)?.name
                  : "No caregiver selected"}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="startDate">
                Start Date
              </label>
              <input
                id="startDate"
                type="date"
                required
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="endDate">
                End Date (optional)
              </label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="isPrimary"
                type="checkbox"
                checked={isPrimary}
                onChange={(event) => setIsPrimary(event.target.checked)}
              />
              <label htmlFor="isPrimary" className="text-sm text-slate-700 dark:text-slate-200">
                Set as primary caregiver
              </label>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="notes">
                Notes
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                rows={3}
              />
            </div>

            {error && <p className="text-sm text-red-600 dark:text-red-300">{error}</p>}
            {successMessage && <p className="text-sm text-emerald-600 dark:text-emerald-300">{successMessage}</p>}

            <button
              type="submit"
              className="w-full rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-300 disabled:cursor-not-allowed disabled:bg-brand-400"
            >
              Save Assignment
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
