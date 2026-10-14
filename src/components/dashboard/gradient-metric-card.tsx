import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "@/constants";

export interface GradientMetricCardProps {
  value: string | number;
  unit?: string;
  label: string;
}

export function GradientMetricCard({
  value,
  unit,
  label,
}: GradientMetricCardProps) {
  return (
    <LinearGradient
      colors={colors.gradient.statCard.colors}
      locations={colors.gradient.statCard.locations}
      start={colors.gradient.statCard.start}
      end={colors.gradient.statCard.end}
      style={{ borderRadius: 14, flexGrow: 1 }}
      className="justify-end gap-1 px-4 py-3.5"
    >
      <View className="flex-row flex-wrap items-baseline gap-1.5">
        <Text
          className={
            unit
              ? "text-[28px] font-bold text-primary-foreground"
              : "text-[20px] font-bold text-primary-foreground"
          }
        >
          {value}
        </Text>
        {unit && (
          <Text className="text-[14px] font-bold text-primary-foreground">
            {unit}
          </Text>
        )}
      </View>
      <Text className="text-[12px] font-sans text-primary-foreground">
        {label}
      </Text>
    </LinearGradient>
  );
}
