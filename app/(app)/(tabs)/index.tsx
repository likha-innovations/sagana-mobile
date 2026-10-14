import { MachineSkeletons } from "@/components/devices/machine-skeletons";
import {
  MetricSkeletons,
  CompletedBatchSkeletons,
} from "@/components/dashboard/dashboard-skeletons";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { MapPin, Box } from "lucide-react-native";
import { useAuthContext } from "@/context/auth-context";
import { useProfile, useBarangays, useDynamicLayout } from "@/hooks";
import { useMachines } from "@/hooks/use-machines";
import { useCompostBatches, useDashboardMetrics } from "@/hooks/use-batches";
import { CompostIcon } from "@/components/icons";
import { GradientMetricCard, QuickActionButton } from "@/components/dashboard";
import { CompletedBatchCard } from "@/components/dashboard/completed-batch-card";
import { MachineCard } from "@/components/devices/machine-card";
import { colors } from "@/constants";
import { getBarangayName } from "@/lib/utils";

export default function DashboardScreen() {
  const { headerPaddingTop, scrollPaddingBottom } = useDynamicLayout();
  const { width, fontScale } = useWindowDimensions();
  const stackMetrics = width < 360 || fontScale > 1.2;
  const router = useRouter();
  const { user: authUser } = useAuthContext();
  const { data: profileData } = useProfile();
  const { data: barangays = [] } = useBarangays();
  const machines = useMachines();
  const activeBatches = useCompostBatches();
  const dashboard = useDashboardMetrics();
  const user = profileData || authUser;
  const firstName = user?.fullName?.split(" ")[0] || "Operator";
  const metrics = dashboard.data;
  const dashboardMachines = (machines.data ?? [])
    .filter((machine) => !machine.removed_at)
    .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{
          paddingTop: Math.max(headerPaddingTop, 48),
          paddingBottom: scrollPaddingBottom,
        }}
        showsVerticalScrollIndicator={false}
        className="flex-1"
      >
        <View className="gap-8 px-4">
          <View className="gap-2">
            <Text className="text-[20px] font-bold text-foreground">
              Hello, {firstName}!
            </Text>
            <View className="flex-row items-center gap-1.5">
              <MapPin size={16} color={colors.semantic.foreground} />
              <Text className="flex-1 text-[14px] font-sans text-foreground">
                {getBarangayName(user, barangays)}
              </Text>
            </View>
          </View>
          {dashboard.isError ? (
            <View className="gap-2">
              <Text
                accessibilityRole="alert"
                className="text-sm font-sans text-foreground"
              >
                Could not load dashboard data.
              </Text>
              <Pressable
                accessibilityRole="button"
                disabled={dashboard.isFetching}
                onPress={() => void dashboard.refetch()}
                className="min-h-12 justify-center"
              >
                <Text className="text-sm font-bold text-primary">
                  {dashboard.isFetching ? "Retrying…" : "Retry"}
                </Text>
              </Pressable>
            </View>
          ) : dashboard.isPending || !metrics ? (
            <MetricSkeletons stacked={stackMetrics} />
          ) : (
            <View
              className={
                stackMetrics ? "gap-3" : "flex-row items-stretch gap-3"
              }
            >
              <View
                className="gap-3"
                style={stackMetrics ? undefined : { flex: 212 }}
              >
                <GradientMetricCard
                  value={metrics.totalCompost.value}
                  unit={metrics.totalCompost.unit}
                  label="Total compost produced"
                />
                <GradientMetricCard
                  value={metrics.totalFeedstock.value}
                  unit={metrics.totalFeedstock.unit}
                  label="Total feedstock converted"
                />
              </View>
              <View
                className="gap-3"
                style={stackMetrics ? undefined : { flex: 156 }}
              >
                <GradientMetricCard
                  value={metrics.completedBatches}
                  label="Completed batches"
                />
                <GradientMetricCard
                  value={metrics.ongoingBatches}
                  label="Ongoing batches"
                />
                <GradientMetricCard
                  value={metrics.ownedMachines}
                  label="Owned machines"
                />
              </View>
            </View>
          )}
          <View className="gap-4">
            <Text className="text-[16px] font-bold text-foreground">
              Quick Actions
            </Text>
            <View className="gap-3">
              <QuickActionButton
                label="Start new compost batch"
                icon={
                  <CompostIcon
                    size={24}
                    color={colors.semantic.primaryForeground}
                  />
                }
                onPress={() => router.push("/(app)/batch/new")}
              />
              <QuickActionButton
                label="Add new SAGANA Machine"
                icon={
                  <Box size={24} color={colors.semantic.primaryForeground} />
                }
                onPress={() => router.push("/(app)/machine-registration/new")}
              />
            </View>
          </View>
          <View className="gap-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-[16px] font-bold text-foreground">
                Completed Batches
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="View all completed batches"
                className="min-h-12 min-w-12 items-end justify-center"
                onPress={() =>
                  router.navigate({
                    pathname: "/(app)/(tabs)/history",
                    params: { reset: Date.now().toString() },
                  })
                }
              >
                <Text className="text-[14px] font-bold text-primary">
                  View All
                </Text>
              </Pressable>
            </View>
            {dashboard.isError ? (
              <Text className="text-sm font-sans text-foreground">
                Batch history unavailable. Use Retry above.
              </Text>
            ) : dashboard.isPending ? (
              <CompletedBatchSkeletons />
            ) : dashboard.recentCompleted.length ? (
              <View className="gap-3">
                {dashboard.recentCompleted.map((batch) => (
                  <CompletedBatchCard
                    key={batch.batch_id}
                    batch={batch}
                    onPress={() =>
                      router.push({
                        pathname: "/(app)/(tabs)/history/[batchId]",
                        params: { batchId: batch.batch_id },
                      })
                    }
                  />
                ))}
              </View>
            ) : (
              <Text className="text-sm font-sans text-foreground">
                No completed batches yet. Finished batches will appear here.
              </Text>
            )}
          </View>
          <View className="gap-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-[16px] font-bold text-foreground">
                Your Machines
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="View all machines"
                onPress={() => router.push("/(app)/(tabs)/machines")}
                className="min-h-12 min-w-12 items-end justify-center"
              >
                <Text className="text-[14px] font-bold text-primary">
                  View All
                </Text>
              </Pressable>
            </View>
            {machines.isError || activeBatches.isError ? (
              <Text className="text-sm font-sans text-foreground">
                Machines unavailable. Use Retry above.
              </Text>
            ) : machines.isPending || activeBatches.isPending ? (
              <MachineSkeletons stacked={stackMetrics} />
            ) : dashboardMachines.length ? (
              <View className="gap-3">
                {dashboardMachines.map((machine) => (
                  <MachineCard
                    key={machine.machine_id}
                    machine={machine}
                    activeBatch={
                      activeBatches.data?.find(
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
            ) : (
              <Text className="text-sm font-sans text-foreground">
                No machines yet. Use “Add new SAGANA Machine” to get started.
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
