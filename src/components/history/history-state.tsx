import { View, Text, Pressable } from "react-native";
import { CircleAlert } from "lucide-react-native";
import { colors } from "@/constants";

export function HistoryState({
  message,
  onRetry,
  retrying = false,
}: {
  message: string;
  onRetry?: () => void;
  retrying?: boolean;
}) {
  return (
    <View
      className={
        onRetry
          ? "gap-3 rounded-[14px] border border-brand-200 bg-brand-50 px-5 py-5"
          : "gap-2 px-4 py-6"
      }
    >
      <View className="flex-row items-start gap-3">
        {onRetry && <CircleAlert size={20} color={colors.brand[700]} />}
        <View className="flex-1 gap-1">
          <Text
            accessibilityLiveRegion="polite"
            className="text-[14px] font-bold text-foreground"
          >
            {message}
          </Text>
          {onRetry && (
            <Text className="text-sm font-sans text-foreground">
              Check your connection and try again.
            </Text>
          )}
        </View>
      </View>
      {onRetry && (
        <Pressable
          accessibilityRole="button"
          disabled={retrying}
          accessibilityState={{ disabled: retrying }}
          onPress={onRetry}
          className="min-h-12 self-start justify-center rounded-lg bg-brand-700 px-5"
        >
          <Text className="text-[14px] font-bold text-primary-foreground">
            {retrying ? "Retrying…" : "Retry"}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
