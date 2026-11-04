import { api } from "./client";
import { compostBatchSchema, completedBatchSchema, type CreateBatchInput } from "@/types/batch";
import { historyReadingSchema, type HistoryScope } from "@/types/history";
import { z } from "zod";

const pageSchema = z.object({ readings: historyReadingSchema.array(), hasMore: z.boolean() });

export const batchApi = {
  list: async () => compostBatchSchema.array().parse(await api.get<unknown>("/batches")),
  completed: async () => {
    const batches = await api.get<unknown[]>("/batches");
    return completedBatchSchema.array().parse(batches.filter((item) =>
      typeof item === "object" && item !== null && "status" in item && item.status === "completed" && "completionDate" in item && item.completionDate != null,
    ));
  },
  create: async (input: CreateBatchInput) => compostBatchSchema.parse(await api.post<unknown>("/batches", input)),
  finish: async (id: string) => completedBatchSchema.parse(await api.post<unknown>(`/batches/${encodeURIComponent(id)}/finish`, {})),
  readings: async (scope: HistoryScope, startDate: string, endDate: string, signal?: AbortSignal) => {
    const path = scope.kind === "machine" ? `/machines/${encodeURIComponent(scope.machineId)}/readings` : `/batches/${encodeURIComponent(scope.batchId)}/readings`;
    const readings: z.infer<typeof historyReadingSchema>[] = [];
    let offset = 0;
    let hasMore = true;
    while (hasMore) {
      const page = pageSchema.parse(await api.get<unknown>(`${path}?offset=${offset}&limit=2000&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`, { signal }));
      readings.push(...page.readings);
      offset += page.readings.length;
      if (page.hasMore && !page.readings.length) throw new Error("Invalid history page");
      hasMore = page.hasMore;
    }
    return readings.sort((a, b) => Date.parse(a.recordedAt) - Date.parse(b.recordedAt));
  },
};
