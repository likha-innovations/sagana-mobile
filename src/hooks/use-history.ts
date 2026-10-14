import { useQuery } from "@tanstack/react-query";
import mockData from "@/data/data.json";
import {
  historyReadingSchema,
  historyEventSchema,
  type HistoryScope,
} from "@/types/history";
import { selectHistory } from "@/lib/history";
import { useCompletedBatches } from "./use-batches";
import { useMachines } from "./use-machines";

export function useHistory(scope: HistoryScope) {
  const batches = useCompletedBatches(scope.kind === "batch");
  const machines = useMachines(scope.kind === "machine");
  const batch =
    scope.kind === "batch"
      ? batches.data?.find((item) => item.batch_id === scope.batchId)
      : undefined;
  const machine =
    scope.kind === "machine"
      ? machines.data?.find((item) => item.machine_id === scope.machineId)
      : undefined;
  const entity = scope.kind === "batch" ? batch : machine;
  const metadata = scope.kind === "batch" ? batches : machines;
  const id = scope.kind === "batch" ? scope.batchId : scope.machineId;
  const history = useQuery({
    queryKey: ["history", scope.kind, id],
    enabled: !!entity,
    queryFn: async () =>
      selectHistory(
        historyReadingSchema.array().parse(mockData.history_readings),
        historyEventSchema.array().parse(mockData.history_events),
        scope,
        batch,
      ),
  });
  return {
    exists: !!entity,
    startDate: batch?.start_date ?? machine?.created_at,
    endDate: batch?.completion_date ?? new Date().toISOString(),
    readings: entity ? (history.data?.readings ?? []) : [],
    logs: entity ? (history.data?.logs ?? []) : [],
    isPending: metadata.isPending || (!!entity && history.isPending),
    isError: metadata.isError || (!!entity && history.isError),
    isFetching: metadata.isFetching || (!!entity && history.isFetching),
    refetch: () =>
      Promise.all([metadata.refetch(), ...(entity ? [history.refetch()] : [])]),
  };
}
