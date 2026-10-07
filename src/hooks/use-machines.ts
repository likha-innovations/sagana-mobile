import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Machine, Feedstock, AutomationLog, SensorHistory } from '@/types/device';
import mockData from '@/data/data.json';

// Initialize mutable state from the global JSON
let mockMachines: Machine[] = [...(mockData.machines as Machine[])];

export const machineKeys = {
  all: ['machines'] as const,
  detail: (id: string) => ['machines', id] as const,
  feedstocks: (id: string) => ['machines', id, 'feedstocks'] as const,
  logs: (id: string) => ['machines', id, 'logs'] as const,
  history: (id: string) => ['machines', id, 'history'] as const,
};

export function useMachines() {
  return useQuery({
    queryKey: machineKeys.all,
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
      if (!machine) throw new Error('Machine not found');
      return { ...machine };
    },
  });
}

export function useFeedstocks(machineId: string) {
  return useQuery({
    queryKey: machineKeys.feedstocks(machineId),
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return mockData.feedstocks.filter((f) => f.machine_id === machineId) as Feedstock[];
    },
  });
}

export function useAutomationLogs(machineId: string) {
  return useQuery({
    queryKey: machineKeys.logs(machineId),
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return mockData.automation_logs.filter((l) => l.machine_id === machineId) as AutomationLog[];
    },
  });
}

export function useSensorHistory(machineId: string, date: string) {
  return useQuery({
    queryKey: [...machineKeys.history(machineId), date] as const,
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const history = mockData.sensor_history.find((h) => h.machine_id === machineId && h.date === date) as SensorHistory | undefined;
      return history || null;
    },
  });
}

export function useUpdateMachineName() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const idx = mockMachines.findIndex((m) => m.machine_id === id);
      if (idx > -1) {
        mockMachines[idx] = { ...mockMachines[idx], name };
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: machineKeys.all });
      queryClient.invalidateQueries({ queryKey: machineKeys.detail(variables.id) });
    },
  });
}

export function useUpdateMachineWifi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, wifi_ssid }: { id: string; wifi_ssid: string }) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const idx = mockMachines.findIndex((m) => m.machine_id === id);
      if (idx > -1) {
        mockMachines[idx] = { ...mockMachines[idx], wifi_ssid };
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: machineKeys.all });
      queryClient.invalidateQueries({ queryKey: machineKeys.detail(variables.id) });
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
