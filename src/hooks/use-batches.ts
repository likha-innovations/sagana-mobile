import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  type Feedstock,
  type CompostBatch,
  type BatchFeedstock,
  type CreateBatchInput,
  type DashboardMetrics,
  createBatchInputSchema,
} from '@/types/batch';
import { machineKeys, setMockMachineStatus } from '@/hooks/use-machines';
import mockData from '@/data/data.json';

// In-memory mock store holding backend-aligned DTO objects
let mockFeedstocks: Feedstock[] = [
  ...((mockData.feedstocks ?? []) as Feedstock[]),
];
let mockActiveBatches: CompostBatch[] = [
  ...((mockData.active_batches ?? []) as CompostBatch[]),
];

export { type BatchFeedstock, type CompostBatch, type DashboardMetrics };

export const batchKeys = {
  all: ['batches'] as const,
  feedstocks: ['feedstocks'] as const,
  active: (machineId: string) => ['batches', 'active', machineId] as const,
  metrics: ['batches', 'metrics'] as const,
  detail: (id: string) => ['batches', id] as const,
};

export function useFeedstocks() {
  return useQuery({
    queryKey: batchKeys.feedstocks,
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 150));
      return [...mockFeedstocks];
    },
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
        (b) => b.machine_id === machineId && b.status === 'active'
      );
      return batch ? { ...batch } : null;
    },
  });
}

export function useDashboardMetrics() {
  return useQuery({
    queryKey: batchKeys.metrics,
    queryFn: async (): Promise<DashboardMetrics> => {
      await new Promise((resolve) => setTimeout(resolve, 150));
      return { ...mockData.dashboard_metrics };
    },
  });
}

export function useCreateCompostBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rawInput: CreateBatchInput) => {
      const input = createBatchInputSchema.parse(rawInput);
      await new Promise((resolve) => setTimeout(resolve, 350));

      const totalWeight = Number(
        input.feedstocks.reduce((acc, f) => acc + f.weight, 0).toFixed(2)
      );
      const batchId = `batch-${Date.now()}`;
      const now = new Date();
      const codeDate = now.toISOString().slice(0, 10).replace(/-/g, '');
      const codeRand = Math.floor(100 + Math.random() * 900);
      const batchCode = `BATCH-${codeDate}-${codeRand}`;

      const feedstocks: BatchFeedstock[] = input.feedstocks.map((item, idx) => {
        const master = mockFeedstocks.find((f) => f.feedstock_id === item.feedstock_id);
        return {
          id: `bf-${Date.now()}-${idx}`,
          feedstock_id: item.feedstock_id,
          name: master?.name ?? 'Feedstock',
          category: master?.category ?? 'Greens',
          weight_kg: item.weight,
        };
      });

      const newBatch: CompostBatch = {
        batch_id: batchId,
        machine_id: input.machine_id,
        user_id: 'user_current',
        total_weight: totalWeight,
        batch_code: batchCode,
        start_date: now.toISOString(),
        completion_date: null,
        status: 'active',
        feedstocks,
      };

      mockActiveBatches.push(newBatch);
      setMockMachineStatus(input.machine_id, 'active');

      return newBatch;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: batchKeys.all });
      queryClient.invalidateQueries({ queryKey: batchKeys.active(variables.machine_id) });
      queryClient.invalidateQueries({ queryKey: batchKeys.metrics });
      queryClient.invalidateQueries({ queryKey: machineKeys.all });
      queryClient.invalidateQueries({ queryKey: machineKeys.detail(variables.machine_id) });
      queryClient.invalidateQueries({ queryKey: machineKeys.feedstocks(variables.machine_id) });
    },
  });
}
