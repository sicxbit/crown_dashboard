"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDays,
  addMinutes,
  differenceInMinutes,
  format,
  setHours,
  setMinutes,
  startOfWeek,
} from "date-fns";
import { TrashIcon } from "@heroicons/react/24/outline";

import { cn } from "@/lib/utils";

type CaregiverOption = {
  id: string;
  name: string;
};

type ScheduleVisit = {
  id: string;
  caregiverId: string;
  caregiverName: string;
  clientId: string;
  clientName: string;
  scheduledStart: string;
  scheduledEnd: string;
  serviceCode: string | null;
};

type Props = {
  caregivers: CaregiverOption[];
  selectedClientId: string | null;
};

type ApiScheduleResponse = {
  visits: ScheduleVisit[];
};

function isScheduleResponse(value: unknown): value is ApiScheduleResponse {
  if (!value || typeof value !== "object") return false;
  return "visits" in value;
}

function extractApiError(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  if (!("error" in value)) return null;
  const possibleError = (value as { error?: unknown }).error;
  return typeof possibleError === "string" ? possibleError : null;
}

type PositionedVisit = {
  visit: ScheduleVisit;
  top: number;
  height: number;
  lane: number;
  laneCount: number;
};

const hoursStart = 6;
const hoursEnd = 22;
const slotHeight = 32;

export default function CaregiverScheduleCalendar({ caregivers, selectedClientId }: Props) {
  const [weekStart, setWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedCaregiverId, setSelectedCaregiverId] = useState<string>("");
  const [visits, setVisits] = useState<ScheduleVisit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dayDate = useMemo(() => addDays(weekStart, selectedDayIndex), [weekStart, selectedDayIndex]);

  const timeWindowStart = useMemo(() => setMinutes(setHours(dayDate, hoursStart), 0), [dayDate]);
  const timeWindowEnd = useMemo(() => setMinutes(setHours(dayDate, hoursEnd), 0), [dayDate]);
  const totalMinutes = differenceInMinutes(timeWindowEnd, timeWindowStart);

  const timeSlots = useMemo(
    () =>
      Array.from({ length: (hoursEnd - hoursStart) * 2 + 1 }, (_, index) =>
        addMinutes(timeWindowStart, index * 30)
      ),
    [timeWindowStart]
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadSchedule() {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        weekStart: format(weekStart, "yyyy-MM-dd"),
        dayIndex: selectedDayIndex.toString(),
      });

      if (selectedCaregiverId) {
        params.set("caregiverId", selectedCaregiverId);
      }

      if (selectedClientId) {
        params.set("clientId", selectedClientId);
      }

      try {
        const response = await fetch(`/api/admin/schedule?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          const payload: unknown = await response.json().catch(() => null);
          const apiError = extractApiError(payload);
          throw new Error(apiError ?? "Unable to load schedule");
        }

        const json: unknown = await response.json().catch(() => null);
        if (!isScheduleResponse(json) || !Array.isArray(json.visits)) {
          throw new Error("Invalid schedule response");
        }

        setVisits(json.visits);
      } catch (err: unknown) {
        if (controller.signal.aborted) return;
        console.error(err);
        setError(err instanceof Error ? err.message : "Unable to load schedule");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadSchedule();

    return () => controller.abort();
  }, [selectedDayIndex, selectedCaregiverId, selectedClientId, weekStart]);

  const visitsByCaregiver = useMemo(() => {
    const groups = new Map<string, ScheduleVisit[]>();
    caregivers.forEach((caregiver) => {
      groups.set(caregiver.id, []);
    });

    visits.forEach((visit) => {
      const existing = groups.get(visit.caregiverId) ?? [];
      existing.push(visit);
      groups.set(visit.caregiverId, existing);
    });

    return groups;
  }, [caregivers, visits]);

  const caregiverColumns = selectedCaregiverId
    ? caregivers.filter((caregiver) => caregiver.id === selectedCaregiverId)
    : caregivers;

  function computePositions(caregiverId: string): PositionedVisit[] {
    const caregiverVisits = visitsByCaregiver.get(caregiverId) ?? [];

    const sorted = [...caregiverVisits].sort((a, b) => {
      return new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime();
    });

    const lanes: number[] = [];
    const positioned: Omit<PositionedVisit, "laneCount">[] = [];
    let maxLanes = 0;

    sorted.forEach((visit) => {
      const startDate = new Date(visit.scheduledStart);
      const endDate = new Date(visit.scheduledEnd);

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
        visit,
        top: (clampedStart / totalMinutes) * 100,
        height: (duration / totalMinutes) * 100,
        lane: nextLaneIndex,
      });
    });

    return positioned.map((entry) => ({
      ...entry,
      laneCount: Math.max(maxLanes, 1),
    }));
  }

  async function handleDelete(visitId: string) {
    const confirmed = window.confirm("Delete this scheduled visit?");
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/admin/schedule/${visitId}`, { method: "DELETE" });
      if (!response.ok) {
        const payload: unknown = await response.json().catch(() => null);
        const apiError = extractApiError(payload);
        throw new Error(apiError ?? "Unable to delete visit");
      }

      setVisits((prev) => prev.filter((visit) => visit.id !== visitId));
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unable to delete visit");
    }
  }

  const weekLabel = `${format(weekStart, "MMM d")} – ${format(addDays(weekStart, 6), "MMM d, yyyy")}`;

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow transition-colors dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Caregiver Weekly Calendar</h2>
          <p className="text-sm text-slate-500 dark:text-slate-300">
            View scheduled visits for the week and manage overlaps.
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

      <div className="flex flex-col gap-4 px-6 py-5">
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
              value={selectedCaregiverId}
              onChange={(event) => setSelectedCaregiverId(event.target.value)}
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
        </div>

        {error && <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-100">{error}</div>}

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
                        No visits
                      </div>
                    ) : (
                      positions.map((entry) => (
                        <div
                          key={entry.visit.id}
                          className="absolute px-1"
                          style={{
                            top: `${entry.top}%`,
                            height: `${entry.height}%`,
                            width: `${100 / entry.laneCount}%`,
                            left: `${(100 / entry.laneCount) * entry.lane}%`,
                          }}
                        >
                          <div className="flex h-full flex-col justify-between rounded-md border border-brand-200 bg-brand-50 px-2 py-1 text-[11px] text-brand-900 shadow-sm dark:border-brand-800 dark:bg-brand-900/40 dark:text-brand-50">
                            <div className="flex items-start justify-between gap-2">
                              <div className="font-semibold leading-tight">{entry.visit.clientName}</div>
                              <button
                                type="button"
                                onClick={() => {
                                  void handleDelete(entry.visit.id);
                                }}
                                className="rounded p-1 text-red-600 hover:bg-red-50 dark:text-red-200 dark:hover:bg-red-900/40"
                                aria-label="Delete visit"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="text-[10px] text-slate-700 dark:text-slate-200">
                              {`${format(new Date(entry.visit.scheduledStart), "HH:mm")} – ${format(new Date(entry.visit.scheduledEnd), "HH:mm")}`}
                            </div>
                            {entry.visit.serviceCode && (
                              <div className="text-[10px] text-slate-700 dark:text-slate-200">Service: {entry.visit.serviceCode}</div>
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
