import { useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  useWindowDimensions,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Box } from "lucide-react-native";
import { colors } from "@/constants";
import { useDynamicLayout } from "@/hooks";
import { useMachines } from "@/hooks/use-machines";
import { useCompostBatches } from "@/hooks/use-batches";
import { MachineCard } from "@/components/devices/machine-card";
import { MachineSkeletons } from "@/components/devices/machine-skeletons";
import { QuickActionButton } from "@/components/dashboard";
import { HistoryState } from "@/components/history/history-state";
import { createLogger } from "@/lib/logger";

const logger = createLogger("MachinesScreen");
export default function MachinesListScreen() {
  const { headerPaddingTop, scrollPaddingBottom } = useDynamicLayout();
  const { width, fontScale } = useWindowDimensions();
  const router = useRouter();
  const machines = useMachines();
  const batches = useCompostBatches();
  useFocusEffect(
    useCallback(() => {
      logger.screen("Machines");
    }, []),
  );
  const refreshing = machines.isRefetching || batches.isRefetching;
  const refetch = () => {
    void Promise.all([machines.refetch(), batches.refetch()]);
  };
  const failed = machines.isError || batches.isError;
  return (
    <View className="flex-1 bg-background">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: Math.max(headerPaddingTop, 48),
          paddingBottom: scrollPaddingBottom,
          gap: 32,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refetch}
            tintColor={colors.brand[500]}
          />
        }
      >
        <Text className="text-[32px] font-bold text-foreground">Machines</Text>
        {failed && (
          <HistoryState
            message="Could not load machines."
            onRetry={refetch}
            retrying={refreshing}
          />
        )}
        {machines.isPending || batches.isPending ? (
          <MachineSkeletons stacked={width < 360 || fontScale > 1.2} />
        ) : (
          machines.data &&
          batches.data &&
          (machines.data.length === 0 ? (
            <QuickActionButton
              label="Add new SAGANA Machine"
              icon={<Box size={20} color={colors.semantic.primaryForeground} />}
              onPress={() => router.push("/(app)/machine-registration/new")}
            />
          ) : (
            <View className="gap-3">
              {machines.data.map((machine) => (
                <MachineCard
                  key={machine.machine_id}
                  machine={machine}
                  activeBatch={
                    batches.data.find(
                      (batch) =>
                        batch.machine_id === machine.machine_id &&
                        batch.status === "active",
                    ) ?? null
                  }
                  onPress={() =>
                    router.push({
                      pathname: "/(app)/(tabs)/machines/[id]",
                      params: { id: machine.machine_id },
                    })
                  }
                />
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
