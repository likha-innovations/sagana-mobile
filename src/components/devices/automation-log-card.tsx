import { View, Text } from 'react-native';
import { type LucideIcon } from 'lucide-react-native';

interface AutomationLogCardProps {
  icon: LucideIcon;
  iconColor?: string;
  message: string;
  timeAgo: string;
}

export function AutomationLogCard({ icon: Icon, iconColor = "#414141", message, timeAgo }: AutomationLogCardProps) {
  return (
    <View className="bg-card rounded-2xl border border-border p-4 px-6 flex-row items-center gap-6 mb-3">
      <Icon size={24} color={iconColor} strokeWidth={1.5} />
      <View className="flex-1">
        <Text className="text-sm font-medium text-foreground leading-5">
          {message} <Text className="text-muted-foreground">{timeAgo}</Text>
        </Text>
      </View>
    </View>
  );
}
