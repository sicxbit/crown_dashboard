"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  addDays,
  addMinutes,
  differenceInMinutes,
  format,
  setHours,
  setMinutes,
  startOfWeek,
} from "date-fns";
import { Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";

type CaregiverOption = {
  id: string;
  name: string;
};

type ClientOption = {
  id: string;
  name: string;
};

type ScheduleRuleEvent = {
  id: string;
  caregiverId: string;
  caregiverName: string;
  clientId: string;
  clientName: string;
  scheduledStart: string;
  scheduledEnd: string;
  serviceCode: string | null;
  notes: string | null;
};

type ApiScheduleResponse = {
  events: ScheduleRuleEvent[];
};

type Props = {
  caregivers: CaregiverOption[];
  clients: ClientOption[];
  selectedClientId: string | null;
};

const hoursStart = 6;
const hoursEnd = 22;
const slotHeight = 32;

function isScheduleResponse(value: unknown): value is ApiScheduleResponse {
  return Boolean(value && typeof value === "object" && "events" in value);
}

function extractApiError(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const possibleError = (value as { error?: unknown }).error;
  return typeof possibleError === "string" ? possibleError : null;
}

export default function CaregiverWeeklyScheduleCalendar({ caregivers, clients, selectedClientId }: Props) {
  const [weekStart, setWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [caregiverFilter, setCaregiverFilter] = useState<string>("");
  const [clientFilter, setClientFilter] = useState<string>(selectedClientId ?? "");
  const [events, setEvents] = useState<ScheduleRuleEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formClientId, setFormClientId] = useState<string>(selectedClientId ?? "");
  const [formCaregiverId, setFormCaregiverId] = useState<string>(caregivers[0]?.id ?? "");
  const [formDayOfWeek, setFormDayOfWeek] = useState<number>(addDays(weekStart, selectedDayIndex).getDay());
  const [formStartTime, setFormStartTime] = useState("09:00");
  const [formEndTime, setFormEndTime] = useState("12:00");
  const [effectiveStartDate, setEffectiveStartDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [effectiveEndDate, setEffectiveEndDate] = useState<string>("");
  const [serviceCode, setServiceCode] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [formMessage, setFormMessage] = useState<string | null>(null);

  useEffect(() => {
    if (selectedClientId && selectedClientId !== clientFilter) {
      setClientFilter(selectedClientId);
    }
    if (selectedClientId && selectedClientId !== formClientId) {
      setFormClientId(selectedClientId);
    }
    if (!selectedClientId && !clientFilter) {
      setClientFilter("");
    }
  }, [clientFilter, formClientId, selectedClientId]);

  useEffect(() => {
    setFormDayOfWeek(addDays(weekStart, selectedDayIndex).getDay());
  }, [selectedDayIndex, weekStart]);

  const dayDate = useMemo(() => addDays(weekStart, selectedDayIndex), [weekStart, selectedDayIndex]);
  const timeWindowStart = useMemo(() => setMinutes(setHours(dayDate, hoursStart), 0), [dayDate]);
  const timeWindowEnd = useMemo(() => setMinutes(setHours(dayDate, hoursEnd), 0), [dayDate]);
  const totalMinutes = differenceInMinutes(timeWindowEnd, timeWindowStart);

  const timeSlots = useMemo(
    () => Array.from({ length: (hoursEnd - hoursStart) * 2 + 1 }, (_, index) => addMinutes(timeWindowStart, index * 30)),
    [timeWindowStart]
  );

  const refreshSchedule = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        weekStart: format(weekStart, "yyyy-MM-dd"),
        dayIndex: selectedDayIndex.toString(),
      });

      if (caregiverFilter) {
        params.set("caregiverId", caregiverFilter);
      }
      if (clientFilter) {
        params.set("clientId", clientFilter);
      }

      try {
        const response = await fetch(`/api/admin/schedule-rules?${params.toString()}`, { signal });
        if (!response.ok) {
          const payload: unknown = await response.json().catch(() => null);
          const apiError = extractApiError(payload);
          throw new Error(apiError ?? "Unable to load schedule");
        }

        const json: unknown = await response.json().catch(() => null);
        if (!isScheduleResponse(json) || !Array.isArray(json.events)) {
          throw new Error("Invalid schedule response");
        }

        setEvents(json.events);
      } catch (err: unknown) {
        if (signal?.aborted) return;
        console.error(err);
        setError(err instanceof Error ? err.message : "Unable to load schedule");
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [caregiverFilter, clientFilter, selectedDayIndex, weekStart]
  );

  useEffect(() => {
    const controller = new AbortController();
    void refreshSchedule(controller.signal);
    return () => controller.abort();
  }, [refreshSchedule]);

  const eventsByCaregiver = useMemo(() => {
    const groups = new Map<string, ScheduleRuleEvent[]>();
    caregivers.forEach((caregiver) => groups.set(caregiver.id, []));
    events.forEach((event) => {
      const existing = groups.get(event.caregiverId) ?? [];
      existing.push(event);
      groups.set(event.caregiverId, existing);
    });
    return groups;
  }, [caregivers, events]);

  const caregiverColumns = caregiverFilter
    ? caregivers.filter((caregiver) => caregiver.id === caregiverFilter)
    : caregivers;

  function computePositions(caregiverId: string): {
    event: ScheduleRuleEvent;
    top: number;
    height: number;
    lane: number;
    laneCount: number;
  }[] {
    const caregiverEvents = eventsByCaregiver.get(caregiverId) ?? [];
    const sorted = [...caregiverEvents].sort((a, b) =>
      new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime()
    );

    const lanes: number[] = [];
    const positioned: { event: ScheduleRuleEvent; top: number; height: number; lane: number }[] = [];
    let maxLanes = 0;

    sorted.forEach((event) => {
      const startDate = new Date(event.scheduledStart);
      const endDate = new Date(event.scheduledEnd);

      const clampedStart = Math.max(0, differenceInMinutes(startDate, timeWindowStart));
      const clampedEnd = Math.min(totalMinutes, differenceInMinutes(endDate, timeWindowStart));

      if (clampedEnd <= 0 || clampedStart >= totalMinutes) {
        return;
      }

      const duration = Math.max(clampedEnd - clampedStart, 10);

      const lane = lanes.findIndex((laneEnd) => clampedStart >= laneEnd);
      const nextLaneIndex = lane === -1 ? lanes.length : lane;
      lanes[nextLaneIndex] = clampedEnd;
      maxLanes = Math.max(maxLanes, lanes.length);

      positioned.push({
        event,
        top: (clampedStart / totalMinutes) * 100,
        height: (duration / totalMinutes) * 100,
        lane: nextLaneIndex,
      });
    });

    return positioned.map((entry) => ({ ...entry, laneCount: Math.max(maxLanes, 1) }));
  }

  async function handleDelete(ruleId: string) {
    const confirmed = window.confirm("Delete this schedule rule?");
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/admin/schedule-rules/${ruleId}`, { method: "DELETE" });
      if (!response.ok) {
        const payload: unknown = await response.json().catch(() => null);
        const apiError = extractApiError(payload);
        throw new Error(apiError ?? "Unable to delete schedule rule");
      }

      await refreshSchedule();
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unable to delete schedule rule");
    }
  }

  async function handleCreateRule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formClientId || !formCaregiverId || !formStartTime || !formEndTime) {
      setFormMessage("Client, caregiver, start time, and end time are required.");
      return;
    }

    setFormMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/admin/schedule-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: formClientId,
          caregiverId: formCaregiverId,
          dayOfWeek: formDayOfWeek,
          startTime: formStartTime,
          endTime: formEndTime,
          effectiveStartDate,
          effectiveEndDate: effectiveEndDate || null,
          serviceCode: serviceCode.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const payload: unknown = await response.json().catch(() => null);
        const apiError = extractApiError(payload);
        throw new Error(apiError ?? "Unable to create schedule rule");
      }

      setFormMessage("Schedule rule created.");
      setServiceCode("");
      setNotes("");
      setEffectiveEndDate("");
      await refreshSchedule();
    } catch (err: unknown) {
      console.error(err);
      setFormMessage(err instanceof Error ? err.message : "Unable to create schedule rule");
    }
  }

  const weekLabel = `${format(weekStart, "MMM d")} – ${format(addDays(weekStart, 6), "MMM d, yyyy")}`;

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow transition-colors dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Weekly Timetable</h2>
          <p className="text-sm text-slate-500 dark:text-slate-300">
            Recurring schedules by caregiver with day/time coverage.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setWeekStart(addDays(weekStart, -7))}
            className="rounded-md border border-slate-300 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Prev Week
          </button>
          <button
            type="button"
            onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
            className="rounded-md border border-slate-300 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            This Week
          </button>
          <button
            type="button"
            onClick={() => setWeekStart(addDays(weekStart, 7))}
            className="rounded-md border border-slate-300 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Next Week
          </button>
          <div className="rounded-md border border-slate-200 px-3 py-1 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-200">
            {weekLabel}
          </div>
        </div>
      </div>

      <div className="space-y-6 px-6 py-5">
        <form
          className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/40 lg:grid-cols-2"
          onSubmit={(event) => {
            void handleCreateRule(event);
          }}
        >
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">Client</label>
            <select
              value={formClientId}
              onChange={(event) => setFormClientId(event.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              required
            >
              <option value="" disabled>
                Select client
              </option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">Caregiver</label>
            <select
              value={formCaregiverId}
              onChange={(event) => setFormCaregiverId(event.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              required
            >
              <option value="" disabled>
                Select caregiver
              </option>
              {caregivers.map((caregiver) => (
                <option key={caregiver.id} value={caregiver.id}>
                  {caregiver.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">Day of Week</label>
            <select
              value={formDayOfWeek}
              onChange={(event) => {
                const value = Number.parseInt(event.target.value, 10);
                if (!Number.isNaN(value)) {
                  setFormDayOfWeek(value);
                }
              }}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              {[
                "Sunday",
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
              ].map((label, index) => (
                <option key={label} value={index}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">Start Time</label>
              <input
                type="time"
                value={formStartTime}
                onChange={(event) => setFormStartTime(event.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">End Time</label>
              <input
                type="time"
                value={formEndTime}
                onChange={(event) => setFormEndTime(event.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">Effective Start</label>
              <input
                type="date"
                value={effectiveStartDate}
                onChange={(event) => setEffectiveStartDate(event.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">Effective End (optional)</label>
              <input
                type="date"
                value={effectiveEndDate}
                onChange={(event) => setEffectiveEndDate(event.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">Service Code (optional)</label>
            <input
              type="text"
              value={serviceCode}
              onChange={(event) => setServiceCode(event.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              placeholder="e.g., H2014"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">Notes (optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              placeholder="Shift notes"
            />
          </div>

          <div className="flex items-end justify-between gap-2 lg:col-span-2">
            <div className="text-sm text-slate-600 dark:text-slate-300">
              {formMessage}
            </div>
            <button
              type="submit"
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-300"
            >
              Add Schedule Rule
            </button>
          </div>
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Day</span>
            <div className="flex overflow-hidden rounded-md border border-slate-200 dark:border-slate-700">
              {Array.from({ length: 7 }, (_, index) => {
                const day = addDays(weekStart, index);
                const isActive = selectedDayIndex === index;
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedDayIndex(index)}
                    className={cn(
                      "px-3 py-2 text-xs font-semibold uppercase transition",
                      isActive
                        ? "bg-brand-600 text-white"
                        : "bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    )}
                  >
                    <div>{format(day, "EEE")}</div>
                    <div className="text-[10px] font-normal">{format(day, "MMM d")}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Caregiver</label>
            <select
              value={caregiverFilter}
              onChange={(event) => setCaregiverFilter(event.target.value)}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="">All caregivers</option>
              {caregivers.map((caregiver) => (
                <option key={caregiver.id} value={caregiver.id}>
                  {caregiver.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Client</label>
            <select
              value={clientFilter}
              onChange={(event) => setClientFilter(event.target.value)}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="">All clients</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-100">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: `100px repeat(${Math.max(caregiverColumns.length, 1)}, minmax(220px, 1fr))` }}
          >
            <div className="relative" style={{ height: slotHeight * timeSlots.length }}>
              {timeSlots.map((slot, index) => (
                <div
                  key={slot.toISOString()}
                  className="flex h-8 items-start justify-end pr-2 text-xs text-slate-500 dark:text-slate-300"
                >
                  {index % 2 === 0 ? format(slot, "HH:mm") : ""}
                </div>
              ))}
            </div>

            {caregiverColumns.map((caregiver) => {
              const positions = computePositions(caregiver.id);
              return (
                <div key={caregiver.id} className="rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
                  <div className="border-b border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 dark:border-slate-800 dark:text-slate-100">
                    {caregiver.name}
                  </div>
                  <div className="relative" style={{ height: slotHeight * timeSlots.length }}>
                    {timeSlots.slice(1).map((slot, index) => (
                      <div
                        key={`${caregiver.id}-${slot.toISOString()}`}
                        className="absolute left-0 right-0 border-t border-dashed border-slate-200 dark:border-slate-700/60"
                        style={{ top: `${((index + 1) / timeSlots.length) * 100}%` }}
                        aria-hidden
                      />
                    ))}

                    {loading && positions.length === 0 ? (
                      <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500 dark:text-slate-300">
                        Loading…
                      </div>
                    ) : positions.length === 0 ? (
                      <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500 dark:text-slate-300">
                        No rules
                      </div>
                    ) : (
                      positions.map((entry) => (
                        <div
                          key={entry.event.id}
                          className="absolute px-1"
                          style={{
                            top: `${entry.top}%`,
                            height: `${entry.height}%`,
                            width: `${100 / entry.laneCount}%`,
                            left: `${(100 / entry.laneCount) * entry.lane}%`,
                          }}
                        >
                          <div className="flex h-full flex-col justify-between rounded-md border border-brand-200 bg-brand-50 px-2 py-1 text-[11px] text-brand-900 shadow-sm dark:border-brand-800 dark:bg-brand-900/40 dark:text-brand-50"
                            title={`${entry.event.clientName} • ${format(new Date(entry.event.scheduledStart), "HH:mm")} – ${format(new Date(entry.event.scheduledEnd), "HH:mm")}${entry.event.serviceCode ? ` • ${entry.event.serviceCode}` : ""}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="font-semibold leading-tight">{entry.event.clientName}</div>
                              <button
                                type="button"
                                onClick={() => {
                                  void handleDelete(entry.event.id);
                                }}
                                className="rounded p-1 text-red-600 hover:bg-red-50 dark:text-red-200 dark:hover:bg-red-900/40"
                                aria-label="Delete schedule rule"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="text-[10px] text-slate-700 dark:text-slate-200">
                              {`${format(new Date(entry.event.scheduledStart), "HH:mm")} – ${format(new Date(entry.event.scheduledEnd), "HH:mm")}`}
                            </div>
                            {entry.event.serviceCode && (
                              <div className="text-[10px] text-slate-700 dark:text-slate-200">Service: {entry.event.serviceCode}</div>
                            )}
                            {entry.event.notes && (
                              <div className="text-[10px] text-slate-700 dark:text-slate-200">{entry.event.notes}</div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
