import { z } from "zod";

export const historyReadingSchema = z.object({
  machine_id: z.string(),
  batch_id: z.string().nullable(),
  recorded_at: z.string().datetime(),
  temperature: z.number().finite().nullable(),
  moisture: z.number().min(0).max(100).nullable(),
  oxygen: z.number().min(0).max(100).nullable(),
  co2: z.number().min(0).max(100).nullable(),
});
export type HistoryReading = z.infer<typeof historyReadingSchema>;
export type SensorKey = "temperature" | "moisture" | "oxygen" | "co2";

export const historyEventSchema = z.object({
  id: z.string(),
  machine_id: z.string(),
  batch_id: z.string().nullable(),
  created_at: z.string().datetime(),
  type: z.enum([
    "blower_on",
    "blower_off",
    "sprinkler_on",
    "sprinkler_off",
    "emergency_stop",
    "ventilation_adjust",
  ]),
  message: z.string(),
});
export type HistoryEvent = z.infer<typeof historyEventSchema>;
export interface DateRange {
  startDate: string;
  endDate: string;
}
export type SensorPeriod =
  "Per day" | "Per week" | "Per month" | "Custom range";

export type HistoryScope =
  { kind: "machine"; machineId: string } | { kind: "batch"; batchId: string };
