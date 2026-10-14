import { createLogger } from "@/lib/logger";
import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Search } from "lucide-react-native";
import { useCompletedBatches } from "@/hooks/use-batches";
import { useDynamicLayout } from "@/hooks/use-layout";
import { filterCompletedBatches, historyRange } from "@/lib/history";
import type { DateRange } from "@/types/history";
import { colors } from "@/constants";
import { Input } from "@/components/ui/input";
import { CompletedBatchCard } from "@/components/dashboard/completed-batch-card";
import { HistoryHeader } from "@/components/history/history-header";
import { HistoryDateFilter } from "@/components/history/history-date-filter";
import { HistoryState } from "@/components/history/history-state";

const logger = createLogger("HistoryScreen");

export default function HistoryScreen() {
  useFocusEffect(
    useCallback(() => {
      logger.screen("History");
    }, []),
  );
  const router = useRouter();
  const { reset } = useLocalSearchParams<{ reset?: string }>();
  const { scrollPaddingBottom } = useDynamicLayout();
  const query = useCompletedBatches();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All time");
  const [range, setRange] = useState<DateRange>();
  useEffect(() => {
    if (reset) {
      setSearch("");
      setFilter("All time");
      setRange(undefined);
    }
  }, [reset]);
  const batches = filterCompletedBatches(
    query.data ?? [],
    search,
    historyRange(filter, range),
  );
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-background"
    >
      <HistoryHeader
        title="History"
        back={false}
        action={
          <HistoryDateFilter
            selected={filter}
            range={range}
            options={[
              "All time",
              "This month",
              "Last 6 months",
              "Last 12 months",
            ]}
            onApply={(next, dates) => {
              setFilter(next);
              setRange(dates);
            }}
          />
        }
      />
      <FlatList
        data={query.isError || query.isPending ? [] : batches}
        keyExtractor={(batch) => batch.batch_id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: scrollPaddingBottom,
        }}
        ItemSeparatorComponent={() => <View className="h-3" />}
        ListHeaderComponent={
          <View className="gap-8 pb-4">
            <Input
              value={search}
              onChangeText={setSearch}
              accessibilityLabel="Search Batch ID"
              placeholder="Search Batch ID.."
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              containerClassName="mb-0"
              controlClassName="rounded-[14px] border-[1.5px] border-border"
              className="font-sans"
              trailingIcon={<Search size={20} color={colors.gray.textIcon} />}
            />
            <Text className="text-[16px] font-bold text-foreground">
              Completed Batches
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <CompletedBatchCard
            batch={item}
            onPress={() =>
              router.push({
                pathname: "/(app)/(tabs)/history/[batchId]",
                params: { batchId: item.batch_id },
              })
            }
          />
        )}
        ListEmptyComponent={
          query.isError ? (
            <HistoryState
              message="Could not load completed batches."
              retrying={query.isFetching}
              onRetry={() => void query.refetch()}
            />
          ) : (
            <HistoryState
              message={
                query.isPending
                  ? "Loading completed batches…"
                  : query.data?.length
                    ? "No batches match this search or date filter."
                    : "No completed batches yet. Finished batches will appear here."
              }
            />
          )
        }
      />
    </KeyboardAvoidingView>
  );
}
