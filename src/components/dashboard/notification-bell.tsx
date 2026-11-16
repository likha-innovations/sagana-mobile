import { View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Bell, BellDot } from "lucide-react-native";
import { colors } from "@/constants";
import { useUnreadNotificationsCount } from "@/hooks/use-notifications";

export function NotificationBell() {
  const router = useRouter();
  const { data: unreadCount = 0 } = useUnreadNotificationsCount();
  const hasUnread = unreadCount > 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Notifications${hasUnread ? `, ${unreadCount} unread` : ""}`}
      onPress={() => router.push("/notifications" as any)}
      className="min-h-12 min-w-12 items-center justify-center rounded-full active:opacity-70"
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <View className="relative">
        {hasUnread ? (
          <BellDot size={24} color={colors.semantic.foreground} />
        ) : (
          <Bell size={24} color={colors.semantic.foreground} />
        )}
      </View>
    </Pressable>
  );
}
