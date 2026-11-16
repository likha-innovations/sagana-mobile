import { useCallback } from "react";
import {
  View,
  Text,
  SectionList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { HistoryHeader } from "@/components/history/history-header";
import { EmptyState } from "@/components/ui/empty-state";
import { NotificationCard } from "@/components/notifications/notification-card";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  groupNotificationsByDate,
} from "@/hooks/use-notifications";
import { useDynamicLayout } from "@/hooks/use-layout";
import { colors } from "@/constants";
import { createLogger } from "@/lib/logger";
import type { NotificationItem } from "@/types/notification";

const logger = createLogger("NotificationsScreen");

export default function NotificationsScreen() {
  const router = useRouter();
  const { scrollPaddingBottom } = useDynamicLayout();
  const notificationsQuery = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  useFocusEffect(
    useCallback(() => {
      logger.screen("Notifications");
      void notificationsQuery.refetch();
    // Stable refetch
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [notificationsQuery.refetch]),
  );

  const notifications = notificationsQuery.data ?? [];
  const sections = groupNotificationsByDate(notifications);
  const hasUnread = notifications.some((n) => !n.isRead);

  const handlePressNotification = (item: NotificationItem) => {
    if (!item.isRead) {
      markRead.mutate(item.id);
    }

    if (item.metadata?.route && typeof item.metadata.route === "string") {
      router.push(item.metadata.route as any);
    } else if (item.batchId) {
      router.push(`/history/${item.batchId}` as any);
    } else if (item.machineId) {
      router.push(`/machines/${item.machineId}` as any);
    }
  };

  const markAllAction =
    hasUnread && notifications.length > 0 ? (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Mark all notifications as read"
        onPress={() => markAllRead.mutate()}
        className="min-h-12 justify-center active:opacity-70"
      >
        <Text className="text-[14px] font-bold text-brand-500">
          Mark all as read
        </Text>
      </Pressable>
    ) : null;

  return (
    <View className="flex-1 bg-background">
      <HistoryHeader title="Notifications" back={true} action={markAllAction} />

      {notificationsQuery.isPending && notifications.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.brand[500]} />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 16,
            paddingBottom: scrollPaddingBottom + 24,
          }}
          refreshControl={
            <RefreshControl
              refreshing={notificationsQuery.isRefetching}
              onRefresh={() => void notificationsQuery.refetch()}
              tintColor={colors.brand[500]}
              colors={[colors.brand[500]]}
            />
          }
          ListEmptyComponent={
            <View
              className="flex-1 items-center justify-center px-4"
              style={{ paddingBottom: scrollPaddingBottom }}
            >
              <EmptyState message="You have no notifications yet." />
            </View>
          }
          renderSectionHeader={({ section }) => (
            <Text className="mb-3 mt-4 text-[16px] font-bold text-foreground">
              {section.title}
            </Text>
          )}
          renderItem={({ item }) => (
            <NotificationCard
              notification={item}
              onPress={handlePressNotification}
            />
          )}
        />
      )}
    </View>
  );
}
