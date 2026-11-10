import { View, Text, Pressable } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { colors } from "@/constants";

interface DateFilterToggleProps {
  label: string;
  onPrev?: () => void;
  onNext?: () => void;
  previousDisabled?: boolean;
  nextDisabled?: boolean;
  prominent?: boolean;
  onPressLabel?: () => void;
}
export function DateFilterToggle({
  label,
  onPrev,
  onNext,
  previousDisabled = false,
  nextDisabled = false,
  prominent = false,
  onPressLabel,
}: DateFilterToggleProps) {
  const color = prominent
    ? colors.semantic.primaryForeground
    : colors.semantic.foreground;
  return (
    <View
      className={
        prominent
          ? "w-full flex-row justify-between items-center rounded-t-[14px] bg-primary px-2 py-1"
          : "flex-row items-center rounded-full border border-border bg-card px-2 py-1 shadow-md"
      }
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Previous period"
        accessibilityState={{ disabled: previousDisabled }}
        disabled={previousDisabled}
        onPress={onPrev}
        className="min-h-12 min-w-12 items-center justify-center"
      >
        <ChevronLeft
          size={24}
          color={color}
          opacity={previousDisabled ? 0.35 : 1}
        />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Selected date: ${label}`}
        disabled={!onPressLabel}
        onPress={onPressLabel}
        className="shrink flex-1 items-center justify-center py-2"
      >
        <Text
          style={{ color }}
          className="text-center text-[14px] font-sans"
        >
          {label}
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Next period"
        accessibilityState={{ disabled: nextDisabled }}
        disabled={nextDisabled}
        onPress={onNext}
        className="min-h-12 min-w-12 items-center justify-center"
      >
        <ChevronRight
          size={24}
          color={color}
          opacity={nextDisabled ? 0.35 : 1}
        />
      </Pressable>
    </View>
  );
}
