import { z } from "zod";
import type { Machine } from "@/types/machine";
import type { CompostBatch } from "@/types/batch";

export const machineOverviewSchema = z.object({
  machine_id: z.string(),
  batch_id: z.string(),
  current_weight: z.number().nonnegative().nullable(),
  recorded_at: z.string().datetime(),
  automations: z.array(
    z.object({
      kind: z.enum(["aeration", "sprinkler"]),
      enabled: z.boolean(),
      until: z.string().min(1),
    }),
  ),
});

export function getMachineState(machine: Machine, batch: CompostBatch | null) {
  const occupied =
    batch?.status === "active" && batch.machine_id === machine.machine_id;
  return { vacant: !occupied, disconnected: machine.status === "offline" };
}

export function getMachinePhase(temperature: number | undefined, days: number) {
  if (temperature === undefined) return null;
  return temperature >= 45 ? 1 : days > 21 ? 2 : 0;
}

export const machineNameSchema = z
  .string()
  .trim()
  .min(1, "Please enter required field");
export const machineSsidSchema = z
  .string()
  .trim()
  .min(1, "Please enter required field");
