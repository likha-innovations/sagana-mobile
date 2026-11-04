import { z } from "zod";

export const machineSchema = z.object({
  id: z.string(),
  barangayId: z.string(),
  macAddress: z.string(),
  name: z.string(),
  status: z.enum(["active", "maintenance", "offline", "available"]),
  wifiSsid: z.string().nullable(),
  lastSeen: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  removedAt: z.string().datetime().nullable().optional(),
  sensors: z.array(z.object({ id: z.string(), sensorType: z.string(), location: z.string().nullable(), unit: z.string().nullable(), status: z.string() })).optional(),
  latestReadings: z
    .object({
      temperature: z.number().nullable(),
      moisture: z.number().nullable(),
      oxygen: z.number().nullable(),
      co2: z.number().nullable(),
      updatedAt: z.string().datetime(),
    })
    .optional(),
});
export type Machine = z.infer<typeof machineSchema>;

export const compostingPhaseSchema = z.enum([
  "mesophilic",
  "thermophilic",
  "cooling",
]);
export type CompostingPhase = z.infer<typeof compostingPhaseSchema>;
