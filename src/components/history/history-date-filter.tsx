import { useRef } from "react";
import { Pressable, Text } from "react-native";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { ChevronDown } from "lucide-react-native";
import { FilterBottomSheet } from "@/components/ui/filter-bottom-sheet";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { colors } from "@/constants";
import type { DateRange } from "@/types/history";

interface Props {
  selected: string;
  options: string[];
  range?: DateRange;
  minDate?: string;
  maxDate?: string;
  onApply: (filter: string, range?: DateRange) => void;
}
export function HistoryDateFilter({
  selected,
  options,
  range,
  minDate,
  maxDate,
  onApply,
}: Props) {
  const filters = useRef<BottomSheetModal>(null);
  const dates = useRef<BottomSheetModal>(null);
  const showDatesAfterDismiss = useRef(false);
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Filter dates: ${selected}`}
        onPress={() => filters.current?.present()}
        className="min-h-12 max-w-full flex-row items-center gap-1"
      >
        <Text className="shrink text-[16px] font-bold text-foreground">
          {selected}
        </Text>
        <ChevronDown size={20} color={colors.semantic.foreground} />
      </Pressable>
      <FilterBottomSheet
        ref={filters}
        selectedFilter={selected}
        options={options}
        onApply={(filter) =>
          onApply(filter, filter === "Custom range" ? range : undefined)
        }
        onSelectFilter={() => {
          showDatesAfterDismiss.current = true;
          filters.current?.dismiss();
        }}
        onDismiss={() => {
          if (showDatesAfterDismiss.current) {
            showDatesAfterDismiss.current = false;
            dates.current?.present();
          }
        }}
      />
      <DateRangePicker
        ref={dates}
        initialStartDate={range?.startDate}
        initialEndDate={range?.endDate}
        minDate={minDate}
        maxDate={maxDate}
        onApply={(next) => onApply("Custom range", next)}
      />
    </>
  );
}
