import { api } from './client';
import { PublishCommandInput, TelemetryReading } from '@/types';

// Telemetry & IoT REST API Endpoints (sagana-backend TelemetryController)
export const deviceApi = {
  // POST /telemetry/devices/:deviceId/command — Dispatches command to MQTT broker
  sendCommand: (deviceId: string, data: PublishCommandInput) =>
    api.post<{ success: boolean; deviceId: string; action: string; timestamp: string }>(
      `/telemetry/devices/${deviceId}/command`,
      data
    ),

  // GET /telemetry/devices/:deviceId/latest — Fetches recent device telemetry
  getLatestReadings: (deviceId: string) =>
    api.get<TelemetryReading[]>(`/telemetry/devices/${deviceId}/latest`),
};
