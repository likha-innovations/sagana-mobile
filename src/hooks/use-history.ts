import { useQuery } from "@tanstack/react-query";
import {
  type HistoryScope,
} from "@/types/history";
import { batchApi } from "@/api/batch.api";
import { useCompletedBatches } from "./use-batches";
import { useMachines } from "./use-machines";
import { useAuthContext } from "@/context/auth-context";
import { useProfile } from "./use-profile";
import { dateBounds, sensorRange } from "@/lib/history";
import type { DateRange, SensorPeriod } from "@/types/history";

export function useHistory(scope: HistoryScope, filter?: { period: SensorPeriod; anchor?: Date; custom?: DateRange }) {
  const { user } = useAuthContext();
  const profile = useProfile();
  const batches = useCompletedBatches(scope.kind === "batch");
  const machines = useMachines(scope.kind === "machine");
  const batch =
    scope.kind === "batch"
      ? batches.data?.find((item) => item.id === scope.batchId)
      : undefined;
  const machine =
    scope.kind === "machine"
      ? machines.data?.find((item) => item.id === scope.machineId)
      : undefined;
  const entity = scope.kind === "batch" ? batch : machine;
  const metadata = scope.kind === "batch" ? batches : machines;
  const id = scope.kind === "batch" ? scope.batchId : scope.machineId;
  const endDate = batch?.completionDate ?? new Date().toISOString();
  const bounds = filter ? dateBounds(sensorRange(filter.period, filter.anchor ?? new Date(endDate), filter.custom)) : undefined;
  const start = bounds?.start.toISOString();
  const end = bounds?.end.toISOString();
  const history = useQuery({
    queryKey: ["history", user?.id, profile.data?.barangayId, scope.kind, id, start, end],
    enabled: !!entity && !!filter,
    staleTime: 60_000,
    queryFn: async ({ signal }) => ({ readings: await batchApi.readings(scope, start!, end!, signal), logs: [] }),
  });
  return {
    exists: !!entity,
    startDate: batch?.startDate ?? machine?.createdAt,
    endDate,
    readings: entity ? (history.data?.readings ?? []) : [],
    logs: entity ? (history.data?.logs ?? []) : [],
    isPending: metadata.isPending || (!!entity && !!filter && history.isPending),
    isError: metadata.isError || (!!entity && !!filter && history.isError),
    isFetching: metadata.isFetching || (!!entity && !!filter && history.isFetching),
    refetch: () =>
      Promise.all([metadata.refetch(), ...(entity && filter ? [history.refetch()] : [])]),
  };
}
