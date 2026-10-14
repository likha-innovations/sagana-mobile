import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Machine } from "@/types/machine";
import type { RegisterMachinePayload } from "@/types/device";
import { deviceApi } from "@/api/device.api";
import { machineApi } from "@/api/machine.api";
import { useAuthContext } from "@/context/auth-context";
import { useProfile } from "./use-profile";
import {
  machineOverviewSchema,
  machineNameSchema,
  machineSsidSchema,
} from "@/lib/machine-overview";
let mockMachines: Machine[] = [];

// ponytail: direct in-memory mutation helper for mock state transition
export function setMockMachineStatus(id: string, status: Machine["status"]) {
  const idx = mockMachines.findIndex((m) => m.machine_id === id);
  if (idx > -1) {
    mockMachines[idx] = { ...mockMachines[idx], status };
  }
}

export const machineKeys = {
  all: ["machines"] as const,
  list: (userId: string | undefined, barangayId: string | null | undefined) =>
    ["machines", userId, barangayId, "list"] as const,
  detail: (
    userId: string | undefined,
    barangayId: string | null | undefined,
    id: string,
  ) => ["machines", userId, barangayId, "detail", id] as const,
};

export function useMachines(enabled = true) {
  const { user, isLoaded, isSignedIn } = useAuthContext();
  const profile = useProfile();
  const ready = isLoaded && isSignedIn && !!user && profile.isSuccess;
  const query = useQuery({
    queryKey: machineKeys.list(user?.id, profile.data?.barangayId),
    enabled: enabled && ready,
    staleTime: 0,
    queryFn: async () => {
      if (!ready) throw new Error("User profile is not ready");
      return machineApi.getMachines();
    },
  });
  return {
    ...query,
    data: ready && !query.isError ? query.data : undefined,
    isError: profile.isError || query.isError,
    isPending: !profile.isError && query.isPending,
    error: profile.error ?? query.error,
    refetch: profile.isError ? profile.refetch : query.refetch,
  };
}

export function useMachine(id: string) {
  const { user, isLoaded, isSignedIn } = useAuthContext();
  const profile = useProfile();
  const ready = isLoaded && isSignedIn && !!user && profile.isSuccess;
  const query = useQuery({
    queryKey: machineKeys.detail(user?.id, profile.data?.barangayId, id),
    enabled: ready && !!id,
    staleTime: 0,
    retry: false,
    queryFn: async () => {
      if (!ready) throw new Error("User profile is not ready");
      return machineApi.getMachine(id);
    },
  });
  return {
    ...query,
    data: ready && !query.isError ? query.data : undefined,
    isError: profile.isError || query.isError,
    isPending: !profile.isError && query.isPending,
    error: profile.error ?? query.error,
    refetch: profile.isError ? profile.refetch : query.refetch,
  };
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: machineKeys.all });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: machineKeys.all });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: machineKeys.all });
    },
  });
}

export function useRegisterMachine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RegisterMachinePayload) =>
      deviceApi.registerMachine(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: machineKeys.all });
    },
  });
}

export function useMachineOverview(id: string) {
  return useQuery({
    queryKey: ["machine-overview", id],
    queryFn: async () => {
      const records = machineOverviewSchema.array().parse([]);
      return records.find((record) => record.machine_id === id) ?? null;
    },
  });
}
