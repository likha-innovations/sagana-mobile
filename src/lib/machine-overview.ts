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
      targetEndTime: z.string().nullable().optional(),
      remainingMs: z.number().nullable().optional(),
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

export function formatCountdownSeconds(seconds: number): string {
  if (seconds <= 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs}h ${remMins}m`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
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
