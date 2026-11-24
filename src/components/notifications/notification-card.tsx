import { View, Pressable } from "react-native";
import { Text } from "@/components/ui/text";
import {
  AlertTriangle,
  Power,
  Thermometer,
  Timer,
  Bell,
} from "lucide-react-native";
import { colors } from "@/constants";
import { formatTimeAgo } from "@/lib/utils";
import type { NotificationItem } from "@/types/notification";

interface NotificationCardProps {
  notification: NotificationItem;
  onPress?: (notification: NotificationItem) => void;
}

function getNotificationVisuals(
  type: NotificationItem["type"],
  severity: NotificationItem["severity"],
) {
  if (severity === "critical") {
    return {
      Icon: AlertTriangle,
      color: colors.red[500],
      bgColor: colors.red[50],
    };
  }

  switch (type) {
    case "batch":
      return {
        Icon: Timer,
        color: colors.brand[500],
        bgColor: colors.brand[50],
      };
    case "sensor":
      return {
        Icon: Thermometer,
        color: colors.sensors.temperature,
        bgColor: colors.purple[50],
      };
    case "machine":
    case "automation":
      return {
        Icon: Power,
        color: colors.brand[500],
        bgColor: colors.brand[50],
      };
    case "system":
    default:
      return {
        Icon: Bell,
        color: colors.neutral[500],
        bgColor: colors.neutral[100],
      };
  }
}

export function NotificationCard({
  notification,
  onPress,
}: NotificationCardProps) {
  const visuals = getNotificationVisuals(
    notification.type,
    notification.severity,
  );
  const Icon = visuals.Icon;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${notification.title}: ${notification.message}`}
      onPress={() => onPress?.(notification)}
      className="bg-card rounded-card border border-border/40 p-4 px-4 flex-row items-center gap-4 mb-3 active:opacity-75"
    >
      <View
        className="w-10 h-10 rounded-full items-center justify-center"
        style={{ backgroundColor: visuals.bgColor }}
      >
        <Icon size={20} color={visuals.color} strokeWidth={2} />
      </View>
      <View className="flex-1 gap-1">
        <Text className="text-sm font-medium text-foreground leading-5">
          {notification.message}
        </Text>
        <Text className="text-xs text-muted-foreground font-sans">
          {formatTimeAgo(notification.createdAt)}
        </Text>
      </View>
      {!notification.isRead && (
        <View className="w-2.5 h-2.5 rounded-full bg-brand-500 self-center" />
      )}
    </Pressable>
  );
}
