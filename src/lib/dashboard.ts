import type {
  CompletedBatch,
  CompostBatch,
  DashboardMetrics,
} from "../types/batch";
import type { Machine } from "../types/machine";

export function getDashboardMetrics(
  completed: CompletedBatch[],
  batches: CompostBatch[],
  machines: Machine[],
): DashboardMetrics {
  return {
    totalCompost: {
      value: completed.some((batch) => batch.finalWeight == null) ? null : Number(
        completed
          .reduce((sum, batch) => sum + (batch.finalWeight ?? 0), 0)
          .toFixed(2),
      ),
      unit: "kg",
    },
    totalFeedstock: {
      value: Number(
        completed
          .reduce((sum, batch) => sum + batch.totalWeight, 0)
          .toFixed(2),
      ),
      unit: "kg",
    },
    completedBatches: completed.length,
    ongoingBatches: batches.filter((batch) => batch.status === "active").length,
    ownedMachines: machines.filter((machine) => !machine.removedAt).length,
  };
}

export function getRecentCompletedBatches(batches: CompletedBatch[]) {
  return [...batches]
    .sort(
      (a, b) => Date.parse(b.completionDate) - Date.parse(a.completionDate),
    )
    .slice(0, 3);
}
