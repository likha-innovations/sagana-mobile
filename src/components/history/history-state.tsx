import { View, Text, Pressable } from "react-native";

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
    <View className="gap-2 px-4 py-6">
      <Text
        accessibilityLiveRegion="polite"
        className="text-[14px] font-sans text-foreground"
      >
        {message}
      </Text>
      {onRetry && (
        <Pressable
          accessibilityRole="button"
          disabled={retrying}
          accessibilityState={{ disabled: retrying }}
          onPress={onRetry}
          className="min-h-12 justify-center"
        >
          <Text className="text-[14px] font-bold text-primary">
            {retrying ? "Retrying…" : "Retry"}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
