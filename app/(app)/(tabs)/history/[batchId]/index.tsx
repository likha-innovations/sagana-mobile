import { createLogger } from "@/lib/logger";
import { useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { LinearGradient } from "expo-linear-gradient";
import { ChartSpline, ListClock } from "lucide-react-native";
import { useCompletedBatches } from "@/hooks/use-batches";
import { useDynamicLayout } from "@/hooks/use-layout";
import { HistoryHeader } from "@/components/history/history-header";
import { HistoryState } from "@/components/history/history-state";
import { FeedstockGrid } from "@/components/history/feedstock-grid";
import { CompostIcon } from "@/components/icons";
import { colors } from "@/constants";

const logger = createLogger("CompletedBatchScreen");

export default function CompletedBatchScreen() {
  const { batchId } = useLocalSearchParams<{ batchId: string }>();
  useFocusEffect(
    useCallback(() => {
      logger.screen("Completed Batch", { batchId });
    }, [batchId]),
  );
  const router = useRouter();
  const query = useCompletedBatches();
  const batch = query.data?.find((item) => item.batch_id === batchId);
  const { scrollPaddingBottom } = useDynamicLayout();
  const { width, fontScale } = useWindowDimensions();
  return (
    <View className="flex-1 bg-background">
      <HistoryHeader
        title={
          batch
            ? format(parseISO(batch.completion_date), "MMMM d, yyyy")
            : "Completed Batch"
        }
      />
      {query.isError ? (
        <HistoryState
          message="Could not load this batch."
          retrying={query.isFetching}
          onRetry={() => void query.refetch()}
        />
      ) : query.isPending ? (
        <HistoryState message="Loading batch…" />
      ) : !batch ? (
        <HistoryState message="This completed batch could not be found." />
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: scrollPaddingBottom,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View className="gap-8">
            <View className="gap-3">
              <LinearGradient
                colors={colors.gradient.actionButton.colors}
                locations={colors.gradient.actionButton.locations}
                start={colors.gradient.actionButton.start}
                end={colors.gradient.actionButton.end}
                style={{ borderRadius: 14 }}
                className="flex-row items-center gap-4 px-4 py-3.5"
              >
                <CompostIcon
                  size={24}
                  color={colors.semantic.primaryForeground}
                />
                <Text className="text-[14px] font-bold text-primary-foreground">
                  Batch completed!
                </Text>
              </LinearGradient>
              <View
                className={
                  width < 360 || fontScale > 1.2 ? "gap-3" : "flex-row gap-3"
                }
              >
                {[
                  {
                    value: `${differenceInCalendarDays(parseISO(batch.completion_date), parseISO(batch.start_date))} Days`,
                    label: "Composting duration",
                  },
                  {
                    value: `${batch.final_weight} kg`,
                    label: "Final batch weight",
                  },
                ].map((item) => (
                  <View
                    key={item.label}
                    className="min-h-[97px] flex-1 items-center justify-center gap-1 rounded-[14px] border border-border p-6"
                  >
                    <Text className="text-[20px] font-bold text-foreground">
                      {item.value}
                    </Text>
                    <Text className="text-center text-[12px] font-sans text-foreground">
                      {item.label}
                    </Text>
                  </View>
                ))}
              </View>
              <View className="gap-3 rounded-[14px] border border-border p-6">
                {[
                  ["Batch ID", batch.batch_code],
                  ["Machine used", batch.machine_name],
                  ["Initial feedstock weight", `${batch.total_weight} kg`],
                  [
                    "Started on",
                    format(parseISO(batch.start_date), "MMMM d, yyyy"),
                  ],
                  [
                    "Ended on",
                    format(parseISO(batch.completion_date), "MMMM d, yyyy"),
                  ],
                ].map(([label, value]) => (
                  <View
                    key={label}
                    className="flex-row flex-wrap justify-between gap-x-4 gap-y-1"
                  >
                    <Text className="text-[14px] font-sans text-foreground">
                      {label}
                    </Text>
                    <Text className="shrink text-[14px] font-bold text-foreground">
                      {value}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
            <View className="gap-3">
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  router.push({
                    pathname: "/(app)/(tabs)/history/[batchId]/sensors-history",
                    params: { batchId },
                  })
                }
                className="min-h-[60px] flex-row items-center gap-4 rounded-[8px] border border-input px-4 py-3"
              >
                <ChartSpline size={20} color={colors.semantic.foreground} />
                <Text className="flex-1 text-[14px] font-sans text-foreground">
                  View sensor readings history
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  router.push({
                    pathname: "/(app)/(tabs)/history/[batchId]/automation-logs",
                    params: { batchId },
                  })
                }
                className="min-h-[60px] flex-row items-center gap-4 rounded-[8px] border border-input px-4 py-3"
              >
                <ListClock size={20} color={colors.semantic.foreground} />
                <Text className="flex-1 text-[14px] font-sans text-foreground">
                  View automation logs
                </Text>
              </Pressable>
            </View>
            <View className="gap-4">
              <Text className="text-[16px] font-bold text-foreground">
                Feedstocks
              </Text>
              {batch.feedstocks.length ? (
                <FeedstockGrid feedstocks={batch.feedstocks} />
              ) : (
                <Text className="text-[14px] font-sans text-foreground">
                  No feedstocks recorded for this batch.
                </Text>
              )}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}
