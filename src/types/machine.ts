import { z } from 'zod';

export const machineSchema = z.object({
  machine_id: z.string(),
  barangay_id: z.string(),
  mac_address: z.string(),
  name: z.string(),
  status: z.enum(['active', 'maintenance', 'offline', 'available']),
  wifi_ssid: z.string().nullable(),
  last_seen: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
  removed_at: z.string().datetime().nullable().optional(),
  latest_readings: z.object({
    temperature: z.number(),
    moisture: z.number(),
    oxygen: z.number(),
    co2: z.number(),
    updated_at: z.string().datetime(),
  }).optional(),
});
export type Machine = z.infer<typeof machineSchema>;

export const compostingPhaseSchema = z.enum(['mesophilic', 'thermophilic', 'cooling']);
export type CompostingPhase = z.infer<typeof compostingPhaseSchema>;

export const automationLogSchema = z.object({
  id: z.string(),
  machine_id: z.string(),
  type: z.enum(['blower_on', 'sprinkler_on', 'emergency_stop', 'ventilation_adjust']),
  message: z.string(),
  created_at: z.string().datetime(),
});
export type AutomationLog = z.infer<typeof automationLogSchema>;

export const sensorHistorySchema = z.object({
  machine_id: z.string(),
  date: z.string(),
  temperature: z.array(z.number()),
  moisture: z.array(z.number()),
  oxygen: z.array(z.number()),
  co2: z.array(z.number()),
});
export type SensorHistory = z.infer<typeof sensorHistorySchema>;
