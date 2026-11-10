import { useQuery } from "@tanstack/react-query";
import {
  type HistoryScope,
} from "@/types/history";
import { batchApi } from "@/api/batch.api";
import { useBatch } from "./use-batches";
import { useMachine } from "./use-machines";
import { useAuthContext } from "@/context/auth-context";
import { useProfile } from "./use-profile";
import { dateBounds, sensorRange } from "@/lib/history";
import type { DateRange, SensorPeriod } from "@/types/history";

export function useHistory(scope: HistoryScope, filter?: { period: SensorPeriod; anchor?: Date; custom?: DateRange }) {
  const { user } = useAuthContext();
  const profile = useProfile();
  const batchQuery = useBatch(
    scope.kind === "batch" ? scope.batchId : "",
    scope.kind === "batch",
  );
  const machineQuery = useMachine(
    scope.kind === "machine" ? scope.machineId : "",
    scope.kind === "machine",
  );
  const batch = scope.kind === "batch" ? batchQuery.data : undefined;
  const machine = scope.kind === "machine" ? machineQuery.data : undefined;
  const entity = scope.kind === "batch" ? batch : machine;
  const metadata = scope.kind === "batch" ? batchQuery : machineQuery;
  const id = scope.kind === "batch" ? scope.batchId : scope.machineId;
  const endDate = batch?.completionDate ?? new Date().toISOString();
  const bounds = filter ? dateBounds(sensorRange(filter.period, filter.anchor ?? new Date(endDate), filter.custom)) : undefined;
  const start = bounds?.start.toISOString();
  const end = bounds?.end.toISOString();
  const history = useQuery({
    queryKey: ["history", user?.id, profile.data?.barangayId, scope.kind, id, start, end],
    enabled: !!entity && !!filter,
    staleTime: 60_000,
    queryFn: async ({ signal }) => {
      const data = await batchApi.readings(scope, start!, end!, signal);
      const readings = Array.isArray(data) ? data : (data.readings ?? []);
      const sensors = Array.isArray(data) ? [] : (data.sensors ?? []);
      return { readings, sensors, logs: [] };
    },
  });
  return {
    exists: !!entity,
    startDate: batch?.startDate ?? machine?.createdAt,
    endDate,
    sensors: history.data?.sensors ?? [],
    readings: entity ? (history.data?.readings ?? []) : [],
    logs: entity ? (history.data?.logs ?? []) : [],
    isPending: metadata.isPending || (!!entity && !!filter && history.isPending),
    isError: metadata.isError || (!!entity && !!filter && history.isError),
    isFetching: metadata.isFetching || (!!entity && !!filter && history.isFetching),
    refetch: () =>
      Promise.all([metadata.refetch(), ...(entity && filter ? [history.refetch()] : [])]),
  };
}
