import type { ReactNode } from "react";
import { View, Pressable } from "react-native";
import { Text } from "@/components/ui/text";

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
      className="min-h-15 flex-row items-center gap-4 px-4 py-3.5 rounded-lg bg-card border border-border active:opacity-80"
    >
      <View>{icon}</View>
      <Text className="flex-1 text-sm font-sans text-foreground">
        {label}
      </Text>
    </Pressable>
  );
}
