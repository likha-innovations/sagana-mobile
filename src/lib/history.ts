import {
  addDays,
  addHours,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfDay,
  startOfHour,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import type { CompletedBatch } from "../types/batch";
import type {
  HistoryReading,
  HistoryEvent,
  HistoryScope,
  DateRange,
  SensorKey,
  SensorPeriod,
} from "../types/history";

export function normalizeRange(startDate: string, endDate: string): DateRange {
  return startDate <= endDate
    ? { startDate, endDate }
    : { startDate: endDate, endDate: startDate };
}

export function nextRangeSelection(
  current: { startDate: string | null; endDate: string | null },
  day: string,
) {
  return !current.startDate || current.endDate
    ? { startDate: day, endDate: null }
    : normalizeRange(current.startDate, day);
}

export function dateBounds(range: DateRange) {
  const normalized = normalizeRange(range.startDate, range.endDate);
  return {
    start: startOfDay(parseISO(normalized.startDate)),
    end: endOfDay(parseISO(normalized.endDate)),
  };
}

export function historyRange(
  filter: string,
  custom?: DateRange,
  now = new Date(),
): DateRange | undefined {
  if (filter === "Custom range") return custom;
  const days =
    filter === "Today"
      ? 1
      : filter === "Last 7 days"
        ? 7
        : filter === "Last 31 days"
          ? 31
          : 0;
  if (days)
    return {
      startDate: format(addDays(now, 1 - days), "yyyy-MM-dd"),
      endDate: format(now, "yyyy-MM-dd"),
    };
  const months =
    filter === "This month"
      ? 1
      : filter === "Last 6 months"
        ? 6
        : filter === "Last 12 months"
          ? 12
          : 0;
  return months
    ? {
        startDate: format(
          startOfMonth(subMonths(now, months - 1)),
          "yyyy-MM-dd",
        ),
        endDate: format(now, "yyyy-MM-dd"),
      }
    : undefined;
}

export function isInRange(timestamp: string, range?: DateRange) {
  if (!range) return true;
  const { start, end } = dateBounds(range);
  const time = Date.parse(timestamp);
  return time >= start.getTime() && time <= end.getTime();
}

export function filterCompletedBatches(
  batches: CompletedBatch[],
  search: string,
  range?: DateRange,
) {
  const term = search.trim().toLowerCase();
  return batches
    .filter(
      (batch) =>
        batch.batch_code.toLowerCase().includes(term) &&
        isInRange(batch.completion_date, range),
    )
    .sort(
      (a, b) => Date.parse(b.completion_date) - Date.parse(a.completion_date),
    );
}

export function sensorRange(
  period: SensorPeriod,
  anchor: Date,
  custom?: DateRange,
): DateRange {
  if (period === "Custom range" && custom) return custom;
  const start =
    period === "Per week"
      ? startOfWeek(anchor, { weekStartsOn: 1 })
      : period === "Per month"
        ? startOfMonth(anchor)
        : startOfDay(anchor);
  const end =
    period === "Per week"
      ? endOfWeek(anchor, { weekStartsOn: 1 })
      : period === "Per month"
        ? endOfMonth(anchor)
        : endOfDay(anchor);
  return {
    startDate: format(start, "yyyy-MM-dd"),
    endDate: format(end, "yyyy-MM-dd"),
  };
}

export interface ChartPoint {
  x: number;
  value: number | null;
  label: string;
}
export function aggregateReadings(
  readings: HistoryReading[],
  range: DateRange,
  hourly: boolean,
) {
  const { start, end } = dateBounds(range);
  const endExclusive = addDays(startOfDay(end), 1);
  const slots: Date[] = [];
  for (
    let cursor = start;
    cursor < endExclusive;
    cursor = hourly ? addHours(cursor, 1) : addDays(cursor, 1)
  )
    slots.push(cursor);
  const buckets = new Map<number, HistoryReading[]>();
  for (const reading of readings) {
    if (!isInRange(reading.recorded_at, range)) continue;
    const date = parseISO(reading.recorded_at);
    const key = (hourly ? startOfHour(date) : startOfDay(date)).getTime();
    buckets.set(key, [...(buckets.get(key) ?? []), reading]);
  }
  const series = {} as Record<SensorKey, ChartPoint[]>;
  for (const sensor of ["temperature", "moisture", "oxygen", "co2"] as const) {
    series[sensor] = slots.map((slot) => {
      const values = (buckets.get(slot.getTime()) ?? [])
        .map((reading) => reading[sensor])
        .filter((value): value is number => value !== null);
      return {
        label: format(slot, hourly ? "HH:mm" : "MMM d"),
        x:
          (slot.getTime() - start.getTime()) /
          (endExclusive.getTime() - start.getTime()),
        value: values.length
          ? values.reduce((sum, value) => sum + value, 0) / values.length
          : null,
      };
    });
  }
  return series;
}

export function selectHistory(
  readings: HistoryReading[],
  events: HistoryEvent[],
  scope: HistoryScope,
  batch?: CompletedBatch,
) {
  const matches = (
    item: { machine_id: string; batch_id: string | null },
    timestamp: string,
  ) => {
    if (scope.kind === "machine") return item.machine_id === scope.machineId;
    return (
      !!batch &&
      batch.batch_id === scope.batchId &&
      item.batch_id === scope.batchId &&
      item.machine_id === batch.machine_id &&
      Date.parse(timestamp) >= Date.parse(batch.start_date) &&
      Date.parse(timestamp) <= Date.parse(batch.completion_date)
    );
  };
  return {
    readings: readings
      .filter((item) => matches(item, item.recorded_at))
      .sort((a, b) => Date.parse(a.recorded_at) - Date.parse(b.recorded_at)),
    logs: events
      .filter((item) => matches(item, item.created_at))
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)),
  };
}

export function groupHistoryEvents(events: HistoryEvent[], range?: DateRange) {
  const groups = new Map<string, HistoryEvent[]>();
  const filtered = events
    .filter((event) => isInRange(event.created_at, range))
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  for (const event of filtered) {
    const date = format(parseISO(event.created_at), "yyyy-MM-dd");
    const group = groups.get(date);
    if (group) group.push(event);
    else groups.set(date, [event]);
  }
  return Array.from(groups, ([date, data]) => ({
    title: format(parseISO(date), "MMMM d, yyyy"),
    data,
  }));
}
