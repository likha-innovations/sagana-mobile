import { useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  useWindowDimensions,
  Pressable,
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
import { EmptyState } from "@/components/ui/empty-state";
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
      // Refetch on every focus so DB-level changes are caught when returning to this tab
      void machines.refetch();
      void batches.refetch();
    // machines.refetch and batches.refetch are stable refs - no infinite loop risk
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [machines.refetch, batches.refetch]),
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
          flexGrow: 1,
          paddingHorizontal: 16,
          paddingTop: Math.max(headerPaddingTop, 48),
          paddingBottom: scrollPaddingBottom,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refetch}
            tintColor={colors.brand[500]}
          />
        }
      >
        <Text className="text-[32px] font-bold text-foreground mb-8">Machines</Text>
        {failed && (
          <HistoryState
            message="Could not load machines."
            onRetry={refetch}
            retrying={refreshing}
          />
        )}
        {!failed && (machines.isPending || batches.isPending) ? (
          <MachineSkeletons stacked={width < 360 || fontScale > 1.2} />
        ) : (
          machines.data &&
          batches.data &&
          (machines.data.length === 0 ? (
            <View className="flex-1 items-center justify-center">
              <EmptyState
                message="You have no machines yet."
                action={
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => router.push("/(app)/machine-registration/new")}
                    className="h-11 px-6 rounded-full border border-primary items-center justify-center active:opacity-85"
                  >
                    <Text className="font-bold text-sm text-primary">
                      Add a new machine
                    </Text>
                  </Pressable>
                }
              />
            </View>
          ) : (
            <View className="gap-3">
              {machines.data.map((machine) => (
                <MachineCard
                  key={machine.id}
                  machine={machine}
                  activeBatch={
                    batches.data?.find(
                      (batch) =>
                        batch.machineId === machine.id &&
                        batch.status === "active",
                    ) ?? null
                  }
                  onPress={() =>
                    router.push({
                      pathname: "/(app)/(tabs)/machines/[id]",
                      params: { id: machine.id },
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
