import type { ReactNode } from "react";
import { Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "@/constants";

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
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      accessibilityRole="button"
    >
      <LinearGradient
        colors={colors.gradient.actionButton.colors}
        locations={colors.gradient.actionButton.locations}
        start={colors.gradient.actionButton.start}
        end={colors.gradient.actionButton.end}
        style={{ borderRadius: 8 }}
        className="min-h-[60px] flex-row items-center gap-4 px-4 py-3.5"
      >
        {icon}
        <Text className="flex-1 text-[14px] font-sans text-primary-foreground">
          {label}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}
