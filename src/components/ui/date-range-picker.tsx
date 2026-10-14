import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { BackHandler, Text, View, useWindowDimensions } from "react-native";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { Calendar, type DateData } from "react-native-calendars";
import { addDays, format, parseISO } from "date-fns";
import { useDynamicLayout } from "@/hooks/use-layout";
import { colors } from "@/constants";
import { nextRangeSelection } from "@/lib/history";
import type { DateRange } from "@/types/history";
import { Button } from "./button";

interface DateRangePickerProps {
  onApply: (range: DateRange) => void;
  initialStartDate?: string;
  initialEndDate?: string;
  minDate?: string;
  maxDate?: string;
}
export const DateRangePicker = forwardRef<
  BottomSheetModal,
  DateRangePickerProps
>(({ onApply, initialStartDate, initialEndDate, minDate, maxDate }, ref) => {
  const modal = useRef<BottomSheetModal>(null);
  const applied = useRef({
    startDate: initialStartDate ?? null,
    endDate: initialEndDate ?? null,
  });
  const [selection, setSelection] = useState(applied.current);
  const [open, setOpen] = useState(false);
  const { startDate, endDate } = selection;
  const { stackScrollPadding, headerPaddingTop } = useDynamicLayout();
  const { height } = useWindowDimensions();
  const lower = minDate ? format(parseISO(minDate), "yyyy-MM-dd") : undefined;
  const upper = maxDate
    ? format(parseISO(maxDate), "yyyy-MM-dd")
    : format(new Date(), "yyyy-MM-dd");
  const valid =
    !!startDate &&
    !!endDate &&
    (!lower || startDate >= lower) &&
    endDate <= upper;
  useEffect(() => {
    if (!open) return;
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        modal.current?.dismiss();
        return true;
      },
    );
    return () => subscription.remove();
  }, [open]);
  const backdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior="close"
        opacity={0.4}
      />
    ),
    [],
  );
  const markedDates = useMemo(() => {
    const marks: Record<
      string,
      {
        startingDay?: boolean;
        endingDay?: boolean;
        color: string;
        textColor: string;
      }
    > = {};
    if (!startDate) return marks;
    const last = endDate ?? startDate;
    for (
      let cursor = parseISO(startDate);
      format(cursor, "yyyy-MM-dd") <= last;
      cursor = addDays(cursor, 1)
    ) {
      const date = format(cursor, "yyyy-MM-dd");
      const edge = date === startDate || date === last;
      marks[date] = {
        startingDay: date === startDate,
        endingDay: date === last,
        color: edge ? colors.brand[500] : colors.brand[100],
        textColor: edge
          ? colors.semantic.primaryForeground
          : colors.semantic.foreground,
      };
    }
    return marks;
  }, [startDate, endDate]);
  const selectDay = (day: DateData) => {
    if ((lower && day.dateString < lower) || day.dateString > upper) return;
    setSelection((current) => nextRangeSelection(current, day.dateString));
  };
  return (
    <BottomSheetModal
      ref={(value) => {
        modal.current = value;
        if (typeof ref === "function") ref(value);
        else if (ref) ref.current = value;
      }}
      enableDynamicSizing
      maxDynamicContentSize={height - headerPaddingTop}
      onChange={(index) => {
        setOpen(index >= 0);
        if (index >= 0)
          setSelection({
            startDate: initialStartDate ?? applied.current.startDate,
            endDate: initialEndDate ?? applied.current.endDate,
          });
      }}
      onDismiss={() => setOpen(false)}
      backdropComponent={backdrop}
      enablePanDownToClose
      backgroundStyle={{
        backgroundColor: colors.semantic.background,
        borderRadius: 32,
      }}
      handleIndicatorStyle={{ backgroundColor: colors.gray.border, width: 40 }}
    >
      <BottomSheetScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: stackScrollPadding,
        }}
      >
        <Text className="mb-4 text-lg font-bold text-foreground">
          Select Date Range
        </Text>
        <Calendar
          key={open ? "open" : "closed"}
          current={initialStartDate ?? applied.current.startDate ?? lower}
          markingType="period"
          markedDates={markedDates}
          onDayPress={selectDay}
          minDate={lower}
          maxDate={upper}
          theme={{
            calendarBackground: colors.semantic.background,
            textSectionTitleColor: colors.gray.textIcon,
            selectedDayBackgroundColor: colors.brand[500],
            selectedDayTextColor: colors.semantic.primaryForeground,
            todayTextColor: colors.brand[500],
            dayTextColor: colors.semantic.foreground,
            textDisabledColor: colors.gray.textIcon,
            arrowColor: colors.semantic.foreground,
            monthTextColor: colors.semantic.foreground,
            textDayFontFamily: "SpotifyMix-Regular",
            textMonthFontFamily: "SpotifyMix-Bold",
            textDayHeaderFontFamily: "SpotifyMix-Regular",
            textDayFontSize: 14,
            textMonthFontSize: 16,
            textDayHeaderFontSize: 13,
          }}
        />
        <View className="mt-4">
          <Button
            disabled={!valid}
            size="lg"
            onPress={() => {
              if (!valid || !startDate || !endDate) return;
              applied.current = { startDate, endDate };
              onApply({ startDate, endDate });
              modal.current?.dismiss();
            }}
          >
            <Text
              className={
                valid
                  ? "text-[14px] font-bold text-primary-foreground"
                  : "text-[14px] font-bold text-muted-foreground"
              }
            >
              Apply range
            </Text>
          </Button>
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});
DateRangePicker.displayName = "DateRangePicker";
