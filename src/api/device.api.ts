import { api } from './client';
import { PublishCommandInput, RegisterMachinePayload, RegisteredMachine } from '@/types';

// Telemetry & IoT REST API Endpoints (sagana-backend TelemetryController & MachinesController)
export const deviceApi = {
  // POST /telemetry/devices/:deviceId/command — Dispatches command to MQTT broker
  sendCommand: (deviceId: string, data: PublishCommandInput) =>
    api.post<{ success: boolean; deviceId: string; action: string; timestamp: string }>(
      `/telemetry/devices/${deviceId}/command`,
      data
    ),

  // POST /machines/register — Registers new AIVSP machine to operator barangay
  registerMachine: (payload: RegisterMachinePayload) =>
    api.post<RegisteredMachine>('/machines/register', payload),
};
