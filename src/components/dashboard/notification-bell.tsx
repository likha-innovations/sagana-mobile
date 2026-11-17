import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Bell } from "lucide-react-native";
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
      <View className="relative w-6 h-6 items-center justify-center">
        <Bell size={24} color={colors.semantic.foreground} />
        {hasUnread && (
          <View className="absolute -top-1 -right-1.5 min-w-4.5 h-4.5 px-1 bg-destructive border-[1.5px] border-background rounded-full items-center justify-center z-10">
            <Text className="text-[10px] font-bold text-white text-center leading-none">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}


