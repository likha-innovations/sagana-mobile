import { z } from "zod";

export const historyReadingSchema = z.object({
  machineId: z.string(),
  batchId: z.string().nullable(),
  recordedAt: z.string(),
  temperature: z.number().finite().nullable(),
  moisture: z.number().finite().nullable(),
  oxygen: z.number().finite().nullable(),
  co2: z.number().finite().nullable(),
});
export type HistoryReading = z.infer<typeof historyReadingSchema>;
export type SensorKey = "temperature" | "moisture" | "oxygen" | "co2";

export const sensorMetaSchema = z.object({
  id: z.string().optional(),
  machineId: z.string().optional(),
  sensorType: z.string(),
  location: z.string().nullable().optional(),
  unit: z.string().nullable().optional(),
  status: z.string().optional(),
});
export type SensorMeta = z.infer<typeof sensorMetaSchema>;

export const historyEventSchema = z.object({
  id: z.string(),
  machineId: z.string(),
  batchId: z.string().nullable(),
  createdAt: z.string(),
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
