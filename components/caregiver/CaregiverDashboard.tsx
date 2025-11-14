"use client";

import Link from "next/link";
import { format } from "date-fns";
import LogoutButton from "@/components/common/LogoutButton";

type ClientSummary = {
  id: string;
  startDate: string;
  client: {
    id: string;
    name: string;
    city: string | null;
    state: string | null;
    riskLevel: string | null;
    status: string;
  };
  servicePlan: {
    id: string;
    hoursPerWeek: number;
    tasks: string[];
  } | null;
  recentVisits: {
    id: string;
    actualStart: string | null;
    actualEnd: string | null;
    serviceCode: string | null;
    hasIncident: boolean;
  }[];
};

type Props = {
  clients: ClientSummary[];
};

export default function CaregiverDashboard({ clients }: Props) {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold text-slate-900">My Assigned Clients</h1>
          <p className="text-slate-600">
            Review each client’s plan of care, active tasks, and recent visit outcomes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/tickets"
            className="rounded-md border border-brand-600 px-3 py-1.5 text-sm font-medium text-brand-700 transition hover:bg-brand-50"
          >
            Submit Ticket
          </Link>
          <LogoutButton redirectTo="/caregiver/login" />
        </div>
      </header>

      {clients.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          You do not have any active assignments yet. Please contact the office for scheduling updates.
        </div>
      ) : (
        <div className="space-y-6">
          {clients.map((entry) => (
            <section key={entry.id} className="rounded-xl bg-white p-6 shadow">
              <header className="flex flex-col gap-1 border-b border-slate-100 pb-4">
                <h2 className="text-xl font-semibold text-slate-900">{entry.client.name}</h2>
                <div className="text-sm text-slate-500">
                  {entry.client.city}, {entry.client.state} • Risk Level: {entry.client.riskLevel ?? "N/A"} • Status: {" "}
                  <span className="font-medium text-slate-700">{entry.client.status}</span>
                </div>
                <div className="text-xs text-slate-400">
                  Assigned since {format(new Date(entry.startDate), "MMM d, yyyy")}
                </div>
              </header>

              {entry.servicePlan ? (
                <div className="mt-4 space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                      Active Service Plan
                    </h3>
                    <p className="text-sm text-slate-600">
                      {entry.servicePlan.hoursPerWeek} hours per week
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-600">Tasks</h4>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                      {entry.servicePlan.tasks.map((task, index) => (
                        <li key={`${entry.servicePlan?.id}-${index}`}>{task}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-md border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  No active service plan is on file for this client.
                </div>
              )}

              <div className="mt-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Recent Visits
                </h3>
                {entry.recentVisits.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-500">No visits recorded yet.</p>
                ) : (
                  <ul className="mt-3 space-y-3 text-sm text-slate-600">
                    {entry.recentVisits.map((visit) => (
                      <li
                        key={visit.id}
                        className="flex flex-col gap-1 rounded-md border border-slate-200 p-3 shadow-sm"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="font-medium text-slate-800">
                              {visit.actualStart
                                ? format(new Date(visit.actualStart), "MMM d, yyyy h:mm a")
                                : "Start time not recorded"}
                            </p>
                            <p className="text-xs text-slate-500">
                              {visit.actualEnd
                                ? `Completed at ${format(new Date(visit.actualEnd), "h:mm a")}`
                                : "End time not recorded"}
                            </p>
                          </div>
                          <div className="text-xs uppercase text-slate-500">
                            {visit.serviceCode ?? "No service code"}
                          </div>
                        </div>
                        {visit.hasIncident && (
                          <span className="inline-flex w-fit items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                            Incident flagged
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
