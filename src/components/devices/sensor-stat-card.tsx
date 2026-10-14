import { View, Text, useWindowDimensions } from "react-native";
import { type LucideIcon } from "lucide-react-native";

interface SensorStatCardProps {
  icon: LucideIcon;
  iconColor: string;
  value: string;
  label: string;
}

export function SensorStatCard({
  icon: Icon,
  iconColor,
  value,
  label,
}: SensorStatCardProps) {
  const { width, fontScale } = useWindowDimensions();
  return (
    <View
      style={{
        width: width < 360 || fontScale > 1.2 ? "100%" : "48%",
        flexGrow: 1,
      }}
      className="min-h-[139px] bg-card rounded-[14px] border border-border py-6 px-3 gap-3 items-center justify-center"
    >
      <Icon size={24} color={iconColor} strokeWidth={1.5} />
      <Text className="text-xl font-bold" style={{ color: iconColor }}>
        {value}
      </Text>
      <Text className="text-xs font-sans text-foreground">{label}</Text>
    </View>
  );
}
