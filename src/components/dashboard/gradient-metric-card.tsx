import { View } from "react-native";
import { Text } from "@/components/ui/text";

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
    <View
      style={{ borderRadius: 14, flexGrow: 1, backgroundColor: "#718619" }}
      className="justify-end gap-1 px-4 py-3.5"
    >
      <View className="flex-row flex-wrap items-baseline gap-1.5">
        <Text
          className={
            unit
              ? "text-28 font-bold text-primary-foreground"
              : "text-xl font-bold text-primary-foreground"
          }
        >
          {value}
        </Text>
        {unit && (
          <Text className="text-sm font-bold text-primary-foreground">
            {unit}
          </Text>
        )}
      </View>
      <Text className="text-xs font-sans text-primary-foreground">
        {label}
      </Text>
    </View>
  );
}
