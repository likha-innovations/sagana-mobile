import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  type CompostBatch,
  type BatchFeedstock,
  type CreateBatchInput,
  type DashboardMetrics,
  createBatchInputSchema,
} from "@/types/batch";
import {
  machineKeys,
  useMachines,
} from "@/hooks/use-machines";
import {
  getDashboardMetrics,
  getRecentCompletedBatches,
} from "@/lib/dashboard";
import { feedstockApi } from "@/api/feedstock.api";
import { batchApi } from "@/api/batch.api";
import { useAuthContext } from "@/context/auth-context";
import { useProfile } from "./use-profile";

export { type BatchFeedstock, type CompostBatch, type DashboardMetrics };

export const batchKeys = {
  all: ["batches"] as const,
  feedstocks: ["feedstocks"] as const,
  active: (machineId: string) => ["batches", "active", machineId] as const,
  detail: (id: string) => ["batches", id] as const,
};

export function useFeedstocks() {
  return useQuery({
    queryKey: batchKeys.feedstocks,
    queryFn: feedstockApi.getFeedstocks,
    staleTime: 1000 * 60 * 60,
  });
}

export function useCompostBatches() {
  const { user, isLoaded, isSignedIn } = useAuthContext();
  const profile = useProfile();
  const ready = isLoaded && isSignedIn && !!user && profile.isSuccess;
  const query = useQuery({
    queryKey: [...batchKeys.all, user?.id, profile.data?.barangayId, "list"],
    enabled: ready,
    queryFn: batchApi.list,
  });
  return { ...query, data: ready && !query.isError ? query.data : undefined, isError: profile.isError || query.isError, isPending: !profile.isError && query.isPending, refetch: profile.isError ? profile.refetch : query.refetch };
}

export function useBatch(id: string, enabled = true) {
  const { user, isLoaded, isSignedIn } = useAuthContext();
  const profile = useProfile();
  const ready = isLoaded && isSignedIn && !!user && profile.isSuccess;
  const query = useQuery({
    queryKey: [...batchKeys.all, user?.id, profile.data?.barangayId, "detail", id],
    enabled: enabled && ready && !!id,
    staleTime: 0,
    retry: false,
    queryFn: async () => {
      if (!ready) throw new Error("User profile is not ready");
      return batchApi.get(id);
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

// Directly returns active batch DTO with nested feedstocks
export function useActiveBatch(machineId: string) {
  const query = useCompostBatches();
  return { ...query, data: query.data?.find((batch) => batch.machineId === machineId && batch.status === "active") ?? (query.data ? null : undefined) };
}

export function useCompletedBatches(enabled = true) {
  const { user, isLoaded, isSignedIn } = useAuthContext();
  const profile = useProfile();
  const ready = isLoaded && isSignedIn && !!user && profile.isSuccess;
  const query = useQuery({
    queryKey: ["batches", user?.id, profile.data?.barangayId, "completed"],
    enabled: enabled && ready,
    queryFn: batchApi.completed,
  });
  return { ...query, data: ready && !query.isError ? query.data : undefined, isError: profile.isError || query.isError, isPending: !profile.isError && query.isPending, refetch: profile.isError ? profile.refetch : query.refetch };
}

export function useDashboardMetrics() {
  const machines = useMachines();
  const batches = useCompostBatches();
  const completed = useCompletedBatches();
  return {
    data:
      completed.data && batches.data && machines.data
        ? getDashboardMetrics(completed.data, batches.data, machines.data)
        : undefined,
    recentCompleted: completed.data
      ? getRecentCompletedBatches(completed.data)
      : [],
    isPending: machines.isPending || batches.isPending || completed.isPending,
    isError: machines.isError || batches.isError || completed.isError,
    isFetching:
      machines.isFetching || batches.isFetching || completed.isFetching,
    refetch: () =>
      Promise.all([machines.refetch(), batches.refetch(), completed.refetch()]),
  };
}

export function useCreateCompostBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateBatchInput) => batchApi.create(createBatchInputSchema.parse(input)),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: batchKeys.all });
      queryClient.invalidateQueries({
        queryKey: batchKeys.active(variables.machineId),
      });
      queryClient.invalidateQueries({ queryKey: machineKeys.all });
    },
  });
}

export function useFinishCompostBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: batchApi.finish,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: batchKeys.all });
      queryClient.invalidateQueries({ queryKey: machineKeys.all });
    },
  });
}
