import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Machine, AutomationLog, SensorHistory } from '@/types/machine';
import mockData from '@/data/data.json';

// Initialize mutable state from the global JSON
let mockMachines: Machine[] = [...(mockData.machines as Machine[])];

// ponytail: direct in-memory mutation helper for mock state transition
export function setMockMachineStatus(id: string, status: Machine['status']) {
  const idx = mockMachines.findIndex((m) => m.machine_id === id);
  if (idx > -1) {
    const updated = { ...mockMachines[idx], status };
    if (status === 'active' && !updated.latest_readings) {
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

export function useAutomationLogs(machineId: string, filterType: string = 'Today', dateRange?: { start: string; end: string }) {
  return useQuery({
    queryKey: [...machineKeys.logs(machineId), filterType, dateRange] as const,
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      const realNow = new Date();
      // Dynamically shift mock dates so they always appear as "Today" for demo purposes
      const logs = (mockData.automation_logs.filter((l) => l.machine_id === machineId) as AutomationLog[]).map((l, i) => {
        const shifted = new Date(realNow.getTime() - i * 3600000); // Shift by i hours ago today
        return { ...l, created_at: shifted.toISOString() };
      });
      
      if (filterType === 'All dates') return logs;
      
      return logs.filter((log) => {
        const d = new Date(log.created_at);
        if (filterType === 'Today') return d.toDateString() === realNow.toDateString();
        if (filterType === 'Last 7 days') return (realNow.getTime() - d.getTime()) <= 7 * 24 * 60 * 60 * 1000;
        if (filterType === 'Last 31 days') return (realNow.getTime() - d.getTime()) <= 31 * 24 * 60 * 60 * 1000;
        if (filterType === 'Custom range' && dateRange) {
          const start = new Date(dateRange.start);
          const end = new Date(dateRange.end);
          end.setHours(23, 59, 59, 999);
          return d >= start && d <= end;
        }
        return true;
      });
    },
  });
}

export function useSensorHistory(machineId: string, filterType: string, date: string, dateRange?: { start: string; end: string }) {
  return useQuery({
    queryKey: [...machineKeys.history(machineId), filterType, date, dateRange] as const,
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const history = mockData.sensor_history.find((h) => h.machine_id === machineId) as SensorHistory | undefined;
      
      // If we ask for a specific date in mock that doesn't exist, return empty lines so graph doesn't crash
      if (filterType === 'Per day' && history && history.date !== date) {
        return {
          machine_id: machineId,
          date,
          temperature: [0, 0, 0, 0, 0, 0, 0],
          moisture: [0, 0, 0, 0, 0, 0, 0],
          oxygen: [0, 0, 0, 0, 0, 0, 0],
          co2: [0, 0, 0, 0, 0, 0, 0],
        } as SensorHistory;
      }
      
      return history || {
          machine_id: machineId,
          date,
          temperature: [0, 0, 0, 0, 0, 0, 0],
          moisture: [0, 0, 0, 0, 0, 0, 0],
          oxygen: [0, 0, 0, 0, 0, 0, 0],
          co2: [0, 0, 0, 0, 0, 0, 0],
      };
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
