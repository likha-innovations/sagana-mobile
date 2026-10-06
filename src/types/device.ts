import { z } from 'zod';

export const publishCommandSchema = z.object({
  action: z.string().min(1, 'Action is required'),
  payload: z.record(z.string(), z.unknown()).optional(),
});

export type PublishCommandInput = z.infer<typeof publishCommandSchema>;

// Telemetry reading structure with dynamic key support
export interface TelemetryData {
  temperature?: number;
  humidity?: number;
  moisture?: number;
  waterLevel?: number;
  [key: string]: unknown;
}

// Log entry for real-time telemetry and command stream
export interface RealtimeEventLog {
  id: string;
  type: 'telemetry' | 'command' | 'connection' | 'error';
  title: string;
  payload: unknown;
  timestamp: string;
}

export const machineSchema = z.object({
  machine_id: z.string(),
  barangay_id: z.string(),
  mac_address: z.string(),
  name: z.string(),
  status: z.enum(['active', 'maintenance', 'offline']),
  wifi_ssid: z.string().nullable(),
  last_seen: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
  removed_at: z.string().datetime().nullable(),
  latest_readings: z.object({
    temperature: z.number(),
    moisture: z.number(),
    oxygen: z.number(),
    co2: z.number(),
    updated_at: z.string().datetime()
  }).optional(),
});

export type Machine = z.infer<typeof machineSchema>;

export const feedstockSchema = z.object({
  id: z.string(),
  machine_id: z.string(),
  name: z.string(),
  weight_kg: z.number(),
});
export type Feedstock = z.infer<typeof feedstockSchema>;

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
