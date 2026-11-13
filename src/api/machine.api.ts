import { api } from "./client";
import { machineSchema, type Machine } from "@/types/machine";
import {
  machineOverviewSchema,
  type MachineOverview,
} from "@/lib/machine-overview";
import {
  historyEventSchema,
  type HistoryEvent,
} from "@/types/history";

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
  getOverview: async (
    id: string,
    signal?: AbortSignal,
  ): Promise<MachineOverview> =>
    machineOverviewSchema.parse(
      await api.get<unknown>(`/machines/${encodeURIComponent(id)}/overview`, {
        signal,
      }),
    ),
  getAutomationLogs: async (
    id: string,
    params?: {
      startDate?: string;
      endDate?: string;
      type?: string;
      limit?: number;
      offset?: number;
    },
    signal?: AbortSignal,
  ): Promise<HistoryEvent[]> => {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.set("startDate", params.startDate);
    if (params?.endDate) searchParams.set("endDate", params.endDate);
    if (params?.type) searchParams.set("type", params.type);
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.offset) searchParams.set("offset", String(params.offset));

    const queryString = searchParams.toString();
    const endpoint = `/machines/${encodeURIComponent(id)}/automation-logs${queryString ? `?${queryString}` : ""}`;

    return historyEventSchema
      .array()
      .parse(await api.get<unknown>(endpoint, { signal }));
  },
};
