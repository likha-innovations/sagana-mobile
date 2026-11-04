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
        batch.batchCode.toLowerCase().includes(term) &&
        isInRange(batch.completionDate, range),
    )
    .sort(
      (a, b) => Date.parse(b.completionDate) - Date.parse(a.completionDate),
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
  recordedAt?: string;
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
  const buckets = new Map<number, Partial<Record<SensorKey, HistoryReading>>>();
  const sensors: SensorKey[] = ["temperature", "moisture", "oxygen", "co2"];
  for (const reading of readings) {
    const date = parseISO(reading.recordedAt);
    if (date < start || date >= endExclusive) continue;
    const key = (hourly ? startOfHour(date) : startOfDay(date)).getTime();
    const bucket = buckets.get(key) ?? {};
    for (const sensor of sensors) {
      const previous = bucket[sensor];
      if (reading[sensor] !== null && (!previous || reading.recordedAt > previous.recordedAt)) {
        bucket[sensor] = reading;
      }
    }
    buckets.set(key, bucket);
  }
  const series = {} as Record<SensorKey, ChartPoint[]>;
  for (const sensor of sensors) {
    series[sensor] = slots.map((slot) => {
      const reading = buckets.get(slot.getTime())?.[sensor];
      return {
        label: format(slot, hourly ? "HH:mm" : "MMM d"),
        x:
          (slot.getTime() - start.getTime()) /
          (endExclusive.getTime() - start.getTime()),
        value: reading?.[sensor] ?? null,
        recordedAt: reading?.recordedAt,
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
    item: { machineId: string; batchId: string | null },
    timestamp: string,
  ) => {
    if (scope.kind === "machine") return item.machineId === scope.machineId;
    return (
      !!batch &&
      batch.id === scope.batchId &&
      item.batchId === scope.batchId &&
      item.machineId === batch.machineId &&
      Date.parse(timestamp) >= Date.parse(batch.startDate) &&
      Date.parse(timestamp) <= Date.parse(batch.completionDate)
    );
  };
  return {
    readings: readings
      .filter((item) => matches(item, item.recordedAt))
      .sort((a, b) => Date.parse(a.recordedAt) - Date.parse(b.recordedAt)),
    logs: events
      .filter((item) => matches(item, item.createdAt))
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
  };
}

export function groupHistoryEvents(events: HistoryEvent[], range?: DateRange) {
  const groups = new Map<string, HistoryEvent[]>();
  const filtered = events
    .filter((event) => isInRange(event.createdAt, range))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  for (const event of filtered) {
    const date = format(parseISO(event.createdAt), "yyyy-MM-dd");
    const group = groups.get(date);
    if (group) group.push(event);
    else groups.set(date, [event]);
  }
  return Array.from(groups, ([date, data]) => ({
    title: format(parseISO(date), "MMMM d, yyyy"),
    data,
  }));
}
