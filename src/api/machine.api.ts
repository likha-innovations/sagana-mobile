import { api } from "./client";
import { machineSchema, type Machine } from "@/types/machine";
import { historyReadingSchema } from "@/types/history";
import { z } from "zod";

export const machineApi = {
  getMachines: async (): Promise<Machine[]> =>
    machineSchema.array().parse(await api.get<unknown>("/machines")),
  getMachine: async (id: string): Promise<Machine> => {
    const path = `/machines/${encodeURIComponent(id)}`;
    const [rawMachine, rawHistory] = await Promise.all([
      api.get<unknown>(path), api.get<unknown>(`${path}/readings?limit=500`),
    ]);
    const machine = machineSchema.parse(rawMachine);
    const { readings, sensors } = z.object({ readings: historyReadingSchema.array(), sensors: machineSchema.shape.sensors }).parse(rawHistory);
    if (!readings.length) return sensors ? { ...machine, sensors } : machine;
    const latest = (key: "temperature" | "moisture" | "oxygen" | "co2") => readings.find((reading) => reading[key] !== null)?.[key] ?? null;
    return { ...machine, sensors, latestReadings: { temperature: latest("temperature"), moisture: latest("moisture"), oxygen: latest("oxygen"), co2: latest("co2"), updatedAt: readings[0].recordedAt } };
  },
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
