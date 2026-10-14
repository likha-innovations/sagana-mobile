import { useState } from "react";
import { View, Text, SectionList } from "react-native";
import { format, parseISO } from "date-fns";
import { Fan, ShowerHead, AlertTriangle, Wind } from "lucide-react-native";
import { useHistory } from "@/hooks/use-history";
import { useDynamicLayout } from "@/hooks/use-layout";
import { historyRange, groupHistoryEvents } from "@/lib/history";
import type { DateRange, HistoryScope } from "@/types/history";
import { HistoryHeader } from "@/components/history/history-header";
import { HistoryDateFilter } from "@/components/history/history-date-filter";
import { HistoryState } from "@/components/history/history-state";
import { AutomationLogCard } from "@/components/devices/automation-log-card";
import { colors } from "@/constants";

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
          renderItem={({ item }) => (
            <AutomationLogCard
              icon={
                item.type === "emergency_stop"
                  ? AlertTriangle
                  : item.type.startsWith("sprinkler")
                    ? ShowerHead
                    : item.type === "ventilation_adjust"
                      ? Wind
                      : Fan
              }
              iconColor={colors.semantic.foreground}
              message={item.message}
              timeAgo={format(parseISO(item.created_at), "h:mm a")}
            />
          )}
          ListEmptyComponent={
            <HistoryState message="No automation logs recorded for this period." />
          }
        />
      )}
    </View>
  );
}
