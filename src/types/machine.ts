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
  latestReadings: z
    .object({
      temperature: z.number(),
      moisture: z.number(),
      oxygen: z.number(),
      co2: z.number(),
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
