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

export default function AssignmentManager({ clients, caregivers }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(
    clients[0]?.id ?? null
  );
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

  const loadAssignments = async (clientId: string) => {
    try {
      setLoadingAssignments(true);
      const response = await fetch(`/api/admin/assignments?clientId=${clientId}`);
      if (!response.ok) {
        throw new Error("Unable to load assignments");
      }
      const payload = (await response.json()) as { assignments: Assignment[] };
      setAssignments(
        payload.assignments.map((assignment) => ({
          ...assignment,
          startDate: assignment.startDate,
          endDate: assignment.endDate,
        }))
      );
    } catch (err) {
      console.error(err);
      setError((err as Error).message);
    } finally {
      setLoadingAssignments(false);
    }
  };

  const resetForm = () => {
    setSelectedCaregiverId(null);
    setStartDate("");
    setEndDate("");
    setIsPrimary(false);
    setNotes("");
  };

  const handleCreateAssignment = async (event: FormEvent) => {
    event.preventDefault();
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
        const payload = await response.json();
        throw new Error(payload.error ?? "Unable to create assignment");
      }

      setSuccessMessage("Assignment saved successfully.");
      resetForm();
      await loadAssignments(selectedClientId);
    } catch (err) {
      console.error(err);
      setError((err as Error).message);
    }
  };

  const handleEndAssignment = async (assignmentId: string) => {
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
        const payload = await response.json();
        throw new Error(payload.error ?? "Unable to end assignment");
      }

      setSuccessMessage("Assignment ended.");
      await loadAssignments(selectedClientId);
    } catch (err) {
      console.error(err);
      setError((err as Error).message);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-slate-900">Caregiver Assignments</h1>
        <p className="text-slate-600">
          Match clients with caregivers and keep assignment history accurate.
        </p>
      </header>
      <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-xl bg-white shadow">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">Clients</h2>
            <div className="mt-3">
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by name or code"
                className="w-full rounded-md border border-slate-200 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
            </div>
          </div>
          <div className="max-h-[520px] overflow-y-auto">
            {filteredClients.map((client) => {
              const isSelected = client.id === selectedClientId;
              return (
                <button
                  key={client.id}
                  onClick={() => setSelectedClientId(client.id)}
                  className={`flex w-full items-start justify-between border-b border-slate-100 px-6 py-4 text-left transition hover:bg-brand-50 ${
                    isSelected ? "bg-brand-50" : "bg-white"
                  }`}
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {client.name}
                      <span className="ml-2 text-xs font-semibold text-brand-600">{client.code}</span>
                    </p>
                    <p className="text-sm text-slate-500">
                      {client.city}, {client.state}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <div className="rounded-xl bg-white shadow">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">Active Caregivers</h2>
            <p className="text-sm text-slate-500">
              Select a caregiver to include them in the assignment form.
            </p>
          </div>
          <div className="max-h-[520px] overflow-y-auto">
            {activeCaregivers.map((caregiver) => {
              const isSelected = caregiver.id === selectedCaregiverId;
              return (
                <button
                  key={caregiver.id}
                  onClick={() => setSelectedCaregiverId(caregiver.id)}
                  className={`flex w-full items-start justify-between border-b border-slate-100 px-6 py-4 text-left transition hover:bg-brand-50 ${
                    isSelected ? "bg-brand-50" : "bg-white"
                  }`}
                >
                  <div>
                    <p className="font-medium text-slate-900">{caregiver.name}</p>
                    <p className="text-sm text-slate-500">
                      {caregiver.city}, {caregiver.state} • {caregiver.phone ?? "No phone"}
                    </p>
                  </div>
                  {isSelected && (
                    <span className="text-xs font-semibold uppercase text-brand-600">Selected</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-xl bg-white shadow">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">Assignment History</h2>
            <p className="text-sm text-slate-500">
              Active assignments appear at the top. End assignments when coverage changes.
            </p>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {loadingAssignments ? (
              <div className="px-6 py-8 text-sm text-slate-500">Loading assignments…</div>
            ) : assignments.length === 0 ? (
              <div className="px-6 py-8 text-sm text-slate-500">No assignments yet.</div>
            ) : (
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50 text-left text-sm font-semibold text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Caregiver</th>
                    <th className="px-4 py-3">Start</th>
                    <th className="px-4 py-3">End</th>
                    <th className="px-4 py-3">Primary</th>
                    <th className="px-4 py-3">Notes</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {assignments.map((assignment) => {
                    const isActive = !assignment.endDate;
                    return (
                      <tr key={assignment.id} className={isActive ? "bg-brand-50/30" : "bg-white"}>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {assignment.caregiverName}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {format(new Date(assignment.startDate), "MMM d, yyyy")}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {assignment.endDate
                            ? format(new Date(assignment.endDate), "MMM d, yyyy")
                            : "Active"}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {assignment.isPrimary ? (
                            <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                              Primary
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{assignment.notes ?? ""}</td>
                        <td className="px-4 py-3 text-right">
                          {isActive && (
                            <button
                              onClick={() => handleEndAssignment(assignment.id)}
                              className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                            >
                              End Today
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
        <div className="rounded-xl bg-white shadow">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">Create Assignment</h2>
            <p className="text-sm text-slate-500">
              Choose a caregiver from the list and define the coverage details.
            </p>
          </div>
          <form className="space-y-4 px-6 py-6" onSubmit={handleCreateAssignment}>
            <div>
              <label className="text-sm font-medium text-slate-700">Selected Caregiver</label>
              <div className="rounded-md border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-600">
                {selectedCaregiverId
                  ? activeCaregivers.find((c) => c.id === selectedCaregiverId)?.name
                  : "No caregiver selected"}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="startDate">
                Start Date
              </label>
              <input
                id="startDate"
                type="date"
                required
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="w-full rounded-md border border-slate-200 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="endDate">
                End Date (optional)
              </label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="w-full rounded-md border border-slate-200 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="isPrimary"
                type="checkbox"
                checked={isPrimary}
                onChange={(event) => setIsPrimary(event.target.checked)}
              />
              <label htmlFor="isPrimary" className="text-sm text-slate-700">
                Set as primary caregiver
              </label>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="notes">
                Notes
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="w-full rounded-md border border-slate-200 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                rows={3}
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {successMessage && <p className="text-sm text-emerald-600">{successMessage}</p>}
            <button
              type="submit"
              className="w-full rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-400"
            >
              Save Assignment
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
