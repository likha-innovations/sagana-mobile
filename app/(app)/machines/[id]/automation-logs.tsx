import { useCallback } from "react";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { createLogger } from "@/lib/logger";
import { AutomationHistoryScreen } from "@/components/history/automation-history-screen";

const logger = createLogger("MachineAutomationLogsScreen");

export default function MachineAutomationLogsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  useFocusEffect(
    useCallback(() => {
      logger.screen("Machine Automation Logs", { id });
    }, [id]),
  );
  return (
    <AutomationHistoryScreen
      key={id}
      scope={{ kind: "machine", machineId: id }}
    />
  );
}
