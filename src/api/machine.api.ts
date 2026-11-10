import { api } from "./client";
import { machineSchema, type Machine } from "@/types/machine";

export const machineApi = {
  getMachines: async (): Promise<Machine[]> =>
    machineSchema.array().parse(await api.get<unknown>("/machines")),
  getMachine: async (id: string): Promise<Machine> =>
    machineSchema.parse(
      await api.get<unknown>(`/machines/${encodeURIComponent(id)}`),
    ),
  updateMachine: async (
    id: string,
    payload: { name?: string; wifiSsid?: string },
  ): Promise<Machine> =>
    machineSchema.parse(
      await api.patch<unknown>(
        `/machines/${encodeURIComponent(id)}`,
        payload,
      ),
    ),
  removeMachine: async (
    id: string,
  ): Promise<{ success: boolean; message: string }> =>
    api.delete<{ success: boolean; message: string }>(
      `/machines/${encodeURIComponent(id)}`,
    ),
};
