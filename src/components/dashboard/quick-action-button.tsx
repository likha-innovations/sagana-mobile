import type { ReactNode } from "react";
import { View, Text, Pressable } from "react-native";

export interface QuickActionButtonProps {
  label: string;
  icon: ReactNode;
  onPress?: () => void;
}

export function QuickActionButton({
  label,
  icon,
  onPress,
}: QuickActionButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="min-h-[60px] flex-row items-center gap-4 px-4 py-3.5 rounded-[8px] bg-card border border-border active:opacity-80"
    >
      <View>{icon}</View>
      <Text className="flex-1 text-[14px] font-sans text-foreground">
        {label}
      </Text>
    </Pressable>
  );
}
