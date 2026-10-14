import { useCallback } from "react";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { createLogger } from "@/lib/logger";
import { SensorHistoryScreen } from "@/components/history/sensor-history-screen";

const logger = createLogger("BatchSensorsScreen");

export default function BatchSensorsScreen() {
  const { batchId } = useLocalSearchParams<{ batchId: string }>();
  useFocusEffect(
    useCallback(() => {
      logger.screen("Batch Sensor History", { batchId });
    }, [batchId]),
  );
  return (
    <SensorHistoryScreen
      key={batchId}
      scope={{ kind: "batch", batchId: batchId }}
    />
  );
}
