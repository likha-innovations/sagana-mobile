import { View, Text } from 'react-native';
import { type LucideIcon } from 'lucide-react-native';

interface SensorStatCardProps {
  icon: LucideIcon;
  iconColor: string;
  value: string;
  label: string;
}

export function SensorStatCard({ icon: Icon, iconColor, value, label }: SensorStatCardProps) {
  return (
    <View className="w-[48%] bg-card rounded-2xl border border-border py-5 items-center justify-center">
      <Icon size={22} color={iconColor} strokeWidth={1.5} className="mb-2" />
      <Text className="text-xl font-bold mb-0.5" style={{ color: iconColor }}>{value}</Text>
      <Text className="text-[11px] font-medium text-foreground">{label}</Text>
    </View>
  );
}
