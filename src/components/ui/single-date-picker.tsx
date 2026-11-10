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
import { format, parseISO } from "date-fns";
import { useDynamicLayout } from "@/hooks/use-layout";
import { colors } from "@/constants";
import { Button } from "./button";

interface SingleDatePickerProps {
  onSelect: (date: Date) => void;
  initialDate?: Date;
  minDate?: string;
  maxDate?: string;
}

export const SingleDatePicker = forwardRef<
  BottomSheetModal,
  SingleDatePickerProps
>(({ onSelect, initialDate, minDate, maxDate }, ref) => {
  const modal = useRef<BottomSheetModal>(null);
  const initial = initialDate ? format(initialDate, "yyyy-MM-dd") : undefined;
  const [selected, setSelected] = useState<string | undefined>(initial);
  const [open, setOpen] = useState(false);
  const { stackScrollPadding, headerPaddingTop } = useDynamicLayout();
  const { height } = useWindowDimensions();

  const lower = minDate ? format(parseISO(minDate), "yyyy-MM-dd") : undefined;
  const upper = maxDate
    ? format(parseISO(maxDate), "yyyy-MM-dd")
    : format(new Date(), "yyyy-MM-dd");

  const valid =
    !!selected &&
    (!lower || selected >= lower) &&
    selected <= upper;

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
    if (!selected) return {};
    return {
      [selected]: {
        selected: true,
        selectedColor: colors.brand[500],
        selectedTextColor: colors.semantic.primaryForeground,
      },
    };
  }, [selected]);

  const selectDay = (day: DateData) => {
    if ((lower && day.dateString < lower) || day.dateString > upper) return;
    setSelected(day.dateString);
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
        if (index >= 0 && initialDate) {
          setSelected(format(initialDate, "yyyy-MM-dd"));
        }
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
          Select Date
        </Text>
        <Calendar
          key={open ? "open" : "closed"}
          current={selected ?? lower ?? format(new Date(), "yyyy-MM-dd")}
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
              if (!valid || !selected) return;
              onSelect(parseISO(selected));
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
              Select Date
            </Text>
          </Button>
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});
SingleDatePicker.displayName = "SingleDatePicker";
