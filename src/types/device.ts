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


export const machineRegistrationSchema = z.object({
  ssid: z.string().min(1, 'Please enter required field'),
  password: z.string().min(1, 'Please enter required field'),
  machineName: z.string().min(1, 'Please enter required field'),
});
export type MachineRegistrationInput = z.infer<typeof machineRegistrationSchema>;

export const registerMachinePayloadSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  mac_address: z.string().min(1, 'Device identifier is required'),
  wifi_ssid: z.string().min(1, 'WiFi SSID is required'),
});
export type RegisterMachinePayload = z.infer<typeof registerMachinePayloadSchema>;

export interface RegisteredMachine {
  id: string;
  barangayId: string;
  macAddress: string;
  name: string;
  wifiSsid: string;
  status: string;
}
