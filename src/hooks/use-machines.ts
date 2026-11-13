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

function mergeReadings(
  remote?: Machine["latestReadings"],
  cached?: Machine["latestReadings"],
): Machine["latestReadings"] | undefined {
  if (!cached) return remote;
  if (!remote) return cached;
  const remoteTime = Date.parse(remote.updatedAt);
  const cachedTime = Date.parse(cached.updatedAt);
  if (cachedTime > remoteTime) {
    return cached;
  }
  return remote;
}

export function useMachines(enabled = true) {
  const queryClient =
    typeof useQueryClient === "function" ? useQueryClient() : undefined;
  const { user, isLoaded, isSignedIn } = useAuthContext();
  const profile = useProfile();
  const ready = isLoaded && isSignedIn && !!user && profile.isSuccess;
  const listKey = machineKeys.list(user?.id, profile.data?.barangayId);
  const query = useQuery({
    queryKey: listKey,
    enabled: enabled && ready,
    staleTime: 0,
    queryFn: async () => {
      if (!ready) throw new Error("User profile is not ready");
      const remote = await machineApi.getMachines();
      const cached = queryClient?.getQueryData<Machine[]>(listKey);
      return remote.map((m) => {
        const cachedItem = cached?.find((c) => c.id === m.id);
        const merged = mergeReadings(
          m.latestReadings,
          cachedItem?.latestReadings,
        );
        return merged ? { ...m, latestReadings: merged } : m;
      });
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

export function useMachine(id: string, enabled = true) {
  const queryClient =
    typeof useQueryClient === "function" ? useQueryClient() : undefined;
  const { user, isLoaded, isSignedIn } = useAuthContext();
  const profile = useProfile();
  const ready = isLoaded && isSignedIn && !!user && profile.isSuccess;
  const detailKey = machineKeys.detail(user?.id, profile.data?.barangayId, id);
  const query = useQuery({
    queryKey: detailKey,
    enabled: enabled && ready && !!id,
    staleTime: 0,
    retry: false,
    queryFn: async () => {
      if (!ready) throw new Error("User profile is not ready");
      const remote = await machineApi.getMachine(id);
      const cached = queryClient?.getQueryData<Machine>(detailKey);
      const listCached = queryClient
        ?.getQueryData<Machine[]>(
          machineKeys.list(user?.id, profile.data?.barangayId),
        )
        ?.find((c) => c.id === id);
      const cachedReadings =
        cached?.latestReadings ?? listCached?.latestReadings;
      const merged = mergeReadings(remote.latestReadings, cachedReadings);
      return merged ? { ...remote, latestReadings: merged } : remote;
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
      const validName = machineNameSchema.parse(name);
      return machineApi.updateMachine(id, { name: validName });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: machineKeys.all });
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === "machines" &&
          query.queryKey.includes(variables.id),
      });
    },
  });
}

export function useUpdateMachineWifi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      wifiSsid,
    }: {
      id: string;
      wifiSsid: string;
    }) => {
      const validSsid = machineSsidSchema.parse(wifiSsid);
      return machineApi.updateMachine(id, { wifiSsid: validSsid });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: machineKeys.all });
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === "machines" &&
          query.queryKey.includes(variables.id),
      });
    },
  });
}

export function useRemoveMachine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => machineApi.removeMachine(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: machineKeys.all });
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === "machines" &&
          query.queryKey.includes(id),
      });
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
    enabled: !!id,
    queryFn: async ({ signal }) => {
      try {
        return await machineApi.getOverview(id, signal);
      } catch {
        return null;
      }
    },
  });
}
