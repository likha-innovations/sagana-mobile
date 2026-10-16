import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  type Feedstock,
  type CompostBatch,
  type BatchFeedstock,
  type CreateBatchInput,
  type DashboardMetrics,
  createBatchInputSchema,
  completedBatchSchema,
} from "@/types/batch";
import {
  machineKeys,
  setMockMachineStatus,
  useMachines,
} from "@/hooks/use-machines";
import {
  getDashboardMetrics,
  getRecentCompletedBatches,
} from "@/lib/dashboard";
import { feedstockApi } from "@/api/feedstock.api";

let mockActiveBatches: CompostBatch[] = [];

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
  return useQuery({
    queryKey: batchKeys.all,
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 150));
      return [...mockActiveBatches];
    },
  });
}

// Directly returns active batch DTO with nested feedstocks
export function useActiveBatch(machineId: string) {
  return useQuery({
    queryKey: batchKeys.active(machineId),
    queryFn: async (): Promise<CompostBatch | null> => {
      await new Promise((resolve) => setTimeout(resolve, 150));
      const batch = mockActiveBatches.find(
        (b) => b.machine_id === machineId && b.status === "active",
      );
      return batch ? { ...batch } : null;
    },
  });
}

export function useCompletedBatches(enabled = true) {
  return useQuery({
    queryKey: ["batches", "completed"],
    enabled,
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 150));
      return completedBatchSchema.array().parse([]);
    },
  });
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
    mutationFn: async (rawInput: CreateBatchInput) => {
      const input = createBatchInputSchema.parse(rawInput);
      await new Promise((resolve) => setTimeout(resolve, 350));

      const totalWeight = Number(
        input.feedstocks.reduce((acc, f) => acc + f.weight, 0).toFixed(2),
      );
      const batchId = `batch-${Date.now()}`;
      const now = new Date();
      const codeDate = now.toISOString().slice(0, 10).replace(/-/g, "");
      const codeRand = Math.floor(100 + Math.random() * 900);
      const batchCode = `BATCH-${codeDate}-${codeRand}`;

      const cachedFeedstocks =
        queryClient.getQueryData<Feedstock[]>(batchKeys.feedstocks) ?? [];

      const feedstocks: BatchFeedstock[] = input.feedstocks.map((item, idx) => {
        const itemId = item.id;
        const master = cachedFeedstocks.find((f) => f.id === itemId);
        return {
          id: `bf-${Date.now()}-${idx}`,
          feedstockId: itemId,
          name: master?.name ?? "Feedstock",
          category: master?.category ?? "green",
          weight_kg: item.weight,
        };
      });

      const newBatch: CompostBatch = {
        batch_id: batchId,
        machine_id: input.machine_id,
        user_id: "user_current",
        total_weight: totalWeight,
        batch_code: batchCode,
        start_date: now.toISOString(),
        completion_date: null,
        status: "active",
        feedstocks,
      };

      mockActiveBatches.push(newBatch);
      setMockMachineStatus(input.machine_id, "active");

      return newBatch;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: batchKeys.all });
      queryClient.invalidateQueries({
        queryKey: batchKeys.active(variables.machine_id),
      });
      queryClient.invalidateQueries({ queryKey: machineKeys.all });
    },
  });
}
