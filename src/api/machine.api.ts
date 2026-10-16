import { api } from "./client";
import { machineSchema, type Machine } from "@/types/machine";

interface MachineResponse {
  id: string;
  barangayId: string;
  macAddress: string;
  name: string;
  status: string;
  wifiSsid: string | null;
  lastSeen: string | null;
  createdAt: string;
  removedAt: string | null;
}

function toMachine(record: MachineResponse): Machine {
  return machineSchema.parse({
    id: record.id,
    barangay_id: record.barangayId,
    mac_address: record.macAddress,
    name: record.name,
    status: record.status,
    wifi_ssid: record.wifiSsid,
    last_seen: record.lastSeen,
    created_at: record.createdAt,
    removed_at: record.removedAt,
  });
}

export const machineApi = {
  getMachines: async (): Promise<Machine[]> =>
    (await api.get<MachineResponse[]>("/machines")).map(toMachine),
  getMachine: async (id: string): Promise<Machine> =>
    toMachine(
      await api.get<MachineResponse>(`/machines/${encodeURIComponent(id)}`),
    ),
};
