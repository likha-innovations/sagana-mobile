import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Machine } from "@/types/machine";
import {
  machineOverviewSchema,
  machineNameSchema,
  machineSsidSchema,
} from "@/lib/machine-overview";
import mockData from "@/data/data.json";

// Initialize mutable state from the global JSON
let mockMachines: Machine[] = [...(mockData.machines as Machine[])];

// ponytail: direct in-memory mutation helper for mock state transition
export function setMockMachineStatus(id: string, status: Machine["status"]) {
  const idx = mockMachines.findIndex((m) => m.machine_id === id);
  if (idx > -1) {
    const updated = { ...mockMachines[idx], status };
    if (status === "active" && !updated.latest_readings) {
      updated.latest_readings = {
        temperature: 32,
        moisture: 45,
        oxygen: 68,
        co2: 0.03,
        updated_at: new Date().toISOString(),
      };
    }
    mockMachines[idx] = updated;
  }
}

export const machineKeys = {
  all: ["machines"] as const,
  detail: (id: string) => ["machines", id] as const,
  feedstocks: (id: string) => ["machines", id, "feedstocks"] as const,
};

export function useMachines(enabled = true) {
  return useQuery({
    queryKey: machineKeys.all,
    enabled,
    queryFn: async () => {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 300));
      return [...mockMachines]; // Return a copy
    },
  });
}

export function useMachine(id: string) {
  return useQuery({
    queryKey: machineKeys.detail(id),
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const machine = mockMachines.find((m) => m.machine_id === id);
      if (!machine) throw new Error("Machine not found");
      return { ...machine };
    },
  });
}

export function useUpdateMachineName() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const idx = mockMachines.findIndex((m) => m.machine_id === id);
      if (idx < 0) throw new Error("Machine not found");
      mockMachines[idx] = {
        ...mockMachines[idx],
        name: machineNameSchema.parse(name),
      };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: machineKeys.all });
      queryClient.invalidateQueries({
        queryKey: machineKeys.detail(variables.id),
      });
    },
  });
}

export function useUpdateMachineWifi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      wifi_ssid,
    }: {
      id: string;
      wifi_ssid: string;
    }) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const idx = mockMachines.findIndex((m) => m.machine_id === id);
      if (idx < 0) throw new Error("Machine not found");
      mockMachines[idx] = {
        ...mockMachines[idx],
        wifi_ssid: machineSsidSchema.parse(wifi_ssid),
      };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: machineKeys.all });
      queryClient.invalidateQueries({
        queryKey: machineKeys.detail(variables.id),
      });
    },
  });
}

export function useRemoveMachine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      mockMachines = mockMachines.filter((m) => m.machine_id !== id);
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: machineKeys.all });
      queryClient.invalidateQueries({ queryKey: machineKeys.detail(id) });
    },
  });
}

export function useMachineOverview(id: string) {
  return useQuery({
    queryKey: ["machine-overview", id],
    queryFn: async () => {
      const records = machineOverviewSchema
        .array()
        .parse(mockData.machine_overviews);
      return records.find((record) => record.machine_id === id) ?? null;
    },
  });
}
