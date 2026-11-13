import { z } from "zod";
import type { Machine } from "@/types/machine";
import type { CompostBatch } from "@/types/batch";

export const machineOverviewSchema = z.object({
  machineId: z.string(),
  batchId: z.string().nullable(),
  currentWeight: z.number().nonnegative().nullable(),
  recordedAt: z.string().refine((val) => !Number.isNaN(Date.parse(val)), "Invalid date"),
  automations: z.array(
    z.object({
      kind: z.enum(["aeration", "sprinkler"]),
      enabled: z.boolean(),
      until: z.string().min(1),
    }),
  ),
});
export type MachineOverview = z.infer<typeof machineOverviewSchema>;

export function getMachineState(machine: Machine, batch: CompostBatch | null) {
  const occupied =
    batch?.status === "active" && batch.machineId === machine.id;
  return { vacant: !occupied, disconnected: machine.status === "offline" };
}

export function getMachinePhase(temperature: number | undefined, days: number) {
  if (temperature === undefined) return null;
  return temperature >= 45 ? 1 : days > 21 ? 2 : 0;
}

export const machineNameSchema = z
  .string()
  .trim()
  .min(1, "Please enter required field")
  .max(30, "Machine name must be 30 characters or fewer");
export const machineSsidSchema = z
  .string()
  .trim()
  .min(1, "Please enter required field");
