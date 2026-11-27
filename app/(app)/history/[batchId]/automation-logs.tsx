import { useCallback } from "react";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { createLogger } from "@/lib/logger";
import { AutomationHistoryScreen } from "@/components/history/automation-history-screen";

const logger = createLogger("BatchAutomationLogsScreen");

export default function BatchAutomationLogsScreen() {
  const { batchId } = useLocalSearchParams<{ batchId: string }>();
  useFocusEffect(
    useCallback(() => {
      logger.screen("Batch Automation Logs", { batchId });
    }, [batchId]),
  );
  return (
    <AutomationHistoryScreen
      key={batchId}
      scope={{ kind: "batch", batchId: batchId }}
    />
  );
}
