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
      value: Number(
        completed
          .reduce((sum, batch) => sum + batch.final_weight, 0)
          .toFixed(2),
      ),
      unit: "kg",
    },
    totalFeedstock: {
      value: Number(
        completed
          .reduce((sum, batch) => sum + batch.total_weight, 0)
          .toFixed(2),
      ),
      unit: "kg",
    },
    completedBatches: completed.length,
    ongoingBatches: batches.filter((batch) => batch.status === "active").length,
    ownedMachines: machines.filter((machine) => !machine.removed_at).length,
  };
}

export function getRecentCompletedBatches(batches: CompletedBatch[]) {
  return [...batches]
    .sort(
      (a, b) => Date.parse(b.completion_date) - Date.parse(a.completion_date),
    )
    .slice(0, 3);
}
