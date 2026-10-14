import { useCallback } from "react";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { createLogger } from "@/lib/logger";
import { SensorHistoryScreen } from "@/components/history/sensor-history-screen";

const logger = createLogger("MachineSensorsScreen");

export default function MachineSensorsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  useFocusEffect(
    useCallback(() => {
      logger.screen("Machine Sensor History", { id });
    }, [id]),
  );
  return (
    <SensorHistoryScreen key={id} scope={{ kind: "machine", machineId: id }} />
  );
}
