import { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  ChevronLeft,
  Radio,
  RadioOff,
  Settings,
  Clock,
  Thermometer,
  Droplets,
  Wind,
  Cloud,
  Fan,
  ShowerHead,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { format, parseISO } from "date-fns";
import { useMachine, useMachineOverview } from "@/hooks/use-machines";
import { useActiveBatch } from "@/hooks/use-batches";
import { useDynamicLayout } from "@/hooks";
import { colors } from "@/constants";
import { formatTimeAgo } from "@/lib/utils";
import { getMachineState, getMachinePhase } from "@/lib/machine-overview";
import { createLogger } from "@/lib/logger";
import { CompostIcon } from "@/components/icons";
import { FeedstockGrid } from "@/components/history/feedstock-grid";
import { HistoryState } from "@/components/history/history-state";
import { QuickActionButton } from "@/components/dashboard";
import { SensorStatCard } from "@/components/devices/sensor-stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmModal } from "@/components/ui/confirm-modal";

const logger = createLogger("MachineDetailsScreen");

export default function MachineDetailsDashboard() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { headerPaddingTop, scrollPaddingBottom } = useDynamicLayout();
  const { width, fontScale } = useWindowDimensions();
  const stacked = width < 360 || fontScale > 1.2;
  const machineQuery = useMachine(id);
  const batchQuery = useActiveBatch(id);
  const overviewQuery = useMachineOverview(id);
  const [finishVisible, setFinishVisible] = useState(false);
  useFocusEffect(
    useCallback(() => {
      logger.screen("Machine Details", { id });
    }, [id]),
  );
  const machine = machineQuery.data;
  const batch = batchQuery.data ?? null;
  const overview =
    overviewQuery.data?.batch_id === batch?.batch_id
      ? overviewQuery.data
      : null;
  const pending =
    machineQuery.isPending || batchQuery.isPending || overviewQuery.isPending;
  const failed =
    machineQuery.isError || batchQuery.isError || overviewQuery.isError;
  const retrying =
    machineQuery.isFetching ||
    batchQuery.isFetching ||
    overviewQuery.isFetching;
  const retry = () => {
    void Promise.all([
      machineQuery.refetch(),
      batchQuery.refetch(),
      overviewQuery.refetch(),
    ]);
  };
  const state = machine
    ? getMachineState(machine, batch)
    : { vacant: true, disconnected: false };
  const days = batch
    ? Math.max(
        0,
        Math.floor((Date.now() - Date.parse(batch.start_date)) / 86400000),
      )
    : 0;
  const phase = getMachinePhase(machine?.latest_readings?.temperature, days);
  const sensors = [
    {
      key: "temperature" as const,
      label: "Temperature",
      unit: "°C",
      Icon: Thermometer,
      color: colors.sensors.temperature,
    },
    {
      key: "moisture" as const,
      label: "Moisture",
      unit: "%",
      Icon: Droplets,
      color: colors.sensors.moisture,
    },
    {
      key: "oxygen" as const,
      label: "Oxygen",
      unit: "%",
      Icon: Wind,
      color: colors.sensors.oxygen,
    },
    {
      key: "co2" as const,
      label: "Carbon Dioxide",
      unit: "%",
      Icon: Cloud,
      color: colors.sensors.carbonDioxide,
    },
  ];
  return (
    <View className="flex-1 bg-background">
      <View
        className="flex-row items-center gap-2 px-4 pb-8"
        style={{ paddingTop: Math.max(headerPaddingTop, 48) }}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          className="min-h-12 min-w-12 items-center justify-center -ml-3"
        >
          <ChevronLeft size={24} color={colors.semantic.foreground} />
        </Pressable>
        <Text className="flex-1 text-base font-bold text-foreground">
          {machine?.name ?? "Machine"}
        </Text>
        {machine && (
          <>
            <View
              accessible
              accessibilityLabel={
                state.disconnected
                  ? "Machine disconnected"
                  : "Machine connected"
              }
            >
              {state.disconnected ? (
                <RadioOff size={24} color={colors.red[500]} />
              ) : (
                <Radio size={24} color={colors.brand[500]} />
              )}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Machine settings"
              className="min-h-12 min-w-12 items-center justify-center"
              onPress={() =>
                router.push({
                  pathname: "/(app)/(tabs)/machines/[id]/settings",
                  params: { id },
                })
              }
            >
              <Settings size={24} color={colors.semantic.foreground} />
            </Pressable>
          </>
        )}
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: scrollPaddingBottom,
          gap: 32,
        }}
      >
        {failed && (
          <HistoryState
            message={
              machineQuery.error?.message === "Machine not found"
                ? "This machine could not be found."
                : "Could not refresh machine details."
            }
            retrying={retrying}
            onRetry={retry}
          />
        )}
        {pending ? (
          <View
            accessible
            accessibilityRole="progressbar"
            accessibilityState={{ busy: true }}
            accessibilityLabel="Loading machine details"
            className="gap-3"
          >
            <Skeleton className="h-[130px] rounded-[14px]" />
            <View className="flex-row gap-3">
              <Skeleton className="flex-1 h-24 rounded-[14px]" />
              <Skeleton className="flex-1 h-24 rounded-[14px]" />
            </View>
            <Skeleton className="h-40 rounded-[14px]" />
            <Skeleton className="h-48 rounded-[14px]" />
          </View>
        ) : (
          machine &&
          batchQuery.data !== undefined &&
          (state.vacant ? (
            <View className="rounded-[14px] border border-border p-6 gap-5">
              <View className="flex-row items-center gap-3">
                <CompostIcon size={24} color={colors.semantic.foreground} />
                <Text className="flex-1 font-bold text-sm text-foreground">
                  Machine is vacant
                </Text>
              </View>
              {state.disconnected ? (
                <View
                  accessibilityState={{ disabled: true }}
                  className="rounded-lg bg-secondary p-4"
                >
                  <Text className="text-sm font-sans text-foreground">
                    Connect the machine to start a new compost batch.
                  </Text>
                </View>
              ) : (
                <QuickActionButton
                  label="Start new compost batch"
                  icon={
                    <CompostIcon
                      size={24}
                      color={colors.semantic.primaryForeground}
                    />
                  }
                  onPress={() =>
                    router.push({
                      pathname: "/(app)/batch/new",
                      params: { machineId: id },
                    })
                  }
                />
              )}
            </View>
          ) : (
            batch && (
              <>
                <View className="gap-3">
                  <LinearGradient
                    colors={colors.gradient.statCard.colors}
                    start={colors.gradient.statCard.start}
                    end={colors.gradient.statCard.end}
                    style={{
                      borderRadius: 14,
                      opacity: state.disconnected ? 0.55 : 1,
                    }}
                    className="p-6 gap-6"
                  >
                    <View className="flex-row flex-wrap items-center gap-3">
                      <CompostIcon
                        size={24}
                        color={colors.semantic.primaryForeground}
                      />
                      <View className="flex-1 gap-1">
                        <Text className="font-bold text-sm text-primary-foreground">
                          Batch is composting..
                        </Text>
                        <Text className="font-sans text-xs text-primary-foreground">
                          {phase === null
                            ? "Phase unavailable"
                            : [
                                "Mesophilic Phase",
                                "Thermophilic Phase",
                                "Cooling Phase",
                              ][phase]}
                        </Text>
                      </View>
                      <Text className="font-sans text-xs text-primary-foreground">
                        {formatTimeAgo(machine.latest_readings?.updated_at)}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      {[0, 1, 2].map((step) => (
                        <View
                          key={step}
                          className={
                            step < 2
                              ? "flex-1 flex-row items-center"
                              : "flex-row items-center"
                          }
                        >
                          <View
                            className="h-[18px] w-[18px] rounded-full bg-primary-foreground"
                            style={{
                              opacity:
                                phase !== null && step <= phase ? 1 : 0.3,
                            }}
                          />
                          {step < 2 && (
                            <View className="flex-1 h-[2px] bg-primary-foreground opacity-30" />
                          )}
                        </View>
                      ))}
                    </View>
                  </LinearGradient>
                  <View className={stacked ? "gap-3" : "flex-row gap-3"}>
                    {[
                      { value: `${days} Days`, label: "Composting" },
                      {
                        value:
                          overview?.current_weight == null
                            ? "--"
                            : `${overview.current_weight} kg`,
                        label: "Current batch weight",
                      },
                    ].map((stat) => (
                      <View
                        key={stat.label}
                        className="flex-1 rounded-[14px] border border-border p-6 items-center gap-2"
                      >
                        <Text className="text-xl font-bold text-foreground">
                          {stat.value}
                        </Text>
                        <Text className="text-xs font-sans text-center text-foreground">
                          {stat.label}
                        </Text>
                      </View>
                    ))}
                  </View>
                  <View className="rounded-[14px] border border-border p-6 gap-3">
                    {[
                      ["Batch ID", batch.batch_code],
                      ["Machine used", machine.name],
                      ["Initial feedstock weight", `${batch.total_weight} kg`],
                      [
                        "Started on",
                        format(parseISO(batch.start_date), "MMMM d, yyyy"),
                      ],
                    ].map(([label, value]) => (
                      <View
                        key={label}
                        className={
                          stacked ? "gap-1" : "flex-row justify-between gap-4"
                        }
                      >
                        <Text className="flex-1 text-sm font-sans text-foreground">
                          {label}
                        </Text>
                        <Text
                          className={`flex-1 text-sm font-bold text-foreground ${stacked ? "" : "text-right"}`}
                        >
                          {value}
                        </Text>
                      </View>
                    ))}
                  </View>
                  <Pressable
                    disabled={state.disconnected}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: state.disconnected }}
                    onPress={() => setFinishVisible(true)}
                    className="min-h-12 rounded-full bg-secondary px-5 py-3 items-center justify-center"
                  >
                    <Text className="text-sm text-center font-bold text-foreground">
                      Finish and collect compost batch
                    </Text>
                  </Pressable>
                </View>
                <View className="gap-3">
                  <View className="flex-row flex-wrap items-center justify-between gap-2">
                    <Text className="text-base font-bold text-foreground">
                      Live Sensor Readings
                    </Text>
                    <Pressable
                      className="min-h-12 justify-center"
                      accessibilityRole="button"
                      onPress={() =>
                        router.push({
                          pathname:
                            "/(app)/(tabs)/machines/[id]/sensors-history",
                          params: { id },
                        })
                      }
                    >
                      <Text className="font-bold text-sm text-primary">
                        View history
                      </Text>
                    </Pressable>
                  </View>
                  <View
                    className="flex-row flex-wrap gap-3"
                    style={{ opacity: state.disconnected ? 0.55 : 1 }}
                  >
                    {sensors.map(({ key, label, unit, Icon, color }) => (
                      <SensorStatCard
                        key={key}
                        icon={Icon}
                        iconColor={color}
                        label={label}
                        value={
                          machine.latest_readings?.[key] == null
                            ? "--"
                            : `${machine.latest_readings[key]}${unit}`
                        }
                      />
                    ))}
                  </View>
                  <UpdatedAt
                    timestamp={machine.latest_readings?.updated_at}
                    disconnected={state.disconnected}
                  />
                </View>
                <View className="gap-3">
                  <View className="flex-row flex-wrap items-center justify-between gap-2">
                    <Text className="text-base font-bold text-foreground">
                      Automations
                    </Text>
                    <Pressable
                      className="min-h-12 justify-center"
                      accessibilityRole="button"
                      onPress={() =>
                        router.push({
                          pathname:
                            "/(app)/(tabs)/machines/[id]/automation-logs",
                          params: { id },
                        })
                      }
                    >
                      <Text className="font-bold text-sm text-primary">
                        View logs
                      </Text>
                    </Pressable>
                  </View>
                  {overview?.automations.length ? (
                    overview.automations.map((automation) => {
                      const Icon =
                        automation.kind === "aeration" ? Fan : ShowerHead;
                      const color = automation.enabled
                        ? colors.brand[500]
                        : colors.gray.textIcon;
                      return (
                        <View
                          key={automation.kind}
                          style={{ opacity: state.disconnected ? 0.55 : 1 }}
                          className={`rounded-[14px] border border-border p-6 gap-4 ${stacked ? "" : "flex-row items-center justify-between"}`}
                        >
                          <View className="flex-row items-center gap-5">
                            <Icon size={24} color={color} />
                            <View className="gap-1">
                              <Text className="font-bold text-sm text-foreground">
                                {automation.kind === "aeration"
                                  ? "Aeration"
                                  : "Sprinkler"}
                              </Text>
                              <Text
                                className="font-sans text-xs"
                                style={{ color }}
                              >
                                {automation.enabled ? "On" : "Off"}
                              </Text>
                            </View>
                          </View>
                          <View className="gap-1">
                            <Text className="font-sans text-xs text-foreground">
                              {automation.enabled ? "On until" : "Off until"}
                            </Text>
                            <Text
                              className="font-bold text-xl"
                              style={{ color }}
                            >
                              {automation.until}
                            </Text>
                          </View>
                        </View>
                      );
                    })
                  ) : (
                    <Text className="text-sm font-sans text-muted-foreground">
                      Automation status unavailable.
                    </Text>
                  )}
                  <UpdatedAt
                    timestamp={overview?.recorded_at}
                    disconnected={state.disconnected}
                  />
                </View>
                <View className="gap-3">
                  <Text className="text-base font-bold text-foreground">
                    Feedstocks
                  </Text>
                  <FeedstockGrid feedstocks={batch.feedstocks} />
                </View>
              </>
            )
          ))
        )}
      </ScrollView>
      <ConfirmModal
        visible={finishVisible}
        title="Finish Batch"
        description="Are you sure you want to finish the current composting batch? This action cannot be undone."
        confirmText="Finish Batch"
        isDestructive
        onCancel={() => setFinishVisible(false)}
        onConfirm={() => {
          // shortcut: navigation-only mock until the finish mutation exists.
          setFinishVisible(false);
          router.replace("/(app)/(tabs)/machines");
        }}
      />
    </View>
  );
}

function UpdatedAt({
  timestamp,
  disconnected,
}: {
  timestamp?: string;
  disconnected: boolean;
}) {
  const color = disconnected ? colors.red[500] : colors.gray.textIcon;
  return (
    <View className="flex-row items-center justify-center gap-2 py-1">
      <Clock size={18} color={color} />
      <Text className="text-sm font-sans" style={{ color }}>
        {disconnected ? "Disconnected · " : ""}
        {timestamp ? formatTimeAgo(timestamp) : "No recorded update"}
      </Text>
    </View>
  );
}
