import { useState } from "react";
import { View, Text, SectionList } from "react-native";
import { format, parseISO } from "date-fns";
import { Fan, ShowerHead, AlertTriangle, Wind } from "lucide-react-native";
import { useHistory } from "@/hooks/use-history";
import { useDynamicLayout } from "@/hooks/use-layout";
import { historyRange, groupHistoryEvents } from "@/lib/history";
import { formatTimeAgo } from "@/lib/utils";
import type { DateRange, HistoryScope, HistoryEvent } from "@/types/history";
import type { Href } from "expo-router";
import { HistoryHeader } from "@/components/history/history-header";
import { HistoryDateFilter } from "@/components/history/history-date-filter";
import { HistoryState } from "@/components/history/history-state";
import { EmptyState } from "@/components/ui/empty-state";
import { AutomationLogCard } from "@/components/devices/automation-log-card";
import { colors } from "@/constants";

function getLogVisuals(type: HistoryEvent["type"], message?: string) {
  const isSprinkler =
    type.startsWith("sprinkler") ||
    type.startsWith("moisture") ||
    (message ? message.toLowerCase().includes("sprinkler") : false);

  if (
    type === "emergency_stop" ||
    type === "e_stop" ||
    type === "estop_activated"
  ) {
    return {
      icon: isSprinkler ? ShowerHead : Fan,
      color: colors.semantic.destructive,
    };
  }
  if (
    type === "sprinkler_on" ||
    type === "moisture_dosing_start" ||
    type === "sprinkler_pulse_on"
  ) {
    return { icon: ShowerHead, color: colors.brand[500] };
  }
  if (
    type === "sprinkler_off" ||
    type === "moisture_recovery_reached" ||
    type === "sprinkler_pulse_rest"
  ) {
    return { icon: ShowerHead, color: colors.gray.textIcon };
  }
  if (type === "blower_on" || type === "blower_cycle_on") {
    return { icon: Fan, color: colors.brand[500] };
  }
  if (type === "blower_off" || type === "blower_cycle_rest") {
    return { icon: Fan, color: colors.gray.textIcon };
  }
  return {
    icon: isSprinkler ? ShowerHead : Fan,
    color: colors.semantic.foreground,
  };
}

export function AutomationHistoryScreen({ scope }: { scope: HistoryScope }) {
  const query = useHistory(scope);
  const { scrollPaddingBottom } = useDynamicLayout();
  const [filter, setFilter] = useState("All time");
  const [range, setRange] = useState<DateRange>();
  const sections = groupHistoryEvents(query.logs, historyRange(filter, range));
  return (
    <View className="flex-1 bg-background">
      <HistoryHeader
        title="Automation Logs"
        fallbackHref={
          (scope.kind === "machine"
            ? `/machines/${scope.machineId}`
            : `/history/${scope.batchId}`) as Href
        }
        action={
          query.exists && (
            <HistoryDateFilter
              selected={filter}
              range={range}
              options={
                scope.kind === "machine"
                  ? ["All time", "Today", "Last 7 days", "Last 31 days"]
                  : ["All time"]
              }
              minDate={query.startDate}
              maxDate={query.endDate}
              onApply={(next, dates) => {
                setFilter(next);
                setRange(dates);
              }}
            />
          )
        }
      />
      {query.isError ? (
        <HistoryState
          message="Could not load automation logs."
          retrying={query.isFetching}
          onRetry={() => void query.refetch()}
        />
      ) : query.isPending ? (
        <HistoryState message="Loading automation logs…" />
      ) : !query.exists ? (
        <HistoryState
          message={
            scope.kind === "batch"
              ? "This completed batch could not be found."
              : "This machine could not be found."
          }
        />
      ) : sections.length === 0 ? (
        <View
          className="flex-1 items-center justify-center px-4"
          style={{ paddingBottom: scrollPaddingBottom }}
        >
          <EmptyState
            message={
              query.logs.length === 0
                ? "You have no logs yet."
                : "No automation logs recorded for this period."
            }
          />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: scrollPaddingBottom,
          }}
          renderSectionHeader={({ section }) => (
            <Text className="mb-4 text-[16px] font-bold text-foreground">
              {section.title}
            </Text>
          )}
          renderSectionFooter={() => <View className="h-5" />}
          renderItem={({ item }) => {
            const visuals = getLogVisuals(item.type, item.message);
            return (
              <AutomationLogCard
                icon={visuals.icon}
                iconColor={visuals.color}
                message={item.message}
                timeAgo={formatTimeAgo(item.createdAt)}
              />
            );
          }}
        />
      )}
    </View>
  );
}
