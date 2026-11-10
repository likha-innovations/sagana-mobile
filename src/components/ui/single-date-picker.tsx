import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, View, Text } from "react-native";
import { Calendar, type DateData } from "react-native-calendars";
import { format, parseISO } from "date-fns";
import { colors } from "@/constants";
import { Button } from "./button";

interface SingleDatePickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (date: Date) => void;
  initialDate?: Date;
  minDate?: string;
  maxDate?: string;
}

export function SingleDatePicker({
  visible,
  onClose,
  onSelect,
  initialDate,
  minDate,
  maxDate,
}: SingleDatePickerProps) {
  const initial = initialDate ? format(initialDate, "yyyy-MM-dd") : undefined;
  const [selected, setSelected] = useState<string | undefined>(initial);

  const lower = minDate ? format(parseISO(minDate), "yyyy-MM-dd") : undefined;
  const upper = maxDate
    ? format(parseISO(maxDate), "yyyy-MM-dd")
    : format(new Date(), "yyyy-MM-dd");

  const valid =
    !!selected &&
    (!lower || selected >= lower) &&
    selected <= upper;

  useEffect(() => {
    if (visible && initialDate) {
      setSelected(format(initialDate, "yyyy-MM-dd"));
    }
  }, [visible, initialDate]);

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
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/50 justify-center items-center px-4"
        onPress={onClose}
      >
        <Pressable
          className="w-full max-w-sm rounded-[24px] bg-card p-5 border border-border shadow-lg"
          onPress={(e) => e.stopPropagation()}
        >
          <Text className="mb-3 text-lg font-bold text-foreground">
            Select Date
          </Text>
          <Calendar
            key={visible ? "open" : "closed"}
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
          <View className="mt-4 flex-row justify-end gap-2">
            <Button variant="ghost" size="sm" onPress={onClose}>
              <Text className="text-sm font-sans text-muted-foreground">
                Cancel
              </Text>
            </Button>
            <Button
              disabled={!valid}
              size="sm"
              onPress={() => {
                if (!valid || !selected) return;
                onSelect(parseISO(selected));
                onClose();
              }}
            >
              <Text
                className={
                  valid
                    ? "text-sm font-bold text-primary-foreground"
                    : "text-sm font-bold text-muted-foreground"
                }
              >
                Select
              </Text>
            </Button>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
